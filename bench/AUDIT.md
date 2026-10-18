# Audit of the pack against RGAA 4.1.2

Each rule linked to RGAA was checked against the test's text, its official methodology, the glossary, the technical notes and the particular cases, with repro pages run in Chromium on the pack at `49f2f00`.

What the pack aims for: no false positive, and as many of RGAA's failures found as can be, as a fail when RGAA's text makes the verdict certain and as a targeted question when it leaves it to a person.

**Kind:** FP false positive · WO wrong outcome (fails where RGAA leaves it to judgement, or asks where its text is certain) · WM wrong mapping · FN false pass · MISS missed detection.
**Status:** open · done (commit) · core (listed in [CORE_ISSUES.md](./CORE_ISSUES.md), not fixed here) · decide (needs the owner's call) · won't (with the reason).

## Theme 1, Images

| # | Test | Kind | Finding | Status |
|---|---|---|---|---|
| T1-01 | 1.1.5, 1.2.4 | FP | An `aria-hidden` sprite sheet whose `<symbol>`s have a `<title>` fails 1.1 and 1.2 on every page, though it draws nothing. | done (631a8d8) |
| T1-02 | 1.1.5, 1.2.4 | WM | `rgaa-svg-hidden-no-alternative` is linked to both tests, though an image fails one of them, not both. Now 1.2.4 only. | done (631a8d8) |
| T1-03 | 1.1.1 | WO | `rgaa-img-alt-present` fails every non-spacer `<img>` with no alt under 1.1.1, including images the glossary calls decorative (one before each list item). | done (decision B) |
| T1-04 | 1.1.5 | WO | An exposed SVG with a `<title>` and no `role="img"` fails 1.1.5 even beside text, where it may be decorative (then 1.2.4). | done (decision B) |
| T1-05 | 1.1.6–1.1.8 | FP/WO | A 0×0 `<canvas>` fails 1.1.8; a bare canvas, object or embed image fails 1.1 though it may be decorative. | done for 0×0; bare canvas, object, embed: decide |
| T1-06 | 1.1.1, 1.2.1 | WO | `alt=" "` is reported as no alt; a spacer with `alt=" "` fails 1.1.1 instead of 1.2.1. | done |
| T1-07 | 1.2.4 | MISS | An exposed decorative SVG without `aria-hidden` (including `role="presentation"`) is never checked against 1.2.4. | done (rgaa-svg-decorative-aria-hidden) |
| T1-08 | 1.9.2–1.9.5 | MISS | Captioned svg, canvas, object and embed images are not checked. | open |
| T1-09 | 1.1.1 | MISS | `alt=""` images in a named figure or nav are never asked about (C7). | core |
| T1-10 | 1.4, 1.5 | MISS | CAPTCHAs: no question (Q5). | open |
| T1-11 | 1.3.1, 1.3.6 | WM | Relevance asked about images that are a link's or button's only content, which the glossary sends to 6.1 and 11.9. | core |
| T1-12 | 1.6, 1.7 | MISS | No rule; a broken `aria-describedby` on an image should fail 1.6.9. | open |
| T1-13 | 1.8 | MISS | Images of text: no question. | open |
| T1-14 | 1.2.2, 1.2.3, 1.2.6 | MISS | `<area>` without href, decorative object and embed: no check. | open |
| T1-15 | 1.2.1 | FP | A spacer inside an `aria-hidden="true"` container fails 1.2.1. | done |
| T1-16 | 1.3.9 | WO | `rgaa-image-alt-long` asks about `aria-hidden` images; its hint cites 1.8 for 1.6. | done |
| T1-17 | 1.9.1 | FP | A `<figure>` with a hidden `<figcaption>` fails 1.9.1. | done |

## Themes 2–5, Frames, Colours, Multimedia, Tables

| # | Test | Kind | Finding | Status |
|---|---|---|---|---|
| T25-01 | 5.8.1 | FP | A layout table with only `<colgroup>` fails: colgroup is not in 5.8.1's list. | done |
| T25-02 | 3.2 | FP | Text over a `z-index:-1` `::before` painted with an image is measured on the wrong background (C1). | core |
| T25-03 | 4.3.2 | FP | A translation `kind="subtitles"` track fails when its `srclang` equals the page's language. | done |
| T25-04 | 3.3.1 | MISS/WM | No rule for 3.3; `rgaa-focus-indicator-contrast` measures 3:1 focus styles but is linked to 10.7.1 only; field borders are not measured. | open |
| T25-05 | 5.4.1 | MISS | A data table titled by an adjacent heading is not asked about. | open |
| T25-06 | 5.3.1 | WM | The headerless-table question is not linked to 5.3.1. | open |
| T25-07 | 5.7.2, 5.7.3 | WO | An invalid `scope`, or `rowgroup`/`colgroup`, only asks, though 5.7 fails either way. | done |
| T25-08 | 5.7.1 | MISS | A `th` with no scope, id or role in a table with headers on both axes (M6). | open |
| T25-09 | 5.7.2 | FN | 5.7 passes when `scope` points the wrong way. | done |
| T25-10 | 4.1 | FN | Media next to text that only mentions a transcript, or says there is none, passes. | open |
| T25-11 | 4.3.2 | MISS | `<track kind="caption">` (an invalid kind, never displayed) is not failed. | done |
| T25-12 | 3.2.x | WM | Every 3.2 failure names all four tests instead of the one its size and weight fall under. | core |
| T25-13 | 3.2 | WO | Fails though the page offers a contrast mechanism (each test's second condition). | core |
| T25-14 | 3.2 | FP | Logo and brand text fail, which the particular cases exempt. | core |
| T25-15 | 3.2 | WO | Weights 600–699 count as not bold. | core |
| T25-16 | 3.2.1 | WO | An author placeholder colour below the ratio is only asked about. | core |
| T25-17 | 4.x | MISS | Embedded players (YouTube, Vimeo…) and `autoplay=1` are invisible to theme 4 (Q3). | open |
| T25-18 | 5.1.1 | FN | A complex table whose `aria-describedby` resolves to nothing passes. | open |
| T25-19 | 5.6.1, 5.6.2 | MISS | Row or column headers marked up as bold `td` are not asked about. | open |
| T25-20 | 2.1.1, 2.2.1 | FN | `title="&nbsp;"` passes 2.1 and escapes 2.2. | done |
| T25-21 | 3.1 | MISS | No rule: information given by colour alone. | open |
| T25-22 | 3.2 | WO | `background-image:none,none` and one-colour gradients ask (C3). | core |

## Themes 6–7, Links, Scripts

| # | Test | Kind | Finding | Status |
|---|---|---|---|---|
| T67-01 | 6.2.1 | FP | Links whose content comes through a shadow-DOM `<slot>` fail as empty; the label-in-name rules miss them. | done for 6.2.1; label-in-name rules still miss slotted labels: open |
| T67-02 | 7.1.1, 7.1.3 | MISS | Buttons outside a form are not checked for a name or label-in-name. | open |
| T67-03 | 7.3.1 | MISS | `onclick` on a non-interactive element (M2). | open |
| T67-04 | 6.1.5, 7.1.3, 11.2.5, 11.9.2 | MISS | Visible text inside `aria-hidden="true"` is left out of the visible label. | open |
| T67-05 | 6.1.1–6.1.4 | WM | `identical-links-same-purpose` is unlinked, though glossary note 3 of « Intitulé de lien » is its question. | done |
| T67-06 | 6.1.2, 6.1.3, 6.1.5 | MISS | Note 2 (a `title` that drops the content's name) and images of text in links are not checked. | open |
| T67-07 | 6.1.1–6.1.4 | MISS | Gaps in the French generic-phrase list; no list used without `lang`. | open |
| T67-08 | 6.1 | WO | `link-name-quality` names a link by `title` before content (C4). | core |
| T67-09 | 7.3.2 | MISS | `onfocus="this.blur()"` is not detected. | open |
| T67-10 | 7.4.1 | MISS | Changes of context on `select`/fields are never asked about. | open |
| T67-11 | 7.2.1 | MISS | `<noscript>` alternatives are not asked about. | open |
| T67-12 | 7.5 | MISS | Status messages get no targeted question. | open |
| T67-13 | 7.1.1, 7.1.3 | MISS | Links used as buttons (`href="#"` with a click handler) are not listed. | open |
| T67-14 | 7.1.1 | FP | Unnamed dialog, tab and menuitem roles fail 7.1 on a page with no script. | won't (an ARIA widget only works through script, so a page with one and no script is a snapshot, not a page RGAA audits; gating core rules on script needs the engine) |
| T67-15 | 6.1.1–6.1.3 | WM | 6.1.5 failures also fail 6.1.1–6.1.3 by note 1; only the test reported changes. | won't (the criterion already fails) |

## Themes 8–9, Mandatory elements, Structure

| # | Test | Kind | Finding | Status |
|---|---|---|---|---|
| T89-01 | 9.2.1 | MISS/WO | Steps 1–3 and 6 are never checked, yet 9.2 passes; `role="banner|navigation|contentinfo"` without the element passes. | done for roles on other elements; unmarked zones and step 3 left to a person |
| T89-02 | 9.2.1 | WO | A page with no `<main>` only asks (M3). | done (b0e64c1) |
| T89-03 | 9.3.1, 9.3.2 | FP | An `<li role="presentation">` (pager) or `<li role="group">` (carousel) fails 9.3 (P7). | core |
| T89-04 | 9.3.1, 9.3.2 | FP | A plain `<li>` in `<ul role="tablist|menu">` fails 9.3; the technical note sets widgets apart from lists. | core |
| T89-05 | 9.1.1 | MISS | A skipped level is missed after an earlier, deeper heading (M1). | core |
| T89-06 | 8.9.1 | MISS | No rule: `<h2 role="presentation">`, empty `<p>`, `<br><br>` paragraphs, empty `<blockquote>`. | open |
| T89-07 | 8.10.1 | MISS | Right-to-left text with no `dir` is not detected. | open |
| T89-08 | 9.1.3 | MISS | A page with text but no heading is notApplicable. | open |
| T89-09 | 8.2.1 | FP | Markup inside shadow roots fails 8.2, though the validator RGAA names never sees it. | done (pack rules); core (`duplicate-id`) |
| T89-10 | 8.4.1, 8.8.1 | WM | A default language on `<body>` is judged under 8.8 instead of 8.4. | open (pack); core (`valid-lang` reason) |
| T89-11 | 8.4.1 | MISS | A wrong default language passes; `und`, `mul` pass (Q7). | open |
| T89-12 | 8.7.1 | MISS | No rule: changes of language (Q6). | open |
| T89-13 | 9.4 | MISS | No rule: quotations (Q12). | open |
| T89-14 | 8.2.1 | MISS | Frequent validator errors (`<button><div>`, `type=bouton`, roles outside their container…) only ask. | open |
| T89-15 | 9.1.3 | WO | `p-as-heading` asks about numbers and link-only paragraphs (C5). | core |
| T89-16 | 8.4, 8.8, 8.10, 9.1 | WO | Criteria with a « pertinent » condition pass on validity alone. | open |
| T89-17 | 9.3.1, 9.3.2 | WM | Every list finding names both the unordered and the ordered test. | open |
| T89-18 | 8.10.2 | MISS | `dir="rtl"` on Latin-only text passes (Q16). | open |

## Theme 10, Presentation

| # | Test | Kind | Finding | Status |
|---|---|---|---|---|
| T10-01 | 10.7.1 | FP | A focus ring drawn on an ancestor (`:focus-within`, `:has(:focus-visible)`) is ignored and the field fails. | done |
| T10-02 | 10.7.1 | WO | The outline is measured against both sides even when `outline-offset` keeps it off one. | open |
| T10-03 | 10.7.1 | WO | `outline:0` with nothing else changing on focus is only asked about. | open |
| T10-04 | 10.7.1 | MISS | `outline-color:#fff` on the browser's `auto` ring hides it, unmeasured. | open |
| T10-05 | 10.12.1 | FP | `<body>` taken as clipping when its overflow goes to the viewport (C2). | core |
| T10-06 | 10.6.1 | WO | Links at 3:1 always ask, though the hover and focus states can be read (Q14). | open |
| T10-07 | 10.5 | MISS | No rule: text colour with no background colour (Q4). | open |
| T10-08 | 10.1.3 | MISS | Runs of `&nbsp;` used for alignment, and fake columns, are not asked about. | open |
| T10-09 | 10.9, 10.10 | MISS | An active menu item shown only visually (no `aria-current`). | open |
| T10-10 | 10.8.1 | MISS | Visible, informative text under `aria-hidden="true"` passes. | open |
| T10-11 | 10.14 | MISS | Content revealed on `:hover` only. | open |
| T10-12 | 10.13 | MISS | Author tooltips: no question. | open |
| T10-13 | 10.2, 10.3, 10.11 | MISS | CSS-reordered content, CSS-only content, reflow at 320 px. | open |
| T10-14 | 10.1.2 | FP | `<link rel="mask-icon" color>` in `<head>` fails 10.1.2. | done |
| T10-15 | 10.1.2 | WO | `width`/`height` on `<source>` in `<picture>` is exempted though RGAA's list is closed (P8). | done (decision B: asked) |

## Theme 11, Forms

| # | Test | Kind | Finding | Status |
|---|---|---|---|---|
| T11-01 | 11.2.5 | FP | A `title` that is help text fails, though the `<label>` gives the étiquette (the glossary's order). | done (decision B: asked) |
| T11-02 | 11.13.1 | FP | An invalid `autocomplete` fails on a field that is not about the user (a search field). | done |
| T11-03 | 11.2.5 | FP | A switch's state text ("Activé") is taken as its visible label. | done |
| T11-04 | 11.1.2 | FP | A `<label for>` pointing at an `<input type=hidden>` or a `<div>` fails, though no field is in scope. | won't (a `for` that reaches no field means the field it names lacks the id 11.1.2 checks, as when the id matches nothing) |
| T11-05 | 11.2.5 | WO | Visible "Recherche", name "Rechercher": the name contains the string. Fail or ask. | done (decision B: asked) |
| T11-06 | 11.8 | WO | Lists outside any form fail, though criterion 11.8 says « Dans chaque formulaire ». | won't (test 11.8.1 « Pour chaque balise `<select>` » and its methodology cover every list; only the criterion's title says « formulaire ») |
| T11-07 | 11.1.3 | MISS | A field whose only `<label>` is visually hidden is never asked about. | open |
| T11-08 | 11.13.1 | MISS | A personal-data field with no `autocomplete`, or on/off (Q1). | done |
| T11-09 | 11.10 | MISS | No rule: required fields, error messages (Q2). | open |
| T11-10 | 11.9.1 | MISS | Rolls up as pass whenever a button has any name. | open |
| T11-11 | 11.2.1, 11.2.2 | MISS | An empty `<label for>` or `title` as the only étiquette is not failed (M5). | open |
| T11-12 | 11.2.3, 11.2.4 | WM | The aria-label and aria-labelledby relevance questions are filed under 11.2.2. | done |
| T11-13 | 11.8.1 | MISS | Groups faked with disabled or dashed options. | open |
| T11-14 | 11.5.1 | MISS | Same-name checkbox sets and `role=radio` sets (Q13). | open |
| T11-15 | 11.4 | MISS | Label placement (Q15). | open |
| T11-16 | 11.13.1 | MISS | An `autocomplete` value that contradicts the field. | open |
| T11-17 | 11.7, 11.11, 11.3, 11.12 | MISS | Smaller targeted questions (Q15). | open |

## Themes 12–13, Navigation, Consultation

| # | Test | Kind | Finding | Status |
|---|---|---|---|---|
| T12-01 | 13.9.1 | FP | A change of presentation between orientations (burger menu, table vs cards) counts as missing content. | done |
| T12-02 | 12.7.2 | FP | `SKIP_LINK_NOT_VISIBLE` while an ancestor is transitioning into view. | done |
| T12-03 | 12.7.2 | FP | The position is compared with pages of another ensemble (the home page). | done |
| T12-04 | 12.7.1 | FP | A broken first link that is not about the main content fails `skipLinkTargetMissing`. | done |
| T12-05 | 12.7.1 | WO | A skip link landing before a section menu is dropped, then the page fails as having none. | done |
| T12-06 | 12.7 | FN | A skip link that is never visible passes: `rgaa-skip-link-placement` lacks the breadcrumb fix (P2). | done |
| T12-07 | 12.6.1 | FN | Passes when no zone is recognised. | open |
| T12-08 | 13.1, 13.3, 13.9 | WO | A criterion rolls up notApplicable or pass though some of its tests are not checked. | core |
| T12-09 | 12.6.1 | WO | Untargeted questions on blocks inside other landmarks. | open |
| T12-10 | 12.7.2 | MISS | An `aria-hidden` skip link passes 12.7. | open |
| T12-11 | 12.7 | WO | A working empty `tabindex="-1"` anchor target is asked about. | core |
| T12-12 | 13.9 | WO | Cross-origin stylesheets make it ask (C6). | core |
| T13-01 | 13.3.1 | MISS | Office documents named only in the link text or `type` are not found. | open |
| T13-02 | 12.8.1 | MISS | Focus reaching hidden elements; tabbable content outside an open modal. | open |
| T13-03 | 13.1.3, 13.1.4 | MISS | Script redirects, countdowns, session limits. | open |
| T13-04 | 12.11.1 | MISS | Menus that open on hover only. | open |
| T13-05 | 13.8, 13.7.3 | MISS | Moving and blinking content (marquee, infinite animations, GIFs). | open |
| T13-06 | 13.4.1, 13.5, 13.6 | MISS | Accessible versions of documents; emoji and ASCII art. | open |
| T13-07 | 12.10, 13.2, 13.10–13.12 | MISS | Script-attached behaviour: needs a listener probe in the crawler. | open |
| T13-08 | 12.8.2, 12.9.1 | MISS | The page-level reminders say nothing of what to test. | open |
| T12-13 | 12.1 | MISS | Fewer than two ways to navigate (Q15). | open |
| T12-14 | 12.1–12.5, 12.7.2 | design | « Ensemble de pages »: never pass, fail or mark notApplicable from one page; compare pages only within one ensemble. | open |
