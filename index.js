/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA 4.1.2, the French accessibility standard, as a pack
 * (@surea11y/core/pack): passed to a scan in engineOptions.packs, it brings
 * the standard (its criteria and tests, generated from data/), the tests each
 * rule checks (rule-map.js), one rollup per criterion (mappings.js), the
 * rgaa-4.1.2 profile, 111 rules for what RGAA requires beyond WCAG or judges
 * differently (rules/), their messages in English and French (i18n/), and RGAA's
 * own methodology as the procedures a person follows (procedures.js).
 *
 * RGAA does not restate WCAG criterion by criterion, so the standard is mapped
 * rule by rule: RGAA's criteria are its own, related to WCAG many to many.
 */

const fs = require('fs');
const path = require('path');

const { definePack } = require('@surea11y/core/pack');
const { name, version } = require('./package.json');
const { RGAA_VERSIONS } = require('./map');
const {
  rgaaMappingsFor,
  rgaaComposites,
  validateRgaaRuleTests,
  testsOfRule
} = require('./mappings');
const { proceduresOf, facetOf } = require('./procedures');
const { REVIEW, VARIANT_REVIEW, CORE_MANUAL_RULES } = require('./review');
const { RGAA_TESTS } = require('./map');
const { RGAA_RULE_TESTS } = require('./rule-map');

// The WCAG version an RGAA version is built on.
const wcagVersionOf = (version) => RGAA_VERSIONS.find((v) => v.version === version).wcagVersion;

const LATEST = RGAA_VERSIONS.at(-1).version;

// The test a reason code's findings count toward, so that a person reads a
// rule's steps under that test's facet in the procedures.
function firstTestOf(rule, code) {
  const row = RGAA_RULE_TESTS[LATEST][rule.id];
  const route = row.reasonCodes && row.reasonCodes[code];
  const finding = (row.findings || []).find((f) => f.when.reasonCode === code);
  return [
    ...((route && route.tests) || []),
    ...((finding && finding.tests) || []),
    ...row.tests,
    ...(row.asks || [])
  ][0];
}

// A rule claims the facets of the tests rule-map.js links it to, so what a
// rule checks and what the procedures list under each test can't disagree.
function claimingItsTests(source) {
  const variant = VARIANT_REVIEW[source.id];
  const rule = variant ? { ...source, meta: { ...source.meta, review: variant.review } } : source;
  const tests = testsOfRule(LATEST, rule.id);
  if (!tests.length) return rule;
  const facetsByRequirement = {};
  for (const test of tests) {
    const { criterion } = RGAA_TESTS[LATEST][test];
    (facetsByRequirement[criterion] = facetsByRequirement[criterion] || []).push(facetOf(test));
  }
  const review = Object.fromEntries(
    Object.entries(rule.meta.review || {}).map(([code, entry]) => [
      code,
      { ...entry, facet: facetOf(firstTestOf(rule, code) || tests[0]) }
    ])
  );
  return {
    ...rule,
    meta: {
      ...rule.meta,
      ...(rule.meta.review ? { review } : {}),
      coverage: { ...rule.meta.coverage, facetsBySc: {}, facetsByRequirement }
    }
  };
}

// Every rule module in rules/automatic and rules/manual, by file name.
const RULES_DIR = path.join(__dirname, 'rules');
const rules = ['automatic', 'manual'].flatMap((type) =>
  fs
    .readdirSync(path.join(RULES_DIR, type))
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => claimingItsTests(require(path.join(RULES_DIR, type, file))))
);

// A dictionary, with the steps of the variants in its locale.
function withVariantSteps(locale, dictionary) {
  return Object.values(VARIANT_REVIEW).reduce(
    (all, { dictionaries }) => ({ ...all, ...dictionaries[locale] }),
    dictionary
  );
}

// One dictionary per locale file in i18n/.
const I18N_DIR = path.join(__dirname, 'i18n');
const dictionaries = Object.fromEntries(
  fs
    .readdirSync(I18N_DIR)
    .filter((file) => /^[a-z]{2}(-[A-Za-z0-9]+)?\.json$/.test(file))
    .map((file) => [
      file.replace(/\.json$/, ''),
      withVariantSteps(
        file.replace(/\.json$/, ''),
        JSON.parse(fs.readFileSync(path.join(I18N_DIR, file), 'utf8'))
      )
    ])
);

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
  report: { noteKey: 'report_rgaaRollup_note', titleLang: 'fr' },
  // How a person assesses it, in RGAA's own words (procedures.js), and how
  // they answer core's findings in RGAA's terms (review.js). The standard is
  // French, so its own text, the procedures, is read in French in every
  // locale. lang says nothing of the review: core reads standard.review as
  // English and translates it through the dictionaries (i18n/fr.json), so a
  // finding reads the steps in the scan's locale, French or English, and in
  // English where the pack has no translation.
  lang: 'fr',
  ...proceduresOf(
    (ruleId) =>
      CORE_MANUAL_RULES.includes(ruleId) ||
      rules.some((rule) => rule.id === ruleId && rule.meta.type === 'manual')
  ),
  review: REVIEW['4.1.2']
};

module.exports = definePack({
  name,
  version,
  namespace: 'rgaa',
  // Certain failures in rule-map.js (outcome: 'fail') need core 1.15.
  core: '^1.15.0',
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
        'Where each page of the site places its skip link, { ensemble?, pages: [{ url, ensemble?, viewportWidth, skipLink: { text, href, focusOrder, x, y, width, height } | null }] }, measured at one window width; `ensemble` names the « ensemble de pages » a page belongs to.',
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
