# Theme 9 and 13: Structuring information, Consultation

## Summary
There are 66 groups (9.1: 21, 9.2: 9, 9.3: 23, 9.4: 1, 13.1/13.3/13.9: 12). I put them under 15 headings. Verdicts by heading: PACK RIGHT 6, BOTH PARTLY 3, OTHER RIGHT 1, NOT A REAL DIFFERENCE 2, and 3 coverage gaps (one worth adopting). I loaded 15 pages live (11 sites, sequential, 3.5 s apart).

- **9.1 hierarchy (the main point).** a11ylint and ARNEO fail headings the pack passes. Most of their failures are false positives:
  - Both read every `hx` and `role=heading` in the DOM, hidden ones included (cookie panels, `display:none` menus, Bouygues' hidden "Espace client" h6).
  - a11ylint also uses `Math.abs(level - previous) > 1`, so it fails a *return* from h4 to h2 (LCL: 6 such failures on one page, Nord: h3 to h1).
  - They do catch one real pack gap. Core's `heading-order` compares each heading with the *highest level reached so far*, not with the previous heading. A later h2→h4 skip is hidden if an h4 appeared earlier, even in the cookie banner. Live, this missed a visible h2→h4 on iledefrance.fr ("Partager la page") and on caisse-epargne.fr ("Contacter l'Arcom"): 2 of the 6 "pack pass / ARNEO fail" pages I sampled. The other 4 were hidden-heading false positives on ARNEO's side.
  - Missing h1 (stan's "probable_error"): RGAA does not require an h1. On Bouygues, the only level-1 headings are hidden.
- **`p-as-heading`** asks on 63 pages. It is targeted, but about 38 % of its 384 occurrences can be filtered out mechanically: digits or numbering only ("42000", "N° 2026-441"), visually hidden text (52 Insee social-icon divs), and paragraphs that are only a link.
- **`rgaa-heading-content-present`** fails on 13 pages. Every failure I checked is right: a truly empty `hx`, or one whose only content is `display:none`.
- **9.2.** The pack is right on Bordeaux, where a visible `<main>` is nested inside another one. ARNEO is right that the Bouygues home page has no `<main>`, where the pack only asks.
- **9.3.** The pack's list failures are about half sound and half overstated:
  - Sound: `ul > div > li` on Insee and LCL, and `ul role=region` on Caisse d'Epargne.
  - Overstated: Drupal pagers with `<li role="presentation">…</li>`, which is 10 pages, and Owl carousels with `li role=group`, which is 7.
- **13.x.** The pack is the only engine reporting. `css-orientation-lock` asks on 33 pages for one reason only: cross-origin stylesheets could not be read. That is a scan limitation, not a question about the page.

## Criterion 9.1

### Heading hierarchy failed by a11ylint, ARNEO and stan — a11ylint/arneo/stan OTHER_FAILS and OTHER_ASKS, a11ylint OTHER_MORE_ELEMENTS, 61 / 45 / 10 / 52 / 6 pages, 11 sites
Groups: `9.1 a11ylint OTHER_FAILS RGAA - 9.1.1`, `9.1 arneo OTHER_FAILS arneo-9.1`, `9.1 stan OTHER_FAILS stan-9.1`, `9.1 stan OTHER_ASKS stan-9.1`, `9.1 a11ylint OTHER_MORE_ELEMENTS RGAA - 9.1.1`
- **What differs:** a11ylint fails every heading that differs by more than one level from the heading before it. ARNEO fails the whole criterion when any heading goes deeper by more than one level. stan fails a page with no `<h1>`, and asks when a page has several h1, a jump, a "title"-like class, or few headings. On these pages the pack passes, asks (through `heading-order` or `p-as-heading`), or finds the criterion inapplicable.
- **Verdict:** BOTH PARTLY.
  - Test 9.1.1 asks whether the hierarchy is *relevant*. A skipped level is evidence, not an automatic failure. That is why the pack's `heading-order` asks (cantTell) instead of failing.
  - The headings that count are those rendered to assistive technology. Under that reading, most other-engine failures are false positives.
  - The others are right that the pack misses some real visible skips (see the proposal below).
- **Evidence (15 live loads; heading sequences rebuilt with `checkVisibility` and `aria-hidden`/`inert` ancestors, and the pack, ARNEO and a11ylint re-run on the same page; script in `theme9-13-structure-consultation/scripts/probe.mjs`):**

  | Page | Pack (live) | Other engine's trigger | Exposed to AT? | Real skip? |
  |---|---|---|---|---|
  | iledefrance-13 | pass | h2→h4 "Partager la page" (`p role=heading aria-level=4`) | yes | **yes: pack missed it.** Earlier cookie-panel h2/h3 headings raised the highest level to 3 |
  | caisse-epargne-3 | pass | h2→h4 "Contacter l'Arcom" | yes | **yes: pack missed it.** An earlier h4 had set the highest level |
  | insee-9 | pass | h1→h3 "Indice des prix…" | no (`display:none`) | no |
  | bordeaux-2 | pass | h2→h4 "Pagination" | no (hidden) | no |
  | bouygues-2 and bouygues-1 | pass / fail (empty heading) | h1→h6 "Espace client" | no (hidden and aria-hidden) | no |
  | bouygues-11 | inapplicable | h1→h6 "Espace client" | no. **No heading on the page is exposed.** | n/a. Pack inapplicable is consistent. |
  | unistra-11 | cantTell (`p-as-heading`) | h2→h4 ×2 | no (hidden mega-menu) | no |
  | lenord-7 | pass | a11ylint: h3→h1 | yes | no: going back up is valid |
  | lcl-4 | pass | a11ylint: six h4→h2 | yes | no: going back up is valid |
  | cnil-7 | cantTell (`heading-order`) | h1→h3 | yes | yes; the pack already asks |

  - stan's "Absence de h1" failures are on Bouygues 1/7/11/15/17, Caisse 5, CNIL 1, LCL 12, Bordeaux 3 and Insee 1/17. On Bouygues 1 and 11, the only level-1 headings are `role=heading` inside hidden, aria-hidden panels. RGAA 9.1 (tests 9.1.1 to 9.1.3) does not require an h1, so a failure is not justified. The pack's core rule `page-has-heading-one` is deliberately not mapped.
  - stan's 52 questions break down as: class-name heuristic on 31 pages, several h1 on 23, a jump on 6, too few headings on 4. Its jump check reads `h1`–`h6` only, hidden ones included (`vendor/stan/cli/src/rules/index.js:787-800`).
- **How they do it:**
  - a11ylint: `node_modules/@a11ylint/core/build/rules/RGAA9.js:43-53`. It compares each heading with the previous one using `Math.abs(currentLevel - previousLevel) > 1`, so going back up is flagged. Its input is every `h1..h6,[role=heading]` in the document (`vendor/a11ylint-entry.js:21`), with no visibility filter.
  - ARNEO: `Criterion9_1.ts:39-61`. It runs `querySelectorAll` with no visibility filter, compares with the previous heading (`next.level - current.level > 1`), and sets NC on any jump.
  - Both compare with the **previous** heading. That is the logic that finds the two real skips the pack missed.
- **Proposal (core, `src/checks/manual/heading-order-manual.js:155-181`):**
  - Flag `level > previousExposedLevel + 1`, where previousExposedLevel is the level of the last heading exposed to AT. This is axe's semantics. Today the rule compares with `highestSoFar`, and that comparison is what masks the iledefrance and caisse-epargne skips. Keep the existing `isAccTreeEligible` filter, which is what makes the pack right on the hidden-heading cases.
  - The core header comment calls h1, h2, h3, h2, h4 "valid". It is a skip within the second h2 section, and RGAA's question about relevance applies to it.
  - Outcome: stays cantTell under 9.1.1.
  - False-positive risk: more questions on pages whose earlier sections are deep. It never produces a fail.
  - Optional: map `page-has-heading-one` to 9.1.1 as cantTell only, never fail. It should count only exposed level-1 headings. Low value.
- **Bench:** stan's `good_signal` ("h1 détecté", "sans saut") carries `manualReviewRecommended: true`. `engines.mjs:225` turns it into a 9.1 *pass*. It would be more accurate as no verdict, which would also remove the `stan PACK_ASKS` artifacts below.

### `heading-order` asks — all four engines, PACK_ASKS, 1–16 pages
Groups: `9.1 a11ylint PACK_ASKS heading-order`, `9.1 arneo PACK_ASKS heading-order`, `9.1 stan PACK_ASKS heading-order`, `9.1 uuv PACK_ASKS heading-order`, `9.1 uuv PACK_ASKS heading-order + p-as-heading`
- **What differs:** the pack asks about a deeper-by-two jump. uuv has no theme 9 rules at all (`rules/9-structure.js` exports `[]`). On caisse-16, ARNEO and a11ylint say nothing and stan passes.
- **Verdict:** PACK RIGHT.
  - All 21 occurrences across 16 pages are visible skips: h1→h3 "Le principe de finalité", h2→h4 "Ceci peut également vous intéresser…", h1→h5 "Internet", and so on.
  - On caisse-16, stan misses the skip because a hidden h2 in its all-headings sequence masks the h1→h3.
  - cantTell is the right outcome under 9.1.1.

### `p-as-heading` asks — all four engines, PACK_ASKS, 15–63 pages, 10 sites
Groups: `9.1 a11ylint PACK_ASKS p-as-heading`, `9.1 arneo PACK_ASKS p-as-heading`, `9.1 stan PACK_ASKS p-as-heading`, `9.1 uuv PACK_ASKS p-as-heading`
- **What differs:** the pack asks (test 9.1.3) about short text that is all bold and 18px or larger. No other engine checks 9.1.3 by style. stan's "pass" here comes from its page-level h1 and jump good signals, not from any 9.1.3 check.
- **Verdict:** PACK RIGHT to ask, but precision is moderate. I reviewed all 197 unique snippets out of 384 occurrences.
  - Plausible headings: "Dans le détail :", "Ce formulaire vous permet de :", Caisse d'Epargne `p.font-title-block`, Bordeaux search-result titles, Nantes `div.titre` news titles and `div.header__titre__contenu.h1` (clearly a page title), BAD "Citylights Terms and Conditions", and unistra `p.heading-3[aria-hidden=true]` (a visible heading hidden from AT).
  - Mechanically filterable: 74 occurrences that are digits or numbering only (Nantes counters "42000", Bordeaux "N° 2026-441", "4846 résultats", "oct.", "PDF"), 52 Insee social-icon `div.cercle-*` whose text is visually hidden, and 20 paragraphs that are only a link. That is 146/384, or 38 %. The rest of the false positives are judgement calls: the Bordeaux commune labels (27), LCL tabs, the DSFR `p.fr-logo` "République Française", and `fr-sr-only` sidemenu titles.
- **Proposal (core, `src/checks/manual/p-as-heading-manual.js`):** keep the outcome at cantTell (9.1.3). Skip a candidate when:
  - (a) its text has fewer than 4 letters, or is a number or reference pattern;
  - (b) all its text pieces are visually hidden (clip or a 1px box);
  - (c) all its text is inside one `<a>`, or inside a descendant with an interactive role (the Leaflet zoom control);
  - (d) it sits inside the `banner` landmark's logo or brand block (DSFR `.fr-logo`, `.fr-header__service-title`).

  False-positive risk: (c) would drop CNIL's bold RGPD chapter links, which are borderline anyway.

### Empty headings (`rgaa-heading-content-present`) — all four engines, PACK_FAILS and PACK_MORE_ELEMENTS, 7–13 pages, 9 sites
Groups: `9.1 a11ylint PACK_FAILS rgaa-heading-content-present`, `9.1 arneo PACK_FAILS rgaa-heading-content-present`, `9.1 stan PACK_FAILS rgaa-heading-content-present`, `9.1 uuv PACK_FAILS rgaa-heading-content-present`, `9.1 a11ylint PACK_MORE_ELEMENTS rgaa-heading-content-present`, `9.1 arneo PACK_MORE_ELEMENTS rgaa-heading-content-present`, `9.1 stan PACK_MORE_ELEMENTS rgaa-heading-content-present`
- **What differs:** the pack fails headings that have no content. No other engine checks heading content.
- **Verdict:** PACK RIGHT under test 9.1.2: an exposed heading with no content cannot be relevant. The MORE_ELEMENTS groups are NOT A REAL DIFFERENCE. Both engines fail 9.1, but for different tests (the others' 9.1.1 hierarchy elements against the pack's 9.1.2 empty headings), so the elements cannot match.
- **Evidence:** all 9 unique snippets are literally empty or `&nbsp;`, for example `<h2>&nbsp;</h2>`, `<h1 id="h-"></h1>`, `<h3 class="MediaVideo-title"></h3>`, an empty Angular `<h3>` on LCL, and an empty `aria-live` `<h3>` on Nord. Checked live:
  - lcl-8 empty `<h3>`: rendered, not hidden.
  - bouygues-1 empty `<h3>`: rendered.
  - nantes-3 `<h1>`: its only child, `span.h1--hidden`, is `display:none`, so the exposed h1 is empty.

## Criterion 9.2

### Nested visible `<main>` on Bordeaux — a11ylint/stan/uuv PACK_FAILS, arneo OTHER_MORE_ELEMENTS, 6 pages / 1 site
Groups: `9.2 a11ylint PACK_FAILS rgaa-main-element-structure`, `9.2 stan PACK_FAILS rgaa-main-element-structure`, `9.2 uuv PACK_FAILS rgaa-main-element-structure`, `9.2 arneo OTHER_MORE_ELEMENTS arneo-9.2`
- **Verdict:** PACK RIGHT under test 9.2.1 condition 5 (a single visible `<main>`).
  - Live on bordeaux-2: `main.js-pa-main` contains a second, visible `main.NodeNewsList-Body`, and neither has `hidden`.
  - ARNEO fails it too (`Criterion9_2.ts:39-43`, NC when `main` count ≠ 1), with a misleading "main absente" message.
  - Its "more elements" are every header, nav and footer it highlights. NOT A REAL DIFFERENCE.

### No `<main>`: pack asks, ARNEO fails — a11ylint/stan/uuv PACK_ASKS (Bouygues, 2 pages) and arneo OTHER_FAILS (11 pages)
Groups: `9.2 a11ylint PACK_ASKS rgaa-main-element-structure`, `9.2 stan PACK_ASKS rgaa-main-element-structure`, `9.2 uuv PACK_ASKS rgaa-main-element-structure`, `9.2 arneo OTHER_FAILS arneo-9.2`
- **Verdict, by subset:**
  - BAD, 8 pages: PACK RIGHT. The BAD pages have no doctype (stan reports "DOCTYPE absent"), so 9.2 does not apply (particular case). ARNEO ignores that case.
  - insee-17: live, ARNEO now finds a `<main>`. The page no longer matches the stored finding.
  - Bouygues home (bouyguestelecom-1 and 6): OTHER RIGHT. Live, bouyguestelecom-1 has neither `main` nor `role=main`, and the page plainly has a main content zone. Condition 4 of test 9.2.1 is not met.
- **Proposal (pack, `rules/automatic/rgaa-main-element-structure.js`):** on an HTML5 page with neither `<main>` nor `role=main`, fail, unless the body has very little rendered text outside header, nav and footer (for example under 200 characters); then ask.
  - Test: 9.2.1 condition 4.
  - False-positive risk: interstitial or consent-only pages, which the size threshold covers.

### ARNEO asks on every page — arneo OTHER_ASKS, 148 pages
Groups: `9.2 arneo OTHER_ASKS arneo-9.2`
- **Verdict:** coverage gap, not worth adopting as it stands. ARNEO highlights every `header`, `footer` and `nav` on every page, so the question carries no signal.
- **What a pack rule could do better:** the pack checks only conditions 4 and 5 of 9.2.1. A targeted manual rule would ask about condition 1 when there is no `<header>` and condition 6 when there is no `<footer>`, and would list `<nav>` elements outside header and footer for condition 3. Low to medium value.

## Criterion 9.3

### List structure failures — all four engines, PACK_FAILS (`list-children-valid`, `listitem-parent-valid`, both), 4–19 pages
Groups: `9.3 a11ylint PACK_FAILS list-children-valid + listitem-parent-valid`, `9.3 a11ylint PACK_FAILS list-children-valid`, `9.3 a11ylint PACK_FAILS listitem-parent-valid`, `9.3 arneo PACK_FAILS list-children-valid + listitem-parent-valid`, `9.3 arneo PACK_FAILS list-children-valid`, `9.3 arneo PACK_FAILS listitem-parent-valid`, `9.3 stan PACK_FAILS list-children-valid + listitem-parent-valid`, `9.3 stan PACK_FAILS list-children-valid`, `9.3 stan PACK_FAILS listitem-parent-valid`, `9.3 uuv PACK_FAILS list-children-valid + listitem-parent-valid`, `9.3 uuv PACK_FAILS list-children-valid`, `9.3 uuv PACK_FAILS listitem-parent-valid`
- **What differs:** the pack fails; the others say nothing, or ARNEO asks about every list.
- **Verdict:** BOTH PARTLY.

  Correct failures (test 9.3.1 condition 2), confirmed live:
  - Insee mega-menu `ul > div.colonne-1 > li`: 16 pages.
  - LCL `ul.arguments-list > div > a > li`: 4 pages, plus `ul.share-bar > hr`.
  - Caisse d'Epargne `ul role="region" > li`: 3 pages. The role removes the list semantics. The panel was hidden in desktop view at load time.
  - Nord `ul > ul` and `ul > div`: 2 pages.

  Overstated, out of 39 page-level `list-children-valid` findings:
  - Drupal pagers on Bordeaux (5), CNIL (3) and unistra (2). Live: `ul.pager__items` inside `nav`, whose only "invalid" child is the ellipsis `<li role="presentation">…</li>`. The list does use `<ul>/<li>`, and the presentational item is decoration.
  - Owl carousels on Nord (7). Live: `ul.owl-stage > li[role=group][aria-roledescription=slide]`. It is a carousel, which RGAA's 9.3 note puts beside other widgets rather than lists.
  - CNIL Bootstrap tabs (1): `li role=presentation` with `a role=tab`. This is a tabs ARIA issue (7.1), not 9.3.
- **Proposal (core `src/checks/automatic/list-children-valid.js`, pack mapping):**
  - Core: give a child that is an `<li>` whose explicit role overrides `listitem` its own reasonCode, separate from a non-`li` child. The pack then maps that reasonCode to **cantTell** under 9.3.1/9.3.2.
  - Keep **fail** for non-`li` element children (`div`, `ul`, `hr`, `a`) and text.
  - Also do not count an `li role=presentation|none` whose text is only punctuation (…, |, ·).
  - False-positive risk: none added. It turns about 18 of 39 failures into questions.
  - Side note: Insee's single defect also counts once per `li` through `listitem-parent-valid`, 4 to 18 occurrences per page.

### Description list — all four engines, PACK_FAILS `definition-list-children-valid`, 1 page
Groups: `9.3 a11ylint PACK_FAILS definition-list-children-valid`, `9.3 arneo PACK_FAILS definition-list-children-valid`, `9.3 stan PACK_FAILS definition-list-children-valid`, `9.3 uuv PACK_FAILS definition-list-children-valid`
- **Verdict:** PACK RIGHT under test 9.3.3. Live on iledefrance-13, the children of `dl.description-practical-information` are `DT DD DT DD DT DD DIV DD`. The `div` wraps no dt/dd group.

### Fake lists and `role=list` without `listitem` — a11ylint/stan/uuv PACK_ASKS, 2 pages each
Groups: `9.3 a11ylint PACK_ASKS rgaa-fake-list`, `9.3 stan PACK_ASKS rgaa-fake-list`, `9.3 uuv PACK_ASKS rgaa-fake-list`, `9.3 a11ylint PACK_ASKS rgaa-aria-list-item-roles`, `9.3 stan PACK_ASKS rgaa-aria-list-item-roles`, `9.3 uuv PACK_ASKS rgaa-aria-list-item-roles`
- **Verdict:** PACK RIGHT (cantTell, tests 9.3.1 and 9.3.2).
  - LCL has 3 paragraphs starting with "- " and Bouygues has lines starting with "•". These are bullet lists written as text.
  - On impots.gouv, the `div.field__items` has `role=list` but its children have no `listitem` role.
  - No other engine looks for either.

### ARNEO asks about every list — arneo OTHER_ASKS, 118 pages
Groups: `9.3 arneo OTHER_ASKS arneo-9.3`
- **Verdict:** coverage gap, not worth adopting. `Criterion9_3.ts` highlights every `ul`, `ol`, `dl` and `[role=list]`. The pack's targeted `rgaa-fake-list` and the structure rules already do this better.

## Criterion 9.4

### Quotations — arneo OTHER_ASKS, 8 pages / 4 corpora (unistra, Nantes, Nord, BAD)
Groups: `9.4 arneo OTHER_ASKS arneo-9.4`
- **What differs:** ARNEO asks about each `<q>` and `<blockquote>` (`Criterion9_4.ts`). The pack has nothing for 9.4 (`docs/RGAA_MAPPING.md:324`).
- **Verdict:** worth adopting. It is targeted: only 8 of 165 pages, and it surfaces real misuse.
  - Nantes uses `<blockquote>` for headlines ("Duo de choc pour concevoir de nouveaux matériaux"). That is relevant to 9.1.3 and to 8.9.
  - BAD "before" wraps an image and link in a `<blockquote>` for indentation.
  - unistra and Nord quotes look genuine.
- **Proposal (pack, new manual rule `rgaa-quotation-review`):**
  - Ask about each visible `<q>` and `<blockquote>`: is it really a quotation? Map to 9.4.1 or 9.4.2 for the tag, and also to 8.9.1 when the content is a heading-like line or holds no text.
  - Outcome: cantTell.
  - False-positive risk: none, since it only asks.
  - Limit: quotations written without markup (the main 9.4 failure) are not found.

## Criterion 13.1

### Possible refresh sources — all four engines, PACK_ASKS `rgaa-embedded-refresh-review`, 8 pages / 3 sites
Groups: `13.1 a11ylint PACK_ASKS rgaa-embedded-refresh-review`, `13.1 arneo PACK_ASKS rgaa-embedded-refresh-review`, `13.1 stan PACK_ASKS rgaa-embedded-refresh-review`, `13.1 uuv PACK_ASKS rgaa-embedded-refresh-review`
- **Verdict:** PACK RIGHT to scope it this way, but the precision is low. No other engine checks 13.1.
  - Test 13.1.1 lists `svg`, `canvas`, `object` and `embed` as refresh methods.
  - The 8 elements are Insee chart SVGs with a script, Bouygues Chart.js canvases, and a MapLibre map canvas on Nord. Judging from the snippets, none of them refreshes.
- **Proposal (low priority):** do not ask about a `canvas` belonging to a known map or chart library (`.maplibregl-canvas`, `.leaflet-*`, a Chart.js canvas with no animation loop). Or keep asking but group all of a page's occurrences into one question.

## Criterion 13.3

### Office documents — all four engines, PACK_ASKS `rgaa-office-document-link`, 46 pages / 9 sites
Groups: `13.3 a11ylint PACK_ASKS rgaa-office-document-link`, `13.3 arneo PACK_ASKS rgaa-office-document-link`, `13.3 stan PACK_ASKS rgaa-office-document-link`, `13.3 uuv PACK_ASKS rgaa-office-document-link`
- **Verdict:** PACK RIGHT, and partly NOT A REAL DIFFERENCE for ARNEO.
  - The findings are real `.pdf` and `.xlsx` links (Insee IP2032.pdf and .xlsx, Bordeaux reports, impots guides). Test 13.3.1 needs a person to check each one.
  - ARNEO detects the same documents (`Criterion13_3.ts`, `LinkUtils.getDownloadableDocumentList()`), but returns NT without filling `elementList`. `engines.mjs:195` drops an NT that has no elements.
- **Bench fix:** in the ARNEO entry, fill elements from `getHighlightedElements()` when `elementList` is empty.

## Criterion 13.9

### Orientation lock — all four engines, PACK_ASKS `css-orientation-lock`, 33 pages / 5 sites
Groups: `13.9 a11ylint PACK_ASKS css-orientation-lock`, `13.9 arneo PACK_ASKS css-orientation-lock`, `13.9 stan PACK_ASKS css-orientation-lock`, `13.9 uuv PACK_ASKS css-orientation-lock`
- **What differs:** all 33 occurrences carry the same message: "N feuille(s) de style n'ont pas pu être lues". The cross-origin `cssRules` access threw (core `css-orientation-lock.js:437-448, 589-604`). No occurrence points to an orientation rule.
- **Verdict:** BOTH PARTLY. Saying "not determined" is honest. But a page-level cantTell under 13.9 for a scan limitation, on a fifth of the corpus, is a question the auditor cannot act on from the finding.
- **Proposal (core `css-orientation-lock.js`):**
  - When a sheet is unreadable, `fetch(sheet.href)` it. CDN CSS often allows CORS. Parse the text with `new CSSStyleSheet().replace()` and run the same analysis.
  - Ask only when the sheet is still unreadable *and* the pack's layout-based `rgaa-orientation-content-parity` could not run on it.
  - Otherwise report "not checked" as engine metadata instead of a cantTell on 13.9.1.
  - False-positive risk: none. It removes questions without evidence.

## Improvements
| # | Criterion | From | Change | Where | Outcome | Effort | Value |
|---|---|---|---|---|---|---|---|
| 1 | 9.1.1 | ARNEO/a11ylint (previous-heading comparison) | `heading-order`: compare with the previous *exposed* heading, not the highest level so far. That catches skips such as h2→h4 after a deeper earlier section (missed live on iledefrance-13 and caisse-epargne-3). | core `src/checks/manual/heading-order-manual.js:155-181` | cantTell | S | High |
| 2 | 9.1.3 | pack review | `p-as-heading`: skip digits or numbering only, visually hidden text, link-only paragraphs, interactive descendants, and banner logo blocks. That removes about 38 % of 384 occurrences. | core `src/checks/manual/p-as-heading-manual.js` | cantTell | S | Medium |
| 3 | 9.3.1/9.3.2 | pack review | `list-children-valid`: give `<li role=presentation/none/group…>` its own reasonCode, which the pack maps to cantTell. Ignore presentational punctuation-only items. Keep fail for div/ul/hr/text children. | core `list-children-valid.js` + pack `rule-map.js` | cantTell (was fail) | S | Medium |
| 4 | 9.2.1 | ARNEO | `rgaa-main-element-structure`: fail an HTML5 page with no `main` and no `role=main` that has substantial content; ask only on near-empty pages. | pack `rules/automatic/rgaa-main-element-structure.js` | fail | S | Medium |
| 5 | 9.4.1/9.4.2 (+8.9.1) | ARNEO | New manual rule asking about each visible `<q>`/`<blockquote>` (finds blockquotes used as headlines or for indentation) | pack `rules/manual/rgaa-quotation-review.js` | cantTell | S | Medium |
| 6 | 13.9.1 | pack review | `css-orientation-lock`: fetch and parse cross-origin sheets. If they still cannot be read, report a scan limitation instead of a cantTell. | core `css-orientation-lock.js` | — (fewer cantTell) | M | Medium |
| 7 | 9.2.1 | ARNEO (untargeted) | Targeted manual prompts: no `<header>` (condition 1), no `<footer>` (condition 6), `<nav>` outside header/footer (condition 3) | pack manual rule | cantTell | S | Low |
| 8 | 9.1.1 | stan | Optionally map `page-has-heading-one` (exposed h1 only) as evidence, never as a failure | pack `rule-map.js` | cantTell | XS | Low |
| 9 | 13.1.1 | pack review | `rgaa-embedded-refresh-review`: skip map and chart library canvases, or group questions per page | pack `rules/manual/rgaa-embedded-refresh-review.js` | cantTell | S | Low |
| 10 | bench | — | `engines.mjs`: stan `good_signal` with `manualReviewRecommended` → no verdict (not pass). ARNEO NT: use `getHighlightedElements()` when `elementList` is empty (13.3). | `engines.mjs:195, 225` | — | XS | Medium (cleaner diffs) |

Not adopted: a11ylint's `Math.abs` rule (flags going back up), ARNEO and a11ylint reading hidden headings, stan's "Absence de h1" failure, and ARNEO's ask-on-every-page 9.2 and 9.3 questions.
