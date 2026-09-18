"""
Hybrid Product Retriever and Knowledge Base RAG Engine
Combines semantic vector search (TF-IDF + Cosine Similarity) with deterministic metadata filtering.
Ensures 100% catalog grounding — no hallucinated products or fabricated specs.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.models.product import KohlerProduct
from backend.services.catalog_service import CatalogService


class GroundedProductRetriever:
    def __init__(self, catalog_service: Optional[CatalogService] = None):
        self.catalog = catalog_service or CatalogService()
        self.products: List[KohlerProduct] = list(self.catalog._products.values())
        self._build_index()

    def _build_index(self) -> None:
        """
        Builds a searchable textual corpus and TF-IDF feature matrix from verified Kohler product specs.
        """
        self.corpus: List[str] = []
        self.product_index_map: List[str] = []

        for p in self.products:
            # Construct rich descriptive document
            doc_parts = [
                f"Product: {p.name}",
                f"SKU: {p.id}",
                f"Category: {p.category}",
                f"Subcategory: {p.subcategory or ''}",
                f"Styles: {' '.join(p.styles)}",
                f"Finishes: {' '.join(p.finishes)}",
                f"Features: {' '.join(p.features)}",
                f"Sustainability: {' '.join(p.sustainability_attributes)}",
                f"Installation: {' '.join(p.installation_requirements)}",
                f"Price INR: {p.price_inr}"
            ]
            if p.water_consumption:
                doc_parts.append(
                    f"Water consumption: {p.water_consumption.rate} {p.water_consumption.unit} "
                    f"Rating: {p.water_consumption.efficiency_rating or ''} "
                    f"{'Water saving eco certified' if p.water_consumption.is_water_saving else ''}"
                )

            full_doc = " | ".join(doc_parts)
            self.corpus.append(full_doc)
            self.product_index_map.append(p.id)

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            sublinear_tf=True
        )
        if self.corpus:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)
        else:
            self.tfidf_matrix = None

    def search(
        self,
        query: str,
        category: Optional[str] = None,
        style: Optional[str] = None,
        max_price: Optional[int] = None,
        min_price: Optional[int] = None,
        water_saving_only: bool = False,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Hybrid retrieval: Semantic query similarity reranked over deterministic metadata filters.
        Returns product records with similarity scores and evidence snippets.
        """
        if not self.corpus or self.tfidf_matrix is None:
            return []

        # 1. Compute semantic relevance
        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # 2. Filter & rank
        ranked_indices = np.argsort(-scores)
        results = []

        for idx in ranked_indices:
            p_id = self.product_index_map[idx]
            prod = self.catalog.get_product(p_id)
            if not prod:
                continue

            # Metadata filtering
            if category:
                cat_lower = category.lower()
                prod_cat = prod.category.lower()
                if cat_lower != prod_cat:
                    if not (cat_lower == "toilet" and prod_cat == "smart_toilet"):
                        continue

            if style and style.lower() not in [s.lower() for s in prod.styles]:
                continue

            if max_price is not None and prod.price_inr > max_price:
                continue

            if min_price is not None and prod.price_inr < min_price:
                continue

            if water_saving_only:
                if not (prod.water_consumption and prod.water_consumption.is_water_saving):
                    continue

            sim_score = float(scores[idx])

            # Grounded evidence snippet
            evidence = (
                f"{prod.name} (SKU: {prod.id}): Official catalog price ₹{prod.price_inr:,}. "
                f"Dimensions {prod.dimensions.width}x{prod.dimensions.depth} ft. "
                f"Features: {', '.join(prod.features[:3])}. "
                f"Source: {prod.source_url} (Verification: {prod.verification_status})"
            )

            results.append({
                "product": prod,
                "similarity_score": round(sim_score, 4),
                "evidence_snippet": evidence
            })

            if len(results) >= top_k:
                break

        return results
