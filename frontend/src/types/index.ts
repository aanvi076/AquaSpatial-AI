export interface ProductDimensions {
  width: number;
  depth: number;
  height: number;
  unit: string;
}

export interface WaterConsumption {
  rate: number;
  unit: string;
  is_water_saving: boolean;
  efficiency_rating?: string;
}

export interface KohlerProduct {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price_inr: number;
  dimensions: ProductDimensions;
  styles: string[];
  finishes: string[];
  features: string[];
  water_consumption?: WaterConsumption;
  sustainability_attributes: string[];
  installation_requirements: string[];
  compatible_product_ids: string[];
  incompatible_product_ids: string[];
  source_url: string;
  verification_status: string;
  image_url?: string;
  /** Official Kohler model number / catalogue SKU (e.g. 'K-3092-0'). */
  model_number?: string;
}

export interface RoomDimensions {
  length: number;
  width: number;
  height?: number;
  unit: string;
}

export interface PriorityWeights {
  space: number;
  budget: number;
  luxury: number;
  functionality: number;
  sustainability: number;
  compatibility: number;
}

export interface DesignRequirements {
  dimensions: RoomDimensions;
  budget_max: number;
  budget_min?: number;
  style_preferences: string[];
  finish_preferences: string[];
  required_categories: string[];
  excluded_categories: string[];
  priority_weights?: PriorityWeights;
  special_requirements?: string[];
  uncertainties?: string[];
}

export interface FixturePlacement {
  product_id: string;
  category: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
  clearance_front?: number;
  zone?: string;
}

export interface SpatialLayout {
  room_length: number;
  room_width: number;
  placements: FixturePlacement[];
  doors: Array<{ id?: string; x: number; y: number; width: number; swing_angle?: number; wall?: string }>;
  windows: Array<{ id?: string; x: number; y: number; width: number; wall?: string }>;
  has_collisions: boolean;
  usable_area_ratio: number;
}

export interface SpatialValidationResult {
  is_feasible: boolean;
  violations: string[];
  warnings: string[];
  collisions: Array<{ fixture_a: string; category_a: string; fixture_b: string; category_b: string; description: string }>;
  clearance_conflicts: Array<{ fixture: string; obstructed_by: string; category: string; reason: string }>;
  door_conflicts: Array<{ door: string; obstructed_by: string; category: string }>;
  usable_area_sq_ft: number;
  usable_ratio: number;
  zoning_report: {
    zone_score: number;
    is_separated: boolean;
    warnings: string[];
  };
}

export interface ConstraintValidationResponse {
  is_feasible: boolean;
  total_cost_inr: number;
  budget_ceiling_inr: number;
  budget_headroom_inr: number;
  budget_exceeded: boolean;
  missing_required_categories: string[];
  excluded_categories_found: string[];
  compatibility_report: {
    is_compatible: boolean;
    conflicts: Array<{ product_a: string; product_b: string; reason: string }>;
    synergies: Array<{ product_a: string; product_b: string }>;
  };
  spatial_validation?: SpatialValidationResult;
  violations: string[];
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  stage: string;
  catalog_products_count: number;
  available_categories: string[];
}

export interface DesignScores {
  overall: number;
  space_efficiency: number;
  budget_fit: number;
  style_match: number;
  functionality: number;
  compatibility: number;
  sustainability: number;
}

export interface DesignAlternative {
  design_id: string;
  name: string;
  mode: 'balanced' | 'luxury' | 'eco' | 'space_saver' | 'personalized';
  product_ids: string[];
  products: KohlerProduct[];
  total_price_inr: number;
  budget_headroom_inr: number;
  feasible: boolean;
  infeasibility_reasons: string[];
  scores: DesignScores;
  layout?: SpatialLayout;
  explanation: {
    theme_alignment?: string;
    price_summary?: string;
    water_efficiency?: string;
    spatial_quality?: string;
    [key: string]: any;
  };
  assumptions: string[];
  tradeoffs: string[];
}

export interface SearchResultItem {
  product: KohlerProduct;
  similarity_score: number;
  evidence_snippet: string;
}

export interface DetectedFixture {
  category: string;
  approximate_location: string;
  confidence: number;
  bounding_box?: number[];
  suggested_kohler_sku?: string;
}

export interface DetectedOpening {
  wall: string;
  confidence: number;
  bounding_box?: number[];
  opening_type?: string;
}

export interface ColorPaletteItem {
  hex_code: string;
  name: string;
  percentage: number;
}

export interface VisionAnalysisResponse {
  detected_dimensions: {
    length: number;
    width: number;
    unit: string;
  };
  detected_fixtures: DetectedFixture[];
  detected_doors: DetectedOpening[];
  detected_windows: DetectedOpening[];
  detected_style_cues: string[];
  confidence_score: number;
  uncertainties: string[];
  suggested_actions: string[];
  color_palette?: ColorPaletteItem[];
  estimated_ceiling_height_ft?: number;
  primary_plumbing_wall?: string;
  drainage_zone?: string;
  image_metadata?: Record<string, any>;
}

export interface ConversationalRedesignRequest {
  session_id?: string;
  user_message: string;
  current_requirements: DesignRequirements;
  selected_product_ids: string[];
}

export interface ConversationalRedesignResponse {
  intent: string;
  change_summary: string;
  preserved_fixtures: string[];
  updated_requirements: DesignRequirements;
  updated_design: DesignAlternative;
  grounded_explanation: {
    intent_detected: string;
    change_summary: string;
    total_price_inr: number;
    budget_headroom_inr: number;
    sustainability_score: number;
    evidence_citations: string[];
    [key: string]: any;
  };
  tradeoffs: string[];
  is_feasible: boolean;
  violations: string[];
  added_fixtures?: string[];
  removed_fixtures?: string[];
  can_undo?: boolean;
  history_turn?: number;
}

export interface BenchmarkScenarioResult {
  scenario_id: string;
  scenario_name: string;
  category: string;
  status: string;
  passed: boolean;
  execution_time_ms: number;
  grounded_skus_count: number;
  unverified_skus_count: number;
  deterministic_constraint_pass: boolean;
  summary: string;
  metrics: Record<string, any>;
}

export interface EvaluationSuiteSummary {
  total_benchmarks: number;
  passed_benchmarks: number;
  pass_rate_percent: number;
  grounding_rate_percent: number;
  deterministic_constraint_accuracy_percent: number;
  average_latency_ms: number;
  results: BenchmarkScenarioResult[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  intent?: string;
  changeSummary?: string;
  preservedFixtures?: string[];
  feasible?: boolean;
  violations?: string[];
  evidenceCitations?: string[];
  tradeoffs?: string[];
  updatedDesign?: DesignAlternative;
  addedFixtures?: string[];
  removedFixtures?: string[];
  canUndo?: boolean;
  historyTurn?: number;
}

// Stage 5 Types
export interface FixtureWaterBreakdown {
  product_id: string;
  name: string;
  category: string;
  flow_rate: number;
  unit: string;
  is_water_saving: boolean;
  annual_consumption_liters: number;
  baseline_annual_liters: number;
  annual_saved_liters: number;
  savings_percent: number;
}

export interface SustainabilityReport {
  annual_water_consumption_liters: number;
  baseline_annual_water_liters: number;
  annual_water_saved_liters: number;
  annual_water_savings_percent: number;
  annual_utility_cost_savings_inr: number;
  carbon_offset_kg_co2: number;
  aggregate_sustainability_score: number;
  fixture_breakdowns: FixtureWaterBreakdown[];
  certified_features: string[];
  labeled_assumptions: string[];
}

export interface WhatIfQueryRequest {
  scenario_type: string;
  current_product_ids: string[];
  room_length?: number;
  room_width?: number;
  budget_max?: number;
  spend_delta_inr?: number;
}

export interface WhatIfAnalysisResult {
  scenario_type: string;
  headline: string;
  quantitative_impact: Record<string, any>;
  actionable_substitutions: Array<Record<string, any>>;
  tradeoff_explanation: string;
  resulting_product_ids: string[];
}

export interface AlternativeComparisonReport {
  mode_a: string;
  mode_b: string;
  name_a: string;
  name_b: string;
  price_delta_inr: number;
  headroom_delta_inr: number;
  usable_ratio_delta: number;
  sustainability_delta: number;
  space_score_delta: number;
  budget_fit_delta: number;
  style_score_delta: number;
  annual_water_saved_delta_liters: number;
  annual_utility_savings_delta_inr: number;
  fixture_substitutions: Array<{
    category: string;
    suite_a_fixture: string;
    suite_b_fixture: string;
    cost_difference: number;
  }>;
  synthesis: string;
}

export interface BOMLineItem {
  item_number: number;
  sku: string;
  model_number?: string;
  name: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit_price_inr: number;
  total_price_inr: number;
  dimensions_formatted: string;
  finishes: string[];
  water_efficiency_rating: string;
  source_url: string;
  verification_status: string;
  installation_requirements: string[];
}

export interface BOMSummary {
  subtotal_inr: number;
  gst_rate_percent: number;
  gst_amount_inr: number;
  total_with_gst_inr: number;
  rough_in_contingency_inr: number;
  grand_project_total_inr: number;
}

export interface BillOfMaterials {
  project_title: string;
  generated_at: string;
  room_dimensions: string;
  theme_style: string;
  line_items: BOMLineItem[];
  financial_summary: BOMSummary;
  total_fixture_count: number;
  sustainability_highlights: string[];
  disclaimer: string;
}

export interface BOMExportResponse {
  format: string;
  filename: string;
  content: string;
  mime_type: string;
}

