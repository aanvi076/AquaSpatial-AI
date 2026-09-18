import React, { useState } from 'react';
import { 
  GitCompare, 
  HelpCircle, 
  Sparkles, 
  Droplets, 
  DollarSign, 
  Maximize2, 
  Sliders 
} from 'lucide-react';
import { apiService } from '../services/api';
import type { 
  DesignAlternative, 
  WhatIfAnalysisResult 
} from '../types';

interface WhatIfMatrixViewProps {
  alternatives: DesignAlternative[];
  currentProductIds: string[];
  roomLength: number;
  roomWidth: number;
  budgetMax: number;
  onApplySubstitutions: (newProductIds: string[]) => void;
}

export const WhatIfMatrixView: React.FC<WhatIfMatrixViewProps> = ({
  alternatives,
  currentProductIds,
  roomLength,
  roomWidth,
  budgetMax,
  onApplySubstitutions,
}) => {
  const [activeScenario, setActiveScenario] = useState<string>('spend_increase');
  const [whatIfResult, setWhatIfResult] = useState<WhatIfAnalysisResult | null>(null);
  const [loadingScenario, setLoadingScenario] = useState<boolean>(false);
  const [spendDelta, setSpendDelta] = useState<number>(25000);

  const scenarioOptions = [
    {
      id: 'spend_increase',
      label: 'Spend Optimization',
      question: 'What do I gain by spending ₹25,000 more?',
      icon: DollarSign,
    },
    {
      id: 'remove_bathtub',
      label: 'Space Recovery',
      question: 'What happens if I remove the bathtub?',
      icon: Maximize2,
    },
    {
      id: 'biggest_water_saver',
      label: 'Conservation',
      question: 'Which change gives the biggest water saving?',
      icon: Droplets,
    },
    {
      id: 'smaller_bathroom',
      label: 'Boundary Contraction',
      question: 'Can I make this design fit a smaller bathroom?',
      icon: Sliders,
    },
    {
      id: 'budget_culprit',
      label: 'Cost Diagnostics',
      question: 'Which product is causing the budget problem?',
      icon: HelpCircle,
    }
  ];

  const handleRunScenario = async (scenarioId: string, delta: number = spendDelta) => {
    setActiveScenario(scenarioId);
    setLoadingScenario(true);
    try {
      const res = await apiService.runWhatIfScenario({
        scenario_type: scenarioId,
        current_product_ids: currentProductIds,
        room_length: roomLength,
        room_width: roomWidth,
        budget_max: budgetMax,
        spend_delta_inr: delta,
      });
      setWhatIfResult(res);
    } catch (err) {
      console.error('What-if scenario failed:', err);
    } finally {
      setLoadingScenario(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION 1: INTERACTIVE WHAT-IF SCENARIOS */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            padding: '8px',
            backgroundColor: 'var(--color-grey-100)',
            color: 'var(--color-grey-800)',
            borderRadius: '6px',
            border: '1px solid var(--color-grey-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sliders size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
              Section 14 Architectural What-If Sensitivity Engine
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--color-grey-500)' }}>
              Explore trade-off elasticity, boundary compression, and water-cost pareto frontiers
            </span>
          </div>
        </div>

        {/* Scenario Selection Chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '18px' }}>
          {scenarioOptions.map((sc) => {
            const Icon = sc.icon;
            const isSelected = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleRunScenario(sc.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-black)' : '1px solid var(--color-grey-200)',
                  backgroundColor: isSelected ? 'var(--color-grey-100)' : 'var(--color-white)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  padding: '6px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? 'var(--color-black)' : 'var(--color-grey-100)',
                  color: isSelected ? 'var(--color-white)' : 'var(--color-grey-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grey-800)' }}>
                    {sc.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-grey-500)', marginTop: '2px', lineHeight: 1.3 }}>
                    {sc.question}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Parameter Slider for Spend Increase */}
        {activeScenario === 'spend_increase' && (
          <div style={{
            backgroundColor: 'var(--color-grey-50)',
            border: '1px solid var(--color-grey-200)',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-grey-700)' }}>
                Incremental Budget Allowance:
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-black)' }}>
                +₹{spendDelta.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={100000}
              step={5000}
              value={spendDelta}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSpendDelta(val);
                handleRunScenario('spend_increase', val);
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-grey-400)', marginTop: '4px' }}>
              <span>+₹5,000</span>
              <span>+₹50,000</span>
              <span>+₹1,00,000</span>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {loadingScenario ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-grey-500)', fontSize: '13px' }}>
            <Sparkles size={20} style={{ animation: 'spin 1.5s linear infinite', marginBottom: '8px', display: 'inline-block' }} />
            <p>Evaluating design elasticity and Kohler upgrade opportunities...</p>
          </div>
        ) : whatIfResult ? (
          <div style={{
            backgroundColor: 'var(--color-grey-50)',
            border: '1px solid var(--color-grey-200)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span className="badge-verified">
                Scenario Result: {whatIfResult.scenario_type.replace(/_/g, ' ')}
              </span>
              <span className="badge-tier badge-verified">
                Verified Sensitivity Analysis
              </span>
            </div>

            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-grey-800)', marginBottom: '6px' }}>
              {whatIfResult.headline}
            </h4>

            <p style={{ fontSize: '13px', color: 'var(--color-grey-700)', lineHeight: 1.5, marginBottom: '14px' }}>
              {whatIfResult.tradeoff_explanation}
            </p>

            {/* Quantitative Impact Highlights */}
            {whatIfResult.quantitative_impact && Object.keys(whatIfResult.quantitative_impact).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {Object.entries(whatIfResult.quantitative_impact).map(([key, val]) => (
                  <div key={key} style={{ background: '#fff', border: '1px solid var(--color-grey-200)', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-grey-500)', display: 'block', fontWeight: 700 }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-black)' }}>
                      {typeof val === 'number' ? (key.includes('cost') || key.includes('inr') || key.includes('price') ? `₹${val.toLocaleString('en-IN')}` : val.toString()) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Upgrade / Swap Recommendations */}
            {whatIfResult.actionable_substitutions && whatIfResult.actionable_substitutions.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-grey-200)', paddingTop: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-grey-600)', display: 'block', marginBottom: '8px' }}>
                  Actionable Product Substitutions
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {whatIfResult.actionable_substitutions.map((up: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        background: '#fff',
                        border: '1px solid var(--color-grey-200)',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grey-800)' }}>
                          {up.product_name || up.fixture || 'Kohler Upgrade'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-grey-500)' }}>
                          {up.tradeoff_rationale || up.reason || ''} &bull; SKU: <strong>{up.product_sku || up.sku || ''}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {up.incremental_cost_inr !== undefined && (
                          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-black)' }}>
                            {up.incremental_cost_inr >= 0 ? `+₹${up.incremental_cost_inr.toLocaleString('en-IN')}` : `-₹${Math.abs(up.incremental_cost_inr).toLocaleString('en-IN')}`}
                          </span>
                        )}
                        {onApplySubstitutions && (up.action_bundle || whatIfResult.resulting_product_ids) && (
                          <button
                            type="button"
                            onClick={() => onApplySubstitutions(up.action_bundle || whatIfResult.resulting_product_ids)}
                            className="btn btn-primary btn-sm"
                          >
                            Apply Swap
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-grey-500)', fontSize: '13px' }}>
            Click a scenario button above to calculate sensitivity trade-offs.
          </div>
        )}
      </div>

      {/* SECTION 2: CROSS-ALTERNATIVE COMPARISON MATRIX */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            padding: '8px',
            backgroundColor: 'var(--color-grey-100)',
            color: 'var(--color-grey-800)',
            borderRadius: '6px',
            border: '1px solid var(--color-grey-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GitCompare size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
              Cross-Alternative Trade-Off Matrix
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--color-grey-500)' }}>
              Comprehensive evaluation of all synthesized Kohler design alternatives
            </span>
          </div>
        </div>

        {/* Matrix Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-grey-200)', color: 'var(--color-grey-600)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>DESIGN SUITE</th>
                <th style={{ padding: '10px 12px' }}>TOTAL COST</th>
                <th style={{ padding: '10px 12px' }}>SPACE FIT</th>
                <th style={{ padding: '10px 12px' }}>GREEN SCORE</th>
                <th style={{ padding: '10px 12px' }}>OVERALL SCORE</th>
                <th style={{ padding: '10px 12px' }}>KEY TRADE-OFF</th>
              </tr>
            </thead>
            <tbody>
              {alternatives.map((alt) => {
                const isCurrent = alt.product_ids.length === currentProductIds.length &&
                  alt.product_ids.every((id) => currentProductIds.includes(id));

                return (
                  <tr
                    key={alt.design_id}
                    style={{
                      borderBottom: '1px solid var(--color-grey-100)',
                      backgroundColor: isCurrent ? 'var(--color-grey-50)' : 'transparent',
                      fontWeight: isCurrent ? 600 : 400
                    }}
                  >
                    <td style={{ padding: '12px', color: 'var(--color-grey-800)' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>{alt.name}</div>
                      <span style={{ fontSize: '10px', color: 'var(--color-grey-500)', textTransform: 'capitalize' }}>
                        {alt.mode.replace(/_/g, ' ')} tier
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 800, color: 'var(--color-black)' }}>
                      ₹{alt.total_price_inr.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--color-grey-700)' }}>
                      {alt.scores.space_efficiency} / 100
                    </td>
                    <td style={{ padding: '12px', color: 'var(--color-eco-green)', fontWeight: 600 }}>
                      {alt.scores.sustainability} / 100
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge-tier" style={{ background: 'var(--color-grey-100)', color: 'var(--color-grey-800)', border: '1px solid var(--color-grey-200)' }}>
                        {alt.scores.overall} / 100
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--color-grey-600)', fontSize: '11px', maxWidth: '240px' }}>
                      {alt.tradeoffs[0] || 'Balanced investment across all NKBA bathroom dimensions.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
