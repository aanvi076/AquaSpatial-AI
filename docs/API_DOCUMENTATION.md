# REST API Documentation

The backend exposes a high-performance REST API built with **FastAPI** and **Pydantic v2**.
When running locally, interactive OpenAPI Swagger documentation is available at `http://localhost:8000/docs`.

---

## Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check, service status, and catalog count |
| `GET` | `/api/catalog` | Filterable Kohler product catalog |
| `GET` | `/api/catalog/{product_id}` | Detailed product metadata by SKU/ID |
| `GET` | `/api/categories` | List all available product categories |
| `GET` | `/api/styles` | List all design themes and aesthetic styles |
| `POST` | `/api/validate-constraints` | Deterministic physical and financial feasibility validation |
| `POST` | `/api/layout/generate` | Procedural 2D spatial layout generation with clearance verification |
| `POST` | `/api/layout/validate` | Validates a custom 2D layout for collisions and clearances |
| `POST` | `/api/design-alternatives` | Synthesizes 5 Pareto-optimal design suites |
| `POST` | `/api/search/semantic` | RAG semantic vector search over Kohler catalog |
| `POST` | `/api/ai/extract-requirements` | Natural language text parsing into structured requirements |
| `POST` | `/api/ai/analyze-image` | Multimodal bathroom photo/floor plan analysis |
| `POST` | `/api/ai/conversational-redesign` | Conversational design copilot with locked fixture preservation |
| `GET` | `/api/ai/evaluation` | AI evaluation benchmark suite results |
| `POST` | `/api/sustainability/calculate` | Annual water consumption, INR bill savings, and CO2 offset |
| `POST` | `/api/tradeoffs/whatif` | Section 14 parameterized What-If sensitivity scenarios |
| `POST` | `/api/tradeoffs/compare` | Cross-suite trade-off comparison matrix |
| `POST` | `/api/bom/generate` | Bill of Materials with GST and rough-in contingency |
| `POST` | `/api/bom/export` | Multi-format BOM export (HTML Spec Sheet, CSV, JSON, Markdown) |

---

## Sample Request & Response Payloads

### 1. Generate Design Suites (`POST /api/design-alternatives`)
**Request:**
```json
{
  "dimensions": { "length": 10.0, "width": 8.0, "unit": "ft" },
  "budget_max": 300000,
  "style_preferences": ["modern", "minimalist"],
  "finish_preferences": ["matte_black"],
  "required_categories": ["toilet", "basin", "faucet", "shower"]
}
```
**Response:**
Returns 5 Pareto-optimal design suites (`balanced`, `luxury`, `eco`, `space_saver`, `personalized`) with itemized products, 2D layout coordinates, dimension scores, water savings, and grounded tradeoff explanations.

### 2. What-If Scenario Analysis (`POST /api/tradeoffs/whatif`)
**Request:**
```json
{
  "scenario_type": "spend_delta",
  "current_product_ids": ["K-MODERNLIFE-03", "K-HARKEN-VANITY-01", "K-PURIST-01", "K-STATEMENT-01"],
  "spend_delta_inr": 25000
}
```
**Response:**
```json
{
  "scenario_type": "spend_delta",
  "headline": "Upgrade Potential with ₹25,000 Additional Budget",
  "quantitative_impact": {
    "incremental_budget_inr": 25000,
    "quality_score_improvement": 18.5,
    "sustainability_gain_percent": 12.0
  },
  "actionable_substitutions": [
    {
      "category": "toilet",
      "current_product": "ModernLife Wall-Hung Toilet",
      "upgraded_product": "Veil Intelligent Wall-Hung Toilet",
      "cost_delta_inr": 22000,
      "benefit": "Adds integrated bidet cleansing and automated lid sensing"
    }
  ],
  "tradeoff_explanation": "Allocating ₹25,000 allows upgrading the primary sanitary unit to Kohler's intelligent bidet tier."
}
```

### 3. Multi-Format BOM Export (`POST /api/bom/export`)
**Request:**
```json
{
  "product_ids": ["K-MODERNLIFE-03", "K-HARKEN-VANITY-01", "K-PURIST-01", "K-STATEMENT-01"],
  "export_format": "html",
  "project_title": "Kohler Master Bathroom Design",
  "room_dimensions": "10.0 x 8.0 ft",
  "theme_style": "Contemporary",
  "gst_rate": 18.0
}
```
**Response:**
Returns a print-ready, high-contrast HTML specification document formatted for instant A4 PDF printing.
