"""
Design Bundle and Layout Schemas
Matches Section 9 & Section 21 of Kohler AI Bathroom Designer Specification.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from backend.models.product import KohlerProduct


class FixturePlacement(BaseModel):
    product_id: str = Field(..., description="Kohler Product ID")
    category: str = Field(..., description="Fixture category")
    x: float = Field(..., description="X coordinate in feet from top-left origin")
    y: float = Field(..., description="Y coordinate in feet from top-left origin")
    width: float = Field(..., description="Placed width in feet")
    depth: float = Field(..., description="Placed depth in feet")
    rotation: int = Field(default=0, description="Rotation angle in degrees (0, 90, 180, 270)")
    clearance_front: float = Field(default=2.0, description="Required front clearance zone in feet")
    zone: str = Field(default="general", description="'dry', 'wet', 'vanity', 'sanitary'")


class SpatialLayout(BaseModel):
    room_length: float = Field(..., description="Room length in feet")
    room_width: float = Field(..., description="Room width in feet")
    placements: List[FixturePlacement] = Field(default_factory=list)
    doors: List[Dict[str, Any]] = Field(default_factory=list)
    windows: List[Dict[str, Any]] = Field(default_factory=list)
    has_collisions: bool = Field(default=False)
    usable_area_ratio: float = Field(default=1.0, ge=0.0, le=1.0)


class DesignScores(BaseModel):
    overall: float = Field(..., ge=0.0, le=100.0)
    space_efficiency: float = Field(..., ge=0.0, le=100.0)
    budget_fit: float = Field(..., ge=0.0, le=100.0)
    style_match: float = Field(..., ge=0.0, le=100.0)
    functionality: float = Field(..., ge=0.0, le=100.0)
    compatibility: float = Field(..., ge=0.0, le=100.0)
    sustainability: float = Field(..., ge=0.0, le=100.0)


class DesignAlternative(BaseModel):
    design_id: str = Field(..., description="Unique ID for this design option")
    name: str = Field(..., description="e.g. 'Balanced Kohler Suite', 'Eco Connoisseur'")
    mode: str = Field(
        ...,
        description="'balanced' | 'luxury' | 'eco' | 'space_saver' | 'personalized'"
    )
    product_ids: List[str] = Field(default_factory=list)
    products: List[KohlerProduct] = Field(default_factory=list)
    total_price_inr: int = Field(..., ge=0)
    budget_headroom_inr: int = Field(default=0)
    feasible: bool = Field(default=True)
    infeasibility_reasons: List[str] = Field(default_factory=list)
    scores: DesignScores
    layout: Optional[SpatialLayout] = None
    explanation: Dict[str, Any] = Field(
        default_factory=dict,
        description="Evidence-grounded rationale for theme, products, water efficiency, and trade-offs"
    )
    assumptions: List[str] = Field(default_factory=list)
    tradeoffs: List[str] = Field(default_factory=list)
