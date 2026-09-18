"""
Unit tests for Sustainability and Water-Efficiency Engine (Stage 5)
"""

import unittest
from backend.services.catalog_service import CatalogService
from engine.sustainability import SustainabilityCalculator, HouseholdUsageModel


class TestSustainabilityCalculator(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()
        self.calculator = SustainabilityCalculator()

    def test_sustainability_calculation_with_standard_fixtures(self):
        # Bundle with ModernLife toilet (3.5 LPF), Purist faucet (4.5 LPM), Statement shower (7.6 LPM)
        product_ids = ["K-MODERNLIFE-03", "K-PURIST-01", "K-STATEMENT-01"]
        products = [self.catalog.get_product(pid) for pid in product_ids]

        model = HouseholdUsageModel(occupants=4, utility_rate_inr_per_liter=0.045)
        report = self.calculator.calculate_bundle_sustainability(products, model)

        # Basic validations
        self.assertGreater(report.baseline_annual_water_liters, 0)
        self.assertGreater(report.annual_water_consumption_liters, 0)
        self.assertLess(report.annual_water_consumption_liters, report.baseline_annual_water_liters)
        self.assertGreater(report.annual_water_saved_liters, 0)
        self.assertGreater(report.annual_water_savings_percent, 20.0)
        self.assertGreater(report.annual_utility_cost_savings_inr, 1000)
        self.assertGreater(report.carbon_offset_kg_co2, 5.0)
        self.assertEqual(len(report.fixture_breakdowns), 3)
        self.assertGreater(len(report.labeled_assumptions), 3)

    def test_high_efficiency_veil_toilet_savings(self):
        # Veil Intelligent Toilet has 3.0 LPF vs baseline 6.0 LPF -> 50% toilet savings
        veil = self.catalog.get_product("K-VEIL-WH-02")
        self.assertIsNotNone(veil)

        report = self.calculator.calculate_bundle_sustainability([veil])
        toilet_breakdown = report.fixture_breakdowns[0]

        self.assertEqual(toilet_breakdown.flow_rate, 3.0)
        self.assertEqual(toilet_breakdown.savings_percent, 50.0)
        # 4 occupants * 5 flushes * 365 days = 7300 flushes * 3.0 L saved = 21,900 L/yr
        self.assertEqual(toilet_breakdown.annual_saved_liters, 21900.0)

    def test_custom_occupant_scaling(self):
        product = self.catalog.get_product("K-MODERNLIFE-03")
        model_2_people = HouseholdUsageModel(occupants=2)
        model_6_people = HouseholdUsageModel(occupants=6)

        report_2 = self.calculator.calculate_bundle_sustainability([product], model_2_people)
        report_6 = self.calculator.calculate_bundle_sustainability([product], model_6_people)

        self.assertAlmostEqual(report_6.annual_water_consumption_liters, report_2.annual_water_consumption_liters * 3, places=0)


if __name__ == "__main__":
    unittest.main()
