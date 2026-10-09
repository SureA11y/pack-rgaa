'use strict';

/**
 * RGAA's tests scan with the pack: core's test helpers, with the RGAA pack
 * added to every scan's engineOptions.packs, and core's catalog functions
 * answering with it. A scan with packs runs through runDomRulesInPage.
 */

const helpers = require('@surea11y/core/testing');
const main = require('@surea11y/core');
const { preparePacks } = require('@surea11y/core/pack');
const rgaa = require('../..');

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

module.exports = {
  ...helpers,
  runa11yCoreOnHtml,
  runa11yCoreOnDom,
  core,
  rgaa,
  PACK_NAMES,
  BROWSER_BUNDLE
};
