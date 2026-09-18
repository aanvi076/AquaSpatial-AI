import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  ExternalLink, 
  Receipt, 
  Droplets,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import type { BillOfMaterials } from '../types';

interface BOMExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  productIds: string[];
  projectTitle?: string;
  roomDimensions?: string;
  themeStyle?: string;
}

export const BOMExportModal: React.FC<BOMExportModalProps> = ({
  isOpen,
  onClose,
  productIds,
  projectTitle = "Kohler Master Bathroom Design",
  roomDimensions = "10.0 x 8.0 ft",
  themeStyle = "Modern"
}) => {
  const [bom, setBom] = useState<BillOfMaterials | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen || productIds.length === 0) return;

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
  }, [isOpen, productIds, projectTitle, roomDimensions, themeStyle]);

  if (!isOpen) return null;

  const triggerDirectPrint = (htmlContent: string) => {
    // Create an invisible iframe to print without popup blockers
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
      // If popup was blocked, fallback to downloading the HTML file
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

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '940px' }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-grey-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-white)'
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
              <Receipt size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-grey-800)', margin: 0 }}>
                Official Bill of Materials &amp; Specification Sheet
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-grey-500)', margin: '2px 0 0 0' }}>
                Itemized procurement schedule with verified Kohler SKUs, GST breakdown, and rough-in allowance.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px',
              color: 'var(--color-grey-400)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert if present */}
        {exportFeedback && (
          <div style={{
            padding: '10px 24px',
            backgroundColor: exportFeedback.type === 'success' ? '#f0fdf4' : exportFeedback.type === 'info' ? '#f8fafc' : '#fef2f2',
            borderBottom: '1px solid',
            borderColor: exportFeedback.type === 'success' ? '#bbf7d0' : exportFeedback.type === 'info' ? '#e2e8f0' : '#fecaca',
            color: exportFeedback.type === 'success' ? '#166534' : exportFeedback.type === 'info' ? '#0f172a' : '#991b1b',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {exportFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{exportFeedback.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{
          padding: '24px',
          maxHeight: 'calc(85vh - 180px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-grey-500)', fontSize: '13px' }}>
              <div style={{ width: '28px', height: '28px', border: '2px solid #cbd5e1', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
              Compiling Kohler procurement schedule and financial breakdown...
            </div>
          ) : !bom ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-grey-500)' }}>
              No products selected to generate specification schedule.
            </div>
          ) : (
            <>
              {/* Project Meta Banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                backgroundColor: 'var(--color-grey-50)',
                border: '1px solid var(--color-grey-200)',
                borderRadius: '6px',
                padding: '14px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Project</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grey-800)' }}>{bom.project_title}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Room Dimensions</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grey-800)' }}>{bom.room_dimensions}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Design Suite</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grey-800)' }}>{bom.theme_style}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-grey-500)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Schedule Items</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grey-800)' }}>{bom.total_fixture_count} Kohler Units</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div style={{
                border: '1px solid var(--color-grey-200)',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-grey-100)', borderBottom: '1px solid var(--color-grey-200)', color: 'var(--color-grey-700)', textTransform: 'uppercase', fontSize: '11px' }}>
                      <th style={{ padding: '10px 12px', width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '10px 12px' }}>Product &amp; SKU</th>
                      <th style={{ padding: '10px 12px' }}>Category</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Unit Price (INR)</th>
                      <th style={{ padding: '10px 12px' }}>Water Efficiency</th>
                      <th style={{ padding: '10px 12px' }}>Catalog</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bom.line_items.map((it, idx) => (
                      <tr
                        key={it.sku + idx}
                        style={{
                          borderBottom: idx < bom.line_items.length - 1 ? '1px solid var(--color-grey-100)' : 'none',
                          backgroundColor: idx % 2 === 0 ? 'var(--color-white)' : 'var(--color-grey-50)'
                        }}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--color-grey-600)' }}>{it.item_number}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-grey-800)' }}>{it.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-grey-500)', marginTop: '2px' }}>
                            SKU: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{it.model_number || it.sku}</span> | Dim: {it.dimensions_formatted}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-grey-600)', textTransform: 'capitalize' }}>{it.category}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{it.quantity}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-grey-800)' }}>
                          ₹{it.unit_price_inr.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {it.water_efficiency_rating ? (
                            <span className="badge-eco">
                              <Droplets size={11} /> {it.water_efficiency_rating}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-grey-400)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {it.source_url ? (
                            <a
                              href={it.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--color-grey-800)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600 }}
                            >
                              Specs <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--color-grey-400)' }}>Kohler Grounded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Schedule */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '4px'
              }}>
                <div style={{
                  width: '340px',
                  backgroundColor: 'var(--color-grey-50)',
                  border: '1px solid var(--color-grey-200)',
                  borderRadius: '6px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-grey-600)' }}>
                    <span>Fixture Subtotal:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-grey-800)' }}>₹{(bom.financial_summary?.subtotal_inr ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-grey-600)' }}>
                    <span>GST (18.0%):</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-grey-800)' }}>₹{(bom.financial_summary?.gst_amount_inr ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-grey-600)' }}>
                    <span>Valves &amp; Rough-in (10%):</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-grey-800)' }}>₹{(bom.financial_summary?.rough_in_contingency_inr ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '2px solid var(--color-grey-200)',
                    paddingTop: '8px',
                    marginTop: '2px',
                    fontSize: '15px'
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-grey-800)' }}>Grand Total:</span>
                    <span style={{ fontWeight: 800, color: 'var(--color-black)' }}>₹{(bom.financial_summary?.grand_project_total_inr ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Sustainability & Engineering Highlights */}
              <div style={{
                backgroundColor: 'var(--color-grey-50)',
                border: '1px solid var(--color-grey-200)',
                borderRadius: '6px',
                padding: '14px',
                fontSize: '12px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-grey-700)', display: 'block', marginBottom: '6px' }}>
                  Sustainability &amp; Engineering Specifications
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-grey-600)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {(bom.sustainability_highlights || []).map((note: string, nIdx: number) => (
                    <li key={nIdx}>{note}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer / Export Triggers */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-grey-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-white)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-grey-500)' }}>
              Export Format:
            </span>
            <button
              type="button"
              onClick={() => handleExport('tab')}
              disabled={downloading || loading || !bom}
              style={{ background: 'none', border: 'none', color: 'var(--color-black)', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer', padding: 0 }}
            >
              Open Spec in New Tab
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={downloading || loading || !bom}
              className="btn btn-secondary btn-sm"
              title="Download CSV spreadsheet"
            >
              <Download size={13} />
              CSV Excel
            </button>

            <button
              type="button"
              onClick={() => handleExport('html')}
              disabled={downloading || loading || !bom}
              className="btn btn-secondary btn-sm"
              title="Download standalone HTML document"
            >
              <FileText size={13} />
              HTML Spec
            </button>

            <button
              type="button"
              onClick={() => handleExport('json')}
              disabled={downloading || loading || !bom}
              className="btn btn-secondary btn-sm"
              title="Download structured JSON"
            >
              <FileText size={13} />
              JSON Data
            </button>

            <button
              type="button"
              onClick={() => handleExport('print')}
              disabled={downloading || loading || !bom}
              className="btn btn-primary btn-sm"
              title="Opens Print dialog. Select 'Save as PDF' to save PDF"
            >
              <Printer size={13} />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
