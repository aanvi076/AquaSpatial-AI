"""
Requirement Extraction and Design Input Schemas
Matches Section 4 & Section 21 of Kohler AI Bathroom Designer Specification.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class RoomDimensions(BaseModel):
    length: float = Field(..., gt=0, description="Length of bathroom (default in feet)")
    width: float = Field(..., gt=0, description="Width of bathroom (default in feet)")
    height: Optional[float] = Field(default=9.0, gt=0, description="Ceiling height in feet")
    unit: str = Field(default="ft", description="'ft' or 'm'")

    @property
    def area_sq_ft(self) -> float:
        """Area in square feet."""
        factor = 1.0 if self.unit == "ft" else 10.7639
        return round(self.length * self.width * factor, 2)


class PriorityWeights(BaseModel):
    space: float = Field(default=0.25, ge=0.0, le=1.0)
    budget: float = Field(default=0.20, ge=0.0, le=1.0)
    luxury: float = Field(default=0.20, ge=0.0, le=1.0)
    functionality: float = Field(default=0.15, ge=0.0, le=1.0)
    sustainability: float = Field(default=0.10, ge=0.0, le=1.0)
    compatibility: float = Field(default=0.10, ge=0.0, le=1.0)


class DesignRequirements(BaseModel):
    dimensions: RoomDimensions = Field(..., description="Bathroom spatial dimensions")
    budget_max: int = Field(..., gt=0, description="Maximum total budget in INR")
    budget_min: Optional[int] = Field(default=0, ge=0, description="Optional minimum budget floor")
    style_preferences: List[str] = Field(
        default_factory=lambda: ["modern"],
        description="e.g. ['minimalist', 'zen', 'classic_luxury', 'contemporary']"
    )
    finish_preferences: List[str] = Field(
        default_factory=list,
        description="e.g. ['matte_black', 'brushed_brass', 'polished_chrome']"
    )
    required_categories: List[str] = Field(
        default_factory=lambda: ["toilet", "basin", "faucet", "shower"],
        description="Must-have fixtures"
    )
    excluded_categories: List[str] = Field(
        default_factory=list,
        description="Must-avoid fixtures (e.g. 'bathtub')"
    )
    priority_weights: PriorityWeights = Field(default_factory=PriorityWeights)
    special_requirements: List[str] = Field(
        default_factory=list,
        description="Natural language or specific user requests"
    )
    uncertainties: List[str] = Field(
        default_factory=list,
        description="Assumptions or uncertainties extracted during analysis"
    )
