# KOHLER AI Bathroom Designer & Planner

[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)](https://fastapi.tiangolo.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black)](https://threejs.org/)
[![Tests](https://img.shields.io/badge/Tests-87%2F87%20Passing-success)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An intelligent, multimodal, constraint-aware bathroom design platform engineered for **KOHLER**. Built on the principle that **generative AI expands the design search space, while deterministic engineering logic guarantees physical and financial feasibility**.

---

## Table of Contents

- [Executive Overview](#executive-overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Quick Start Guide](#quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Automated Testing & Verification](#automated-testing--verification)
- [Documentation & Resources](#documentation--resources)
- [License](#license)

---

## Executive Overview

Standard generative AI tools often produce visually appealing bathroom concepts that cannot be constructed—violating minimum architectural clearances, ignoring plumbing wall constraints, hallucinating non-existent fixture models, and providing inaccurate pricing.

The **KOHLER AI Bathroom Designer** solves this by coupling natural language and multimodal intent with a rigorous deterministic engineering pipeline:

1. **Authentic Kohler Catalog Intelligence**: 131 grounded products spanning Toilets, Basins, Faucets, Showers, Bathtubs, Vanities, and Mirrors with official INR pricing, exact dimensions, flow rates, and catalog links.
2. **Deterministic Spatial Engine**: 2D Oriented Bounding Box (OBB) collision detection using the Separating Axis Theorem (SAT), NKBA clearance verification, door swing safety, and wet/dry zoning.
3. **Multi-Objective Optimization**: Automated synthesis of 5 Pareto-optimal design suites (*Balanced*, *Luxury*, *Eco*, *Space Saver*, *Personalized*).
4. **3D WebGL Studio & 2D Floor Plan**: Interactive Three.js parametric visualization with camera presets, finish switcher (*Polished Chrome*, *Matte Black*, *Vibrant Moderne Brass*), clearance envelopes, and Katalyst water flow.
5. **AI Design Copilot & Multimodal Vision**: Conversational natural language redesign with locked fixture preservation, coupled with computer vision floor plan and photo ingestion.
6. **Sustainability & What-If Intelligence**: National Building Code (NBC) water savings modeling, INR utility bill reduction, CO2 offset, and Section 14 sensitivity analysis.
7. **Procurement Bill of Materials (BOM)**: Comprehensive itemized specification schedule with 18% GST, rough-in plumbing allowances, and instant printable A4 PDF / CSV / JSON export.

---

## Key Features

### 1. Multi-Objective Design Suites
- **Balanced Tier**: Optimized cost-to-luxury ratio.
- **Luxury Tier**: Flagship intelligent products (Numi 2.0, DTV digital showering).
- **Eco Tier**: WaterSense certified fixtures minimizing municipal consumption.
- **Space Saver Tier**: Compact footprints maximizing standing circulation.
- **Personalized Tier**: Tailored to explicit user style, budget, and category inputs.

### 2. Interactive 3D WebGL Showroom & 2D Plan
- Real-time Three.js rendering of authentic Kohler fixture geometry.
- Floating camera controls (*Isometric*, *Top Plan*, *Front View*).
- Interactive finish customization (*Chrome*, *Matte Black*, *Brushed Brass*).
- Visual clearance overlays (cyan safety envelopes) and Katalyst water particles.

### 3. Conversational AI Copilot & Vision
- Natural language refinement (*"make it more luxurious"*, *"reduce budget by ₹20,000"*, *"remove the bathtub"*).
- Preserves locked fixtures across conversation turns.
- Ingests user-uploaded bathroom photos and architectural sketches, extracting room boundaries and plumbing locations.

### 4. Sustainability & Section 14 What-If Matrix
- Calculates exact annual water savings (liters and gallons) vs NBC baseline.
- Estimates annual utility bill savings in Indian Rupees (INR) and carbon offset ($kg\ CO_2e$).
- Parameterized What-If sensitivity analysis: Spend delta ROI, bathtub removal trade-offs, and cost driver identification.

### 5. Procurement Bill of Materials & PDF Export
- Itemized fixture schedule with official Kohler model numbers and MRP.
- Financial tax math: Fixture Subtotal, 18% GST, 10% rough-in contingency, Grand Project Total.
- **Print / Save as PDF**: Clean luxury A4 spec sheet rendered via an in-memory iframe print bridge without popup blocker interference.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLIENT / PRESENTATION LAYER                        │
│   React 18 • TypeScript • Vite • Three.js (WebGL) • Lucide Icons        │
│   - Editorial Monochrome Design System (Showroom White Canvas)          │
│   - 3D Realistic Viewport / 2D Floor Plan / Suite Comparison Grid       │
│   - In-memory Hidden iFrame PDF / Specification Print Bridge            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ REST JSON (HTTP)
┌────────────────────────────────────▼────────────────────────────────────┐
│                    FASTAPI APPLICATION CONTROLLER                       │
│   FastAPI • Pydantic v2 • Uvicorn • CORS • Validation Middleware        │
│   - Endpoints: Catalog, Constraints, Layout, AI, Sustainability, BOM    │
└──────────────────┬─────────────────────────────────┬────────────────────┘
                   │                                 │
┌──────────────────▼───────────────┐ ┌───────────────▼────────────────────┐
│   DETERMINISTIC ENGINE           │ │   AI & RAG RETRIEVAL ENGINE        │
│   - Spatial Validator (SAT/OBBs) │ │   - NLP Requirement Extractor      │
│   - Clearance Envelopes (NKBA)   │ │   - Multimodal Vision Ingestion    │
│   - Multi-Objective Suite Ranker │ │   - Hybrid RAG Vector Search       │
│   - Sustainability Calculator    │ │   - Conversational Redesign Agent  │
│   - BOM & Tax Math Generator     │ │   - Prompt Safety & Grounding      │
└──────────────────┬───────────────┘ └───────────────┬────────────────────┘
                   │                                 │
                   └─────────────────┬───────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    AUTHENTIC KOHLER CATALOG DATA                        │
│   `data/products/kohler_catalog.json` (131 Verified Fixtures)           │
│   - Official SKUs, Dimensions, Prices (INR), Flow Rates, PDP URLs       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
.
├── frontend/                     # React 18 + Vite + TypeScript Studio
│   ├── src/
│   │   ├── components/           # 3D View, 2D Plan, Suites, Copilot, BOM Modal
│   │   ├── services/             # API Client
│   │   ├── types/                # TypeScript interfaces
│   │   ├── App.tsx               # Main Studio Application
│   │   └── index.css             # Monochrome Editorial Design System
│   └── package.json
├── backend/                      # FastAPI Python Application
│   ├── api/                      # REST API Endpoints
│   ├── models/                   # Pydantic v2 schemas
│   ├── orchestration/            # Conversational Agent Orchestrator
│   ├── services/                 # Catalog & Validation Services
│   └── main.py                   # FastAPI server entry point
├── engine/                       # Deterministic Logic & Physics
│   ├── bom/                      # Bill of Materials & PDF generator
│   ├── constraints/              # Spatial & Financial feasibility
│   ├── geometry/                 # SAT Collision & 2D Layout generator
│   ├── optimization/             # Multi-Objective Bundle Optimizer
│   ├── scoring/                  # Multi-Criteria Decision Analysis
│   ├── sustainability/           # NBC Water & CO2 Calculator
│   └── tradeoffs/                # Section 14 What-If Sensitivity Engine
├── ai/                           # AI & RAG Components
│   ├── evaluation/               # AI Benchmark Evaluation Suite
│   ├── prompts/                  # Grounded Prompt Policies
│   ├── retrieval/                # Hybrid Vector / TF-IDF Search
│   ├── services/                 # NLP Requirement Extractor
│   └── vision/                   # Multimodal Floor Plan & Photo Ingestion
├── data/                         # Verified Kohler Product Intelligence
│   └── products/                 # Authentic 131-product catalog
├── tests/                        # Comprehensive Unit & Integration Tests
│   ├── test_api.py               # API endpoint validation
│   ├── test_bom.py               # BOM calculation & export tests
│   ├── test_catalog.py           # Catalog filtering & SKU tests
│   ├── test_models.py            # Pydantic schema validation
│   ├── test_spatial.py           # SAT collision & clearance tests
│   ├── test_sustainability.py    # Water & utility savings tests
│   └── test_whatif.py            # What-If sensitivity tests
├── docs/                         # Technical Documentation
│   ├── ARCHITECTURE.md           # Deep-dive system architecture
│   ├── API_DOCUMENTATION.md      # Full REST API endpoint reference
│   └── PRODUCT_URL_VERIFICATION_REPORT.md # Catalog verification audit
├── demo/                         # Demonstration Walkthrough Guide
│   └── README.md
├── presentation/                 # Competition Pitch Deck Structure
│   └── README.md
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git exclusion rules
└── README.md                     # Project overview (this file)
```

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, TypeScript | Component-based reactive UI |
| **Styling** | Custom CSS (Editorial Theme) | Monochrome showroom aesthetic |
| **3D Graphics** | Three.js (WebGL) | Parametric 3D bathroom visualization |
| **Icons** | Lucide React | High-contrast UI iconography |
| **Build Tool** | Vite | Lightning-fast HMR and optimized bundling |
| **Backend Framework** | FastAPI (Python 3.10+) | High-throughput asynchronous REST API |
| **Data Validation** | Pydantic v2 | Strict schema typing and validation |
| **Server** | Uvicorn (ASGI) | Production ASGI web server |
| **Math & Geometry** | Python standard / SAT algorithms | Deterministic collision and clearances |
| **Testing** | Unittest / Pytest | Automated regression and benchmark tests |

---

## Quick Start Guide

### Prerequisites
- **Python**: Version `3.10` or higher (tested on `3.12`)
- **Node.js**: Version `18` or higher (tested on `24`)
- **Git**: For version control

---

### Backend Setup

1. **Navigate to project root**:
   ```bash
   cd kohler_aiproj_aanvi
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify backend test suite**:
   ```bash
   python -m unittest discover -s tests
   ```

4. **Launch FastAPI Backend Server**:
   ```bash
   python -m backend.main
   ```
   - API will be live at: `http://127.0.0.1:8000`
   - Interactive OpenAPI docs: `http://127.0.0.1:8000/docs`

---

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```
   - Frontend Studio will be accessible at: `http://localhost:5173`

4. **Verify Frontend Production Build**:
   ```bash
   npm run build
   ```

---

## Automated Testing & Verification

The platform maintains an automated test suite verifying deterministic math, spatial collision detection, RAG retrieval, and BOM financial logic:

```bash
python -m unittest discover -s tests
```

### Test Coverage Summary:
- **`test_models.py`**: Pydantic schema validation, dimensions, flow rates, and pricing models.
- **`test_catalog.py`**: Category filters, style taxonomy, and SKU verification.
- **`test_spatial.py`**: 2D OBB Separating Axis Theorem collisions, NKBA clearance projections, door swings.
- **`test_api.py`**: FastAPI route handlers, status codes, and error recovery.
- **`test_sustainability.py`**: NBC water consumption baselines, utility savings math, and carbon offset.
- **`test_whatif.py`**: Sensitivity matrix scenarios, parameter sweeps, and ROI rankings.
- **`test_bom.py`**: GST calculations (18%), rough-in contingencies (10%), and HTML/CSV export formats.

**Result**: **87/87 tests passing (100% pass rate)**.

---

## Documentation & Resources

- [System Architecture Deep Dive](docs/ARCHITECTURE.md)
- [REST API Reference](docs/API_DOCUMENTATION.md)
- [Demonstration & Scenario Guide](demo/README.md)
- [Competition Presentation Outline](presentation/README.md)

---

## License

This project is developed for the Kohler AI Case Study Competition. All product names, trademarks, and registered trademarks are property of their respective owners. Kohler product specifications, imagery, and 3D models are used for demonstration and educational purposes.

*Submitted as an individual academic case-study prototype for the Kohler-MITWPU AI Research Lab.*
