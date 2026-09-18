"""
Unit tests for Multimodal Bathroom Vision Analyzer
"""

import unittest
from ai.vision.image_analyzer import BathroomVisionAnalyzer


class TestVisionAnalyzer(unittest.TestCase):
    def test_default_image_analysis(self):
        res = BathroomVisionAnalyzer.analyze_image()
        self.assertGreater(res.confidence_score, 0.7)
        self.assertGreater(len(res.detected_fixtures), 0)
        self.assertGreater(len(res.detected_doors), 0)
        self.assertGreater(len(res.uncertainties), 0)
        self.assertIn("length", res.detected_dimensions)
        self.assertIn("width", res.detected_dimensions)

    def test_zen_context_interpretation(self):
        res = BathroomVisionAnalyzer.analyze_image(filename="zen_bathroom_plan.png", notes="natural wood textures")
        self.assertIn("zen", res.detected_style_cues)
        self.assertEqual(res.detected_dimensions["length"], 9.0)
        self.assertEqual(res.detected_dimensions["width"], 7.0)

    def test_compact_powder_room_interpretation(self):
        res = BathroomVisionAnalyzer.analyze_image(filename="compact_powder_room.jpg")
        self.assertIn("space_saver", res.detected_style_cues)
        self.assertLessEqual(res.detected_dimensions["length"], 8.0)

    def test_bounding_boxes_and_palette(self):
        res = BathroomVisionAnalyzer.analyze_image(
            image_data="data:image/jpeg;base64,/9j/4AAQSkZJRg==",
            filename="master_bath_photo.jpg",
            notes="luxury master with marble tiles"
        )
        self.assertGreater(len(res.color_palette), 0)
        self.assertIsNotNone(res.image_metadata)
        self.assertTrue(res.image_metadata["has_image"])
        self.assertEqual(res.image_metadata["format"], "jpeg")
        # Ensure bounding boxes exist for fixtures
        for fixture in res.detected_fixtures:
            self.assertIsNotNone(fixture.bounding_box)
            self.assertEqual(len(fixture.bounding_box), 4)
            ymin, xmin, ymax, xmax = fixture.bounding_box
            self.assertLess(ymin, ymax)
            self.assertLess(xmin, xmax)
        # Ensure openings have bounding boxes
        for door in res.detected_doors:
            self.assertIsNotNone(door.bounding_box)
        self.assertIn(res.primary_plumbing_wall, ["left", "right", "top", "bottom"])


if __name__ == "__main__":
    unittest.main()
