# Issues that belong to core

Issues found while checking the pack against RGAA 4.1.2 whose cause is in a core rule's own logic, so the pack cannot fix them through its map or its own rules. They are collected here to be reviewed together, and are not fixed in core from this branch.

Each entry says which RGAA test it affects, what goes wrong, a minimal repro where one was run, and the change proposed. **Status** says how far it was checked:

- *verified*: reproduced against core 1.12.1 with the pack, in Chromium or jsdom;
- *from triage*: listed in [TRIAGE.md](./TRIAGE.md) from the bench's live loads, not reproduced again here.

Where the pack works around an issue meanwhile (a map change, or a pack rule that takes the test), the entry says so: the core fix would then let the pack go back to the core rule.

## From the triage

| # | Test | Core rule | Issue | Proposed change | Status |
|---|---|---|---|---|---|
| C1 | 3.2 | `contrast-helpers.js` | A `::before` with `z-index:-1` paints over its parent's background inside the parent's stacking context, and the contrast walk misses it: white text on `#2b2a2a` is measured on `#ffcc00` (all 13 Bordeaux pages). | Measure the pseudo-element's colour; ask when it paints an image. | from triage |
| C2 | 10.12 | `text-spacing-content-loss.js` | `<body>` is taken as clipping the text when its overflow goes to the viewport, as when a cookie banner locks scrolling (14 of 27 pages). | Don't treat a `<body>` whose overflow propagates to the viewport as a clipping box. | from triage |
| C3 | 3.2 | `contrast-helpers.js` | Gives up where contrast can be measured: `background-image: none, none` taken for an image, a one-colour gradient, `filter: drop-shadow` on an ancestor, solid boxes over the text, SVG chart strokes. | Measure these cases. | from triage |
| C4 | 6.1 | `link-name-quality-manual.js` | Names a link by its `title` before its content; RGAA's glossary « Intitulé (ou nom accessible) de lien » puts the content first (11 of 79 questions). | Follow the glossary's order. | from triage |
| C5 | 9.1 | `p-as-heading-manual.js` | Asks about paragraphs holding only digits or a number, visually hidden ones, and ones holding only a link. | Skip them (about 38% fewer questions). | from triage |
| C6 | 13.9 | `css-orientation-lock.js` | Asks whenever a stylesheet from another domain can't be read (33 pages). | Fetch the sheet, or report a scan limit instead of a question. | from triage |
| C7 | 1.1 | `img-alt-decorative-manual.js` | Asks the same question twice for one image, and skips `alt=""` photos inside an element named by the author, such as a named `<figure>` or `<nav>`. | Merge identical questions; limit the exemption to links, buttons and widgets. | from triage |
| C8 | 9.1 | `heading-order-manual.js` | Compares each heading with the deepest level reached so far, so h2 then h4 after an earlier h4 is missed (iledefrance.fr, caisse-epargne.fr). Triage item M1. | Compare with the previous exposed heading. | from triage |
| C9 | 7.3 | `mouse-only-event-handlers` | An `onclick` on an element that isn't natively interactive is not reported (Caisse d'Epargne's "Gérer mes cookies" opens on click but not with Enter or Space). Triage item M2. | Fail when the element can't be focused; ask when it can but has no key handler. Could be a pack rule instead. | from triage |
| C10 | 9.3 | `list-children-valid.js` | An `<li>` whose explicit role overrides `listitem` (`role="presentation"` in Drupal pagers, `role="group"` in carousels) gets the same reason as a non-`<li>` child, so the pack can't ask about it while failing the rest. Triage item P7. | Give it its own reasonCode, which the pack would map to cantTell under 9.3.1 and 9.3.2. | from triage |
