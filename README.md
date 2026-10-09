# @surea11y/pack-rgaa

RGAA 4.1.2, the French accessibility standard, as a pack for [`@surea11y/core`](https://github.com/SureA11y/core#readme): its criteria and tests, the RGAA tests each of core's rules checks, one result per RGAA criterion, the `rgaa-4.1.2` profile, 69 rules for what RGAA requires beyond WCAG or judges differently, and their messages in English, French, German, Spanish and Japanese.

It needs `@surea11y/core` 1.11 or later, which runs packs (see [Packs in core's `ENGINE_OPTIONS.md`](https://github.com/SureA11y/core/blob/main/docs/ENGINE_OPTIONS.md#packs--rules-and-standards-from-outside-core)).

```sh
npm install @surea11y/core @surea11y/pack-rgaa
```

## Using it

In Node, pass the pack to a scan and run its profile:

```js
const { runDomRulesInPage } = require('@surea11y/core');
const rgaa = require('@surea11y/pack-rgaa');

const result = runDomRulesInPage(url, null, { packs: [rgaa], profile: 'rgaa-4.1.2' });
result.engine.packs;   // ['@surea11y/pack-rgaa@0.1.0']
result.rulesResults;   // the WCAG criteria, then one result per RGAA criterion
```

In a page, register it with `packScript()` and name it (see core's [`docs/INTEGRATION.md`](https://github.com/SureA11y/core/blob/main/docs/INTEGRATION.md#packs-in-a-page)):

```js
const { packScript } = require('@surea11y/core/pack');

await page.evaluate(packScript([rgaa]));
const result = await page.evaluate(
  runa11yCoreInPage,
  page.url(),
  null,
  { packs: ['@surea11y/pack-rgaa@0.1.0'], profile: 'rgaa-4.1.2' }
);
```

From the command line: `surea11y scan ./index.html --pack @surea11y/pack-rgaa --profile rgaa-4.1.2`. In a browser binding: `.withPacks(rgaa).options({ profile: 'rgaa-4.1.2' })` (in Cypress, `.withPacks('@surea11y/pack-rgaa')` with the plugin).

## What it brings

- **The standard:** RGAA 4.1.2's themes, criteria and tests (`map.js`), generated from DINUM's own criteria file (`data/`), and published for tools that work in RGAA's terms (`public.js`).
- **The mapping:** for each of core's rules, the RGAA tests it checks, with the reason (`rule-map.js`, documented in [`docs/RGAA_MAPPING.md`](./docs/RGAA_MAPPING.md)). Results name those tests next to WCAG's criteria under the profile, or with `engineOptions.mappings: ['rgaa']`.
- **One result per RGAA criterion** that a rule checks (`mappings.js`), in its own section of the HTML report, with RGAA's French wording.
- **The `rgaa-4.1.2` profile:** WCAG 2.1 A and AA, every rule mapped to an RGAA test, and the pack's own rules.
- **69 rules,** each id starting with `rgaa-`: for what RGAA requires and WCAG doesn't (a doctype, presentational markup, a skip link's place across pages, say), and where RGAA judges differently, among them `rgaa-contrast-minimum`, a variant of core's `contrast-minimum`. They are opt-in: they run under the profile, or with `engineOptions.optInRules: ['rgaa']`, never in a scan that targets WCAG.
- **Probes:** four of its rules read evidence the host supplies in `engineOptions.probes` (other pages' titles and skip links, the page's source as sent, a validator report); `describePacks([rgaa])` lists them with what each holds.

## The data and its licence

`data/criteres-4.1.2.json` is DINUM's RGAA 4.1.2 criteria file, byte for byte, under the Licence Ouverte 2.0 (Etalab); [`data/README.md`](./data/README.md) gives its source, commit and attribution. `npm run map` rebuilds `map.js` from it, and `npm run mapping-doc` the mapping doc; `npm test` checks both are up to date.

## Tests

`npm test` checks the formatting, lints the rules with core's own lint rules (`@surea11y/core/eslint-plugin`), checks the generated files and the docs (`surea11y-pack docs --check`: `docs/RULE_CATALOG.md`, and each example of `docs/RULE_EXAMPLES.md` run in Chromium), then runs `tests/`: a test per rule, in jsdom and, for the rules that need a real browser, in Chromium, with each rule's scenario page in `tests/fixtures/`, and tests of the map, the mapping, the rollups and the margins. They scan with the pack through `@surea11y/core/testing` (`tests/helpers/run.js`). The pack gives the results RGAA built into core gives, on every scenario page.

## Licence

The code is under the [Mozilla Public License 2.0](./LICENSE), as `@surea11y/core` is. The RGAA data in `data/` is DINUM's, under the Licence Ouverte 2.0 ([`data/README.md`](./data/README.md)).
