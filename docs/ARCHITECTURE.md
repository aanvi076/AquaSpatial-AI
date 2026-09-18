# System Architecture & Technical Design

## 1. Architectural Principles

The **KOHLER AI Bathroom Designer & Planner** is engineered on a fundamental principle:
> **Generative AI expands the design search space; deterministic engineering logic decides physical and financial feasibility.**

Large Language Models (LLMs) excel at interpreting messy human intent, translating aesthetic adjectives ("minimalist luxury", "warm contemporary"), and suggesting product combinations. However, generative models cannot be trusted to perform exact arithmetic, spatial clearance calculations, tax computation, or collision detection.

Our multi-tier architecture enforces a strict separation of concerns between **generative discovery** and **deterministic verification**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLIENT / PRESENTATION LAYER                        │
│   React 18 • TypeScript • Vite • Three.js (WebGL) • Lucide • SVG        │
│   - Segmented Studio Navigation (3D Showroom / 2D Plan / Suites / Copilot) │
│   - Real-time Constraint & Feasibility HUD                              │
│   - In-memory Hidden iFrame PDF / Specification Print Bridge            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ JSON over HTTP (REST)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY & APPLICATION CONTROLLER                 │
│   FastAPI • Pydantic v2 • Uvicorn • CORS • Validation Middleware        │
│   - Request serialization & strict Pydantic model validation            │
│   - Endpoints: Catalog, Constraints, Layout, AI, Sustainability, BOM    │
└──────────────────┬─────────────────────────────────┬────────────────────┘
                   │                                 │
┌──────────────────▼───────────────┐ ┌───────────────▼────────────────────┐
│   DETERMINISTIC ENGINE           │ │   AI & RAG RETRIEVAL ENGINE        │
│   - Spatial Validator (SAT/OBBs) │ │   - Requirement Extractor (NLP)    │
│   - Layout Generator (2D/3D)     │ │   - Multimodal Vision Ingestion    │
│   - Clearance Envelopes (NKBA)   │ │   - Hybrid RAG Vector Search       │
│   - Multi-Objective Bundle Ranker│ │   - Conversational Redesign Agent  │
│   - Sustainability Calculator    │ │   - Prompt Engineering & Grounding │
│   - BOM & Tax Math Generator     │ │   - Benchmark Evaluation Suite     │
└──────────────────┬───────────────┘ └───────────────┬────────────────────┘
                   │                                 │
                   └─────────────────┬───────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    AUTHENTIC KOHLER CATALOG INTELLIGENCE                │
│   `data/products/kohler_catalog.json` (131 Verified Fixtures)           │
│   - MRP Pricing (INR), 3D Footprints, Mounting Types, Flow Rates (L/min) │
│   - Official Kohler India PDP URLs & Grounded Catalog Provenance        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Subsystems

### A. Deterministic Spatial Layout & Collision Engine (`engine/geometry/`)
- **Separating Axis Theorem (SAT)**: Calculates exact overlap for rotated 2D bounding boxes (OBBs).
- **NKBA / Kohler Clearance Envelopes**: Enforces standard user circulation margins (21" minimum front clearance for toilets/vanities, 24" clearance for showers, 30" wet zone spacing).
- **Wet/Dry Zoning Classification**: Groups plumbing fixtures (shower, bathtub) along wet-wall zones while maintaining safe clearance for storage, vanities, and electrical fixtures.
- **Door Swing Safety**: Verifies that entry door arcs do not collide with any fixture bounding boxes.

### B. Hybrid Semantic Retrieval (RAG) & Vector Search (`ai/retrieval/`)
- Indexed across all 131 Kohler catalog products.
- Evaluates token similarity, semantic category vectors, style matching (Minimalist, Contemporary, Classic, Modern, Industrial), and finish compatibility (Polished Chrome, Matte Black, Vibrant Moderne Brass).
- Strict evidence snippet extraction ensures grounded explanations with zero fabricated attributes.

### C. Multi-Objective Bundle Optimizer (`engine/optimization/`, `engine/scoring/`)
- Synthesizes 5 distinct Pareto-optimal design suites:
  1. **Balanced Suite**: Optimum trade-off between luxury, budget fit, and physical comfort.
  2. **Luxury Suite**: Top-tier smart fixtures (e.g. Numi 2.0 smart toilet, DTV digital shower systems).
  3. **Eco Suite**: Maximum water efficiency meeting NBC India / IGBC green building standards.
  4. **Space Saver Suite**: Optimized compact footprints for powder rooms and compact urban layouts.
  5. **Personalized Suite**: Customized to explicit user constraints and style preferences.
- Each suite is scored across 6 objective dimensions: *Space Efficiency*, *Budget Fit*, *Style Match*, *Functionality*, *Compatibility*, and *Sustainability*.

### D. Sustainability & Water Intelligence Engine (`engine/sustainability/`)
- Calculates exact annual household water consumption based on occupant count, daily fixture usage frequency, and certified flow/flush rates (L/flush and L/min).
- Compares against the National Building Code (NBC) standard baseline.
- Quantifies annual utility savings in Indian Rupees (INR) and estimated carbon emission reductions ($kg\ CO_2e$).

### E. Section 14 What-If Sensitivity Engine (`engine/tradeoffs/`)
- Evaluates parameterized sensitivity queries:
  - *Spend Delta ROI*: High-impact upgrades for incremental budget.
  - *Bathtub Removal*: Budget savings, sq.ft circulation gains, and clearance margin expansion.
  - *Water Conservation Ranking*: Fixture-by-fixture water savings ranking.
  - *Room Compression*: Minimum room envelope feasibility analysis.
  - *Cost Driver Identification*: Value-engineering recommendations.

### F. Official Bill of Materials & Multi-Format Exporter (`engine/bom/`)
- Generates itemized procurement schedules with official Kohler SKUs, list prices, water efficiency ratings, and official URLs.
- Mathematical financial breakdown: Subtotal, Goods & Services Tax (GST at 18.0%), valves and rough-in allowance (~10%), and Grand Project Total.
- Multi-format exports: Printable Luxury A4 HTML (with in-memory iframe print bridge for PDF output), CSV Excel spreadsheet, and structured JSON.
