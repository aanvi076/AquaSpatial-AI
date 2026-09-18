"""
Standard Architectural Clearance Boundaries
Grounded in NKBA (National Kitchen & Bath Association) & Kohler Installation Guidelines.
"""

from typing import Dict, Any, Optional
from engine.geometry.primitives import Rectangle2D

# Clearance dimensions in feet
CLEARANCE_RULES = {
    "toilet": {
        "front": 1.75,       # 21 inches minimum in front of bowl
        "side": 0.35,        # 15 inches total from centerline (approx 4.2 inches from outer edge)
        "description": "21 inches front clearance required for ergonomic access"
    },
    "smart_toilet": {
        "front": 2.0,        # 24 inches for luxury smart toilet comfort
        "side": 0.4,
        "description": "24 inches front clearance for hands-free sensor & bidet comfort"
    },
    "vanity": {
        "front": 2.0,        # 24 inches standing grooming space
        "side": 0.0,
        "description": "24 inches front standing and drawer pullout clearance"
    },
    "basin": {
        "front": 1.75,       # 21 inches
        "side": 0.0,
        "description": "21 inches front standing clearance"
    },
    "shower": {
        "front": 2.0,        # 24 inches entry door/curtain swing
        "side": 0.0,
        "description": "24 inches entry clearance into shower enclosure"
    },
    "bathtub": {
        "front": 2.0,        # 24 inches side step-out clearance
        "side": 0.0,
        "description": "24 inches step-out drying clearance along tub rim"
    },
    "accessory": {
        "front": 1.0,
        "side": 0.0,
        "description": "12 inches reach clearance"
    }
}


def get_clearance_rect(
    category: str, 
    x: float, 
    y: float, 
    width: float, 
    depth: float, 
    rotation: int
) -> Optional[Rectangle2D]:
    """
    Computes the functional front clearance zone envelope as a Rectangle2D
    projecting outward from the front of the fixture.
    """
    rule = CLEARANCE_RULES.get(category.lower(), {"front": 1.5, "side": 0.0})
    front_clearance = rule["front"]

    rot = rotation % 360

    # In local coordinates, "front" is along +depth (downward if rotation=0)
    # If rot == 0: front is at (x, y + depth), extending by width x front_clearance
    # If rot == 90: front is to the left (-X)
    # If rot == 180: front is upward (-Y)
    # If rot == 270: front is to the right (+X)

    w, d = width, depth
    fc = front_clearance

    if rot == 0:
        # Front faces +Y (downward into room from top wall)
        return Rectangle2D(x=x, y=y + d, width=w, depth=fc, rotation=0)
    elif rot == 90:
        # Front faces -X (leftward into room from right wall)
        return Rectangle2D(x=x - d - fc, y=y, width=fc, depth=w, rotation=0)
    elif rot == 180:
        # Front faces -Y (upward into room from bottom wall)
        return Rectangle2D(x=x - w, y=y - d - fc, width=w, depth=fc, rotation=0)
    elif rot == 270:
        # Front faces +X (rightward into room from left wall)
        return Rectangle2D(x=x + d, y=y - w, width=fc, depth=w, rotation=0)

    return None
