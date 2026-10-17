# Triage

This file covers every place where the pack and another engine say different things about a criterion on a page. `npm run disagreements` lists them in `results/disagreements.json`, as 587 groups:

| Kind | Groups |
|---|---:|
| The pack fails and the other doesn't | 200 |
| The other fails and the pack doesn't | 70 |
| The pack asks and the other doesn't | 197 |
| The other asks and the pack doesn't | 57 |
| Both fail, on different elements | 63 |

Each group is one criterion, one engine, one kind of difference and the rules behind it. Each group was checked against:
- RGAA 4.1.2's tests;
- the stored findings;
- a live load of the page, where needed (about 85 loads, one at a time);
- the other engine's source code, at the commit or version the bench pins.

The detailed findings, by theme, are in [triage/](./triage/). Each heading in those files lists the groups it covers:

- [Images (1)](./triage/theme1-images.md)
- [Frames, colours, multimedia, tables (2–5)](./triage/theme2-5-frames-colours-media-tables.md)
- [Links, scripts (6–7)](./triage/theme6-7-links-scripts.md)
- [Mandatory elements (8)](./triage/theme8-mandatory-elements.md)
- [Structure, consultation (9, 13)](./triage/theme9-13-structure-consultation.md)
- [Presentation (10)](./triage/theme10-presentation.md)
- [Forms, navigation (11–12)](./triage/theme11-12-forms-navigation.md)

## In short

- **Most of the other engines' extra failures are their own false positives.** They come from a few causes:
  - **Hidden elements:** they check them anyway. This covers frames, links, images and headings, and the cookie banners and menus that hold them.
  - **RGAA misread:**
    - `alt=""` counted as a missing alternative;
    - a return from h4 to h2 counted as a skipped level;
    - a fixed list of 47 valid roles;
    - a 4.5:1 contrast threshold for every text size;
    - a transparent background treated as black;
    - SVG `<rect width>` counted as a presentation attribute.
  - **Checks that can't work as written:**
    - `@uuv/a11y`'s form query always returns nothing, so it passes 11.1 on every page.
    - ARNEO's 1.1 never fails, because its failing line is commented out.
    - `@a11ylint/core`'s 8.1.3 check is inverted.
- **Where the others ask and the pack is silent,** they usually ask on every page or every element. What's worth taking from them is the idea, as a targeted question. Their questions themselves aren't worth copying.
- **The pack's failures mostly hold.** 8.2 was checked pattern by pattern: none of its about 60 kinds of error is a false positive. 7.1, 9.1 (empty headings), 10.1, 10.8 and 11.1 also held up on samples across sites.
- **The pack still has false positives,** on 1.2, 3.2, 6.1, 9.3, 10.7, 10.12, 11.6 and 12.7. Each one has a single cause with a known fix (below).
- **The pack misses some real failures:**
  - **Found by another engine:** 9.1 heading jumps, 7.3 keyboard access, 9.2 missing `<main>`, 5.7 headers without `scope`.
  - **Found by the audits:** 2.1 with an empty `title`, 11.9 unnamed buttons outside forms.

What was already known:

- **8.1, `@a11ylint/core` fails every page.** Its test 8.1.3 reports "doctype should be first" exactly when the doctype *is* first (`RGAA8.RGAA81`).
- **2.1, the other four engines fail frames that are hidden from assistive technology** (`display:none`, `visibility:hidden` or `aria-hidden`). The pack is right to leave them out. Caisse d'Epargne's audited 2.1 failure is a visible `<iframe title="">` on a page the bench marked blocked. The pack reports that frame under 2.2 instead of 2.1 (see P3 below).

## What to change, ranked

**Where** says where each change belongs: the pack, core, or the bench. Each theme file explains the evidence and how the other engine does it, with file and line.

### The bench, first: these fixes change the numbers above

| # | Change | Why |
|---|---|---|
| B1 | Detect a block page on every engine's load, not just the first, and retry or mark that engine errored | On Insee and Caisse d'Epargne, later engines got an empty document. This caused 11 false groups on 8.1, 8.3 and 8.5. |
| B2 | Place findings using their full stored HTML and the order of occurrence, each element at most once | Matching on the first 120 characters merges repeated markup. About a third of the elements counted as failed by one side only are this. |
| B3 | Scroll each page down and back, and wait longer, before an engine runs | Lazy images stay invisible until scrolled to (Caisse d'Epargne: 39 to 54 questions), and some menus aren't ready after 800 ms. |
| B4 | Fix how other engines' results are read | Their verdicts are counted under the wrong criteria or with the wrong outcome; the itemized list follows the table. |
| B5 | Rescan the pages marked blocked | Caisse d'Epargne's newsletter page loads now, and it holds the audit's 2.1 failure. |
| B6 | Optionally, run the W3C HTML validator once per page and pass its report to the pack | This decides the 20 pages where the pack asks about 8.2. |

What B4 fixes in each engine's results:

- **`@uuv/a11y`:**
  - Drop its 11.1, which is a stub.
  - Leave out elements that aren't rendered on 6.1 and 6.2.
- **RGAA Audit:**
  - A `meta charset` isn't an 8.2 pass.
  - A "good signal" that still recommends a manual check gives no verdict.
  - Count its 12.1 under 12.7.
  - Count its link-name results under 6.2.
- **ARNEO:**
  - Take the highlighted elements, not every element on the page, when it fails.
  - Pick up the elements it highlights for criteria it leaves to the auditor (2.1, 3.2, 13.3).
  - Count its 1.1 "inapplicable" as no verdict.
- **`@a11ylint/core`:** give it visible, rendered text only.

### Pack false positives

| # | Criterion | Change | Where | Pages affected |
|---|---|---|---|---|
| P1 | 11.6 | `aria-role-name-present` fails 11.6.1 for every role it checks, such as a tree or a progress bar. Take 11.6.1 off it, and add a `radiogroup` naming rule. | pack `rule-map.js`, new rule | 17 of 19 |
| P2 | 12.7 | A skip link whose target is inside `<main>`, after a breadcrumb, is dropped and the page fails as having no skip link. Accept it, or ask. | pack `rgaa-skip-link-present.js` | 14 (all of Strasbourg's) |
| P3 | 2.1 / 2.2 | An empty `title` on a frame is no title: fail it under 2.1.1, not 2.2.1. That's what the audit and all four engines do. | pack `rgaa-frame-title-*.js`, `rule-map.js` | Caisse d'Epargne |
| P4 | 1.2 | `img-alt-present` fails 1.1 and 1.2 together. An image with no `alt` that is a link's only content carries information, so fail 1.1 only. Otherwise fail 1.2 for a spacer image, and ask for the rest. | pack `rule-map.js`, new rule | 13 of 31 |
| P5 | 10.7 | Focus indicator contrast. Make three fixes. | pack `rgaa-focus-indicator-contrast.js` | 28 to about 3 |
| P6 | 6.1 (and 11.2.5, 11.9.2, 7.1.3) | The rules comparing visible labels with accessible names count screen-reader-only text as visible. | pack `*-label-in-name-sources.js` | 10 of 188 failures |
| P7 | 9.3 | `<li role="presentation">` (Drupal page navigation) and `<li role="group">` (carousels): ask, don't fail. | core `list-children-valid` + pack map | 17 |
| P8 | 10.1 | Skip custom elements (`<calcite-button width>`). Decide on, and document, `width`/`height` on `<source>` in `<picture>`, which ARNEO exempts. | pack `rgaa-presentational-attributes-absent.js` | 5 fail only on `<source>` |
| P9 | 11.1, 11.2.5 | Small ones. | pack `rgaa-field-label-*.js` | few |

The three fixes in P5:

- Skip an element when something is painted on top of it, such as a cookie banner. This removes 28 false failures on LCL.
- Read `::before` and `::after` fills. This removes 39 on Bordeaux.
- Ask rather than fail when the surroundings are off screen. This affects 10 on Insee.

The small fixes in P9:

- an `<output>` used as a live region;
- a clearer message for duplicate ids;
- a visible label that is the start of the name ("Recherche" for "Rechercher"): ask.

### Core false positives, and questions it could answer itself

| # | Criterion | Change | Where | Effect |
|---|---|---|---|---|
| C1 | 3.2 | A `::before` with `z-index:-1` paints over its parent's background inside the parent's stacking context, and the contrast walk misses it. The fix: a colour is measured, and an image means asking. | core `contrast-helpers.js` | Removes a false failure on all 13 Bordeaux pages (white text on its real `#2b2a2a`, not on `#ffcc00`). |
| C2 | 10.12 | Don't treat `<body>` as clipping the text when its overflow goes to the viewport, as it does when a cookie banner locks scrolling. | core `text-spacing-content-loss.js` | Removes false failures on 14 of 27 pages. |
| C3 | 3.2 | Measure contrast where it now gives up. | core `contrast-helpers.js` | 32 of these were measured from screen pixels, and all passed. |
| C4 | 6.1 | `link-name-quality` names a link by its `title` before its content. RGAA's glossary puts the content first. | core `link-name-quality-manual.js` | 11 of 79 questions use the wrong name. |
| C5 | 9.1 | `p-as-heading` should skip paragraphs that hold only digits or a number, are visually hidden, or hold only a link. | core `p-as-heading-manual.js` | About 38% fewer questions. |
| C6 | 13.9 | `css-orientation-lock` asks whenever it can't read a stylesheet from another domain. Fetch the sheet, or report a limit of the scan rather than a question. | core `css-orientation-lock.js` | 33 pages. |
| C7 | 1.1 | `img-alt-decorative`: merge identical questions (same image), and narrow its exemption for images inside an element named by the author to links, buttons and widgets. Right now it skips `alt=""` photos inside a named `<figure>` or `<nav>`. | core `img-alt-decorative-manual.js` | Fewer duplicates; real photos asked about. |

The cases C3 covers:

- `background-image: none, none` is taken for an image (`contrast-helpers.js:1742`).
- A gradient of one solid colour.
- `filter: drop-shadow` on an ancestor.
- Solid boxes placed over the text, and `::before` backgrounds.
- The strokes of SVG chart frames.

### Failures the pack misses

| # | Criterion | From | Change | Where | Outcome |
|---|---|---|---|---|---|
| M1 | 9.1 | ARNEO, `@a11ylint/core` | `heading-order` compares each heading with the deepest level reached so far. Compare it with the previous exposed heading. Missed live: h2 to h4 on iledefrance.fr and caisse-epargne.fr. | core `heading-order-manual.js` | cantTell |
| M2 | 7.3 | RGAA Audit | An `onclick` on an element that isn't natively interactive: fail when it can't be focused, and ask when it can be focused but has no key handler. Seen on Caisse d'Epargne's "Gérer mes cookies", which opens on click but not with Enter or Space. | core `mouse-only-event-handlers`, or a pack rule | fail / cantTell |
| M3 | 9.2 | ARNEO | An HTML5 page with real content and no `main` or `role=main` fails 9.2.1, where the pack only asks now. Seen on Bouygues. | pack `rgaa-main-element-structure.js` | fail |
| M4 | 11.9 | ARNEO, RGAA Audit, audits | Ask about visible unnamed buttons outside forms, such as Bouygues' image buttons with `alt=""`. Ask about the relevance of icon-only buttons in forms instead of passing them. | pack `rgaa-form-button-name-present.js` | cantTell |
| M5 | 11.2 | `@a11ylint/core`, RGAA Audit | When a field's only label is an empty `<label for>` or an empty `title`, also fail 11.2.1 or 11.2.2. | pack `rgaa-field-label-listed-source.js` | fail |
| M6 | 5.7 | `@uuv/a11y` | In a table with headers on both axes, a `th` with no `id`, `scope` or role fails 5.7.1. Seen on LCL `/cartes-bancaires`. | pack, new rule | fail |
| M7 | 6.2 | own | A link whose only content is one icon-font glyph from `::before` or `::after`: fail instead of ask, after checking the character code. | pack `rgaa-link-content-label-present.js` | fail |

### New questions, from what the others ask

These are targeted versions of questions the others ask everywhere. The first ones match criteria the human audits fail often.

| # | Criterion | Question | Outcome | Value |
|---|---|---|---|---|
| Q1 | 11.13 | A personal-data field (by its type or by a label such as nom, courriel, téléphone or adresse) with no `autocomplete`, search fields excluded | cantTell | High: fails in 5 of 11 audits |
| Q2 | 11.10.2 | A required field whose visible label, description or legend shows no `*`, "obligatoire" or "requis" | cantTell | High: fails in 5 of 11 audits |
| Q3 | 4.1–4.7 | Visible embedded players (YouTube, Vimeo, Dailymotion, PeerTube, SoundCloud): no engine handles them, and the pack only looks at `<audio>` and `<video>` | cantTell | High |
| Q4 | 10.5 | An author text colour with no background colour anywhere in its ancestry fails 10.5.1. A background image with no background colour fails 10.5.3. Ask about 10.5.2. | fail / cantTell | High: LCL and Bordeaux fail it live |
| Q5 | 1.4, 1.5 | CAPTCHA markers (CNIL's contact form: `alt="Image CAPTCHA"`) | cantTell | High |
| Q6 | 8.7 | Own text of five words or more whose language, by stopwords, differs from the nearest `lang` | cantTell | Medium: found 3 English passages on a Strasbourg FAQ |
| Q7 | 8.8, 8.4 | A `lang` equal to the inherited one isn't a change of language. The page's main language, by stopwords, should match `<html lang>`. | cantTell | Medium |
| Q8 | 1.6 | Charts, maps and infographics: does the image need a detailed description? A broken `aria-describedby` fails 1.6.9. | cantTell / fail | Medium |
| Q9 | 1.3 | Generic alts (logo, image, icône, visuel) and alts equal to the file name, with their own message | cantTell | Medium |
| Q10 | 5.5, 5.3 | The relevance of each data table's title; the linearised reading of each layout table | cantTell | Medium / Low |
| Q11 | 2.2 | Ask whether a frame's title is relevant, quoting it, instead of passing | cantTell | Medium |
| Q12 | 9.4 | Each visible `<q>` or `<blockquote>`: is it a quotation? | cantTell | Medium |
| Q13 | 11.5 | Group three or more checkboxes that share a name, not only radios | cantTell | Medium |
| Q14 | 10.6 | Check the hover and focus states of links for a cue that isn't colour, so `link-in-text-block` stops asking about step 2. Treat breadcrumbs as navigation, not as a block of text. | pass / fail | Medium: about 250 questions |
| Q15 | 11.4, 11.11, 11.7, 11.3, 12.1 | Five targeted questions | cantTell | Low each |
| Q16 | 1.9, 3.1, 8.10 | Three narrower questions | cantTell | Low |

The questions in Q15:

- a label that isn't next to its field (11.4);
- a format constraint the error messages may not explain (11.11);
- the relevance of a legend, on field groups only (11.7);
- fields with the same function but different labels (11.3);
- fewer than two ways to navigate the site (12.1).

The questions in Q16:

- text in a figure outside its figcaption (1.9);
- charts that carry information by colour (3.1);
- a `dir` that contradicts the text's characters (8.10).

### Not to adopt

These are things the other engines do that the pack shouldn't copy:

- checking hidden elements;
- `alt=""` as a failure;
- going back up the heading levels as a failure;
- a missing h1 as a failure, which RGAA doesn't require;
- a fixed list of roles for 7.1;
- one contrast threshold for every text size;
- comparing names with raw whitespace;
- treating every `<a>` as a link, `href` or not;
- SVG attributes counted as presentation attributes;
- questions asked on every page or every element (`@uuv/a11y` 1.4/1.5/1.6/3.1/8.4/8.7, ARNEO 9.2/9.3/10.5/11.3/11.4/11.5/11.7);
- RGAA Audit's `type="text"` heuristics for 11.11.
