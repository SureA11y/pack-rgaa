# Theme 8: Mandatory elements (Éléments obligatoires)

## Summary
There are 131 groups across 8.1–8.10. The full id lists are in the Appendix. They fall under 9 headings:
- **PACK RIGHT** (4 headings, 111 groups):
  - 8.2 PACK_FAILS (96 groups)
  - 8.2 PACK_ASKS (8)
  - 8.6 PACK_ASKS (6)
  - 8.10 OTHER_ASKS (2), whose questions aren't worth adopting
- **BOTH PARTLY** (2 headings, 3 groups): 8.4 and 8.8.
- **OTHER RIGHT, partly** (1 heading, 2 groups): 8.7.
- **NOT A REAL DIFFERENCE** (2 headings, 13 groups):
  - 8.1/8.3/8.5 on 2 pages (11 groups)
  - 8.2 stan PACK_MORE_ELEMENTS (2)
- **Known inversion** (1 group): a11ylint 8.1.3. Skipped.

Main takeaways:
1. **8.2: no false positives found.** The pack's 8.2 failures (145 of 165 pages, 1,957 findings) are real 8.2.1 errors. I reviewed every distinct message × element pattern (about 60 buckets that cover all the findings) and checked 2 live. Each pattern matches a W3C Nu error the pack's tests document against Nu 26.9.27. None of the other engines checks 8.2.1: uuv, a11ylint and arneo are silent, and stan's "pass" only means a `<meta charset>` exists.
2. **The pack says "pass" on 8.4, 8.8 and 8.10 while checking only validity.** Each of these criteria also has a "pertinent" condition, which no rule checks. uuv and arneo ask instead. Asking on every page is noise. The fix is a targeted question: on 8.8, ask only on real language changes, and on 8.4, use a stopword check.
3. **8.7 has no pack rule, so the pack gives no verdict on any page.** A targeted heuristic is worth adding: own text with a foreign stopword profile and no matching `lang`. Live, it found 3 unmarked English passages on unistra.fr/fr/faq and correctly ignored impots.gouv.fr's English passages, which already carry `lang="en"`.
4. **Bench bug in `run.mjs`.** The `blocked` check runs only on the first engine's load. On insee 2016815 and caisse-epargne secur-famille-2, later engines saw a document with no doctype, lang or title. Reloaded live 3 and 2 times, both pages are normal now.

## Criterion 8.1 (also 8.3 and 8.5)
### a11ylint 8.1.3 inversion — a11ylint, OTHER_FAILS, 159 pages / 12 sites
Groups: `8.1 a11ylint OTHER_FAILS RGAA - 8.1.3`
- **Verdict:** OTHER WRONG. This is the known inversion, already triaged, so it is skipped here.

### Doctype, lang and title "missing" on 2 pages — all four engines, OTHER_FAILS, 1–2 pages / 1–2 sites
Groups: the 11 ids of heading B in the Appendix (8.1, 8.3 and 8.5 for a11ylint, arneo, stan and uuv).
- **What differs:** The two pages are https://www.insee.fr/fr/information/2016815 and https://www.caisse-epargne.fr/assurer/secur-famille-2/.
  - The pack passes 8.1, 8.3 and 8.5 on both.
  - The others fail them: "DOCTYPE absent", "Attribut lang absent", "Page sans `<title>`" (title on Insee only).
- **Verdict:** NOT A REAL DIFFERENCE. The other engines ran on a different document.
- **Evidence:**
  - On Insee, a11ylint, arneo and stan return only 3 to 6 findings in total, against 415 for uuv on the same page. On Caisse d'Epargne, uuv (31 findings) also saw the broken document.
  - Live: I reloaded Insee 3 times and Caisse d'Epargne 2 times in fresh contexts, 3.5 s apart. Every load had a doctype, `lang="fr"` (or `fr-FR`), the right title and full text (2,781 and 11,298 characters).
  - `run.mjs:46-63` opens a fresh context and `goto` per engine, but computes `loaded`/`blocked` only on the first load (`if (!loaded)`). A transient block or interstitial page on a later engine's load goes unnoticed.
- **Proposal (bench, `run.mjs`):**
  - Run the `blocked` check (status, title regex, `textLength < 200`) on every engine's load.
  - Also compare doctype presence, `<html lang>` and title with the first load.
  - On a mismatch, store `{error: 'page differs from first load'}` for that engine, or retry once, so the page drops out of the comparison.

## Criterion 8.2
### Pack 8.2.1 failures — vs uuv/a11ylint/arneo (none) and stan (pass), PACK_FAILS, 1–31 pages per group, 145 pages / 11 sites in total
Groups: the 96 ids of heading C in the Appendix (every 8.2 PACK_FAILS group, for all four engines).
- **What differs:**
  - The pack fails 8.2 on 145 pages, through five rules: `rgaa-aria-role-conformance` (549 findings / 69 pages), `rgaa-aria-attribute-conformance` (348 / 73), `rgaa-html-nesting-valid` (400 / 47), `duplicate-id` (316 / 58, a core rule) and `rgaa-html-elements-attributes-valid` (179 / 62).
  - uuv, a11ylint and arneo have no 8.2 check.
  - stan's only 8.2 check is the presence of `<meta charset>` (`vendor/stan/cli/src/rules/index.js:737-755`). That isn't a test of 8.2.1, which asks for the validator on the generated source: valid writing, nesting, opening/closing, unique ids, no duplicated attributes.
- **Verdict:** PACK RIGHT. Every pattern I reviewed is an error the W3C Nu checker reports, and RGAA 8.2.1 relies on that checker. Hidden content is correctly included, since the validator reads the whole generated source.
- **Evidence:** I grouped all 1,957 pack 8.2 findings by message × element and read the stored snippets of every group (about 60 buckets).

  **`rgaa-aria-role-conformance`**
  - `<summary role="button">` (162 findings, Bordeaux and Bouygues). ARIA in HTML allows no role on a `<details>` `<summary>`. This is fixture case 10.
  - `<li role="group">` in an Owl carousel `<ul>` (161, Nord). `<li role="menuitem">` and `<li role="presentation">` in a plain `<ul>` (139 + 12). Nu rejects any role other than listitem on an `<li>` whose parent `<ul>`/`<ol>` has no role. The rule judges only that case (`rgaa-aria-role-conformance.js:327-334`).
  - `<ul role="region">` (39, Caisse d'Epargne).
  - `<option role="tab">` (16, Insee).
  - `<select role="listbox">` (1).
  - Unknown tokens `role="section-h2"` (LCL) and `role="nav"` (Insee).
  - `<img alt="" role="button">` (1).
  - `<img role="presentation" alt="Coché : ">` (2).
  - `<img alt="" role="presentation">` is only a question (cantTell, 12), which is the right caution given RGAA 1.2.1.

  **`rgaa-aria-attribute-conformance`**
  - `aria-label` on a `<span>`/`<div>`/`<p>` with no role (176 + 47 + 1). An example is `<span class="arrowPager" aria-hidden="true" aria-label="Page suivante">`.
  - `aria-labelledby` on a `<div>` with no role and on `<abbr>` (63 + 12).
  - `aria-label` on an `<a>` with no href (6).
  - `aria-label` on `<i role="presentation">` (2).
  - `aria-expanded` and `aria-readonly` on a `<div>` with no role (7 + 7).
  - `aria-checked` on `<input type="checkbox">` (4).
  - `aria-expanded=" true"` and `aria-hidden=" false"` (3 + 3): a leading space makes the value invalid.
  - `role="combobox"` without `aria-expanded` (17).

  **`rgaa-html-nesting-valid`**
  - `<a>` in a `<button>` (126).
    - Live on Bordeaux: `<button class="menu-item__label"><a href="https://sedeplacer…">`, in a hidden menu.
    - Live on CNIL /les-sanctions-prononcees-par-la-cnil: 77 links inside `<button class="glossary-tooltips">`, whose tooltip `<div>` holds links. Both match the stored findings.
  - `<li>` in a `<div>`, an `<a>` or a custom element (60 + 35 + 12).
  - `<div>`, `<ul>`, `<hr>` or `<cb-article-thumbnail>` as a direct child of a `<ul>` (49 + 16 + 1 + 12).
  - An element with tabindex inside an `<a>`/`<button>` (20 + 5).
  - `<button>`, `<input>` or `<label>` inside an `<a>` (17 + 12 + 12).
  - `<dl>`/`<dt>`/`<dd>` grouping errors (12 + 1).
  - A second visible `<main>` (6). The validator ignores CSS, so this is an error.

  **`rgaa-html-elements-attributes-valid`**
  - Obsolete `<font>`, `<acronym>`, `<big>` and `<nobr>` on BAD *before* (102). The page has no doctype, and Nu checks it as HTML5.
  - `autocomplete="off"` on Drupal's `<input type="hidden" name="form_build_id">` (37, 5 sites). A hidden input takes only an autofill anchor mantle, so on/off is an error. Test `rgaa-html-elements-attributes-valid.test.js:231` covers the same case.
  - `autocomplete` on a radio (2).
  - `autocomplete="chrome-off-…"` (2).
  - `id=""` (25).
  - `id="128 Go"` and `id="Points forts-tab"` (5).
  - Unknown `<paragraphe>` and `<swiper>` (2).

  **`duplicate-id`**
  - The same id on 2 to 25 elements of one tree: `Layer_1`/`Capa_1` in inline SVGs, Drupal `edit-submit`, `lien-N`, GUIDs. Test 8.2.1 condition 4 requires unique ids.

  Overall, I found no pack false positive. The other engines simply have no coverage here.
- **Proposal:**
  - Pack: no change.
  - Bench (`engines.mjs` or `diff.mjs`): stop counting stan's 8.2 `good_signal` ("Encodage déclaré") as a 8.2 pass. It isn't a test of 8.2.1, and it turns about 100 groups into "pack fails, other passes" disagreements.
  - Optional: if the bench ran Nu once per page and passed the report as the `validator.report` probe, `rgaa-markup-validation-review` would fail or pass on it, and the asks below would disappear.

### Pack asks for the validator — PACK_ASKS, 16 + 4 pages / 3 + 1 sites
Groups: the 8 ids of heading D (`rgaa-markup-validation-review`, and `rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid + rgaa-markup-validation-review`, for each engine).
- **What differs:**
  - On 16 pages, the pack's automatic 8.2 rules found nothing, so 8.2 is cantTell through `rgaa-markup-validation-review` ("passez le code source généré au validateur").
  - On BAD *after* (4 pages, XHTML doctype), the HTML5 rules also ask (`otherDoctype`).
- **Verdict:** PACK RIGHT.
  - Test 8.2.1 conditions 3 and 5 (opening/closing of tags, duplicated attributes) can't be seen in the DOM after parsing, so without a validator report a pass would overclaim.
  - Judging XHTML 1.0 against HTML5 rules would be wrong ("selon le type de document spécifié").

### stan PACK_MORE_ELEMENTS — stan, 4 + 1 pages / 2 sites
Groups: `8.2 stan PACK_MORE_ELEMENTS rgaa-html-elements-attributes-valid`, `8.2 stan PACK_MORE_ELEMENTS duplicate-id + rgaa-aria-attribute-conformance + rgaa-html-nesting-valid`
- **Verdict:** NOT A REAL DIFFERENCE. stan's failure is page-level, with no element ("meta charset absent"), on BAD *before* and Insee 2016815. The pack fails elements. Nothing can match. This disappears with the stan 8.2 fix above.

## Criterion 8.4
### Default-language relevance — uuv, OTHER_ASKS, 160 pages / 12 sites
Groups: `8.4 uuv OTHER_ASKS 8.4.1`
- **What differs:**
  - uuv asks on every `html[lang]` ("attributes lang, xml:lang must be relevant"; `@uuv/a11y/.../rules/8-required-element.js:44-55`).
  - The pack passes 161 pages through `rgaa-html-lang-code-valid` and `html-xml-lang-mismatch`. Those check only the "valide" condition. The rule-map note says "Relevance … is not judged".
- **Verdict:** BOTH PARTLY.
  - uuv is right that test 8.4.1 has two conditions ("Le code de langue est valide ; Le code de langue est pertinent"), so the pack's "pass" claims more than it checked.
  - The pack is right not to ask on every page. Every corpus page is French with `lang="fr"`/`fr-FR`, so 160 questions would be pure noise.
- **Proposal (pack, `rgaa-html-lang-code-valid` or a new `rgaa-html-lang-relevance`):**
  - Logic: a stopword profile of the visible body text (fr, en, de, es, it, nl, pt; 20 to 30 function words each, at least 50 words of text). If the dominant language clearly differs from the primary subtag of `<html lang>`, the outcome is cantTell. If they agree, pass, and the note says relevance was judged by this heuristic. If there is too little text, cantTell.
  - RGAA test: 8.4.1, condition "pertinent".
  - FP risks: multilingual pages, and pages that are mostly a data table or code. The volume is tiny: none of the 165 pages would be flagged.

## Criterion 8.6
### Title relevance and uniqueness — a11ylint/arneo/stan (none), PACK_ASKS, 163 + 2 pages / 12 sites
Groups: the 6 ids under heading 8.6 (`rgaa-page-title-unique` and `page-title-patterns + rgaa-page-title-unique`, for each engine).
- **Verdict:** PACK RIGHT. Test 8.6.1 (pertinent: "claire, concise et unique") can't be decided automatically. uuv asks too (8.6.1, manual), so only the silent engines differ.
- **Evidence:**
  - `rgaa-page-title-unique` asks because the bench gives no other page titles ("Seule cette page était disponible").
  - `page-title-patterns` (core) asks on 2 home pages, "Accueil - Insee - …" and "Accueil | Université de Strasbourg". Those are conventional, compliant home-page titles, so this is a mild over-question. It is harmless as cantTell.
- **Proposal:**
  - Bench: pass each site's corpus titles as `crawl.pageTitles`, so uniqueness is actually judged.
  - Core `page-title-patterns`, optional: don't ask about "Accueil | <site>" when the URL path is `/` or `/accueil`.

## Criterion 8.7
### Language changes not indicated — uuv (165 pages / 12 sites) and arneo (83 / 9), OTHER_ASKS
Groups: `8.7 arneo OTHER_ASKS arneo-8.7`, `8.7 uuv OTHER_ASKS 8.7.1`
- **What differs:**
  - The pack has no 8.7 rule (RGAA_MAPPING.md:312 "—"), so it gives no verdict on any page.
  - uuv asks on `<html>` on every page (`8-required-element.js:79-90`).
  - arneo returns NT on pages that have `[lang]:not(html)` and highlights those elements (`Criterion8_7.ts:26-49`). Those are the changes that *are* marked, while 8.7.1 is about text that *lacks* a marker.
- **Verdict:** OTHER RIGHT, partly. Test 8.7.1 always needs a human, and an RGAA report needs a verdict, so the pack's silence is a gap. Neither engine's question is well targeted, though: uuv asks on every page, and arneo points at the wrong elements.
- **Evidence (live, 3 pages, with a stopword heuristic run in the page):**
  - On impots.gouv.fr/international, 3 English passages were found, all already inside `lang="en"`, so they were correctly not flagged.
  - On unistra.fr/fr/faq, 3 unmarked English link texts were found in a hidden menu, such as "Shaping Training and Research Talents at the University of Strasbourg" and "European Partnership for an Innovative Campus Unifying Regions (Epicur)". These are programme names, so they are a borderline proper-name case and a legitimate question.
  - On univ-nantes.fr/formation/orientation-parcours-metiers, 0 were found.
- **Proposal (pack, new manual rule `rgaa-language-change-review`):**
  - Logic: for text elements (p, li, td, th, h1–h6, a, button, label, figcaption, blockquote, dd, dt, span) whose own text has at least 5 words, compute the stopword profile. Flag the element when another language dominates (at least 2 hits and more than twice the hits of the inherited language), and when that language differs from the primary subtag of the nearest `[lang]`. Give a page-level cantTell reminder when nothing is flagged, as core's `manual-review` does for 10.7.
  - Outcome: cantTell per flagged element.
  - RGAA test: 8.7.1.
  - FP risks: proper names and dictionary loanwords (both particular cases of 8.7), mixed-language sentences, and short UI strings (excluded by the 5-word minimum). Effort is low to medium: a stopword table and one pass over the text.

## Criterion 8.8
### Relevance of language-change codes — uuv (84 pages / 9 sites) and arneo (83 / 9), OTHER_ASKS
Groups: `8.8 arneo OTHER_ASKS arneo-8.8`, `8.8 uuv OTHER_ASKS 8.8.1`
- **What differs:**
  - The pack passes 76 pages through `valid-lang` (core). That checks only that the primary subtag is registered (the "valide" condition).
  - uuv asks on every `:not(html)[lang]` (`8-required-element.js:91-103`).
  - arneo applies a regex for validity and otherwise returns NT on the same elements (`Criterion8_8.ts:42-56`).
- **Verdict:** BOTH PARTLY.
  - The others are right that 8.8.1 also requires "Le code de langue est pertinent", which the pack's pass claims without checking.
  - Many of their questions are not about language changes at all:
    - `lang="fr"` on tarteaucitron's `#tarteaucitronRoot` in a French page (70 occurrences on CNIL, Île-de-France and Bordeaux)
    - `<span lang="fr">Facebook</span>`
    - `<td lang="fr">Les Garçons</td>` on BAD
  - Most of the rest are obviously relevant: language-switcher links such as `<a lang="en">English</a>` (Insee, Nantes), and English paragraphs with `lang="en"` (impots.gouv.fr).
- **Evidence:** I reviewed all 36 distinct elements the two engines flag.
- **Proposal:**
  - Where: pack (an RGAA wrapper), or core `valid-lang`, which produces the 8.8 finding.
  - Logic:
    - An element whose primary subtag equals the inherited language isn't a change, so it is not applicable for 8.8.
    - For a real change, pass when the own text is the language's autonym (English, Deutsch, Español, Italiano, Nederlands, Português, 中文, العربية…) or its stopword profile matches the declared language.
    - Otherwise cantTell.
  - Outcome: cantTell.
  - RGAA test: 8.8.1, condition "pertinent".
  - FP risk: short or proper-noun text. That only produces a question.

## Criterion 8.10
### dir relevance — uuv (72 pages / 8 sites) and arneo (9 / 5), OTHER_ASKS
Groups: `8.10 arneo OTHER_ASKS arneo-8.10`, `8.10 uuv OTHER_ASKS 8.10.2`
- **What differs:**
  - uuv asks on every `[dir=rtl],[dir=ltr]`, `<html>` included (`8-required-element.js:115-124`).
  - arneo returns NT on every `[dir]:not(html)` (`Criterion8_10.ts:27-55`).
  - The pack passes, through `rgaa-dir-attribute-valid`.
- **Verdict:** PACK RIGHT. The questions aren't worth adopting.
  - All 89 uuv elements and all of arneo's are `dir="ltr"` in left-to-right French pages: 67 on `<html>`, plus Highcharts and mCustomScrollbar containers and Google Docs paste `<p dir="ltr">`. There are 0 `dir="rtl"`.
  - None of them is a change of reading direction, which is what 8.10.2 covers.
- **Proposal (optional, pack `rgaa-dir-attribute-valid`):** give cantTell only when the declared direction contradicts the first strong character of the element's text. For example, `dir="rtl"` on Latin-only text, or `dir="ltr"` on Arabic or Hebrew text. The rule already computes strong characters for `dir="auto"`. There would be 0 cases in this corpus, so the value is low.
  - A related gap, raised by no engine: 8.10.1, right-to-left text with no `dir="rtl"` ancestor. It is detectable from the same strong-character table, as cantTell.

## Improvements
| # | Criterion | From | Change | Where | Outcome | Effort | Value |
|---|---|---|---|---|---|---|---|
| 1 | 8.1/8.3/8.5 (all) | triage | Run the blocked check on every engine's load; compare doctype, lang and title with the first load, then retry once or mark the engine errored | bench `run.mjs:46-63` | n/a | S | High (removes false "other fails", and probably affects other themes on these 2 pages) |
| 2 | 8.2 | triage | Don't count stan's `meta charset` good_signal as an 8.2 pass; drop it from the comparison | bench `engines.mjs` (stan mapping) or `diff.mjs` | n/a | S | Medium (about 100 misleading groups) |
| 3 | 8.2 | triage | Optionally run Nu once per page and pass the report as the `validator.report` probe | bench | fail/pass | M | Medium (resolves the 20 asks) |
| 4 | 8.7 | uuv/arneo (idea), improved | New `rgaa-language-change-review`: stopword heuristic on own text with no matching `[lang]`, plus a page-level reminder | pack, new manual rule | cantTell | M | Medium (the pack has no 8.7 output at all) |
| 5 | 8.8 | uuv/arneo | Treat a `lang` equal to the inherited language as no change; on real changes, pass on an autonym or matching stopwords, else cantTell | pack wrapper or core `valid-lang` | cantTell | S–M | Medium (stops a pass that claims relevance) |
| 6 | 8.4 | uuv | Check the main language with stopwords against `<html lang>`; cantTell on a mismatch or too little text | pack `rgaa-html-lang-code-valid` or new rule | cantTell | S | Low–Medium (correctness of the pass) |
| 7 | 8.6 | triage | Pass each site's corpus titles as `crawl.pageTitles`; optionally don't ask `page-title-patterns` about "Accueil \| site" on `/` | bench; core `page-title-patterns` | fail/pass | S | Low |
| 8 | 8.10 | triage | cantTell when `dir` contradicts the text's strong characters; detect RTL text with no `dir` (8.10.1) | pack `rgaa-dir-attribute-valid` | cantTell | S | Low (0 cases here) |

## Appendix: group ids by heading
- **A:** a11ylint 8.1.3
- **B:** 8.1/8.3/8.5 bench artifact
- **C:** 8.2 PACK_FAILS
- **D:** 8.2 PACK_ASKS
- **E:** 8.2 stan PACK_MORE_ELEMENTS
- **Other headings:** criteria 8.4, 8.6, 8.7, 8.8 and 8.10

```
A 1 
  8.1 a11ylint OTHER_FAILS RGAA - 8.1.3
B 11 
  8.1 a11ylint OTHER_FAILS RGAA - 8.1.1, 8.1 arneo OTHER_FAILS arneo-8.1, 8.1 stan OTHER_FAILS stan-8.1, 8.1 uuv OTHER_FAILS 8.1.1 + 8.1.2 + 8.1.3, 8.3 a11ylint OTHER_FAILS RGAA - 8.3, 8.3 arneo OTHER_FAILS arneo-8.3, 8.3 stan OTHER_FAILS stan-8.3, 8.3 uuv OTHER_FAILS 8.3.1, 8.5 a11ylint OTHER_FAILS RGAA - 8.5, 8.5 arneo OTHER_FAILS arneo-8.5, 8.5 stan OTHER_FAILS stan-8.5
C 96 
  8.2 a11ylint PACK_FAILS rgaa-html-elements-attributes-valid, 8.2 a11ylint PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS rgaa-aria-attribute-conformance, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-aria-role-conformance, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS rgaa-aria-role-conformance, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-html-elements-attributes-valid, 8.2 a11ylint PACK_FAILS rgaa-aria-attribute-conformance + rgaa-html-elements-attributes-valid, 8.2 a11ylint PACK_FAILS duplicate-id, 8.2 a11ylint PACK_FAILS rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance, 8.2 a11ylint PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 a11ylint PACK_FAILS duplicate-id + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS rgaa-html-elements-attributes-valid, 8.2 arneo PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance, 8.2 arneo PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance, 8.2 arneo PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS rgaa-aria-attribute-conformance, 8.2 arneo PACK_FAILS duplicate-id + rgaa-aria-role-conformance, 8.2 arneo PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS rgaa-aria-role-conformance, 8.2 arneo PACK_FAILS duplicate-id + rgaa-html-elements-attributes-valid, 8.2 arneo PACK_FAILS rgaa-aria-attribute-conformance + rgaa-html-elements-attributes-valid, 8.2 arneo PACK_FAILS duplicate-id, 8.2 arneo PACK_FAILS rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid, 8.2 arneo PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS duplicate-id + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance, 8.2 arneo PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid, 8.2 arneo PACK_FAILS duplicate-id + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 arneo PACK_FAILS duplicate-id + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS rgaa-html-elements-attributes-valid, 8.2 stan PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance, 8.2 stan PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance, 8.2 stan PACK_FAILS rgaa-aria-attribute-conformance, 8.2 stan PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS duplicate-id + rgaa-aria-role-conformance, 8.2 stan PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS rgaa-aria-role-conformance, 8.2 stan PACK_FAILS duplicate-id + rgaa-html-elements-attributes-valid, 8.2 stan PACK_FAILS rgaa-aria-attribute-conformance + rgaa-html-elements-attributes-valid, 8.2 stan PACK_FAILS duplicate-id, 8.2 stan PACK_FAILS rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid, 8.2 stan PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS rgaa-html-nesting-valid, 8.2 stan PACK_FAILS rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS duplicate-id + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance, 8.2 stan PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid, 8.2 stan PACK_FAILS duplicate-id + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 stan PACK_FAILS duplicate-id + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS rgaa-html-elements-attributes-valid, 8.2 uuv PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance, 8.2 uuv PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance, 8.2 uuv PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS rgaa-aria-attribute-conformance, 8.2 uuv PACK_FAILS duplicate-id + rgaa-aria-role-conformance, 8.2 uuv PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS rgaa-aria-role-conformance, 8.2 uuv PACK_FAILS duplicate-id + rgaa-html-elements-attributes-valid, 8.2 uuv PACK_FAILS rgaa-aria-attribute-conformance + rgaa-html-elements-attributes-valid, 8.2 uuv PACK_FAILS duplicate-id, 8.2 uuv PACK_FAILS rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid, 8.2 uuv PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS rgaa-aria-role-conformance + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS duplicate-id + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance, 8.2 uuv PACK_FAILS rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS duplicate-id + rgaa-aria-attribute-conformance + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid, 8.2 uuv PACK_FAILS duplicate-id + rgaa-aria-role-conformance + rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid, 8.2 uuv PACK_FAILS duplicate-id + rgaa-aria-role-conformance + rgaa-html-nesting-valid
D 8 
  8.2 a11ylint PACK_ASKS rgaa-markup-validation-review, 8.2 a11ylint PACK_ASKS rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid + rgaa-markup-validation-review, 8.2 arneo PACK_ASKS rgaa-markup-validation-review, 8.2 arneo PACK_ASKS rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid + rgaa-markup-validation-review, 8.2 stan PACK_ASKS rgaa-markup-validation-review, 8.2 stan PACK_ASKS rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid + rgaa-markup-validation-review, 8.2 uuv PACK_ASKS rgaa-markup-validation-review, 8.2 uuv PACK_ASKS rgaa-html-elements-attributes-valid + rgaa-html-nesting-valid + rgaa-markup-validation-review
E 2 
  8.2 stan PACK_MORE_ELEMENTS rgaa-html-elements-attributes-valid, 8.2 stan PACK_MORE_ELEMENTS duplicate-id + rgaa-aria-attribute-conformance + rgaa-html-nesting-valid
8.4 1 
  8.4 uuv OTHER_ASKS 8.4.1
8.6 6 
  8.6 a11ylint PACK_ASKS rgaa-page-title-unique, 8.6 a11ylint PACK_ASKS page-title-patterns + rgaa-page-title-unique, 8.6 arneo PACK_ASKS rgaa-page-title-unique, 8.6 arneo PACK_ASKS page-title-patterns + rgaa-page-title-unique, 8.6 stan PACK_ASKS rgaa-page-title-unique, 8.6 stan PACK_ASKS page-title-patterns + rgaa-page-title-unique
8.7 2 
  8.7 arneo OTHER_ASKS arneo-8.7, 8.7 uuv OTHER_ASKS 8.7.1
8.8 2 
  8.8 arneo OTHER_ASKS arneo-8.8, 8.8 uuv OTHER_ASKS 8.8.1
8.10 2 
  8.10 arneo OTHER_ASKS arneo-8.10, 8.10 uuv OTHER_ASKS 8.10.2
```
