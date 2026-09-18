"""
Unit tests for Bill of Materials (BOM) & Export Engine (Stage 5)
"""

import unittest
from backend.services.catalog_service import CatalogService
from engine.bom import BOMGenerator


class TestBOMGenerator(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()
        self.generator = BOMGenerator(self.catalog)
        self.product_ids = ["K-MODERNLIFE-03", "K-HARKEN-VANITY-01", "K-PURIST-01", "K-STATEMENT-01"]

    def test_bom_generation_and_financial_math(self):
        bom = self.generator.generate_bom(
            product_ids=self.product_ids,
            project_title="Contemporary Master Suite",
            room_dimensions="10.0 x 8.0 ft",
            theme_style="Contemporary",
            gst_rate=18.0
        )

        self.assertEqual(len(bom.line_items), 4)
        self.assertEqual(bom.total_fixture_count, 4)

        # Expected subtotal: 38000 + 85000 + 28500 + 49000 = 200,500
        expected_subtotal = 200500
        self.assertEqual(bom.financial_summary.subtotal_inr, expected_subtotal)

        # 18% GST: 200,500 * 0.18 = 36,090
        expected_gst = 36090
        self.assertEqual(bom.financial_summary.gst_amount_inr, expected_gst)
        self.assertEqual(bom.financial_summary.total_with_gst_inr, expected_subtotal + expected_gst)

        # 10% Rough-in contingency: 20,050
        expected_rough_in = 20050
        self.assertEqual(bom.financial_summary.rough_in_contingency_inr, expected_rough_in)

        # Grand project total: 200,500 + 36,090 + 20,050 = 256,640
        self.assertEqual(bom.financial_summary.grand_project_total_inr, 256640)

    def test_csv_export_format(self):
        bom = self.generator.generate_bom(self.product_ids)
        csv_text = bom.to_csv()

        self.assertIn("KOHLER OFFICIAL SPECIFICATION BILL OF MATERIALS", csv_text)
        self.assertIn("Item #,SKU / ID,KOHLER Model No.,Product Name", csv_text)
        # Internal ID still present in SKU column
        self.assertIn("K-MODERNLIFE-03", csv_text)
        # Official model number present in Model No. column
        self.assertIn("K-77767IN-0", csv_text)
        self.assertIn("FINANCIAL SUMMARY", csv_text)
        self.assertIn("ESTIMATED GRAND PROJECT TOTAL", csv_text)

    def test_markdown_export_format(self):
        bom = self.generator.generate_bom(self.product_ids)
        md_text = bom.to_markdown()

        self.assertIn("# Kohler Official Specification Sheet & Bill of Materials", md_text)
        self.assertIn("| Item | KOHLER Model No. | Product Description |", md_text)
        # Markdown shows official model numbers
        self.assertIn("`K-77767IN-0`", md_text)
        self.assertIn("### Financial Summary", md_text)

    def test_html_printable_spec_sheet(self):
        bom = self.generator.generate_bom(self.product_ids)
        html_text = bom.to_html_spec_sheet()

        self.assertIn("<!DOCTYPE html>", html_text)
        self.assertIn("KOHLER", html_text)
        self.assertIn("@media print", html_text)
        self.assertIn("ESTIMATED GRAND TOTAL", html_text)
        # HTML shows official model number (K-77767IN-0) not the internal ID
        self.assertIn("K-77767IN-0", html_text)


if __name__ == "__main__":
    unittest.main()
