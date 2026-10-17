# Theme 6-7: Links and Scripts

## Summary
I checked 63 groups (6.1: 20, 6.2: 16, 7.1: 22, 7.3: 5) on the 165 pages where every engine returned a result with no error and the page was not blocked. I made 6 live page loads: Insee ×2, unistra ×1, Caisse d'Epargne ×3.

Verdicts, counted per heading below:
- PACK RIGHT: 7
- PACK RIGHT with a pack false positive: 2
- NOT A REAL DIFFERENCE: 3
- OTHER RIGHT: 1
- PACK RIGHT on the coverage question: 1

Main takeaways:
- **uuv 6.1/6.2 is almost all noise.**
  - Its queries do not filter visibility (`ByTagQuery` is a raw jQuery selector), so every `display:none` link gets an empty name from dom-accessibility-api and fails 6.1.1, 6.1.2 and 6.2.1. Live on Insee, all 66 of its 6.1.1/6.2.1 failures were hidden elements.
  - Its 6.2.1 selector is a bare `a`, so anchors with no `href` fail too (323 findings).
  - Its 6.1.5 compares the raw `textContent`, whitespace included, against the normalised accessible name: 13,176 of 18,649 failures have leading, trailing or double whitespace.
  - The pack should adopt nothing from it.
- **stan 7.1 is unsound.** It fails every role missing from a hard-coded whitelist of 47 roles. 684 of its 688 failures are valid roles (`group`, `presentation`, `none`, `tablist`, `paragraph`, `document`, `figure`, `application`, `log`). The 4 real ones (`role="nav"`, `role="section-h2"`) are static markup that the pack already fails under 8.2.1. The pack should not fail 7.1 on it.
- **arneo 6.2 element counts are a bench artifact.** `vendor/arneo.js:3451` emits every link on the page when the verdict is NC, not only the links that fail.
- **a11ylint 6.2.1** ignores `<img alt>`, so it fails image links that have a good alt.
- **Real findings for the pack:**
  - stan 7.3 is right on Caisse d'Epargne: the "Gérer mes cookies" span with role=button opens on click but not with Enter or Space, verified live. The pack says inapplicable.
  - The pack's 6.1.5 rule counts sr-only text as visible: 10 false fails and some false questions.
  - Core's `link-name-quality` puts `title` before the link content: 11 of 79 of its questions name the link by the wrong text.
- **The pack's own failures hold up.** dialog, tree, radiogroup, progressbar and menuitem names (7.1.1) and links with no content (6.2.1) are correct on every sample I checked.

## Criterion 6.1

### uuv flags hidden links and compares raw whitespace — uuv, OTHER_FAILS / OTHER_MORE_ELEMENTS, 4–59 pages / 3–6 sites
Groups: `6.1 uuv OTHER_FAILS 6.1.1 + 6.1.5`, `6.1 uuv OTHER_MORE_ELEMENTS 6.1.1 + 6.1.5`, `6.1 uuv OTHER_FAILS 6.1.1 + 6.1.2 + 6.1.5`, `6.1 uuv OTHER_FAILS 6.1.5`, `6.1 uuv OTHER_MORE_ELEMENTS 6.1.5`, `6.1 uuv OTHER_FAILS 6.1.2 + 6.1.5`, `6.1 uuv OTHER_MORE_ELEMENTS 6.1.1 + 6.1.2 + 6.1.5`
- **What differs:** uuv fails 6.1 on many pages where the pack passes or asks.
- **What uuv flags,** classified from the stored findings:
  - **6.1.1, about 6,900 findings.** Text links whose accessible name is empty. 6,383 of them have text content, for example `<a id="lien-changement-langue-responsive" href="/langue/en">English</a>`.
  - **6.1.2, 101 findings.** Image links with an empty name.
  - **6.1.5, about 18,650 findings:**
    - 13,176 have leading, trailing or double whitespace in `textContent`;
    - 1,050 have a title or aria-label;
    - 4,375 have neither.
- **Verdict:** PACK RIGHT.
  - **Hidden links (6.1.1, 6.1.2).** A link that is not displayed is not content a user meets, so test 6.1.1/6.1.2 does not apply to it.
  - **Whitespace (6.1.5).** Whitespace is not part of the "intitulé visible", and the particular cases of 6.1.5 already excuse punctuation and capitals.
  - **Overlap with the pack.** About 1% of uuv's 6.1.1/6.1.2 targets, the visible links with truly empty content or an empty-alt image, are flagged by the pack too, under 6.2.1.
- **Evidence:**
  - **Live on insee.fr/fr/information/2008466:**
    - uuv's 81 failures under 6.x were 33 6.1.1, 33 6.2.1 and 15 6.1.5.
    - All 66 of its 6.1.1 and 6.2.1 targets were hidden, and 0 were visible.
    - Of the 15 under 6.1.5: 8 were hidden; 6 were visible and had extra whitespace; 1 was visible.
  - **Examples checked live on that page:**
    - `a.deroulement` (30 of them): `display:none`, ignored by Chrome's accessibility tree.
    - `#lien-changement-langue-responsive`: `display:none`.
  - **Stored data:**
    - 1/4 of uuv's 6.1.5 failures are `<button role="link"> Politique de protection des données </button>`, with spaces around the text.
    - Iledefrance menu items such as `title="Me déplacer"…>Me déplacer</a>` sit in collapsed menus.
- **How they do it:**
  - `node_modules/@uuv/a11y/dist/lib/reference/rgaa/rules/6-link.js:42-52` runs 6.1.1 as `AccessibleNameQuery(..., true)` over `SELECTOR_LINK_TEXT`.
  - `query/by-tag.query.js:13` is a plain jQuery selection, with no visibility filter.
  - `query/accessible-name.query.js:15` calls `computeAccessibleName`, which returns "" for a hidden root.
  - 6.1.5: `query/compliant-attributes/attribut-specification.js:73-82` takes `visibleText = element.textContent` raw and fails when the lowercased name does not contain it.
- **Proposal:** none for the pack.
  - For the bench (optional): note that uuv's 6.1 and 6.2 verdicts are unreliable, or drop elements that are not rendered in `diff.mjs`, using a `checkVisibility` probe recorded at scan time.

### Pack 6.1.5 failures where the others are silent — pack vs a11ylint/arneo/stan/uuv, PACK_FAILS / PACK_MORE_ELEMENTS, 14–49 pages / 6 sites
Groups: `6.1 a11ylint PACK_FAILS rgaa-link-label-in-name-sources`, `6.1 arneo PACK_FAILS rgaa-link-label-in-name-sources`, `6.1 stan PACK_FAILS rgaa-link-label-in-name-sources`, `6.1 uuv PACK_MORE_ELEMENTS rgaa-link-label-in-name-sources`, `6.1 a11ylint PACK_ASKS link-name-quality + rgaa-link-label-in-name-sources`, `6.1 arneo PACK_ASKS link-name-quality + rgaa-link-label-in-name-sources`
- **What differs:** `rgaa-link-label-in-name-sources` fails 188 links (163 distinct) whose title or aria-label does not contain the visible text. a11ylint and arneo do not test 6.1.5, and stan does not either.
- **Verdict:** PACK RIGHT, with one false-positive class.
  - Test 6.1.5 asks that the accessible name contain at least the visible label.
  - The glossary "Intitulé (ou nom accessible) de lien", Note 2 (checked on the published glossary), makes a link non-explicit when its `title` does not include at least the name from its content.
  - Correct samples:
    - Bordeaux `title="Professionnels, accédez rapidement…">Entreprendre</a>`
    - CNIL `title="Médiathèque de la CNIL"> dans sa médiathèque</a>`
    - Insee `title="Lire la suite "` on a link whose visible text is a headline
    - LCL `aria-label="Menu LCL Essentiel"` on a card that also shows a tagline
    - lenord titles that miss the card text
- **False positives:**
  - 10 of 188 (5%), all on unistra pagination: `<a aria-label="Page 2"><span class="sr-only">Page2</span>2</a>`.
  - The pack takes "Page2 2" as the visible label.
  - Live check on unistra.fr/fr/resultat-de-recherche?s=test: `.sr-only` is `position:absolute; clip:rect(0,0,0,0)`, 1×1 px, so the visible label is "2". "Page 2" contains it, and the link passes 6.1.5.
- **The same flaw on questions:** iledefrance `title="Nouvelle fenêtre - Twitter"><span class="visually-hidden">X</span>` gets a question "visible label « X » may be a symbol". The link has no visible text at all (a CSS icon), so 6.1.5 does not apply to it.
- **Evidence:** I reviewed every distinct snippet listed by site; a regex search for sr-only class names found 10 hits, all unistra.
- **Proposal (pack):**
  - **Change:** in `rules/automatic/rgaa-link-label-in-name-sources.js` `textUnder(container, visibleOnly)` (lines 210-245), when `visibleOnly` is set, skip a text node when it or an ancestor up to the container has `helpers.isVisuallyHidden(a)` true. That core helper (`core/src/core/dom-helpers.js:5603`) already detects clip, clip-path, opacity 0 and the 1px overflow pattern, and core's `label-in-name.js:320-329` uses it the same way.
  - **Apply it to the sibling rules too:** `textUnder` is duplicated in `rgaa-field-label-in-name-sources.js`, `rgaa-form-button-label-in-name-sources.js` and `rgaa-widget-label-in-name.js`.
  - **Outcome:**
    - The link passes (or the rule is not applicable) when no visible text remains.
    - Test 6.1.5, and 11.2.5, 11.9.2 and 7.1.3 for the sibling rules.
  - **False-positive risk:** low. Text that is visually clipped is not "affiché à l'écran".

### stan fails unnamed links under 6.1 — stan, OTHER_FAILS / OTHER_MORE_ELEMENTS / PACK_MORE_ELEMENTS, 14–44 pages / 6 sites
Groups: `6.1 stan OTHER_FAILS stan-6.1`, `6.1 stan OTHER_MORE_ELEMENTS stan-6.1`, `6.1 stan PACK_MORE_ELEMENTS rgaa-link-label-in-name-sources`
- **What differs:** stan's 6.1 failures are "Lien sans nom accessible" (567) and "Image cliquable sans nom" (45). Under RGAA these are 6.2.1 matters, which the pack reports under 6.2.
  - Of the 612, 163 are the same elements as the pack's 6.2.1 failures, and 3 are the pack's 6.2.1 questions.
  - 444 are not reported by the pack. Of those:
    - 420 are Insee `<a class="deroulement" href="#"></a>`, which is `display:none` (verified live, 30 of 30 hidden, ignored in the accessibility tree).
    - 3 are Caisse d'Epargne `a.menu-item-see-all role=menuitem` inside a closed mega-menu. Live: 5 of 5 not visible, inside `aria-hidden`.
    - About 10 are Bordeaux empty links inside inactive Swiper slides (`aria-hidden="true"`).
    - About 10 are Bouygues links whose `<svg role="img" aria-label=…>` stan cannot read.
- **Verdict:**
  - NOT A REAL DIFFERENCE at the criterion level: stan files 6.2.1 matters under 6.1.
  - For the extra elements: PACK RIGHT. stan does not filter hidden elements, and it misses SVG names: `getAccessibleLabel` at `vendor/stan/cli/src/rules/index.js:186-210` uses `textContent` and the first `img[alt]` only, and the loop over `a[href]` starts at line 558.
- **Proposal:** none for the pack. The bench could map stan's "Lien sans nom accessible" message to 6.2 in `engines.mjs`.

### Ambiguous-label questions — stan vs pack, OTHER_ASKS / PACK_ASKS, 2–17 pages
Groups: `6.1 stan OTHER_ASKS stan-6.1`, `6.1 stan PACK_ASKS link-name-quality`, `6.1 a11ylint PACK_ASKS link-name-quality`, `6.1 arneo PACK_ASKS link-name-quality`
- **What differs:**
  - **stan** asks about any link whose text is exactly one of 4 phrases (`index.js:556`), with no look at context.
  - **The pack's core rule `link-name-quality`** asks only when no context is found (the link's sentence, `<li>`, `<td>` or `<p>`).
  - Where stan asks and the pack passes, for example CNIL "Lire la suite" cards, the pack found context.
- **Verdict:** PACK RIGHT on the coverage question. Tests 6.1.1 to 6.1.4 accept "intitulé + contexte du lien". The pack's question is better targeted, so stan's should not be adopted.
- **Core bug found while sampling:** `link-name-quality` reports the wrong name for 11 of its 79 questions (14%).
  - Insee: `title="Lire la suite "` on a link whose content is a full headline, "Les décès en 2025 …". The rule reports the name as "Lire la suite".
  - Nantes: `title="En savoir plus"` with visible text "Bienvenue sur vos campus".
  - Cause: `core/src/checks/manual/link-name-quality-manual.js:402-409` takes `getAccessibleNameInfo` (which includes `title`) before `getContentNameInfo`.
  - The glossary order, confirmed on the published glossary, is aria-labelledby, then aria-label, then the link content, then title. Accname treats title the same way.
- **Proposal (core):**
  - **Change:** in `link-name-quality-manual.js`, use the content name whenever the programmatic name came only from `title` and the content name is non-empty, or fix the order inside `getAccessibleNameInfo` if other rules depend on it the same way.
  - **Test:** 6.1.1 to 6.1.4.
  - **Outcome:** the question goes away for these 11. They stay correctly failed by 6.1.5 (`rgaa-link-label-in-name-sources`).
  - **False-positive risk:** none; this only removes false questions.

## Criterion 6.2

### uuv 6.2.1: hidden links and anchors with no href — uuv, OTHER_FAILS / OTHER_MORE_ELEMENTS / PACK_MORE_ELEMENTS, 43–97 pages
Groups: `6.2 uuv OTHER_FAILS 6.2.1`, `6.2 uuv OTHER_MORE_ELEMENTS 6.2.1`, `6.2 uuv PACK_MORE_ELEMENTS rgaa-link-content-label-present`
- **What differs:** uuv's 6.2.1 failures, as stored:
  - 6,389 links with text but an empty name (hidden);
  - 323 `<a>` with no `href`, for example Insee facets `<a class="libelle">France</a>`;
  - 350 image links with an empty name;
  - 552 empty links, 73 of which the pack also fails.
  - Where the pack has more elements, they are links named only by aria-label or title with no content, which uuv passes on their accessible name.
- **Verdict:** PACK RIGHT.
  - The technical note of 6.2 excludes anchors: "Une ancre n'est pas un lien".
  - Hidden links are not content.
  - Test 6.2.1 asks for "un intitulé entre `<a>` et `</a>`", so a link named only by an attribute fails it.
  - Caveat: the glossary's Note 4 says, as published, that a link with no content is non-compliant with "critère 10.2", not 6.2. The pack's doc cites it as 6.2, but the wording of 6.2.1 is enough on its own.
- **How they do it:** `6-link.js:5-8`: `SELECTOR_ALL_LINK = ["a", "[role=link]"]`, with no `href` and no visibility filter. Lines 138-148 then run `AccessibleNameQuery(..., true)`.
- **Evidence:** live on Insee, all 33 of its 6.2.1 targets were hidden.
- **Proposal:** fix the citation in the pack's doc only: `rule-map.js:509` and the rule header refer to "Note 4 … fails 6.2", which the published glossary does not say.

### a11ylint 6.2.1 ignores img alt — a11ylint, OTHER_FAILS / OTHER_MORE_ELEMENTS / PACK_FAILS / PACK_MORE_ELEMENTS / PACK_ASKS, 1–66 pages
Groups: `6.2 a11ylint OTHER_FAILS RGAA - 6.2.1`, `6.2 a11ylint OTHER_MORE_ELEMENTS RGAA - 6.2.1`, `6.2 a11ylint PACK_MORE_ELEMENTS rgaa-link-content-label-present`, `6.2 a11ylint PACK_FAILS rgaa-link-content-label-present`, `6.2 a11ylint PACK_ASKS rgaa-link-content-label-present`
- **What differs:** a11ylint fails 650 links (223 distinct) that the pack does not fail. Most are image links with a meaningful alt:
  - CNIL `<img … alt="Accueil - CNIL - …">`
  - Insee footer logos `alt="Réseau Quetelet"`
  - Nantes `alt="Retour à la page d'accueil du site"`
- **Its remaining failures that the pack does not report:**
  - Bordeaux empty links in `aria-hidden` slides;
  - the Caisse d'Epargne mega-menu item (hidden, verified live);
  - an Insee bandeau.
- **Where the pack has more elements:**
  - links named only by aria-label or title (a11ylint accepts these, the pack does not);
  - links with `#` in the href (a11ylint skips them).
- **Verdict:** PACK RIGHT. An image alternative counts as a label (the glossary's "lien image": the name comes from the alt of the image).
- **How they do it:**
  - `node_modules/@a11ylint/core/build/rules/RGAA6.js:18-31`: `hasLinkTitle` accepts aria-label, aria-labelledby, title or `textContent`, never `img[alt]`.
  - Lines 6-7 skip every href containing `#`.
- **Proposal:** none.

### arneo 6.2: whole link list reported as failing — arneo, OTHER_MORE_ELEMENTS / OTHER_FAILS / PACK_FAILS / PACK_ASKS / PACK_MORE_ELEMENTS, 1–35 pages
Groups: `6.2 arneo OTHER_MORE_ELEMENTS arneo-6.2`, `6.2 arneo OTHER_FAILS arneo-6.2`, `6.2 arneo PACK_FAILS rgaa-link-content-label-present`, `6.2 arneo PACK_ASKS rgaa-link-content-label-present`, `6.2 arneo PACK_MORE_ELEMENTS rgaa-link-content-label-present`
- **What differs, element level:** on NC pages arneo "fails" links such as "Aller au contenu" and "Presse" (9,563 findings with text).
  - Cause: `vendor/arneo.js:3451` reports `criterion.querySelectorList || criterion.elementList`, and `Criterion6_2.ts:80` sets `elementList` to every link.
  - Verdict: NOT A REAL DIFFERENCE. Fix `vendor.mjs`, which generates `arneo.js`, to report `getHighlightedElements()` when the status is NC.
- **What differs, page level:**
  - **OTHER_FAILS (20 pages, Insee and Caisse d'Epargne).** These come from hidden links: Insee `.deroulement` and the Caisse d'Epargne `menu-item-see-all`, both verified live as not rendered. `LinkUtils.ts:20` only excludes `[aria-hidden="true"]` on the link itself.
  - **PACK_FAILS (31 pages).** Links named only by aria-label or title, with an icon `<svg aria-hidden>` or an `<img>` with no alt, which arneo accepts (`LinkUtils.ts:39-55`).
  - Verdict on both: PACK RIGHT under the wording of 6.2.1.
- **Pack questions (PACK_ASKS):** Insee `a.lien.maison`, whose only content is `::before` generated content.
  - Live: visible, 43×48 px, Chrome accessible name "" (empty).
  - The rule ignores `content: ""` (`rgaa-link-content-label-present.js:138`), so the generated content must be a non-empty glyph, most likely an icon-font character.
  - Asking is right. Glossary Note 5 calls text generated by `::before` a failure (F87), and a human must see whether the glyph is text.

### stan 6.2 — stan, PACK_FAILS / PACK_ASKS / OTHER_ASKS, 8–66 pages
Groups: `6.2 stan PACK_FAILS rgaa-link-content-label-present`, `6.2 stan PACK_ASKS rgaa-link-content-label-present`, `6.2 stan OTHER_ASKS stan-6.2`
- **What differs:**
  - stan's only 6.2 output is a question "same ambiguous label for several destinations" (`index.js:612-622`), with no element.
  - stan files unnamed links under 6.1 (see above).
- **Verdict:**
  - PACK RIGHT for the pack's failures and questions; the samples are in the arneo heading.
  - stan's question belongs to 6.1, glossary Note 3 (same name, different destinations), not to 6.2, which is about presence. It is NOT A REAL DIFFERENCE for 6.2, and it is not worth adopting: the pack's `identical-links-same-purpose` already covers that pattern.

## Criterion 7.1

### stan's role whitelist — stan, OTHER_FAILS / OTHER_MORE_ELEMENTS, 33–84 pages / 6 sites
Groups: `7.1 stan OTHER_FAILS stan-7.1`, `7.1 stan OTHER_MORE_ELEMENTS stan-7.1`
- **What differs:** stan fails 7.1 on 117 pages with 688 "Rôle ARIA invalide" findings. The pack only asks there, through `rgaa-scripted-components-review`.

| Role | Findings | Sites |
|---|---|---|
| `group` (Swiper slides) | 378 | 7 |
| `presentation` | 108 | 7 |
| `none` | 84 | 1 |
| `tablist` | 59 | 5 |
| `paragraph` | 35 | 3 |
| `document` | 13 | 1 |
| `figure` | 3 | 1 |
| `application` | 3 | 2 |
| `section-h2` | 3 | 1 |
| `nav` | 1 | 1 |
| `log` | 1 | 1 |

- **Verdict:** PACK RIGHT. stan's logic is not sound enough to fail 7.1.
  - 684 of the 688 are valid WAI-ARIA roles.
  - The 4 invalid ones are Insee `<div role="nav" class="breadcrum">` and LCL `<h2 role="section-h2">`, static markup and not "un script qui génère ou contrôle un composant d'interface" (test 7.1.1). The pack already fails all 4 under 8.2.1 (`rgaa-aria-role-conformance`).
- **How they do it:** `vendor/stan/cli/src/rules/index.js:1113` is a hard-coded set of 47 roles. Any `[role]` whose value is not in it, compared as an exact string, is a `probable_error`.
- **Proposal:** none. Failing 7.1 on a role test alone would also go against the pack's deliberate choice, in `rule-map.js`, not to map role validity to 7.1.1.

### Pack's 7.1 questions on every page with script — all four engines, PACK_ASKS, 48–132 pages
Groups: `7.1 a11ylint PACK_ASKS rgaa-scripted-components-review`, `7.1 arneo PACK_ASKS rgaa-scripted-components-review`, `7.1 uuv PACK_ASKS rgaa-scripted-components-review`, `7.1 stan PACK_ASKS rgaa-scripted-components-review`
- **What differs:**
  - The pack asks on every page with script; this is documented in `rule-map.js:719-721`.
  - stan gives a good signal ("pass") when its role whitelist finds nothing.
  - The other engines say nothing.
- **Verdict:** PACK RIGHT. Behaviour attached from script files cannot be seen, and stan's pass rests on the unsound whitelist above. The pack's question already lists candidate elements, for example Caisse d'Epargne `<a role="menuitem">` and `<span role="button">`.

### Pack's name failures on components — pack vs all, PACK_FAILS / PACK_MORE_ELEMENTS, 1–15 pages / 1–2 sites
Groups: `7.1 a11ylint PACK_FAILS aria-role-name-present + dialog-name-present`, `7.1 a11ylint PACK_FAILS dialog-name-present`, `7.1 a11ylint PACK_FAILS aria-role-name-present + menuitem-name-present`, `7.1 a11ylint PACK_FAILS aria-role-name-present`, `7.1 arneo PACK_FAILS aria-role-name-present + dialog-name-present`, `7.1 arneo PACK_FAILS dialog-name-present`, `7.1 arneo PACK_FAILS aria-role-name-present + menuitem-name-present`, `7.1 arneo PACK_FAILS aria-role-name-present`, `7.1 uuv PACK_FAILS aria-role-name-present + dialog-name-present`, `7.1 uuv PACK_FAILS dialog-name-present`, `7.1 uuv PACK_FAILS aria-role-name-present + menuitem-name-present`, `7.1 uuv PACK_FAILS aria-role-name-present`, `7.1 stan PACK_MORE_ELEMENTS aria-role-name-present + dialog-name-present`, `7.1 stan PACK_MORE_ELEMENTS dialog-name-present`, `7.1 stan PACK_MORE_ELEMENTS aria-role-name-present + menuitem-name-present`, `7.1 stan PACK_MORE_ELEMENTS aria-role-name-present`
- **What differs:** the pack fails 84 elements under 7.1.1 that no other engine fails. That is 13 distinct elements; I checked all of them:
  - **dialog-name-present (29):** the TagCommander consent popin `<div id="popin_tc_privacy" role="dialog" aria-modal="true" aria-describedby="description">` on Bouygues and LCL. It has no aria-label, aria-labelledby or title.
  - **aria-role-name-present (52):**
    - Insee `<ul role="tree" aria-labelledby="tab-searchbar">`. Live: `#tab-searchbar` does not exist, and Chrome's accessible name is "".
    - Insee and Bouygues `role="radiogroup"` with no name.
    - LCL `<ng-progress role="progressbar">` with no name.
  - **menuitem-name-present (3):** Insee `<li role="menuitem"><a class="lien maison" href="/fr/accueil"></a></li>`. Live: visible, Chrome's accessible name is "".
- **Verdict:** PACK RIGHT. Test 7.1.1 requires the name to be available to assistive technologies, and WAI-ARIA requires a name for dialog, tree, radiogroup, progressbar and menuitem. The Insee tree is an empty suggestion list with zero height: it is exposed and unnamed, but its impact is small.

## Criterion 7.3

### Clickable span with no keyboard support — stan, OTHER_FAILS, 12 pages / 1 site
Groups: `7.3 stan OTHER_FAILS stan-7.3`
- **What differs:** stan fails `<span class="link manage-my-cookies" role="button" tabindex="0" onclick="…utag.gdpr.showConsentPreferences()">` on 12 Caisse d'Epargne pages. The pack says inapplicable.
- **Verdict:** OTHER RIGHT on this element.
  - Live on caisse-epargne.fr, after closing the consent banner:
    - the span takes focus;
    - Enter opens nothing, and Space opens nothing (each checked on a separate load);
    - a mouse click opens the preferences modal (`bpce-modal`, `cookieConsentPreferencesMessage`);
    - the element has no `onkeydown`, `onkeyup` or `onkeypress` property.
  - That fails test 7.3.1: the element has a script event handler and is not "activable par le clavier". I did not find an equivalent control elsewhere in the page, but did not search it exhaustively.
- **How they do it:** `vendor/stan/cli/src/rules/index.js:649-660`. For each `div[onclick]` or `span[onclick]`, it fails when there is no role=button or link, or no tabindex ≥ 0, or no inline `onkeydown`, `onkeyup` or `onkeypress`.
- **Proposal (pack):**
  - **Change:** extend `mouse-only-event-handlers` (core rule; mapping in `rule-map.js:603-605`), or add a pack rule `rgaa-click-handler-keyboard`. It applies to an element with an inline `onclick` that is not natively keyboard-activable (not `a[href]`, `button`, `input`, `select`, `summary` or `textarea`):
    - **No tabindex ≥ 0 and no focusable descendant:** fail 7.3.1. The element cannot be reached by keyboard; the only remaining way out is an equivalent elsewhere, so cantTell is acceptable if an equivalent seems likely.
    - **Focusable, but no inline key handler on itself or an ancestor:** cantTell 7.3.1, "check Enter and Space activate it". A handler from `addEventListener` is invisible to the rule.
  - **False-positive risk:**
    - Key handlers delegated on `document` or added with addEventListener make a fail too strong for the focusable case, hence cantTell.
    - An onclick that only stops propagation or tracks clicks: limit the rule to elements with a widget role or `cursor:pointer`.

### BAD hover-only image swaps — pack vs all, PACK_ASKS, 4 pages
Groups: `7.3 a11ylint PACK_ASKS mouse-only-event-handlers`, `7.3 arneo PACK_ASKS mouse-only-event-handlers`, `7.3 stan PACK_ASKS mouse-only-event-handlers`, `7.3 uuv PACK_ASKS mouse-only-event-handlers`
- **What differs:** the pack asks about `<td onmouseover="switchImage(…)" onmouseout=…>` and `<img onmouseover="this.src=…">` on the BAD "before" pages. No other engine checks inline mouse handlers.
- **Verdict:** PACK RIGHT. There is a scripted handler with no keyboard equivalent (7.3.1 steps 2-3). Only a human can tell whether the hover effect carries information or is decorative, so a question is the right outcome.

## Improvements
| # | Criterion | From | Change | Where | Outcome | Effort | Value |
|---|---|---|---|---|---|---|---|
| 1 | 7.3.1 | stan | Flag inline `onclick` on elements that are not natively interactive: fail when they cannot get keyboard focus, ask when they are focusable but have no inline key handler. Verified live on the Caisse d'Epargne cookie span: click works, Enter and Space do not. | core `mouse-only-event-handlers`, or a new pack rule | fail / cantTell | M | High: a real failure the pack misses on 12 pages |
| 2 | 6.1.5 (and 11.2.5, 11.9.2, 7.1.3) | own FP | In `textUnder(…, visibleOnly)`, skip text under `helpers.isVisuallyHidden` (sr-only, clip, clip-path) | pack `rgaa-link-label-in-name-sources.js` and the 3 sibling `*-label-in-name*` rules | removes 10 false fails (5%) and false "symbol" questions | S | Medium |
| 3 | 6.1.1–6.1.4 | own FP | Use the link content before `title` when resolving the name (glossary order: aria-labelledby, aria-label, content, title) | core `link-name-quality-manual.js:402-409` (or `getAccessibleNameInfo`) | removes 11 of 79 false questions (14%) | S | Medium |
| 4 | 6.2.1 | doc | Correct the citation: Note 4 of the published glossary names "critère 10.2"; rely on the wording of 6.2.1 ("entre `<a>` et `</a>`") | pack `rule-map.js:509`, header of `rgaa-link-content-label-present.js` | none (doc) | XS | Low |
| 5 | 6.2 | bench | For arneo, report the highlighted elements (`getHighlightedElements()`) instead of `elementList` when the status is NC | `vendor.mjs` (generates `vendor/arneo.js:3451`) | removes bogus OTHER_MORE_ELEMENTS | XS | Medium (bench accuracy) |
| 6 | 6.1/6.2 | bench | Treat uuv 6.1/6.2 as unreliable (no visibility filter, bare `a` selector, raw `textContent` whitespace), or drop non-rendered elements in the diff | `diff.mjs` / `engines.mjs` | removes about 25k noisy findings | S | Medium (bench accuracy) |
| 7 | 6.1 → 6.2 | bench | Map stan's "Lien sans nom accessible" and "Image cliquable sans nom accessible" to 6.2 | `engines.mjs` runStan | aligns criteria | XS | Low |
| 8 | 6.2.1 (optional) | own | When a link's only content is a single private-use (icon-font) glyph from `::before`/`::after`, fail instead of ask | pack `rgaa-link-content-label-present.js:133-143` | fail | S | Low (needs a char-code check first; the Insee `.lien.maison` case gets an empty name in Chrome) |
