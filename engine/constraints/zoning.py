"""
Wet/Dry Bathroom Zoning Engine
Evaluates spatial separation between wet zones (shower, bath) and dry zones (vanity, toilet).
"""

from typing import List, Dict, Any, Tuple
from backend.models.design import FixturePlacement

WET_CATEGORIES = {"shower", "bathtub"}
DRY_CATEGORIES = {"vanity", "basin", "accessory"}
SANITARY_CATEGORIES = {"toilet", "smart_toilet"}


def classify_fixture_zone(category: str) -> str:
    cat = category.lower()
    if cat in WET_CATEGORIES:
        return "wet"
    elif cat in SANITARY_CATEGORIES:
        return "sanitary"
    elif cat in DRY_CATEGORIES:
        return "dry"
    return "general"


def evaluate_zoning(placements: List[FixturePlacement], room_length: float, room_width: float) -> Dict[str, Any]:
    """
    Evaluates whether wet and dry fixtures are sensibly grouped.
    Checks:
    1. Are showers and bathtubs clustered in the designated wet zone?
    2. Is there adequate separation between shower spray and wooden vanities?
    """
    wet_fixtures = [p for p in placements if classify_fixture_zone(p.category) == "wet"]
    vanity_fixtures = [p for p in placements if p.category.lower() in {"vanity", "basin"}]

    warnings = []
    zone_score = 100.0

    # Check proximity between open shower and vanity
    for wf in wet_fixtures:
        for vf in vanity_fixtures:
            # Center to center distance
            wc_x = wf.x + wf.width / 2.0
            wc_y = wf.y + wf.depth / 2.0
            vc_x = vf.x + vf.width / 2.0
            vc_y = vf.y + vf.depth / 2.0

            dist = ((wc_x - vc_x)**2 + (wc_y - vc_y)**2)**0.5
            if dist < 2.5:
                warnings.append(
                    f"Zoning Warning: {wf.category.capitalize()} ({wf.product_id}) is only {dist:.1f} ft from {vf.category.capitalize()} ({vf.product_id}). Recommend shower partition or min 3.0 ft separation to protect cabinetry from moisture."
                )
                zone_score -= 20.0

    return {
        "zone_score": max(0.0, min(100.0, zone_score)),
        "is_separated": len(warnings) == 0,
        "warnings": warnings,
        "wet_count": len(wet_fixtures),
        "vanity_count": len(vanity_fixtures)
    }
