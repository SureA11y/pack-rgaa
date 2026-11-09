/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * What the pack reads of rule-map.js besides the standard, which core builds
 * from the data (standard-data.js): the tests each rule checks, the tests
 * rules can decide, and the criteria whose rules check all of them. The
 * procedures (procedures.js) and the rules' facets (index.js) read them.
 */

const { RGAA_RULE_TESTS } = require('./rule-map');

// The criteria whose rules check all their tests ask, on every element they
// apply to, so their rollup may pass, or be notApplicable, on the rules
// alone. Every other criterion's rollup is partial (core's meta.partial): it
// is cantTell where its rules all pass or all find nothing to check, as
// core's WCAG rollups are, since they check only some steps of its tests
// and a person checks the rest.
const COMPLETE_CHECK = {
  '4.1.2': [
    '2.1', // 2.1.1: every <iframe> and <frame> has a title attribute.
    '8.1', // 8.1.1 to 8.1.3: a doctype, valid, before <html>; asked without the source.
    '8.3', // 8.3.1: the default language is given on <html> or for every text.
    '8.5' // 8.5.1: the page has a <title>.
  ]
};

function rowOf(version, ruleId) {
  return (RGAA_RULE_TESTS[version] || {})[ruleId] || null;
}

const listOf = (v) => (Array.isArray(v) ? v : []);
const objectOf = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

// A row's routes: where its findings of a reason code (reasonCodes) or with
// given fields (findings) count instead of the row's own tests.
function routesOf(row) {
  return [...Object.values(objectOf(row && row.reasonCodes) || {}), ...listOf(row && row.findings)];
}

// Every test a rule's findings count toward or are asked about: the row's
// tests and asks, and those its routes send findings to.
function testsOfRule(version, ruleId) {
  const row = rowOf(version, ruleId);
  if (!row) return [];
  const all = new Set([...listOf(row.tests), ...listOf(row.asks)]);
  for (const r of routesOf(row)) for (const t of listOf(r && r.tests)) all.add(t);
  return [...all];
}

// The tests of a version some rule's findings count toward or ask about.
function testsWithRules(version) {
  return new Set(
    Object.keys(RGAA_RULE_TESTS[version] || {}).flatMap((ruleId) => testsOfRule(version, ruleId))
  );
}

// The tests of a version some automatic rule can decide: a finding counts
// toward them as a failure. A test a rule only asks about, or only a manual
// rule looks at, is left to a person.
function testsRulesDecide(version, isManual) {
  const out = new Set();
  for (const [ruleId, row] of Object.entries(RGAA_RULE_TESTS[version] || {})) {
    if (isManual(ruleId)) continue;
    for (const t of listOf(row.tests)) out.add(t);
    for (const route of routesOf(row)) {
      if (route.outcome !== 'cantTell') for (const t of listOf(route.tests)) out.add(t);
    }
  }
  return out;
}

module.exports = {
  testsRulesDecide,
  testsOfRule,
  testsWithRules,
  COMPLETE_CHECK
};
