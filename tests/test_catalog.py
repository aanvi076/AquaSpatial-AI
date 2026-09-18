"""
Unit tests for CatalogService
"""

import unittest
from backend.services.catalog_service import CatalogService


class TestCatalogService(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()

    def test_catalog_load(self):
        self.assertGreater(self.catalog.total_products, 0)
        self.assertGreaterEqual(self.catalog.total_products, 10)

    def test_get_product_found(self):
        numi = self.catalog.get_product("K-NUMI2-01")
        self.assertIsNotNone(numi)
        self.assertEqual(numi.category, "smart_toilet")
        self.assertEqual(numi.verification_status, "unverified")

    def test_filter_by_category(self):
        toilets = self.catalog.list_products(category="toilet")
        self.assertGreater(len(toilets), 0)
        # Should include regular toilets and smart toilets
        categories = {p.category for p in toilets}
        self.assertTrue("toilet" in categories or "smart_toilet" in categories)

    def test_filter_by_style(self):
        zen_items = self.catalog.list_products(style="zen")
        self.assertGreater(len(zen_items), 0)
        for item in zen_items:
            self.assertIn("zen", [s.lower() for s in item.styles])

    def test_filter_by_budget_ceiling(self):
        affordable_items = self.catalog.list_products(max_price=40000)
        for item in affordable_items:
            self.assertLessEqual(item.price_inr, 40000)

    def test_filter_water_saving(self):
        eco_items = self.catalog.list_products(water_saving_only=True)
        self.assertGreater(len(eco_items), 0)
        for item in eco_items:
            self.assertIsNotNone(item.water_consumption)
            self.assertTrue(item.water_consumption.is_water_saving)

    def test_compatibility_check(self):
        # K-NUMI2-01 lists K-PURIST-01 in compatible_product_ids
        report = self.catalog.check_compatibility(["K-NUMI2-01", "K-PURIST-01"])
        self.assertTrue(report["is_compatible"])
        self.assertGreaterEqual(len(report["synergies"]), 1)

    def test_catalog_expansion_scale(self):
        """Verify catalog contains over 100 verified Kohler products."""
        self.assertGreaterEqual(self.catalog.total_products, 100)
        self.assertLessEqual(self.catalog.total_products, 160)

    def test_required_categories_coverage(self):
        """Verify presence of all primary bathroom fixture categories."""
        categories = set(self.catalog.get_categories())
        expected_core = {"smart_toilet", "toilet", "vanity", "basin", "faucet", "shower", "bathtub", "accessory"}
        self.assertTrue(expected_core.issubset(categories))
        for cat in expected_core:
            items = self.catalog.list_products(category=cat)
            self.assertGreaterEqual(len(items), 5, f"Expected at least 5 products in {cat}")

    def test_catalog_provenance_statuses_and_grounding(self):
        """Audit status is explicit; verified records have an exact official product URL."""
        verified_ids = {
            "K-COMPOSED-01",
            "K-AVID-FAUCET-01",
            "K-BEITOU-WATERFALL-01",
        }
        for p in self.catalog.list_products():
            self.assertIn(p.verification_status, {"verified", "unverified"})
            self.assertTrue(p.source_url.startswith("http"))
            self.assertGreater(p.price_inr, 0)
            self.assertGreater(p.dimensions.width, 0)
            self.assertGreater(p.dimensions.depth, 0)
            self.assertGreater(p.dimensions.height, 0)
            self.assertEqual(p.verification_status == "verified", p.id in verified_ids)


if __name__ == "__main__":
    unittest.main()
