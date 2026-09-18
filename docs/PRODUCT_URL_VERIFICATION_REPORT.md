# Product URL Verification Audit

Audit date: 2026-09-18

## Result

| Measure | Count |
| --- | ---: |
| Products checked | 131 |
| Exact product/SKU/official-PDP verifications | 3 |
| Corrected source URLs | 3 |
| Prior URLs confirmed broken (KOHLER India HTTP 404) | 37 |
| Product/SKU or exact URL not verified | 128 |

## Corrected URLs

| Catalog ID | Model number | Verified official KOHLER India page |
| --- | --- | --- |
| `K-COMPOSED-01` | `K-73050IN-7-CP` | `https://www.kohler.co.in/p/washbasins/composed-single-handle-bathroom-sink-faucet-with-cylindrical-handle-7-5-lpm-73050in-7` |
| `K-AVID-FAUCET-01` | `K-97345IN-4-CP` | `https://www.kohler.co.in/p/washbasins/avid-single-handle-bathroom-sink-faucet-7-0-lpm-97345in-4` |
| `K-BEITOU-WATERFALL-01` | `K-99858IN-4-CP` | `https://www.kohler.co.in/p/washbasins/beitou-single-control-tall-lavatory-faucet-99858in-4` |

## Method and safeguards

The audit used the official KOHLER India PDP sitemap and live product pages. A URL was accepted only when its official page matched the catalog product and exact stored model number. It did not infer URLs from URL patterns or accept retailer/category links.

The catalog contains the original records unchanged except for the three confirmed `source_url` replacements. All other records retain their existing values and have `verification_status: "unverified"`; no product, SKU, price, dimensions, finish, or other specification was invented or deleted.

KOHLER India returned HTTP 404 for 37 prior product URLs. The remaining 94 KOHLER US URLs returned HTTP 403/WAF to the audit client, so a successful automated request was not available as proof of an exact product/SKU match. Those records remain unverified pending a repeatable official-PDP verification.
