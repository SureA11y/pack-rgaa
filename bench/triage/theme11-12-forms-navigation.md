# Theme 11-12: Forms and Navigation

## Summary
I covered 102 groups (every group whose criterion starts with 11. or 12.) under 20 headings. I made 11 live page loads, one of which timed out and was retried (impots, Bouygues, lenord, Nantes sciences-techniques, Bordeaux agenda, unistra ×3, CNIL, Insee, LCL). Verdicts by heading:
- PACK RIGHT: 7
- BOTH PARTLY: 5
- NOT A REAL DIFFERENCE: 3
- OTHER WRONG: 1
- Coverage gaps (others ask, pack silent): 4 headings, judged one by one

Main takeaways:
- **11.1 "uuv passes where the pack fails" carries no information.** uuv's 11.1 query is a stub that always returns `[]`, so uuv "passes" 11.1 on all 165 pages. I checked the pack's 11.1.1 failures by category on 7 sites: they are right. Two need wording or exemption tweaks (a `<output>` live region, a duplicated id).
- **Pack bug in 11.6:** `aria-role-name-present` carries 11.6.1 for every role it checks. On 17 of its 19 failing pages, the unnamed element is a `role="tree"` (Insee) or an idle `ng-progress role="progressbar"` (LCL), not a radiogroup.
- **Pack bug in 12.7.1:** `rgaa-skip-link-present` fails all 14 unistra pages with "aucun lien ne mène à cette zone". The page has a working "Passer au contenu principal" link to an anchor inside `<main>`, just after a breadcrumb `<nav>`. I confirmed this live.
- **11.9:** ARNEO's NC on 76 pages and stan's on 31 come from broken logic:
  - page-wide scope
  - no visibility filter
  - a `tagName === '[role="button"]'` bug, so every `div role=button` with text is "unnamed"
  - ARNEO records no elements at all

  The audits' 11.9 NC on Bouygues, Nantes and Nord is still not matched by the pack, which is silent on visible unnamed buttons outside a `<form>`. On Bouygues, I confirmed live 3 visible image buttons with `alt=""` outside any form. I propose a cantTell there.
- **Coverage worth adopting:** 11.13 (personal-data field without `autocomplete`; NC in 5 of 11 audits) and 11.10.2 (required field without a visible indication; NC in 5 of 11 audits), both as targeted cantTell rules. Not worth adopting as-is: ARNEO's 11.3, 11.4, 11.5 and 11.7 (they ask on every page that has a field), stan's 11.11 (`type="text"` heuristics) and stan's 12.1 (it is a skip-link check, mislabelled as 12.1).
- **Fixes to the bench (`engines.mjs`):** drop uuv 11.1, remap stan 12.1 to 12.7, and note that ARNEO 11.1, 11.2 and 11.6 attribute their page-level verdict to every field or group on the page.

## Criterion 11.1

### uuv's 11.1 pass is a stub — uuv, PACK_FAILS / PACK_ASKS, 46 + 36 + 3 pages / 6 sites
Groups: `11.1 uuv PACK_FAILS rgaa-field-label-listed-source`, `11.1 uuv PACK_ASKS form-control-programmatic-label-quality`, `11.1 uuv PACK_FAILS rgaa-label-for-target-valid`, `11.1 uuv PACK_ASKS rgaa-field-label-listed-source`, `11.1 uuv PACK_ASKS form-control-programmatic-label-quality + rgaa-field-label-listed-source`
- **What differs:** uuv reports 11.1 as pass on all 165 pages and returns zero 11.1 findings anywhere. The pack fails 47 pages.
- **Verdict:** NOT A REAL DIFFERENCE. uuv's only 11.1 rule (`rules/11-form.js:6-14`) uses `FormQuery`. `FormQuery.execute()` (`node_modules/@uuv/a11y/dist/lib/query/form.query.js:55-81`) has its whole body commented out, with `//TODO implements filter`, and `return [];`. The rule therefore finds nothing and the bench's runner records success. uuv's 12.x rule file is empty too (`rules/12-navigation.js:3`).
- **Fix:** in `engines.mjs` `runUuv`, ignore uuv's 11.1, or treat any uuv rule whose query is `FormFilter` as no verdict. The pack's own failures on these pages are judged under the next heading, and they hold.

### Pack failures where a11ylint, stan and ARNEO are silent or pass — PACK_FAILS / PACK_MORE_ELEMENTS / PACK_ASKS, 32-46 pages / 4-6 sites
Groups: `11.1 a11ylint PACK_ASKS form-control-programmatic-label-quality`, `11.1 a11ylint PACK_FAILS rgaa-field-label-listed-source`, `11.1 a11ylint PACK_MORE_ELEMENTS rgaa-field-label-listed-source`, `11.1 arneo PACK_FAILS rgaa-field-label-listed-source`, `11.1 stan PACK_ASKS form-control-programmatic-label-quality`, `11.1 stan PACK_FAILS rgaa-field-label-listed-source`, `11.1 stan PACK_MORE_ELEMENTS rgaa-field-label-listed-source`
- **What differs:** `rgaa-field-label-listed-source` fails fields that have none of the 11.1.1 sources. a11ylint and stan look only at input, select and textarea. ARNEO and stan accept a placeholder (ARNEO's `FormUtils.ts:103-106`) or a wrapping label.
- **Verdict:** PACK RIGHT, under test 11.1.1. A placeholder, the field's content or an `alt` are not among its conditions, and the glossary counts the ARIA roles (checkbox, combobox, listbox, progressbar) as form fields.
- **Evidence:** I reviewed every distinct failing pattern, about 15 categories over 7 sites (all pack 11.1.1 fail findings, deduplicated by markup):
  - **Placeholder only** (Bordeaux, Bouygues, LCL, BAD search fields): a correct fail. ARNEO passes these because it takes the placeholder as a label.
  - **Bordeaux agenda `<select>` month and year** with no label: live, they are visible and exposed as `combobox` with no name. Correct.
  - **Insee `<img role="checkbox" alt="Non coché : ">`** (93 findings): live, the AX name is "Non coché :" with no theme name. Correct, and a real defect.
  - **Bordeaux `<span role="checkbox">Bordeaux<span>1073</span>` with an inner `<input type="checkbox" tabindex="-1">`** (20 spans plus 20 inputs): live, the inner input is exposed as an unnamed `checkbox`. The span is named only by its content, which 11.1.1 does not list. Both are correct to the letter, but they double-report one widget.
  - **LCL `<ng-progress role="progressbar">`** (14 pages): live, it is 0×0, not aria-hidden, and exposed as an unnamed `progressbar`. Correct to the letter, low impact.
  - **CNIL slick carousel `role="listbox"`**, **Insee ARIA 1.1 `div role="combobox"` wrapper**, **LCL `input role="combobox"`**: unnamed elements with a field role. Correct. The real defect of the carousel is the role itself.
  - **Insee `<output aria-live="polite" class="sr-only">`** (1 page): an empty live region, not a field anyone fills in. A false positive in spirit.
  - **CNIL `#edit-keyword`** (2 pages): at scan time the page had two `id="edit-keyword"` (the paths differ: `1/0/1/2/0/1/0/1` and `1/0/2/…`). The `<label for>` therefore labels the first one, which matches HTML and Chromium, and the failure is accurate. Live today there is one field and it is named, so the site has changed. The message "n'a … ni `<label for>`" misleads, since a `for` with its id exists.
  - `PACK_ASKS form-control-programmatic-label-quality` (11.1.3 asks on fields labelled only by a title, aria-label or placeholder) is targeted and fine.
- **Proposal (pack, `rules/automatic/rgaa-field-label-listed-source.js`):**
  1. Skip `<output>` that has no `for` and no form owner and that is aria-live or visually hidden, or report it as cantTell. FP risk: none known.
  2. When the field's `id` is duplicated and an earlier element takes the `<label for>`, use a dedicated reason ("id dupliqué : l'étiquette va au premier élément"). It stays a fail, but the message names the cause.
  3. Optional: when a native checkbox sits inside an ARIA `role=checkbox` and is not focusable, report one finding, not two.

### Others fail where the pack asks or is silent — a11ylint / stan / ARNEO, OTHER_FAILS / OTHER_MORE_ELEMENTS, 4-36 pages / 3-5 sites
Groups: `11.1 a11ylint OTHER_FAILS RGAA - 11.1.1`, `11.1 a11ylint OTHER_MORE_ELEMENTS RGAA - 11.1.1`, `11.1 arneo OTHER_MORE_ELEMENTS arneo-11.1`, `11.1 arneo OTHER_FAILS arneo-11.1`, `11.1 stan OTHER_FAILS stan-11.1`, `11.1 stan OTHER_MORE_ELEMENTS stan-11.1`
- **What differs:** the others fail fields that the pack leaves out (hidden or aria-hidden) or only asks about (empty source, wrapping label).
- **Verdict:** BOTH PARTLY.
  - **Others wrong** on hidden and aria-hidden fields. 11.1 concerns fields users can perceive, and neither a11ylint (`RGAA11.js:26-98`) nor stan (`index.js:851`) filters visibility:
    - Insee MUI `<input aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput">`
    - a hidden file input and the reCAPTCHA `<textarea>`
    - Bordeaux readonly "Début"/"Fin" inputs (live: 0×0, not rendered)
    - Bouygues "Marque et modèle…" input (live: `checkVisibility()` false)

    ARNEO's NC is page-wide: `Criterion11_1.ts` sets `elementList` to every field, so its elements are not the culprits.
  - **Others right** on two cases the pack only asks about:
    - the Bouygues radios `#YOUNITED`, `#COMPTANT` and the `fundingInstallment` radios. Each has a `<label for>` with no text, and live the AX tree shows `radio [checked]` with no name.
    - the Nantes `#q` field with `title=""` (Bootstrap moved it to `data-original-title`) and a placeholder only.

    Both fields have no label at all. Applying 11.1.1 to the letter (an attribute is present) and passing the question on to 11.2 leaves them as cantTell. But an empty `<label>` cannot "permettre de connaître la fonction exacte du champ" (test 11.2.1), and an empty title fails 11.2.2.
- **Evidence:** live loads of impots `/contacts`, Bouygues iPhone 15, Bordeaux agenda and Nantes sciences-techniques.
- **Proposal (pack, `rgaa-field-label-listed-source.js`, `emptySource` branch at line 308):** keep 11.1.1 as cantTell, and also emit a **fail under 11.2.1** (empty `<label for>`) or **11.2.2** (empty title) when the field's computed accessible name is empty. This mirrors the existing `rgaa-optgroup-label-not-empty`, which fails 11.8.3 on an empty label. FP risk: a field named by an adjacent button (condition 5). Exempt it when an adjacent button gives it its name.

### 11.1.2 — a11ylint `RGAA - 11.1.2` vs pack `rgaa-label-for-target-valid`, 1-6 pages / 1-3 sites
Groups: `11.1 a11ylint PACK_FAILS rgaa-label-for-target-valid`, `11.1 a11ylint OTHER_FAILS RGAA - 11.1.2`, `11.1 a11ylint OTHER_FAILS RGAA - 11.1.1 + RGAA - 11.1.2`, `11.1 arneo PACK_FAILS rgaa-label-for-target-valid`, `11.1 stan PACK_FAILS rgaa-label-for-target-valid`
- **What differs:**
  - **CNIL `/fr/mediatheque`:** the pack fails `<label for="edit-field-scald-collection-tid">Filtrer</label>`, whose id is absent from the page. The others are silent, and ARNEO passes.
  - **lenord `/cartographie` and impots `/contacts`:** a11ylint fails 11.1.2 on fields that carry an `aria-label`, or that sit in hidden forms.
- **Verdict:**
  - CNIL: PACK RIGHT. 11.1.2 step 2 requires the field named by `for` to carry that id, and none does.
  - lenord and impots: OTHER WRONG. a11ylint (`RGAA11.js:142-155`) blames every field in a form as soon as one `label[for]` in that form has no target inside the form. That holds even for a field labelled by an `aria-label`, and even when the target exists elsewhere in the tree. On impots, all 42 flagged fields are in unrendered forms (live: 0×0) and wrapped in visible labels.
- **Evidence:** the stored findings, plus a live impots load (4 fields checked).

### ARNEO's 11.1 cantTell — ARNEO, OTHER_ASKS, 50 pages / 4 sites
Groups: `11.1 arneo OTHER_ASKS arneo-11.1`
- **What differs:** ARNEO answers NT for the whole page as soon as any field has an aria-label, aria-labelledby or title (`Criterion11_1.ts`, the `hasInvisibleLabel` branch), and highlights every field on the page.
- **Verdict:** PACK RIGHT; not worth adopting. The pack already asks per field under 11.1.3 (`form-control-programmatic-label-quality`), only for fields whose only label is invisible, and it leaves out fields that are not drawn.

## Criterion 11.2

### Pack-only label questions — PACK_ASKS, 1-38 pages / 1-7 sites
Groups: `11.2 a11ylint PACK_ASKS form-control-programmatic-label-quality`, `11.2 a11ylint PACK_ASKS form-control-programmatic-label-quality + rgaa-title-placeholder-identical`, `11.2 a11ylint PACK_ASKS rgaa-title-placeholder-identical`, `11.2 a11ylint PACK_ASKS form-control-label-quality`, `11.2 arneo PACK_ASKS form-control-programmatic-label-quality + rgaa-title-placeholder-identical`, `11.2 stan PACK_ASKS form-control-programmatic-label-quality`, `11.2 stan PACK_ASKS form-control-programmatic-label-quality + rgaa-title-placeholder-identical`, `11.2 stan PACK_ASKS rgaa-title-placeholder-identical`, `11.2 stan PACK_ASKS form-control-label-quality`, `11.2 uuv PACK_ASKS form-control-programmatic-label-quality`, `11.2 uuv PACK_ASKS form-control-programmatic-label-quality + rgaa-title-placeholder-identical`, `11.2 uuv PACK_ASKS rgaa-title-placeholder-identical`, `11.2 uuv PACK_ASKS form-control-label-quality`
- **What differs:** the pack asks about title-only labels (11.2.2), a title that differs from the placeholder, and split or duplicated visible labels. The others have no 11.2 check, except ARNEO's page-wide one under the next heading.
- **Verdict:** PACK RIGHT. These are targeted questions (examples: Insee `title="Entrée de recherche"` with `placeholder="Rechercher"`; the CNIL label split across a visible and a hidden `<label>`), and only a person can judge relevance.

### ARNEO's 11.2 page-wide NC — ARNEO, OTHER_FAILS / OTHER_MORE_ELEMENTS / OTHER_ASKS, 48 / 2 / 72 pages
Groups: `11.2 arneo OTHER_ASKS arneo-11.2`, `11.2 arneo OTHER_FAILS arneo-11.2`, `11.2 arneo OTHER_MORE_ELEMENTS arneo-11.2`
- **What differs:** ARNEO sets NC on the page when any field anywhere has a non-empty title and placeholder that differ, and reports every field as an element. Otherwise it gives NT on every field that has a label.
- **Verdict:** OTHER WRONG.
  - Attribution: in every one of the 48 pages, one field caused the NC, while all the page's fields are listed.
  - Visibility: on 12 Nantes pages (pack inapplicable), the cause is `#MOTS_CLEFS` (`placeholder="Rechercher"`, `title="Recherche par mots-clés"`). Live on sciences-techniques it is in the closed search overlay (`checkVisibility()` false).
  - The glossary's "title and placeholder must be identical" is not a test. The pack's cantTell (`rgaa-title-placeholder-identical`, 11.2.2) is the right outcome where the field is shown.
- **Evidence:** the culprit field was computed for all 48 pages from ARNEO's stored element HTML: 35 pages where the pack asks on the same field, 12 on Nantes (hidden), 1 where the pack passes (Nantes, the same hidden field).
- **Bench note:** ARNEO's 11.2 elements are all fields, so element matching in `diff.mjs` is meaningless for ARNEO 11.2.

### 11.2.5 label in name — pack fails, others silent, 4 pages / 4 sites
Groups: `11.2 a11ylint PACK_FAILS rgaa-field-label-in-name-sources`, `11.2 arneo PACK_FAILS rgaa-field-label-in-name-sources`, `11.2 stan PACK_FAILS rgaa-field-label-in-name-sources`, `11.2 uuv PACK_FAILS rgaa-field-label-in-name-sources`
- **What differs:** the pack fails fields whose title does not contain the visible label.
- **Verdict:** PACK RIGHT under 11.2.5, condition 3 (« s'il est présent, le contenu de l'attribut title … contient au moins l'intitulé visible »).
- **Evidence:** all 12 elements reviewed:
  - BAD radios `title="title"` (visible "Mr."/"Mrs.")
  - Insee `title="Montant en francs, …"` (visible "Somme de départ")
  - Nantes radios `title="champ obligatoire"` (visible "M."/"Mme")
  - lenord `title="Rechercher"` (visible "Recherche"). This one is borderline: "Rechercher" contains "Recherche" as a substring but not as a word. The Nord audit does list 11.2 as NC.
- **Proposal (optional, pack, same rule):** when the visible label is a prefix of a word in the source (an inflection such as Recherche/Rechercher), ask instead of failing, as the rule already does for abbreviations. FP risk: none; it lowers certainty only for that case.

## Criteria 11.3 and 11.4

### ARNEO asks on every page with a field — ARNEO, OTHER_ASKS, 163 pages / 12 sites each
Groups: `11.3 arneo OTHER_ASKS arneo-11.3`, `11.4 arneo OTHER_ASKS arneo-11.4`
- **What differs:** the pack is silent. ARNEO returns NT whenever `document.querySelectorAll(fieldSelector)` is non-empty (`Criterion11_3.ts` and `Criterion11_4.ts`, `runTest`). It has no visibility filter, so the NT lands on 163 of 165 pages, mostly because of a header search field.
- **Verdict:** not worth adopting as-is. It is a blanket reminder, and none of the 11 audits lists 11.3 or 11.4 as NC.
- **Proposal (low priority, pack, new browser-only manual rule):** a targeted 11.4 check that compares the rendered boxes of each visible field and its visible label:
  - **Rule:** ask (cantTell, 11.4.2 or 11.4.3) when the label is not immediately above or left of the field (below or right for checkbox, radio and switch), or is more than about 1.5 line-heights away.
  - **FP risks:** floating labels, and the "visual presentation not radio/checkbox" particular case.

  For 11.3.1, a within-page check: two visible fields with the same `name`, `autocomplete` or `type="search"` whose labels differ → ask. 11.3.2 needs the multi-page crawl.

## Criterion 11.5

### Grouping of same-name inputs — pack asks (radios), stan fails, ARNEO asks, 1-74 pages
Groups: `11.5 a11ylint PACK_ASKS rgaa-radio-group-present`, `11.5 arneo OTHER_ASKS arneo-11.5`, `11.5 arneo PACK_ASKS rgaa-radio-group-present`, `11.5 stan OTHER_FAILS stan-11.5`, `11.5 stan PACK_ASKS rgaa-radio-group-present`, `11.5 uuv PACK_ASKS rgaa-radio-group-present`
- **What differs:**
  - The pack asks about same-name radios that are not in a fieldset, `role=group` or `role=radiogroup`: Bouygues `rd`, `sms`, `internet`, `paymentMethod`, and the BAD survey.
  - stan fails any same-name radio or checkbox set in a `<form>` that is not in a fieldset with a legend (`index.js:960-985`).
  - ARNEO asks on every page that has a field (`Criterion11_5.ts`, `runTest`).
- **Verdict:** BOTH PARTLY.
  - **stan is wrong:**
    - It ignores `role="radiogroup"`/`role="group"`, which 11.5.1 accepts (Bouygues color, capacity and plan, all in `div role="radiogroup"`).
    - It conflates 11.5 with 11.6: the unistra `/candidater` radios are inside fieldsets without a legend, the pack passes 11.5 there and asks 11.6.
    - It fails a criterion that applies "si nécessaire", which needs a person.
  - **stan is right that sets of same-name checkboxes are not checked by the pack:** Bordeaux agenda `name="city"` and `categories-agenda-metropolitain` (10+ each), and unistra `/fr/entites` `admin-domains[]` and others. The pack says inapplicable there, because `rgaa-radio-group-present` covers radios only.
- **Proposal (pack, `rules/manual/radio-group-present-manual.js`, or a sibling rule):**
  - **Rule:** extend the rule to 3 or more `<input type="checkbox">` with the same `name` (the `[]` suffix included) in the same form and not inside one fieldset, group or radiogroup.
  - **Outcome:** cantTell under 11.5.1.
  - **FP risks:** single opt-in checkboxes (excluded by the count) and frameworks that give every checkbox the same generic name.

## Criterion 11.6

### `aria-role-name-present` puts 11.6.1 on every role — pack fails, 19 pages / 3 sites
Groups: `11.6 a11ylint PACK_FAILS aria-role-name-present`, `11.6 stan PACK_FAILS aria-role-name-present`, `11.6 uuv PACK_FAILS aria-role-name-present`, `11.6 arneo PACK_FAILS aria-role-name-present`, `11.6 arneo PACK_MORE_ELEMENTS aria-role-name-present`
- **What differs:** the pack fails 11.6 on 19 pages through `aria-role-name-present`.
- **Verdict:** BOTH PARTLY. The rule's own note says « For role="radiogroup" only: 11.6.1 step 2 … » (`rule-map.js:123-130`). But mappings are per rule (`mappings.js` has no per-finding case filter), so every tree, grid, meter and progressbar finding also counts as an 11.6.1 failure:
  - **Pack wrong** on 17 of 19 pages:
    - 14 LCL pages: `<ng-progress role="progressbar">`
    - 3 Insee pages: `<ul role="tree" aria-labelledby="tab-searchbar">`, which is empty

    Neither is a grouping of fields, and the progressbar is already reported under 11.1.1.
  - **Pack right** on the radiogroup cases: Bouygues `div role="radiogroup"` with no aria-label or aria-labelledby (live: AX `radiogroup` with an empty name; the visible heading "La couleur" is not linked), Insee `#figure3_div_radio_graphique`, and LCL `form-field-radio-group`.
- **Evidence:** I tabulated all 26 elements by role (tree 3, progressbar 14, radiogroup 9) and loaded Bouygues and Insee live.
- **Proposal (pack, `rule-map.js`):** remove `11.6.1` from `aria-role-name-present`. Add a small pack rule, `rgaa-radiogroup-name-present`, that fails a `role="radiogroup"` holding 2 or more radio fields and having no aria-label or aria-labelledby that resolves to text. Map it to 11.6.1 (outcome fail; 11.6.1 step 3, per-field naming, makes it a cantTell when each radio's label names the group). The alternative is a per-finding `case` filter in `mappings.js`. FP risk: a radiogroup inside a fieldset with a legend (the rule already accepts the host's name).

### ARNEO's 11.6 and the pack's legend questions — ARNEO OTHER_FAILS / OTHER_MORE_ELEMENTS (18 / 16 pages), pack PACK_ASKS (2-3 pages)
Groups: `11.6 arneo OTHER_FAILS arneo-11.6`, `11.6 arneo OTHER_MORE_ELEMENTS arneo-11.6`, `11.6 a11ylint PACK_ASKS rgaa-field-group-legend`, `11.6 arneo PACK_ASKS rgaa-field-group-legend`, `11.6 stan PACK_ASKS rgaa-field-group-legend`, `11.6 uuv PACK_ASKS rgaa-field-group-legend`
- **What differs:** ARNEO fails any `[role=group]`/`[role=radiogroup]` whose `aria-labelledby` does not resolve with `getElementById` on the whole attribute value. It checks every group, with or without fields, including `display:none` ones (ARNEO's 74 failing elements break down as `div` 52, `ul` 24, `figure` 22, `fieldset` 8). Its fieldset branch is dead code: `Criterion11_6.ts:47` assigns `status = 'NC'` instead of `this.status`.
- **Verdict:** OTHER WRONG for ARNEO. It fails:
  - Insee `<figure role="group" aria-labelledby="figcaption-…">`
  - `ul role="group"` sub-menus
  - aria-labelledby lists with several ids

  None of these is a grouping of form fields (the glossary's "champs de même nature"). PACK RIGHT for the pack's questions:
  - Insee fieldsets whose `<legend>` is wrapped in a `<span>`, so it is not the fieldset's legend
  - unistra fieldsets with no legend
  - a Bouygues `role="group"` of filter chips

## Criterion 11.7

### ARNEO asks about legend relevance on every page with a group — ARNEO, OTHER_ASKS, 76 pages / 11 sites
Groups: `11.7 arneo OTHER_ASKS arneo-11.7`
- **Verdict:** a coverage gap, but not worth adopting as-is. ARNEO's NT fires for any fieldset or `role=group`, form-related or not (the same selector as 11.6).
- **Proposal (low, pack, manual rule):** ask (cantTell, 11.7.1) on each visible fieldset, `role=group` or `role=radiogroup` that holds 2 or more fields and has a legend or name, showing that text. It stays targeted because `rgaa-field-group-legend` already finds those groups. FP risk: none (it is a question).

## Criterion 11.9

### Button names — ARNEO OTHER_FAILS 75 pages / 10 sites, stan OTHER_FAILS 30 / 8 and OTHER_ASKS 43 / 4, pack fails 1 page
Groups: `11.9 arneo OTHER_FAILS arneo-11.9`, `11.9 stan OTHER_FAILS stan-11.9`, `11.9 stan OTHER_ASKS stan-11.9`, `11.9 a11ylint PACK_FAILS rgaa-form-button-name-present`, `11.9 uuv PACK_FAILS rgaa-form-button-name-present`, `11.9 arneo PACK_MORE_ELEMENTS rgaa-form-button-name-present`
- **What differs:** the pack checks only buttons inside `<form>`/`role=form`. It passes 76 pages and fails 1 (the Bordeaux agenda date-range picker). ARNEO fails 76 of the 80 pages that have a button. stan fails or asks on most pages. The audits list 11.9 NC for Bordeaux, Bouygues, Nantes and Nord.
- **How they do it:**
  - **ARNEO** (`Criterion11_9.ts:38-58`, `FormUtils.ts:61-63`, `112-158`, `160-178`):
    - It takes every `button, input[type=button|submit|reset|image], [role=button]` on the page, with no form scope and no visibility or aria-hidden filter.
    - It compares `tagName` with `'[role="button"]'` (`FormUtils.ts:146-147`, `173`), which never matches, so every `div role="button"` with text has no label. On Bouygues iPhone 15 alone that is 27 visible `div.radio-tile role="button"` elements named "Noir", "128 Go"…
    - It ignores `<img alt>` and svg titles inside a `<button>`.
    - For 11.9.2 it uses a case-sensitive `includes()` on `textContent`, sr-only text included.
    - It never sets `elementList`, so the bench stores no element for any of the 76 pages.
  - **stan** (`index.js:624-650`): all buttons on the page, no form scope, no visibility filter. Flagged examples: Île-de-France `input.d-none aria-hidden="true"`, impots `button.fr-hidden`, Caisse d'Épargne `style="display:none"`. It also asks on every icon-only button with a name.
- **Verdict:** BOTH PARTLY.
  - **ARNEO and stan are wrong** in mechanics: out-of-scope, hidden and named buttons are counted.
  - **The pack is right on its 1 failure:** live, the Bordeaux agenda `button.rdrNextPrevButton` elements (×2) are visible, in a `<form>`, and have an empty AX name.
  - **The pack is silent where real auditors are not.** Live:
    - Bouygues iPhone 15 has 3 visible, exposed `<button><img alt=""></button>` outside any form, with an empty AX name.
    - The lenord home has 23 buttons, of which 5 are visible and exposed and all named. stan's darkmode toggle, owl dots and close button were not visible.
    - Nantes sciences-techniques has 31 buttons, 11 visible, all named.

    So the audits' NC for Nantes and Nord is not reproducible on the sampled pages: it could be relevance (11.9.1), label in name (11.9.2), or states the bench did not open. Whether a human reads "formulaire" as "inside a `<form>`" decides the Bouygues case. 11.9.1 step 1 says « les boutons présents au sein d'un formulaire », and auditors often file a lone unnamed button under 11.9 (or 7.1).
- **Proposal:**
  1. **11.9.1 cantTell (pack, new rule or a branch of `rgaa-form-button-name-present`):** ask on a visible button exposed to assistive technologies whose accessible name is empty and that sits outside any `<form>`/`role=form`. Message: "Ce bouton n'a pas d'intitulé ; s'il fait partie d'un formulaire au sens du glossaire, 11.9.1 est non conforme (sinon voir 7.1.1)". This uses what core's `button-name-present` already computes. FP risks: decorative buttons hidden by CSS but not by AT (already filtered by visibility).
  2. **Pass to cantTell for icon-only buttons in forms:** for a button inside a form whose name comes only from aria-label, aria-labelledby, title or alt, with no visible text (stan's heuristic, `index.js:640-649`), ask about relevance under 11.9.1 instead of passing. A pass today asserts only that a label exists. FP risk: none (it is a question).
- **Bench fix:** ARNEO's 11.9 verdict is page-level with no elements. The bench could replicate `FormUtils` to recover the elements, but given the bugs above I would just flag ARNEO 11.9 as unreliable in `RESULTS.md`.

## Criterion 11.10

### Required fields — stan, OTHER_ASKS, 18 pages / 4 sites
Groups: `11.10 stan OTHER_ASKS stan-11.10`
- **What differs:** stan asks when a field has `required` but no `*`, "obligatoire" or "required" in the text of its label, aria-label or title, and no `aria-required="true"` (`index.js:896-912`). The pack has nothing on 11.10 (`docs/RGAA_MAPPING.md:358`).
- **Verdict:** a coverage gap worth adopting, but not stan's version.
  - The `required` attribute itself meets 11.10.1 condition 2, so stan's real question is 11.10.2: a visible indication in the label or the linked text.
  - stan wrongly lets `aria-required` short-circuit it. 11.10.2 still needs the visible indication.
  - It flags single-field search forms (lenord `inputSearch required`, 14 pages), which the 11.10 particular case makes not applicable.

  The audits list 11.10 NC on 5 of 11 sites (Insee, CNIL, Bouygues, LCL, unistra), although stan's hits fall mostly elsewhere (Bordeaux, lenord, impots; CNIL is the only overlap).
- **Proposal (pack, new automatic rule `rgaa-required-field-indication`):**
  - **Scope:** forms with 2 or more visible fields. For each visible field with `required` or `aria-required="true"`, read the visible label (`<label>`, aria-labelledby passages), the linked aria-describedby passages and the enclosing legend.
  - **Rule:** if none contains `*`, "obligatoire", "requis" or "required" (localized), ask (cantTell, 11.10.2). The technical note allows a sentence at the top of the form instead, so the rule cannot fail.
  - **Not covered:** 11.10.3 to 11.10.7 need the form to be submitted and are out of scope.
  - **FP risks:** a top-of-form "tous les champs sont obligatoires" (the message can name it), and an asterisk drawn in CSS `::after` (read the computed `content`).

## Criterion 11.11

### stan's input-type heuristics — stan, OTHER_ASKS, 58 pages / 11 sites
Groups: `11.11 stan OTHER_ASKS stan-11.11`
- **What differs:** stan asks when an id, name or placeholder matching search, tel or email has `type="text"` (`index.js:915-944`): 102 search, 12 tel and 1 email hits.
- **Verdict:** not worth adopting. 11.11 asks whether error messages suggest the expected type, format or examples, which the input type does not decide. 88% of the hits are search fields, where 11.11 is moot.
- **Proposal (low, pack, manual rule):** ask (cantTell, 11.11.1 and 11.11.2) on visible fields that carry a format constraint: `pattern`, `type=email|tel|url|date|number`, `inputmode`, or `min`/`max`/`maxlength` with a hint. Question: "after a wrong entry, does the error suggest the expected format or an example?" It is targeted, and LCL and unistra are NC on 11.11.

## Criterion 11.13

### Missing autocomplete on personal-data fields — stan, OTHER_ASKS, 19 pages / 6 sites
Groups: `11.13 stan OTHER_ASKS stan-11.13`
- **What differs:** stan asks when `id + name + placeholder` matches `/(name|nom|surname|firstname|email|mail|tel|phone)/` and the field has no `autocomplete` (`index.js:945-955`). The pack only checks that an existing `autocomplete` value is valid (core `autocomplete-valid`, 11.13.1). It is inapplicable on 159 of 165 pages.
- **Verdict:** a coverage gap worth adopting. The audits list 11.13 NC on 5 of 11 sites (CNIL, Bouygues, LCL, unistra, Nantes). But stan's regex is poor: 41 hits, and the 14 I listed include Bouygues checkboxes `telephoneAvec`/`marque`, CNIL `nombre_de_personnes_attendues` ("nom" in "nombre"), comparator checkboxes, and a search field.
- **Proposal (pack, new automatic rule `rgaa-autocomplete-present`):**
  - **Scope:** visible text-like inputs only (text, email, tel, url, no type), plus selects.
  - **Signals:** `type=email` or `type=tel`, or a whole-word match on the visible label or name for nom, prénom, nom de naissance, courriel, e-mail, adresse électronique, téléphone, adresse, code postal, ville, commune, pays, date de naissance, organisation or société.
  - **Outcome:** cantTell under 11.13.1 condition 1 when the field has no `autocomplete`. Fail is possible when `type=email`/`type=tel` and the form is not a search form, but cantTell is safer, since 11.13 only covers data « concernant l'utilisateur » (a contact form about a third party is out of scope).
  - **FP risks:** search fields (exclude `type=search`, `role=search` ancestors and `name=q|s|search`), and fields about other people.

## Criterion 12.1

### stan's "12.1" is a skip-link check — stan, OTHER_ASKS, 29 pages / 4 sites
Groups: `12.1 stan OTHER_ASKS stan-12.1`
- **What differs:** stan emits 12.1 cantTell "Aucun lien d'évitement détecté" when no `a[href^="#"]` contains contenu, navigation, skip, aller or accès (`index.js:1004-1027`).
- **Verdict:** NOT A REAL DIFFERENCE. 12.1 is about two navigation systems (menu, site map, search). This check belongs to 12.7, where it largely agrees with the pack: stan's 29 pages are Bordeaux 13, Bouygues 14, Insee 1 and Nantes 1, and the pack fails 12.7 on all Bordeaux pages and 12 of the 14 Bouygues pages.
- **Fix:** in `engines.mjs` `runStan`, remap stan's 12.1 to 12.7, using the mapping in `vendor/stan/docs/RGAA-mapping.md`.
- **Proposal (low, pack, manual rule):** a real 12.1.1 helper that detects:
  - a `nav` menu
  - a search engine (`role=search`, `input[type=search]`, a form with a recherche or search action)
  - a link whose text is "plan du site"

  With fewer than two of them, ask (cantTell, 12.1.1). No audit lists 12.1 as NC, so the value is low.

## Criterion 12.6

### Zones reachable — pack only, PACK_ASKS, 71 pages / 10 sites
Groups: `12.6 a11ylint PACK_ASKS rgaa-page-zones-reachable`, `12.6 arneo PACK_ASKS rgaa-page-zones-reachable`, `12.6 stan PACK_ASKS rgaa-page-zones-reachable`, `12.6 uuv PACK_ASKS rgaa-page-zones-reachable`
- **Verdict:** PACK RIGHT. No other engine covers 12.6.1. The pack's questions are per zone and say why: no landmark, no heading, no link (for example the unistra search `<form>` with no `role=search`), or a heading or internal link to verify. I reviewed all 6 message variants. LCL, the only 12.6 NC in the audits, gets asks on 3 of its 14 pages.

## Criterion 12.7

### Skip link — pack only, PACK_FAILS 53 pages / 4 sites, PACK_ASKS 10-77 pages
Groups: `12.7 a11ylint PACK_ASKS rgaa-skip-link-placement`, `12.7 a11ylint PACK_FAILS rgaa-skip-link-present`, `12.7 a11ylint PACK_ASKS rgaa-skip-link-placement + skip-link`, `12.7 a11ylint PACK_ASKS rgaa-skip-link-present`, `12.7 arneo PACK_ASKS rgaa-skip-link-placement`, `12.7 arneo PACK_FAILS rgaa-skip-link-present`, `12.7 arneo PACK_ASKS rgaa-skip-link-placement + skip-link`, `12.7 arneo PACK_ASKS rgaa-skip-link-present`, `12.7 stan PACK_ASKS rgaa-skip-link-placement`, `12.7 stan PACK_FAILS rgaa-skip-link-present`, `12.7 stan PACK_ASKS rgaa-skip-link-placement + skip-link`, `12.7 stan PACK_ASKS rgaa-skip-link-present`, `12.7 uuv PACK_ASKS rgaa-skip-link-placement`, `12.7 uuv PACK_FAILS rgaa-skip-link-present`, `12.7 uuv PACK_ASKS rgaa-skip-link-placement + skip-link`, `12.7 uuv PACK_ASKS rgaa-skip-link-present`
- **What differs:** no other engine reports 12.7 (stan's check sits under 12.1, see above). The pack fails Bordeaux (13 pages), Bouygues (12), LCL (14) and unistra (14).
- **Verdict:** PACK RIGHT on 39 pages, PACK FALSE POSITIVE on the 14 unistra pages.
  - **Bordeaux:** live on `/agenda`, the page has no same-page link at all and 3 `nav` elements before `<main id="MainWrapper">`. The 12.7.1 failure is right, although the 2024 audit does not list 12.7, so the site has probably changed.
  - **Bouygues:** no skip link, and stan agrees. The audit lists 12.7 as NC.
  - **LCL:** "Aller au contenu" points to `#main-content`, which does not exist. The audit lists 12.7 as NC. 12.7.2's « le lien est fonctionnel » fails as well.
  - **unistra:** live on `/fr/contact`, `<a href="#main-content">Passer au contenu principal</a>` is the first link. Its target `<a id="main-content" tabindex="-1">` is inside `<main role="main">`, right after the breadcrumb `<nav aria-label="Fil d'ariane">` (2 links). That link does give access to the main content zone (12.7.1: « un lien permet-il … d'y accéder »).

    In `rules/automatic/rgaa-skip-link-present.js`, for a target inside `<main>`, `between()` (line 234) scans from the start of `main` to the target and sets `navigation: true` because of the breadcrumb. The condition at line 341, `if (!usable || (path && !path.navigation && !inNavigation))`, then neither passes nor asks: the link is silently dropped. The rule falls through to the line 376 "navigation precedes main, no link" fail. The unistra home page puts the anchor first in `<main>`, which is why it only gets cantTell. The unistra audit does list 12.7 as NC, but nothing ties that to 12.7.1. Visibility on focus (12.7.2) is the likelier cause.
- **Proposal (pack, `rgaa-skip-link-present.js`):** for a target inside `main` (`dom.contains(main, target)`), do not apply the "navigation between" exclusion, which was written for targets before the zone. A target inside `main` with only a breadcrumb, or other nav or focusable content inside `main` before it, should pass. Alternatively, push the existing `skipLinkTargetNotMain` question (cantTell). Never drop it silently. FP risk: a link to an in-page table of contents placed inside main. That is acceptable, since it still reaches the zone.
- **Also:**
  - On LCL, core's `skip-link` says « La cible … n'existe pas » on 1 page and asks on the others. On the unistra contact page it says « existe mais qu'on ne peut pas atteindre pour l'instant » about a reachable `tabindex="-1"` anchor. The theme owning core `skip-link` may want to look at its reachability test for zero-size `tabindex=-1` anchors.
  - The asks (`rgaa-skip-link-placement`, `rgaa-skip-link-present` on pages with no `<main>`) are targeted and fine.

## Criteria 12.8 and 12.9

### Always-on keyboard reminder — pack PACK_ASKS on 165 pages; stan "pass" on 12.8
Groups: `12.8 a11ylint PACK_ASKS manual-review`, `12.8 arneo PACK_ASKS manual-review`, `12.8 stan PACK_ASKS manual-review`, `12.8 uuv PACK_ASKS manual-review`, `12.9 a11ylint PACK_ASKS manual-review`, `12.9 arneo PACK_ASKS manual-review`, `12.9 stan PACK_ASKS manual-review`, `12.9 uuv PACK_ASKS manual-review`
- **Verdict:** NOT A REAL DIFFERENCE, and the pack is right to ask. 12.8.1 and 12.9.1 need keyboard testing. stan's 12.8 "pass" is a good_signal for "Aucun tabindex > 0" (`index.js:1031-1046`). The bench turns that into pass, but it does not establish tab-order coherence: the audits list 12.8 NC on 9 of 11 sites.
- **Bench fix:** in `engines.mjs`, map stan `good_signal` entries that have `manualReviewRecommended: false` and cover a whole criterion (12.8) to no verdict, or to cantTell, not pass.

## Improvements
| # | Criterion | From | Change | Where | Outcome | Effort | Value |
|---|---|---|---|---|---|---|---|
| 1 | 11.6.1 | pack bug | Remove 11.6.1 from `aria-role-name-present` (tree/progressbar/grid/meter findings counted as 11.6 failures on 17 of 19 pages); add `rgaa-radiogroup-name-present` (radiogroup holding 2 or more radios with no aria-label or aria-labelledby) → 11.6.1 | pack `rule-map.js:123-130` + new rule | fail | S | High |
| 2 | 12.7.1 | pack bug | For a skip-link target inside `<main>`, ignore navigation (breadcrumb) between the start of main and the target: pass, or ask with `skipLinkTargetNotMain`; never drop silently (unistra, 14 false failures) | pack `rules/automatic/rgaa-skip-link-present.js:227-235, 341` | pass / cantTell | S | High |
| 3 | 11.13.1 | stan (refined) | New `rgaa-autocomplete-present`: visible text-like field whose type (email/tel) or whole-word label (nom, prénom, courriel, téléphone, adresse, code postal…) says personal data, with no `autocomplete`; exclude search | pack, new automatic rule | cantTell | M | High (NC in 5 of 11 audits) |
| 4 | 11.10.2 | stan (refined) | New `rgaa-required-field-indication`: in forms with 2 or more fields, a `required`/`aria-required` field whose visible label, describedby text or legend has no `*`/obligatoire/requis | pack, new automatic rule | cantTell | M | High (NC in 5 of 11 audits) |
| 5 | 11.9.1 | ARNEO/stan, audits | Ask on visible, exposed, unnamed buttons outside any form (Bouygues image buttons with `alt=""`); and ask on relevance for icon-only buttons in forms instead of passing | pack `rgaa-form-button-name-present.js` (new branch), reusing core `button-name-present` | cantTell | S | Medium-High |
| 6 | 11.2.1 / 11.2.2 | a11ylint/stan | When the only 11.1.1 source is an empty `<label for>` or empty `title` and the AX name is empty, also fail 11.2.1 / 11.2.2 (Bouygues payment radios, Nantes `#q`) | pack `rgaa-field-label-listed-source.js` (`emptySource`, line 308) | fail | S | Medium |
| 7 | 11.5.1 | stan | Extend same-name grouping check to 3 or more checkboxes (Bordeaux `city`, unistra `admin-domains[]`) | pack `rules/manual/radio-group-present-manual.js` | cantTell | S | Medium |
| 8 | 11.1.1 | pack review | Exempt (or ask on) `<output>` with no `for`/form owner used as an aria-live or sr-only region; give duplicated-id label failures their own message | pack `rgaa-field-label-listed-source.js` | — / message | S | Low |
| 9 | 11.2.5 | pack review | Ask instead of fail when the visible label is a word-prefix of the source (Recherche vs Rechercher) | pack `rgaa-field-label-in-name-sources.js` | cantTell | S | Low |
| 10 | 11.4.2 / 11.4.3 | ARNEO (refined) | Browser geometry check: label not above or left (below or right for checkbox, radio and switch) or far from its field | pack, new manual rule | cantTell | M | Low-Medium |
| 11 | 11.11.1 / 11.11.2 | stan (refined) | Ask on fields with a format constraint (`pattern`, email/tel/date/number types) whether errors suggest the format | pack, new manual rule | cantTell | S | Low-Medium |
| 12 | 11.7.1 / 11.3.1 / 12.1.1 | ARNEO/stan (refined) | Targeted questions: legend relevance on field groups only; same-function fields with differing labels on a page; fewer than two navigation systems detected | pack, manual rules | cantTell | S each | Low |
| 13 | bench | uuv | uuv 11.1 is a stub (`form.query.js:55-81` returns `[]`): drop it | `engines.mjs` `runUuv` | — | XS | High (removes 46+36 fake disagreements) |
| 14 | bench | stan | Remap stan 12.1 to 12.7; do not turn stan's 12.8 good_signal "no tabindex>0" into pass | `engines.mjs` `runStan` | — | XS | Medium |
| 15 | bench | ARNEO | Mark ARNEO 11.1, 11.2 and 11.6 element lists as page-level (every field or group) and 11.9 as element-less, so `diff.mjs` does not compare elements for them | `engines.mjs` / `diff.mjs` | — | S | Medium |
