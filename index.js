/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA 4.1.2, the French accessibility standard, as a pack
 * (@surea11y/core/pack): passed to a scan in engineOptions.packs, it brings
 * the standard (its criteria and tests, generated from data/), the tests each
 * rule checks (rule-map.js), one rollup per criterion (mappings.js), the
 * rgaa-4.1.2 profile, 112 rules for what RGAA requires beyond WCAG or judges
 * differently (rules/), and their messages in five languages (i18n/).
 *
 * RGAA does not restate WCAG criterion by criterion, so the standard is mapped
 * rule by rule: RGAA's criteria are its own, related to WCAG many to many.
 */

const fs = require('fs');
const path = require('path');

const { definePack } = require('@surea11y/core/pack');
const { RGAA_VERSIONS } = require('./map');
const { rgaaMappingsFor, rgaaComposites, validateRgaaRuleTests } = require('./mappings');

// The WCAG version an RGAA version is built on.
const wcagVersionOf = (version) => RGAA_VERSIONS.find((v) => v.version === version).wcagVersion;

const standard = {
  key: 'rgaa',
  standard: 'RGAA',
  versions: RGAA_VERSIONS.map((v) => v.version),
  profiles: {
    // RGAA alone: the pack's own rules (the rgaa tag) and the core rules
    // rule-map.js gives an RGAA test (mappedRules), and nothing else, so
    // results hold RGAA's criteria and no WCAG ones. With no WCAG tag to
    // imply it, the profile names the WCAG version RGAA is built on. RGAA
    // 8.2 requires valid code as written, which the 2023 errata to WCAG 2.1
    // no longer count under 4.1.1 Parsing: keepsParsing keeps a duplicate id
    // a failure of 8.2.1.
    'rgaa-4.1.2': {
      version: '4.1.2',
      tags: ['rgaa'],
      mappedRules: true,
      wcagVersion: wcagVersionOf('4.1.2'),
      keepsParsing: true
    }
  },
  ruleTag: 'rgaa',
  ruleMapped: true,
  mappingsFor: rgaaMappingsFor,
  composites: rgaaComposites,
  validate: validateRgaaRuleTests,
  report: { noteKey: 'report_rgaaRollup_note', titleLang: 'fr' }
};

// Every rule module in rules/automatic and rules/manual, by file name.
const RULES_DIR = path.join(__dirname, 'rules');
const rules = ['automatic', 'manual'].flatMap((type) =>
  fs
    .readdirSync(path.join(RULES_DIR, type))
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => require(path.join(RULES_DIR, type, file)))
);

// One dictionary per locale file in i18n/.
const I18N_DIR = path.join(__dirname, 'i18n');
const dictionaries = Object.fromEntries(
  fs
    .readdirSync(I18N_DIR)
    .filter((file) => /^[a-z]{2}(-[A-Za-z0-9]+)?\.json$/.test(file))
    .map((file) => [
      file.replace(/\.json$/, ''),
      JSON.parse(fs.readFileSync(path.join(I18N_DIR, file), 'utf8'))
    ])
);

module.exports = definePack({
  name: '@surea11y/pack-rgaa',
  version: '0.1.0',
  namespace: 'rgaa',
  core: '^1.14.0',
  description: 'RGAA 4.1.2, the French accessibility standard',
  rules,
  standard,
  dictionaries,
  probes: {
    'crawl.pageTitles': {
      description:
        "The titles of the site's pages, { pages: [{ url, title }] }, to compare the page's title with the others.",
      readBy: ['rgaa-page-title-unique']
    },
    'crawl.skipLinks': {
      description:
        'Where each page of the site places its skip link, { pages: [{ url, viewportWidth, skipLink: { text, href, focusOrder, x, y, width, height } | null }] }, measured at one window width.',
      readBy: ['rgaa-skip-link-placement']
    },
    'page.source': {
      description:
        'The start of the response body as the server sent it, { url, start } (2,000 characters), to see a doctype the parser dropped.',
      readBy: ['rgaa-doctype-position', 'rgaa-doctype-present']
    },
    'validator.report': {
      description:
        "The W3C Nu HTML Checker's JSON messages, { url, source: 'generated' | 'original', messages }, best on the generated source.",
      readBy: ['rgaa-markup-validation-review']
    }
  }
});
