"""
Unit tests for AI Evaluation Benchmark Suite
Matches Sections 20-22 of Kohler AI Bathroom Designer Specification.
"""

import unittest
from backend.services.catalog_service import CatalogService
from ai.evaluation.eval_suite import AIEvaluationSuite, EvaluationSuiteSummary


class TestAIEvaluationSuite(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()
        self.suite = AIEvaluationSuite(self.catalog)

    def test_run_all_benchmarks(self):
        summary: EvaluationSuiteSummary = self.suite.run_all_benchmarks()

        self.assertEqual(summary.total_benchmarks, 6)
        self.assertEqual(len(summary.results), 6)
        self.assertGreaterEqual(summary.pass_rate_percent, 80.0)
        self.assertEqual(summary.grounding_rate_percent, 100.0)
        self.assertEqual(summary.deterministic_constraint_accuracy_percent, 100.0)
        self.assertGreater(summary.average_latency_ms, 0)

        # Check individual scenario coverage
        scenario_ids = [r.scenario_id for r in summary.results]
        self.assertIn("BENCH-01", scenario_ids)  # Standard master bath
        self.assertIn("BENCH-02", scenario_ids)  # Luxury suite
        self.assertIn("BENCH-03", scenario_ids)  # Conflicting requirements
        self.assertIn("BENCH-04", scenario_ids)  # Budget strain
        self.assertIn("BENCH-05", scenario_ids)  # NL ambiguity
        self.assertIn("BENCH-06", scenario_ids)  # Eco priority

        # Verify no unverified/hallucinated SKUs in any benchmark
        for r in summary.results:
            self.assertEqual(r.unverified_skus_count, 0)
            self.assertTrue(r.deterministic_constraint_pass)


if __name__ == "__main__":
    unittest.main()

