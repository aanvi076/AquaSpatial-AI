"""
Sustainability and Water-Efficiency Intelligence Engine
Matches Section 15 of Kohler AI Bathroom Designer Specification.
Calculates quantified annual water consumption, baseline comparisons, financial utility savings,
and carbon offsets based on verified product flow rates and transparent household usage models.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.models.product import KohlerProduct


class HouseholdUsageModel(BaseModel):
    occupants: int = Field(default=4, ge=1, le=15, description="Number of household residents")
    flushes_per_person_day: float = Field(default=5.0, ge=1.0, le=12.0, description="Average daily toilet flushes per person")
    shower_minutes_per_person_day: float = Field(default=8.0, ge=1.0, le=30.0, description="Average daily shower duration in minutes")
    faucet_minutes_per_person_day: float = Field(default=3.0, ge=0.5, le=15.0, description="Average daily basin handwash/teeth brushing faucet run time")
    utility_rate_inr_per_liter: float = Field(default=0.045, ge=0.01, le=0.20, description="Municipal and tanker water tariff in INR per liter (₹45/kL)")
    co2_kg_per_liter_water: float = Field(default=0.0003, description="Estimated municipal pumping and heating carbon factor (kg CO2e / liter)")


class FixtureWaterBreakdown(BaseModel):
    product_id: str
    name: str
    category: str
    flow_rate: float
    unit: str
    is_water_saving: bool
    annual_consumption_liters: float
    baseline_annual_liters: float
    annual_saved_liters: float
    savings_percent: float


class SustainabilityReport(BaseModel):
    annual_water_consumption_liters: float
    baseline_annual_water_liters: float
    annual_water_saved_liters: float
    annual_water_savings_percent: float
    annual_utility_cost_savings_inr: int
    carbon_offset_kg_co2: float
    aggregate_sustainability_score: float
    fixture_breakdowns: List[FixtureWaterBreakdown]
    certified_features: List[str]
    labeled_assumptions: List[str]


class SustainabilityCalculator:
    # Baseline non-efficient plumbing fixture benchmarks (National Building Code / standard conventional fittings)
    BASELINE_TOILET_LPF = 6.0    # Conventional single-flush toilet
    BASELINE_SHOWER_LPM = 9.5    # Standard un-aerated showerhead
    BASELINE_FAUCET_LPM = 8.3    # Standard non-aerated basin faucet

    @classmethod
    def calculate_bundle_sustainability(
        cls,
        products: List[KohlerProduct],
        model: Optional[HouseholdUsageModel] = None
    ) -> SustainabilityReport:
        """
        Computes annual water consumption and financial savings with transparent, verifiable grounding.
        """
        if model is None:
            model = HouseholdUsageModel()

        breakdowns: List[FixtureWaterBreakdown] = []
        total_bundle_liters = 0.0
        total_baseline_liters = 0.0
        certified_features_set = set()

        days_in_year = 365.0
        annual_flushes = model.occupants * model.flushes_per_person_day * days_in_year
        annual_shower_minutes = model.occupants * model.shower_minutes_per_person_day * days_in_year
        annual_faucet_minutes = model.occupants * model.faucet_minutes_per_person_day * days_in_year

        for p in products:
            # Collect sustainability attributes
            for attr in p.sustainability_attributes:
                certified_features_set.add(attr)

            wc = p.water_consumption
            cat = p.category.lower()

            if "toilet" in cat and wc and wc.unit.upper() == "LPF":
                fixture_liters = annual_flushes * wc.rate
                base_liters = annual_flushes * cls.BASELINE_TOILET_LPF
                saved = max(0.0, base_liters - fixture_liters)
                pct = (saved / base_liters * 100.0) if base_liters > 0 else 0.0

                breakdowns.append(FixtureWaterBreakdown(
                    product_id=p.id,
                    name=p.name,
                    category=p.category,
                    flow_rate=wc.rate,
                    unit=wc.unit,
                    is_water_saving=wc.is_water_saving,
                    annual_consumption_liters=round(fixture_liters, 1),
                    baseline_annual_liters=round(base_liters, 1),
                    annual_saved_liters=round(saved, 1),
                    savings_percent=round(pct, 1)
                ))
                total_bundle_liters += fixture_liters
                total_baseline_liters += base_liters

            elif "shower" in cat and wc and wc.unit.upper() == "LPM":
                fixture_liters = annual_shower_minutes * wc.rate
                base_liters = annual_shower_minutes * cls.BASELINE_SHOWER_LPM
                saved = max(0.0, base_liters - fixture_liters)
                pct = (saved / base_liters * 100.0) if base_liters > 0 else 0.0

                breakdowns.append(FixtureWaterBreakdown(
                    product_id=p.id,
                    name=p.name,
                    category=p.category,
                    flow_rate=wc.rate,
                    unit=wc.unit,
                    is_water_saving=wc.is_water_saving,
                    annual_consumption_liters=round(fixture_liters, 1),
                    baseline_annual_liters=round(base_liters, 1),
                    annual_saved_liters=round(saved, 1),
                    savings_percent=round(pct, 1)
                ))
                total_bundle_liters += fixture_liters
                total_baseline_liters += base_liters

            elif "faucet" in cat and wc and wc.unit.upper() == "LPM":
                fixture_liters = annual_faucet_minutes * wc.rate
                base_liters = annual_faucet_minutes * cls.BASELINE_FAUCET_LPM
                saved = max(0.0, base_liters - fixture_liters)
                pct = (saved / base_liters * 100.0) if base_liters > 0 else 0.0

                breakdowns.append(FixtureWaterBreakdown(
                    product_id=p.id,
                    name=p.name,
                    category=p.category,
                    flow_rate=wc.rate,
                    unit=wc.unit,
                    is_water_saving=wc.is_water_saving,
                    annual_consumption_liters=round(fixture_liters, 1),
                    baseline_annual_liters=round(base_liters, 1),
                    annual_saved_liters=round(saved, 1),
                    savings_percent=round(pct, 1)
                ))
                total_bundle_liters += fixture_liters
                total_baseline_liters += base_liters

        total_saved_liters = max(0.0, total_baseline_liters - total_bundle_liters)
        savings_percent = (total_saved_liters / total_baseline_liters * 100.0) if total_baseline_liters > 0 else 0.0
        utility_savings_inr = int(total_saved_liters * model.utility_rate_inr_per_liter)
        co2_offset = round(total_saved_liters * model.co2_kg_per_liter_water, 1)

        # Calculate composite sustainability score (0-100)
        # 50% from water savings % + 30% from certification count + 20% baseline efficiency
        cert_score = min(30.0, len(certified_features_set) * 10.0)
        water_score = min(50.0, (savings_percent / 40.0) * 50.0)
        aggregate_score = min(100.0, max(20.0, water_score + cert_score + 20.0))

        labeled_assumptions = [
            f"Household size: {model.occupants} occupants with regular daily usage.",
            f"Toilet usage: {model.flushes_per_person_day:.0f} flushes/person/day vs standard conventional {cls.BASELINE_TOILET_LPF} LPF.",
            f"Shower duration: {model.shower_minutes_per_person_day:.0f} mins/person/day vs standard conventional {cls.BASELINE_SHOWER_LPM} LPM.",
            f"Faucet run time: {model.faucet_minutes_per_person_day:.0f} mins/person/day vs standard conventional {cls.BASELINE_FAUCET_LPM} LPM.",
            f"Estimated blended municipal/tanker water utility tariff: ₹{model.utility_rate_inr_per_liter * 1000:.0f} per kiloliter (₹{model.utility_rate_inr_per_liter:.3f}/L).",
            f"Carbon abatement factor: {model.co2_kg_per_liter_water * 1000:.2f} kg CO2e per kiloliter from municipal pumping, treatment, and heating."
        ]

        return SustainabilityReport(
            annual_water_consumption_liters=round(total_bundle_liters, 1),
            baseline_annual_water_liters=round(total_baseline_liters, 1),
            annual_water_saved_liters=round(total_saved_liters, 1),
            annual_water_savings_percent=round(savings_percent, 1),
            annual_utility_cost_savings_inr=utility_savings_inr,
            carbon_offset_kg_co2=co2_offset,
            aggregate_sustainability_score=round(aggregate_score, 1),
            fixture_breakdowns=breakdowns,
            certified_features=sorted(list(certified_features_set)),
            labeled_assumptions=labeled_assumptions
        )
