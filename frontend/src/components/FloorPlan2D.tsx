import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  RotateCw, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { SpatialLayout, FixturePlacement, SpatialValidationResult, KohlerProduct } from '../types';
import { getPlacementCenterAndBounds } from './FixtureMeshBuilder';

interface FloorPlan2DProps {
  layout: SpatialLayout | null;
  spatialValidation?: SpatialValidationResult | null;
  products: KohlerProduct[];
  onGenerateLayout?: () => void;
  loading?: boolean;
}

export const FloorPlan2D: React.FC<FloorPlan2DProps> = ({
  layout,
  spatialValidation,
  products,
  onGenerateLayout,
  loading = false,
}) => {
  const [showClearances, setShowClearances] = useState<boolean>(true);
  const [showZoning, setShowZoning] = useState<boolean>(true);
  const [selectedPlacement, setSelectedPlacement] = useState<FixturePlacement | null>(null);

  const roomLength = layout?.room_length || 10;
  const roomWidth = layout?.room_width || 8;

  const scale = 48;
  const padding = 50;
  const svgWidth = roomLength * scale + padding * 2;
  const svgHeight = roomWidth * scale + padding * 2;

  const productMap = useMemo(() => {
    const map = new Map<string, KohlerProduct>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const selectedProduct = selectedPlacement ? productMap.get(selectedPlacement.product_id) : null;

  if (!layout) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-grey-500)', marginBottom: '16px', fontSize: '14px' }}>No spatial layout generated yet.</p>
        {onGenerateLayout && (
          <button onClick={onGenerateLayout} className="btn btn-primary" disabled={loading}>
            <Sparkles size={15} />
            {loading ? 'Synthesizing...' : 'Generate 2D Layout'}
          </button>
        )}
      </div>
    );
  }

  const isFeasible = spatialValidation?.is_feasible ?? !layout.has_collisions;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
      {/* Top Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--color-black)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
              Architectural Schematic Floor Plan
            </h3>
          </div>
          <span className={`badge-tier ${isFeasible ? 'badge-verified' : 'badge-bad'}`}>
            {isFeasible ? 'NKBA & IBC Code Compliant' : 'Clearance Conflicts'}
          </span>
        </div>

        {/* View Controls & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowClearances(!showClearances)}
            className={`btn btn-sm ${showClearances ? 'btn-primary' : 'btn-secondary'}`}
          >
            {showClearances ? <Eye size={13} /> : <EyeOff size={13} />}
            Clearances
          </button>

          <button
            type="button"
            onClick={() => setShowZoning(!showZoning)}
            className={`btn btn-sm ${showZoning ? 'btn-primary' : 'btn-secondary'}`}
          >
            {showZoning ? <Eye size={13} /> : <EyeOff size={13} />}
            Wet/Dry Zones
          </button>

          {onGenerateLayout && (
            <button
              type="button"
              onClick={onGenerateLayout}
              className="btn btn-secondary btn-sm"
              disabled={loading}
              title="Recompute procedural fixture placements"
            >
              <RotateCw size={13} className={loading ? 'spin-icon' : ''} />
              Re-Layout
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas Stage */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        border: '1px solid var(--color-grey-200)',
        borderRadius: '8px',
        padding: '24px',
        overflow: 'auto',
        minHeight: '440px'
      }}>
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ maxWidth: '100%', height: 'auto', userSelect: 'none' }}
        >
          <defs>
            <pattern id="grid-1ft" width={scale} height={scale} patternUnits="userSpaceOnUse">
              <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
            <pattern id="wet-zone-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 0 12 L 12 0 M 6 18 L 18 6 M -6 6 L 6 -6" stroke="#93c5fd" strokeWidth="1.2" strokeOpacity="0.4" />
            </pattern>
            <pattern id="clearance-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#67e8f9" strokeWidth="1" strokeOpacity="0.6" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect
            x={padding}
            y={padding}
            width={roomLength * scale}
            height={roomWidth * scale}
            fill="url(#grid-1ft)"
          />

          {/* Room Boundary Walls */}
          <rect
            x={padding}
            y={padding}
            width={roomLength * scale}
            height={roomWidth * scale}
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Wet Zone Shading */}
          {showZoning && (
            <g className="zoning-layer">
              <rect
                x={padding + (roomLength - 3.5) * scale}
                y={padding}
                width={3.5 * scale}
                height={3.5 * scale}
                fill="url(#wet-zone-pattern)"
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="4 2"
                strokeOpacity="0.6"
              />
              <text
                x={padding + (roomLength - 3.5) * scale + 8}
                y={padding + 18}
                fill="#1d4ed8"
                fontSize="10"
                fontWeight="700"
                letterSpacing="0.05em"
              >
                WET ZONE
              </text>
            </g>
          )}

          {/* Fixture Clearances Layer */}
          {showClearances && (
            <g className="clearances-layer">
              {layout.placements.map((p, idx) => {
                const { minX, minY, maxX, maxY } = getPlacementCenterAndBounds(p);
                const reqFront = p.clearance_front || (p.category === 'toilet' ? 1.75 : p.category === 'vanity' || p.category === 'basin' ? 1.75 : 1.5);
                const rot = (p.rotation || 0) % 360;

                let clX = minX;
                let clY = minY;
                let clW = maxX - minX;
                let clH = maxY - minY;

                if (rot === 0) {
                  clY += clH;
                  clH = reqFront;
                } else if (rot === 90) {
                  clX -= reqFront;
                  clW = reqFront;
                } else if (rot === 180) {
                  clY -= reqFront;
                  clH = reqFront;
                } else if (rot === 270) {
                  clX += clW;
                  clW = reqFront;
                }

                return (
                  <rect
                    key={`clr-${idx}`}
                    x={padding + clX * scale}
                    y={padding + clY * scale}
                    width={clW * scale}
                    height={clH * scale}
                    fill="url(#clearance-pattern)"
                    stroke="#06b6d4"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    strokeOpacity="0.8"
                  />
                );
              })}
            </g>
          )}

          {/* Door Swing Projection */}
          {layout.doors && layout.doors.length > 0 && (
            <g className="door-layer">
              {layout.doors.map((door, dIdx) => {
                const dX = padding + door.x * scale;
                const dY = padding + door.y * scale;
                const dW = door.width * scale;

                return (
                  <g key={`door-${dIdx}`}>
                    <line x1={dX} y1={dY} x2={dX + dW} y2={dY} stroke="#ffffff" strokeWidth="8" />
                    <line x1={dX} y1={dY} x2={dX + dW} y2={dY} stroke="#b91c1c" strokeWidth="2" strokeDasharray="3 2" />
                    <path
                      d={`M ${dX} ${dY} A ${dW} ${dW} 0 0 0 ${dX + dW} ${dY - dW}`}
                      fill="rgba(239, 68, 68, 0.08)"
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text x={dX + 4} y={dY - 6} fill="#b91c1c" fontSize="10" fontWeight="700">
                      ENTRY DOOR ({door.width}')
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Fixture Placements */}
          <g className="fixtures-layer">
            {layout.placements.map((p, idx) => {
              const { centerX, centerY, minX, minY, maxX, maxY } = getPlacementCenterAndBounds(p);
              const pX = padding + minX * scale;
              const pY = padding + minY * scale;
              const pW = (maxX - minX) * scale;
              const pH = (maxY - minY) * scale;
              const isSelected = selectedPlacement?.product_id === p.product_id;
              const prod = productMap.get(p.product_id);

              return (
                <g
                  key={`fix-${idx}`}
                  onClick={() => setSelectedPlacement(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={pX}
                    y={pY}
                    width={pW}
                    height={pH}
                    fill={isSelected ? '#f1f5f9' : '#ffffff'}
                    stroke={isSelected ? '#000000' : '#334155'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    rx="4"
                  />
                  <text
                    x={padding + centerX * scale}
                    y={padding + centerY * scale}
                    fill="#0f172a"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {p.category.toUpperCase()}
                  </text>
                  <text
                    x={padding + centerX * scale}
                    y={padding + centerY * scale + 13}
                    fill="#64748b"
                    fontSize="9"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {prod ? (prod.model_number || prod.id) : p.product_id}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Top Width Dimension */}
          <line x1={padding} y1={padding - 15} x2={padding + roomLength * scale} y2={padding - 15} stroke="#0f172a" strokeWidth="1.5" />
          <line x1={padding} y1={padding - 20} x2={padding} y2={padding - 10} stroke="#0f172a" strokeWidth="1.5" />
          <line x1={padding + roomLength * scale} y1={padding - 20} x2={padding + roomLength * scale} y2={padding - 10} stroke="#0f172a" strokeWidth="1.5" />
          <text x={padding + (roomLength * scale) / 2} y={padding - 22} fill="#0f172a" fontSize="11" fontWeight="700" textAnchor="middle">
            {roomLength}'-0&quot; ({roomLength * 12}&quot;)
          </text>

          {/* Left Height Dimension */}
          <line x1={padding - 15} y1={padding} x2={padding - 15} y2={padding + roomWidth * scale} stroke="#0f172a" strokeWidth="1.5" />
          <line x1={padding - 20} y1={padding} x2={padding - 10} y2={padding} stroke="#0f172a" strokeWidth="1.5" />
          <line x1={padding - 20} y1={padding + roomWidth * scale} x2={padding - 10} y2={padding + roomWidth * scale} stroke="#0f172a" strokeWidth="1.5" />
          <text x={padding - 22} y={padding + (roomWidth * scale) / 2} fill="#0f172a" fontSize="11" fontWeight="700" textAnchor="middle" transform={`rotate(-90 ${padding - 22} ${padding + (roomWidth * scale) / 2})`}>
            {roomWidth}'-0&quot; ({roomWidth * 12}&quot;)
          </text>
        </svg>
      </div>

      {/* Selected Fixture Details Card */}
      {selectedPlacement && selectedProduct && (
        <div style={{
          backgroundColor: 'var(--color-grey-50)',
          border: '1px solid var(--color-grey-200)',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span className="badge-verified">
                <ShieldCheck size={11} /> Selected Fixture
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', textTransform: 'uppercase' }}>
                {selectedPlacement.category} &bull; Zone: {selectedPlacement.zone || 'dry'}
              </span>
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-grey-800)' }}>
              {selectedProduct.name}
            </h4>
            <div style={{ fontSize: '12px', color: 'var(--color-grey-500)', marginTop: '2px' }}>
              SKU: <strong>{selectedProduct.model_number || selectedProduct.id}</strong> &bull; Footprint: {selectedProduct.dimensions.width} &times; {selectedProduct.dimensions.depth} ft &bull; Rotation: {selectedPlacement.rotation}&deg;
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-black)' }}>
                ₹{selectedProduct.price_inr.toLocaleString('en-IN')}
              </div>
              {selectedProduct.source_url && (
                <a
                  href={selectedProduct.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: 'var(--color-grey-700)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                >
                  Official Specs <ExternalLink size={11} />
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlacement(null)}
              className="btn btn-secondary btn-sm"
            >
              Deselect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
