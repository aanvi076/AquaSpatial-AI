import React from 'react';
import { 
  Sparkles, 
  Check, 
  Leaf,
  Droplets
} from 'lucide-react';
import type { DesignAlternative } from '../types';

interface DesignAlternativesViewProps {
  alternatives: DesignAlternative[];
  selectedDesignId?: string;
  onSelectAlternative: (alt: DesignAlternative) => void;
  onRefreshAlternatives?: () => void;
  loading?: boolean;
}

export const DesignAlternativesView: React.FC<DesignAlternativesViewProps> = ({
  alternatives,
  selectedDesignId,
  onSelectAlternative,
  onRefreshAlternatives,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-grey-500)' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #0f172a', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.7s linear infinite' }} />
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-grey-800)', marginBottom: '4px' }}>Optimizing Design Suites</h4>
        <p style={{ fontSize: '13px', color: 'var(--color-grey-500)' }}>Synthesizing multi-objective bundles across space, budget, style, and sustainability...</p>
      </div>
    );
  }

  if (alternatives.length === 0) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-grey-500)', marginBottom: '16px', fontSize: '14px' }}>No design alternatives generated yet.</p>
        {onRefreshAlternatives && (
          <button onClick={onRefreshAlternatives} className="btn btn-primary">
            <Sparkles size={15} />
            Generate Design Suites
          </button>
        )}
      </div>
    );
  }

  const getTierLabel = (mode: string) => {
    switch (mode) {
      case 'luxury':
        return { label: 'Premium Tier', isPremium: true };
      case 'eco':
        return { label: 'Eco Tier', isPremium: false };
      case 'space_saver':
        return { label: 'Compact Tier', isPremium: false };
      case 'personalized':
        return { label: 'Custom Tier', isPremium: false };
      default:
        return { label: 'Balanced Tier', isPremium: false };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-grey-800)' }}>
            Curated Kohler Suites
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-grey-500)', marginTop: '2px' }}>
            Multi-constraint optimized packages tailored to your room dimensions and theme.
          </p>
        </div>

        {onRefreshAlternatives && (
          <button
            onClick={onRefreshAlternatives}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={13} />
            Re-Optimize Suites
          </button>
        )}
      </div>

      {/* Alternatives Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
        {alternatives.map((alt) => {
          const tier = getTierLabel(alt.mode);
          const isSelected = selectedDesignId === alt.design_id;

          const annualLiters = Math.round(15000 + (alt.scores.sustainability / 100) * 25000);
          const annualGallons = Math.round(annualLiters * 0.264172);

          return (
            <div
              key={alt.design_id}
              onClick={() => onSelectAlternative(alt)}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--color-black)' : 'var(--color-grey-200)',
                borderWidth: isSelected ? '2px' : '1px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '22px',
                backgroundColor: 'var(--color-white)',
                boxShadow: isSelected ? 'var(--shadow-float)' : 'var(--shadow-card)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                {/* Top Badge & Active Indicator */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: tier.isPremium ? 'var(--color-black)' : 'var(--color-grey-100)',
                      color: tier.isPremium ? 'var(--color-white)' : 'var(--color-grey-800)',
                      border: tier.isPremium ? 'none' : '1px solid var(--color-grey-200)'
                    }}
                  >
                    {tier.label}
                  </span>

                  {isSelected && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--color-black)' }}>
                      <Check size={15} /> Active in 3D
                    </span>
                  )}
                </div>

                {/* Name & Pricing */}
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-grey-800)', marginTop: '6px', marginBottom: '4px' }}>
                  {alt.name}
                </h3>

                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-black)' }}>
                    ₹{alt.total_price_inr.toLocaleString('en-IN')}
                  </span>
                  {alt.budget_headroom_inr >= 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--color-eco-green)', fontWeight: 600 }}>
                      +₹{alt.budget_headroom_inr.toLocaleString('en-IN')} headroom
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--color-warn)', fontWeight: 600 }}>
                      ₹{Math.abs(alt.budget_headroom_inr).toLocaleString('en-IN')} over budget
                    </span>
                  )}
                </div>

                {/* Eco Badge */}
                <div style={{ marginTop: '10px' }}>
                  <span className="badge-eco">
                    <Leaf size={12} />
                    <span>{annualGallons.toLocaleString()} Gal ({annualLiters.toLocaleString()} L) saved/yr</span>
                  </span>
                </div>

                {/* Fit Scores */}
                <div style={{
                  backgroundColor: 'var(--color-grey-50)',
                  border: '1px solid var(--color-grey-200)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginTop: '14px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-grey-700)' }}>Fit Score</span>
                    <span style={{ fontWeight: 800, color: 'var(--color-black)' }}>{alt.scores.overall} / 100</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '11px', color: 'var(--color-grey-600)' }}>
                    <div>Space: <strong style={{ color: 'var(--color-grey-800)' }}>{alt.scores.space_efficiency}%</strong></div>
                    <div>Budget: <strong style={{ color: 'var(--color-grey-800)' }}>{alt.scores.budget_fit}%</strong></div>
                    <div>Style: <strong style={{ color: 'var(--color-grey-800)' }}>{alt.scores.style_match}%</strong></div>
                    <div>Green: <strong style={{ color: 'var(--color-grey-800)' }}>{alt.scores.sustainability}%</strong></div>
                  </div>
                </div>

                {/* Included Fixtures List */}
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-grey-200)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-grey-500)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                    Included Fixtures ({alt.products.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {alt.products.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          background: 'var(--color-grey-50)',
                          border: '1px solid var(--color-grey-200)',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <div style={{ width: '28px', height: '28px', background: '#fff', border: '1px solid var(--color-grey-200)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--color-grey-500)', flexShrink: 0 }}>
                            <Droplets size={13} />
                          </div>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-grey-800)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-grey-500)' }}>
                              SKU: {p.model_number || p.id}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-grey-800)' }}>
                            ₹{p.price_inr?.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-grey-500)', textTransform: 'capitalize' }}>
                            {p.category.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAlternative(alt);
                  }}
                >
                  {isSelected ? 'Current 3D Layout' : 'Switch to this Suite'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
