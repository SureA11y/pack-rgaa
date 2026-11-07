# Theme 2–5: Frames, Colours, Multimedia, Tables

## Summary
I triaged 82 groups: 12 for frames, 30 for colours, 8 for multimedia and 32 for tables. 14 live page loads were made, and every live result is in `triage/theme2-5-frames-colours-media-tables/live/`.

**Verdicts, counted by group:**
- PACK RIGHT: 52
- BOTH PARTLY: 21
- OTHER RIGHT: 4. These are the 5.3 and 5.5 questions, which are coverage gaps.
- NOT A REAL DIFFERENCE: 5. These are bench artifacts: no arneo elements, an `html` prefix collision, and uuv having no 3.2 rule.
- UNDECIDABLE: 0 at group level. A few single elements are marked as needing a person.

**Main takeaways:**
- **2.1 hidden frames:** the earlier triage is confirmed. The other engines' 2.1 failures are frames that are `display:none`, `visibility:hidden` or `aria-hidden`, and the pack is right to skip them.
- **2.1 on Caisse d'Epargne:** the audit's failure comes from a page the bench marked blocked. The newsletter page loads now, and it has a visible `<iframe title="">`. The pack reports that frame under **2.2**. The auditor, uuv, stan and arneo report it under **2.1**, and the pack should do the same.
- **3.2, the other engines' contrast maths is wrong:**
  - stan treats a transparent background as black.
  - arneo uses 4.5:1 for every size, and its alpha handling is broken.
  - The bench's a11ylint feeder measures hidden and `sr-only` text.
- **3.2, the pack's maths is right but it gives up too often:** in 33 elements measured from pixels, every element the pack asked about actually passed. The causes are core gaps:
  - `background-image: none, none` is treated as an image (bug).
  - Solid-colour DSFR underline gradients.
  - `filter: drop-shadow` on an ancestor.
  - Solid `::before` backgrounds reported as overlaps.
  - SVG chart-frame strokes reported as overlaps.
- **3.2, one pack false positive:** on all 13 Bordeaux pages, the pack fails 3 cookie buttons as white on `#ffcc00` (1.51:1). They actually render white on `#2b2a2a`, about 14:1. A `z-index:-1` `::before` with a background image paints over the button's own background, and core misses it.
- **4.x:** no engine handles the embedded YouTube, Vimeo, PeerTube or SoundCloud players, which are what the audited sites use. The pack's media rules only look at `<audio>` and `<video>`.
- **5.x:** most failures from the other engines are wrong. Their definitions of a complex table, a data table and a header are faulty, and they ignore the 5.7 particular case. Two real gaps remain:
  - a `th` without `scope` in a table with headers on both axes (5.7.1, LCL `/cartes-bancaires`);
  - no questions for 5.3 (layout tables) or 5.5 (table titles).

## Criterion 2.1

### Hidden frames failed by the others — a11ylint/arneo/stan/uuv, OTHER_FAILS + OTHER_MORE_ELEMENTS, 40–41 pages / 5 sites
Groups: `2.1 a11ylint OTHER_FAILS RGAA - 2.1.1`, `2.1 arneo OTHER_FAILS arneo-2.1`, `2.1 stan OTHER_FAILS stan-2.1`, `2.1 uuv OTHER_FAILS 2.1.1`, `2.1 a11ylint OTHER_MORE_ELEMENTS RGAA - 2.1.1`, `2.1 stan OTHER_MORE_ELEMENTS stan-2.1`, `2.1 uuv OTHER_MORE_ELEMENTS 2.1.1`

- **What differs:** the other engines fail frames that have no title. The pack finds 2.1 inapplicable, or fails only the visible frames.
- **Verdict:** PACK RIGHT.
  - The RGAA glossary "Titre de cadre", note 2, takes frames hidden from assistive technology out of scope. A frame with `display:none` or `visibility:hidden` is not rendered to assistive technology either.
  - Test 2.1.1 cannot fail on content that nobody perceives.
- **Evidence:** I checked every distinct frame the other engines flagged, across all 45 pages where one of them failed 2.1.
  - **Bordeaux, 13 pages:** a Snapchat pixel, `aria-hidden="true" role="presentation" style="display:none !important"`.
  - **Bouygues, 15 pages:** `<iframe name="__tcfapiLocator" style="display: none;">`.
  - **LCL p9:** `<iframe style="display: none;">`.
  - **Département du Nord, 14 pages:** a 1×1 frame with `visibility: hidden` in its inline style.
  - **Caisse d'Epargne p7:** `<iframe class="iframe-video" src="" title="">`. Live, it sits in `div.modal.modal-video.js-dialog` with `display:none` and has `aria-hidden` (`live/caisse7.json`). After the modal is opened from `button.js-open-dialog[data-video]` (`live/caisse7b.json`), the frame gets `title="Découvrez le nouveau club des sociétaires"`, and the pack passes both 2.1 and 2.2.
  - **OTHER_MORE_ELEMENTS:** on Bordeaux p13/p14 and Bouygues p16, the extra element is the same hidden frame. The visible untitled frames there are failed by everyone, the pack included: onrewind, YouTube-nocookie, umap, 7 SoundCloud players, and the Bouygues map.
- **How they do it:** none of them filters by visibility.
  - uuv `rules/2-frame.js:6-18` is a jQuery tag query (`query/by-tag.query.js:13`), and also fails `title=""`.
  - stan: `vendor/stan/cli/src/rules/index.js:347-365`.
  - arneo: `Criterion2_1.ts:38-44` (`!$frame.title`).
  - a11ylint: `rules/RGAA2.js:47-59` (`hasAttribute`).

### Empty `title` on a visible frame — Caisse d'Epargne audit (no group: the page was blocked at scan time)
- **What differs:** the human audit lists 2.1 as failing. On every Caisse page the bench scanned, the pack has 2.1 inapplicable.
- **Live check:** the newsletter page `/professionnels/les-e-newsletters-pour-les-entrepreneurs/` was 403 in the bench (RESULTS.md, "blocked") but loads now (`live/caisse10.json`). It holds a visible 1280×150 frame: `<iframe id="iframe-block_…" src="https://www.enewsletters-entreprenariat-caisse-epargne.fr/" title="">`.
  - The pack returns **2.1 pass, 2.2 fail** (`rgaa-frame-title-not-empty`).
  - The auditor lists **2.1** as non-conforming and does not list 2.2.
- **Verdict on the empty title:** BOTH PARTLY.
  - Test 2.1.1 literally asks for "un attribut title", which the pack reads strictly.
  - But criterion 2.1 asks for a "titre de cadre", which the glossary defines as the *content* of the attribute. An empty attribute gives no title.
  - The auditor files this under 2.1, and so do uuv (`AttributeChecker.emptyAttribute`), stan (`normalizedText` empty) and arneo.
  - No visible frame without a title was found on the 13 Caisse pages that were scanned.
- **Proposal (pack):**
  - In `rules/automatic/rgaa-frame-title-attribute-present.js`, treat a title that is empty or only spaces as missing: fail 2.1.1 with `reasonCode: 'emptyTitle'`.
  - In `rgaa-frame-title-not-empty`, stop reporting that case, or keep it only as a note, so it is not counted under both 2.1 and 2.2.
  - Update the note in `rule-map.js:343-349`.
  - False-positive risk: none, since frames hidden with `aria-hidden` or by CSS stay excluded.

### PACK_MORE_ELEMENTS — a11ylint/arneo/stan, 1–4 pages
Groups: `2.1 a11ylint PACK_MORE_ELEMENTS rgaa-frame-title-attribute-present`, `2.1 arneo PACK_MORE_ELEMENTS rgaa-frame-title-attribute-present`, `2.1 stan PACK_MORE_ELEMENTS rgaa-frame-title-attribute-present`
- **Verdict:** NOT A REAL DIFFERENCE.
  - **arneo:** it has no elements in the bench. `Criterion2_1` keeps its list in `logResults` only, and `vendor.mjs:62` reads `querySelectorList || elementList`.
  - **a11ylint and stan:** they report no selector. `run.mjs:87-89` places a finding through `outerHTML.startsWith(html.slice(0,120))`. The 7 SoundCloud iframes on Bordeaux p14 share their first 120 characters, so all of them map to `1/1/0/1/1/1/2/0/11/0/0`.
- **Fix in the bench:**
  - In `run.mjs` `placeInCases`, match on the whole stored `html` (300 characters), and give the k-th repeated finding the k-th element that matches.
  - In `vendor.mjs`, call `criterion.getHighlightedElements?.()` when `elementList` is empty.

## Criterion 2.2

### Hidden template frame — a11ylint, OTHER_FAILS, 1 page / 1 site
Group: `2.2 a11ylint OTHER_FAILS RGAA - 2.2.1`
- **Verdict:** PACK RIGHT. The frame is the hidden Caisse p7 modal template: `title=""` inside `display:none`, filled with a relevant title when the modal opens (checked live). a11ylint, at `RGAA2.js:61-80`, does not filter for visibility.

### Relevance questions — uuv, OTHER_ASKS, 51 pages / 8 sites
Group: `2.2 uuv OTHER_ASKS 2.2.1`
- **What differs:** uuv asks whether the title is relevant for every frame that has one. The pack passes 2.2 on 8 pages and is inapplicable on 43.
- **Verdict:** BOTH PARTLY.
  - **On the 43 pages where the pack is inapplicable, uuv asks about hidden frames:**
    - Hotjar `_hjSafeContext` (Strasbourg, 16 pages);
    - the Prismic toolbar, `display:none` with `aria-hidden` (LCL, 13);
    - `bytelid`, "formulaire d'authentification", closed at load (Bouygues, 13).
    These questions are noise.
  - **On the 8 pages the pack passes,** the frames are visible (YouTube, PeerTube, Insee players, wemap, Nantes forms). Test 2.2.1 asks whether the title is *pertinent*, which only a person can judge, so a "pass" over-claims.
  - One live example: on Nantes, `title="Youtube - Vidéo - Online Workshop "` is cut off by unescaped quotes in the markup.
- **Proposal (pack):** in `rgaa-frame-title-not-empty`, return **cantTell** for a non-empty title, with the title text, instead of pass. Fail, or give a strong cantTell, for generic titles: `iframe`, `frame`, `untitled`, `YouTube video player`, or a title equal to the hostname. a11ylint does a lighter version of this with `bannedWords` at `RGAA2.js:63`.
  - Maps to 2.2.1.
  - False-positive risk: low, since a cantTell is not a failure.

## Criterion 3.1

### Colour-only information — uuv, OTHER_ASKS, 103 + 26 + 14 pages / 9 sites
Groups: `3.1 uuv OTHER_ASKS 3.1.5 + 3.1.6`, `3.1 uuv OTHER_ASKS 3.1.3 + 3.1.5 + 3.1.6`, `3.1 uuv OTHER_ASKS 3.1.3`
- **What differs:** the pack gives no verdict on 3.1. uuv asks about every `object, video, embed, svg, canvas, iframe` (`rules/3-color.js:25-46`) and every `img[title]` (`:6-24`).
- **Verdict:** BOTH PARTLY.
  - 3.1 does apply to pages with charts, such as the Insee SVG charts.
  - But uuv asks on almost every page because of decorative SVG icons and tracking frames, which makes it untargeted.
- **Proposal:** do not adopt uuv's question as it is. A targeted pack manual rule would do better: cantTell 3.1.3 or 3.1.6 for an `svg` or `canvas` that has a legend, or `role="img"` with several fills, or the chart classes the Insee graphs use, plus form error states styled by colour alone. Value is low to medium.

## Criterion 3.2

How each engine computes contrast. Line references are in the vendored sources.

| | Background | Images, gradients, overlap | Opacity, alpha | Large text | Visibility |
|---|---|---|---|---|---|
| pack (core `contrast-helpers.js`) | walks ancestors, blends alpha, finds non-ancestor paint (`__findPaintUnderText`, l.3652+) | cantTell | group opacity resolved, else cantTell | 24px, or bold (≥700) from 18.5px | eligible, visible text only |
| stan `rules/index.js:388-450` | the element's own `backgroundColor`; `rgba(0,0,0,0)` becomes `#000000` (l.392-396, 415) | ignored | ignored | `fs>=18.67 \|\| (fs>=14 && bold)` (l.421), i.e. pt thresholds read as px | none; first 60 elements (l.408) |
| arneo `Criterion3_2.ts`, `ColorUtils.ts` | ancestor walk that only skips the exact strings `rgba(0, 0, 0, 0)`/`transparent` (l.23) | ignored | alpha parsed as an integer and applied to the blue channel only (l.71-72) | **none: always 4.5** (l.85) | `offsetWidth`, `opacity`, `clip-path: inset(50%)` only (l.97-104); skips `b`, `strong`, `font`, `label`, `input` (selector l.31) |
| a11ylint `RGAA3.js:61-103` with the bench feeder (`vendor.mjs:92-110`) | first ancestor with a non-transparent background | ignored | an `rgba()` background parses to NaN, so the element is skipped | 24px; bold ≥600 from 18.5px | **none**: hidden, `sr-only`, `<details>` and SVG `<style>` text are all measured (the `'STYLE'` check is case-sensitive) |
| uuv | **no 3.2 rule** (`rules/3-color.js` covers 3.1 only) | | | | |

### stan fails 164 of 165 pages — stan, OTHER_FAILS + OTHER_MORE_ELEMENTS + PACK_MORE_ELEMENTS, 113 / 51 / 50 pages / 8 sites
Groups: `3.2 stan OTHER_FAILS stan-3.2`, `3.2 stan OTHER_MORE_ELEMENTS stan-3.2`, `3.2 stan PACK_MORE_ELEMENTS rgaa-contrast-minimum`
- **Verdict:** PACK RIGHT.
  - Ratios stan reports: 4,758 of 7,656 are in [1, 2), mostly dark text on a "black" transparent background.
  - It fails all 4 BAD *after* pages, which W3C repaired.
  - It fails hidden text, such as `tarteaucitronHidden` items and empty Insee links.
  - Its large-text threshold is too lax: 18.67px normal instead of 24px.
- **Where the pack fails more:** stan stops after 60 elements, so the pack's extra failures are real elements stan never looked at.

### a11ylint's extra failures — a11ylint, OTHER_FAILS / OTHER_MORE_ELEMENTS / PACK_MORE_ELEMENTS, 1–27 pages each / 1–6 sites
Groups:
- `3.2 a11ylint OTHER_FAILS RGAA - 3.2.1`
- `… RGAA - 3.2.2`
- `… RGAA - 3.2.4`
- `… 3.2.1 + 3.2.2 + 3.2.3`
- `… 3.2.1 + 3.2.2 + 3.2.4`
- `… 3.2.1 + 3.2.4`
- `… 3.2.1 + 3.2.2`
- `… 3.2.1 + 3.2.3`
- `3.2 a11ylint OTHER_MORE_ELEMENTS RGAA - 3.2.1 + RGAA - 3.2.2`
- `… RGAA - 3.2.2`
- `… 3.2.1 + 3.2.2 + 3.2.4`
- `… 3.2.2 + 3.2.4`
- `… 3.2.1 + 3.2.2 + 3.2.3`
- `3.2 a11ylint PACK_MORE_ELEMENTS rgaa-contrast-minimum`

- **What differs:** I classified all 395 a11ylint failures on pages where the pack does not fail, plus samples from Bouygues, LCL and Département du Nord:

  | Kind of element | Count |
  |---|---|
  | `sr-only`, `screen-reader-text`, `hidden-accessibilite` | 65 |
  | Cookie-banner content, mostly a closed panel | 81 |
  | SVG `<style>` text | 13 |
  | CNIL "Particuliers" | 36 |
  | CNIL Twitter/LinkedIn links with 0px font | 40 |
  | CNIL glossary tooltip titles, hidden until hover | about 35 |
  | Bouygues footer accordion links, about 145 per page | — |

- **Verdict:** PACK RIGHT, with a NOT A REAL DIFFERENCE component.
  - **CNIL "Particuliers":** live, it is white on its own `a::before` `rgb(56,121,191)`, which is 4.51:1. That passes; a11ylint and arneo measured it as white on white (`live/cnil4.json`, `live/cnil-insp.json`).
  - **Bouygues footer links:** live, they have zero-size text boxes (a closed accordion), and arneo's walk also reads them as white on white (`live/bouygues1.json`).
  - Most of these failures come from the bench's feeder, which collects text with no visibility filter. a11ylint itself has no DOM collector for colours.
- **Where the pack fails more (22 pages):** a11ylint skips `rgba` backgrounds (NaN) and anything under a gradient. The pack's extra failures checked from computed colours were genuine:
  - Bouygues `tc-privacy` buttons: 3.21:1, confirmed from pixels (3.06–3.21) on the live page;
  - LCL links `#727efd` on white: 3.43:1;
  - Nantes input values: 4.06:1;
  - Département du Nord OSM attribution: 2.24:1.
- **One element nobody settled:** impots p2 (`/contacts`) has 10 `<span style="color:red">*</span>`. `#f00` on white is 4.0:1. a11ylint fails them, and all 10 collapse onto one path because of the prefix collision. The pack has no finding at that path because contrast-computable hit its 50-occurrence cap (`contrast-computable.js:179`). A person should check them.
- **Fix in the bench:** in the `vendor.mjs:101` feeder, keep elements where `el.checkVisibility({visibilityProperty:true, opacityProperty:true})` is true, whose text box is not empty, and that are not clipped to 1px. Compare `localName` case-insensitively.

### arneo — OTHER_FAILS (pack cantTell/pass), PACK_FAILS, PACK_MORE_ELEMENTS, 46 / 5 / 46 pages / 3–6 sites
Groups: `3.2 arneo OTHER_FAILS arneo-3.2`, `3.2 arneo PACK_FAILS rgaa-contrast-minimum`, `3.2 arneo PACK_MORE_ELEMENTS rgaa-contrast-minimum`
- **Verdict on OTHER_FAILS:** PACK RIGHT on the sample. I reproduced arneo's logic live on 7 pages (`probe.mjs`), and each failure that matters falls into one of these:
  - `sr-only` text: Insee `screen-reader-text` and `hidden-accessibilite`, impots `fr-sr-only` (it uses `clip`, not `clip-path`);
  - white on white over pseudo-element or overlay backgrounds: CNIL, Bouygues footer, the Caisse p7 video mask, which measures 9.5–9.9:1 from pixels;
  - large text held to 4.5:1;
  - failures the pack also has (Bordeaux, LCL), where arneo's NC adds nothing.
- **Verdict on PACK_FAILS:** PACK RIGHT. arneo passes these pages because its selector (`Criterion3_2.ts:31`) never looks at the failing elements:
  - BAD `<b>` and `<font color="41545D">` on `#a9b8bf`, 3.88:1 for bold text under 18.5px;
  - Nantes `<input value>`.
- **Verdict on PACK_MORE_ELEMENTS:** NOT A REAL DIFFERENCE. arneo has no elements in the bench (same `vendor.mjs:62` issue as 2.1).

### Pack asks, others silent or pass — a11ylint/arneo/uuv, PACK_ASKS, 36 / 45 / 85 pages
Groups: `3.2 a11ylint PACK_ASKS contrast-computable`, `3.2 arneo PACK_ASKS contrast-computable`, `3.2 uuv PACK_ASKS contrast-computable`
- **Verdict:** BOTH PARTLY.
  - arneo and a11ylint pass or stay silent only because they never look at images, gradients or overlaps.
  - In the sample, the text the pack asks about does pass. The pack is honest but over-cautious, and the causes are in core.
- **Evidence:** of 32 elements the pack asked about and I measured by pixels in a clean viewport, all passed. Bordeaux, which sits behind a cookie modal overlay, is excluded.

| Site | Reason the pack gives | Blocker | Measured |
|---|---|---|---|
| impots | `BACKGROUND_IMAGE_OR_GRADIENT` | **`background-image: none, none`**. A bug: every layer is `none`. 325 occurrences on 16 pages. | 13.7–21:1 (11 elements) |
| impots, unistra | `BACKGROUND_IMAGE_OR_GRADIENT` | DSFR-style underline `linear-gradient(0deg, X, X)` or `linear-gradient(to top, #111 0, #111 0)`, a single solid colour on a thin strip. 748 + 432 occurrences. | unistra links 10.5–13.9:1 (7) |
| impots, Bordeaux, Département du Nord | `BACKGROUND_FILTER_OR_BACKDROP_FILTER` | `header { filter: drop-shadow(...) }` on an ancestor. 51 + 77 + 4 occurrences. | impots header 18–21:1 (2) |
| CNIL, Caisse | `BACKGROUND_OVERLAP` | a solid `div::before` (`rgb(235,233,222)`, `rgb(249,249,251)`) behind the text | 7–12:1 (7) |
| Insee | `BACKGROUND_OVERLAP` | `#G_*_cadre { stroke }`: the frame rectangle of an SVG chart, stroke only | not measured (SVG text) |

- **Proposal (core, `src/core/contrast-helpers.js`):**
  1. **`hasBackgroundImageOrGradient` (l.1742-1749):** split the value on top-level commas, and return false when every layer is `none`. This is a bug fix: no false-positive risk, small effort.
  2. **Gradient layers:**
     - A gradient whose stops all share one colour is a solid colour.
     - A layer whose `background-size` and `background-position` keep it at 2px or less tall, or outside the text's line boxes, does not paint behind the glyphs.
     - Measure against each solid colour that remains: pass if all pass, fail if all fail, otherwise cantTell.
     - Medium effort. Risk: thick highlight underlines, which are covered by measuring against both colours.
  3. **`hasFilter`:** when the filter is only one or more `drop-shadow()` and sits on an *ancestor* whose own background is opaque, ignore it, because a drop shadow paints outside the element's alpha. Small effort.
  4. **`__findPaintUnderText`:**
     - When the paint found is one opaque solid `background-color` box, including `::before`/`::after`, that covers every line box of the text, use it as the background instead of reporting `BACKGROUND_OVERLAP`.
     - For `stroke` on an SVG shape that has no fill (`__paintCandidate`, l.3686-3692), only count it when the stroke band crosses the text.
     - Medium effort.

### Placeholder text asked about — a11ylint/arneo/uuv, PACK_ASKS (contrast-computable + rgaa-contrast-minimum), 1–2 pages
Groups: `3.2 a11ylint PACK_ASKS contrast-computable + rgaa-contrast-minimum`, `3.2 arneo PACK_ASKS contrast-computable + rgaa-contrast-minimum`, `3.2 uuv PACK_ASKS contrast-computable + rgaa-contrast-minimum`
- **What:** `PLACEHOLDER_BELOW_THRESHOLD`: CNIL p18 `#999` on white (2.85:1), Insee p13 3.42:1. No other engine looks at placeholders.
- **Verdict:** PACK RIGHT to flag them. RGAA 3.2 has no exemption for placeholders.
- **Proposal (core, `contrast-minimum`):** fail rather than ask when `::placeholder` has a colour the author declared, that is, one that differs from the browser's default. Low priority.

### Pack fails where uuv says nothing — uuv, PACK_FAILS, 51 pages / 8 sites
Group: `3.2 uuv PACK_FAILS rgaa-contrast-minimum`
- **Verdict:** NOT A REAL DIFFERENCE. uuv has no 3.2 rule. On the pack's side, the sampled failures are correct apart from the Bordeaux buttons below.

### Pack false positive: tarteaucitron buttons on Bordeaux (13 pages; affects every 3.2 group on Bordeaux)
- **What:** the pack, arneo, a11ylint and stan all fail `#tarteaucitronPersonalize2`, `#tarteaucitronAllDenied2` and `#tarteaucitronCloseAlert` as white on `#ffcc00` (1.51:1).
- **Live:** the screenshot (`live/bdx-btn.png`, `live/bdx-view.png`) shows dark buttons. Pixels give a background of `rgb(43,42,42)` and about 14.3:1.
- **Cause, from the site's CSS:**
  - The button has `position:relative; z-index:1; background-color:#fc0`, so it is a stacking context.
  - Its `::before` has `position:absolute; z-index:-1; background:url(hoverBt.svg); transform:scale(4)`.
  - A child with negative `z-index` inside a stacking context paints *above* that context's own background.
- **Verdict:** PACK WRONG on these 39 elements. They are the only pack 3.2 failures on bdx-1, so that page's verdict flips. The other 12 Bordeaux pages also fail on real elements, such as the light-grey breadcrumb "Agenda" and the calendar weekdays (`#849095` on `#f9f9f9`, 3.11:1).
- **Proposal (core):**
  - In the background walk, when the text's element or an ancestor up to the opaque backdrop is a stacking context, also look at its own `::before`/`::after` and descendants with `z-index < 0`.
  - If such a box paints a colour, use it. If it paints an image or gradient, report cantTell `BACKGROUND_OVERLAP`.
  - Medium effort, high value: it removes a confident false positive on a common cookie-banner pattern.

## Criterion 4.x

### arneo asks, stan fails — arneo OTHER_ASKS 4.1–4.7, stan OTHER_FAILS 4.1, 4 pages / 3 sites
Groups: `4.1 arneo OTHER_ASKS arneo-4.1`, `4.2 arneo OTHER_ASKS arneo-4.2`, `4.3 arneo OTHER_ASKS arneo-4.3`, `4.4 arneo OTHER_ASKS arneo-4.4`, `4.5 arneo OTHER_ASKS arneo-4.5`, `4.6 arneo OTHER_ASKS arneo-4.6`, `4.7 arneo OTHER_ASKS arneo-4.7`, `4.1 stan OTHER_FAILS stan-4.1`

- **What:**

  | Page | Element | Verdict |
  |---|---|---|
  | Bouygues p16, Département du Nord p9 | `<canvas>` (a Chart.js-style chart, a MapLibre WebGL map) | arneo false positive |
  | Nantes p7 | `<audio src="/captcha?…">` | particular case of 4.1 (a CAPTCHA) |
  | Nantes p3 | `<video controls src=…mediaserver…mp4>` | real media |

  - **The canvases:** `MediaUtils.ts:52` keeps a canvas when `getContext('2d')` returns null, which it does for WebGL.
  - **The Nantes p3 video:** live, it sits in a `div.video-slider__video` with `display:none`, an inactive carousel slide (`live/nantes3.json`). The pack's hidden-content policy skips it.
  - **stan:** it fails 4.1 for a `<video>` without `<track>` (`index.js:1066-1078`). A missing caption track is a 4.3 matter, and 4.1 asks for a transcript or audio description, so this is wrong.
- **Verdict:** BOTH PARTLY.
  - arneo is wrong on the 2 canvases and has no grounds on the CAPTCHA.
  - On Nantes p3, arneo is right that a temporal medium exists and should be reviewed. A person tests the carousel slides.
  - stan files its result under the wrong criterion.
- **Bigger gap, no group:** the temporal media on the audited sites are embedded players:
  - YouTube or YouTube-nocookie on Bordeaux, LCL, Île-de-France, Bouygues and Nantes;
  - PeerTube on CNIL (`video.cnil.fr/videos/embed`);
  - Insee `player-N` frames;
  - SoundCloud on Bordeaux;
  - the Caisse modal video.
  No engine asks about them. stan counts them (`index.js:1053-1055`) but only emits `manualOnly`, which the bench drops. The Caisse audit fails 4.1, 4.2, 4.4, 4.5 and 4.7, all on video.
- **Proposal (pack, new manual rule `rgaa-embedded-media-review`):**
  - Target a visible `iframe` whose `src` matches `youtube(-nocookie)?.com/embed`, `player.vimeo.com`, `dailymotion.com/embed`, `/videos/embed/` (PeerTube), `w.soundcloud.com/player`, `mediaserver…/iframe`.
  - Outcome: cantTell for 4.1.x, 4.3.1 (video only), 4.5.x (video only) and 4.7.1. Reuse the adjacency logic of `rgaa-media-transcript-adjacent` to pass 4.1 when an adjacent transcript link exists.
  - False-positive risk: low, since only cantTell is emitted. Medium effort, high value: 4.x is non-conforming on several audited sites, and today the pack is inapplicable everywhere.

## Criterion 5.x

### 5.1 failures by the others — arneo/stan/uuv, OTHER_FAILS, 4–6 pages / 3 sites
Groups: `5.1 arneo OTHER_FAILS arneo-5.1`, `5.1 stan OTHER_FAILS stan-5.1`, `5.1 uuv OTHER_FAILS 5.1.1`
- **Verdict:** PACK RIGHT. No complex table is involved.
  - The tables are the BAD *before* layout tables, the Bouygues destination tables (headers in the first column only, named by `aria-label`), the LCL opening-hours table, and the LCL card comparison.
- **What each engine calls complex or fails:**
  - **arneo:** "complex" means the first row has more than one cell (`TableUtils.ts:27`).
  - **uuv:** "complex" means some non-first row has a `th` in its first cell (`selector-helper.js:77`). That describes an ordinary table with headers on both axes, and the `:has()` also matches nested layout tables.
  - **stan:** fails any table of 2×2 or more without a `th` under 5.1 (`index.js:482`), which is really 5.6 territory.

### 5.1/5.2 pack asks — a11ylint/arneo/stan/uuv, PACK_ASKS, 1–2 pages; uuv OTHER_ASKS 5.2, 2 pages
Groups: `5.1 a11ylint PACK_ASKS rgaa-complex-table-summary`, `5.1 arneo PACK_ASKS rgaa-complex-table-summary`, `5.1 stan PACK_ASKS rgaa-complex-table-summary`, `5.1 uuv PACK_ASKS rgaa-complex-table-summary`, `5.2 a11ylint PACK_ASKS rgaa-complex-table-summary-quality`, `5.2 arneo PACK_ASKS rgaa-complex-table-summary-quality`, `5.2 stan PACK_ASKS rgaa-complex-table-summary-quality`, `5.2 uuv OTHER_ASKS 5.2.1`
- **Verdict:** PACK RIGHT.
  - Insee p12 figures 4 and 6, and BAD after-tickets, are complex tables: they have grouped headers, and BAD has `headers`/`id`. Whether a caption such as "Figure 4 – …" also serves as a summary is a human call, so asking is correct.
  - uuv asks about 5.2 on tables that are not complex (BAD after-survey, Insee p11), because of its definition of complex.

### 5.3 layout tables — arneo/uuv/stan, OTHER_ASKS, 2–4 pages
Groups: `5.3 arneo OTHER_ASKS arneo-5.3`, `5.3 uuv OTHER_ASKS 5.3.1`, `5.3 stan OTHER_ASKS stan-5.3`
- **Verdict:**
  - arneo and uuv: OTHER RIGHT. It is a coverage gap. They ask only about `table[role=presentation]` (`Criterion5_3.ts:36`, uuv `withFormatting`): Insee `#documents`, the Strasbourg webform. Test 5.3.1 needs a person to check that the linearised content is understandable.
  - stan: PACK RIGHT, and not worth adopting. It asks about any table of 2×2 or less without a `th` (`index.js:492`); here those are the BAD *before* layout tables.
- **Proposal (pack, new manual rule):** cantTell 5.3.1 for each visible `table[role=presentation|none]`, quoting the start of its linearised text. Small effort, low false-positive risk.

### 5.4 / 5.5 table titles — arneo/stan asks, uuv fails 5.4; arneo/uuv ask 5.5; 6–11 pages
Groups: `5.4 arneo OTHER_ASKS arneo-5.4`, `5.4 stan OTHER_ASKS stan-5.4`, `5.4 uuv OTHER_FAILS 5.4.1`, `5.5 arneo OTHER_ASKS arneo-5.5`, `5.5 uuv OTHER_ASKS 5.5.1`
- **5.4 verdict:** PACK RIGHT.
  - 5.4 only applies to "tableau de données ayant un titre".
  - uuv fails every table without a `caption`, `title` or `aria-label` (`5-table.js:65-85`). That catches the BAD layout tables, the LCL sticky clone (`opacity:0`), and the CNIL table restructured by mCustomScrollbar.
  - stan ignores `title` and `aria-labelledby` (`index.js:478`): the CNIL p15 tables have both.
  - The pack's targeted `table-fake-caption` is the right shape for this.
- **5.5 verdict:** OTHER RIGHT. It is a coverage gap. arneo and uuv ask, for each data table that has a title, whether the title is relevant (test 5.5.1): BAD after, Insee, CNIL, Bouygues `aria-label="Europe, première partie"`.
- **Proposal (pack, new manual rule):** cantTell 5.5.1 for each visible data table whose name comes from `caption`, `title`, `aria-label` or `aria-labelledby`, showing the name. Skip tables marked as layout. Small effort, low false-positive risk.

### 5.6 headers — pack asks; arneo/stan fail; arneo/uuv ask; 3–12 pages
Groups: `5.6 a11ylint PACK_ASKS rgaa-data-table-headers-review`, `5.6 stan PACK_ASKS rgaa-data-table-headers-review`, `5.6 arneo OTHER_FAILS arneo-5.6`, `5.6 stan OTHER_FAILS stan-5.6`, `5.6 arneo OTHER_ASKS arneo-5.6`, `5.6 uuv OTHER_ASKS 5.6.1 + 5.6.2 + 5.6.3 + 5.6.4`
- **Verdict:** PACK RIGHT.
  - The pack asks about tables of 2×2 or more with no header cell.
  - **arneo** fails 5.6 when the *last* table on the page has no `th` (`Criterion5_6.ts:25-31`, where the status is overwritten), which includes layout tables.
  - **stan's 5.6** is "a `th` without `scope`/`id`" (`index.js:517`). That is 5.7.1, and it ignores the particular case of 5.7.
  - The arneo and uuv asks fire on every table that is not `role=presentation`, so they are untargeted.
- **One table needs a person:** the LCL p12 opening hours (`<td class="day">Lundi</td><td>Fermé</td>`). If it is a data table, the days are row headers, and 5.6.2 fails because they are marked up as `td`. The pack's question is the right outcome there.

### 5.7 header association — uuv fails 5.7.1/5.7.2, arneo fails/asks, uuv asks 5.7.4; 1–9 pages
Groups: `5.7 uuv OTHER_FAILS 5.7.1`, `5.7 uuv OTHER_FAILS 5.7.2`, `5.7 uuv OTHER_FAILS 5.7.1 + 5.7.2`, `5.7 arneo OTHER_FAILS arneo-5.7`, `5.7 arneo OTHER_ASKS arneo-5.7`, `5.7 uuv OTHER_ASKS 5.7.4`
- **Verdict:** BOTH PARTLY.
  - **uuv is right on LCL p10 (`/cartes-bancaires`).** The comparison table has column headers in `thead` *and* row headers (`th.first-column`: "Tarif", "Plafond de retrait…") with no `scope`, `id` or `role`. Headers on both axes fall outside the particular case of 5.7, so test 5.7.1 fails. The pack is inapplicable there.
  - **uuv is wrong on 4 other pages:**
    - CNIL p15 has headers only in `thead`, which the particular case allows.
    - Bouygues p6 has headers only in the first column, which the particular case also allows.
    - On Insee p11/p12 and BAD after-survey, uuv flags `th scope="row"` as a "column header" because its `tr:first-child th` also matches the first row of each `tbody` (`selector-helper.js:98`).
    - BAD before is a layout table.
  - **arneo NC is wrong:** `isSingleRowOfTh` requires the table to have a single row (`Criterion5_7.ts:54`), and the status is overwritten for each table.
  - **The uuv 5.7.4 ask** is generic and not worth adopting.
- **Proposal (pack, new automatic rule `rgaa-th-scope-two-axis`):**
  - In a visible data table (not `role=presentation|none`) that has header cells in the first row *and* the first column, fail each `th` with no unique `id`, no `scope` and no `role=rowheader|columnheader`.
  - Maps to 5.7.1. Outcome: fail.
  - False-positive risks:
    - the corner `th`, which should be skipped when it is empty;
    - tables whose only "row headers" are `th` used for styling; ask rather than fail when the first-column `th` cells are empty or bold-only.

### 5.8 — arneo OTHER_ASKS, 14 pages / 5 sites
Group: `5.8 arneo OTHER_ASKS arneo-5.8`
- **Verdict:** PACK RIGHT. arneo asks about *every* table that has data markup (`Criterion5_8.ts:46-58`), so the question is untargeted. The pack's `rgaa-layout-table-no-data-markup` fails or asks only for tables marked as layout. Not worth adopting.

## Improvements
| # | Criterion | From | Change | Where | Outcome | Effort | Value |
|---|---|---|---|---|---|---|---|
| 1 | 3.2 | own finding (Bordeaux, live) | Count negative-`z-index` `::before`/`::after` and children inside a stacking context as paint over its background: colour → measure, image → cantTell | core `contrast-helpers.js` background walk / `__findPaintUnderText` | removes a false-positive fail | M | High |
| 2 | 3.2 | own finding (impots) | `background-image: none, none` is not an image: split layers, all `none` → false | core `contrast-helpers.js:1742` `hasBackgroundImageOrGradient` | cantTell → measured | S | High |
| 3 | 3.2 | own finding (impots, unistra) | Solid single-colour gradients count as a colour; thin underline layers (≤2px or outside line boxes) are ignored; measure against each colour | core `contrast-helpers.js` gradient handling | cantTell → pass/fail | M | High |
| 4 | 3.2 | own finding | `filter: drop-shadow()` alone on an ancestor with an opaque background does not block | core `hasFilter` call sites | cantTell → measured | S | Med |
| 5 | 3.2 | own finding (CNIL, Caisse, Insee) | A solid opaque overlap box (incl. `::before`) covering the text's line boxes becomes the background; SVG stroke-only shapes count only where the stroke crosses the text | core `__findPaintUnderText`, `__paintCandidate` | cantTell → measured | M | Med |
| 6 | 2.1 | uuv/stan/arneo + Caisse audit | An empty or whitespace `title` is "no frame title": fail under 2.1.1, not 2.2.1 | pack `rgaa-frame-title-attribute-present.js` (+ `-not-empty`, `rule-map.js`) | fail | S | High |
| 7 | 2.2 | uuv | Non-empty title → cantTell with the title text (not pass); fail/strong ask for generic titles (`iframe`, `YouTube video player`…) | pack `rgaa-frame-title-not-empty.js` | cantTell | S | Med |
| 8 | 4.1/4.3/4.5/4.7 | gap (stan counts players) | New manual rule for visible embedded players (YouTube, Vimeo, Dailymotion, PeerTube, SoundCloud, mediaserver) | pack, new `rgaa-embedded-media-review` | cantTell | M | High |
| 9 | 5.7 | uuv (LCL p10) | Tables with headers on both axes: a `th` with no `id`, `scope` or role fails 5.7.1 | pack, new `rgaa-th-scope-two-axis` | fail | M | Med |
| 10 | 5.5 | arneo/uuv | Ask relevance of each visible data table's title (caption/title/aria-label/labelledby) | pack, new manual rule | cantTell | S | Med |
| 11 | 5.3 | arneo/uuv | Ask about linearisation of each visible `table[role=presentation\|none]` | pack, new manual rule | cantTell | S | Low |
| 12 | 3.2 | own | Fail (not ask) a placeholder whose `::placeholder` colour is author-declared and below the ratio | core `contrast-minimum.js` | fail | S | Low |
| 13 | 3.1 | uuv | Targeted ask for information-bearing charts (SVG/canvas with legend or many fills); do **not** adopt uuv's every-SVG question | pack, new manual rule | cantTell | M | Low |
| 14 | bench | — | Place findings using the full stored HTML and occurrence order (fixes the SoundCloud and impots collisions) | `run.mjs` `placeInCases` | — | S | Med |
| 15 | bench | — | Capture arneo elements through `getHighlightedElements()` when `elementList` is empty (2.1, 3.2) | `vendor.mjs:62` | — | S | Med |
| 16 | bench | — | Feed a11ylint only rendered, visible, non-clipped text; compare tag names case-insensitively (SVG `style`) | `vendor.mjs:101` | — | S | Med |
| 17 | bench | — | Re-scan pages marked blocked; the Caisse newsletter page loads now and carries the audit's 2.1 failure | `run.mjs` / corpus | — | S | Med |
