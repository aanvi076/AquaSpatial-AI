"""
Unit tests for 2D geometry, SAT collision, and clearance logic
"""

import unittest
from engine.geometry.primitives import (
    Point2D, 
    Rectangle2D, 
    check_sat_collision, 
    check_door_swing_collision
)
from engine.geometry.clearance import get_clearance_rect, CLEARANCE_RULES


class TestGeometryPrimitives(unittest.TestCase):
    def test_rectangle_vertices_zero_rotation(self):
        rect = Rectangle2D(x=1.0, y=2.0, width=3.0, depth=4.0, rotation=0)
        verts = rect.get_vertices()
        self.assertEqual(len(verts), 4)
        self.assertEqual(verts[0].to_tuple(), (1.0, 2.0))
        self.assertEqual(verts[1].to_tuple(), (4.0, 2.0))
        self.assertEqual(verts[2].to_tuple(), (4.0, 6.0))
        self.assertEqual(verts[3].to_tuple(), (1.0, 6.0))

    def test_boundary_containment(self):
        inside_rect = Rectangle2D(x=1.0, y=1.0, width=2.0, depth=2.0)
        self.assertTrue(inside_rect.is_inside_boundary(boundary_width=10.0, boundary_height=8.0))

        outside_rect = Rectangle2D(x=9.0, y=1.0, width=3.0, depth=2.0)
        self.assertFalse(outside_rect.is_inside_boundary(boundary_width=10.0, boundary_height=8.0))

    def test_sat_collision_separated(self):
        rect_a = Rectangle2D(x=0.0, y=0.0, width=2.0, depth=2.0)
        rect_b = Rectangle2D(x=5.0, y=5.0, width=2.0, depth=2.0)
        self.assertFalse(check_sat_collision(rect_a, rect_b))

    def test_sat_collision_overlapping(self):
        rect_a = Rectangle2D(x=1.0, y=1.0, width=3.0, depth=3.0)
        rect_b = Rectangle2D(x=2.0, y=2.0, width=3.0, depth=3.0)
        self.assertTrue(check_sat_collision(rect_a, rect_b))

    def test_sat_collision_rotated(self):
        rect_a = Rectangle2D(x=2.0, y=2.0, width=2.0, depth=2.0, rotation=45)
        rect_b = Rectangle2D(x=2.5, y=2.5, width=2.0, depth=2.0, rotation=0)
        self.assertTrue(check_sat_collision(rect_a, rect_b))

    def test_door_swing_collision(self):
        # Door at (0, 7.5), width=2.5, swing=270
        safe_fixture = Rectangle2D(x=5.0, y=5.0, width=2.0, depth=2.0)
        self.assertFalse(check_door_swing_collision(0.0, 7.5, 2.5, 270, safe_fixture))

        obstructing_fixture = Rectangle2D(x=0.5, y=6.0, width=2.0, depth=2.0)
        self.assertTrue(check_door_swing_collision(0.0, 7.5, 2.5, 270, obstructing_fixture))

    def test_clearance_rect_generation(self):
        # Toilet at (2, 2), width=1.5, depth=2.0, rotation=0
        c_rect = get_clearance_rect(
            category="toilet",
            x=2.0,
            y=2.0,
            width=1.5,
            depth=2.0,
            rotation=0
        )
        self.assertIsNotNone(c_rect)
        self.assertEqual(c_rect.x, 2.0)
        self.assertEqual(c_rect.y, 4.0)  # y + depth = 2.0 + 2.0
        self.assertEqual(c_rect.width, 1.5)
        self.assertEqual(c_rect.depth, CLEARANCE_RULES["toilet"]["front"])


if __name__ == "__main__":
    unittest.main()
