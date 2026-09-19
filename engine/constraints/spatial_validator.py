"""
Comprehensive Spatial Feasibility Validator
Enforces physical and architectural constraints:
- Room boundary containment
- Fixture footprint collisions (SAT)
- Fixture-to-clearance envelope conflicts
- Door swing obstructions
- Wet/dry zoning compliance
"""

from typing import List, Dict, Any, Optional, Tuple
from backend.models.design import FixturePlacement, SpatialLayout
from engine.geometry.primitives import Rectangle2D, check_sat_collision, check_door_swing_collision
from engine.geometry.clearance import get_clearance_rect
from engine.constraints.zoning import evaluate_zoning


class SpatialValidationResult:
    def __init__(
        self,
        is_feasible: bool,
        violations: List[str],
        warnings: List[str],
        collisions: List[Dict[str, Any]],
        clearance_conflicts: List[Dict[str, Any]],
        door_conflicts: List[Dict[str, Any]],
        usable_area_sq_ft: float,
        usable_ratio: float,
        zoning_report: Dict[str, Any]
    ):
        self.is_feasible = is_feasible
        self.violations = violations
        self.warnings = warnings
        self.collisions = collisions
        self.clearance_conflicts = clearance_conflicts
        self.door_conflicts = door_conflicts
        self.usable_area_sq_ft = usable_area_sq_ft
        self.usable_ratio = usable_ratio
        self.zoning_report = zoning_report

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_feasible": self.is_feasible,
            "violations": self.violations,
            "warnings": self.warnings,
            "collisions": self.collisions,
            "clearance_conflicts": self.clearance_conflicts,
            "door_conflicts": self.door_conflicts,
            "usable_area_sq_ft": round(self.usable_area_sq_ft, 2),
            "usable_ratio": round(self.usable_ratio, 3),
            "zoning_report": self.zoning_report
        }


def validate_spatial_layout(
    layout: SpatialLayout,
    allow_clearance_overlap_with_clearance: bool = True
) -> SpatialValidationResult:
    """
    Validates physical feasibility of a spatial layout.
    """
    room_l = layout.room_length
    room_w = layout.room_width
    room_area = room_l * room_w

    violations: List[str] = []
    warnings: List[str] = []
    collisions: List[Dict[str, Any]] = []
    clearance_conflicts: List[Dict[str, Any]] = []
    door_conflicts: List[Dict[str, Any]] = []

    # Construct Rectangle2D for each fixture
    fixture_rects: List[Tuple[FixturePlacement, Rectangle2D]] = []
    total_fixture_area = 0.0

    for p in layout.placements:
        rect = Rectangle2D(x=p.x, y=p.y, width=p.width, depth=p.depth, rotation=p.rotation)
        fixture_rects.append((p, rect))
        total_fixture_area += p.width * p.depth

        # 1. Boundary Containment Check
        if not rect.is_inside_boundary(room_l, room_w):
            violations.append(
                f"Boundary Violation: {p.category.capitalize()} ({p.product_id}) extends outside the {room_l}x{room_w} ft bathroom boundary."
            )

    # 2. Solid Fixture-to-Fixture Collisions
    n = len(fixture_rects)
    for i in range(n):
        p_a, rect_a = fixture_rects[i]
        for j in range(i + 1, n):
            p_b, rect_b = fixture_rects[j]

            # Exception: faucet mounted directly on vanity/basin
            if (p_a.category == "faucet" and p_b.category in {"basin", "vanity"}) or \
               (p_b.category == "faucet" and p_a.category in {"basin", "vanity"}):
                continue
            # Exception: shower door enclosure co-located with showerhead/valves
            if (p_a.category == "shower" and p_b.category == "shower"):
                continue
            if (p_a.category == "basin" and p_b.category == "vanity") or \
               (p_b.category == "basin" and p_a.category == "vanity"):
                # Vessel basin placed on top of countertop vanity is permissible
                continue
            if (p_a.category in {"accessory", "mirror"} and p_b.category in {"vanity", "basin", "faucet"}) or \
               (p_b.category in {"accessory", "mirror"} and p_a.category in {"vanity", "basin", "faucet"}):
                # Wall-mounted mirror/cabinet above vanity/countertop is permissible
                continue

            if check_sat_collision(rect_a, rect_b):
                col_info = {
                    "fixture_a": p_a.product_id,
                    "category_a": p_a.category,
                    "fixture_b": p_b.product_id,
                    "category_b": p_b.category,
                    "description": f"Physical overlap detected between {p_a.name if hasattr(p_a, 'name') else p_a.product_id} and {p_b.name if hasattr(p_b, 'name') else p_b.product_id}."
                }
                collisions.append(col_info)
                violations.append(
                    f"Physical Collision: {p_a.category.capitalize()} ({p_a.product_id}) overlaps with {p_b.category.capitalize()} ({p_b.product_id})."
                )

    # 3. Clearance Envelope Conflicts with Solid Fixtures
    for p_a, rect_a in fixture_rects:
        if p_a.category in {"accessory", "mirror"}:
            continue
        c_rect = get_clearance_rect(
            category=p_a.category,
            x=p_a.x,
            y=p_a.y,
            width=p_a.width,
            depth=p_a.depth,
            rotation=p_a.rotation
        )
        if not c_rect:
            continue

        for p_b, rect_b in fixture_rects:
            if p_a.product_id == p_b.product_id:
                continue
            if p_b.category in {"faucet", "accessory", "mirror"}:
                continue
            if p_a.category == "faucet" and p_b.category in {"vanity", "basin"}:
                continue

            if check_sat_collision(c_rect, rect_b):
                conflict = {
                    "fixture": p_a.product_id,
                    "obstructed_by": p_b.product_id,
                    "category": p_a.category,
                    "reason": f"Required front clearance of {p_a.category} is obstructed by {p_b.category}."
                }
                clearance_conflicts.append(conflict)
                warnings.append(
                    f"Clearance Obstruction: Front clearance for {p_a.category.capitalize()} ({p_a.product_id}) is obstructed by {p_b.category.capitalize()} ({p_b.product_id})."
                )

    # 4. Door Swing Collision Check
    for door in layout.doors:
        door_x = float(door.get("x", 0.0))
        door_y = float(door.get("y", 0.0))
        door_w = float(door.get("width", 2.5))
        door_swing = int(door.get("swing_angle", 0))

        for p, rect in fixture_rects:
            if check_door_swing_collision(door_x, door_y, door_w, door_swing, rect):
                door_conflicts.append({
                    "door": door.get("id", "entry_door"),
                    "obstructed_by": p.product_id,
                    "category": p.category
                })
                violations.append(
                    f"Door Conflict: {p.category.capitalize()} ({p.product_id}) blocks the bathroom entry door swing path."
                )

    # 5. Zoning Evaluation
    zoning_res = evaluate_zoning(layout.placements, room_l, room_w)
    warnings.extend(zoning_res["warnings"])

    # 6. Usable Space Calculations
    usable_sq_ft = max(0.0, room_area - total_fixture_area)
    usable_ratio = max(0.0, min(1.0, usable_sq_ft / room_area)) if room_area > 0 else 0.0

    is_feasible = (len(violations) == 0)

    return SpatialValidationResult(
        is_feasible=is_feasible,
        violations=violations,
        warnings=warnings,
        collisions=collisions,
        clearance_conflicts=clearance_conflicts,
        door_conflicts=door_conflicts,
        usable_area_sq_ft=usable_sq_ft,
        usable_ratio=usable_ratio,
        zoning_report=zoning_res
    )
