import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  FileText, 
  ExternalLink, 
  Receipt, 
  Droplets,
  CheckCircle2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { apiService } from '../services/api';
import type { BillOfMaterials } from '../types';

interface BOMSpecViewProps {
  productIds: string[];
  projectTitle?: string;
  roomDimensions?: string;
  themeStyle?: string;
  onNavigateToProducts?: () => void;
}

export const BOMSpecView: React.FC<BOMSpecViewProps> = ({
  productIds,
  projectTitle = "Kohler Master Bathroom Design",
  roomDimensions = "10.0 x 8.0 ft",
  themeStyle = "Modern",
  onNavigateToProducts
}) => {
  const [bom, setBom] = useState<BillOfMaterials | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (productIds.length === 0) {
      setBom(null);
      setLoading(false);
      return;
    }

    async function loadBOM() {
      setLoading(true);
      setExportFeedback(null);
      try {
        const data = await apiService.generateBOM({
          product_ids: productIds,
          project_title: projectTitle,
          room_dimensions: roomDimensions,
          theme_style: themeStyle,
          gst_rate: 18.0
        });
        setBom(data);
      } catch (err) {
        console.error('Failed to generate BOM:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBOM();
  }, [productIds, projectTitle, roomDimensions, themeStyle]);

  const triggerDirectPrint = (htmlContent: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setExportFeedback({
            type: 'success',
            message: 'Print dialog opened! In the Destination dropdown, select "Save as PDF" to save your official Kohler Specification Sheet.'
          });
        } catch (printErr) {
          console.error('Print execution error:', printErr);
          openInNewTab(htmlContent);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 400);
    } else {
      openInNewTab(htmlContent);
    }
  };

  const openInNewTab = (htmlContent: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow) {
      downloadBlob(htmlContent, 'text/html', `Kohler_SpecSheet_${Date.now()}.html`);
      setExportFeedback({
        type: 'info',
        message: 'Specification sheet downloaded as HTML file. Open it in any browser and press Ctrl+P to save as PDF.'
      });
    } else {
      setExportFeedback({
        type: 'info',
        message: 'Specification sheet opened in new tab. Press Ctrl+P (or Cmd+P) and select "Save as PDF".'
      });
    }
  };

  const downloadBlob = (content: string, mimeType: string, filename: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'csv' | 'json' | 'html' | 'print' | 'tab') => {
    setDownloading(true);
    setExportFeedback(null);
    try {
      const res = await apiService.exportBOM({
        product_ids: productIds,
        export_format: format === 'print' || format === 'tab' ? 'html' : format,
        project_title: projectTitle,
        room_dimensions: roomDimensions,
        theme_style: themeStyle,
      });

      if (format === 'print') {
        triggerDirectPrint(res.content);
      } else if (format === 'tab') {
        openInNewTab(res.content);
      } else {
        downloadBlob(res.content, res.mime_type, res.filename);
        setExportFeedback({
          type: 'success',
          message: `Downloaded ${res.filename} successfully.`
        });
      }
    } catch (err: any) {
      console.error('Failed to export BOM:', err);
      setExportFeedback({
        type: 'error',
        message: `Failed to export specification: ${err.message || 'Unknown error'}`
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-light)', borderTop: '3px solid var(--accent-black)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 16px' }} />
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Compiling Kohler Bill of Materials &amp; Procurement Schedule...
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Aggregating SKU details, rough-in plumbing allowances, GST breakdown, and sustainability specifications.
        </p>
      </div>
    );
  }

  if (!bom || productIds.length === 0) {
    return (
      <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <Receipt size={40} style={{ margin: '0 auto 16px', color: 'var(--text-dim)' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          No Fixtures in Current Specification
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px' }}>
          Select fixtures from the Kohler Product Catalog or choose a curated Design Suite to generate an itemized Bill of Materials and contractor schedule.
        </p>
        {onNavigateToProducts && (
          <button
            type="button"
            onClick={onNavigateToProducts}
            className="btn-cad btn-cad-primary"
            style={{ margin: '0 auto' }}
          >
            <ShoppingBag size={14} />
            <span>Browse Kohler Catalog</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      
      {/* Header & Export Actions Ribbon */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-black)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Receipt size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Official Bill of Materials &amp; Specification Schedule
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Itemized procurement schedule with verified Kohler SKUs, GST breakdown, and rough-in allowance.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleExport('tab')}
              disabled={downloading}
              className="btn-cad btn-cad-secondary"
              title="Open standalone document in new browser tab"
            >
              <ExternalLink size={13} />
              <span>Open Tab</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={downloading}
              className="btn-cad btn-cad-secondary"
              title="Download CSV spreadsheet"
            >
              <Download size={13} />
              <span>CSV Excel</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('html')}
              disabled={downloading}
              className="btn-cad btn-cad-secondary"
              title="Download standalone HTML document"
            >
              <FileText size={13} />
              <span>HTML Spec</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('json')}
              disabled={downloading}
              className="btn-cad btn-cad-secondary"
              title="Download structured JSON"
            >
              <FileText size={13} />
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('print')}
              disabled={downloading}
              className="btn-cad btn-cad-primary"
              title="Opens Print dialog. Select 'Save as PDF' to save PDF"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert if present */}
        {exportFeedback && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            backgroundColor: exportFeedback.type === 'success' ? 'var(--eco-bg)' : exportFeedback.type === 'info' ? 'var(--bg-muted)' : 'var(--warn-bg)',
            border: `1px solid ${exportFeedback.type === 'success' ? 'var(--eco-border)' : exportFeedback.type === 'info' ? 'var(--border-light)' : 'var(--warn-border)'}`,
            borderRadius: '6px',
            color: exportFeedback.type === 'success' ? 'var(--eco-green)' : exportFeedback.type === 'info' ? 'var(--text-primary)' : 'var(--warn-red)',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {exportFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{exportFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Project Meta Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        padding: '14px 18px'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Project Title</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{bom.project_title}</span>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Room Dimensions</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{bom.room_dimensions}</span>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Design Suite</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{bom.theme_style}</span>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Schedule Items</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-black)' }}>{bom.total_fixture_count} Kohler Units</span>
        </div>
      </div>

      {/* Line Items Schedule Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '12px 14px' }}>Product &amp; SKU</th>
                <th style={{ padding: '12px 14px' }}>Category</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Unit Price (INR)</th>
                <th style={{ padding: '12px 14px' }}>Water Efficiency</th>
                <th style={{ padding: '12px 14px' }}>Catalog Spec</th>
              </tr>
            </thead>
            <tbody>
              {bom.line_items.map((it, idx) => (
                <tr
                  key={it.sku + idx}
                  style={{
                    borderBottom: idx < bom.line_items.length - 1 ? '1px solid var(--border-light)' : 'none',
                    backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)'
                  }}
                >
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--text-dim)' }}>{it.item_number}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{it.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      SKU: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{it.model_number || it.sku}</span> {it.dimensions_formatted ? `| Dim: ${it.dimensions_formatted}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{it.category.replace('_', ' ')}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>{it.quantity}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    ₹{it.unit_price_inr.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {it.water_efficiency_rating ? (
                      <span className="badge-eco" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'var(--eco-bg)', color: 'var(--eco-green)', border: '1px solid var(--eco-border)' }}>
                        <Droplets size={11} /> {it.water_efficiency_rating}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {it.source_url ? (
                      <a
                        href={it.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-black)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Specs <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '11.5px' }}>Kohler Grounded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Breakdown & Sustainability Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        
        {/* Financial Totals */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
            Financial Breakdown &amp; Contingency
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <span>Fixture Subtotal:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>₹{(bom.financial_summary?.subtotal_inr ?? 0).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <span>GST (18.0%):</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>₹{(bom.financial_summary?.gst_amount_inr ?? 0).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <span>Valves &amp; Rough-in Contingency (10%):</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>₹{(bom.financial_summary?.rough_in_contingency_inr ?? 0).toLocaleString('en-IN')}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '2px solid var(--border-light)',
            paddingTop: '10px',
            marginTop: '4px',
            fontSize: '16px'
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Grand Project Total:</span>
            <span style={{ fontWeight: 800, color: 'var(--accent-black)', fontFamily: 'var(--font-mono)' }}>
              ₹{(bom.financial_summary?.grand_project_total_inr ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Sustainability & Engineering Highlights */}
        <div className="card" style={{ padding: '18px 20px', fontSize: '12.5px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
            Sustainability &amp; Engineering Specifications
          </span>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(bom.sustainability_highlights || []).map((note: string, nIdx: number) => (
              <li key={nIdx}>{note}</li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
};
