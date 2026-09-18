"""
Unit tests for multi-objective bundle scorer
"""

import unittest
from backend.services.catalog_service import CatalogService
from backend.models.requirements import DesignRequirements, RoomDimensions, PriorityWeights
from engine.scoring.bundle_scorer import BundleScorer


class TestBundleScorer(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()

    def test_budget_scoring_within_ceiling(self):
        score_optimal = BundleScorer.score_budget(total_price_inr=180000, budget_max=200000)
        self.assertGreaterEqual(score_optimal, 90.0)

        # Severe penalty for exceeding budget
        score_overshoot = BundleScorer.score_budget(total_price_inr=280000, budget_max=200000)
        self.assertLess(score_overshoot, 40.0)

    def test_space_scoring_proportions(self):
        prods = [
            self.catalog.get_product("K-MODERNLIFE-03"),
            self.catalog.get_product("K-FOREFRONT-01"),
            self.catalog.get_product("K-STATEMENT-01")
        ]
        # 10x8 room = 80 sq ft
        room = RoomDimensions(length=10, width=8, unit="ft")
        score = BundleScorer.score_space(prods, room)
        self.assertGreater(score, 70.0)

    def test_sustainability_scoring(self):
        eco_prods = [
            self.catalog.get_product("K-VEIL-WH-02"),       # 3.0 LPF
            self.catalog.get_product("K-PURIST-01"),        # 4.5 LPM
            self.catalog.get_product("K-STATEMENT-01")      # 7.6 LPM Katalyst
        ]
        score_eco = BundleScorer.score_sustainability(eco_prods)

        standard_prods = [
            self.catalog.get_product("K-CIMARRON-04"),      # 4.8 LPF standard
            self.catalog.get_product("K-ARTIFACTS-BATH-02") # High volume tub
        ]
        score_std = BundleScorer.score_sustainability(standard_prods)

        self.assertGreater(score_eco, score_std)

    def test_evaluate_bundle_scores(self):
        prods = [
            self.catalog.get_product("K-MODERNLIFE-03"),
            self.catalog.get_product("K-HARKEN-VANITY-01"),
            self.catalog.get_product("K-PURIST-01"),
            self.catalog.get_product("K-STATEMENT-01")
        ]
        reqs = DesignRequirements(
            dimensions=RoomDimensions(length=10, width=8, unit="ft"),
            budget_max=250000,
            required_categories=["toilet", "vanity", "faucet", "shower"],
            style_preferences=["modern", "minimalist"],
            priority_weights=PriorityWeights(space=0.3, budget=0.3, luxury=0.2, sustainability=0.2)
        )
        scores = BundleScorer.evaluate_bundle(
            products=prods,
            requirements=reqs,
            compat_report={"is_compatible": True, "conflicts": [], "synergies": []}
        )
        self.assertGreater(scores.overall, 70.0)
        self.assertGreater(scores.space_efficiency, 50.0)
        self.assertGreater(scores.budget_fit, 50.0)
        self.assertGreater(scores.sustainability, 50.0)


if __name__ == "__main__":
    unittest.main()
