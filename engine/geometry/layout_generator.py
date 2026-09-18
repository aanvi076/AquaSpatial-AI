"""
Deterministic Architectural Layout Generator
Arranges verified Kohler bathroom fixtures along walls following standard architectural conventions:
- Wet Zone: Shower / Bathtub in top-right corner against top and right walls
- Sanitary Zone: Toilet on the right-wall column below the wet zone (with front clearance),
  or bottom-right when the right-wall run is too short
- Vanity Zone: Vanity / Basin top-biased on the left wall (above door swing), facing into room
- Door Safety: Hard constraint keeping fixtures clear of entry door swing area
- Clearance: Standard NKBA front clearance requirements preserved
- Circulation: Central aisle kept open from the entrance between left vanity and right wet/toilet

Design philosophy: Simple, deterministic, correct wall placement. No random repositioning.
No complex optimization scoring. Produces a realistic bathroom layout every time.
"""

from typing import List, Tuple, Optional
from backend.models.product import KohlerProduct
from backend.models.design import SpatialLayout, FixturePlacement


class LayoutGenerator:
    def __init__(self, room_length: float, room_width: float, door_position: str = "bottom_left"):
        self.room_length = float(room_length)
        self.room_width = float(room_width)
        self.door_position = door_position

        # Standard 2.5 ft entry door at bottom-left wall
        # In 2D: x=0 is left wall, y=0 is top wall, y=room_width is bottom wall
        # Door is at the bottom-left: anchor at (0.5, room_width-0.5), swings inward
        self.doors = [
            {
                "id": "entry_door",
                "x": 0.5,
                "y": self.room_width - 0.5,
                "width": 2.5,
                "swing_angle": 270,  # Swings inward along left wall toward top
                "wall": "bottom"
            }
        ]
        self.windows = [
            {
                "id": "vent_window",
                "x": self.room_length / 2.0 - 1.0,
                "y": 0.0,
                "width": 2.0,
                "wall": "top"
            }
        ]

        # Door swing occupies a 2.5x2.5 box from (0.5, room_width-3.0) to (3.0, room_width-0.5)
        # Fixtures must not be placed in this zone
        self._door_x_min = 0.5
        self._door_x_max = 3.0
        self._door_y_min = self.room_width - 3.0
        self._door_y_max = self.room_width  # bottom wall

        # Safe y-limit: fixtures on the left wall cannot extend into y > door_y_min
        self._left_wall_safe_y_max = self.room_width - 3.2  # 3.2ft from bottom = safe

    @staticmethod
    def _get_dim_feet(p: Optional[KohlerProduct], default_w: float = 2.5, default_d: float = 2.0) -> Tuple[float, float]:
        """Returns (width, depth) in feet from the product catalog dimensions."""
        if not p or not p.dimensions:
            return default_w, default_d
        d = p.dimensions.to_feet()
        return float(d.width), float(d.depth)

    def _clamp(self, val: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, val))

    def generate_layout(self, products: List[KohlerProduct]) -> SpatialLayout:
        """
        Generates a clean, wall-aligned bathroom layout:

        PLACEMENT STRATEGY (for 10x8 standard bathroom):
        - Shower/Bathtub: top-right corner against top+right walls, rotation=0 (faces down into room)
        - Toilet: right wall, below shower, rotation=90 (back to right wall, faces left into room)
          OR bottom wall right side, rotation=180 (back to bottom wall, faces up into room)
        - Vanity: left wall, centered safely above door swing zone, rotation=270 (back to left, faces right)
          OR top wall left side, rotation=0 (back to top wall, faces down)
        - Faucets/accessories: mounted on/near vanity, negligible footprint
        """
        if not products:
            return SpatialLayout(
                room_length=self.room_length,
                room_width=self.room_width,
                placements=[],
                doors=self.doors,
                windows=self.windows,
                has_collisions=False,
                usable_area_ratio=1.0
            )

        rL = self.room_length
        rW = self.room_width
        WALL_GAP = 0.1  # gap from wall in feet (fixture back touches wall + small tolerance)

        # Categorize products
        bathtubs = [p for p in products if p.category == "bathtub"]
        showers = [p for p in products if p.category == "shower"]
        vanities = [p for p in products if p.category == "vanity"]
        basins = [p for p in products if p.category == "basin"]
        toilets = [p for p in products if p.category in {"toilet", "smart_toilet"}]
        faucets = [p for p in products if p.category == "faucet"]
        accessories = [p for p in products if p.category == "accessory"]
        others = [p for p in products if p.category not in {
            "bathtub", "shower", "vanity", "basin", "toilet", "smart_toilet", "faucet", "accessory"
        }]

        placements: List[FixturePlacement] = []

        # -------------------------------------------------------
        # 1. WET ZONE: Shower / Bathtub — top-right corner
        # -------------------------------------------------------
        # Shower enclosure minimum 3x3ft; showerhead catalog size forced to min 3x3
        sh_prod = showers[0] if showers else None
        b_prod = bathtubs[0] if bathtubs else None
        v_prod = vanities[0] if vanities else (basins[0] if basins else None)
        t_prod = toilets[0] if toilets else None

        sh_raw_w, sh_raw_d = self._get_dim_feet(sh_prod, 3.0, 3.0)
        # Shower needs minimum 3x3 enclosure; showerheads have tiny catalog dims → force to enclosure
        sw = max(3.0, sh_raw_w) if sh_prod else 0.0
        sd = max(3.0, sh_raw_d) if sh_prod else 0.0
        # Cap to room — leave at least 3.0ft circulation / other fixtures
        sw = min(sw, max(2.5, rL - 3.0))
        sd = min(sd, max(2.5, rW - 2.5))

        bw_raw, bd_raw = self._get_dim_feet(b_prod, 5.0, 2.8)
        # Bathtub: ensure longer dimension is width (along wall), shorter is depth
        bw = max(bw_raw, bd_raw)  # longest dim → along top wall
        bd = min(bw_raw, bd_raw)  # shorter dim → depth into room
        bw = min(bw, max(3.0, rL - 2.5))
        bd = min(bd, max(2.0, rW - 2.5))

        # Track wet-zone AABB for downstream clearance / grouping
        wet_x_min = rL
        wet_y_max = 0.0
        wet_front_clearance = 2.0  # NKBA front access into shower/tub

        if sh_prod and b_prod:
            # Both shower and bathtub: shower in top-right corner, bathtub along top wall to the left
            sh_x = rL - sw - WALL_GAP
            sh_y = WALL_GAP
            placements.append(FixturePlacement(
                product_id=sh_prod.id, category="shower",
                x=sh_x, y=sh_y, width=sw, depth=sd,
                rotation=0, clearance_front=wet_front_clearance, zone="wet"
            ))
            # Bathtub to the left of shower along top wall
            b_x = self._clamp(sh_x - bw - 0.3, WALL_GAP, rL - bw - WALL_GAP)
            b_y = WALL_GAP
            placements.append(FixturePlacement(
                product_id=b_prod.id, category="bathtub",
                x=b_x, y=b_y, width=bw, depth=bd,
                rotation=0, clearance_front=wet_front_clearance, zone="wet"
            ))
            wet_x_min = min(sh_x, b_x)
            wet_y_max = WALL_GAP + max(sd, bd)

        elif sh_prod:
            # Shower only: top-right corner
            sh_x = rL - sw - WALL_GAP
            sh_y = WALL_GAP
            placements.append(FixturePlacement(
                product_id=sh_prod.id, category="shower",
                x=sh_x, y=sh_y, width=sw, depth=sd,
                rotation=0, clearance_front=wet_front_clearance, zone="wet"
            ))
            wet_x_min = sh_x
            wet_y_max = WALL_GAP + sd

        elif b_prod:
            # Bathtub only: top-right / long top wall
            b_x = rL - bw - WALL_GAP
            b_y = WALL_GAP
            placements.append(FixturePlacement(
                product_id=b_prod.id, category="bathtub",
                x=b_x, y=b_y, width=bw, depth=bd,
                rotation=0, clearance_front=wet_front_clearance, zone="wet"
            ))
            wet_x_min = b_x
            wet_y_max = WALL_GAP + bd

        # -------------------------------------------------------
        # 2. TOILET — right wall below wet zone (with front clearance),
        #    OR bottom-right wall if the right wall run is too short.
        # -------------------------------------------------------
        if t_prod:
            tw, td = self._get_dim_feet(t_prod, 1.35, 2.1)
            # Cap depth so toilet remains wall-mounted with standing space in front
            td = min(td, max(1.5, rL * 0.35))

            # Preferred: right wall (rot=90), back against right wall, faces into room.
            # Leave as much wet-zone front clearance as the remaining right-wall run allows.
            right_wall_limit = rW - 0.4
            remaining_right = right_wall_limit - wet_y_max
            min_gap = 0.45
            ideal_gap = wet_front_clearance if wet_y_max > 0 else 0.4

            can_right_wall = (
                remaining_right >= tw + min_gap
                and (rL - td) >= 2.5
            )
            if can_right_wall:
                gap_after_wet = min(ideal_gap, max(min_gap, remaining_right - tw))
                t_y_start = wet_y_max + gap_after_wet
                # If extra run remains after ideal clearance, nudge slightly toward bottom
                # to open mid-room circulation while staying grouped under the wet column.
                t_y_end = t_y_start + tw
                slack = right_wall_limit - t_y_end
                if slack > 0.6 and gap_after_wet >= ideal_gap - 0.05:
                    t_y_start = min(t_y_start + min(slack * 0.35, 1.0), right_wall_limit - tw)
                placements.append(FixturePlacement(
                    product_id=t_prod.id, category=t_prod.category,
                    x=rL, y=t_y_start, width=tw, depth=td,
                    rotation=90, clearance_front=2.0, zone="sanitary"
                ))
            else:
                # Fallback: bottom wall, right side (rot=180), clear of door swing (x≈0.5–3.0)
                # Prefer sitting under / near the wet column rather than an isolated far corner.
                min_left = self._door_x_max + 0.4
                t_x = self._clamp(rL - WALL_GAP, min_left + tw, rL)
                t_y = rW - WALL_GAP
                td_fit = min(td, max(1.4, t_y - wet_y_max - min_gap))
                placements.append(FixturePlacement(
                    product_id=t_prod.id, category=t_prod.category,
                    x=t_x, y=t_y, width=tw, depth=td_fit,
                    rotation=180, clearance_front=2.0, zone="sanitary"
                ))

        # -------------------------------------------------------
        # 3. VANITY — left wall (rot=270), top-biased above door swing
        #    Groups with wet zone across the top; keeps path from door open.
        # -------------------------------------------------------
        vanity_top_y = 0.3  # used to co-locate wall accessories with vanity
        if v_prod:
            vw, vd = self._get_dim_feet(v_prod, 3.0, 1.8)
            # Cap depth so standing clearance remains in the central circulation aisle
            vd = min(vd, max(1.4, rL * 0.28))

            # rot=270: back against left wall, front faces into room
            safe_y_max = self._left_wall_safe_y_max
            v_available_top = 0.4
            v_available_bottom = safe_y_max

            if v_available_bottom - v_available_top >= vw:
                # Top-bias: place vanity near the top of the left wall (coherent with wet zone)
                # rather than floating mid-wall and wasting upper wall run.
                v_anchor_y = v_available_top + vw
                if wet_y_max > 0 and v_anchor_y < wet_y_max:
                    aligned = min(max(wet_y_max, v_available_top + vw), v_available_bottom)
                    if aligned > v_anchor_y:
                        v_anchor_y = min(v_anchor_y + 0.15, aligned)
                v_anchor_y = self._clamp(v_anchor_y, v_available_top + vw, v_available_bottom)
                vanity_top_y = v_anchor_y - vw
                placements.append(FixturePlacement(
                    product_id=v_prod.id, category=v_prod.category,
                    x=WALL_GAP, y=v_anchor_y, width=vw, depth=vd,
                    rotation=270, clearance_front=2.0, zone="vanity"
                ))
                if faucets:
                    placements.append(FixturePlacement(
                        product_id=faucets[0].id, category="faucet",
                        x=WALL_GAP + vd * 0.25, y=v_anchor_y - vw / 2.0, width=0.3, depth=0.3,
                        rotation=270, clearance_front=0.5, zone="vanity"
                    ))
            else:
                # Vanity too long for left-wall run — place on top wall, left of wet zone
                max_right = wet_x_min - 0.4 if wet_x_min < rL else rL - WALL_GAP
                vw_fit = min(vw, max(1.5, max_right - WALL_GAP))
                v_x = WALL_GAP
                if v_x + vw_fit > max_right:
                    v_x = self._clamp(max_right - vw_fit, WALL_GAP, rL - vw_fit - WALL_GAP)
                vanity_top_y = WALL_GAP
                placements.append(FixturePlacement(
                    product_id=v_prod.id, category=v_prod.category,
                    x=v_x, y=WALL_GAP, width=vw_fit, depth=min(vd, max(1.2, wet_y_max if wet_y_max > 0 else vd)),
                    rotation=0, clearance_front=2.0, zone="vanity"
                ))
                if faucets:
                    placements.append(FixturePlacement(
                        product_id=faucets[0].id, category="faucet",
                        x=v_x + vw_fit / 2.0 - 0.15, y=WALL_GAP + 0.25, width=0.3, depth=0.3,
                        rotation=0, clearance_front=0.5, zone="vanity"
                    ))

        # -------------------------------------------------------
        # 4. ACCESSORIES — wall-mounted near vanity zone
        # -------------------------------------------------------
        acc_y_cursor = max(0.3, vanity_top_y)
        for acc in accessories[:2]:
            aw, ad = self._get_dim_feet(acc, 0.6, 0.15)
            aw = min(aw, max(0.4, self._left_wall_safe_y_max - acc_y_cursor - 0.2))
            ad = min(ad, 0.2)  # wall-mounted; very shallow floor footprint
            if aw > 0.1:
                placements.append(FixturePlacement(
                    product_id=acc.id, category="accessory",
                    x=WALL_GAP, y=acc_y_cursor, width=ad, depth=aw,
                    rotation=0, clearance_front=0.5, zone="vanity"
                ))
                acc_y_cursor += aw + 0.3

        # -------------------------------------------------------
        # 5. OTHERS — distribute along bottom wall, right of door
        # -------------------------------------------------------
        x_cursor = 4.0
        for op in others:
            ow, od = self._get_dim_feet(op, 1.0, 0.5)
            ow = min(ow, rL - x_cursor - 0.5)
            if ow > 0.1:
                placements.append(FixturePlacement(
                    product_id=op.id, category=op.category,
                    x=x_cursor, y=rW - od - WALL_GAP, width=ow, depth=od,
                    rotation=0, clearance_front=1.0, zone="general"
                ))
                x_cursor += ow + 0.4

        layout = SpatialLayout(
            room_length=rL,
            room_width=rW,
            placements=placements,
            doors=self.doors,
            windows=self.windows,
            has_collisions=False,
            usable_area_ratio=1.0
        )

        # Basic boundary & collision check (inline, no import cycle)
        from engine.geometry.primitives import Rectangle2D, check_sat_collision, check_door_swing_collision
        has_violation = False
        fixture_rects = []
        for p in placements:
            rect = Rectangle2D(x=p.x, y=p.y, width=p.width, depth=p.depth, rotation=p.rotation)
            if not rect.is_inside_boundary(rL, rW):
                has_violation = True
            fixture_rects.append((p, rect))

        # Check solid collisions
        n = len(fixture_rects)
        for i in range(n):
            pa, ra = fixture_rects[i]
            for j in range(i + 1, n):
                pb, rb = fixture_rects[j]
                # Skip faucet-on-vanity overlaps (mounted on countertop)
                if (pa.category == "faucet" and pb.category in {"vanity", "basin"}) or \
                   (pb.category == "faucet" and pa.category in {"vanity", "basin"}):
                    continue
                if check_sat_collision(ra, rb):
                    has_violation = True

        # Check door swing
        for door in self.doors:
            for p, rect in fixture_rects:
                if check_door_swing_collision(
                    float(door["x"]), float(door["y"]),
                    float(door["width"]), int(door["swing_angle"]), rect
                ):
                    has_violation = True

        layout.has_collisions = has_violation
        total_fixture_area = sum(p.width * p.depth for p in placements)
        room_area = rL * rW
        layout.usable_area_ratio = max(0.0, (room_area - total_fixture_area) / room_area)

        return layout
