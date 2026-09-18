"""
Unit tests for Grounded Product Retriever & Semantic RAG
"""

import unittest
from ai.retrieval.product_retriever import GroundedProductRetriever
from backend.services.catalog_service import CatalogService


class TestProductRetriever(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()
        self.retriever = GroundedProductRetriever(self.catalog)

    def test_semantic_search_smart_toilet(self):
        results = self.retriever.search(query="ambient lighting bidet heated seat smart toilet", top_k=3)
        self.assertGreater(len(results), 0)
        top_id = results[0]["product"].id
        self.assertIn(top_id, ["K-NUMI2-01", "K-VEIL-WH-02"])
        self.assertGreater(results[0]["similarity_score"], 0.1)
        self.assertIn("Official catalog price", results[0]["evidence_snippet"])

    def test_semantic_search_bluetooth_shower(self):
        results = self.retriever.search(query="waterproof bluetooth speaker music shower", top_k=2)
        self.assertGreater(len(results), 0)
        top_prod = results[0]["product"]
        self.assertEqual(top_prod.id, "K-MOXIE-02")

    def test_search_with_category_filter(self):
        results = self.retriever.search(query="luxury modern", category="bathtub", top_k=5)
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertEqual(r["product"].category, "bathtub")

    def test_search_with_price_filter(self):
        results = self.retriever.search(query="toilet", max_price=50000, top_k=5)
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertLessEqual(r["product"].price_inr, 50000)

    def test_search_water_saving_only(self):
        results = self.retriever.search(query="fixture", water_saving_only=True, top_k=5)
        self.assertGreater(len(results), 0)
        for r in results:
            self.assertIsNotNone(r["product"].water_consumption)
            self.assertTrue(r["product"].water_consumption.is_water_saving)


if __name__ == "__main__":
    unittest.main()
