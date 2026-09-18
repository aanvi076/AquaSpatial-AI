import React, { useState } from 'react';
import { 
  Droplets, 
  Leaf, 
  DollarSign, 
  ChevronDown, 
  ChevronUp, 
  Award,
  TrendingDown
} from 'lucide-react';
import type { SustainabilityReport } from '../types';

interface SustainabilityCardProps {
  report: SustainabilityReport | null;
  loading?: boolean;
}

export const SustainabilityCard: React.FC<SustainabilityCardProps> = ({ report, loading }) => {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (loading) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-grey-500)', fontSize: '13px' }}>
        Calculating water consumption &amp; environmental impact...
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--color-grey-200)',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            padding: '8px',
            backgroundColor: 'var(--color-eco-bg)',
            color: 'var(--color-eco-green)',
            borderRadius: '6px',
            border: '1px solid var(--color-eco-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Droplets size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
              Sustainability &amp; Water Efficiency Intelligence
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--color-grey-500)' }}>
              National Building Code (NBC) baseline vs Kohler certified low-flow fixtures
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge-eco">
            <Leaf size={13} />
            {report.aggregate_sustainability_score >= 80 ? 'Gold Rating' : 'Certified Green'}
          </span>
        </div>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {/* 1. Annual Water Saved */}
        <div style={{
          backgroundColor: 'var(--color-grey-50)',
          border: '1px solid var(--color-grey-200)',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-eco-green)', marginBottom: '4px' }}>
            <Droplets size={14} />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Annual Water Saved</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-black)' }}>
            {report.annual_water_saved_liters.toLocaleString()} L
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-eco-green)', fontWeight: 600, marginTop: '2px' }}>
            <TrendingDown size={11} style={{ display: 'inline', marginRight: '3px' }} />
            {report.annual_water_savings_percent.toFixed(1)}% reduction vs NBC standard
          </div>
        </div>

        {/* 2. Utility Bill Savings */}
        <div style={{
          backgroundColor: 'var(--color-grey-50)',
          border: '1px solid var(--color-grey-200)',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-grey-700)', marginBottom: '4px' }}>
            <DollarSign size={14} />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Annual Utility Savings</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-black)' }}>
            ₹{report.annual_utility_cost_savings_inr.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-grey-500)', marginTop: '2px' }}>
            Municipal water tariff at ₹0.045 / L
          </div>
        </div>

        {/* 3. CO2 Emissions Avoided */}
        <div style={{
          backgroundColor: 'var(--color-grey-50)',
          border: '1px solid var(--color-grey-200)',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-grey-700)', marginBottom: '4px' }}>
            <Leaf size={14} />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Carbon Offset</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-black)' }}>
            {report.carbon_offset_kg_co2} kg CO₂e
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-grey-500)', marginTop: '2px' }}>
            Avoided municipal pumping &amp; heating energy
          </div>
        </div>

        {/* 4. Total Water Footprint */}
        <div style={{
          backgroundColor: 'var(--color-grey-50)',
          border: '1px solid var(--color-grey-200)',
          borderRadius: '8px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-grey-700)', marginBottom: '4px' }}>
            <Award size={14} />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Active Suite Footprint</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-black)' }}>
            {report.annual_water_consumption_liters.toLocaleString()} L
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-grey-500)', marginTop: '2px' }}>
            vs {report.baseline_annual_water_liters.toLocaleString()} L baseline
          </div>
        </div>
      </div>

      {/* Comparative Progress Bar */}
      <div style={{
        backgroundColor: 'var(--color-grey-50)',
        border: '1px solid var(--color-grey-200)',
        borderRadius: '8px',
        padding: '14px 18px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-grey-700)' }}>
            ANNUAL CONSUMPTION BENCHMARK
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-eco-green)' }}>
            {report.annual_water_savings_percent.toFixed(0)}% Less Water Than NBC Standard
          </span>
        </div>
        <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--color-grey-200)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
          <div
            style={{
              width: `${Math.min(100, (report.annual_water_consumption_liters / (report.baseline_annual_water_liters || 1)) * 100)}%`,
              backgroundColor: 'var(--color-black)',
              transition: 'width 0.4s ease'
            }}
            title={`Optimized Suite: ${report.annual_water_consumption_liters.toLocaleString()} L`}
          />
          <div
            style={{
              width: `${Math.min(100, Math.max(0, 100 - (report.annual_water_consumption_liters / (report.baseline_annual_water_liters || 1)) * 100))}%`,
              backgroundColor: 'var(--color-eco-green)',
              transition: 'width 0.4s ease'
            }}
            title={`Water Saved: ${report.annual_water_saved_liters.toLocaleString()} L`}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-grey-500)', marginTop: '6px' }}>
          <span>● Suite Use: {report.annual_water_consumption_liters.toLocaleString()} L</span>
          <span style={{ color: 'var(--color-eco-green)', fontWeight: 600 }}>● NBC Baseline: {report.baseline_annual_water_liters.toLocaleString()} L</span>
        </div>
      </div>

      {/* Expandable Fixture Breakdown & Assumptions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="btn btn-secondary btn-sm"
        >
          <span>{showBreakdown ? 'Hide Fixture Breakdown' : 'View Fixture-by-Fixture Consumption'}</span>
          {showBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <button
          type="button"
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="btn btn-secondary btn-sm"
        >
          <span>{showAssumptions ? 'Hide Methodology & Assumptions' : 'NBC Methodology & Tariff Details'}</span>
          {showAssumptions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Breakdown Table */}
      {showBreakdown && (
        <div style={{ marginTop: '14px', borderTop: '1px solid var(--color-grey-200)', paddingTop: '14px' }}>
          <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grey-800)', marginBottom: '8px' }}>
            Fixture-Level Annual Flow Breakdown
          </h5>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-grey-200)', color: 'var(--color-grey-500)', fontSize: '11px' }}>
                  <th style={{ padding: '6px 8px' }}>FIXTURE</th>
                  <th style={{ padding: '6px 8px' }}>FLOW / FLUSH RATE</th>
                  <th style={{ padding: '6px 8px' }}>NBC BASELINE</th>
                  <th style={{ padding: '6px 8px' }}>ANNUAL SAVED</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>ANNUAL CONSUMPTION</th>
                </tr>
              </thead>
              <tbody>
                {report.fixture_breakdowns.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-grey-100)' }}>
                    <td style={{ padding: '8px', fontWeight: 600, color: 'var(--color-grey-800)' }}>
                      {item.name}
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-grey-400)', textTransform: 'capitalize' }}>
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: 'var(--color-eco-green)', fontWeight: 600 }}>
                      {item.flow_rate} {item.unit}
                    </td>
                    <td style={{ padding: '8px', color: 'var(--color-grey-500)' }}>
                      {item.baseline_annual_liters.toLocaleString()} L/yr
                    </td>
                    <td style={{ padding: '8px', color: 'var(--color-eco-green)', fontWeight: 600 }}>
                      {item.annual_saved_liters.toLocaleString()} L ({item.savings_percent.toFixed(0)}%)
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: 'var(--color-grey-800)' }}>
                      {item.annual_consumption_liters.toLocaleString()} L
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assumptions Panel */}
      {showAssumptions && (
        <div style={{
          marginTop: '14px',
          backgroundColor: 'var(--color-grey-50)',
          borderRadius: '8px',
          padding: '14px',
          border: '1px solid var(--color-grey-200)',
          fontSize: '12px',
          color: 'var(--color-grey-700)'
        }}>
          <h5 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-grey-800)', marginBottom: '6px' }}>
            Methodology &amp; Standards Compliance
          </h5>
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {report.labeled_assumptions.map((assump, aIdx) => (
              <li key={aIdx}>{assump}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
