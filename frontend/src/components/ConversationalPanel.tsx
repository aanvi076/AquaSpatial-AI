import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Image as ImageIcon, 
  Check
} from 'lucide-react';
import { apiService } from '../services/api';
import type { 
  DesignRequirements, 
  DesignAlternative, 
  VisionAnalysisResponse,
  ChatMessage 
} from '../types';

interface ConversationalPanelProps {
  currentRequirements: DesignRequirements;
  selectedProductIds: string[];
  onApplyRedesign: (requirements: DesignRequirements, design: DesignAlternative) => void;
  onApplyDetectedRoom: (dimensions: { length: number; width: number }, styles: string[], requiredCats: string[]) => void;
}

export const ConversationalPanel: React.FC<ConversationalPanelProps> = ({
  currentRequirements,
  selectedProductIds,
  onApplyRedesign,
  onApplyDetectedRoom,
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: "Welcome to the Kohler AI Design Copilot. Tell me how you'd like to modify your bathroom suite (e.g., 'upgrade to luxury smart toilet', 'reduce budget by ₹20,000', 'remove bathtub'), or select one of the quick suggestions below. All changes strictly enforce physical clearances and real Kohler catalog pricing.",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Vision Analysis state
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionResult, setVisionResult] = useState<VisionAnalysisResponse | null>(null);
  const [customRoomLength, setCustomRoomLength] = useState<number>(10);
  const [customRoomWidth, setCustomRoomWidth] = useState<number>(8);
  const [customStyles, setCustomStyles] = useState<string[]>(['modern']);

  // Quick Prompt Chips
  const quickPrompts = [
    "Make it more luxurious.",
    "Reduce the budget by ₹20,000.",
    "Keep the toilet but change everything else.",
    "Prioritize water saving.",
    "Remove the bathtub.",
    "Use matte black finishes."
  ];

  const handleSendMessage = async (msgText: string) => {
    const text = msgText.trim();
    if (!text || isProcessing) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const res = await apiService.conversationalRedesign({
        session_id: 'studio_session',
        user_message: text,
        current_requirements: currentRequirements,
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
        historyTurn: res.history_turn,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Conversational redesign error:', err);
      setErrorMsg(err.message || 'Failed to process conversational instruction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVisionAnalyze = async (filename: string, notes: string) => {
    setVisionLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiService.analyzeImage({
        filename,
        notes,
      });
      setVisionResult(res);
      setCustomRoomLength(res.detected_dimensions.length);
      setCustomRoomWidth(res.detected_dimensions.width);
      setCustomStyles(res.detected_style_cues);
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setErrorMsg(err.message || 'Failed to analyze bathroom photo/plan.');
    } finally {
      setVisionLoading(false);
    }
  };

  const handleApplyVision = () => {
    if (!visionResult) return;
    const cats = visionResult.detected_fixtures.map(f => f.category);
    onApplyDetectedRoom(
      { length: customRoomLength, width: customRoomWidth },
      customStyles,
      cats.length > 0 ? cats : ['toilet', 'vanity', 'shower']
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION 1: CONVERSATIONAL CHAT COPILOT */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '600px' }}>
        {/* Chat Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--color-grey-200)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-black)',
              color: 'var(--color-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
                Kohler AI Architectural Copilot
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--color-grey-500)' }}>
                Conversational Suite Modification with Locked Fixtures &amp; Spatial Enforcement
              </span>
            </div>
          </div>
          <span className="badge-verified">
            Real-Time Deterministic Verification
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '12px' }}>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={isProcessing}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          paddingRight: '6px',
          marginBottom: '14px'
        }}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div
                  className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
                >
                  <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                    {msg.text}
                  </div>

                  {/* Assistant response enhancements */}
                  {!isUser && msg.updatedDesign && (
                    <div style={{ marginTop: '10px', borderTop: '1px solid var(--color-grey-200)', paddingTop: '8px' }}>
                      {/* Intent & Feasibility */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        {msg.intent && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-grey-700)', textTransform: 'capitalize' }}>
                            Intent: {msg.intent.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span className={`badge-tier ${msg.feasible ? 'badge-verified' : 'badge-bad'}`}>
                          {msg.feasible ? 'Physically Feasible' : 'Clearance Issue'}
                        </span>
                      </div>

                      {/* Fixture Diffs */}
                      {(msg.addedFixtures?.length || msg.removedFixtures?.length) ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {msg.addedFixtures?.map(sku => (
                            <span key={sku} style={{ fontSize: '11px', color: 'var(--color-eco-green)', background: 'var(--color-eco-bg)', border: '1px solid var(--color-eco-border)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              + {sku}
                            </span>
                          ))}
                          {msg.removedFixtures?.map(sku => (
                            <span key={sku} style={{ fontSize: '11px', color: 'var(--color-warn)', background: 'var(--color-warn-bg)', border: '1px solid var(--color-warn-border)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              - {sku}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {/* Evidence Citations */}
                      {msg.evidenceCitations && msg.evidenceCitations.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--color-grey-600)', marginBottom: '8px' }}>
                          <strong>Catalog grounding:</strong> {msg.evidenceCitations.join(', ')}
                        </div>
                      )}

                      {/* Apply button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (msg.updatedDesign) {
                            onApplyRedesign(
                              {
                                ...currentRequirements,
                                budget_max: msg.updatedDesign.total_price_inr || currentRequirements.budget_max
                              },
                              msg.updatedDesign
                            );
                          }
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        <Check size={13} />
                        Apply Refinement to Active Studio
                      </button>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--color-grey-400)', alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
                  {msg.timestamp}
                </span>
              </div>
            );
          })}
          {isProcessing && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
              <div className="chat-bubble chat-bubble-assistant" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-grey-600)' }}>
                <div style={{ width: '14px', height: '14px', border: '2px solid #cbd5e1', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                Analyzing requirements &amp; verifying spatial feasibility...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Tell Copilot how to adjust fixtures, budget, style, or water..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            style={{ height: '42px' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isProcessing || !inputText.trim()}
            style={{ height: '42px', padding: '0 18px' }}
          >
            <Send size={15} />
          </button>
        </form>
        {errorMsg && (
          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* SECTION 2: MULTIMODAL PHOTO & FLOOR PLAN INGESTION */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            backgroundColor: 'var(--color-grey-100)',
            color: 'var(--color-grey-800)',
            border: '1px solid var(--color-grey-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ImageIcon size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
              Multimodal Bathroom Photo &amp; Floor Plan Ingestion
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--color-grey-500)' }}>
              Detect room boundaries, fixtures, and color palettes from reference photos or sketches
            </span>
          </div>
        </div>

        {/* Preset Sample Images */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          {[
            { filename: 'master_bath_luxury.jpg', label: 'Master Bathroom Photo', desc: '10x8 luxury ensuite with rain shower' },
            { filename: 'zen_powder_room.jpg', label: 'Zen Powder Room', desc: '7x5 Japanese organic minimalist bath' },
            { filename: 'compact_3pc_plan.png', label: 'Architectural Floor Plan', desc: '8x6 builder plan with wet zone' }
          ].map((sample) => (
            <button
              key={sample.filename}
              type="button"
              onClick={() => handleVisionAnalyze(sample.filename, sample.desc)}
              disabled={visionLoading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'left',
                cursor: 'pointer',
                border: '1px solid var(--color-grey-200)',
                backgroundColor: 'var(--color-grey-50)',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grey-800)' }}>{sample.label}</span>
              <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', marginTop: '2px' }}>{sample.desc}</span>
            </button>
          ))}
        </div>

        {/* Vision Analysis Results Preview */}
        {visionLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-grey-500)', fontSize: '13px' }}>
            <div style={{ width: '28px', height: '28px', border: '2px solid #cbd5e1', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
            Running computer vision geometry and fixture recognition...
          </div>
        ) : visionResult ? (
          <div style={{
            backgroundColor: 'var(--color-grey-50)',
            border: '1px solid var(--color-grey-200)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge-verified">
                Vision Ingestion: {visionResult.detected_style_cues?.[0] || 'Bathroom'} ({(visionResult.confidence_score * 100).toFixed(0)}% Confidence)
              </span>
              <button
                type="button"
                onClick={handleApplyVision}
                className="btn btn-primary btn-sm"
              >
                <Check size={13} />
                Apply Dimensions to Studio ({customRoomLength} &times; {customRoomWidth} ft)
              </button>
            </div>

            {/* Detected Dimensions Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Detected Length (ft)</label>
                <input
                  type="number"
                  className="form-input"
                  value={customRoomLength}
                  onChange={(e) => setCustomRoomLength(Number(e.target.value))}
                  min={4}
                  max={25}
                  step={0.5}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '11px' }}>Detected Width (ft)</label>
                <input
                  type="number"
                  className="form-input"
                  value={customRoomWidth}
                  onChange={(e) => setCustomRoomWidth(Number(e.target.value))}
                  min={4}
                  max={25}
                  step={0.5}
                />
              </div>
            </div>

            {/* Detected Fixtures */}
            <div style={{ fontSize: '12px', color: 'var(--color-grey-700)', marginBottom: '8px' }}>
              <strong>Detected fixtures:</strong> {visionResult.detected_fixtures.map(f => `${f.category} (${f.confidence})`).join(', ')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-grey-700)' }}>
              <strong>Plumbing wall:</strong> {visionResult.primary_plumbing_wall || 'Back'} wall
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
