"""
Natural Language Requirement Extraction Service
Parses freeform customer design briefs into structured DesignRequirements.
"""

import re
from typing import Dict, Any, List, Optional
from backend.models.requirements import DesignRequirements, RoomDimensions, PriorityWeights


class RequirementExtractor:
    @staticmethod
    def extract_from_text(text: str) -> DesignRequirements:
        """
        Extracts structured DesignRequirements from natural language user input.
        """
        text_lower = text.lower()
        uncertainties = []

        # 1. Dimensions extraction (e.g. "8x6 ft", "8 by 6 feet", "10 x 8", "12ft by 9ft")
        dim_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:x|by|\*)\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|foot|m|meter)?', text_lower)
        if dim_match:
            l = float(dim_match.group(1))
            w = float(dim_match.group(2))
            unit = "m" if "meter" in text_lower or " m " in text_lower else "ft"
            # Ensure l >= w
            dimensions = RoomDimensions(
                length=max(l, w),
                width=min(l, w),
                unit=unit
            )
        else:
            dimensions = RoomDimensions(length=10.0, width=8.0, unit="ft")
            uncertainties.append("Room dimensions not explicitly specified; defaulted to 10 x 8 ft.")

        # 2. Budget extraction (e.g. "2 lakhs", "two lakhs", "2.5 lakh", "₹2,00,000", "200000", "300k", "50k")
        budget_max = 300000
        word_to_num = {
            "one": 1.0, "two": 2.0, "three": 3.0, "four": 4.0, "five": 5.0,
            "six": 6.0, "seven": 7.0, "eight": 8.0, "nine": 9.0, "ten": 10.0
        }
        word_lakh_match = re.search(r'\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:lakh|lakhs|lac|lacs)\b', text_lower)
        lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b', text_lower)
        k_match = re.search(r'(\d+(?:\.\d+)?)\s*k\b', text_lower)
        inr_match = re.search(r'(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)', text_lower)
        number_match = re.search(r'\b(\d{5,7})\b', text_lower)

        if word_lakh_match:
            budget_max = int(word_to_num[word_lakh_match.group(1)] * 100000)
        elif lakh_match:
            budget_max = int(float(lakh_match.group(1)) * 100000)
        elif inr_match:
            num_str = inr_match.group(1).replace(',', '')
            budget_max = int(float(num_str))
        elif k_match:
            budget_max = int(float(k_match.group(1)) * 1000)
        elif number_match:
            budget_max = int(number_match.group(1))
        else:
            uncertainties.append("Budget not explicitly specified; defaulted to ₹3,00,000.")

        # 3. Styles extraction
        style_keywords = {
            "minimalist": ["minimalist", "minimal", "clean lines"],
            "zen": ["zen", "japanese", "organic", "peaceful"],
            "luxury": ["luxury", "opulent", "grand", "premium", "classic luxury"],
            "classic": ["classic", "vintage", "traditional", "heritage"],
            "contemporary": ["contemporary", "sleek", "modern"]
        }
        detected_styles = []
        for style_key, terms in style_keywords.items():
            if any(t in text_lower for t in terms):
                detected_styles.append(style_key)

        if not detected_styles:
            detected_styles = ["modern"]

        # 4. Finishes extraction
        finish_keywords = {
            "matte_black": ["matte black", "black matte", "black"],
            "brushed_brass": ["brushed brass", "brass", "gold"],
            "polished_chrome": ["chrome", "polished chrome", "silver"],
            "titanium": ["titanium", "gunmetal"]
        }
        detected_finishes = []
        for finish_key, terms in finish_keywords.items():
            if any(t in text_lower for t in terms):
                detected_finishes.append(finish_key)

        # 5. Required & Excluded Categories
        category_map = {
            "toilet": ["toilet", "commode", "wc"],
            "smart_toilet": ["smart toilet", "intelligent toilet", "bidet toilet", "numi", "veil"],
            "vanity": ["vanity", "cabinet"],
            "basin": ["basin", "sink", "washbasin", "vessel"],
            "shower": ["shower", "rain shower", "showerhead"],
            "bathtub": ["bathtub", "tub", "bath"],
            "accessory": ["mirror", "cabinet", "smart mirror"]
        }

        # Check for exclusions first (e.g. "no bathtub", "without tub", "don't want a bathtub")
        excluded_categories = []
        for cat, terms in category_map.items():
            for t in terms:
                if re.search(rf'\b(?:no|without|dont want|don\'t want|skip|exclude)\s+(?:a\s+)?{re.escape(t)}\b', text_lower):
                    if cat not in excluded_categories:
                        excluded_categories.append(cat)

        # Check for required categories
        required_categories = []
        for cat, terms in category_map.items():
            if cat in excluded_categories:
                continue
            for t in terms:
                if re.search(rf'\b{re.escape(t)}\b', text_lower):
                    if cat not in required_categories:
                        required_categories.append(cat)

        if not required_categories:
            required_categories = ["toilet", "basin", "faucet", "shower"]
            if "bathtub" in excluded_categories and "bathtub" in required_categories:
                required_categories.remove("bathtub")

        # 6. Priority weights adjustment
        p_space = 0.25
        p_budget = 0.20
        p_luxury = 0.20
        p_func = 0.15
        p_sust = 0.10
        p_compat = 0.10

        if "luxury" in detected_styles or "premium" in text_lower:
            p_luxury += 0.15
            p_budget -= 0.05
        if "water saving" in text_lower or "eco" in text_lower or "green" in text_lower:
            p_sust += 0.20
            p_luxury -= 0.10
        if "small" in text_lower or "tight" in text_lower or "compact" in text_lower:
            p_space += 0.15
            p_luxury -= 0.05

        weights = PriorityWeights(
            space=round(p_space, 2),
            budget=round(p_budget, 2),
            luxury=round(p_luxury, 2),
            functionality=round(p_func, 2),
            sustainability=round(p_sust, 2),
            compatibility=round(p_compat, 2)
        )

        return DesignRequirements(
            dimensions=dimensions,
            budget_max=budget_max,
            style_preferences=detected_styles,
            finish_preferences=detected_finishes,
            required_categories=required_categories,
            excluded_categories=excluded_categories,
            priority_weights=weights,
            special_requirements=[text.strip()],
            uncertainties=uncertainties
        )
