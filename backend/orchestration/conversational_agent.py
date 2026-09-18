"""
Conversational Redesign Orchestration Agent
Matches Sections 13, 14, 20 & 21 of Kohler AI Bathroom Designer Specification.
Maintains conversational design state, translates natural language redesign requests,
preserves unaffected design decisions, and re-validates against deterministic constraints.
"""

from typing import Dict, Any, List, Optional, Tuple
import re
from pydantic import BaseModel, Field

from backend.models.requirements import DesignRequirements, PriorityWeights
from backend.models.design import DesignAlternative, SpatialLayout
from backend.models.product import KohlerProduct
from backend.services.catalog_service import CatalogService
from engine.optimization.bundle_optimizer import BundleOptimizer
from engine.constraints.spatial_validator import validate_spatial_layout
from engine.geometry.layout_generator import LayoutGenerator
from engine.scoring.bundle_scorer import BundleScorer


class ConversationalRedesignRequest(BaseModel):
    session_id: str = Field(default="default_session")
    user_message: str = Field(..., description="Natural language redesign instruction")
    current_requirements: DesignRequirements
    selected_product_ids: List[str] = Field(default_factory=list)


class ConversationalRedesignResponse(BaseModel):
    intent: str
    change_summary: str
    preserved_fixtures: List[str]
    updated_requirements: DesignRequirements
    updated_design: DesignAlternative
    grounded_explanation: Dict[str, Any]
    tradeoffs: List[str]
    is_feasible: bool
    violations: List[str]
    # Enhanced Stage 6 Conversational Capabilities
    added_fixtures: List[str] = Field(default_factory=list)
    removed_fixtures: List[str] = Field(default_factory=list)
    can_undo: bool = Field(default=False)
    history_turn: int = Field(default=1)


class ConversationalDesignAgent:
    def __init__(self, catalog_service: Optional[CatalogService] = None):
        self.catalog = catalog_service or CatalogService()
        self.optimizer = BundleOptimizer(self.catalog)
        self._sessions: Dict[str, List[Dict[str, Any]]] = {}

    def process_redesign(self, payload: ConversationalRedesignRequest) -> ConversationalRedesignResponse:
        """
        Interprets natural language modification, updates design parameters,
        preserves unaffected choices, tracks session history, and re-validates with deterministic engines.
        """
        msg = payload.user_message.strip().lower()
        session_id = payload.session_id or "default_session"
        if session_id not in self._sessions:
            self._sessions[session_id] = []

        history = self._sessions[session_id]

        # Handle Undo / Rollback Intent
        if "undo" in msg or "revert" in msg or "go back" in msg or "restore previous" in msg:
            if len(history) >= 2:
                # Discard the current state and take the previous one
                history.pop()
                previous_state = history[-1]
                target_alt = previous_state["design"]
                reqs = previous_state["requirements"]
                intent = "rollback_revert"
                change_summary = f"Reverted design back to turn #{len(history)} state."
                preserved_fixtures = [f"{p.name} ({p.id})" for p in target_alt.products]
                return ConversationalRedesignResponse(
                    intent=intent,
                    change_summary=change_summary,
                    preserved_fixtures=preserved_fixtures,
                    updated_requirements=reqs,
                    updated_design=target_alt,
                    grounded_explanation={
                        "intent_detected": intent,
                        "change_summary": change_summary,
                        "total_price_inr": target_alt.total_price_inr,
                        "budget_headroom_inr": target_alt.budget_headroom_inr,
                        "sustainability_score": target_alt.scores.sustainability,
                        "evidence_citations": [
                            f"{p.name} (₹{p.price_inr:,}): {', '.join(p.features[:2])}"
                            for p in target_alt.products[:3]
                        ]
                    },
                    tradeoffs=target_alt.tradeoffs,
                    is_feasible=target_alt.feasible,
                    violations=target_alt.infeasibility_reasons,
                    added_fixtures=[],
                    removed_fixtures=[],
                    can_undo=len(history) > 1,
                    history_turn=len(history)
                )

        reqs = payload.current_requirements.model_copy(deep=True)
        current_ids = list(payload.selected_product_ids)

        intent = "general_modification"
        change_summary = ""
        preserved_fixtures = []
        locked_product_ids = []

        # 1. Intent: "Make it more luxurious"
        if "luxur" in msg or "more premium" in msg or "opulent" in msg:
            intent = "luxury_upgrade"
            reqs.style_preferences = ["luxury", "contemporary"]
            if reqs.priority_weights:
                reqs.priority_weights.luxury = 0.45
                reqs.priority_weights.budget = 0.10
            change_summary = "Upgraded suite aesthetic to Classic Luxury with high-end fixtures and smart sanitization."

        # 2. Intent: "Reduce the budget by ₹X" / "Reduce price"
        elif "reduce" in msg and ("budget" in msg or "price" in msg or "cost" in msg):
            intent = "budget_reduction"
            # Extract reduction delta
            delta_match = re.search(r'(?:by|of)?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*)\b', msg)
            lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)\b', msg)

            reduction = 20000
            if lakh_match:
                reduction = int(float(lakh_match.group(1)) * 100000)
            elif delta_match:
                reduction = int(delta_match.group(1).replace(',', ''))

            reqs.budget_max = max(30000, reqs.budget_max - reduction)
            if reqs.priority_weights:
                reqs.priority_weights.budget = 0.40
            change_summary = f"Reduced budget ceiling by ₹{reduction:,} to ₹{reqs.budget_max:,}."

        # 3. Intent: "Keep the toilet but change everything else"
        elif "keep" in msg:
            intent = "fixture_lock"
            # Find which fixture category is requested to be kept
            kept_cat = "toilet"
            if "vanity" in msg:
                kept_cat = "vanity"
            elif "shower" in msg:
                kept_cat = "shower"
            elif "basin" in msg:
                kept_cat = "basin"

            for pid in current_ids:
                prod = self.catalog.get_product(pid)
                if prod and kept_cat in prod.category.lower():
                    locked_product_ids.append(pid)
                    preserved_fixtures.append(f"{prod.name} ({pid})")

            change_summary = f"Preserved {', '.join(preserved_fixtures)} while re-optimizing all remaining fixture categories."

        # 4. Intent: "Prioritize water saving" / "Eco"
        elif "water" in msg or "eco" in msg or "green" in msg:
            intent = "eco_priority"
            if reqs.priority_weights:
                reqs.priority_weights.sustainability = 0.50
                reqs.priority_weights.luxury = 0.10
            change_summary = "Prioritized WaterSense certifications, Katalyst air-induction flows, and dual-flush eco toilets."

        # 5. Intent: "I don't want a bathtub" / "Remove the bathtub"
        elif "bathtub" in msg and ("remove" in msg or "don't want" in msg or "no" in msg or "without" in msg):
            intent = "category_exclusion"
            if "bathtub" not in reqs.excluded_categories:
                reqs.excluded_categories.append("bathtub")
            if "bathtub" in reqs.required_categories:
                reqs.required_categories.remove("bathtub")
            change_summary = "Removed bathtub from design requirements, opening up bathroom floor area for circulation."

        # 6. Intent: "Use matte black / brass / chrome finishes"
        elif "black" in msg or "matte black" in msg:
            intent = "finish_customization"
            reqs.finish_preferences = ["matte_black"]
            change_summary = "Specified matte black finish across faucets, shower fittings, and vanity trim."
        elif "brass" in msg or "gold" in msg:
            intent = "finish_customization"
            reqs.finish_preferences = ["brushed_brass"]
            change_summary = "Specified Kohler French Gold / Brushed Moderne Brass finish across tapware."
        elif "chrome" in msg:
            intent = "finish_customization"
            reqs.finish_preferences = ["polished_chrome"]
            change_summary = "Specified brilliant Polished Chrome finish across fittings."

        # 7. Intent: Accessibility / Elder-friendly
        elif "elder" in msg or "senior" in msg or "accessible" in msg or "accessibility" in msg:
            intent = "accessibility_upgrade"
            if "bathtub" in reqs.required_categories:
                reqs.required_categories.remove("bathtub")
            if "bathtub" not in reqs.excluded_categories:
                reqs.excluded_categories.append("bathtub")
            if reqs.priority_weights:
                reqs.priority_weights.space = 0.40
                reqs.priority_weights.functionality = 0.40
            change_summary = "Optimized for barrier-free walk-in shower access, wider circulation envelopes, and ergonomic clearances."

        # 8. Intent: "More space / spacious"
        elif "more space" in msg or "spacious" in msg or "open" in msg:
            intent = "space_maximization"
            if reqs.priority_weights:
                reqs.priority_weights.space = 0.50
            change_summary = "Maximized usable clearance envelopes and open circulation pathways."

        # 9. Intent: "Cheapest feasible version"
        elif "cheapest" in msg or "budget" in msg:
            intent = "cost_minimization"
            if reqs.priority_weights:
                reqs.priority_weights.budget = 0.60
            change_summary = "Optimized bundle strictly for maximum cost efficiency and budget headroom."

        else:
            intent = "general_refinement"
            change_summary = f"Refined design parameters according to instruction: '{payload.user_message}'."

        # Re-run multi-objective optimization with updated requirements
        alternatives = self.optimizer.generate_alternatives(reqs)

        # Select the target alternative based on intent
        if intent == "luxury_upgrade":
            target_alt = next((a for a in alternatives if a.mode == "luxury"), alternatives[0])
        elif intent == "eco_priority":
            target_alt = next((a for a in alternatives if a.mode == "eco"), alternatives[0])
        elif intent in {"category_exclusion", "cost_minimization", "space_maximization", "accessibility_upgrade"}:
            target_alt = next((a for a in alternatives if a.mode == "space_saver"), alternatives[0])
        else:
            target_alt = next((a for a in alternatives if a.mode == "balanced"), alternatives[0])

        # Enforce locked fixtures if specified
        if locked_product_ids:
            updated_product_ids = list(target_alt.product_ids)
            for locked_id in locked_product_ids:
                locked_prod = self.catalog.get_product(locked_id)
                if not locked_prod:
                    continue
                # Replace fixture of same category with locked fixture
                updated_product_ids = [
                    pid for pid in updated_product_ids
                    if self.catalog.get_product(pid) and self.catalog.get_product(pid).category != locked_prod.category
                ]
                updated_product_ids.append(locked_id)

            # Re-fetch product objects
            final_products = [self.catalog.get_product(pid) for pid in updated_product_ids if self.catalog.get_product(pid)]

            # Re-generate layout & validate
            generator = LayoutGenerator(reqs.dimensions.length, reqs.dimensions.width)
            new_layout = generator.generate_layout(final_products)
            spatial_val = validate_spatial_layout(new_layout)

            # Re-calculate cost & scores
            total_price = sum(p.price_inr for p in final_products)
            headroom = reqs.budget_max - total_price
            scores = BundleScorer.evaluate_bundle(
                products=final_products,
                requirements=reqs,
                compat_report=self.catalog.check_compatibility(updated_product_ids),
                spatial_val=spatial_val
            )

            is_feasible = (total_price <= reqs.budget_max) and spatial_val.is_feasible
            violations = []
            if total_price > reqs.budget_max:
                violations.append(f"Budget ceiling exceeded by ₹{abs(headroom):,}.")
            if not spatial_val.is_feasible:
                violations.extend(spatial_val.violations)

            target_alt = DesignAlternative(
                design_id=f"redesign_{intent}_{int(reqs.dimensions.length)}x{int(reqs.dimensions.width)}",
                name=f"Redesigned ({intent.replace('_', ' ').title()})",
                mode=target_alt.mode,
                product_ids=updated_product_ids,
                products=final_products,
                total_price_inr=total_price,
                budget_headroom_inr=headroom,
                feasible=is_feasible,
                infeasibility_reasons=violations,
                scores=scores,
                layout=new_layout,
                explanation={
                    "theme_alignment": f"Preserved customer choices while refining for {intent.replace('_', ' ')}.",
                    "price_summary": f"Total price ₹{total_price:,} leaving ₹{headroom:,} headroom.",
                    "water_efficiency": f"Sustainability score: {scores.sustainability}/100."
                },
                assumptions=target_alt.assumptions,
                tradeoffs=[
                    f"Maintained locked fixture {', '.join(preserved_fixtures)}.",
                    f"Adjusted surrounding fixtures to fit ₹{reqs.budget_max:,} budget ceiling."
                ]
            )

        grounded_explanation = {
            "intent_detected": intent,
            "change_summary": change_summary,
            "total_price_inr": target_alt.total_price_inr,
            "budget_headroom_inr": target_alt.budget_headroom_inr,
            "sustainability_score": target_alt.scores.sustainability,
            "evidence_citations": [
                f"{p.name} (₹{p.price_inr:,}): {', '.join(p.features[:2])}"
                for p in target_alt.products[:3]
            ]
        }

        # Calculate added vs removed fixture diffs
        added_fixtures = [
            p.name for p in target_alt.products if p.id not in current_ids
        ]
        removed_fixtures = [
            self.catalog.get_product(pid).name
            for pid in current_ids
            if pid not in target_alt.product_ids and self.catalog.get_product(pid)
        ]

        # Record this turn in session history
        history.append({
            "design": target_alt,
            "requirements": reqs,
            "user_message": payload.user_message,
            "intent": intent
        })
        if len(history) > 10:
            history.pop(0)

        return ConversationalRedesignResponse(
            intent=intent,
            change_summary=change_summary,
            preserved_fixtures=preserved_fixtures,
            updated_requirements=reqs,
            updated_design=target_alt,
            grounded_explanation=grounded_explanation,
            tradeoffs=target_alt.tradeoffs,
            is_feasible=target_alt.feasible,
            violations=target_alt.infeasibility_reasons,
            added_fixtures=added_fixtures,
            removed_fixtures=removed_fixtures,
            can_undo=len(history) > 1,
            history_turn=len(history)
        )
