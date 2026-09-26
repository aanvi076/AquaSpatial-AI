import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Droplets, 
  Trash2, 
  ShieldCheck, 
  ShoppingBag, 
  Sparkles, 
  MessageSquare, 
  Wand2, 
  Receipt, 
  RotateCw, 
  Leaf, 
  Send, 
  X, 
  Check 
} from 'lucide-react';
import { apiService } from './services/api';
import type { 
  KohlerProduct, 
  HealthResponse, 
  DesignRequirements, 
  ConstraintValidationResponse,
  SpatialLayout,
  SpatialValidationResult,
  DesignAlternative,
  SustainabilityReport,
  ChatMessage
} from './types';
import { FloorPlan2D } from './components/FloorPlan2D';
import { DesignAlternativesView } from './components/DesignAlternativesView';
import { SemanticSearchBar } from './components/SemanticSearchBar';
import { ConversationalPanel } from './components/ConversationalPanel';
import { SustainabilityCard } from './components/SustainabilityCard';
import { WhatIfMatrixView } from './components/WhatIfMatrixView';
import { BOMExportModal } from './components/BOMExportModal';
import { BOMSpecView } from './components/BOMSpecView';
import { BathroomView3D } from './components/BathroomView3D';

// Workflow Stages: Design → Products → AI Refinement → Spatial Validation → Sustainability → BOM
type WorkflowStage = 'design' | 'products' | 'copilot' | 'spatial' | 'sustainability' | 'bom';

export function App() {
  // System health state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Workflow Stage
  const [activeStage, setActiveStage] = useState<WorkflowStage>('design');

  // Canvas Viewport Mode: 'view3d' | 'view2d'
  const [viewportMode, setViewportMode] = useState<'view3d' | 'view2d'>('view3d');

  // Design brief requirements state
  const [roomLength, setRoomLength] = useState<number>(10);
  const [roomWidth, setRoomWidth] = useState<number>(8);
  const [budgetMax, setBudgetMax] = useState<number>(300000);
  const [selectedStyle, setSelectedStyle] = useState<string>('minimalist');
  const [requiredCategories, setRequiredCategories] = useState<string[]>([
    'toilet',
    'basin',
    'faucet',
    'shower',
  ]);
  const [excludedCategories] = useState<string[]>([]);

  // Natural Language Ingestion state
  const [nlRequirementText, setNlRequirementText] = useState('');
  const [extractingNl, setExtractingNl] = useState(false);
  const [nlFeedback, setNlFeedback] = useState<string | null>(null);

  // Sustainability & BOM Export Modal state
  const [sustainabilityReport, setSustainabilityReport] = useState<SustainabilityReport | null>(null);
  const [loadingSustainability, setLoadingSustainability] = useState<boolean>(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState<boolean>(false);

  // Floating Chat FAB / Drawer state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Kohler AI Studio Copilot active. Inquire about fixture substitutions, budget optimization, spatial compliance, or finish coordination.',
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // Catalog state
  const [products, setProducts] = useState<KohlerProduct[]>([]);
  const [allCatalogProducts, setAllCatalogProducts] = useState<KohlerProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [ecoFilterOnly, setEcoFilterOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Bundle builder & constraint validation state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    'K-MODERNLIFE-03',
    'K-FOREFRONT-01',
    'K-PURIST-01',
    'K-STATEMENT-01'
  ]);
  const [validation, setValidation] = useState<ConstraintValidationResponse | null>(null);

  // Spatial Layout state
  const [spatialLayout, setSpatialLayout] = useState<SpatialLayout | null>(null);
  const [spatialValidation, setSpatialValidation] = useState<SpatialValidationResult | null>(null);
  const [generatingLayout, setGeneratingLayout] = useState<boolean>(false);

  // Multi-Objective Design Alternatives state
  const [alternatives, setAlternatives] = useState<DesignAlternative[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | undefined>(undefined);
  const [loadingAlternatives, setLoadingAlternatives] = useState<boolean>(false);

  // Initial health check & complete catalog preload
  useEffect(() => {
    async function init() {
      try {
        const healthData = await apiService.getHealth();
        setHealth(healthData);
        setApiError(null);
      } catch (err) {
        console.error('API health check error:', err);
        setApiError('Backend server offline. Run `python -m backend.main` on port 8000.');
      }
      try {
        const allData = await apiService.getCatalog({ category: 'all' });
        setAllCatalogProducts(allData);
      } catch (err) {
        console.error('Catalog preload error:', err);
      }
    }
    init();
  }, []);

  // Fetch catalog products for showroom filtering
  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await apiService.getCatalog({
          category: activeCategory,
          water_saving_only: ecoFilterOnly,
        });
        setProducts(data);
        if (activeCategory === 'all' && !ecoFilterOnly) {
          setAllCatalogProducts(data);
        }
      } catch (err) {
        console.error('Catalog load error:', err);
      }
    }
    loadCatalog();
  }, [activeCategory, ecoFilterOnly]);

  // Procedural 2D Layout generator handler
  const handleGenerateLayout = useCallback(async () => {
    if (selectedProductIds.length === 0) {
      setSpatialLayout(null);
      setSpatialValidation(null);
      return;
    }
    setGeneratingLayout(true);
    try {
      const res = await apiService.generateLayout(roomLength, roomWidth, selectedProductIds);
      setSpatialLayout(res.layout);
      setSpatialValidation(res.spatial_validation);
    } catch (err) {
      console.error('Failed to generate spatial layout:', err);
    } finally {
      setGeneratingLayout(false);
    }
  }, [roomLength, roomWidth, selectedProductIds]);

  // Fetch multi-objective design alternatives
  const handleFetchAlternatives = useCallback(async () => {
    setLoadingAlternatives(true);
    try {
      const reqs: DesignRequirements = {
        dimensions: { length: roomLength, width: roomWidth, unit: 'ft' },
        budget_max: budgetMax,
        style_preferences: [selectedStyle],
        finish_preferences: [],
        required_categories: requiredCategories,
        excluded_categories: excludedCategories,
      };
      const alts = await apiService.generateAlternatives(reqs);
      setAlternatives(alts);
      if (alts.length > 0 && !selectedDesignId) {
        setSelectedDesignId(alts[0].design_id);
      }
    } catch (err) {
      console.error('Failed to fetch design alternatives:', err);
    } finally {
      setLoadingAlternatives(false);
    }
  }, [roomLength, roomWidth, budgetMax, selectedStyle, requiredCategories, excludedCategories, selectedDesignId]);

  // Load alternatives on initial mount or when brief dimensions/budget change
  useEffect(() => {
    handleFetchAlternatives();
  }, [handleFetchAlternatives]);

  // Automatically generate layout when dimensions or bundle change
  useEffect(() => {
    handleGenerateLayout();
  }, [handleGenerateLayout]);

  // Apply a design alternative to the active studio
  const handleSelectAlternative = (alt: DesignAlternative) => {
    setSelectedDesignId(alt.design_id);
    setSelectedProductIds(alt.product_ids);
    if (alt.layout) {
      setSpatialLayout(alt.layout);
    }
  };

  // Clear current bundle and all derived spatial/financial state
  const handleClearBundle = () => {
    setSelectedProductIds([]);
    setSpatialLayout(null);
    setSpatialValidation(null);
    setSelectedDesignId(undefined);
    setValidation(null);
  };

  // Extract requirements from natural language prompt
  const handleExtractNlRequirements = async () => {
    if (!nlRequirementText.trim()) return;
    setExtractingNl(true);
    setNlFeedback(null);
    try {
      const extracted = await apiService.extractRequirements(nlRequirementText);
      if (extracted.dimensions?.length) setRoomLength(extracted.dimensions.length);
      if (extracted.dimensions?.width) setRoomWidth(extracted.dimensions.width);
      if (extracted.budget_max) setBudgetMax(extracted.budget_max);
      if (extracted.style_preferences?.length) setSelectedStyle(extracted.style_preferences[0]);
      if (extracted.required_categories?.length) setRequiredCategories(extracted.required_categories);
      setNlFeedback(`Applied: ${extracted.dimensions?.length}x${extracted.dimensions?.width} ft, ₹${extracted.budget_max?.toLocaleString('en-IN')}, style: ${extracted.style_preferences?.[0]}`);
    } catch (err: any) {
      console.error('Failed to extract requirements:', err);
      setNlFeedback('Error extracting requirements.');
    } finally {
      setExtractingNl(false);
    }
  };

  // Apply conversational redesign
  const handleApplyRedesign = (newReqs: DesignRequirements, design: DesignAlternative) => {
    setSelectedProductIds(design.product_ids);
    setBudgetMax(newReqs.budget_max);
    if (newReqs.style_preferences?.length) setSelectedStyle(newReqs.style_preferences[0]);
    if (newReqs.required_categories?.length) setRequiredCategories(newReqs.required_categories);
    if (design.layout) {
      setSpatialLayout(design.layout);
    }
  };

  // Apply detected room from multimodal vision
  const handleApplyDetectedRoom = (
    dimensions: { length: number; width: number },
    styles: string[],
    requiredCats: string[]
  ) => {
    setRoomLength(dimensions.length);
    setRoomWidth(dimensions.width);
    if (styles.length > 0) setSelectedStyle(styles[0]);
    if (requiredCats.length > 0) setRequiredCategories(requiredCats);
  };

  // Apply substitutions from What-If Sensitivity Engine
  const handleApplySubstitutions = (newProductIds: string[]) => {
    setSelectedProductIds(newProductIds);
  };

  // Automatically recalculate sustainability metrics when bundle changes
  useEffect(() => {
    async function loadSustainability() {
      if (selectedProductIds.length === 0) return;
      setLoadingSustainability(true);
      try {
        const data = await apiService.calculateSustainability({
          product_ids: selectedProductIds,
          occupants: 4,
          utility_rate_inr_per_liter: 0.045
        });
        setSustainabilityReport(data);
      } catch (err) {
        console.error('Failed to calculate sustainability:', err);
      } finally {
        setLoadingSustainability(false);
      }
    }
    loadSustainability();
  }, [selectedProductIds]);

  // Run deterministic constraint validation
  useEffect(() => {
    async function runValidation() {
      try {
        const reqs: DesignRequirements = {
          dimensions: { length: roomLength, width: roomWidth, unit: 'ft' },
          budget_max: budgetMax,
          style_preferences: [selectedStyle],
          finish_preferences: [],
          required_categories: requiredCategories,
          excluded_categories: excludedCategories,
        };
        const res = await apiService.validateConstraints(
          reqs, 
          selectedProductIds, 
          spatialLayout || undefined
        );
        setValidation(res);
      } catch (err) {
        console.error('Validation error:', err);
      }
    }
    runValidation();
  }, [roomLength, roomWidth, budgetMax, selectedStyle, requiredCategories, excludedCategories, selectedProductIds, spatialLayout]);

  // Handle floating chat message submission
  const handleSendFloatingChatMessage = async (msgText: string) => {
    const text = msgText.trim();
    if (!text || isChatSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatSending(true);

    try {
      const res = await apiService.conversationalRedesign({
        session_id: 'floating_chat_session',
        user_message: text,
        current_requirements: {
          dimensions: { length: roomLength, width: roomWidth, unit: 'ft' },
          budget_max: budgetMax,
          style_preferences: [selectedStyle],
          finish_preferences: [],
          required_categories: requiredCategories,
          excluded_categories: excludedCategories,
        },
        selected_product_ids: selectedProductIds,
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: res.change_summary,
        intent: res.intent,
        changeSummary: res.change_summary,
        preservedFixtures: res.preserved_fixtures,
        feasible: res.is_feasible,
        violations: res.violations,
        evidenceCitations: res.grounded_explanation.evidence_citations,
        tradeoffs: res.tradeoffs,
        updatedDesign: res.updated_design,
        addedFixtures: res.added_fixtures,
        removedFixtures: res.removed_fixtures,
        canUndo: res.can_undo,
      };

      setChatMessages(prev => [...prev, assistantMsg]);
      if (res.updated_design) {
        handleApplyRedesign({
          dimensions: { length: roomLength, width: roomWidth, unit: 'ft' },
          budget_max: budgetMax,
          style_preferences: [selectedStyle],
          finish_preferences: [],
          required_categories: requiredCategories,
          excluded_categories: excludedCategories,
        }, res.updated_design);
      }
    } catch (err: any) {
      console.error('Floating chat error:', err);
    } finally {
      setIsChatSending(false);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.model_number && p.model_number.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        p.styles.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery]);

  // Selected products entities for the active design bundle
  const selectedProducts = useMemo(() => {
    const catalogSource = allCatalogProducts.length > 0 ? allCatalogProducts : products;
    return selectedProductIds
      .map((id) => catalogSource.find((p) => p.id === id))
      .filter((p): p is KohlerProduct => p !== undefined);
  }, [selectedProductIds, allCatalogProducts, products]);

  const toggleProductInBundle = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleRequiredCategory = (category: string) => {
    setRequiredCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const roomArea = (roomLength * roomWidth).toFixed(1);
  const selectedSuite = alternatives.find((alt) => alt.design_id === selectedDesignId);
  const annualSavedGallons = sustainabilityReport ? Math.round(sustainabilityReport.annual_water_saved_liters * 0.264172) : 5800;
  const currentTotalCost = validation?.total_cost_inr ?? 0;
  const budgetHeadroom = budgetMax - currentTotalCost;

  return (
    <div className="arch-workspace">
      {apiError && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 16px', fontSize: '12px', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
          <AlertTriangle size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          {apiError}
        </div>
      )}

      {/* 1. Top Control Strip / Architectural Bar */}
      <header className="arch-top-bar">
        <div className="brand-badge-group">
          <div className="brand-wordmark">
            <span>KOHLER</span>
            <span className="brand-dot">•</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>STUDIO AI</span>
          </div>
          <span className="brand-tag">
            {selectedSuite?.name || (health?.status === 'healthy' ? 'CAD ENGINE READY' : 'OFFLINE')}
          </span>
        </div>

        {/* 2. Interactive Workflow Pipeline Stepper */}
        <nav className="workflow-pipeline" aria-label="Workflow Stages">
          <button
            type="button"
            onClick={() => setActiveStage('design')}
            className={`workflow-step-btn ${activeStage === 'design' ? 'is-active' : ''}`}
          >
            <span className="workflow-step-num">01</span>
            <Sparkles size={13} />
            <span>Design</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStage('products')}
            className={`workflow-step-btn ${activeStage === 'products' ? 'is-active' : ''}`}
          >
            <span className="workflow-step-num">02</span>
            <ShoppingBag size={13} />
            <span>Products</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStage('copilot')}
            className={`workflow-step-btn ${activeStage === 'copilot' ? 'is-active' : ''}`}
          >
            <span className="workflow-step-num">03</span>
            <MessageSquare size={13} />
            <span>AI Refine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStage('spatial')}
            className={`workflow-step-btn ${activeStage === 'spatial' ? 'is-active' : ''}`}
          >
            <span className="workflow-step-num">04</span>
            <ShieldCheck size={13} />
            <span>Spatial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStage('sustainability')}
            className={`workflow-step-btn ${activeStage === 'sustainability' ? 'is-active' : ''}`}
          >
            <span className="workflow-step-num">05</span>
            <Leaf size={13} />
            <span>Eco Insights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStage('bom')}
            className={`workflow-step-btn ${activeStage === 'bom' ? 'is-active' : ''}`}
          >
            <span className="workflow-step-num">06</span>
            <Receipt size={13} />
            <span>BOM Spec</span>
          </button>
        </nav>

        {/* 3. Top Metrics & Quick Action */}
        <div className="top-metrics-group">
          <div className="metric-pill metric-pill-eco" title="Calculated annual water conservation">
            <Leaf size={12} />
            <span>{annualSavedGallons.toLocaleString()} Gal/yr</span>
          </div>

          <div className="metric-pill metric-pill-budget" title="Current bundle total price">
            <span>₹{currentTotalCost.toLocaleString('en-IN')}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsBOMModalOpen(true)}
            className="btn-cad btn-cad-primary"
          >
            <Receipt size={13} />
            <span>Export BOM</span>
          </button>
        </div>
      </header>

      {/* 4. Main Architectural Workspace Layout */}
      <main className={`workspace-body stage-${activeStage}`}>
        
        {/* STAGE 1: DESIGN BRIEF & ALTERNATIVES */}
        {activeStage === 'design' && (
          <>
            {/* Left Planning Column: Room Requirements & Parameters */}
            <div className="planning-card">
              <div className="workbench-header">
                <div className="workbench-title">
                  <Sparkles size={14} /> Design Brief &amp; Suite Parameters
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {selectedProducts.length} Placed
                </span>
              </div>
              <div className="planning-card-content">
                {/* Natural Language Prompt Box */}
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="cad-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Wand2 size={12} /> Natural Language Ingestion
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className="cad-input"
                      placeholder="e.g. 10x8 luxury minimalist bathroom under 3L"
                      value={nlRequirementText}
                      onChange={(e) => setNlRequirementText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleExtractNlRequirements()}
                    />
                    <button
                      type="button"
                      onClick={handleExtractNlRequirements}
                      disabled={extractingNl}
                      className="btn-cad btn-cad-primary"
                    >
                      {extractingNl ? 'Parsing...' : 'Extract'}
                    </button>
                  </div>
                  {nlFeedback && (
                    <div style={{ fontSize: '11px', color: 'var(--eco-green)', marginTop: '6px' }}>
                      {nlFeedback}
                    </div>
                  )}
                </div>

                {/* Dimensions Stepper */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="cad-input-group">
                    <label className="cad-label">Length (ft)</label>
                    <input
                      type="number"
                      min={5}
                      max={25}
                      step={0.5}
                      value={roomLength}
                      onChange={(e) => setRoomLength(parseFloat(e.target.value) || 10)}
                      className="cad-input"
                    />
                  </div>
                  <div className="cad-input-group">
                    <label className="cad-label">Width (ft)</label>
                    <input
                      type="number"
                      min={4}
                      max={20}
                      step={0.5}
                      value={roomWidth}
                      onChange={(e) => setRoomWidth(parseFloat(e.target.value) || 8)}
                      className="cad-input"
                    />
                  </div>
                </div>

                {/* Budget Slider */}
                <div className="cad-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="cad-label">Max Budget</label>
                    <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      ₹{budgetMax.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={1000000}
                    step={10000}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(parseInt(e.target.value, 10))}
                    className="cad-range"
                  />
                </div>

                {/* Aesthetic Theme */}
                <div className="cad-input-group">
                  <label className="cad-label">Aesthetic Style</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {['minimalist', 'contemporary', 'modern', 'traditional', 'transitional'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStyle(st)}
                        className="btn-cad"
                        style={{
                          textTransform: 'capitalize',
                          fontSize: '11px',
                          background: selectedStyle === st ? 'var(--accent-black)' : 'var(--bg-subtle)',
                          color: selectedStyle === st ? '#ffffff' : 'var(--text-secondary)',
                          border: `1px solid ${selectedStyle === st ? 'var(--accent-black)' : 'var(--border-light)'}`,
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Required Fixtures Selection */}
                <div className="cad-input-group">
                  <label className="cad-label">Required Fixture Categories</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['toilet', 'basin', 'faucet', 'shower', 'bathtub', 'mirror', 'vanity', 'shower_door'].map((cat) => {
                      const isReq = requiredCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleRequiredCategory(cat)}
                          className="btn-cad btn-cad-secondary"
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: isReq ? 'var(--bg-muted)' : 'transparent',
                            borderColor: isReq ? 'var(--border-medium)' : 'var(--border-light)',
                            fontWeight: isReq ? 700 : 500,
                          }}
                        >
                          {isReq && <Check size={11} style={{ marginRight: '2px' }} />}
                          {cat.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Planning Column: Curated Design Alternatives */}
            <div className="planning-card">
              <div className="workbench-header">
                <div className="workbench-title">
                  <Sparkles size={14} /> Curated Design Suites &amp; Multi-Objective Options
                </div>
                <button
                  type="button"
                  onClick={handleFetchAlternatives}
                  style={{ fontSize: '11px', color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCw size={11} /> Re-Optimize Suites
                </button>
              </div>
              <div className="planning-card-content" style={{ overflowY: 'auto' }}>
                <DesignAlternativesView
                  alternatives={alternatives}
                  selectedDesignId={selectedDesignId}
                  onSelectAlternative={handleSelectAlternative}
                  onRefreshAlternatives={handleFetchAlternatives}
                  loading={loadingAlternatives}
                />
              </div>
            </div>
          </>
        )}

        {/* STAGE 2: PRODUCTS CATALOG + 2D/3D VISUALIZATION */}
        {activeStage === 'products' && (
          <>
            {/* Left Column: Product Catalog */}
            <aside className="arch-workbench">
              <div className="workbench-header">
                <div className="workbench-title">
                  <ShoppingBag size={14} /> Kohler Catalog ({products.length})
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {selectedProducts.length} Placed
                </span>
              </div>

              <div className="workbench-content">
                <SemanticSearchBar
                  onAddProduct={(productId: string) => toggleProductInBundle(productId)}
                  selectedProductIds={selectedProductIds}
                />

                {/* Category Filtering Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {[
                    { id: 'all', label: 'All Fixtures' },
                    { id: 'toilet', label: 'Toilets' },
                    { id: 'basin', label: 'Basins' },
                    { id: 'faucet', label: 'Faucets' },
                    { id: 'shower', label: 'Showers' },
                    { id: 'bathtub', label: 'Bathtubs' },
                    { id: 'mirror', label: 'Mirrors' },
                    { id: 'vanity', label: 'Vanities' },
                    { id: 'shower_door', label: 'Shower Doors' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCategory(c.id)}
                      className="btn-cad"
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: activeCategory === c.id ? 'var(--accent-black)' : 'var(--bg-subtle)',
                        color: activeCategory === c.id ? '#ffffff' : 'var(--text-secondary)',
                        border: `1px solid ${activeCategory === c.id ? 'var(--accent-black)' : 'var(--border-light)'}`,
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* WaterSense Filter */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={ecoFilterOnly}
                    onChange={(e) => setEcoFilterOnly(e.target.checked)}
                  />
                  <span>Show WaterSense / Eco-efficient fixtures only</span>
                </label>

                {/* Catalog Product Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                  {filteredProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          background: isSelected ? 'var(--bg-muted)' : 'var(--bg-surface)',
                          border: `1px solid ${isSelected ? 'var(--border-focus)' : 'var(--border-light)'}`,
                          gap: '10px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                            {p.category.replace('_', ' ')} &bull; {p.model_number || p.id}
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-black)', marginTop: '2px' }}>
                            ₹{p.price_inr?.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleProductInBundle(p.id)}
                          className={`btn-cad ${isSelected ? 'btn-cad-secondary' : 'btn-cad-primary'}`}
                          style={{ fontSize: '11px', padding: '5px 9px' }}
                        >
                          {isSelected ? 'Remove' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Right Column: 2D/3D Visualization Stage & Ribbon */}
            <section className="arch-canvas-stage">
              <div className="viewport-card">
                {/* 3D WebGL Showroom Viewport */}
                <div style={{ width: '100%', minHeight: '540px', display: viewportMode === 'view3d' ? 'block' : 'none', minWidth: 0, overflow: 'hidden' }}>
                  <BathroomView3D
                    layout={spatialLayout}
                    products={selectedProducts}
                    selectedProductIds={selectedProductIds}
                    roomLength={roomLength}
                    roomWidth={roomWidth}
                    themeStyle={selectedStyle}
                    viewMode={viewportMode}
                    onToggleViewMode={setViewportMode}
                    onSelectFixture={(_productId: string) => {
                      setActiveStage('products');
                    }}
                  />
                </div>

                {/* 2D Architectural Floor Plan Viewport */}
                <div style={{ width: '100%', minHeight: '540px', display: viewportMode === 'view2d' ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', minWidth: 0, overflow: 'hidden' }}>
                  <FloorPlan2D
                    layout={spatialLayout}
                    products={selectedProducts}
                    spatialValidation={spatialValidation}
                    onGenerateLayout={handleGenerateLayout}
                    loading={generatingLayout}
                    viewMode={viewportMode}
                    onToggleViewMode={setViewportMode}
                  />
                </div>
              </div>

              {/* Bottom Placed Fixture Ribbon */}
              <div className="fixture-ribbon-card">
                <span className="fixture-ribbon-label">Placed Fixtures ({selectedProducts.length})</span>
                {selectedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="fixture-item-chip"
                    onClick={() => {
                      setActiveStage('products');
                      setSearchQuery(p.id);
                    }}
                    title={`Click to inspect ${p.name}`}
                  >
                    <Droplets size={12} color="var(--text-muted)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '11.5px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                        ₹{p.price_inr?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProductInBundle(p.id);
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* STAGE 3: AI COPILOT REFINEMENT */}
        {activeStage === 'copilot' && (
          <div style={{ width: '100%', maxWidth: '1080px', margin: '0 auto' }}>
            <ConversationalPanel
              currentRequirements={{
                dimensions: { length: roomLength, width: roomWidth, unit: 'ft' },
                budget_max: budgetMax,
                style_preferences: [selectedStyle],
                finish_preferences: [],
                required_categories: requiredCategories,
                excluded_categories: excludedCategories,
              }}
              selectedProductIds={selectedProductIds}
              onApplyRedesign={handleApplyRedesign}
              onApplyDetectedRoom={handleApplyDetectedRoom}
            />
          </div>
        )}

        {/* STAGE 4: SPATIAL VALIDATION + 2D/3D VISUALIZATION + FEASIBILITY DRAWER */}
        {activeStage === 'spatial' && (
          <>
            {/* Left Column: Spatial & NKBA Controls */}
            <aside className="arch-workbench">
              <div className="workbench-header">
                <div className="workbench-title">
                  <ShieldCheck size={14} /> Spatial &amp; NKBA Validation
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {selectedProducts.length} Items
                </span>
              </div>

              <div className="workbench-content">
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: spatialValidation?.is_feasible ? 'var(--eco-bg)' : 'var(--warn-bg)',
                  border: `1px solid ${spatialValidation?.is_feasible ? 'var(--eco-border)' : 'var(--warn-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  {spatialValidation?.is_feasible ? (
                    <CheckCircle2 size={18} color="var(--eco-green)" />
                  ) : (
                    <AlertTriangle size={18} color="var(--warn-red)" />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: spatialValidation?.is_feasible ? 'var(--eco-green)' : 'var(--warn-red)' }}>
                      {spatialValidation?.is_feasible ? 'NKBA Spatial Feasibility Passed' : 'Spatial Constraint Violations Detected'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Room Envelope: {roomLength} × {roomWidth} ft ({roomArea} sq ft)
                    </div>
                  </div>
                </div>

                {/* Violations breakdown */}
                {spatialValidation && spatialValidation.violations && spatialValidation.violations.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="cad-label">Detected Code Violations</div>
                    {spatialValidation.violations.map((v, i) => (
                      <div key={i} style={{ padding: '8px 10px', background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: '4px', fontSize: '11.5px', color: 'var(--warn-red)' }}>
                        &bull; {v}
                      </div>
                    ))}
                  </div>
                )}

                <div className="cad-input-group" style={{ marginTop: 'auto' }}>
                  <div className="cad-label">Spatial Layout Generation</div>
                  <button
                    type="button"
                    onClick={handleGenerateLayout}
                    disabled={generatingLayout}
                    className="btn-cad btn-cad-primary"
                    style={{ width: '100%' }}
                  >
                    <RotateCw size={13} />
                    {generatingLayout ? 'Recomputing Vector Placements...' : 'Regenerate Spatial CAD Layout'}
                  </button>
                </div>
              </div>
            </aside>

            {/* Center Column: 2D/3D Visualization Stage & Ribbon */}
            <section className="arch-canvas-stage">
              <div className="viewport-card">
                {/* 3D WebGL Showroom Viewport */}
                <div style={{ width: '100%', minHeight: '540px', display: viewportMode === 'view3d' ? 'block' : 'none', minWidth: 0, overflow: 'hidden' }}>
                  <BathroomView3D
                    layout={spatialLayout}
                    products={selectedProducts}
                    selectedProductIds={selectedProductIds}
                    roomLength={roomLength}
                    roomWidth={roomWidth}
                    themeStyle={selectedStyle}
                    viewMode={viewportMode}
                    onToggleViewMode={setViewportMode}
                    onSelectFixture={(_productId: string) => {
                      setActiveStage('products');
                    }}
                  />
                </div>

                {/* 2D Architectural Floor Plan Viewport */}
                <div style={{ width: '100%', minHeight: '540px', display: viewportMode === 'view2d' ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', minWidth: 0, overflow: 'hidden' }}>
                  <FloorPlan2D
                    layout={spatialLayout}
                    products={selectedProducts}
                    spatialValidation={spatialValidation}
                    onGenerateLayout={handleGenerateLayout}
                    loading={generatingLayout}
                    viewMode={viewportMode}
                    onToggleViewMode={setViewportMode}
                  />
                </div>
              </div>

              {/* Bottom Placed Fixture Ribbon */}
              <div className="fixture-ribbon-card">
                <span className="fixture-ribbon-label">Placed Fixtures ({selectedProducts.length})</span>
                {selectedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="fixture-item-chip"
                    onClick={() => {
                      setActiveStage('products');
                      setSearchQuery(p.id);
                    }}
                    title={`Click to inspect ${p.name}`}
                  >
                    <Droplets size={12} color="var(--text-muted)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '11.5px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                        ₹{p.price_inr?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProductInBundle(p.id);
                      }}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Right Column: Project Spatial Feasibility Drawer (ONLY ON SPATIAL TAB) */}
            <aside className="arch-summary-drawer">
              <div>
                <div className="summary-section-title">Project Spatial Feasibility</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Space Fit</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-black)' }}>
                      {spatialValidation?.is_feasible ? '100% Valid' : 'Check Code'}
                    </span>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Budget Delta</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: budgetHeadroom >= 0 ? 'var(--eco-green)' : 'var(--warn-red)' }}>
                      {budgetHeadroom >= 0 ? `+₹${budgetHeadroom.toLocaleString('en-IN')}` : `-₹${Math.abs(budgetHeadroom).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="summary-section-title">Specification Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Total Fixtures</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedProducts.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Room Dimensions</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{roomLength} × {roomWidth} ft</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Annual Water Saved</span>
                    <span style={{ fontWeight: 700, color: 'var(--eco-green)' }}>{annualSavedGallons.toLocaleString()} Gal</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
                    <span style={{ fontWeight: 700 }}>Total Project Cost</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-black)', fontSize: '14px' }}>
                      ₹{currentTotalCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setIsBOMModalOpen(true)}
                  className="btn-cad btn-cad-primary"
                  style={{ width: '100%' }}
                >
                  <Receipt size={13} />
                  <span>Full Specification Schedule</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearBundle}
                  className="btn-cad btn-cad-secondary"
                  style={{ width: '100%' }}
                >
                  <Trash2 size={13} />
                  <span>Clear Current Bundle</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* STAGE 5: SUSTAINABILITY METRICS & WHAT-IF ANALYSIS */}
        {activeStage === 'sustainability' && (
          <>
            <div style={{ minWidth: 0 }}>
              <SustainabilityCard
                report={sustainabilityReport}
                loading={loadingSustainability}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <WhatIfMatrixView
                alternatives={alternatives}
                currentProductIds={selectedProductIds}
                roomLength={roomLength}
                roomWidth={roomWidth}
                budgetMax={budgetMax}
                onApplySubstitutions={handleApplySubstitutions}
              />
            </div>
          </>
        )}

        {/* STAGE 6: FULL INLINE BILL OF MATERIALS & SPECIFICATION SCHEDULE */}
        {activeStage === 'bom' && (
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <BOMSpecView
              productIds={selectedProductIds}
              projectTitle="Kohler Master Bathroom Design"
              roomDimensions={`${roomLength} × ${roomWidth} ft`}
              themeStyle={selectedStyle}
              onNavigateToProducts={() => setActiveStage('products')}
            />
          </div>
        )}

      </main>

      {/* 5. Floating AI Copilot Concierge FAB & Drawer */}
      <button
        type="button"
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="chat-fab"
        aria-label="Toggle Kohler AI Copilot"
      >
        <MessageSquare size={16} />
        <span>Copilot</span>
      </button>

      {isChatOpen && (
        <div className="chat-overlay">
          <div style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={15} color="var(--accent-black)" />
              <span style={{ fontWeight: 700, fontSize: '13px' }}>Kohler AI Copilot</span>
            </div>
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-dim)' }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '9px 13px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  background: msg.sender === 'user' ? 'var(--accent-black)' : 'var(--bg-muted)',
                  color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--border-light)',
                }}
              >
                <div>{msg.text}</div>
                {msg.tradeoffs && msg.tradeoffs.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '11px', opacity: 0.85 }}>
                    <strong>Trade-offs:</strong> {msg.tradeoffs.join(', ')}
                  </div>
                )}
              </div>
            ))}
            {isChatSending && (
              <div style={{ alignSelf: 'flex-start', padding: '6px 10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Copilot analyzing catalog constraints...
              </div>
            )}
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '6px' }}>
            <input
              type="text"
              className="cad-input"
              placeholder="Ask Copilot (e.g. swap to matte black fixtures)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendFloatingChatMessage(chatInput)}
            />
            <button
              type="button"
              onClick={() => handleSendFloatingChatMessage(chatInput)}
              disabled={isChatSending}
              className="btn-cad btn-cad-primary"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 6. Specification & BOM Export Modal */}
      {isBOMModalOpen && (
        <BOMExportModal
          isOpen={isBOMModalOpen}
          onClose={() => setIsBOMModalOpen(false)}
          productIds={selectedProductIds}
          projectTitle="Kohler Master Bathroom"
          roomDimensions={`${roomLength} × ${roomWidth} ft`}
          themeStyle={selectedStyle}
        />
      )}

    </div>
  );
}
export default App;
