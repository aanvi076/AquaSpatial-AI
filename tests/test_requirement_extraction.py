"""
Unit tests for Natural Language Requirement Extractor
"""

import unittest
from ai.services.requirement_extractor import RequirementExtractor


class TestRequirementExtractor(unittest.TestCase):
    def test_dimensions_and_budget_extraction(self):
        text = "I need a bathroom design for an 8x6 ft space with a maximum budget of 2.5 lakhs."
        reqs = RequirementExtractor.extract_from_text(text)

        self.assertEqual(reqs.dimensions.length, 8.0)
        self.assertEqual(reqs.dimensions.width, 6.0)
        self.assertEqual(reqs.dimensions.unit, "ft")
        self.assertEqual(reqs.budget_max, 250000)

    def test_style_and_category_exclusions(self):
        text = "Design a Japanese Zen minimalist master bathroom. I want a smart toilet and shower, but no bathtub."
        reqs = RequirementExtractor.extract_from_text(text)

        self.assertIn("zen", reqs.style_preferences)
        self.assertIn("minimalist", reqs.style_preferences)
        self.assertIn("bathtub", reqs.excluded_categories)
        self.assertNotIn("bathtub", reqs.required_categories)
        self.assertTrue("toilet" in reqs.required_categories or "smart_toilet" in reqs.required_categories)

    def test_finish_and_priority_weighting(self):
        text = "Modern bathroom with matte black fittings. Please prioritize water saving and eco features."
        reqs = RequirementExtractor.extract_from_text(text)

        self.assertIn("matte_black", reqs.finish_preferences)
        self.assertGreater(reqs.priority_weights.sustainability, 0.20)

    def test_currency_symbol_budget(self):
        text = "Budget is ₹1,80,000 for a 10 by 8 feet room."
        reqs = RequirementExtractor.extract_from_text(text)

        self.assertEqual(reqs.budget_max, 180000)
        self.assertEqual(reqs.dimensions.length, 10.0)
        self.assertEqual(reqs.dimensions.width, 8.0)


if __name__ == "__main__":
    unittest.main()
