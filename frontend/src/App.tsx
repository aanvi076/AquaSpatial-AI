import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Droplets, 
  Maximize2, 
  ExternalLink, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Compass,
  Cpu,
  Layers,
  ShoppingBag,
  Sparkles,
  MessageSquare,
  Wand2,
  GitCompare,
  FileSpreadsheet,
  Receipt,
  Box,
  ChevronDown,
  ChevronUp,
  RotateCw,
  TrendingUp,
  Leaf,
  Send,
  X
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
import { BathroomView3D } from './components/BathroomView3D';

export function App() {
  // System health state
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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

  // Studio Navigation: 'view3d' | 'layout' | 'design' | 'products' | 'copilot' | 'insights'
  const [activeTab, setActiveTab] = useState<'view3d' | 'layout' | 'design' | 'products' | 'copilot' | 'insights'>('view3d');
  const [activeInsightTab, setActiveInsightTab] = useState<'tradeoffs' | 'sustainability'>('tradeoffs');
  const [showFeasibilityDetails, setShowFeasibilityDetails] = useState<boolean>(false);

  // Natural Language Ingestion state
  const [nlRequirementText, setNlRequirementText] = useState('');
  const [extractingNl, setExtractingNl] = useState(false);
  const [nlFeedback, setNlFeedback] = useState<string | null>(null);

  // Sustainability & BOM Export Modal state
  const [sustainabilityReport, setSustainabilityReport] = useState<SustainabilityReport | null>(null);
  const [loadingSustainability, setLoadingSustainability] = useState<boolean>(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState<boolean>(false);

  // Floating Chat overlay state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Welcome to the Kohler AI Design Copilot. Ask me to modify fixtures, adjust budget, swap finishes, or optimize water savings.',
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  // Catalog state
  const [products, setProducts] = useState<KohlerProduct[]>([]);
  const [allCatalogProducts, setAllCatalogProducts] = useState<KohlerProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
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
  const [validating, setValidating] = useState<boolean>(false);

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
        setLoadingCatalog(true);
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
      } finally {
        setLoadingCatalog(false);
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
      setNlFeedback(`Extracted: ${extracted.dimensions?.length}x${extracted.dimensions?.width} ft, ₹${extracted.budget_max?.toLocaleString('en-IN')}, style: ${extracted.style_preferences?.[0]}`);
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
    setActiveTab('view3d');
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
    setActiveTab('view3d');
  };

  // Apply substitutions from What-If Sensitivity Engine
  const handleApplySubstitutions = (newProductIds: string[]) => {
    setSelectedProductIds(newProductIds);
    setActiveTab('view3d');
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
      setValidating(true);
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
      } finally {
        setValidating(false);
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

  return (
    <div className="kohler-app">
      {apiError && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 16px', fontSize: '13px', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
          <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          {apiError}
        </div>
      )}
      {/* 1. Header matching reference */}
      <header className="app-header">
        <div className="container header-inner">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="brand-logo">KOHLER.</span>
            <span className="brand-subtitle">AI Bathroom Designer &amp; Planner {health?.status === "healthy" ? "• Live" : ""}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Water Savings & Price Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
              <span className="badge-eco">
                <Leaf size={13} />
                <span>{annualSavedGallons.toLocaleString()} Gal saved/yr</span>
              </span>
              <span style={{ fontWeight: 800, color: 'var(--color-black)', fontSize: '15px' }}>
                ₹{(validation?.total_cost_inr ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Specification & BOM Button */}
            <button
              type="button"
              onClick={() => setIsBOMModalOpen(true)}
              className="btn btn-primary"
            >
              <Receipt size={15} />
              <span>Specification &amp; BOM</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Studio Content */}
      <main className="container" style={{ marginTop: '24px', marginBottom: '80px', flex: 1 }}>
        {/* Studio Tabs Navigation */}
        <div className="studio-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('view3d')}
            className={`studio-tab-btn ${activeTab === 'view3d' ? 'is-active' : ''}`}
          >
            <Box size={15} />
            <span>3D Visualizer</span>
            <span className="studio-tab-badge">WebGL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`studio-tab-btn ${activeTab === 'layout' ? 'is-active' : ''}`}
          >
            <Layers size={15} />
            <span>2D Floor Plan</span>
            <span className="studio-tab-badge">
              {spatialValidation?.is_feasible ? 'Valid' : 'Schematic'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className={`studio-tab-btn ${activeTab === 'design' ? 'is-active' : ''}`}
          >
            <Sparkles size={15} />
            <span>Design Suites</span>
            <span className="studio-tab-badge">{alternatives.length} Suites</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`studio-tab-btn ${activeTab === 'products' ? 'is-active' : ''}`}
          >
            <ShoppingBag size={15} />
            <span>Product Showroom</span>
            <span className="studio-tab-badge">{allCatalogProducts.length || 131} Products</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copilot')}
            className={`studio-tab-btn ${activeTab === 'copilot' ? 'is-active' : ''}`}
          >
            <MessageSquare size={15} />
            <span>AI Copilot &amp; Vision</span>
            <span className="studio-tab-badge">Multimodal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`studio-tab-btn ${activeTab === 'insights' ? 'is-active' : ''}`}
          >
            <TrendingUp size={15} />
            <span>What-If &amp; Eco Insights</span>
            <span className="studio-tab-badge">Analytics</span>
          </button>
        </div>

        {/* 3. Hero Visualizer Stage (When 3D or 2D tab is active) */}
        {(activeTab === 'view3d' || activeTab === 'layout') && (
          <div style={{ marginBottom: '32px' }}>
            {/* View Mode Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
                  {activeTab === 'view3d' ? '3D Realistic Product Visualization' : '2D Architectural Floor Plan'}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--color-grey-500)', fontWeight: 500 }}>
                  ({selectedSuite?.name || 'Standard Suite'})
                </span>
              </div>

              {/* Segmented Switcher Capsule */}
              <div className="seg-capsule">
                <button
                  type="button"
                  id="toggle-view-3d"
                  onClick={() => setActiveTab('view3d')}
                  className={activeTab === 'view3d' ? 'is-active' : ''}
                >
                  <Box size={14} />
                  <span>3D View</span>
                </button>
                <button
                  type="button"
                  id="toggle-view-2d"
                  onClick={() => setActiveTab('layout')}
                  className={activeTab === 'layout' ? 'is-active' : ''}
                >
                  <Layers size={14} />
                  <span>2D Floor Plan</span>
                </button>
              </div>
            </div>

            {/* Viewport Stage */}
            <div className="viewport-container">
              <div style={{ width: '100%', height: '100%', display: activeTab === 'view3d' ? 'block' : 'none' }}>
                <BathroomView3D
                  layout={spatialLayout}
                  products={selectedProducts}
                  selectedProductIds={selectedProductIds}
                  roomLength={roomLength}
                  roomWidth={roomWidth}
                  themeStyle={selectedStyle}
                  onSelectFixture={(productId) => {
                    const p = (allCatalogProducts.length > 0 ? allCatalogProducts : products).find(prod => prod.id === productId);
                    if (p) {
                      setActiveCategory(p.category);
                      setActiveTab('products');
                    }
                  }}
                />
              </div>
              <div style={{ width: '100%', height: '100%', display: activeTab === 'layout' ? 'block' : 'none' }}>
                <FloorPlan2D
                  layout={spatialLayout}
                  spatialValidation={spatialValidation}
                  products={products}
                  onGenerateLayout={handleGenerateLayout}
                  loading={generatingLayout}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Layout Grid: Brief Form + Tab Views */}
        <div style={{ display: 'grid', gridTemplateColumns: (activeTab === 'view3d' || activeTab === 'layout') ? '380px 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT: DESIGN BRIEF & ROOM CONTROLS (Always visible in 3D/2D views) */}
          {(activeTab === 'view3d' || activeTab === 'layout') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Design Brief Card */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Compass size={18} color="var(--color-black)" />
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>Design Brief</h2>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Studio Input
                  </span>
                </div>

                {/* Natural Language Prompt */}
                <div style={{
                  backgroundColor: 'var(--color-grey-50)',
                  border: '1px solid var(--color-grey-200)',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Wand2 size={13} color="var(--color-grey-700)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-grey-800)' }}>
                      Describe your ideal bathroom
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 10x8 luxury master bath under 3.5 lakhs..."
                      value={nlRequirementText}
                      onChange={(e) => setNlRequirementText(e.target.value)}
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                    />
                    <button
                      type="button"
                      onClick={handleExtractNlRequirements}
                      disabled={extractingNl || !nlRequirementText.trim()}
                      className="btn btn-primary btn-sm"
                    >
                      {extractingNl ? 'Parsing...' : 'Parse'}
                    </button>
                  </div>
                  {nlFeedback && (
                    <div style={{ fontSize: '11px', color: 'var(--color-eco-green)', marginTop: '6px', fontWeight: 600 }}>
                      ✓ {nlFeedback}
                    </div>
                  )}
                </div>

                {/* Bathroom Boundaries */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">
                    BATHROOM BOUNDARIES (FEET)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', display: 'block', marginBottom: '2px' }}>Length (X)</span>
                      <input
                        type="number"
                        className="form-input"
                        value={roomLength}
                        onChange={(e) => setRoomLength(Math.max(4, Number(e.target.value)))}
                        min={4}
                        max={30}
                        step={0.5}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', display: 'block', marginBottom: '2px' }}>Width (Y)</span>
                      <input
                        type="number"
                        className="form-input"
                        value={roomWidth}
                        onChange={(e) => setRoomWidth(Math.max(4, Number(e.target.value)))}
                        min={4}
                        max={30}
                        step={0.5}
                      />
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '12px', 
                    color: 'var(--color-grey-700)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px' 
                  }}>
                    <Maximize2 size={13} />
                    <span>Gross Floor Area: <strong>{roomArea} sq. ft</strong> ({(Number(roomArea) * 0.0929).toFixed(1)} m&sup2;)</span>
                  </div>
                </div>

                {/* Budget Ceiling */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      BUDGET CEILING
                    </label>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-black)' }}>
                      ₹{budgetMax.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={1000000}
                    step={25000}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {[150000, 300000, 500000, 800000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setBudgetMax(preset)}
                        className={`btn btn-sm ${budgetMax === preset ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '4px 0' }}
                      >
                        ₹{(preset / 100000).toFixed(1)}L
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aesthetic Style */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">
                    AESTHETIC STYLE THEME
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {[
                      { id: 'minimalist', label: 'Minimalist Modern' },
                      { id: 'luxury', label: 'Classic Luxury' },
                      { id: 'zen', label: 'Japanese Zen' },
                      { id: 'contemporary', label: 'Contemporary' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyle(style.id)}
                        className={`btn btn-sm ${selectedStyle === style.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ textAlign: 'center', justifyContent: 'center' }}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Required Fixtures */}
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label">
                    REQUIRED FIXTURES
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['toilet', 'basin', 'faucet', 'shower', 'bathtub', 'vanity', 'accessory'].map((cat) => {
                      const isSelected = requiredCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleRequiredCategory(cat)}
                          className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ textTransform: 'capitalize', padding: '4px 10px' }}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {cat.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handleFetchAlternatives}
                  disabled={loadingAlternatives}
                  className="btn btn-primary btn-block"
                >
                  <Sparkles size={15} />
                  <span>{loadingAlternatives ? 'Generating...' : 'Generate Design Alternatives'}</span>
                </button>
              </div>

              {/* Feasibility & Clearance Checks Drawer */}
              <div className="card" style={{ padding: '16px' }}>
                <div 
                  onClick={() => setShowFeasibilityDetails(!showFeasibilityDetails)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={16} color="var(--color-black)" />
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
                        Feasibility &amp; Clearances
                      </h3>
                      <div style={{ fontSize: '11px', color: 'var(--color-grey-500)' }}>
                        {validation?.is_feasible ? 'Physical & financial checks pass' : `${validation?.violations.length || 1} constraint note(s)`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge-tier ${validation?.is_feasible ? 'badge-verified' : 'badge-bad'}`}>
                      {validating ? 'CHECKING...' : validation?.is_feasible ? 'FEASIBLE' : 'ATTENTION'}
                    </span>
                    {showFeasibilityDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Summary Row */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '6px', 
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--color-grey-200)',
                  fontSize: '11px',
                  textAlign: 'center'
                }}>
                  <div style={{ backgroundColor: 'var(--color-grey-50)', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-grey-200)' }}>
                    <span style={{ color: 'var(--color-grey-500)', display: 'block', fontSize: '10px' }}>HEADROOM</span>
                    <span style={{ fontWeight: 700, color: (validation?.budget_headroom_inr ?? 0) >= 0 ? 'var(--color-eco-green)' : 'var(--color-warn)' }}>
                      {(validation?.budget_headroom_inr ?? 0) >= 0 ? '+' : ''}₹{Math.round((validation?.budget_headroom_inr ?? 0) / 1000)}k
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-grey-50)', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-grey-200)' }}>
                    <span style={{ color: 'var(--color-grey-500)', display: 'block', fontSize: '10px' }}>COLLISIONS</span>
                    <span style={{ fontWeight: 700, color: (spatialValidation?.collisions.length ?? 0) === 0 ? 'var(--color-eco-green)' : 'var(--color-warn)' }}>
                      {spatialValidation?.collisions.length ?? 0} Overlaps
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-grey-50)', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-grey-200)' }}>
                    <span style={{ color: 'var(--color-grey-500)', display: 'block', fontSize: '10px' }}>CIRCULATION</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-black)' }}>
                      {spatialValidation ? `${(spatialValidation.usable_ratio * 100).toFixed(0)}%` : '80%'}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {showFeasibilityDetails && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-grey-200)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--color-grey-600)' }}>Total Price:</span>
                      <strong style={{ color: 'var(--color-grey-800)' }}>₹{validation?.total_cost_inr.toLocaleString('en-IN') ?? 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--color-grey-600)' }}>Budget Ceiling:</span>
                      <span style={{ color: 'var(--color-grey-800)' }}>₹{budgetMax.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--color-grey-600)' }}>Remaining:</span>
                      <strong style={{ color: (validation?.budget_headroom_inr ?? 0) >= 0 ? 'var(--color-eco-green)' : 'var(--color-warn)' }}>
                        {(validation?.budget_headroom_inr ?? 0) >= 0 ? '+' : ''}₹{validation?.budget_headroom_inr.toLocaleString('en-IN') ?? 0}
                      </strong>
                    </div>

                    {validation?.violations && validation.violations.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                        {validation.violations.map((v, i) => (
                          <div key={i} style={{ fontSize: '11px', color: 'var(--color-warn)', background: 'var(--color-warn-bg)', border: '1px solid var(--color-warn-border)', padding: '4px 8px', borderRadius: '4px' }}>
                            &bull; {v}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--color-eco-green)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                        <CheckCircle2 size={13} />
                        <span>All spatial clearances verified compliant.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RIGHT: MAIN VIEW CONTENT */}
          <div style={{ width: '100%' }}>
            
            {/* TAB 1: DESIGN ALTERNATIVES SUITES */}
            {activeTab === 'design' && (
              <DesignAlternativesView
                alternatives={alternatives}
                selectedDesignId={selectedDesignId}
                onSelectAlternative={handleSelectAlternative}
                onRefreshAlternatives={handleFetchAlternatives}
                loading={loadingAlternatives}
              />
            )}

            {/* TAB 2: PRODUCT SHOWROOM & CATALOG EXPLORER */}
            {activeTab === 'products' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Semantic Search */}
                <SemanticSearchBar
                  onAddProduct={toggleProductInBundle}
                  selectedProductIds={selectedProductIds}
                />

                {/* Filter Controls */}
                <div className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    {/* Categories */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[
                        { id: 'all', label: 'All Catalog' },
                        { id: 'smart_toilet', label: 'Smart Toilets' },
                        { id: 'toilet', label: 'Toilets' },
                        { id: 'vanity', label: 'Vanities' },
                        { id: 'basin', label: 'Basins' },
                        { id: 'shower', label: 'Showers' },
                        { id: 'faucet', label: 'Faucets' },
                        { id: 'bathtub', label: 'Bathtubs' },
                        { id: 'accessory', label: 'Accessories' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveCategory(cat.id)}
                          className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '4px 10px' }}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Eco Toggle */}
                    <button
                      type="button"
                      onClick={() => setEcoFilterOnly(!ecoFilterOnly)}
                      className={`btn btn-sm ${ecoFilterOnly ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <Leaf size={13} />
                      <span>WaterSense / Eco Only</span>
                    </button>
                  </div>

                  {/* Search Input */}
                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Filter Kohler products by SKU, name, feature, or style..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Product Grid */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-grey-500)', fontWeight: 600 }}>
                      SHOWING {filteredProducts.length} GROUNDED KOHLER PRODUCTS
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-grey-700)' }}>
                      Click product to toggle inclusion in active design bundle
                    </span>
                  </div>

                  {loadingCatalog ? (
                    <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-grey-500)' }}>
                      Loading verified Kohler catalog products...
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                      {filteredProducts.map((prod) => {
                        const inBundle = selectedProductIds.includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            className="card"
                            style={{
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              borderColor: inBundle ? 'var(--color-black)' : 'var(--color-grey-200)',
                              borderWidth: inBundle ? '2px' : '1px',
                              padding: '18px'
                            }}
                          >
                            <div>
                              {/* Top Badges */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span className="badge-verified">
                                  <ShieldCheck size={12} />
                                  Real Kohler SKU
                                </span>
                                {prod.water_consumption?.is_water_saving && (
                                  <span className="badge-eco">
                                    <Droplets size={11} />
                                    {prod.water_consumption.rate} {prod.water_consumption.unit}
                                  </span>
                                )}
                              </div>

                              {/* Title & SKU */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  {prod.model_number || prod.id} &bull; {prod.category.replace('_', ' ')}
                                </span>
                                {prod.source_url && (
                                  <a
                                    href={prod.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--color-grey-700)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 600 }}
                                  >
                                    Specs <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>

                              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-grey-800)', margin: '4px 0 6px 0' }}>
                                {prod.name}
                              </h4>

                              {/* Dimensions and Specs */}
                              <div style={{ fontSize: '12px', color: 'var(--color-grey-500)', display: 'flex', gap: '12px', marginBottom: '10px' }}>
                                <span>Footprint: {prod.dimensions.width} &times; {prod.dimensions.depth} ft</span>
                                <span>H: {prod.dimensions.height} ft</span>
                              </div>

                              {/* Features Tags */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                                {prod.features.slice(0, 3).map((feat, fIdx) => (
                                  <span
                                    key={fIdx}
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--color-grey-700)',
                                      backgroundColor: 'var(--color-grey-100)',
                                      border: '1px solid var(--color-grey-200)',
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {feat}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Bottom Price & Action */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderTop: '1px solid var(--color-grey-200)',
                              paddingTop: '12px',
                              marginTop: '8px'
                            }}>
                              <div>
                                <span style={{ fontSize: '10px', color: 'var(--color-grey-500)', display: 'block', textTransform: 'uppercase' }}>PRICE</span>
                                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-black)' }}>
                                  ₹{prod.price_inr.toLocaleString('en-IN')}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleProductInBundle(prod.id)}
                                className={`btn btn-sm ${inBundle ? 'btn-secondary' : 'btn-primary'}`}
                              >
                                {inBundle ? (
                                  <>
                                    <Trash2 size={13} />
                                    <span>Remove</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus size={13} />
                                    <span>Add to Bundle</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CONVERSATIONAL COPILOT & MULTIMODAL VISION */}
            {activeTab === 'copilot' && (
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
            )}

            {/* TAB 4: WHAT-IF & SUSTAINABILITY INSIGHTS */}
            {activeTab === 'insights' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Sub-Navigation */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--color-grey-200)',
                  paddingBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveInsightTab('tradeoffs')}
                      className={`btn btn-sm ${activeInsightTab === 'tradeoffs' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <GitCompare size={14} />
                      <span>What-If Trade-Off Matrix</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveInsightTab('sustainability')}
                      className={`btn btn-sm ${activeInsightTab === 'sustainability' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <Leaf size={14} />
                      <span>Sustainability &amp; Eco Intelligence</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBOMModalOpen(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Specification BOM</span>
                  </button>
                </div>

                {/* Sub-View Content */}
                {activeInsightTab === 'tradeoffs' && (
                  <WhatIfMatrixView
                    alternatives={alternatives}
                    currentProductIds={selectedProductIds}
                    roomLength={roomLength}
                    roomWidth={roomWidth}
                    budgetMax={budgetMax}
                    onApplySubstitutions={handleApplySubstitutions}
                  />
                )}

                {activeInsightTab === 'sustainability' && (
                  <SustainabilityCard report={sustainabilityReport} loading={loadingSustainability} />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 5. Floating AI Chat FAB & Overlay */}
      <button
        type="button"
        id="chat-toggle-fab"
        className="chat-fab"
        onClick={() => setIsChatOpen(!isChatOpen)}
        title={isChatOpen ? "Close AI Designer" : "Chat with AI Designer"}
      >
        {isChatOpen ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {isChatOpen && (
        <div className="chat-overlay">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--color-white)'
          }}>
            {/* Overlay Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--color-grey-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '4px', backgroundColor: 'var(--color-black)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={15} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
                    Kohler Design Assistant
                  </h4>
                  <span style={{ fontSize: '10px', color: 'var(--color-grey-500)', fontWeight: 600 }}>
                    {isChatSending ? 'Thinking…' : 'AI Tool-Calling Agent'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                style={{ color: 'var(--color-grey-400)', border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Overlay Messages */}
            <div style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {chatMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}
                  >
                    <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {isChatSending && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
                  <div className="chat-bubble chat-bubble-assistant" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <div style={{ width: '12px', height: '12px', border: '2px solid #cbd5e1', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    Adjusting design layout...
                  </div>
                </div>
              )}
            </div>

            {/* Overlay Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendFloatingChatMessage(chatInput);
              }}
              style={{
                padding: '12px',
                borderTop: '1px solid var(--color-grey-200)',
                display: 'flex',
                gap: '8px'
              }}
            >
              <input
                type="text"
                className="form-input"
                placeholder="Ask to refine fixtures, budget, style..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatSending}
                style={{ height: '38px', fontSize: '12px' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isChatSending || !chatInput.trim()}
                style={{ height: '38px', padding: '0 14px' }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Bottom Selected Bundle Dock */}
      <footer className="bundle-dock">
        <div className="bundle-dock-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', overflow: 'hidden' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Active Design Bundle ({selectedProductIds.length} Fixtures)
              </span>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', overflowX: 'auto', maxWidth: '640px' }}>
                {selectedProducts.map((p) => (
                  <span
                    key={p.id}
                    className="bundle-tag-pill"
                  >
                    {p.name.split(' ')[1] || p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-grey-500)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>TOTAL ESTIMATE</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-black)' }}>
                ₹{(validation?.total_cost_inr ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearBundle}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCw size={13} />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBOMModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              <Receipt size={14} />
              <span>Generate &amp; Export BOM</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 7. Bill of Materials Modal */}
      <BOMExportModal
        isOpen={isBOMModalOpen}
        onClose={() => setIsBOMModalOpen(false)}
        productIds={selectedProductIds}
        projectTitle="Kohler Master Bathroom Design"
        roomDimensions={`${roomLength} x ${roomWidth} ft`}
        themeStyle={selectedStyle}
      />
    </div>
  );
}

export default App;
