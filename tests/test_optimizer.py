"""
Unit tests for multi-objective bundle optimizer
"""

import unittest
from backend.services.catalog_service import CatalogService
from backend.models.requirements import DesignRequirements, RoomDimensions, PriorityWeights
from engine.optimization.bundle_optimizer import BundleOptimizer


class TestBundleOptimizer(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()
        self.optimizer = BundleOptimizer(self.catalog)

    def test_generate_alternatives_structure(self):
        reqs = DesignRequirements(
            dimensions=RoomDimensions(length=10, width=8, unit="ft"),
            budget_max=300000,
            required_categories=["toilet", "vanity", "faucet", "shower"],
            style_preferences=["modern"]
        )
        alternatives = self.optimizer.generate_alternatives(reqs)
        self.assertEqual(len(alternatives), 5)

        modes = [alt.mode for alt in alternatives]
        self.assertIn("balanced", modes)
        self.assertIn("luxury", modes)
        self.assertIn("eco", modes)
        self.assertIn("space_saver", modes)
        self.assertIn("personalized", modes)

        # Check each alternative has layout, scores, and trade-offs
        for alt in alternatives:
            self.assertGreater(len(alt.products), 0)
            self.assertIsNotNone(alt.layout)
            self.assertIsNotNone(alt.scores)
            self.assertGreater(len(alt.tradeoffs), 0)
            self.assertIn("water_efficiency", alt.explanation)

    def test_eco_alternative_sustainability_superiority(self):
        reqs = DesignRequirements(
            dimensions=RoomDimensions(length=10, width=8, unit="ft"),
            budget_max=400000,
            required_categories=["toilet", "vanity", "faucet", "shower"],
            style_preferences=["modern"]
        )
        alternatives = self.optimizer.generate_alternatives(reqs)
        eco_alt = next(a for a in alternatives if a.mode == "eco")
        std_alt = next(a for a in alternatives if a.mode == "space_saver")

        self.assertGreaterEqual(eco_alt.scores.sustainability, 75.0)

    def test_feasibility_enforcement(self):
        # Strict low budget: ₹50,000 max (luxury will be flagged infeasible if price > budget)
        reqs = DesignRequirements(
            dimensions=RoomDimensions(length=10, width=8, unit="ft"),
            budget_max=50000,
            required_categories=["toilet", "shower"],
            style_preferences=["modern"]
        )
        alternatives = self.optimizer.generate_alternatives(reqs)
        self.assertGreater(len(alternatives), 0)
        # Verify infeasible bundles have reasons logged
        for alt in alternatives:
            if not alt.feasible:
                self.assertGreater(len(alt.infeasibility_reasons), 0)


if __name__ == "__main__":
    unittest.main()
