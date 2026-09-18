"""
Catalog Service for Kohler AI Bathroom Designer
Loads verified catalog data, ensures deterministic schema validation,
and offers metadata filtering and lookup functions.
"""

import json
import logging
from pathlib import Path
from typing import List, Dict, Optional, Set, Any
from backend.models.product import KohlerProduct

logger = logging.getLogger(__name__)


class CatalogService:
    def __init__(self, catalog_path: Optional[str] = None):
        if catalog_path is None:
            # Default to data/products/kohler_catalog.json
            base_dir = Path(__file__).resolve().parent.parent.parent
            catalog_path = str(base_dir / "data" / "products" / "kohler_catalog.json")
        self.catalog_path = catalog_path
        self._products: Dict[str, KohlerProduct] = {}
        self._category_index: Dict[str, List[str]] = {}
        self._style_index: Dict[str, List[str]] = {}
        self._load_catalog()

    def _load_catalog(self) -> None:
        path = Path(self.catalog_path)
        if not path.exists():
            logger.warning(f"Catalog file not found at {path}")
            return

        with open(path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        self._products.clear()
        self._category_index.clear()
        self._style_index.clear()

        for item in raw_data:
            try:
                prod = KohlerProduct(**item)
                self._products[prod.id] = prod

                # Index by category
                cat = prod.category.lower()
                self._category_index.setdefault(cat, []).append(prod.id)

                # Index by styles
                for style in prod.styles:
                    self._style_index.setdefault(style.lower(), []).append(prod.id)

            except Exception as e:
                logger.error(f"Error validating product {item.get('id', 'unknown')}: {e}")

        logger.info(f"Loaded {len(self._products)} catalog products from {path}")

    @property
    def total_products(self) -> int:
        return len(self._products)

    def get_product(self, product_id: str) -> Optional[KohlerProduct]:
        return self._products.get(product_id)

    def list_products(
        self,
        category: Optional[str] = None,
        style: Optional[str] = None,
        max_price: Optional[int] = None,
        min_price: Optional[int] = None,
        finish: Optional[str] = None,
        water_saving_only: bool = False,
    ) -> List[KohlerProduct]:
        """Search and filter products using structured metadata attributes."""
        results: List[KohlerProduct] = []

        for prod in self._products.values():
            if category and prod.category.lower() != category.lower():
                # Allow smart_toilet when searching for toilet
                if not (category.lower() == "toilet" and prod.category.lower() == "smart_toilet"):
                    continue

            if style and style.lower() not in [s.lower() for s in prod.styles]:
                continue

            if max_price is not None and prod.price_inr > max_price:
                continue

            if min_price is not None and prod.price_inr < min_price:
                continue

            if finish and finish.lower() not in [f.lower() for f in prod.finishes]:
                continue

            if water_saving_only:
                if not (prod.water_consumption and prod.water_consumption.is_water_saving):
                    continue

            results.append(prod)

        return results

    def get_categories(self) -> List[str]:
        return sorted(list(self._category_index.keys()))

    def get_styles(self) -> List[str]:
        return sorted(list(self._style_index.keys()))

    def get_all_finishes(self) -> List[str]:
        finishes: Set[str] = set()
        for prod in self._products.values():
            finishes.update(prod.finishes)
        return sorted(list(finishes))

    def check_compatibility(self, product_ids: List[str]) -> Dict[str, Any]:
        """Verify mutual compatibility between a list of product IDs."""
        id_set = set(product_ids)
        conflicts = []
        compatible_pairs = []

        for pid in product_ids:
            prod = self.get_product(pid)
            if not prod:
                continue
            # Check explicit incompatibilities
            for incomp in prod.incompatible_product_ids:
                if incomp in id_set:
                    conflicts.append({
                        "product_a": pid,
                        "product_b": incomp,
                        "reason": f"Explicit conflict declared in {pid} specifications."
                    })
            # Check synergies
            for comp in prod.compatible_product_ids:
                if comp in id_set:
                    compatible_pairs.append({
                        "product_a": pid,
                        "product_b": comp
                    })

        return {
            "is_compatible": len(conflicts) == 0,
            "conflicts": conflicts,
            "synergies": compatible_pairs
        }
