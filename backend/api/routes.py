"""
API Routes for Kohler AI Bathroom Designer
Includes Stage 1, Stage 2, Stage 3, and Stage 4 Endpoints:
- Catalog and taxonomies
- Deterministic constraint validation
- 2D Spatial layout generation & validation
- Semantic RAG product search
- Multi-objective bundle optimization & design alternatives
- Natural language requirement extraction
- Multimodal bathroom image / floor-plan vision analysis
- Conversational redesign agent with state preservation
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.models.product import KohlerProduct
from backend.models.requirements import DesignRequirements
from backend.models.design import SpatialLayout, FixturePlacement, DesignAlternative
from backend.services.catalog_service import CatalogService
from engine.geometry.layout_generator import LayoutGenerator
from engine.constraints.spatial_validator import validate_spatial_layout, SpatialValidationResult
from engine.optimization.bundle_optimizer import BundleOptimizer
from ai.retrieval.product_retriever import GroundedProductRetriever
from ai.services.requirement_extractor import RequirementExtractor
from ai.vision.image_analyzer import BathroomVisionAnalyzer, VisionAnalysisResponse
from backend.orchestration.conversational_agent import (
    ConversationalDesignAgent,
    ConversationalRedesignRequest,
    ConversationalRedesignResponse
)
from engine.sustainability import (
    SustainabilityCalculator,
    SustainabilityReport,
    HouseholdUsageModel
)
from engine.tradeoffs import (
    WhatIfAnalyzer,
    WhatIfQueryRequest,
    WhatIfAnalysisResult,
    AlternativeComparisonReport
)
from engine.bom import (
    BOMGenerator,
    BillOfMaterials
)
from ai.evaluation import (
    AIEvaluationSuite,
    EvaluationSuiteSummary
)

router = APIRouter(prefix="/api", tags=["API"])

# Initialize singletons
catalog_service = CatalogService()
retriever = GroundedProductRetriever(catalog_service)
optimizer = BundleOptimizer(catalog_service)
conversational_agent = ConversationalDesignAgent(catalog_service)
sustainability_calc = SustainabilityCalculator()
whatif_analyzer = WhatIfAnalyzer(catalog_service)
bom_generator = BOMGenerator(catalog_service)
eval_suite = AIEvaluationSuite(catalog_service)


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "KOHLER AI Bathroom Designer API"
    version: str = "1.0.0"
    stage: str = "Stage 6: Advanced Visualization, Polished AI Experience & Production Readiness"
    catalog_products_count: int
    available_categories: List[str]


class ConstraintValidationRequest(BaseModel):
    requirements: DesignRequirements
    selected_product_ids: List[str] = Field(default_factory=list)
    layout: Optional[SpatialLayout] = None


class ConstraintValidationResponse(BaseModel):
    is_feasible: bool
    total_cost_inr: int
    budget_ceiling_inr: int
    budget_headroom_inr: int
    budget_exceeded: bool
    missing_required_categories: List[str]
    excluded_categories_found: List[str]
    compatibility_report: Dict[str, Any]
    spatial_validation: Optional[Dict[str, Any]] = None
    violations: List[str]


class GenerateLayoutRequest(BaseModel):
    room_length: float = Field(..., gt=0, description="Length of bathroom in feet")
    room_width: float = Field(..., gt=0, description="Width of bathroom in feet")
    product_ids: List[str] = Field(default_factory=list, description="List of Kohler product SKUs to place")


class GenerateLayoutResponse(BaseModel):
    layout: SpatialLayout
    spatial_validation: Dict[str, Any]


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., description="Natural language search query")
    category: Optional[str] = None
    style: Optional[str] = None
    max_price: Optional[int] = None
    min_price: Optional[int] = None
    water_saving_only: bool = False
    top_k: int = Field(default=5, ge=1, le=20)


class SearchResultItem(BaseModel):
    product: KohlerProduct
    similarity_score: float
    evidence_snippet: str


class TextRequirementRequest(BaseModel):
    text: str = Field(..., description="Free-form customer prompt or design description")


class ImageAnalysisRequest(BaseModel):
    image_data: Optional[str] = Field(default=None, description="Base64 encoded image data if available")
    filename: Optional[str] = Field(default=None, description="Image file name for context hints")
    notes: Optional[str] = Field(default=None, description="Customer visual description or notes")


class SustainabilityCalculationRequest(BaseModel):
    product_ids: List[str]
    occupants: int = 4
    flushes_per_person_day: float = 5.0
    shower_minutes_per_person_day: float = 8.0
    faucet_minutes_per_person_day: float = 3.0
    utility_rate_inr_per_liter: float = 0.045


class AlternativeComparisonRequest(BaseModel):
    design_a: DesignAlternative
    design_b: DesignAlternative


class BOMGenerationRequest(BaseModel):
    product_ids: List[str]
    project_title: str = "Kohler Master Bathroom Design"
    room_dimensions: str = "10.0 x 8.0 ft"
    theme_style: str = "Modern"
    gst_rate: float = 18.0


class BOMExportRequest(BaseModel):
    product_ids: List[str]
    export_format: str = Field(default="csv", description="'csv' | 'json' | 'html' | 'markdown'")
    project_title: str = "Kohler Master Bathroom Design"
    room_dimensions: str = "10.0 x 8.0 ft"
    theme_style: str = "Modern"
    gst_rate: float = 18.0


class BOMExportResponse(BaseModel):
    format: str
    filename: str
    content: str
    mime_type: str


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check, version, and catalog status."""
    return HealthResponse(
        catalog_products_count=catalog_service.total_products,
        available_categories=catalog_service.get_categories()
    )


@router.get("/catalog", response_model=List[KohlerProduct])
def get_catalog(
    category: Optional[str] = Query(None, description="Filter by category"),
    style: Optional[str] = Query(None, description="Filter by aesthetic style"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price in INR"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price in INR"),
    finish: Optional[str] = Query(None, description="Filter by finish"),
    water_saving_only: bool = Query(False, description="Only show certified water-efficient fixtures")
):
    """Retrieve catalog products with structured metadata filtering."""
    return catalog_service.list_products(
        category=category,
        style=style,
        max_price=max_price,
        min_price=min_price,
        finish=finish,
        water_saving_only=water_saving_only
    )


@router.get("/catalog/{product_id}", response_model=KohlerProduct)
def get_product_by_id(product_id: str):
    """Fetch individual grounded Kohler product by SKU/ID."""
    prod = catalog_service.get_product(product_id)
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kohler product with ID '{product_id}' was not found in catalog."
        )
    return prod


@router.get("/categories", response_model=List[str])
def get_categories():
    """List all available product categories."""
    return catalog_service.get_categories()


@router.get("/styles", response_model=List[str])
def get_styles():
    """List all available design themes and styles."""
    return catalog_service.get_styles()


@router.get("/finishes", response_model=List[str])
def get_finishes():
    """List all available material finishes."""
    return catalog_service.get_all_finishes()


@router.post("/layout/generate", response_model=GenerateLayoutResponse)
def generate_layout_endpoint(payload: GenerateLayoutRequest):
    """Stage 2: Procedural 2D perimeter layout generation."""
    products = []
    for pid in payload.product_ids:
        p = catalog_service.get_product(pid)
        if p:
            products.append(p)

    generator = LayoutGenerator(room_length=payload.room_length, room_width=payload.room_width)
    layout = generator.generate_layout(products)
    val = validate_spatial_layout(layout)

    return GenerateLayoutResponse(
        layout=layout,
        spatial_validation=val.to_dict()
    )


@router.post("/layout/validate", response_model=Dict[str, Any])
def validate_layout_endpoint(layout: SpatialLayout):
    """Stage 2: Validates a 2D spatial arrangement against physical constraints."""
    val = validate_spatial_layout(layout)
    return val.to_dict()


@router.post("/retrieval/search", response_model=List[SearchResultItem])
def search_products_endpoint(payload: SemanticSearchRequest):
    """Stage 3: Hybrid semantic vector search over Kohler product specs."""
    return retriever.search(
        query=payload.query,
        category=payload.category,
        style=payload.style,
        max_price=payload.max_price,
        min_price=payload.min_price,
        water_saving_only=payload.water_saving_only,
        top_k=payload.top_k
    )


@router.post("/optimizer/generate-alternatives", response_model=List[DesignAlternative])
def generate_design_alternatives_endpoint(requirements: DesignRequirements):
    """Stage 3: Multi-objective bundle optimizer (5 suites)."""
    return optimizer.generate_alternatives(requirements)


@router.post("/ai/extract-requirements", response_model=DesignRequirements)
def extract_requirements_endpoint(payload: TextRequirementRequest):
    """
    Stage 4: Extracts structured DesignRequirements from natural language user input.
    """
    return RequirementExtractor.extract_from_text(payload.text)


@router.post("/ai/analyze-image", response_model=VisionAnalysisResponse)
def analyze_image_endpoint(payload: ImageAnalysisRequest):
    """
    Stage 4: Multimodal vision analysis of bathroom photograph or floor plan.
    """
    return BathroomVisionAnalyzer.analyze_image(
        image_data=payload.image_data,
        filename=payload.filename,
        notes=payload.notes
    )


@router.post("/ai/conversational-redesign", response_model=ConversationalRedesignResponse)
def conversational_redesign_endpoint(payload: ConversationalRedesignRequest):
    """
    Stage 4: Conversational redesign agent.
    Translates user instruction, preserves locked/unaffected fixtures,
    re-optimizes, and re-validates against hard constraints.
    """
    return conversational_agent.process_redesign(payload)


@router.post("/validate-constraints", response_model=ConstraintValidationResponse)
def validate_constraints(payload: ConstraintValidationRequest):
    """
    Deterministic constraint validation (Section 8, 9 & 10).
    Evaluates budget ceiling, required/excluded categories, compatibility, and spatial constraints.
    """
    reqs = payload.requirements
    selected_ids = payload.selected_product_ids
    violations = []

    # Retrieve products
    selected_products: List[KohlerProduct] = []
    for pid in selected_ids:
        p = catalog_service.get_product(pid)
        if p:
            selected_products.append(p)
        else:
            violations.append(f"Product ID '{pid}' does not exist in the authorized Kohler catalog.")

    # 1. Budget check
    total_cost = sum(p.price_inr for p in selected_products)
    budget_exceeded = total_cost > reqs.budget_max
    headroom = reqs.budget_max - total_cost

    if budget_exceeded:
        violations.append(
            f"Budget ceiling exceeded: Total cost ₹{total_cost:,} exceeds max budget ₹{reqs.budget_max:,} by ₹{abs(headroom):,}."
        )

    # 2. Required categories
    present_categories = {p.category.lower() for p in selected_products}
    if "smart_toilet" in present_categories:
        present_categories.add("toilet")

    missing_cats = [
        cat for cat in reqs.required_categories
        if cat.lower() not in present_categories
    ]
    if missing_cats:
        violations.append(f"Missing required categories: {', '.join(missing_cats)}.")

    # 3. Excluded categories
    excluded_found = [
        cat for cat in reqs.excluded_categories
        if cat.lower() in present_categories
    ]
    if excluded_found:
        violations.append(f"Contains excluded categories: {', '.join(excluded_found)}.")

    # 4. Compatibility check
    compat_report = catalog_service.check_compatibility(selected_ids)
    if not compat_report["is_compatible"]:
        for conflict in compat_report["conflicts"]:
            violations.append(f"Compatibility conflict between {conflict['product_a']} and {conflict['product_b']}: {conflict['reason']}")

    # 5. Spatial check
    spatial_dict = None
    if payload.layout:
        val = validate_spatial_layout(payload.layout)
        spatial_dict = val.to_dict()
        if not val.is_feasible:
            violations.extend(val.violations)

    is_feasible = len(violations) == 0

    return ConstraintValidationResponse(
        is_feasible=is_feasible,
        total_cost_inr=total_cost,
        budget_ceiling_inr=reqs.budget_max,
        budget_headroom_inr=headroom,
        budget_exceeded=budget_exceeded,
        missing_required_categories=missing_cats,
        excluded_categories_found=excluded_found,
        compatibility_report=compat_report,
        spatial_validation=spatial_dict,
        violations=violations
    )


# =========================================================================
# STAGE 5: SUSTAINABILITY, WHAT-IF TRADE-OFFS & BOM EXPORT ENDPOINTS
# =========================================================================

@router.post("/sustainability/calculate", response_model=SustainabilityReport)
def calculate_sustainability_endpoint(payload: SustainabilityCalculationRequest):
    """
    Stage 5: Calculates quantified annual water consumption, baseline comparisons,
    financial utility savings, and carbon offsets for a fixture bundle.
    """
    products = [catalog_service.get_product(pid) for pid in payload.product_ids if catalog_service.get_product(pid)]
    model = HouseholdUsageModel(
        occupants=payload.occupants,
        flushes_per_person_day=payload.flushes_per_person_day,
        shower_minutes_per_person_day=payload.shower_minutes_per_person_day,
        faucet_minutes_per_person_day=payload.faucet_minutes_per_person_day,
        utility_rate_inr_per_liter=payload.utility_rate_inr_per_liter
    )
    return sustainability_calc.calculate_bundle_sustainability(products, model)


@router.post("/tradeoffs/whatif", response_model=WhatIfAnalysisResult)
def whatif_scenario_endpoint(payload: WhatIfQueryRequest):
    """
    Stage 5: Evaluates quantified what-if sensitivity questions:
    - What do I gain by spending ₹25,000 more?
    - What happens if I remove the bathtub?
    - Which change gives the biggest water saving?
    - Can I make this design fit a smaller bathroom?
    - Which product is causing the budget problem?
    """
    return whatif_analyzer.analyze_scenario(payload)


@router.post("/tradeoffs/compare", response_model=AlternativeComparisonReport)
def compare_alternatives_endpoint(payload: AlternativeComparisonRequest):
    """
    Stage 5: Generates a quantified side-by-side Pareto comparison between two design suites.
    """
    return whatif_analyzer.compare_alternatives(
        payload.design_a,
        payload.design_b,
        catalog_service
    )


@router.post("/bom/generate", response_model=BillOfMaterials)
def generate_bom_endpoint(payload: BOMGenerationRequest):
    """
    Stage 5: Generates a grounded Bill of Materials (BOM) with itemized prices,
    GST tax calculations, rough-in contingency, and installation guidelines.
    """
    return bom_generator.generate_bom(
        product_ids=payload.product_ids,
        project_title=payload.project_title,
        room_dimensions=payload.room_dimensions,
        theme_style=payload.theme_style,
        gst_rate=payload.gst_rate
    )


@router.post("/bom/export", response_model=BOMExportResponse)
def export_bom_endpoint(payload: BOMExportRequest):
    """
    Stage 5: Exports the Bill of Materials to CSV, JSON, Markdown, or printable Luxury HTML.
    """
    bom = bom_generator.generate_bom(
        product_ids=payload.product_ids,
        project_title=payload.project_title,
        room_dimensions=payload.room_dimensions,
        theme_style=payload.theme_style,
        gst_rate=payload.gst_rate
    )

    fmt = payload.export_format.lower()
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")

    if fmt == "csv":
        content = bom.to_csv()
        mime = "text/csv"
        filename = f"Kohler_BOM_{timestamp_str}.csv"
    elif fmt == "html":
        content = bom.to_html_spec_sheet()
        mime = "text/html"
        filename = f"Kohler_SpecSheet_{timestamp_str}.html"
    elif fmt == "markdown" or fmt == "md":
        content = bom.to_markdown()
        mime = "text/markdown"
        filename = f"Kohler_BOM_{timestamp_str}.md"
    else:
        # Default JSON
        content = json.dumps(bom.model_dump(), indent=2)
        mime = "application/json"
        filename = f"Kohler_BOM_{timestamp_str}.json"

    return BOMExportResponse(
        format=fmt,
        filename=filename,
        content=content,
        mime_type=mime
    )


@router.get("/ai/evaluation", response_model=EvaluationSuiteSummary)
def run_evaluation_benchmark():
    """
    Stage 6: Runs comprehensive benchmark evaluation across 6 systematic scenarios
    from Sections 20-22 of the Kohler AI Bathroom Designer Specification.
    """
    return eval_suite.run_all_benchmarks()

