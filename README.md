# @surea11y/pack-rgaa

RGAA 4.1.2, the French accessibility standard, as a pack for [`@surea11y/core`](https://github.com/SureA11y/core#readme): its criteria and tests, the RGAA tests each of core's rules checks, one result per RGAA criterion, the `rgaa-4.1.2` profile, 80 rules for what RGAA requires beyond WCAG or judges differently, and their messages in English, French, German, Spanish and Japanese.

It automates what can be checked in the page, not an RGAA audit: a scan gives results for 54 of RGAA's 106 criteria, many rules ask (`cantTell`) where only a person can judge, and 18 of the pack's rules are manual, finding what a person must review without ever failing it. A conformance claim still needs an auditor to check every criterion.

It needs `@surea11y/core` 1.12.0 or later, which runs packs and judges a pack's profile by the WCAG version it names (see [Packs in core's `ENGINE_OPTIONS.md`](https://github.com/SureA11y/core/blob/main/docs/ENGINE_OPTIONS.md#packs--rules-and-standards-from-outside-core)).

It isn't on npm: install it from this repository, with core from npm:

```sh
npm install @surea11y/core github:SureA11y/pack-rgaa
```

npm installs it as `@surea11y/pack-rgaa`, so the examples below, and the CLI's `--pack @surea11y/pack-rgaa`, name it as they would a published package.

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

const result = runDomRulesInPage('https://example.com/', null, { packs: [rgaa], profile: 'rgaa-4.1.2' });
result.engine.packs;   // ['@surea11y/pack-rgaa@0.1.0']
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

new A11yCoreBuilder()
  .withPacks('@surea11y/pack-rgaa')
  .options({ profile: 'rgaa-4.1.2' })
  .analyze();
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

Without the profile, a scan that targets WCAG runs none of the pack's rules: add `engineOptions.optInRules: ['rgaa']` to run them, or `engineOptions.mappings: ['rgaa']` for RGAA's tests to be named on core's rules.

### In French, and the other languages

The pack's messages come in English, French, German, Spanish and Japanese; choose one with core's `locale` option:

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

Four rules read evidence the host collects and passes in `engineOptions.probes`. Without it, they judge from the page alone, and ask where it can't tell:

| Probe | What it holds | Read by |
|---|---|---|
| `crawl.pageTitles` | The other pages' titles, `{ pages: [{ url, title }] }` | `rgaa-page-title-unique` (RGAA 8.6) |
| `crawl.skipLinks` | Where each page places its skip link, measured at one window width | `rgaa-skip-link-placement` (RGAA 12.7) |
| `page.source` | The start of the response body as sent, `{ url, start }` | `rgaa-doctype-present`, `rgaa-doctype-position` (RGAA 8.1) |
| `validator.report` | The W3C Nu HTML Checker's JSON messages | `rgaa-markup-validation-review` (RGAA 8.2) |

```js
runDomRulesInPage(url, null, {
  packs: [rgaa],
  profile: 'rgaa-4.1.2',
  probes: { 'crawl.pageTitles': { pages: [{ url: '/contact', title: 'Contact – Médiathèque' }] } }
});
```

`describePacks([rgaa])` from `@surea11y/core/pack` gives each probe's exact shape, and [`docs/RULE_EXAMPLES.md`](./docs/RULE_EXAMPLES.md) shows each rule with and without its probe.

## What it brings

- **The standard:** RGAA 4.1.2's themes, criteria and tests (`map.js`), generated from DINUM's own criteria file (`data/`), and published for tools that work in RGAA's terms (`public.js`).
- **The mapping:** for each of core's rules, the RGAA tests it checks, with the reason (`rule-map.js`, documented in [`docs/RGAA_MAPPING.md`](./docs/RGAA_MAPPING.md)). Results name those tests under the pack's profiles, or with `engineOptions.mappings: ['rgaa']`.
- **One result per RGAA criterion** that a rule checks (`mappings.js`), in its own section of the HTML report, with RGAA's French wording.
- **The `rgaa-4.1.2` profile:** RGAA alone. It runs the pack's own rules and every core rule mapped to an RGAA test, WCAG rules and best-practice ones alike (`img-alt-present` for 1.1.1, `heading-order` for 9.1), and nothing else: no rule that counts for no RGAA test, and no WCAG criterion in the results. It is judged by WCAG 2.1, the version RGAA 4.1.2 is built on, so a duplicate id fails 8.2.1.
- **80 rules,** each id starting with `rgaa-`: for what RGAA requires and WCAG doesn't (a doctype, presentational markup, a skip link's place across pages, say), and where RGAA judges differently, among them `rgaa-contrast-minimum`, a variant of core's `contrast-minimum`. They are opt-in: they run under the profile, or with `engineOptions.optInRules: ['rgaa']`, never in a scan that targets WCAG.
- **Probes:** four of its rules read evidence the host supplies in `engineOptions.probes` (other pages' titles and skip links, the page's source as sent, a validator report); `describePacks([rgaa])` lists them with what each holds.

## The data and its licence

`data/criteres-4.1.2.json` is DINUM's RGAA 4.1.2 criteria file, byte for byte, under the Licence Ouverte 2.0 (Etalab); [`data/README.md`](./data/README.md) gives its source, commit and attribution. `npm run map` rebuilds `map.js` from it, and `npm run mapping-doc` the mapping doc; `npm test` checks both are up to date.

## Tests

`npm test` checks the formatting, lints the rules with core's own lint rules (`@surea11y/core/eslint-plugin`), checks the generated files and the docs (`surea11y-pack docs --check`: `docs/RULE_CATALOG.md`, and each example of `docs/RULE_EXAMPLES.md` run in Chromium), then runs `tests/`: a test per rule, in jsdom and, for the rules that need a real browser, in Chromium, with each rule's scenario page in `tests/fixtures/`, and tests of the map, the mapping, the rollups and the margins. They scan with the pack through `@surea11y/core/testing` (`tests/helpers/run.js`). The rules and their tests came from core, which carried RGAA until 1.11; each test asserts its rule's outcomes, and the RGAA criteria they count towards, on its scenario page.

## Licence

The code is under the [Mozilla Public License 2.0](./LICENSE), as `@surea11y/core` is. The RGAA data in `data/` is DINUM's, under the Licence Ouverte 2.0 ([`data/README.md`](./data/README.md)).
