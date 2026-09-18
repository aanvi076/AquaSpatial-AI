import React, { useState } from 'react';
import { Search, Sparkles, Plus, Check } from 'lucide-react';
import { apiService } from '../services/api';
import type { SearchResultItem } from '../types';

interface SemanticSearchBarProps {
  onAddProduct: (productId: string) => void;
  selectedProductIds: string[];
}

export const SemanticSearchBar: React.FC<SemanticSearchBarProps> = ({
  onAddProduct,
  selectedProductIds,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const items = await apiService.semanticSearch({
        query: query.trim(),
        top_k: 4,
      });
      setResults(items);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Sparkles size={16} color="var(--color-black)" />
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-grey-800)' }}>
          AI Catalog Search &amp; Natural Language Discovery
        </h4>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by feature (e.g. 'smart toilet with heated seat', 'bluetooth rainhead shower', 'freestanding soaking tub')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '38px', height: '42px' }}
          />
          <Search size={16} color="var(--color-grey-400)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ height: '42px' }} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Results List */}
      {hasSearched && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {results.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-grey-500)', textAlign: 'center', padding: '16px' }}>
              No matching Kohler products found for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map(({ product, similarity_score, evidence_snippet }) => {
              const inBundle = selectedProductIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: 'var(--color-grey-50)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    border: '1px solid var(--color-grey-200)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-grey-700)', fontWeight: 700 }}>
                        SKU: {product.model_number || product.id}
                      </span>
                      <span className="badge-verified">
                        {(similarity_score * 100).toFixed(0)}% match
                      </span>
                    </div>

                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-grey-800)' }}>
                      {product.name}
                    </h5>

                    <p style={{ fontSize: '12px', color: 'var(--color-grey-500)', marginTop: '3px', fontStyle: 'italic' }}>
                      {evidence_snippet}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-black)' }}>
                        ₹{product.price_inr.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-grey-400)', textTransform: 'capitalize' }}>
                        {product.category.replace('_', ' ')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddProduct(product.id)}
                      className={`btn btn-sm ${inBundle ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {inBundle ? (
                        <>
                          <Check size={13} />
                          <span>In Bundle</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
