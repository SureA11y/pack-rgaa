# Theme 10: Presentation of information

## Summary
80 groups (24 distinct criterion/kind/rule combinations) on criteria 10.1, 10.4, 10.5, 10.6, 10.7, 10.8 and 10.12. uuv (`10-display.js` exports `[]`), a11ylint (no RGAA10 rule file) and stan (no `10.x` id in `rules/index.js`) cover nothing in theme 10. ARNEO's 10.4, 10.7 and 10.12 always return NT with no elements, so the bench records nothing for them. Every PACK_FAILS and PACK_ASKS group is therefore a coverage gap. The real questions are whether the pack's own findings are correct, plus ARNEO's 10.1 failures and its 10.5 questions.

Verdicts by heading: PACK RIGHT 6 (10.1 vs ARNEO's SVG failures, 10.4, 10.6 asks, 10.7 asks, 10.8, 10.12 asks/avoid-inline-spacing), BOTH PARTLY 4 (10.1 pack failures, 10.6 failures, 10.7 failures, 10.12 failures), NOT A REAL DIFFERENCE 1 (10.1 MORE_ELEMENTS, from path mismatches), OTHER RIGHT on the gap (10.5: the gap is real, but ARNEO's question is not worth copying).

Main takeaways:
- **10.1:** the pack applies RGAA's list exactly as written. It exempts width/height on img/svg/object/embed/canvas, and no img or svg is flagged anywhere. No `<video>` appears in any finding. All 1,087 `<rect>` failures from ARNEO are false positives: it does not check the SVG namespace. ARNEO also misses attributes on `<body>`. Pack issues are minor:
  - `<source>` in `<picture>` (331 occurrences, 7 pages): literally in scope; ARNEO exempts it.
  - custom elements such as `<calcite-button width>`.
- **10.7, rgaa-focus-indicator-contrast:** out of 84 failing elements, only 7 are confirmed real. 67 are false positives:
  - 39 at Bordeaux: the button's visible fill is a `::before` background image.
  - 28 at LCL: the measurement was taken through the cookie consent overlay.
  - 10 more at Insee should probably be cantTell (the fallback to the parent's background when the side is off-screen).
- **10.12, text-spacing-content-loss:** 14 of the 27 failing pages (Bouygues and LCL) fail only because `<body>` is treated as a clipping box while a cookie modal locks scrolling. This is a false positive in core. Unistra's failure was confirmed live.
- **10.5:** the pack has no coverage. ARNEO asks on 133 of 165 pages (any background-image), which is not targeted. Live, LCL and Bordeaux declare text colors but have no background on html/body, the classic 10.5.1 non-conformity. A targeted pack rule is worth writing.

Live loads: 14 in total, sequential, at least 4 s apart, Chrome UA, fr-FR. Only valid pages were used: 165 of 206.

## Criterion 10.1

### Pack's presentational attributes/elements: uuv, a11ylint, stan, arneo, PACK_FAILS, 64+4 pages / 7 sites + BAD
Groups: `10.1 a11ylint PACK_FAILS rgaa-presentational-attributes-absent`, `10.1 stan PACK_FAILS rgaa-presentational-attributes-absent`, `10.1 uuv PACK_FAILS rgaa-presentational-attributes-absent`, `10.1 arneo PACK_FAILS rgaa-presentational-attributes-absent`, `10.1 a11ylint PACK_FAILS rgaa-presentational-attributes-absent + rgaa-presentational-elements-absent`, `10.1 stan PACK_FAILS rgaa-presentational-attributes-absent + rgaa-presentational-elements-absent`, `10.1 uuv PACK_FAILS rgaa-presentational-attributes-absent + rgaa-presentational-elements-absent`

- **What differs:**
  - uuv, a11ylint and stan have no 10.1 check.
  - ARNEO's 5 PACK_FAILS pages (iledefrance, Bordeaux) are pages where the pack's only findings are `<source width height>`, which ARNEO exempts.
- **Verdict:** **BOTH PARTLY**, mostly PACK RIGHT. I tallied every pack 10.1 occurrence on the 165 valid pages (script `t101.cjs`). Each attribute is in the RGAA glossary list ("Présentation de l'information") for test 10.1.2, and each element is in the list for test 10.1.1:
  - On BAD: `td/tr/table` with `align, valign, bgcolor, background, width, height, border, cellpadding, cellspacing`; `img` with `border, hspace, align`; `font`, `big`, and `u` on a non-HTML5 doctype; `body` with `text, link, vlink, alink, bgcolor, marginwidth, marginheight`.
  - `div[align]` at Bouygues (33).
  - `input[size]` (65; size is allowed only on `<select>`).
  - `iframe[frameborder|width|height]` (30). RGAA's width/height exemption names only img, object, embed, canvas and svg, so iframe is in scope, and ARNEO flags it too.
  - **width/height on img, svg and video:** not one img or svg is flagged (they are exempt at `rules/automatic/rgaa-presentational-attributes-absent.js:85`). Elements inside SVG (`rect` etc.) are skipped by the namespace check at line 97. No `<video>` with width/height occurs in any finding. Note that RGAA's exemption list does **not** include `video`, so failing it would be the literal reading. If the team wants to treat video like img, that is a policy choice.
  - Debatable items:
    - **`<source width height>`**, 331 occurrences on 7 pages (iledefrance, Bordeaux, 2 at Bouygues). This is literally in scope, because `source` is not in RGAA's exemption list. However, HTML now defines these attributes on `<source>` in `<picture>` as the image candidate's dimensions, the same role as on `<img>`, and ARNEO exempts `source` (`Criterion10_1.ts:72-73`). 5 pages fail 10.1 only because of them.
    - **`<calcite-button width="auto">`** (4 occurrences, Bouygues coverage map): `width` here is an attribute of an Esri web component's API, not the HTML attribute. This is a false positive in spirit.
    - **`<span color="ambience.6">`** (2 occurrences, Nantes/geoplanet): a styled-components prop that leaked into the DOM. It is literally a `color` attribute, so the failure is acceptable, though it has no effect.
  - `basefont` is in the pack's attribute list (line 64), but it is an element, not an attribute in RGAA's list. It is harmless, with 0 hits.
- **Evidence:** a full tally of pack occurrences by element and attribute set (65 distinct combinations, about 1,150 occurrences), with element HTML from the raw results. No live load was needed.
- **Proposal:** in `rgaa-presentational-attributes-absent.js`:
  1. Skip custom elements (a local name containing `-`), whose attributes are component properties. Outcome: no finding. FP risk: none. Missed-issue risk: a custom element that really forwards `align` to the HTML attribute, which is rare.
  2. Optionally, either exempt `width`/`height` on a `<source>` whose parent is `<picture>`, or report them as cantTell. That aligns with ARNEO and the img exemption, at the cost of departing from RGAA's literal list. Document the choice in `rule-map.js`.

### ARNEO's SVG geometry failures: arneo, OTHER_FAILS, 30 pages / 4 sites
Groups: `10.1 arneo OTHER_FAILS arneo-10.1`

- **What differs:** ARNEO fails 10.1 on 30 pages where the pack passes.
- **Verdict:** **PACK RIGHT**. On those pages, every ARNEO element is an SVG `<rect width height>`, for example `<rect width="56" height="56" fill="white">` at impots and `<rect x="10" y="64" width="260" height="246">` at Insee. That is SVG geometry, not HTML presentation, and test 10.1.2 does not cover it. Across all valid pages, ARNEO flags 1,087 `rect` elements, all of them false positives.
- **How they do it:** `Criterion10_1.ts:72-73` uses `document.body.querySelectorAll('[width]:not(img, object, canvas, embed, svg, image, source)')`. There is no namespace check, so every SVG child with width/height matches. Only `svg` and `image` are excluded.
- **Evidence:** all ARNEO 10.1 failures on pages where the pack passes, matched by tag. Apart from `rect`, nothing remains on those pages.

### Both fail, different elements: arneo, OTHER_MORE_ELEMENTS / PACK_MORE_ELEMENTS, 25+13+1 pages
Groups: `10.1 arneo OTHER_MORE_ELEMENTS arneo-10.1`, `10.1 arneo PACK_MORE_ELEMENTS rgaa-presentational-attributes-absent`, `10.1 arneo PACK_MORE_ELEMENTS rgaa-presentational-attributes-absent + rgaa-presentational-elements-absent`

- **What differs:** three causes.
  1. ARNEO's extra elements are SVG `rect` elements, which are false positives as above.
  2. The pack's extra elements are:
     - attributes on `<body>` on the BAD pages (`text, bgcolor, link, vlink, alink, marginwidth, marginheight`). ARNEO misses them because it queries `document.body.querySelectorAll`, which excludes body itself (`Criterion10_1.ts:66`). The pack is right.
     - `<source>`, which ARNEO exempts. See above.
  3. The same element is flagged by both engines at a different child-index path, so the elements are not matched:
     - lenord `<iframe height="1" width="1">`: pack at `1/19`, ARNEO at `1/20`.
     - Bouygues `div#tc_privacy_logo[align]`: pack at `1/13/0/0/1/0`, ARNEO at `1/12/0/0/1/0`.
- **Verdict:** **NOT A REAL DIFFERENCE** for cause 3, which appears on 8 pages. For causes 1 and 2 the pack is right.
- **Proposal (bench):** `diff.mjs` matches elements by `path` only. Body children shift between engine runs, because pages inject nodes and engines run one after another. Add a fallback that matches on the normalised start of `html` when the paths differ but the tag and the first 80 characters agree. Also deduplicate ARNEO's findings: it concatenates its lists, so an iframe with frameborder, width and height appears three times.

## Criterion 10.4
### Viewport meta zoom question: all four engines, PACK_ASKS, 15 pages / Nantes
Groups: `10.4 a11ylint PACK_ASKS rgaa-viewport-zoom-review`, `10.4 arneo PACK_ASKS rgaa-viewport-zoom-review`, `10.4 stan PACK_ASKS rgaa-viewport-zoom-review`, `10.4 uuv PACK_ASKS rgaa-viewport-zoom-review`

- **What differs:** the pack asks about `<meta name="viewport" … user-scalable=no, maximum-scale=1>` on Nantes pages. The other engines say nothing. ARNEO's `Criterion10_4.ts:47-55` always returns NT with no element.
- **Verdict:** **PACK RIGHT**. Test 10.4.2 passes when any one of three means reaches 200%: browser text zoom, browser graphic zoom, or a zoom control of the site. The meta tag blocks only pinch zoom, so a question is the right outcome rather than a failure. The question is targeted: one finding per offending tag, and only on the 15 Nantes pages that have such a tag.

## Criterion 10.5
### ARNEO's background-image question: arneo, OTHER_ASKS, 133 pages / 11 sites + BAD
Groups: `10.5 arneo OTHER_ASKS arneo-10.5`

- **What differs:** ARNEO asks on 133 of the 165 valid pages, with 3,738 highlighted elements in total. The pack has no 10.5 rule (`docs/RGAA_MAPPING.md`: "It does not check the paired CSS color declarations of 10.5, so 10.5 is not mapped").
- **Verdict:** the gap is real, so the other engine is right that 10.5 needs coverage. ARNEO's question, however, is **not worth adopting as it stands**.
- **How they do it:** `Criterion10_5.ts`.
  - Tests 1 and 2 (lines 88-120):
    - If `<body>` has a computed non-transparent background and a color, both pass.
    - Otherwise it walks every text node's parent. An element fails when no ancestor has a background (`hasBackgroundColor`, lines 199-212). `hasColor` (lines 214-219) is always true, because a computed color always exists, so test 2 can never fail.
  - Test 3 (lines 122-130): any element with a computed `background-image`, text or not, makes the result NT.
  - `runTest` always returns `'NT'` (line 144). The bench therefore sees cantTell on every page with any background image (icons, sprites, gradients), and the highlighted list mixes test-3 elements with test-1 candidates.
- **Evidence (live):**
  - LCL: `html` and `body` both have a transparent background, and `body` has `color: rgb(57,57,57)`.
  - Bordeaux home: `html` and `body` are both transparent.
  - CNIL and Bordeaux agenda: `body` is white.
  - Insee: `body` is `#f7f7f7` with a declared color.

  On LCL and Bordeaux this is exactly the 10.5.1 non-conformity: a CSS text color with no background declaration on the element or any ancestor, so a user whose default background is dark gets dark-on-dark text. ARNEO surfaces those elements only inside a generic question.
- **Proposal:** a new pack rule, `rgaa-css-color-background-paired`, running in a browser:
  - **Failures:**
    - **10.5.1, fail:** text whose color comes from an author declaration while neither the element nor any ancestor up to `<html>` has a non-transparent `background-color` or a background image. To tell an author color from the UA default, compare the computed color with a probe element in a style-free iframe, or read the cascade the way rgaa-focus-indicator-contrast already does. Report once, on the topmost element where the declared color starts. Doing so avoids thousands of findings.
    - **10.5.3, fail:** an element that contains text and has a background image or gradient, with no background color on itself or any ancestor.
  - **Questions:**
    - **10.5.2, cantTell:** a background is declared somewhere in the chain while the text color is the UA default and no author `color` is found. This is a question because a computed black may come from an author's `color:#000`.
  - **FP risks:**
    - cross-origin stylesheets, for which the declared-or-default question is unknown: answer cantTell;
    - form controls, whose backgrounds come from the UA: skip them;
    - the colors of unvisited and visited links, which are UA colors;
    - iframes.
  - **Where:** the pack, as new code mapped to 10.5.1–10.5.3.

## Criterion 10.6
### link-in-text-block failures: all four engines, PACK_FAILS, 17 pages / 5 sites
Groups: `10.6 a11ylint PACK_FAILS link-in-text-block`, `10.6 arneo PACK_FAILS link-in-text-block`, `10.6 stan PACK_FAILS link-in-text-block`, `10.6 uuv PACK_FAILS link-in-text-block`

- **What differs:** a core rule fails 18 links. No other engine checks 10.6 (stan's mapping lists it as "À faire").
- **Verdict:** **BOTH PARTLY**, mostly PACK RIGHT. 13 of the 18 elements are Bordeaux's footer `<a href="tel:0556998484">`. Live, the link and its block have the same color (`rgb(43,42,42)`), weight 400/400 and no underline, in "Bordeaux Métropole Esplanade Charles-de-Gaulle … Standard : 05 56 99 84 84". The link cannot be told apart from its text at all, which is a clear failure of 10.6.1. The other 5 are borderline cases where the link's nature can be argued to be evident (the "nature n'est pas évidente" condition of 10.6.1), and they need a human:
  - a breadcrumb `span[role=link]` at Caisse d'Epargne (inside `nav[aria-label="Vous êtes ici"]`);
  - the `Esri` attribution in a map widget at Bouygues;
  - a URL-text link `https://www.cnil.fr` in a list at CNIL;
  - a `.lien_externe` at Nantes/geoplanet.
- **Evidence:** 1 live check (Bordeaux footer), plus the stored HTML of all 5 distinct cases.
- **Proposal (core, `link-in-text-block`):** treat links inside `nav` breadcrumbs (`nav[aria-label*=…]` holding an `ol`/separator pattern, or `aria-current` siblings) as navigation rather than a text block. Turn those into cantTell, or leave them out. FP risk: low.

### link-in-text-block / link-state questions: all four engines, PACK_ASKS, 18+15 pages
Groups: `10.6 a11ylint PACK_ASKS link-in-text-block`, `10.6 arneo PACK_ASKS link-in-text-block`, `10.6 stan PACK_ASKS link-in-text-block`, `10.6 uuv PACK_ASKS link-in-text-block`, `10.6 a11ylint PACK_ASKS link-in-text-block + rgaa-link-state-colors-review`, `10.6 arneo PACK_ASKS link-in-text-block + rgaa-link-state-colors-review`, `10.6 stan PACK_ASKS link-in-text-block + rgaa-link-state-colors-review`, `10.6 uuv PACK_ASKS link-in-text-block + rgaa-link-state-colors-review`

- **Verdict:** **PACK RIGHT**. The questions cover links shown only by a color at 3:1 or more, which need a non-color cue on hover and focus (10.6.1 step 2), and state colors (step 3). The questions are targeted at specific links (CNIL 131, LCL 47, Bouygues 45, BAD 6).
- **Proposal (improvement):** `rgaa-link-state-colors-review` already forces the hover and focus states in a browser. Have it also check whether those states add a non-color cue (underline, border, outline, box-shadow, background). It can then pass or fail the step-2 part, and `link-in-text-block` stops asking about it. This would remove most of the 10.6 questions.

## Criterion 10.7
### rgaa-focus-indicator-contrast failures: all four engines, PACK_FAILS, 28 pages / Insee, Bordeaux, LCL
Groups: `10.7 a11ylint PACK_FAILS rgaa-focus-indicator-contrast`, `10.7 arneo PACK_FAILS rgaa-focus-indicator-contrast`, `10.7 stan PACK_FAILS rgaa-focus-indicator-contrast`, `10.7 uuv PACK_FAILS rgaa-focus-indicator-contrast`

- **What differs:** the pack fails 84 elements. No other engine checks focus contrast (ARNEO `Criterion10_7.ts:41-55` returns NT whenever any focusable element exists).
- **Verdict:** **BOTH PARTLY**. The pack is right on 7 elements and wrong on 67. The other 10 are probably wrong (they should be cantTell). I checked all 5 distinct element types live:

| Elements | Pack | Live finding | Correct? |
|---|---|---|---|
| Insee search examples `#search-example-*`, listbox (5) | outline #81888a, 2.83:1 | 2px gray outline on `div.search-group` `#0f417a`, both sides (screenshot f1_0_0) | **real failure** |
| Bordeaux agenda `button.btn-link` (2) | box-shadow #95bffb, 1.79:1 | Bootstrap `rgba(49,132,253,.5) 0 0 0 2.5px` on `#f9f9f9`. No other change (the underline was already there) | **real failure** |
| Bordeaux `#tarteaucitronPersonalize2`, `#tarteaucitronAllDenied2`, `#tarteaucitronCloseAlert` (39, every Bordeaux page) | outline #3d86d8, 2.48:1 vs yellow `#ffcc00` | The button's computed background is yellow, but its visible fill is a **dark pill painted by `::before`** (`position:absolute; inset:0; z-index:-1; background-image:url(hoverBt.svg)`) (screenshots f2_0_0, f2_1_0). The outline sits between the yellow banner and the dark pill. Against the dark side it is about 3.8:1, judged visually | **false positive**: should be cantTell (one side, or a background image) |
| LCL `button.megamenu-trigger` (28, every LCL page) | outline #525252, 1.98:1 | `div#privacy-overlay` (`rgba(0,0,0,.5)`, the cookie consent) covers the page. `elementsFromPoint` at the button's center returns the overlay first. The real background is nav `#f9f9f9`, which gives **7.42:1** | **false positive** |
| Insee FAQ `button/a.thematic-title` (10) | outline #81888a, 1.57:1 vs `#3467ae` | Live: the button fills its `li` (same rect). One px outside, the page background is `#f7f7f7`, which gives 3.37:1. Inside is blue, at 1.57:1. One side reaches 3:1 | **should be cantTell**. Probable cause below |

- **How the false positives arise** (`rules/automatic/rgaa-focus-indicator-contrast.js`):
  - `focusedBackground` (1043-1056) reads only the element's own computed `background-color`. A `::before`/`::after` that paints the visible fill is ignored, though the snapshot already reads pseudo-element properties for change detection.
  - `paintedAt` (990-1001) takes the topmost element at a point that is not the element itself. When a full-page overlay covers the element, both "sides" are the overlay.
  - `colorsAround` (1018-1040): a side whose point is outside the viewport falls back to `backgroundAt(parentOf(el))`. The element is focused with `preventScroll: true` (line 957), so below-the-fold elements use this fallback. When the parent has the element's own box (the Insee `li`), the fallback returns the color *under* the element rather than outside it. This is the likely cause of the Insee 1.57:1 result: live, in the viewport, the outside reads `#f7f7f7`.
  - `dist = offset + width/2` (line 1112) samples *under* the ring, not beside it. When a parent's background has a fringe the ring covers, the color measured is one nobody sees.
- **Proposal (pack, rgaa-focus-indicator-contrast.js):**
  1. **Occlusion:** if `elementsFromPoint` at the element's center does not return the element or one of its descendants first, the element is covered. Return cantTell (`cause: 'covered'`) or skip it. This removes the 28 LCL false positives.
  2. **Pseudo-element fill:** in `focusedBackground`, if `::before` or `::after` has content, is absolutely positioned or covers the box, and has a background color or image, return null, giving cantTell. Better, when its background color is opaque, use it as the inner color. This removes the 39 Bordeaux false positives.
  3. **Off-viewport sides:** scroll the element into view before measuring (restoring the scroll afterwards), or make the fallback climb to the first ancestor whose box is strictly larger than the element's. With neither, answer cantTell.
  4. **Sampling:** sample the outside at `offset + width + 1`, and when `offset > 0`, sample the gap at `offset - 1`.

  Outcome: unchanged (fail at under 3:1 on both sides). FP risk after the fix: low. Measured on this bench, failing pages would drop from 28 to about 3 (Insee search, Bordeaux agenda), all of them real.

### 10.7 questions: all four engines, PACK_ASKS, 91+28+6+5+5+1+1 pages
Groups: `10.7 a11ylint PACK_ASKS manual-review + rgaa-focus-indicator-contrast`, `10.7 arneo PACK_ASKS manual-review + rgaa-focus-indicator-contrast`, `10.7 stan PACK_ASKS manual-review + rgaa-focus-indicator-contrast`, `10.7 uuv PACK_ASKS manual-review + rgaa-focus-indicator-contrast`, `10.7 a11ylint PACK_ASKS manual-review`, `10.7 arneo PACK_ASKS manual-review`, `10.7 stan PACK_ASKS manual-review`, `10.7 uuv PACK_ASKS manual-review`, `10.7 a11ylint PACK_ASKS css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `10.7 arneo PACK_ASKS css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `10.7 stan PACK_ASKS css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `10.7 uuv PACK_ASKS css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `10.7 a11ylint PACK_ASKS css-hidden-focus + manual-review`, `10.7 arneo PACK_ASKS css-hidden-focus + manual-review`, `10.7 stan PACK_ASKS css-hidden-focus + manual-review`, `10.7 uuv PACK_ASKS css-hidden-focus + manual-review`, `10.7 a11ylint PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `10.7 arneo PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `10.7 stan PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `10.7 uuv PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `10.7 a11ylint PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review`, `10.7 arneo PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review`, `10.7 stan PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review`, `10.7 uuv PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review`, `10.7 a11ylint PACK_ASKS css-focus-indicator-suppressed + manual-review`, `10.7 arneo PACK_ASKS css-focus-indicator-suppressed + manual-review`, `10.7 stan PACK_ASKS css-focus-indicator-suppressed + manual-review`, `10.7 uuv PACK_ASKS css-focus-indicator-suppressed + manual-review`

- **Verdict:** **PACK RIGHT** to ask, with a volume caveat.
  - `manual-review` is the always-on keyboard reminder of 10.7.1, at page level.
  - The element-level questions cover the cases the rule documents: one side only, a non-measured change, or not computable.
  - **Volume:** impots.gouv gets 1,201 "not computable" questions and Bouygues 597, which is heavy. The occlusion fix above also turns overlay-covered elements into skips instead of questions.
  - Fixes 2 and 3 above will move some of these questions to verdicts.
  - ARNEO is `inapplicable` on 1 page and silent on the others, so there is nothing to adopt.

## Criterion 10.8
### aria-hidden-focus: all four engines, PACK_FAILS 2 pages / PACK_ASKS 21 pages
Groups: `10.8 a11ylint PACK_FAILS aria-hidden-focus`, `10.8 arneo PACK_FAILS aria-hidden-focus`, `10.8 stan PACK_FAILS aria-hidden-focus`, `10.8 uuv PACK_FAILS aria-hidden-focus`, `10.8 a11ylint PACK_ASKS aria-hidden-focus`, `10.8 arneo PACK_ASKS aria-hidden-focus`, `10.8 stan PACK_ASKS aria-hidden-focus`, `10.8 uuv PACK_ASKS aria-hidden-focus`

- **What differs:** no other engine checks 10.8 (stan's mapping lists it as "À faire").
- **Verdict:** **PACK RIGHT** for the coverage gap, with one finding not reproduced live.
  - **Failures:**
    - Nantes `p.sr-only[aria-hidden=true]` wrapping a honeypot `<input>` that keyboard focus can reach. It is reachable by Tab yet hidden from both sight and assistive technologies. Under the pack's reading of 10.8.1 (focusable content is not "à vocation à être ignoré"), this is a failure. A strict reader could file it under 10.7 instead. Either way it is a real defect.
    - iledefrance `div.map.hide-map[aria-hidden=true]` containing 1 focusable element. Not checked live: a human must confirm what is focusable inside.
  - **Questions (a modal is open):**
    - Bordeaux Swiper slides `aria-hidden="true"` that hold links. Real: a common Swiper defect.
    - Bouygues `#SSOHiddenContainer` (an off-screen iframe). A real keyboard trap into invisible content.
    - Caisse d'Epargne mega-menu panels (90 findings on 3 pages). **Not reproduced live:** the panels and their links are now `visibility:hidden`, which makes them unfocusable, and 60 Tab presses never entered an `aria-hidden` subtree. Either the site changed, or the scan ran before the menu script hid the panels (the bench waits 800 ms after load).
- **Proposal:** none needed for 10.8. Optionally, for the bench, wait longer or for network idle before running the engines.

## Criterion 10.12
### text-spacing-content-loss failures: all four engines, PACK_FAILS, 27 pages / 7 sites
Groups: `10.12 a11ylint PACK_FAILS text-spacing-content-loss`, `10.12 arneo PACK_FAILS text-spacing-content-loss`, `10.12 stan PACK_FAILS text-spacing-content-loss`, `10.12 uuv PACK_FAILS text-spacing-content-loss`

- **What differs:** a core rule fails 77 elements. Nobody else checks this (ARNEO `Criterion10_12.ts:60` returns `'NT'`).
- **Verdict:** **BOTH PARTLY**.
  - **Real failure, confirmed live:** Unistra home `unistra-card`. After the 10.12.1 spacings, the date "07 oct. 2026" disappears and the title is clamped (screenshots `uni_before.png` and `uni_after.png`).
  - **False positives on 14 of the 27 pages:** all 12 Bouygues pages and 3 LCL pages. Their only failure is `selector: html > body`, with messages such as "cet élément rogne le texte « Forfait Essentiel » (126 px…)". Live on Bouygues `/forfaits-mobiles/avec-engagement`:
    - html is `overflow: visible` and body is `overflow: hidden` with a 900 px height (the cookie popin `#popin_tc_privacy` is open and locks scrolling);
    - the text moves from y=798 to y=990 once spacing is applied, so it is simply pushed below the fold.

    When html is `visible`, body's overflow propagates to the viewport, so the body box itself clips nothing. The lock is in any case transient (a modal). Spacing does not cause this loss of content.
  - **Not verified:**
    - Bordeaux file-size links "(1.36 Mo)" (19 elements);
    - Nantes news cards;
    - Insee selects;
    - CNIL `#mCSB_1` (a mCustomScrollbar container, which scrolls by JS behind `overflow:hidden`, so it is likely a false positive).
- **How:** core `src/checks/automatic/text-spacing-content-loss.js`, `clippersOf` (about lines 445-490). It treats any ancestor with overflow `hidden`/`clip` as a clipper, `<body>` included. `paintClippersOf` (line 511) already excludes body.
- **Proposal (core):**
  1. In `clippersOf`, skip `<body>` when html's overflow is `visible` (the overflow propagates to the viewport), and never treat the viewport's vertical axis as clipping. Outcome: no finding. This removes the 14 pages.
  2. Answer cantTell for a clipper whose `scrollHeight > clientHeight` is driven by a JS scroller (a heuristic: class `mCSB_`/`simplebar`/`os-` or a child moved by `transform`).

### text-spacing questions and avoid-inline-spacing: all four engines, PACK_ASKS 59 pages / PACK_FAILS 2 pages
Groups: `10.12 a11ylint PACK_ASKS text-spacing-content-loss`, `10.12 arneo PACK_ASKS text-spacing-content-loss`, `10.12 stan PACK_ASKS text-spacing-content-loss`, `10.12 uuv PACK_ASKS text-spacing-content-loss`, `10.12 a11ylint PACK_FAILS avoid-inline-spacing`, `10.12 arneo PACK_FAILS avoid-inline-spacing`, `10.12 stan PACK_FAILS avoid-inline-spacing`, `10.12 uuv PACK_FAILS avoid-inline-spacing`

- **Verdict:** **PACK RIGHT**.
  - **Questions:**
    - The questions cover text pushed out by less than half a line, overlaps, and stylesheet rules that force spacing with `!important`. Examples: CNIL `* { line-height … !important }`, DSFR `.fr-h*` at impots, and cookie banners `#tc_privacy_textBan`, `#popin_tc_privacy`.
    - They are targeted and match test 10.12.1 step 1, where the bookmarklet-style override cannot beat author `!important` in a style attribute or a more specific rule.
  - **Failure:** `avoid-inline-spacing` at impots: `<h2 style="font-size:2rem !important; line-height:2.5rem !important">` (1.25 < 1.5). An inline `!important` defeats the RGAA test procedure's override. This is correct for 10.12.1 step 1.
  - **Caveat:** a user stylesheet's `!important` would still win under the CSS cascade, so the WCAG view of this failure is weaker.

## Improvements
| # | Criterion | From | Change | Where | Outcome | Effort | Value |
|---|---|---|---|---|---|---|---|
| 1 | 10.7 | live check | Detect occlusion: if `elementsFromPoint` at the element's center does not hit el or a descendant, skip it or ask (`covered`). Removes 28 LCL false positives (cookie overlay) | pack `rules/automatic/rgaa-focus-indicator-contrast.js` (`paintedAt`/`evaluateRendered`) | cantTell/skip | S | High |
| 2 | 10.7 | live check | Read `::before`/`::after` fills (background color or image covering the box) in `focusedBackground`. Removes 39 Bordeaux false positives (tarteaucitron) | same file, `focusedBackground` | cantTell, or measure against the pseudo color | S | High |
| 3 | 10.7 | live check | Off-viewport sides: scroll into view before measuring, or fall back to the first ancestor larger than the element. Sample at `offset+width+1`, not under the ring | same file, `colorsAround`, line 1112 | cantTell instead of fail (Insee, 10 elements) | M | Medium |
| 4 | 10.12 | live check | Do not treat `<body>` as a clipper when its overflow propagates to the viewport (html `visible`), and never treat the viewport's vertical axis as clipping. Removes the false positives on 14 of 27 pages | core `src/checks/automatic/text-spacing-content-loss.js` `clippersOf` | no finding | S | High |
| 5 | 10.5 | ARNEO (gap) | New rule `rgaa-css-color-background-paired`: fail 10.5.1 when an author text color has no background on the element or any ancestor; fail 10.5.3 when a text box has a background image and no background color in its ancestry; ask about 10.5.2 when only a background is declared. Report once on the topmost element | pack, new automatic rule (browser) | fail / cantTell | M | High (LCL and Bordeaux fail live; no coverage today) |
| 6 | 10.6 | own analysis | `rgaa-link-state-colors-review` should also check, in forced hover/focus states, for a non-color cue, so `link-in-text-block` stops asking about step 2 | pack `rules/automatic/rgaa-link-state-colors-review.js` + core `link-in-text-block` | pass/fail instead of cantTell | M | Medium (removes about 250 questions) |
| 7 | 10.6 | own analysis | Treat breadcrumb links (`nav` with a breadcrumb pattern) as navigation, not a text block | core `link-in-text-block` | cantTell/none | S | Low |
| 8 | 10.1 | ARNEO | Skip custom elements (a name with `-`). Decide and document whether `<source>` in `<picture>` gets the img exemption for width/height (ARNEO does; RGAA's literal list does not) | pack `rules/automatic/rgaa-presentational-attributes-absent.js` | none / cantTell | S | Low-Med (5 pages fail only on `<source>`) |
| 9 | 10.1 | own analysis | Remove `basefont` from the attribute list (it is an element) | same file, line 64 | — | XS | Cosmetic |
| 10 | bench | 10.1 MORE_ELEMENTS | Match elements by an html-snippet fallback when paths differ by a shifted body child, and deduplicate ARNEO's elements | `diff.mjs` | — | S | Medium (removes artificial MORE_ELEMENTS) |
| 11 | bench | 10.8 | Wait longer, or for network idle, before the engines run (the Caisse d'Epargne menu was not yet hidden) | `run.mjs` | — | XS | Low |

## Appendix: all group ids covered
- 10.1: `10.1 {a11ylint,arneo,stan,uuv} PACK_FAILS rgaa-presentational-attributes-absent`, `10.1 {a11ylint,stan,uuv} PACK_FAILS rgaa-presentational-attributes-absent + rgaa-presentational-elements-absent`, `10.1 arneo OTHER_FAILS arneo-10.1`, `10.1 arneo OTHER_MORE_ELEMENTS arneo-10.1`, `10.1 arneo PACK_MORE_ELEMENTS rgaa-presentational-attributes-absent`, `10.1 arneo PACK_MORE_ELEMENTS rgaa-presentational-attributes-absent + rgaa-presentational-elements-absent`
- 10.4: `10.4 {a11ylint,arneo,stan,uuv} PACK_ASKS rgaa-viewport-zoom-review`
- 10.5: `10.5 arneo OTHER_ASKS arneo-10.5`
- 10.6: `10.6 {a11ylint,arneo,stan,uuv} PACK_ASKS link-in-text-block`, `10.6 {…} PACK_FAILS link-in-text-block`, `10.6 {…} PACK_ASKS link-in-text-block + rgaa-link-state-colors-review`
- 10.7: `10.7 {a11ylint,arneo,stan,uuv}` × {`PACK_ASKS manual-review + rgaa-focus-indicator-contrast`, `PACK_ASKS manual-review`, `PACK_FAILS rgaa-focus-indicator-contrast`, `PACK_ASKS css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `PACK_ASKS css-hidden-focus + manual-review`, `PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review + rgaa-focus-indicator-contrast`, `PACK_ASKS css-focus-indicator-suppressed + css-hidden-focus + manual-review`, `PACK_ASKS css-focus-indicator-suppressed + manual-review`}
- 10.8: `10.8 {a11ylint,arneo,stan,uuv}` × {`PACK_ASKS aria-hidden-focus`, `PACK_FAILS aria-hidden-focus`}
- 10.12: `10.12 {a11ylint,arneo,stan,uuv}` × {`PACK_ASKS text-spacing-content-loss`, `PACK_FAILS text-spacing-content-loss`, `PACK_FAILS avoid-inline-spacing`}

80 groups in total.
