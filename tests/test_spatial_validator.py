"""
Unit tests for spatial validator and layout generator
"""

import unittest
from backend.models.design import SpatialLayout, FixturePlacement
from backend.services.catalog_service import CatalogService
from engine.constraints.spatial_validator import validate_spatial_layout
from engine.geometry.layout_generator import LayoutGenerator


class TestSpatialValidator(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()

    def test_valid_layout_feasibility(self):
        # 10x8 ft bathroom with separated toilet, vanity, and shower
        layout = SpatialLayout(
            room_length=10.0,
            room_width=8.0,
            placements=[
                FixturePlacement(
                    product_id="K-STATEMENT-01",
                    category="shower",
                    x=6.5,
                    y=0.5,
                    width=3.0,
                    depth=3.0,
                    rotation=0,
                    zone="wet"
                ),
                FixturePlacement(
                    product_id="K-HARKEN-VANITY-01",
                    category="vanity",
                    x=0.5,
                    y=2.5,
                    width=3.0,
                    depth=1.8,
                    rotation=0,
                    zone="vanity"
                ),
                FixturePlacement(
                    product_id="K-NUMI2-01",
                    category="smart_toilet",
                    x=7.5,
                    y=5.5,
                    width=1.5,
                    depth=2.0,
                    rotation=180,
                    zone="sanitary"
                )
            ],
            doors=[
                {"id": "door", "x": 0.5, "y": 7.5, "width": 2.5, "swing_angle": 270}
            ]
        )
        res = validate_spatial_layout(layout)
        self.assertTrue(res.is_feasible)
        self.assertEqual(len(res.violations), 0)
        self.assertGreater(res.usable_ratio, 0.5)

    def test_boundary_violation_detection(self):
        # Fixture placed sticking through the right wall (x=9.5 in 10 ft room with width 2.0)
        layout = SpatialLayout(
            room_length=10.0,
            room_width=8.0,
            placements=[
                FixturePlacement(
                    product_id="K-NUMI2-01",
                    category="toilet",
                    x=9.5,
                    y=2.0,
                    width=2.0,
                    depth=2.0,
                    rotation=0
                )
            ]
        )
        res = validate_spatial_layout(layout)
        self.assertFalse(res.is_feasible)
        self.assertIn("Boundary Violation", res.violations[0])

    def test_solid_collision_detection(self):
        # Two fixtures overlapping at (2.0, 2.0)
        layout = SpatialLayout(
            room_length=10.0,
            room_width=8.0,
            placements=[
                FixturePlacement(
                    product_id="K-NUMI2-01",
                    category="smart_toilet",
                    x=2.0,
                    y=2.0,
                    width=1.5,
                    depth=2.0,
                    rotation=0
                ),
                FixturePlacement(
                    product_id="K-HARKEN-VANITY-01",
                    category="vanity",
                    x=2.5,
                    y=2.5,
                    width=3.0,
                    depth=1.8,
                    rotation=0
                )
            ]
        )
        res = validate_spatial_layout(layout)
        self.assertFalse(res.is_feasible)
        self.assertGreaterEqual(len(res.collisions), 1)
        self.assertIn("Physical Collision", res.violations[0])

    def test_door_swing_conflict_detection(self):
        # Fixture placed right in the path of the bottom door swing
        layout = SpatialLayout(
            room_length=10.0,
            room_width=8.0,
            placements=[
                FixturePlacement(
                    product_id="K-NUMI2-01",
                    category="toilet",
                    x=1.0,
                    y=6.0,
                    width=2.0,
                    depth=2.0,
                    rotation=0
                )
            ],
            doors=[
                {"id": "door", "x": 0.5, "y": 7.5, "width": 2.5, "swing_angle": 270}
            ]
        )
        res = validate_spatial_layout(layout)
        self.assertFalse(res.is_feasible)
        self.assertGreaterEqual(len(res.door_conflicts), 1)
        self.assertIn("Door Conflict", res.violations[0])

    def test_procedural_layout_generator(self):
        # Generate layout for typical 10x8 Kohler suite
        prods = [
            self.catalog.get_product("K-NUMI2-01"),
            self.catalog.get_product("K-HARKEN-VANITY-01"),
            self.catalog.get_product("K-STATEMENT-01"),
            self.catalog.get_product("K-PURIST-01")
        ]
        generator = LayoutGenerator(room_length=10.0, room_width=8.0)
        layout = generator.generate_layout(prods)
        self.assertFalse(layout.has_collisions)
        self.assertEqual(len(layout.placements), 4)

        # Validate with spatial engine
        res = validate_spatial_layout(layout)
        self.assertTrue(res.is_feasible)


if __name__ == "__main__":
    unittest.main()
