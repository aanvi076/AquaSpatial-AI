"""
Kohler Product Data Schema
Matches Section 6 of Kohler AI Bathroom Designer Specification.
Every product fact is grounded, typed, and includes verification and provenance metadata.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class ProductDimensions(BaseModel):
    width: float = Field(..., description="Width in specified unit (usually ft or inches)")
    depth: float = Field(..., description="Depth / length in specified unit")
    height: float = Field(..., description="Height in specified unit")
    unit: str = Field(default="ft", description="Unit of measurement ('ft', 'in', or 'mm')")

    def to_feet(self) -> "ProductDimensions":
        """Convert dimensions to feet for standardized spatial calculations."""
        if self.unit == "ft":
            return self
        elif self.unit == "in":
            return ProductDimensions(
                width=round(self.width / 12.0, 3),
                depth=round(self.depth / 12.0, 3),
                height=round(self.height / 12.0, 3),
                unit="ft"
            )
        elif self.unit == "mm":
            return ProductDimensions(
                width=round(self.width / 304.8, 3),
                depth=round(self.depth / 304.8, 3),
                height=round(self.height / 304.8, 3),
                unit="ft"
            )
        return self


class WaterConsumption(BaseModel):
    rate: float = Field(default=0.0, description="Consumption rate value")
    unit: str = Field(default="LPF", description="e.g. LPF (Litres Per Flush) or LPM (Litres Per Minute)")
    is_water_saving: bool = Field(default=False, description="Certified water-efficient / green fixture")
    efficiency_rating: Optional[str] = Field(default=None, description="e.g. 'Kohler Eco-Flush', 'WaterSense'")


class KohlerProduct(BaseModel):
    id: str = Field(..., description="Unique product SKU / Kohler ID (e.g. 'K-NUMI2-01')")
    name: str = Field(..., description="Official commercial product title")
    category: str = Field(
        ..., 
        description="Core category: toilet, smart_toilet, vanity, basin, shower, bathtub, faucet, accessory"
    )
    subcategory: Optional[str] = Field(None, description="Granular subcategory (e.g. 'wall-hung', 'freestanding')")
    price_inr: int = Field(..., ge=0, description="Official catalog price in Indian Rupees (INR)")
    dimensions: ProductDimensions = Field(..., description="Physical dimensional footprint")
    styles: List[str] = Field(default_factory=list, description="Styles: minimalist, modern, luxury, zen, classic")
    finishes: List[str] = Field(default_factory=list, description="Available finishes: chrome, matte_black, brushed_brass, etc.")
    features: List[str] = Field(default_factory=list, description="Key Kohler proprietary features and technologies")
    water_consumption: Optional[WaterConsumption] = Field(default=None, description="Water consumption metrics")
    sustainability_attributes: List[str] = Field(default_factory=list, description="Green certifications, recycled content, eco modes")
    installation_requirements: List[str] = Field(default_factory=list, description="Plumbing/electrical prerequisites")
    compatible_product_ids: List[str] = Field(default_factory=list, description="Guaranteed compatible products")
    incompatible_product_ids: List[str] = Field(default_factory=list, description="Explicitly incompatible products")
    source_url: str = Field(default="", description="Official Kohler catalog / technical spec link")
    verification_status: str = Field(default="verified", description="'verified', 'pending', or 'provisional'")
    image_url: Optional[str] = Field(None, description="Product image path or URL")
    model_number: Optional[str] = Field(
        default=None,
        description="Official Kohler model number / catalogue SKU (e.g. 'K-3092-0'). "
                    "Sourced from official Kohler US and Kohler India product pages."
    )

