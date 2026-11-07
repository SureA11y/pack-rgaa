# Theme 1: Images

## Summary
63 groups (criteria 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9). Verdicts per group: **PACK RIGHT 21**, **NOT A REAL DIFFERENCE 32**, **BOTH PARTLY 10**, OTHER RIGHT 0, BOTH WRONG 0, UNDECIDABLE 0 (one sub-case of 1.9 is undecidable, inside a group that is otherwise PACK RIGHT).

Main takeaways:
- The large "other fails, pack asks" volume on 1.1 (a11ylint 108 pages, uuv 73+45+8) is false positives from those engines. a11ylint fails every `<img>` whose `alt` is falsy, `alt=""` included (`RGAA1.js:22`). uuv fails every image whose computed name is empty: `alt=""`, `aria-hidden`, and hidden images with real alt text. It also fails every `<svg>` without `role="img"`, decorative ones included. All three engines check `display:none` content. The pack's cantTell (`img-alt-decorative`) is the correct RGAA answer for `alt=""`, since 1.1.1 step 2 is a human decision.
- ARNEO's 1.1 cannot return NC: the NC line is commented out (`Criterion1_1.ts:126-127`), so a page with an image that has no alt comes out **NA**. Its NT asks about every image on the page.
- About a third of the other engines' 1.1 findings land on the same element path as another finding (a11ylint 592/1808, stan 345/1346, uuv 2297/8447). The cause is that `run.mjs:89` matches elements by the first 120 characters of their HTML. This creates spurious `*_MORE_ELEMENTS` groups. **Bench fix.**
- Two bench and core gaps hide real questions. (1) Lazy-loaded images sit at `opacity:0` until they are scrolled into view, and core skips them as invisible. On Caisse d'Epargne, scrolling raised the pack's `img-alt-decorative` occurrences from 39 to 54. (2) Core's `img-alt-decorative` skips any image under an ancestor named by the author, landmarks and figures included (`img-alt-decorative-manual.js:244,318`). This hides sizeable `alt=""` photos inside `figure[aria-label]` and `nav[aria-label]`.
- One real pack false positive: `img-alt-present` is mapped to both 1.1.1 and 1.2.1, so every image without alt fails both criteria. On 13 of the 31 pages (Bordeaux), the only such images are social-media icons that are the sole content of their links. These are informative, so the 1.2 failure is wrong there.
- Coverage gaps worth closing: a targeted CAPTCHA question for 1.4/1.5 (the CNIL contact page has an `alt="Image CAPTCHA"` image, and no pack rule touches 1.4 or 1.5), and a targeted "needs a detailed description?" question for charts (1.6). uuv's own 1.4/1.5/1.6 questions fire on every image of every page and are not worth copying.

Live checks: 14 page loads across 10 sites, plus BAD from stored data. Every live result matched the stored criterion verdicts.

## Criterion 1.1

### alt="" and hidden images counted as missing alternatives — a11ylint, uuv, stan, OTHER_FAILS, 108/73/45/8/2/1 pages, 6 sites
Groups: `1.1 a11ylint OTHER_FAILS RGAA - 1.1.1`, `1.1 a11ylint OTHER_FAILS RGAA - 1.1.1 + RGAA - 1.1.5`, `1.1 uuv OTHER_FAILS 1.1.1 + 1.1.5`, `1.1 uuv OTHER_FAILS 1.1.1`, `1.1 uuv OTHER_FAILS 1.1.5`, `1.1 stan OTHER_FAILS stan-1.1`
- **What differs:** the pack asks (`img-alt-decorative`) or passes. The others fail.
- **Verdict:** **PACK RIGHT** (all 6 groups). Under RGAA, `alt=""` is the decorative marker (test 1.2.1, condition 1). Test 1.1.1 applies only to *informative* images, and whether an image is informative is step 2 of 1.1.1, which needs a human. `aria-hidden="true"` on a decorative image is also compliant (1.2.1, condition 2; 1.2.4 for svg). An image that is not displayed is not evaluated in that state.
- **Evidence:** I classified the 1808 a11ylint 1.1 findings by their stored HTML:

  | Kind of image | a11ylint findings |
  |---|---|
  | `alt=""` | about 1,170 |
  | `alt=""` plus `aria-hidden` | about 250 |
  | no alt, and the pack also fails it | about 205 |
  | other | the rest |

  uuv's 8,447 1.1 findings include 3,384 + 1,454 + 108 + 94 `aria-hidden` svgs failed as "svg has no image role" or "no alternative text". They also include 140 + 117 + 98 + 27 images with a non-empty alt, failed because their computed name is empty: they are `aria-hidden` or hidden.

  Live checks:
  - On Bordeaux `/actualites-Bordeaux-Metropole`, the second set of social icons (`img.pictogram`, no alt) measures 0×0 and fails `checkVisibility()`. The visible `img.bx_metro.pictogram` icons are failed by the pack.
  - On Insee `8310621#onglet-2`, the logo without alt (`ancienLogoInsee.svg`) belongs to the print-only header and is hidden on screen. The `cercle-bluesky alt=""` image sits in a link with text, "Partager sur Bluesky".
  - On Insee-1, the svgs that a11ylint fails under 1.1.5 have `aria-hidden="true"` (`id="G_croissance" aria-label="" role="img" aria-hidden="true"`).
  - stan fails CNIL's `je_m_informe.png`, which has no alt but `aria-hidden="true"`. That is allowed by 1.2.1, condition 2, and the pack asks about it.
- **How they do it:**
  - a11ylint: `RGAA1.js:19-29` fails any `HTMLImageElement` with `!alt && !title && !ariaLabel && !aria-labelledby`. It never checks visibility or `aria-hidden`. Its 1.1.5 check (`:42-52`) fails `svg[role=img]` without an ARIA name, even when the svg has `aria-hidden`.
  - uuv: `rules/1-image.js:8-18` uses `AccessibleNameQuery(img, shouldBeEmpty)`. `computeAccessibleName` returns "" for `alt=""`, for `aria-hidden` and for hidden nodes. `:66-87` fails every `svg:not(a svg, button svg)` with an empty name, and every `svg:not([role=img])`.
  - stan: `index.js:263` fails any `img` without an alt attribute, `aria-hidden` and `display:none` ones included.
- **Proposal:** none for the pack's failures. The bench could note in `TRIAGE.md` that a11ylint and uuv 1.1 failures on `alt=""`, `aria-hidden` or hidden elements are known false positives of those engines. These groups still show that the pack misses some *questions*: see "Lazy-loaded images" and "Named-ancestor exemption" below.

### Lazy-loaded images skipped (bench and core) — found while checking the groups above
- **What differs:** at the bench's 1280×900 viewport, without scrolling, images below the fold with `class="lazyload"` keep a 1×1 transparent GIF placeholder and `opacity:0`. Core treats them as invisible, so the pack asks nothing about them, while a11ylint, uuv and stan flag them.
- **Evidence:** on Caisse d'Epargne `/simulations-souscriptions/`, 15 visible 116×116 `<img alt="" class="lazyload …">` elements had computed `opacity: 0` and the pack did not report them. After a scroll to the bottom and back, `img-alt-decorative` went from 39 to 54 occurrences. Seven placeholders were still not loaded.
- **Proposal:**
  - Bench (`run.mjs` `scanPage`): before running engines, scroll down in steps of about 600 px with about 150 ms pauses, scroll back to the top, and wait 1 s. All engines then see the page a reader sees.
  - Optional core change: in `img-alt-decorative`, do not treat `opacity:0` as hidden for an `<img>` with lazy-load markers (`loading="lazy"`, `data-src`, `data-srcset`, `class~=lazyload`).

### Named-ancestor exemption too broad (core `img-alt-decorative`) — found while checking the groups above
- **What differs:** the pack never asks about a visible `alt=""` or `aria-hidden` image when any ancestor has an `aria-label`, `aria-labelledby`, `title` or `<label>` name. ACT e88epe means this exemption for named *controls*. The core rule applies it to landmarks, figures and generic containers too.
- **Evidence** (all 10 live pages checked):
  - Île-de-France event page: an `<img alt="">` photo of 445×259 inside `figure[role=figure][aria-label="Crédit photo : DR"]`.
  - Unistra home: a 395×593 photo inside `figure[aria-label="© Schroder/Unistra."]`.
  - LCL home: a 143×150 `alt=""` logo inside `nav[aria-label="Menu Footer"]`, not in a link.
  
  None of them got a question. A figure caption that is a photo credit does not stand in for the image's alternative, so 1.1.1 step 2 still has to be answered for these images.
- **Proposal:**
  - Where: core, `checks/manual/img-alt-decorative-manual.js`, `hasAncestorNamedFromAuthor` (line 251; called at line 318). This is a core rule, so the change belongs in core.
  - Logic: count only ancestors whose resolved role is `link`, `button`, `img`, or a widget role (menuitem, tab, option, checkbox, switch and so on). Do not count landmarks, `figure`, `group`, `region`, `dialog`, `generic` or `document`.
  - Outcome and test: cantTell, as today, for 1.1.1, 1.1.5 and 1.1.8 (step 2).
  - False-positive risk: more questions on decorative icons inside named navs, for example the Caisse chevrons in `nav[aria-label="Navigation principale"]`. To limit this, keep skipping images whose closest link or button has non-empty text content.

### ARNEO 1.1 verdict logic — arneo, PACK_FAILS / PACK_ASKS / OTHER_ASKS, 31 / 2 / 27 pages
Groups: `1.1 arneo PACK_FAILS img-alt-present`, `1.1 arneo PACK_ASKS img-alt-decorative`, `1.1 arneo OTHER_ASKS arneo-1.1`
- **What differs:** ARNEO says **NA** exactly on the pages where the pack fails an image without alt (31 pages), or asks about an `aria-hidden` image without alt (CNIL). On pages where every image has a label, it says NT and lists every image (27 pages, where the pack passes).
- **Verdict:** **PACK RIGHT** (3 groups).
  - On the PACK_FAILS pages, ARNEO's NA is a bug: the images without alt are visible and exposed, which fails 1.1.1 or 1.2.1. Examples: the Bordeaux footer `img.bx_metro.pictogram` icons, seen live at 10–18 px and failed by the pack; BAD `nav_home.gif`.
  - The pack's pass on the 27 OTHER_ASKS pages is sound. Every exposed image has an alternative, and the remaining question is relevance, which belongs to 1.3 and which the pack asks there.
- **How they do it:** `Criterion1_1.ts:50` starts from `status='NA'`. `:126-127` has `// status = 'NC';` commented out, so any image without a label leaves the status at NA. `:128-130` sets NT only when every image has a label. `:152` highlights *all* images (`elementList = $allImageList`).
- **Proposal:** none for the pack. ARNEO's question is not targeted (every image on the page) and is not worth adopting; the pack's `img-alt-decorative` and `img-alt-quality` already ask per element. The bench could map ARNEO 1.1 NA to "none" when the page has any `<img>`, to stop counting the bug as a verdict (`engines.mjs` `runArneo`).

### Pack's decorative questions vs stan's heuristics — stan, a11ylint, OTHER_ASKS / PACK_ASKS, 24 / 10 / 7 pages
Groups: `1.1 stan OTHER_ASKS stan-1.1`, `1.1 stan PACK_ASKS img-alt-decorative`, `1.1 a11ylint PACK_ASKS img-alt-decorative`
- **What differs:**
  - On 24 pages, the pack passes 1.1 and stan asks. stan asks about `alt=""` on images it guesses are informative (24 px or larger, inside a link or button, or a class such as hero or banner), about generic alts ("Logo", "img", "logo") and about alts close to the file name.
  - Where the pack asks and stan passes or a11ylint is silent, the pack is asking about `aria-hidden` svg icons and `alt=""` images that stan does not look at (stan never inspects svg).
- **Verdict:**
  - stan OTHER_ASKS: **BOTH PARTLY**. stan's `alt=""` questions on these pages land on hidden images (for example CNIL `push_cnil.jpg` in the closed header menu; 16 of 16 hidden images on the live CNIL contact page) or on images inside links with text (Insee bluesky). The pack is right to stay silent there. stan's generic-alt and file-name heuristics are useful, though. They target real 1.3.1 risks: `alt="Logo"` on the Bordeaux header logo, `alt="img"` on Île-de-France, `alt="Practical Information Map"` equal to `practical-information-map.jpg`. The pack asks about every non-empty alt without ranking them.
  - stan PACK_ASKS and a11ylint PACK_ASKS: **PACK RIGHT**. 1.1.1, 1.1.5 and 1.1.8 step 2 apply to every visible image left out of the accessibility tree. The questions are noisy: on Caisse 16, for example, every `icon_chevron_right` is asked separately.
- **How they do it:** stan `index.js:221-235` (`looksInformativeImage`), `:245-251` (generic list: image, photo, img, logo, icon, icône, visuel…), `:274`, `:286` and `:297`.
- **Proposal:**
  - Pack, `img-alt-quality` (or a small pack rule `rgaa-img-alt-suspicious`, cantTell, test 1.3.1): flag an alt that is one of the generic words, or that equals the image file name once normalized, with a specific message. This is a prioritization signal, not a failure. False-positive risk: `alt="Logo"` beside visible brand text is sometimes acceptable, which is why it stays cantTell.
  - Core, `img-alt-decorative`: merge identical questions (same `src`, or same svg `<use href>` or path data) within a page into one occurrence with a count, to cut the chevron noise.

### SVG and canvas failures — arneo, stan, a11ylint, uuv, PACK_FAILS / PACK_MORE_ELEMENTS, 1–3 pages
Groups: `1.1 arneo PACK_FAILS rgaa-svg-role-img`, `1.1 stan PACK_FAILS rgaa-svg-role-img`, `1.1 arneo PACK_FAILS rgaa-canvas-role-img`, `1.1 stan PACK_FAILS rgaa-canvas-role-img`, `1.1 a11ylint PACK_MORE_ELEMENTS rgaa-svg-role-img`, `1.1 a11ylint PACK_MORE_ELEMENTS rgaa-canvas-role-img`, `1.1 stan PACK_MORE_ELEMENTS rgaa-svg-role-img`, `1.1 uuv PACK_MORE_ELEMENTS rgaa-canvas-role-img`
- **What differs:** the pack fails three kinds of element:
  - (a) on Nantes Université pages 5 and 15, the carousel buttons' `<svg>` with `<title>Précédent</title>` or `<title>Suivant</title>` and no `role="img"`;
  - (b) on Insee 12, the Highcharts root `<svg aria-label="Interactive chart">` without `role="img"`;
  - (c) on Bouygues 16, the coverage-map `<canvas>` with no name, no fallback content and no adjacent link.
  
  ARNEO, stan and a11ylint do not check these cases, and uuv's canvas rules are commented out (`1-image.js:126-136`).
- **Verdict:** **PACK RIGHT** (8 groups).
  - Test 1.1.5 requires `role="img"` on an informative svg. Step 4 of its methodology says the test is failed without the role.
  - The Nantes svgs are the only content of their buttons, and live the buttons have no other name ("Précédent"/"Suivant" comes from the svg), so the images are informative.
  - The Bouygues canvas, 888×735 live, is the coverage map: informative, and with none of the 1.1.8 options.
  - Caveat on (b): `role="img"` on an interactive Highcharts svg would hide its keyboard-navigable points. The failure is correct under the letter of the test, but the fix an auditor would advise is a data table (Insee has a "tableau" tab) plus an alternative, not necessarily the role.
- **Evidence:** live checks on Nantes 5, Insee 12 and Bouygues 16 reproduced every failure.
- **Proposal:** optional, low priority. In `rgaa-svg-role-img`, when the svg has focusable descendants or descendants with ARIA roles (an interactive chart), keep the failure but add a hint pointing to 1.1.5 plus a data table, rather than only "add role=img".

### Element-matching artifacts — a11ylint, stan, uuv, OTHER_MORE_ELEMENTS / PACK_MORE_ELEMENTS, 34 / 14 / 30 / 4 / 4 / 4 pages
Groups: `1.1 a11ylint OTHER_MORE_ELEMENTS RGAA - 1.1.1`, `1.1 stan OTHER_MORE_ELEMENTS stan-1.1`, `1.1 uuv OTHER_MORE_ELEMENTS 1.1.1 + 1.1.5`, `1.1 uuv OTHER_MORE_ELEMENTS 1.1.1`, `1.1 a11ylint PACK_MORE_ELEMENTS img-alt-present`, `1.1 stan PACK_MORE_ELEMENTS img-alt-present`
- **What differs:** both sides fail the criterion, and one side seems to fail elements the other does not.
- **Verdict:** **NOT A REAL DIFFERENCE** (6 groups).
  - a11ylint, stan and uuv return HTML without a selector, and `run.mjs:89` matches each finding to the first element whose `outerHTML` starts with the same 120 characters. Repeated markup therefore collapses onto one path. On BAD before/home, a11ylint's 8 findings on `marker2_w.gif` map to 2 paths (7 on one of them), while the pack has 8 distinct paths. That is the whole PACK_MORE_ELEMENTS `img-alt-present` difference.
  - Over the whole theme, 33% of a11ylint, 26% of stan and 27% of uuv 1.1 findings share a path with another finding of the same engine.
  - The remaining "other extra" elements are the hidden, `alt=""` or `aria-hidden` false positives described above. Examples: Bordeaux hidden `img.pictogram`, Insee print logo, BAD `morearrow.gif alt=""`.
- **Proposal:** bench, `run.mjs` `placeInCases`. Match on the full stored HTML (up to 300 characters), and take matching elements in document order, never giving the same element to two findings. Better, for a11ylint: compute the path in the page from the element itself, in the `__a11ylintRun` wrapper (`vendor.mjs`), since `Core.run` receives the element list.

## Criterion 1.2

### Image without alt failed under both 1.1 and 1.2 — uuv, a11ylint, arneo, stan, PACK_FAILS, 31 pages / 3 sites + BAD
Groups: `1.2 uuv PACK_FAILS img-alt-present`, `1.2 a11ylint PACK_FAILS img-alt-present`, `1.2 arneo PACK_FAILS img-alt-present`, `1.2 stan PACK_FAILS img-alt-present`
- **What differs:** `img-alt-present` maps to tests 1.1.1 and 1.2.1 (`rule-map.js:419-420`). Every image without alt fails both criteria. uuv passes 1.2, because its 1.2.1 check only looks at `alt=""`, `aria-hidden` and `role=presentation` images that carry a name (`1-image.js:137-149`). The other engines do not report 1.2.
- **Verdict:** **BOTH PARTLY** (4 groups). An image without alt fails exactly one criterion: 1.1.1 if it is informative, 1.2.1 if it is decorative. The pack is right that the page fails one of them, but a definite failure on both is wrong for one of the two.

  | Site (pages) | Images without alt | Right failure |
  |---|---|---|
  | Bordeaux (13) | only the 5 footer social icons, each the sole content of an `<a title="Facebook">`-style link (checked live, 10–18 px) | 1.1.1 only; the 1.2 failure is a pack false positive on all 13 pages |
  | BAD before (4) | spacers (`marker2_w.gif` 78×1, `border_*.gif`) | 1.2.1 |
  | BAD before (4) | navigation images (`nav_home.gif`…) | 1.1.1 |
  | LCL (14) | an unidentified 70×65 `data:image/png` (live, not in a link) | undecidable without a human |

  On BAD before, both criteria really fail.
- **Proposal:**
  - Where: pack. Map `img-alt-present` to 1.1.1 only, and add a pack rule `rgaa-img-no-alt-role` that routes each image without alt:
    - The image is the sole content of a link or button that has no other text and no name of its own → nothing extra (the 1.1.1 failure stands).
    - The rendered width or height is 2 px or less, or the file is a 1×1 spacer → **fail** 1.2.1 (certainly decorative), and do not fail 1.1.1. That means `img-alt-present` itself must skip these spacers, or the routing must live in one pack rule replacing `img-alt-present` for RGAA.
    - Otherwise → **cantTell** for 1.2.1 ("if this image is decorative it fails 1.2.1; if informative, 1.1.1").
  - False-positive risk: a tiny but informative image (a 2 px bar in a chart) would fail 1.2. That is rare.
  - Trade-off: on mixed pages, 1.2 becomes cantTell instead of fail, which is the honest answer.

## Criterion 1.3

### Pack asks about alt relevance, others do not cover 1.3 — a11ylint, arneo, stan, PACK_ASKS, 85/51/8/3/2/2/1 pages
Groups (7 rule combinations × 3 engines): `1.3 {a11ylint,arneo,stan} PACK_ASKS img-alt-quality`, `… img-alt-quality + rgaa-image-alt-long`, `… image-redundant-alt + img-alt-quality`, `… img-alt-quality + svg-text-alternative-quality`, `… img-alt-quality + rgaa-image-alt-long + svg-text-alternative-quality`, `… canvas-text-alternative-quality + img-alt-quality + rgaa-image-alt-long`, `… canvas-text-alternative-quality + image-redundant-alt + img-alt-quality` (21 groups)
- **What differs:** the pack asks the 1.3.1, 1.3.6, 1.3.7 and 1.3.9 questions. a11ylint has no 1.3 rule. ARNEO ships only `Criterion1_1.ts` and `Criterion1_9.ts` for theme 1. stan reports only 1.1 for theme 1.
- **Verdict:** **NOT A REAL DIFFERENCE** (21 groups). These engines have no coverage of 1.3. The pack's questions are the right RGAA questions (relevance is always human, test 1.3.x step 2). `rgaa-image-alt-long` (more than 80 characters, 1.3.9) and `image-redundant-alt` are targeted.
- **Proposal:** none. The bench could leave out of the disagreement list any engine that has no rule for a criterion (`diff.mjs`), so coverage gaps are not shown as disagreements.

### uuv asks relevance of empty alts — uuv, OTHER_ASKS, 7 pages / 1 site
Groups: `1.3 uuv OTHER_ASKS 1.3.1 + 1.3.9`
- **What differs:** on impots.gouv.fr pages the pack says 1.3 is inapplicable. uuv asks about `<img alt="">` and `<img alt="" aria-hidden="true">` (for example `header_contacts.png`, `ideotag.svg`).
- **Verdict:** **PACK RIGHT**. Test 1.3.1 covers informative images *that have* an alternative. An empty alt is the decorative marker, and the question it raises (is the image really decorative?) is 1.1.1 step 2, which the pack asks via `img-alt-decorative`.
- **How they do it:** uuv `1-image.js:208-217` and `:288-306` select `img[alt]`, which matches `alt=""`.
- **Proposal:** none.

## Criteria 1.4, 1.5, 1.6

### uuv's per-image questions on every page — uuv, OTHER_ASKS, 148 / 11 / 165 / 141 / 11 pages, 12 sites
Groups: `1.4 uuv OTHER_ASKS 1.4.1`, `1.4 uuv OTHER_ASKS 1.4.1 + 1.4.6`, `1.5 uuv OTHER_ASKS 1.5.1`, `1.6 uuv OTHER_ASKS 1.6.10 + 1.6.9`, `1.6 uuv OTHER_ASKS 1.6.10 + 1.6.6 + 1.6.9`
- **What differs:** the pack has no rule mapped to any test of 1.4, 1.5 or 1.6. uuv asks on every image:
  - 1.4.1 on every `img[alt|title|aria-label|aria-labelledby]` (3,794 elements);
  - 1.5.1 on every `img`, `svg`, `canvas`, `object`, `embed` and `[role=img]` (about 10,700 elements);
  - 1.6.9 and 1.6.10 on every image with an alt (1,133 each);
  - 1.4.6 and 1.6.6 on svgs with a name.
- **Verdict:** **BOTH PARTLY** (5 groups).
  - uuv's questions are not targeted. Its 1.5.1 asks "is there an alternative to this CAPTCHA?" about every chevron icon, and its 1.6.9/1.6.10 queries do not even require `aria-describedby` (`1-image.js:568-605`: `ByRoleQuery("img", ["alt","aria-describedby"])` matches every image with an alt).
  - The pack's silence leaves real cases unchecked, though. The CNIL contact form (`/fr/webform/nous-contacter`) has `<img data-drupal-selector="edit-captcha-image" alt="Image CAPTCHA">`, checked live. Criteria 1.4 and 1.5 apply there, while the pack only asks a 1.3 relevance question, and 1.3 is not applicable to a CAPTCHA (its particular case).
  - Charts such as Insee's Highcharts svgs and figure images, or Bouygues' `canvas[aria-label="Pourcentage journalier…"]`, are the images that may need a detailed description (1.6).
- **Proposal:**
  1. New pack manual rule `rgaa-captcha-review`.
     - Detection: an `img`, `svg`, `canvas` or `input[type=image]` whose src, alt, id, class or name contains `captcha`; a reCAPTCHA, hCaptcha, Friendly Captcha or Turnstile iframe or widget (`.g-recaptcha`, `iframe[src*="recaptcha"]`, `.h-captcha`, `.frc-captcha`, `.cf-turnstile`); a Drupal `[data-drupal-selector*=captcha]`.
     - Outcome: cantTell, test 1.4.1 (the alternative states the nature and function of the image) and test 1.5.1 (another non-graphic CAPTCHA, or another way to reach the feature).
     - Also: `img-alt-quality` should skip images this rule matches, since 1.3 is not applicable to a CAPTCHA.
     - False positives: images whose names contain "captcha" without being one (rare). Value is high on form pages.
  2. New pack manual rule `rgaa-image-detailed-description-review`.
     - Detection: complex images, meaning a `.highcharts-root` or `.apexcharts`/`.recharts` svg, a canvas with role img or an ARIA name, or an `<img>` whose alt, title or figcaption mentions graphique, schéma, carte, infographie, courbe, diagramme or tableau.
     - Outcome: cantTell, test 1.6.1 (img), 1.6.5 (svg), 1.6.8 (canvas) or 1.6.10 (role img): does the image need a detailed description, and is there one?
     - Also, automatically: when `aria-describedby` is present on an image, check that it resolves to text (test 1.6.9, fail when it does not resolve).
     - False positives: decorative maps or photos whose alt says "carte". It is a question, so the risk is noise only.

## Criterion 1.9

### Figure linked by aria-labelledby instead of aria-label — a11ylint, stan, uuv (none); arneo (MORE_ELEMENTS), 1 page / Insee
Groups: `1.9 a11ylint PACK_FAILS rgaa-figure-caption-structure`, `1.9 stan PACK_FAILS rgaa-figure-caption-structure`, `1.9 uuv PACK_FAILS rgaa-figure-caption-structure`, `1.9 arneo PACK_MORE_ELEMENTS rgaa-figure-caption-structure`, `1.9 arneo OTHER_MORE_ELEMENTS arneo-1.9`
- **What differs:** on Insee 12, the pack fails 3 `<figure role="group" aria-labelledby="figcaption-…">` elements. a11ylint, stan and uuv have no 1.9 rule. ARNEO fails the same figures, but per image: the `<img>` and 143 Highcharts `path[role=img]` points, against the pack's one occurrence per figure.
- **Verdict:**
  - The 3 groups where the other side is "none": **NOT A REAL DIFFERENCE** (no coverage). The pack's failure is correct: test 1.9.1, condition 3, requires an `aria-label` identical to the caption, and the technical note says figcaption "impose au minimum l'utilisation d'un attribut WAI-ARIA aria-label". `aria-labelledby` gives the same name but is not what the test asks for.
  - The 2 ARNEO groups: **NOT A REAL DIFFERENCE**. ARNEO reports one finding per image and the pack one per figure, so the element counts differ although both fail the same figures.
- **Evidence:** live Insee `8310621#onglet-2`: `role="group"`, no `aria-label`, `aria-labelledby` pointing to the direct-child figcaption.
- **Proposal:** none. The bench diff could compare ARNEO 1.9 findings against the pack at figure level, using the closest `<figure>` of the finding (`diff.mjs`).

### ARNEO fails figures that have no caption — arneo, OTHER_FAILS, 24 pages / 6 sites
Groups: `1.9 arneo OTHER_FAILS arneo-1.9`
- **What differs:** the pack says 1.9 is inapplicable (20 pages) or passes it (4 pages). ARNEO fails it.
- **Verdict:** **PACK RIGHT**, with one undecidable sub-case. Test 1.9.1 applies only to an image *with a caption*. Live, ARNEO's failures fall into these cases:
  - Département du Nord `/insertion-retour-a-lemploi`: `<figure>` with an **empty** `<figcaption></figcaption>` or `<figcaption><br></figcaption>`, 7 figures. There is no caption, so 1.9 is not applicable.
  - Unistra home: `unistra-card` figures that contain only the image and a "Lire la suite de l'article" link. A link is not a caption.
  - Île-de-France expo page: `figure[role=figure][aria-label="Crédit photo : DR"]` with figcaption "Crédit photo :\n DR". The texts are identical once whitespace is collapsed, which is what assistive technologies expose, so condition 3 is met; ARNEO compares raw `textContent`.
  - Hidden content: the Île-de-France 12/13 mega-menu figure (0×0) and the Insee `#onglet-1` panel graphics.
  - **UNDECIDABLE:** Bordeaux Métropole (14 pages) has `<figure><img …><div class="legend-credit-media"><h3>file name</h3><p>© Bordeaux Métropole</p><p>description</p></div></figure>`. The block is visible (one 18 px line live) and not in a figcaption. If a human judges that credit and description line to be a *légende*, 1.9.1 fails (conditions 2–4). If it is only a photo credit, 1.9 is not applicable. A human must decide whether the visible text identifies or describes the image.
  - Not verified live: Insee 8–10, `svg[role=img]` inside a figure.
- **How they do it:** `Criterion1_9.ts:163-173` returns "invalid" for a figure without figcaption whose `textContent` is not empty (any text: links, credits, file names). `:177-189` fails any figure that has a figcaption, even an empty one, unless it has the role and an `aria-label` strictly equal (`!==`) to the raw `textContent`.
- **Proposal:**
  - Pack, small new rule `rgaa-figure-caption-outside-figcaption`.
    - Logic: a visible `<figure>` that holds an image and has visible text outside any `figcaption`, excluding link and button text.
    - Outcome: cantTell, test 1.9.1 ("is this text the image's caption? If so, it must be in a figcaption, with role and aria-label").
    - False positives: credits and decorative text, which is why the outcome is cantTell.
  - Keep `rgaa-figure-caption-structure` as it is: it already collapses whitespace and ignores empty figcaptions.

## Improvements
| # | Criterion | From | Change | Where | Outcome | Effort | Value |
|---|---|---|---|---|---|---|---|
| 1 | all | bench | Match findings to elements on the full stored HTML and take each matching element only once; compute a11ylint paths in the page | bench `run.mjs` `placeInCases`, `vendor.mjs` | removes about 30% of the paths a11ylint, stan and uuv share, and the spurious MORE_ELEMENTS groups | S | High |
| 2 | 1.1 and all | live check | Scroll the page in steps and back before running engines, so lazy images load | bench `run.mjs` `scanPage` | +15 pack questions on Caisse alone; fairer for every engine | S | High |
| 3 | 1.2 | triage | Stop mapping `img-alt-present` to 1.2.1; route images without alt: sole link/button content → 1.1.1 only; 2 px or smaller / spacer → fail 1.2.1; otherwise cantTell 1.2.1 | pack `rule-map.js` + new `rgaa-img-no-alt-role` | removes the false 1.2 failures (13/31 pages) | M | High |
| 4 | 1.1 | triage | Restrict the named-ancestor exemption to link, button, img and widget roles; still skip images in a link or button that has text | core `img-alt-decorative-manual.js:251-278` | cantTell on informative photos now missed in `figure[aria-label]` and `nav[aria-label]` | S | Medium |
| 5 | 1.4, 1.5 | uuv (idea), triage | New `rgaa-captcha-review` targeting CAPTCHA markers; `img-alt-quality` skips them | pack, new manual rule | cantTell 1.4.1 and 1.5.1 (CNIL contact form) | S | High |
| 6 | 1.6 | uuv (idea) | New `rgaa-image-detailed-description-review` for charts, maps and infographics; automatic check that `aria-describedby` on an image resolves (1.6.9) | pack, new manual and automatic rule | cantTell 1.6.1/1.6.5/1.6.8/1.6.10; fail 1.6.9 | M | Medium |
| 7 | 1.3 | stan | Flag generic alts (logo, image, img, icône, visuel…) and alts equal to the file name with a specific message | pack `img-alt-quality` or new `rgaa-img-alt-suspicious` | cantTell 1.3.1, prioritized | S | Medium |
| 8 | 1.1 | triage | Merge identical decorative-image questions (same src or same svg) into one occurrence with a count | core `img-alt-decorative` | less noise, same outcome | S | Medium |
| 9 | 1.9 | arneo (idea) | Ask when a figure holding an image has visible non-link text outside figcaption | pack, new `rgaa-figure-caption-outside-figcaption` | cantTell 1.9.1 (Bordeaux case) | S | Low |
| 10 | 1.1 | triage | Hint in `rgaa-svg-role-img` for interactive svg charts (focusable descendants): recommend a data table plus an alternative | pack `rgaa-svg-role-img` message | fail, unchanged | S | Low |
| 11 | 1.1, 1.3 | bench | Map ARNEO 1.1 NA to "none" when the page has images (its NC is commented out); leave engines with no rule for a criterion out of the disagreement list | bench `engines.mjs` `runArneo`, `diff.mjs` | cleaner verdict counts | S | Medium |
