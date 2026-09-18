"""
API Integration Tests for Kohler AI Bathroom Designer
"""

import asyncio
import unittest
import httpx
from backend.main import app


class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.transport = httpx.ASGITransport(app=app)

    def _async_run(self, coro):
        return asyncio.run(coro)

    def test_root_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                res = await client.get("/")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["status"], "online")
        self._async_run(_test())

    def test_health_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                res = await client.get("/api/health")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["status"], "ok")
                self.assertGreater(data["catalog_products_count"], 0)
                self.assertIn("toilet", data["available_categories"])
                self.assertIn("faucet", data["available_categories"])
        self._async_run(_test())

    def test_catalog_query(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                res = await client.get("/api/catalog?category=smart_toilet")
                self.assertEqual(res.status_code, 200)
                items = res.json()
                self.assertGreater(len(items), 0)
                for item in items:
                    self.assertIn("toilet", item["category"])
        self._async_run(_test())

    def test_catalog_filter_price(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                res = await client.get("/api/catalog?max_price=50000")
                self.assertEqual(res.status_code, 200)
                items = res.json()
                self.assertGreater(len(items), 0)
                for item in items:
                    self.assertLessEqual(item["price_inr"], 50000)
        self._async_run(_test())

    def test_get_product_by_id(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                res = await client.get("/api/catalog/K-NUMI2-01")
                self.assertEqual(res.status_code, 200)
                prod = res.json()
                self.assertEqual(prod["id"], "K-NUMI2-01")
                self.assertEqual(prod["verification_status"], "unverified")
        self._async_run(_test())

    def test_get_product_not_found(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                res = await client.get("/api/catalog/NONEXISTENT-SKU")
                self.assertEqual(res.status_code, 404)
        self._async_run(_test())

    def test_validate_constraints_feasible(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {
                    "requirements": {
                        "dimensions": {"length": 10, "width": 8, "unit": "ft"},
                        "budget_max": 250000,
                        "required_categories": ["toilet", "faucet", "basin"],
                        "excluded_categories": ["bathtub"],
                        "style_preferences": ["modern"]
                    },
                    "selected_product_ids": ["K-MODERNLIFE-03", "K-FOREFRONT-01", "K-PURIST-01"]
                }
                res = await client.post("/api/validate-constraints", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertTrue(data["is_feasible"])
                self.assertFalse(data["budget_exceeded"])
                self.assertGreater(data["budget_headroom_inr"], 0)
        self._async_run(_test())

    def test_validate_constraints_budget_violation(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {
                    "requirements": {
                        "dimensions": {"length": 10, "width": 8, "unit": "ft"},
                        "budget_max": 100000,  # Strict budget
                        "required_categories": ["smart_toilet"],
                        "excluded_categories": [],
                        "style_preferences": ["luxury"]
                    },
                    # Numi 2.0 is ₹485,000, exceeding ₹100,000 budget
                    "selected_product_ids": ["K-NUMI2-01"]
                }
                res = await client.post("/api/validate-constraints", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertFalse(data["is_feasible"])
                self.assertTrue(data["budget_exceeded"])
                self.assertIn("Budget ceiling exceeded", data["violations"][0])
        self._async_run(_test())

    def test_generate_layout_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {
                    "room_length": 10.0,
                    "room_width": 8.0,
                    "product_ids": ["K-NUMI2-01", "K-HARKEN-VANITY-01", "K-STATEMENT-01"]
                }
                res = await client.post("/api/layout/generate", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertIn("layout", data)
                self.assertIn("spatial_validation", data)
                self.assertTrue(data["spatial_validation"]["is_feasible"])
                self.assertEqual(len(data["layout"]["placements"]), 3)
        self._async_run(_test())

    def test_validate_layout_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {
                    "room_length": 10.0,
                    "room_width": 8.0,
                    "placements": [
                        {
                            "product_id": "K-NUMI2-01",
                            "category": "smart_toilet",
                            "x": 6.0,
                            "y": 5.0,
                            "width": 1.5,
                            "depth": 2.0,
                            "rotation": 0,
                            "clearance_front": 2.0,
                            "zone": "sanitary"
                        }
                    ],
                    "doors": [{"id": "door", "x": 0.5, "y": 7.5, "width": 2.5, "swing_angle": 270}]
                }
                res = await client.post("/api/layout/validate", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertTrue(data["is_feasible"])
                self.assertEqual(len(data["violations"]), 0)
        self._async_run(_test())

    def test_semantic_search_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {
                    "query": "smart toilet with bidet spray and ambient light",
                    "top_k": 3
                }
                res = await client.post("/api/retrieval/search", json=payload)
                self.assertEqual(res.status_code, 200)
                items = res.json()
                self.assertGreater(len(items), 0)
                self.assertIn("similarity_score", items[0])
                self.assertIn("evidence_snippet", items[0])
        self._async_run(_test())

    def test_generate_alternatives_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {
                    "dimensions": {"length": 10.0, "width": 8.0, "unit": "ft"},
                    "budget_max": 300000,
                    "required_categories": ["toilet", "vanity", "faucet", "shower"],
                    "style_preferences": ["modern", "minimalist"]
                }
                res = await client.post("/api/optimizer/generate-alternatives", json=payload)
                self.assertEqual(res.status_code, 200)
                alternatives = res.json()
                self.assertEqual(len(alternatives), 5)
                modes = [a["mode"] for a in alternatives]
                self.assertIn("balanced", modes)
                self.assertIn("eco", modes)
                self.assertIn("luxury", modes)
        self._async_run(_test())

    def test_extract_requirements_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {"text": "Japanese Zen bathroom 8x6 ft with 2 lakh budget"}
                res = await client.post("/api/ai/extract-requirements", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["dimensions"]["length"], 8.0)
                self.assertEqual(data["budget_max"], 200000)
                self.assertIn("zen", data["style_preferences"])
        self._async_run(_test())

    def test_analyze_image_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {"filename": "zen_master_bath.jpg"}
                res = await client.post("/api/ai/analyze-image", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertIn("detected_fixtures", data)
                self.assertGreater(data["confidence_score"], 0.7)
        self._async_run(_test())

    def test_conversational_redesign_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {
                    "session_id": "test_sess_01",
                    "user_message": "Make it more luxurious please",
                    "current_requirements": {
                        "dimensions": {"length": 10.0, "width": 8.0, "unit": "ft"},
                        "budget_max": 350000,
                        "required_categories": ["toilet", "vanity", "shower"],
                        "style_preferences": ["modern"]
                    },
                    "selected_product_ids": ["K-MODERNLIFE-03", "K-HARKEN-VANITY-01", "K-STATEMENT-01"]
                }
                res = await client.post("/api/ai/conversational-redesign", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["intent"], "luxury_upgrade")
                self.assertTrue(data["is_feasible"])
                self.assertIn("change_summary", data)
        self._async_run(_test())

    def test_sustainability_calculate_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {
                    "product_ids": ["K-MODERNLIFE-03", "K-PURIST-01", "K-STATEMENT-01"],
                    "occupants": 4,
                    "utility_rate_inr_per_liter": 0.045
                }
                res = await client.post("/api/sustainability/calculate", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertIn("annual_water_saved_liters", data)
                self.assertIn("annual_utility_cost_savings_inr", data)
                self.assertGreater(data["annual_water_savings_percent"], 20.0)
                self.assertGreater(len(data["labeled_assumptions"]), 0)
        self._async_run(_test())

    def test_tradeoffs_whatif_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                payload = {
                    "scenario_type": "spend_increase",
                    "current_product_ids": ["K-MODERNLIFE-03", "K-PURIST-01", "K-MOXIE-02"],
                    "spend_delta_inr": 25000,
                    "budget_max": 250000
                }
                res = await client.post("/api/tradeoffs/whatif", json=payload)
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["scenario_type"], "spend_increase")
                self.assertIn("headline", data)
                self.assertIn("tradeoff_explanation", data)
        self._async_run(_test())

    def test_bom_generate_and_export_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test") as client:
                # Generate BOM
                gen_payload = {
                    "product_ids": ["K-MODERNLIFE-03", "K-HARKEN-VANITY-01", "K-PURIST-01"],
                    "project_title": "Test Bathroom",
                    "gst_rate": 18.0
                }
                res = await client.post("/api/bom/generate", json=gen_payload)
                self.assertEqual(res.status_code, 200)
                bom_data = res.json()
                self.assertEqual(len(bom_data["line_items"]), 3)
                self.assertIn("financial_summary", bom_data)

                # Export BOM as CSV
                exp_payload = {
                    "product_ids": ["K-MODERNLIFE-03", "K-HARKEN-VANITY-01", "K-PURIST-01"],
                    "export_format": "csv"
                }
                res_exp = await client.post("/api/bom/export", json=exp_payload)
                self.assertEqual(res_exp.status_code, 200)
                exp_data = res_exp.json()
                self.assertEqual(exp_data["format"], "csv")
                self.assertIn("KOHLER OFFICIAL SPECIFICATION", exp_data["content"])
        self._async_run(_test())

    def test_ai_evaluation_endpoint(self):
        async def _test():
            async with httpx.AsyncClient(transport=self.transport, base_url="http://test", timeout=30.0) as client:
                res = await client.get("/api/ai/evaluation")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertEqual(data["total_benchmarks"], 6)
                self.assertEqual(data["grounding_rate_percent"], 100.0)
                self.assertGreaterEqual(data["pass_rate_percent"], 80.0)
                self.assertIn("results", data)
                self.assertEqual(len(data["results"]), 6)
        self._async_run(_test())


if __name__ == "__main__":
    unittest.main()


