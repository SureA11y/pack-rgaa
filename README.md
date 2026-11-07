# @surea11y/pack-rgaa

RGAA 4.1.2, the French accessibility standard, as a pack for [`@surea11y/core`](https://github.com/SureA11y/core#readme): its criteria and tests, its methodology and glossary, the RGAA tests each of core's rules checks, one result per RGAA criterion, the `rgaa-4.1.2` profile, 111 rules for what RGAA requires beyond WCAG or judges differently, and their messages in English and French.

It automates what can be checked in the page, not an RGAA audit: a scan gives results for 80 of RGAA's 106 criteria (167 of its 258 tests), many rules ask (`cantTell`) where only a person can judge, and 43 of the pack's rules are manual, finding what a person must review without ever failing it. A criterion passes only where its rules check all it asks, which four do; elsewhere rules that all pass leave it to a person (see [Reading the results](#reading-the-results)). For that person the pack gives RGAA's own methodology, test by test ([Assessing by hand](#assessing-by-hand)). A conformance claim still needs an auditor to check every criterion.

It needs `@surea11y/core` 1.15.0 or later, which fails what RGAA makes certain where WCAG only asks, reads a standard's procedures, and scans several profiles at once (see [Packs in core's `ENGINE_OPTIONS.md`](https://github.com/SureA11y/core/blob/main/docs/ENGINE_OPTIONS.md#packs--rules-and-standards-from-outside-core)). With an older core, a scan skips the pack and says why in `skippedPacks`.

```sh
npm install @surea11y/core @surea11y/pack-rgaa
```

## Using it

The pack runs wherever core runs: in Node on a jsdom page, in a real browser driven by Playwright or Puppeteer, from the command line, and in core's browser bindings. In each, give the scan the pack and choose its profile, `rgaa-4.1.2`.

### In Node, on a jsdom page

Core's runners scan the `document` and `window` they find as globals, so create the page first (core's [Pattern 1](https://github.com/SureA11y/core/blob/main/docs/INTEGRATION.md#pattern-1--jsdom-in-node-no-real-browser)):

```js
const { JSDOM } = require('jsdom');
const { runDomRulesInPage } = require('@surea11y/core');
const rgaa = require('@surea11y/pack-rgaa');

const dom = new JSDOM(html, { url: 'https://example.com/', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;

const result = runDomRulesInPage('https://example.com/', null, {
  packs: [rgaa],
  profile: 'rgaa-4.1.2'
});
result.engine.packs; // ['@surea11y/pack-rgaa@1.0.0']
result.engine.profile; // 'rgaa-4.1.2'
dom.window.close();
```

jsdom has no layout engine, so the rules that measure sizes and positions can't decide there; a real browser runs them all.

### In a browser, with Playwright or Puppeteer

A pack is prepared in Node, so it reaches the page as a script: inject `packScript()` before the scan, and name the pack in `engineOptions.packs` as `name@version` (see [Packs in a page](https://github.com/SureA11y/core/blob/main/docs/INTEGRATION.md#packs-in-a-page)). In Puppeteer:

```js
const { runa11yCoreInPage } = require('@surea11y/core');
const { packScript } = require('@surea11y/core/pack');
const rgaa = require('@surea11y/pack-rgaa');

const engineOptions = { packs: [`${rgaa.name}@${rgaa.version}`], profile: 'rgaa-4.1.2' };

await page.evaluate(packScript([rgaa]));
const result = await page.evaluate(runa11yCoreInPage, page.url(), null, engineOptions, null);
```

Playwright's `page.evaluate` takes a single argument, so pass the call as an expression:

```js
await page.evaluate(packScript([rgaa]));
const result = await page.evaluate(
  `(${runa11yCoreInPage})(${JSON.stringify(page.url())}, null, ${JSON.stringify(engineOptions)}, null)`
);
```

Inject the script into every frame you scan, and again after each navigation.

Two of core's opt-in hooks let rules the profile runs see what a page's scripts do, so they decide more of what they would otherwise ask. Install them before the page's own scripts, as core's [`INTEGRATION.md`](https://github.com/SureA11y/core/blob/main/docs/INTEGRATION.md) shows: `listenerHookScript()` records the click and key listeners a script adds, which `click-handler-keyboard-operable` reads for RGAA 7.3.1, and `liveRegionHookScript()` what live regions are given, which `live-region-announcements` reads for RGAA 7.5.

```js
const { listenerHookScript, liveRegionHookScript } = require('@surea11y/core');

await page.addInitScript({ content: listenerHookScript() });
await page.addInitScript({ content: liveRegionHookScript() });
```

### With a browser binding

Core's bindings, 1.3.0 or later, register the pack for you, in every frame with `.frames(true)`, and stop before the scan if the installed core can't run it. Install the pack beside the binding, so npm resolves one core for both. With [`@surea11y/playwright`](https://www.npmjs.com/package/@surea11y/playwright):

```js
const { A11yCoreBuilder, getScanGaps } = require('@surea11y/playwright');
const rgaa = require('@surea11y/pack-rgaa');

const results = await new A11yCoreBuilder({ page })
  .withPacks(rgaa)
  .options({ profile: 'rgaa-4.1.2' })
  .analyze();

getScanGaps(results); // [] when the pack ran
```

[`@surea11y/puppeteer`](https://www.npmjs.com/package/@surea11y/puppeteer) takes `{ page }`, [`@surea11y/webdriverio`](https://www.npmjs.com/package/@surea11y/webdriverio) `{ browser }` and [`@surea11y/selenium`](https://www.npmjs.com/package/@surea11y/selenium) `{ driver }`, with the same calls. A Cypress spec runs in the browser, where the pack can't be prepared, so [`@surea11y/cypress`](https://www.npmjs.com/package/@surea11y/cypress) names it by package and its plugin prepares it in Node:

```js
// cypress.config.js
const { defineConfig } = require('cypress');
const surea11y = require('@surea11y/cypress/plugin');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      surea11y(on, config);
    }
  }
});

// in a spec
const { A11yCoreBuilder } = require('@surea11y/cypress');

new A11yCoreBuilder().withPacks('@surea11y/pack-rgaa').options({ profile: 'rgaa-4.1.2' }).analyze();
```

### From the command line

With [`@surea11y/cli`](https://www.npmjs.com/package/@surea11y/cli), in French, with an HTML report:

```sh
surea11y scan ./index.html --pack @surea11y/pack-rgaa --profile rgaa-4.1.2 --locale fr --html rapport.html
```

### Reading the results

Under `rgaa-4.1.2`, `checksResults` holds a result per rule that checks an RGAA test, core's and the pack's (their ids start with `rgaa-`), and `rulesResults` holds one result per RGAA criterion, with ids such as `rgaa-4.1.2-8.1`, and nothing of WCAG:

```js
const criteria = result.rulesResults.filter((r) => r.meta && r.meta.standard === 'RGAA');
criteria.filter((r) => r.outcome === 'fail').map((r) => r.ruleId); // ['rgaa-4.1.2-8.1', ...]
```

A criterion's `meta.normativeMappings` lists the RGAA tests it covers. A rule's result lists the RGAA tests it checks in its own `meta.normativeMappings`, and the criteria it counts towards in `rollupIds`.

A criterion fails when one of its rules fails, and asks (`cantTell`) when one asks. Where WCAG asks but RGAA's text is certain, a broken list say, the criterion fails and the rule's own outcome stays `cantTell`. Where they all pass, it passes only if they check all the criterion asks: 2.1 (a frame's title attribute), 8.1 (the doctype), 8.3 (the default language) and 8.5 (the page title). Every other criterion is then `cantTell` with the reason `composite.rollup.cantTell.partialCheck`, and `composite.rollup.cantTell.partialCoverage` where its rules found nothing to check, as core's WCAG criteria are: the rules check some steps of its tests, and a person checks the rest. Its `data.details.partial` is `true`.

```js
const partlyChecked = criteria.filter(
  (r) => r.data.details.reasonCode === 'composite.rollup.cantTell.partialCheck'
); // every rule passed; the rest of the criterion is for a person
```

Each finding a rule can't decide comes with the steps to answer it: `howToCheck` on the occurrence, with a few `steps` from the element it names, then `passWhen` and `failWhen`. The pack's rules give them in the scan's locale. Core's rules give theirs in French under the RGAA profile alone, naming the RGAA test the finding bears on (`standard.review`); beside a WCAG profile they keep core's, which name WCAG. Some of core's undecided findings also `lean` toward pass or fail, with the evidence; the outcome stays `cantTell`. The HTML report groups them as "Likely fails", "Likely passes" and "Needs a person".

`rgaaCriteriaStatus(result)` from `@surea11y/pack-rgaa/public` reads a scan as an audit grid does, with a row for each of the 106 criteria: `C`, `NC`, `NA`, or `NT` for what a person still has to assess and what no rule checks. Non applicable is said of a page, so a scan of part of one (a `contextSelector`, or `engineOptions.fragment` with `{ fragment: true }` passed here) gives `NT` where it would give `NA`. A scan across frames (`{ topFrame, frames }`) is read through its `topFrame`, the top document's scan; each frame's scan is a document of its own and is not merged in, so what a frame's content fails reaches the grid through the auditor, or through a call on that frame's result.

```js
const { rgaaCriteriaStatus, rgaaConformityRate } = require('@surea11y/pack-rgaa/public');

rgaaCriteriaStatus(result).find((row) => row.criterion === '8.5');
// { criterion: '8.5', title: 'Chaque page web a-t-elle un titre de page ?', status: 'C', outcome: 'pass' }
```

`rgaaConformityRate(pages)` works out DINUM's rate from a sample of pages once an auditor has completed them: a criterion is validated if it is on every page, and applicable if it is on one, and a page of a process (`{ rows, process }`) fails what any page of that process fails. `complete` is `true` only when every page gives `C`, `NC` or `NA` for all 106 criteria; until then the rate is no claim of conformity. It throws a `RangeError` for what it can't read: a page that is not a list of rows or `{ rows, process }`, a criterion the version doesn't have, an unknown status, or a criterion given twice on one page.

Without the profile, a scan that targets WCAG runs none of the pack's rules: add `engineOptions.optInRules: ['rgaa']` to run them, or `engineOptions.mappings: ['rgaa']` for RGAA's tests to be named on core's rules.

### Beside WCAG, or another standard

A scan can judge a page by RGAA and by another profile at once. Each judges it as it would alone, and `verdicts` says what each makes of a rule:

```js
const result = runDomRulesInPage(url, null, {
  packs: [rgaa],
  profile: ['wcag22-aa', 'rgaa-4.1.2']
});

result.checksResults.find((c) => c.ruleId === 'duplicate-id').verdicts;
// { 'wcag22-aa': 'cantTell', 'rgaa-4.1.2': 'fail' }
```

`result.profiles['rgaa-4.1.2'].rulesResults` holds RGAA's criteria, by id.

### Assessing by hand

RGAA says how each test is checked, and the pack gives that methodology through core's procedures: each criterion with a procedure for each of its tests, in RGAA's French, in its 13 themes, with its particular cases, technical notes and glossary terms, and the pack's rules that check it.

```js
const {
  listProcedures,
  procedureChecklist,
  proceduresFor,
  renderProcedures
} = require('@surea11y/core');

const options = { packs: [rgaa], standard: 'rgaa' };

proceduresFor('8.5', options); // one criterion
listProcedures(options); // all 106

// A worksheet to record each test's result, with a JSON or CSV export.
require('fs').writeFileSync(
  'grille-rgaa.html',
  renderProcedures(procedureChecklist(options), {
    packs: [rgaa],
    title: 'Audit RGAA : example.com'
  })
);
```

Each test says how much of it the rules decide (`automation`: `manual` for the 169 tests no rule decides, which a rule may still ask about, `partial` for the 83 they decide in part, `full` for the 6 they decide) and which tools it needs. Facets list the pack's own rules; core's are in [`docs/RGAA_MAPPING.md`](./docs/RGAA_MAPPING.md). The HTML report's "What's left for a person" section reads them too. `relatedRequirements('1.4.3', { packs: [rgaa] })` gives the criteria RGAA relates to a WCAG criterion. The steps are RGAA's words; only `failWhen`, which RGAA doesn't state, is the pack's.

What RGAA's words mean is in its glossary:

```js
const { rgaaGlossaryFor } = require('@surea11y/pack-rgaa/public');

rgaaGlossaryFor('1.1.1');
// [{ anchor: 'image-porteuse-d-information', term: 'Image porteuse d’information', definition: ['…'] }, …]
```

### In French, and the other languages

The pack's messages and steps come in English and French; choose one with core's `locale` option. In another locale they are in English, while core's own messages follow the locale. RGAA itself, its criteria, tests and methodology, has one official language, so it is in French in every locale:

```js
runDomRulesInPage(url, null, { packs: [rgaa], profile: 'rgaa-4.1.2', locale: 'fr' });
// rgaa-doctype-present: « La page n’a pas de doctype. »
```

`result.engine.locale` says which one the scan used.

### An HTML report

Core's report shows the RGAA criteria in a section of their own, with RGAA's French wording:

```js
const { renderHtmlReport } = require('@surea11y/core/report');

require('fs').writeFileSync('rapport.html', renderHtmlReport(result, { title: 'Audit RGAA' }));
```

### Probes: what one page can't show

Five rules read evidence the host collects, through four probes, and passes in `engineOptions.probes`. Without it, they judge from the page alone, and ask where it can't tell:

| Probe              | What it holds                                                                                                     | Read by                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `crawl.pageTitles` | The other pages' titles, `{ pages: [{ url, title }] }`                                                            | `rgaa-page-title-unique` (RGAA 8.6)                        |
| `crawl.skipLinks`  | Where each page places its skip link, measured at one window width, and the « ensemble de pages » each belongs to | `rgaa-skip-link-placement` (RGAA 12.7)                     |
| `page.source`      | The start of the response body as sent, `{ url, start }`                                                          | `rgaa-doctype-present`, `rgaa-doctype-position` (RGAA 8.1) |
| `validator.report` | The W3C Nu HTML Checker's JSON messages                                                                           | `rgaa-markup-validation-review` (RGAA 8.2)                 |

```js
runDomRulesInPage(url, null, {
  packs: [rgaa],
  profile: 'rgaa-4.1.2',
  probes: { 'crawl.pageTitles': { pages: [{ url: '/contact', title: 'Contact – Médiathèque' }] } }
});
```

`describePacks([rgaa])` from `@surea11y/core/pack` gives each probe's exact shape, and [`docs/RULE_EXAMPLES.md`](./docs/RULE_EXAMPLES.md) shows each rule with and without its probe.

## What it brings

- **The standard:** RGAA 4.1.2's themes, criteria, tests, methodology and glossary (`map.js`, `glossary.js`), generated from DINUM's own files (`data/`), and published for tools that work in RGAA's terms (`public.js`).
- **Procedures:** RGAA's methodology, read through core's procedures (`procedures.js`), and core's undecided findings in RGAA's terms (`review.js`).
- **The mapping:** for each of core's rules, the RGAA tests it checks, with the reason (`rule-map.js`, documented in [`docs/RGAA_MAPPING.md`](./docs/RGAA_MAPPING.md)). Results name those tests under the pack's profiles, or with `engineOptions.mappings: ['rgaa']`.
- **One result per RGAA criterion** that a rule checks (`mappings.js`), in its own section of the HTML report, with RGAA's French wording.
- **The `rgaa-4.1.2` profile:** RGAA alone. It runs the pack's own rules and every core rule mapped to an RGAA test, WCAG rules and best-practice ones alike (`img-alt-present` for 1.1.1, `heading-order` for 9.1), and nothing else: no rule that counts for no RGAA test, and no WCAG criterion in the results. It is judged by WCAG 2.1, the version RGAA 4.1.2 is built on, and keeps 4.1.1 Parsing (`keepsParsing`), since RGAA 8.2 still requires valid code: a duplicate id fails 8.2.1, where the 2023 errata to WCAG 2.1 only ask about it.
- **111 rules,** each id starting with `rgaa-`: for what RGAA requires and WCAG doesn't (a doctype, presentational markup, a skip link's place across pages, say), and where RGAA judges differently, among them `rgaa-contrast-minimum`, a variant of core's `contrast-minimum`. They are opt-in: they run under the profile, or with `engineOptions.optInRules: ['rgaa']`, never in a scan that targets WCAG.
- **Probes:** five of its rules read, through four probes, evidence the host supplies in `engineOptions.probes` (other pages' titles and skip links, the page's source as sent, a validator report); `describePacks([rgaa])` lists them with what each holds.

## The data and its licence

`data/` holds DINUM's RGAA 4.1.2 criteria, methodology and glossary, byte for byte, under the Licence Ouverte 2.0 (Etalab); [`data/README.md`](./data/README.md) gives their source, commits and attribution. `npm run map` rebuilds `map.js` and `glossary.js` from them, `npm run review` the steps in RGAA's terms, and `npm run mapping-doc` the mapping doc; `npm test` checks all are up to date.

## Tests

`npm test` checks the formatting, lints the rules with core's own lint rules (`@surea11y/core/eslint-plugin`), checks the generated files and the docs (`surea11y-pack docs --check`: `docs/RULE_CATALOG.md`, and each example of `docs/RULE_EXAMPLES.md` run in Chromium), then runs `tests/`: a test per rule, in jsdom and, for the rules that need a real browser, in Chromium, with each rule's scenario page in `tests/fixtures/`, and tests of the map, the mapping, the rollups, the margins, the procedures and of what npm installs. The test comparing the `rgaa-4.1.2` profile with the tests' own scans a sample of about 20 scenario pages; `RGAA_FULL_TESTS=1 npm test` scans them all, as CI does on Node 22. They scan with the pack through `@surea11y/core/testing` (`tests/helpers/run.js`). The rules and their tests came from core, which carried RGAA until 1.11; each test asserts its rule's outcomes, and the RGAA criteria they count towards, on its scenario page.

## Licence

The code is under the [Mozilla Public License 2.0](./LICENSE), as `@surea11y/core` is. The RGAA data in `data/` is DINUM's, under the Licence Ouverte 2.0 ([`data/README.md`](./data/README.md)).
