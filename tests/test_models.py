"""
Unit tests for domain models
"""

import unittest
from backend.models.product import KohlerProduct, ProductDimensions, WaterConsumption
from backend.models.requirements import DesignRequirements, RoomDimensions, PriorityWeights
from backend.models.design import DesignAlternative, DesignScores, SpatialLayout, FixturePlacement


class TestProductModels(unittest.TestCase):
    def test_dimensions_conversion(self):
        dim_inches = ProductDimensions(width=24, depth=18, height=36, unit="in")
        dim_ft = dim_inches.to_feet()
        self.assertEqual(dim_ft.unit, "ft")
        self.assertEqual(dim_ft.width, 2.0)
        self.assertEqual(dim_ft.depth, 1.5)
        self.assertEqual(dim_ft.height, 3.0)

    def test_kohler_product_instantiation(self):
        prod = KohlerProduct(
            id="K-TEST-01",
            name="Test Kohler Fixture",
            category="toilet",
            price_inr=50000,
            dimensions=ProductDimensions(width=1.5, depth=2.0, height=2.5, unit="ft"),
            styles=["modern", "minimalist"],
            finishes=["matte_black"],
            features=["Quiet-Close"],
            water_consumption=WaterConsumption(rate=3.5, unit="LPF", is_water_saving=True),
            sustainability_attributes=["WaterSense"],
            installation_requirements=["Standard rough-in"],
            compatible_product_ids=["K-FAUCET-01"],
            incompatible_product_ids=[],
            source_url="https://kohler.com",
            verification_status="verified"
        )
        self.assertEqual(prod.id, "K-TEST-01")
        self.assertEqual(prod.price_inr, 50000)
        self.assertTrue(prod.water_consumption.is_water_saving)

    def test_room_dimensions_area(self):
        room = RoomDimensions(length=10, width=8, unit="ft")
        self.assertEqual(room.area_sq_ft, 80.0)

    def test_design_scores_bounds(self):
        scores = DesignScores(
            overall=88.5,
            space_efficiency=90.0,
            budget_fit=85.0,
            style_match=95.0,
            functionality=80.0,
            compatibility=100.0,
            sustainability=82.0
        )
        self.assertGreaterEqual(scores.overall, 0.0)
        self.assertLessEqual(scores.overall, 100.0)


if __name__ == "__main__":
    unittest.main()
