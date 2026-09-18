"""
2D Geometric Primitives and Collision Detection
Supports AABB, Rotated Rectangles (OBB via Separating Axis Theorem - SAT),
and boundary containment checks.
"""

from typing import List, Tuple, Optional
import math


class Point2D:
    def __init__(self, x: float, y: float):
        self.x = round(float(x), 4)
        self.y = round(float(y), 4)

    def to_tuple(self) -> Tuple[float, float]:
        return (self.x, self.y)

    def __repr__(self) -> str:
        return f"Point2D({self.x}, {self.y})"


class Rectangle2D:
    """
    Oriented 2D Rectangle defined by top-left (or reference origin) anchor (x, y),
    width, depth, and rotation angle (degrees).
    """
    def __init__(self, x: float, y: float, width: float, depth: float, rotation: int = 0):
        self.x = float(x)
        self.y = float(y)
        self.width = float(width)
        self.depth = float(depth)
        self.rotation = int(rotation) % 360

    def get_vertices(self) -> List[Point2D]:
        """
        Returns the 4 corners of the rotated rectangle in clockwise order.
        """
        w, d = self.width, self.depth
        rad = math.radians(self.rotation)
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)

        # Local offsets from anchor (top-left)
        local_pts = [
            (0.0, 0.0),
            (w, 0.0),
            (w, d),
            (0.0, d)
        ]

        vertices = []
        for lx, ly in local_pts:
            rx = lx * cos_a - ly * sin_a
            ry = lx * sin_a + ly * cos_a
            vertices.append(Point2D(self.x + rx, self.y + ry))

        return vertices

    def get_axis_aligned_bounds(self) -> Tuple[float, float, float, float]:
        """
        Returns (min_x, min_y, max_x, max_y)
        """
        verts = self.get_vertices()
        xs = [v.x for v in verts]
        ys = [v.y for v in verts]
        return (min(xs), min(ys), max(xs), max(ys))

    def is_inside_boundary(self, boundary_width: float, boundary_height: float, tolerance: float = 0.001) -> bool:
        """
        Checks if all vertices of this rectangle lie strictly within [0, boundary_width] x [0, boundary_height].
        """
        verts = self.get_vertices()
        for v in verts:
            if v.x < -tolerance or v.x > boundary_width + tolerance:
                return False
            if v.y < -tolerance or v.y > boundary_height + tolerance:
                return False
        return True


def check_sat_collision(rect_a: Rectangle2D, rect_b: Rectangle2D) -> bool:
    """
    Separating Axis Theorem (SAT) for exact collision detection between two oriented rectangles.
    Returns True if rectangles intersect (overlap), False if separated.
    """
    poly_a = rect_a.get_vertices()
    poly_b = rect_b.get_vertices()

    def get_axes(poly: List[Point2D]) -> List[Tuple[float, float]]:
        axes = []
        for i in range(len(poly)):
            p1 = poly[i]
            p2 = poly[(i + 1) % len(poly)]
            edge = (p2.x - p1.x, p2.y - p1.y)
            # Normal perpendicular vector (-dy, dx)
            normal = (-edge[1], edge[0])
            length = math.hypot(normal[0], normal[1])
            if length > 1e-6:
                axes.append((normal[0] / length, normal[1] / length))
        return axes

    axes = get_axes(poly_a) + get_axes(poly_b)

    def project_polygon(axis: Tuple[float, float], poly: List[Point2D]) -> Tuple[float, float]:
        dots = [p.x * axis[0] + p.y * axis[1] for p in poly]
        return (min(dots), max(dots))

    for axis in axes:
        min_a, max_a = project_polygon(axis, poly_a)
        min_b, max_b = project_polygon(axis, poly_b)

        # If projections do not overlap, axis separates the shapes
        # Use small epsilon to avoid false collisions on flush adjacent edges
        if max_a <= min_b + 0.001 or max_b <= min_a + 0.001:
            return False

    return True


def check_door_swing_collision(
    door_x: float, 
    door_y: float, 
    door_width: float, 
    door_swing_angle: int, 
    rect: Rectangle2D
) -> bool:
    """
    Checks if a fixture rectangle encroaches upon the 90-degree door swing clearance box.
    """
    # Create clearance envelope for the door swing arc
    door_swing_box = Rectangle2D(
        x=door_x, 
        y=door_y, 
        width=door_width, 
        depth=door_width, 
        rotation=door_swing_angle
    )
    return check_sat_collision(door_swing_box, rect)
