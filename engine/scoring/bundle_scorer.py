"""
Multi-Objective Bundle Scoring Engine
Matches Section 10 of Kohler AI Bathroom Designer Specification.
Computes deterministic scores (0-100) across:
- Space Efficiency
- Budget Fit
- Style Harmony
- Functionality
- Compatibility
- Sustainability
- User Priority Alignment
"""

from typing import List, Dict, Any, Optional
from backend.models.product import KohlerProduct
from backend.models.requirements import DesignRequirements, PriorityWeights, RoomDimensions
from backend.models.design import DesignScores
from engine.constraints.spatial_validator import SpatialValidationResult


class BundleScorer:
    @staticmethod
    def score_space(
        products: List[KohlerProduct],
        room_dims: RoomDimensions,
        spatial_val: Optional[SpatialValidationResult] = None
    ) -> float:
        """
        Evaluates space efficiency:
        - Ratio of free floor area (optimal is between 65% and 85%)
        - Absence of clearance or boundary conflicts
        """
        room_area = room_dims.area_sq_ft
        total_footprint = sum(
            p.dimensions.to_feet().width * p.dimensions.to_feet().depth
            for p in products
        )

        if room_area <= 0:
            return 50.0

        free_ratio = max(0.0, (room_area - total_footprint) / room_area)

        # Baseline score from free space
        if 0.65 <= free_ratio <= 0.85:
            base_score = 95.0
        elif free_ratio > 0.85:
            base_score = 88.0  # Room may feel under-furnished
        elif 0.50 <= free_ratio < 0.65:
            base_score = 75.0  # Slightly tight
        else:
            base_score = 40.0  # Cramped

        # Spatial validator deductions
        if spatial_val:
            if not spatial_val.is_feasible:
                base_score -= 30.0
            base_score -= len(spatial_val.clearance_conflicts) * 5.0
            base_score -= len(spatial_val.warnings) * 3.0

        return max(0.0, min(100.0, base_score))

    @staticmethod
    def score_budget(total_price_inr: int, budget_max: int, budget_min: int = 0) -> float:
        """
        Evaluates financial fit:
        - If total > budget_max: rapid penalty
        - If within budget: rewards optimal budget utilization (80% - 98%)
        """
        if total_price_inr > budget_max:
            overshoot_pct = (total_price_inr - budget_max) / float(budget_max)
            # Steep penalty for budget breach
            return max(0.0, 40.0 - (overshoot_pct * 100.0))

        utilization = total_price_inr / float(budget_max) if budget_max > 0 else 1.0

        if 0.75 <= utilization <= 0.98:
            return 96.0  # Optimal utilization of available budget
        elif 0.50 <= utilization < 0.75:
            return 85.0  # Good savings
        elif utilization < 0.50:
            return 72.0  # Under-budget, potential quality left on the table
        else:
            return 90.0  # Exactly at ceiling

    @staticmethod
    def score_style(products: List[KohlerProduct], preferred_styles: List[str], preferred_finishes: List[str]) -> float:
        """
        Evaluates stylistic cohesion and alignment with user aesthetic theme.
        """
        if not products:
            return 50.0

        pref_styles_lower = [s.lower() for s in preferred_styles]
        style_matches = 0
        all_finishes = []

        for p in products:
            prod_styles = [s.lower() for s in p.styles]
            if any(pref in prod_styles for pref in pref_styles_lower):
                style_matches += 1
            all_finishes.extend(p.finishes)

        style_match_ratio = style_matches / float(len(products))
        score = style_match_ratio * 80.0

        # Finish harmony bonus: do fixtures share at least one common finish?
        if preferred_finishes:
            pref_fin_lower = [f.lower() for f in preferred_finishes]
            fin_match = sum(1 for p in products if any(f.lower() in pref_fin_lower for f in p.finishes))
            score += (fin_match / float(len(products))) * 20.0
        else:
            # Check internal consistency
            score += 15.0

        return max(0.0, min(100.0, score))

    @staticmethod
    def score_functionality(products: List[KohlerProduct], required_categories: List[str]) -> float:
        """
        Evaluates category completeness and functional tier of fixtures.
        """
        if not required_categories:
            return 85.0

        present_cats = {p.category.lower() for p in products}
        if "smart_toilet" in present_cats:
            present_cats.add("toilet")

        missing = [c for c in required_categories if c.lower() not in present_cats]
        completion_ratio = (len(required_categories) - len(missing)) / float(len(required_categories))

        score = completion_ratio * 70.0

        # High-tech / premium feature bonuses
        feature_count = sum(len(p.features) for p in products)
        score += min(20.0, feature_count * 1.5)

        # Smart toilet bonus
        if any(p.category == "smart_toilet" for p in products):
            score += 10.0

        return max(0.0, min(100.0, score))

    @staticmethod
    def score_compatibility(products: List[KohlerProduct], compat_report: Dict[str, Any]) -> float:
        """
        Evaluates mutual hardware compatibility and synergy.
        """
        if not compat_report.get("is_compatible", True):
            return 20.0  # Hard conflict present

        score = 90.0
        synergies = compat_report.get("synergies", [])
        score += min(10.0, len(synergies) * 5.0)  # Bonus for certified matching pairs

        return max(0.0, min(100.0, score))

    @staticmethod
    def score_sustainability(products: List[KohlerProduct]) -> float:
        """
        Evaluates water efficiency (LPF/LPM), WaterSense certifications, and eco attributes.
        """
        if not products:
            return 50.0

        water_fixtures = [p for p in products if p.water_consumption is not None]
        if not water_fixtures:
            return 70.0

        eco_fixtures = [
            p for p in water_fixtures
            if p.water_consumption and p.water_consumption.is_water_saving
        ]

        eco_ratio = len(eco_fixtures) / float(len(water_fixtures))
        score = eco_ratio * 70.0

        # Flow rate performance
        for p in water_fixtures:
            wc = p.water_consumption
            if not wc:
                continue
            if wc.unit == "LPF" and wc.rate <= 3.8:
                score += 8.0  # High efficiency dual-flush toilet
            elif wc.unit == "LPM" and wc.rate <= 7.6:
                score += 8.0  # Katalyst air induction shower
            elif wc.unit == "LPM" and wc.rate <= 5.0:
                score += 6.0  # WaterSense faucet

        # Green materials bonus
        recycled_mats = sum(
            1 for p in products
            if any("recycled" in s.lower() or "fsc" in s.lower() for s in p.sustainability_attributes)
        )
        score += min(10.0, recycled_mats * 5.0)

        return max(0.0, min(100.0, score))

    @classmethod
    def evaluate_bundle(
        cls,
        products: List[KohlerProduct],
        requirements: DesignRequirements,
        compat_report: Dict[str, Any],
        spatial_val: Optional[SpatialValidationResult] = None
    ) -> DesignScores:
        """
        Evaluates the product bundle across all 6 dimensions and computes the overall weighted score.
        """
        total_price = sum(p.price_inr for p in products)

        s_space = cls.score_space(products, requirements.dimensions, spatial_val)
        s_budget = cls.score_budget(total_price, requirements.budget_max, requirements.budget_min or 0)
        s_style = cls.score_style(products, requirements.style_preferences, requirements.finish_preferences)
        s_func = cls.score_functionality(products, requirements.required_categories)
        s_compat = cls.score_compatibility(products, compat_report)
        s_sust = cls.score_sustainability(products)

        # Apply priority weights
        w = requirements.priority_weights or PriorityWeights()
        total_weight = (
            w.space + w.budget + w.luxury + 
            w.functionality + w.compatibility + w.sustainability
        )
        if total_weight <= 0:
            total_weight = 1.0

        overall = (
            s_space * (w.space / total_weight) +
            s_budget * (w.budget / total_weight) +
            s_style * (w.luxury / total_weight) +
            s_func * (w.functionality / total_weight) +
            s_compat * (w.compatibility / total_weight) +
            s_sust * (w.sustainability / total_weight)
        )

        return DesignScores(
            overall=round(overall, 1),
            space_efficiency=round(s_space, 1),
            budget_fit=round(s_budget, 1),
            style_match=round(s_style, 1),
            functionality=round(s_func, 1),
            compatibility=round(s_compat, 1),
            sustainability=round(s_sust, 1)
        )
