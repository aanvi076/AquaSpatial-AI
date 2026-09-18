"""
Unit tests for What-If & Trade-Off Analysis Engine (Stage 5)
"""

import unittest
from backend.services.catalog_service import CatalogService
from backend.models.requirements import DesignRequirements, RoomDimensions
from engine.optimization.bundle_optimizer import BundleOptimizer
from engine.tradeoffs import WhatIfAnalyzer, WhatIfQueryRequest


class TestWhatIfAnalyzer(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()
        self.analyzer = WhatIfAnalyzer(self.catalog)
        self.optimizer = BundleOptimizer(self.catalog)

    def test_spend_increase_scenario(self):
        req = WhatIfQueryRequest(
            scenario_type="spend_increase",
            current_product_ids=["K-MODERNLIFE-03", "K-PURIST-01", "K-MOXIE-02"],
            budget_max=200000,
            spend_delta_inr=25000
        )
        res = self.analyzer.analyze_scenario(req)

        self.assertEqual(res.scenario_type, "spend_increase")
        self.assertIn("additional_spend_inr", res.quantitative_impact)
        self.assertGreater(len(res.actionable_substitutions), 0)
        self.assertTrue(len(res.tradeoff_explanation) > 10)

    def test_remove_bathtub_scenario(self):
        req = WhatIfQueryRequest(
            scenario_type="remove_bathtub",
            current_product_ids=["K-MODERNLIFE-03", "K-UNDERSCORE-01", "K-PURIST-01"],
            room_length=10,
            room_width=8
        )
        res = self.analyzer.analyze_scenario(req)

        self.assertEqual(res.scenario_type, "remove_bathtub")
        self.assertNotIn("K-UNDERSCORE-01", res.resulting_product_ids)
        self.assertGreater(res.quantitative_impact["cost_saved_inr"], 50000)
        self.assertGreater(res.quantitative_impact["floor_area_recovered_sq_ft"], 10.0)

    def test_biggest_water_saver_scenario(self):
        req = WhatIfQueryRequest(
            scenario_type="biggest_water_saver",
            current_product_ids=["K-MODERNLIFE-03", "K-STATEMENT-01", "K-PURIST-01"]
        )
        res = self.analyzer.analyze_scenario(req)

        self.assertEqual(res.scenario_type, "biggest_water_saver")
        self.assertGreater(res.quantitative_impact["total_bundle_annual_saved_liters"], 10000)

    def test_smaller_bathroom_scenario(self):
        req = WhatIfQueryRequest(
            scenario_type="smaller_bathroom",
            current_product_ids=["K-MEMOIRS-VANITY-01", "K-UNDERSCORE-01", "K-MODERNLIFE-03"]
        )
        res = self.analyzer.analyze_scenario(req)

        self.assertEqual(res.scenario_type, "smaller_bathroom")
        self.assertIn("K-HARKEN-VANITY-01", res.resulting_product_ids)
        self.assertGreater(res.quantitative_impact["circulation_clearance_gained_sq_ft"], 0)

    def test_budget_culprit_scenario(self):
        req = WhatIfQueryRequest(
            scenario_type="budget_culprit",
            current_product_ids=["K-VEIL-WH-02", "K-HARKEN-VANITY-01", "K-PURIST-01"]
        )
        res = self.analyzer.analyze_scenario(req)

        self.assertEqual(res.scenario_type, "budget_culprit")
        self.assertEqual(res.quantitative_impact["culprit_sku"], "K-VEIL-WH-02")
        self.assertGreater(res.quantitative_impact["potential_savings_inr"], 100000)

    def test_cross_alternative_comparison(self):
        reqs = DesignRequirements(
            dimensions=RoomDimensions(length=10, width=8, unit="ft"),
            budget_max=350000,
            required_categories=["toilet", "vanity", "shower"]
        )
        alts = self.optimizer.generate_alternatives(reqs)
        balanced_alt = next(a for a in alts if a.mode == "balanced")
        eco_alt = next(a for a in alts if a.mode == "eco")

        report = self.analyzer.compare_alternatives(balanced_alt, eco_alt, self.catalog)

        self.assertEqual(report.mode_a, "balanced")
        self.assertEqual(report.mode_b, "eco")
        self.assertIsNotNone(report.synthesis)
        self.assertIsNotNone(report.sustainability_delta)


if __name__ == "__main__":
    unittest.main()
