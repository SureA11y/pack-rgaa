'use strict';

/**
 * RGAA's tests scan with the pack: core's test helpers, with the RGAA pack
 * added to every scan's engineOptions.packs, and core's catalog functions
 * answering with it. A scan with packs runs through runDomRulesInPage.
 */

const helpers = require('@surea11y/core/testing');
const main = require('@surea11y/core');
const { preparePacks, definePack, wcagTags } = require('@surea11y/core/pack');
const published = require('../..');

// The pack as published, plus one profile for the tests alone:
// rgaa-4.1.2-with-wcag runs what rgaa-4.1.2 runs and every WCAG 2.1 A and AA
// rule, so a test can compare RGAA's verdict with WCAG's in one scan. The
// published pack has only rgaa-4.1.2; tests/profiles.test.js checks that the
// two give the same RGAA results.
const TEST_PROFILE = 'rgaa-4.1.2-with-wcag';
const rgaa = definePack({
  ...published,
  standard: {
    ...published.standard,
    profiles: {
      ...published.standard.profiles,
      [TEST_PROFILE]: {
        version: '4.1.2',
        tags: wcagTags('2.1').concat(['rgaa']),
        mappedRules: true
      }
    }
  }
});

const withPack = (engineOptions) => ({ ...(engineOptions || {}), packs: [rgaa] });

function runa11yCoreOnHtml(html, opts = {}) {
  return helpers.runa11yCoreOnHtml(html, { ...opts, engineOptions: withPack(opts.engineOptions) });
}

function runa11yCoreOnDom(dom, opts = {}) {
  return helpers.runa11yCoreOnDom(dom, { ...opts, engineOptions: withPack(opts.engineOptions) });
}

// Core's catalog, as a scan with the pack has it.
const core = {
  getChecksCatalog: (eo) => main.getChecksCatalog(withPack(eo)),
  getRulesCatalog: (eo) => main.getRulesCatalog(withPack(eo)),
  getCheckDefById: (id, eo) => main.getCheckDefById(id, withPack(eo)),
  getCompositeRuleById: (id, eo) => main.getCompositeRuleById(id, withPack(eo)),
  getChecksForRunOnly: (runOnly, eo) => main.getChecksForRunOnly(runOnly, withPack(eo)),
  get COMPOSITE_RULES() {
    return preparePacks([rgaa]).runtime.COMPOSITE_RULES;
  },
  get CHECK_DEFS() {
    return preparePacks([rgaa]).runtime.CHECK_DEFS;
  }
};

// For the Chromium tests: core's browser bundle with the pack registered after
// it (buildBrowserBundle), and every scan in the page naming the pack, as a
// caller does with engineOptions.packs.
const { buildBrowserBundle } = require('@surea11y/core/pack');
const PACK_NAMES = [`${rgaa.name}@${rgaa.version}`];
const BROWSER_BUNDLE =
  buildBrowserBundle({ packs: [rgaa] }) +
  `
;(function () {
  const run = window.a11ycore.runa11yCoreInPage;
  window.a11ycore.runa11yCoreInPage = (url, context, options, runOnly) =>
    run(url, context, Object.assign({ packs: ${JSON.stringify(PACK_NAMES)} }, options), runOnly);
})();
`;

// A rollup's outcome as a test states it. Since core 1.14 a criterion whose
// rules check only part of it is cantTell where they all pass
// (partialCheck) or all find nothing to check (partialCoverage): every WCAG
// criterion, and every RGAA criterion outside COMPLETE_CHECK (mappings.js).
// Those read 'passedInPart' and 'noneFoundInPart', so a test still says
// which way the rules went; any other rollup reads its outcome.
const PARTIAL = {
  'composite.rollup.cantTell.partialCheck': 'passedInPart',
  'composite.rollup.cantTell.partialCoverage': 'noneFoundInPart'
};
function rollupOutcome(rollup) {
  if (!rollup) return undefined;
  const code = rollup.data && rollup.data.details && rollup.data.details.reasonCode;
  return (rollup.outcome === 'cantTell' && PARTIAL[code]) || rollup.outcome;
}

module.exports = {
  ...helpers,
  rollupOutcome,
  runa11yCoreOnHtml,
  runa11yCoreOnDom,
  core,
  rgaa,
  published,
  TEST_PROFILE,
  PACK_NAMES,
  BROWSER_BUNDLE
};
