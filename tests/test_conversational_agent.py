"""
Unit tests for Conversational Redesign Agent
"""

import unittest
from backend.services.catalog_service import CatalogService
from backend.models.requirements import DesignRequirements, RoomDimensions, PriorityWeights
from backend.orchestration.conversational_agent import (
    ConversationalDesignAgent,
    ConversationalRedesignRequest
)


class TestConversationalAgent(unittest.TestCase):
    def setUp(self):
        self.catalog = CatalogService()
        self.agent = ConversationalDesignAgent(self.catalog)
        self.initial_reqs = DesignRequirements(
            dimensions=RoomDimensions(length=10, width=8, unit="ft"),
            budget_max=300000,
            required_categories=["toilet", "vanity", "faucet", "shower"],
            style_preferences=["modern"]
        )
        self.initial_products = ["K-MODERNLIFE-03", "K-HARKEN-VANITY-01", "K-PURIST-01", "K-STATEMENT-01"]

    def test_luxury_upgrade_modification(self):
        req = ConversationalRedesignRequest(
            user_message="Make it more luxurious, please.",
            current_requirements=self.initial_reqs,
            selected_product_ids=self.initial_products
        )
        res = self.agent.process_redesign(req)
        self.assertEqual(res.intent, "luxury_upgrade")
        self.assertIn("luxury", res.updated_requirements.style_preferences)
        self.assertTrue(res.is_feasible)
        self.assertGreater(len(res.grounded_explanation["evidence_citations"]), 0)

    def test_budget_reduction_modification(self):
        req = ConversationalRedesignRequest(
            user_message="Reduce the budget by ₹20,000",
            current_requirements=self.initial_reqs,
            selected_product_ids=self.initial_products
        )
        res = self.agent.process_redesign(req)
        self.assertEqual(res.intent, "budget_reduction")
        self.assertEqual(res.updated_requirements.budget_max, 280000)
        self.assertLessEqual(res.updated_design.total_price_inr, 280000)

    def test_keep_fixture_lock_preservation(self):
        # Initial toilet is K-MODERNLIFE-03
        req = ConversationalRedesignRequest(
            user_message="Keep the toilet but change everything else.",
            current_requirements=self.initial_reqs,
            selected_product_ids=self.initial_products
        )
        res = self.agent.process_redesign(req)
        self.assertEqual(res.intent, "fixture_lock")
        # Ensure K-MODERNLIFE-03 is preserved in updated design
        self.assertIn("K-MODERNLIFE-03", res.updated_design.product_ids)
        self.assertGreater(len(res.preserved_fixtures), 0)

    def test_eco_priority_modification(self):
        req = ConversationalRedesignRequest(
            user_message="Prioritize water saving and sustainability.",
            current_requirements=self.initial_reqs,
            selected_product_ids=self.initial_products
        )
        res = self.agent.process_redesign(req)
        self.assertEqual(res.intent, "eco_priority")
        self.assertGreaterEqual(res.updated_design.scores.sustainability, 70.0)

    def test_remove_bathtub_modification(self):
        reqs_with_bath = self.initial_reqs.model_copy(deep=True)
        reqs_with_bath.required_categories.append("bathtub")

        req = ConversationalRedesignRequest(
            user_message="I don't want a bathtub.",
            current_requirements=reqs_with_bath,
            selected_product_ids=self.initial_products + ["K-UNDERSCORE-01"]
        )
        res = self.agent.process_redesign(req)
        self.assertEqual(res.intent, "category_exclusion")
        self.assertIn("bathtub", res.updated_requirements.excluded_categories)
        self.assertNotIn("bathtub", res.updated_requirements.required_categories)

    def test_matte_black_finish_modification(self):
        req = ConversationalRedesignRequest(
            user_message="Use matte black finishes for all fixtures.",
            current_requirements=self.initial_reqs,
            selected_product_ids=self.initial_products
        )
        res = self.agent.process_redesign(req)
        self.assertEqual(res.intent, "finish_customization")
        self.assertIn("matte_black", res.updated_requirements.finish_preferences)

    def test_cheapest_feasible_modification(self):
        req = ConversationalRedesignRequest(
            user_message="Give me the cheapest budget version.",
            current_requirements=self.initial_reqs,
            selected_product_ids=self.initial_products
        )
        res = self.agent.process_redesign(req)
        self.assertEqual(res.intent, "cost_minimization")
        self.assertTrue(res.is_feasible)
        self.assertLessEqual(res.updated_design.total_price_inr, self.initial_reqs.budget_max)

    def test_conversational_undo_and_diff(self):
        session_id = "test_undo_session_01"
        # Turn 1: Initial state
        req1 = ConversationalRedesignRequest(
            session_id=session_id,
            user_message="Make it more luxurious",
            current_requirements=self.initial_reqs,
            selected_product_ids=self.initial_products
        )
        res1 = self.agent.process_redesign(req1)
        self.assertEqual(res1.intent, "luxury_upgrade")
        self.assertEqual(res1.history_turn, 1)

        # Turn 2: Second modification
        req2 = ConversationalRedesignRequest(
            session_id=session_id,
            user_message="Prioritize water saving instead",
            current_requirements=res1.updated_requirements,
            selected_product_ids=res1.updated_design.product_ids
        )
        res2 = self.agent.process_redesign(req2)
        self.assertEqual(res2.intent, "eco_priority")
        self.assertTrue(res2.can_undo)
        self.assertEqual(res2.history_turn, 2)

        # Turn 3: Undo modification
        req3 = ConversationalRedesignRequest(
            session_id=session_id,
            user_message="Undo my last change",
            current_requirements=res2.updated_requirements,
            selected_product_ids=res2.updated_design.product_ids
        )
        res3 = self.agent.process_redesign(req3)
        self.assertEqual(res3.intent, "rollback_revert")
        self.assertEqual(res3.updated_design.mode, res1.updated_design.mode)
        self.assertEqual(res3.history_turn, 1)


if __name__ == "__main__":
    unittest.main()
