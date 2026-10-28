# EasyCalc SEO and quality roadmap (Netherlands)

## Data availability
Google Search Console query and page reports were not available through the connected tools during this review. A prior check on 13 September 2026 reported **0 web-search clicks** and that Google was still processing data; it did not provide query terms, impressions, CTR, average position or a current page-level performance report. That is a historical baseline, not a claim about today's metrics. Do not treat the keyword priorities below as measured search volume. Export **Performance → Search results → Queries and Pages** for the last 3 and 12 months, then revise priorities using impressions, clicks, CTR, average position and page-level conversion.

## Initial Dutch query clusters and page intent
These are candidate phrases based on the language used by Dutch calculator pages and competitor titles, not volume estimates.

| Priority | Proposed page | Primary intent / focus query | Supporting variants | Why now |
|---|---|---|---|---|
| 1 | `cijfer-berekenen.html` | cijfer berekenen | gemiddelde cijfer berekenen, gewogen gemiddelde berekenen, welk cijfer moet ik halen | Existing page already serves the student task and can be improved without a new tool. |
| 2 | `percentage-berekenen.html` | percentage berekenen | hoeveel procent is, percentage van een getal, procentuele stijging, procentuele daling | Broad everyday use; one page now supports three distinct percentage intents without splitting near-duplicate pages. |
| 3 | `korting-berekenen.html` | korting berekenen | prijs na korting, hoeveel korting, kortingspercentage berekenen | Competitors often provide reverse calculation and savings amount; include both. |
| 4 | `btw-berekenen.html` | btw berekenen | btw terugrekenen, bedrag inclusief btw, bedrag exclusief btw, 9% btw, 21% btw | Clear Dutch tax intent; distinguish inclusive/exclusive input and rates. |
| 5 | `uurloon-berekenen.html` | uurloon berekenen | uurloon naar maandloon, bruto uurloon, salaris per uur | Easier and safer first step than promising a precise net-pay calculation. |
| 6 | `tijd-berekenen.html` | tijd berekenen | uren optellen, tijdsduur berekenen, minuten naar uren | Simple implementation; add overnight and multi-day edge cases. |
| 7 | `gewogen-gemiddelde.html` | gewogen gemiddelde berekenen | gemiddelde met weging, gewogen cijfer | Closely related to school intent; consider keeping on the existing grade page if intent overlaps. |
| 8 | `benodigd-cijfer.html` | welk cijfer moet ik halen | benodigd cijfer berekenen, cijfer nodig voor gemiddelde | A distinct task and a known competitor page type; may be a section/anchor on the grade page first. |
| 9 | `netto-bruto-indicatie.html` | netto-bruto salaris berekenen | netto salaris berekenen 2026, bruto netto indicatie | Live as a clearly limited estimate using official 2026 rates; verify rates annually and avoid promising an exact payslip result. |
| 10 | `bmi-berekenen.html` | bmi berekenen | BMI calculator | Common need, but health context requires careful interpretation; BMI for minors differs from adult BMI. |

## Competitor feature review

- **School grades:** Reken.nu's “Cijfer nodig berekenen” asks for current average, current weighting, target average and next-test weighting, and explains the formula. EasyCalc already supports these inputs; strengthen validation, copy/reset, edge-case handling and examples. Source: https://www.reken.nu/cijfer-nodig-berekenen/
- **Discounts:** Rekenmaat and Notto show price after discount and amount saved. Rekenmaat also covers reverse-calculating a discount; stacked discounts are useful because percentages apply sequentially to the reduced price. EasyCalc now offers normal discount, reverse price and stacked discount modes. Source: https://rekenmaat.nl/korting-berekenen
- **Salary/hourly pay:** Reken.nu includes gross/net hourly pay, monthly equivalents, tax-credit and holiday-pay options. FNV offers gross-to-net guidance and highlights that payroll tax credit and pension deductions affect actual take-home pay. Start with transparent gross conversions; do not imply an exact net amount without maintained tax data. Sources: https://www.reken.nu/uurloon-berekenen/ and https://www.fnv.nl/werk-inkomen/salaris-loon/hoogte-van-het-loon
- **BMI:** Voedingscentrum notes BMI alone does not tell the full health story and asks for age and other context. A generic adult-only interpretation would be insufficient for children/teens. Source: https://www.voedingscentrum.nl/bmi.aspx

Official tax references for the 2026 estimate: https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen and https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/boxen_en_tarieven/box_1/.

## Technical implementation checklist

- [x] Improve homepage statistic-card contrast with an opaque dark surface and high-contrast text.
- [x] Keep visible keyboard focus and minimum touch targets.
- [x] Reduce decorative motion while preserving reduced-motion support.
- [x] Add reset and copy-result controls to the grade calculator.
- [x] Test blank, malformed, out-of-range and decimal-comma inputs in shared calculator logic.
- [x] Set the homepage to apply the selected language on first render, translate its main controls and FAQs, and match Dutch FAQ structured data to the visible Dutch answers.
- [x] Add a prominent responsive grid of ten dedicated Dutch calculator links near the top of the homepage.
- [x] Automated tests cover weighted grades at 1 and 10, invalid grade >10, zero weight, required score below 1, exactly 10 and above 10.
- [x] Automated tests cover inclusive/exclusive VAT, invalid stacked discounts, oversized breaks, and empty salary.
- [ ] Manually verify maximum grade-row limits and keyboard behavior in a browser.
- [ ] Add per-page unique title, meta description, canonical URL, H1 and internal links for each new calculator.
- [x] Add visible focus styling to the new calculator cards and language-aware accessible labels to homepage controls.
- [ ] Manually verify keyboard tab order, focus after validation errors, screen-reader labels, and status announcements in a browser.
- [ ] Run HTML validation and mobile checks at narrow viewport sizes before merging.
- [ ] After deploy, inspect Search Console queries and pages; use actual data to reorder this roadmap.

A dependency-free Node.js regression suite now runs in GitHub Actions for pushes and pull requests. It exercises percentage modes, discount modes, weighted grades, required grades, overnight time, VAT, hourly wage, BMI validation and the net-pay estimate.

## Simplification opportunities

1. The homepage's inline CSS has accumulated overlapping original and premium theme rules. Move the final design tokens into one canonical block and remove superseded declarations in a separate, visually tested refactor.
2. Several page behaviors are embedded as inline `onclick` attributes while additional listeners are attached later. Consolidate event handling gradually, starting with search/category controls.
3. The grade page has repeated `@media(prefers-color-scheme:dark)` blocks and duplicate responsive/reduced-motion rules. Merge them into one dark-mode block and one reduced-motion block after regression tests.
4. Generate calculator card markup from a shared data list only after the existing interactive widgets have test coverage; avoid a large rewrite that risks calculator behavior.
5. Keep all money results explicitly rounded to cents at presentation time, but preserve unrounded values internally until the final output.
