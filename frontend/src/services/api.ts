import type { 
  KohlerProduct, 
  HealthResponse, 
  DesignRequirements, 
  ConstraintValidationResponse,
  SpatialLayout,
  SpatialValidationResult,
  DesignAlternative,
  SearchResultItem
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const apiService = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Failed to fetch API health status');
    return res.json();
  },

  async getCatalog(params?: {
    category?: string;
    style?: string;
    max_price?: number;
    water_saving_only?: boolean;
  }): Promise<KohlerProduct[]> {
    const url = new URL(`${API_BASE_URL}/catalog`);
    if (params?.category && params.category !== 'all') {
      url.searchParams.append('category', params.category);
    }
    if (params?.style && params.style !== 'all') {
      url.searchParams.append('style', params.style);
    }
    if (params?.max_price) {
      url.searchParams.append('max_price', params.max_price.toString());
    }
    if (params?.water_saving_only) {
      url.searchParams.append('water_saving_only', 'true');
    }

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch catalog products');
    return res.json();
  },

  async getProductById(productId: string): Promise<KohlerProduct> {
    const res = await fetch(`${API_BASE_URL}/catalog/${productId}`);
    if (!res.ok) throw new Error(`Product ${productId} not found`);
    return res.json();
  },

  async getCategories(): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getStyles(): Promise<string[]> {
    const res = await fetch(`${API_BASE_URL}/styles`);
    if (!res.ok) throw new Error('Failed to fetch styles');
    return res.json();
  },

  async validateConstraints(
    requirements: DesignRequirements,
    selectedProductIds: string[],
    layout?: SpatialLayout
  ): Promise<ConstraintValidationResponse> {
    const res = await fetch(`${API_BASE_URL}/validate-constraints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requirements,
        selected_product_ids: selectedProductIds,
        layout,
      }),
    });
    if (!res.ok) throw new Error('Failed to validate constraints');
    return res.json();
  },

  async generateLayout(
    roomLength: number,
    roomWidth: number,
    productIds: string[]
  ): Promise<{ layout: SpatialLayout; spatial_validation: SpatialValidationResult }> {
    const res = await fetch(`${API_BASE_URL}/layout/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_length: roomLength,
        room_width: roomWidth,
        product_ids: productIds,
      }),
    });
    if (!res.ok) throw new Error('Failed to generate spatial layout');
    return res.json();
  },

  async validateLayout(layout: SpatialLayout): Promise<SpatialValidationResult> {
    const res = await fetch(`${API_BASE_URL}/layout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layout),
    });
    if (!res.ok) throw new Error('Failed to validate spatial layout');
    return res.json();
  },

  async generateAlternatives(requirements: DesignRequirements): Promise<DesignAlternative[]> {
    const res = await fetch(`${API_BASE_URL}/optimizer/generate-alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requirements),
    });
    if (!res.ok) throw new Error('Failed to generate design alternatives');
    return res.json();
  },

  async semanticSearch(params: {
    query: string;
    category?: string;
    style?: string;
    max_price?: number;
    water_saving_only?: boolean;
    top_k?: number;
  }): Promise<SearchResultItem[]> {
    const res = await fetch(`${API_BASE_URL}/retrieval/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to perform semantic product search');
    return res.json();
  },

  async extractRequirements(text: string): Promise<DesignRequirements> {
    const res = await fetch(`${API_BASE_URL}/ai/extract-requirements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to extract requirements from text');
    return res.json();
  },

  async analyzeImage(payload: {
    image_data?: string;
    filename?: string;
    notes?: string;
  }): Promise<import('../types').VisionAnalysisResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to analyze image');
    return res.json();
  },

  async conversationalRedesign(payload: {
    session_id?: string;
    user_message: string;
    current_requirements: DesignRequirements;
    selected_product_ids: string[];
  }): Promise<import('../types').ConversationalRedesignResponse> {
    const res = await fetch(`${API_BASE_URL}/ai/conversational-redesign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to process conversational redesign');
    return res.json();
  },

  // Stage 5 API Methods
  async calculateSustainability(payload: {
    product_ids: string[];
    occupants?: number;
    flushes_per_person_day?: number;
    shower_minutes_per_person_day?: number;
    faucet_minutes_per_person_day?: number;
    utility_rate_inr_per_liter?: number;
  }): Promise<import('../types').SustainabilityReport> {
    const res = await fetch(`${API_BASE_URL}/sustainability/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to calculate sustainability report');
    return res.json();
  },

  async runWhatIfScenario(payload: import('../types').WhatIfQueryRequest): Promise<import('../types').WhatIfAnalysisResult> {
    const res = await fetch(`${API_BASE_URL}/tradeoffs/whatif`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to evaluate what-if scenario');
    return res.json();
  },

  async compareAlternatives(
    designA: import('../types').DesignAlternative,
    designB: import('../types').DesignAlternative
  ): Promise<import('../types').AlternativeComparisonReport> {
    const res = await fetch(`${API_BASE_URL}/tradeoffs/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ design_a: designA, design_b: designB }),
    });
    if (!res.ok) throw new Error('Failed to compare design alternatives');
    return res.json();
  },

  async generateBOM(payload: {
    product_ids: string[];
    project_title?: string;
    room_dimensions?: string;
    theme_style?: string;
    gst_rate?: number;
  }): Promise<import('../types').BillOfMaterials> {
    const res = await fetch(`${API_BASE_URL}/bom/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate Bill of Materials');
    return res.json();
  },

  async exportBOM(payload: {
    product_ids: string[];
    export_format: string;
    project_title?: string;
    room_dimensions?: string;
    theme_style?: string;
    gst_rate?: number;
  }): Promise<import('../types').BOMExportResponse> {
    const res = await fetch(`${API_BASE_URL}/bom/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to export Bill of Materials');
    return res.json();
  },

  // Stage 6 API Methods
  async getEvaluationReport(): Promise<import('../types').EvaluationSuiteSummary> {
    const res = await fetch(`${API_BASE_URL}/ai/evaluation`);
    if (!res.ok) throw new Error('Failed to fetch AI Evaluation Benchmark results');
    return res.json();
  },
};


