/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA entries for a rule or composite, shaped as `normativeMappings`
 * entries, for the profile's descriptor (index.js).
 */

const { RGAA_VERSIONS, RGAA_CRITERIA, RGAA_TESTS } = require('./map');
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

function compareIds(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

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

// What a finding that goes by `route` does in the rollup of a criterion
// whose tests are `criterionTests`: counted toward the tests of the route it
// shares with the criterion (a failing one as a question where the route
// says outcome 'cantTell', a question as a failure where it says 'fail'),
// else a question in the tests the row asks about there, else left out. The row itself is the route of a finding no other
// route takes, with its asks.
const ACT_OF_OUTCOME = { cantTell: 'cantTell', fail: 'fail' };

function actFor(route, asks, criterionTests) {
  const counted = listOf(route.tests).filter((t) => criterionTests.includes(t));
  if (counted.length) {
    return { act: ACT_OF_OUTCOME[route.outcome] || 'count', requirements: counted };
  }
  const asked = listOf(asks).filter((t) => criterionTests.includes(t));
  return asked.length ? { act: 'cantTell', requirements: asked } : 'ignore';
}

// How a criterion's rollup judges a rule whose row asks or routes findings
// (core's meta.contributions): each finding by the first `findings` entry
// it matches, else by its reason code, else by the row. null for a rule
// judged whole, whose findings all count toward its tests.
function contributionOf(version, ruleId, criterionTests) {
  const row = rowOf(version, ruleId);
  if (!row || (!listOf(row.asks).length && !routesOf(row).length)) return null;
  const own = { tests: listOf(row.tests) };
  const out = { default: actFor(own, row.asks, criterionTests) };
  const codes = objectOf(row.reasonCodes);
  if (codes) {
    out.codes = {};
    for (const [code, r] of Object.entries(codes)) {
      out.codes[code] = actFor(
        { tests: r.tests || own.tests, outcome: r.outcome },
        [],
        criterionTests
      );
    }
  }
  if (listOf(row.findings).length) {
    out.findings = row.findings.map((f) => ({
      when: { ...f.when },
      act: actFor({ tests: f.tests || own.tests, outcome: f.outcome }, [], criterionTests)
    }));
  }
  return out;
}

// Tests a rule is linked to although RGAA relates their criterion to none of
// the rule's WCAG criteria, each with the reason it is linked anyway.
function exceptionsOf(version, ruleId) {
  const row = rowOf(version, ruleId);
  const out = row && row.outsideCorrespondence;
  return out && typeof out === 'object' && !Array.isArray(out) ? out : {};
}

// One entry per test. `wcagSc` is the WCAG criteria the entry belongs under:
// those of the rule (or composite) that RGAA relates to the test's criterion,
// or all of the criterion's when the rule has no WCAG mapping of its own. A
// test linked outside RGAA's correspondence goes under the rule's own
// criteria, next to its other findings.
function entry(version, test, wcagSc, outside) {
  const t = RGAA_TESTS[version][test];
  const criterionSc = RGAA_CRITERIA[version][t.criterion].wcagSc;
  const own = Array.isArray(wcagSc) ? wcagSc.map((s) => String(s).trim()) : [];
  let shared = own.length ? criterionSc.filter((sc) => own.includes(sc)) : criterionSc.slice();
  if (outside && !shared.length) shared = own.slice();
  return {
    standard: 'RGAA',
    version,
    requirement: test,
    title: t.title,
    criterion: t.criterion,
    wcagSc: shared
  };
}

/**
 * The RGAA entries for a rule ({ id, wcagSc }) or, given `checksIds`, for a
 * composite: the tests of its rules that RGAA relates to the composite's own
 * criteria. Oldest version first, tests in RGAA order.
 */
function rgaaMappingsFor({ id, wcagSc, checksIds }) {
  const out = [];
  for (const { version } of RGAA_VERSIONS) {
    const byTest = new Map();
    for (const ruleId of Array.isArray(checksIds) ? checksIds : [id]) {
      const outside = exceptionsOf(version, ruleId);
      for (const test of testsOfRule(version, ruleId)) {
        const e = entry(version, test, wcagSc, Object.prototype.hasOwnProperty.call(outside, test));
        if (e.wcagSc.length && !byTest.has(test)) byTest.set(test, e);
      }
    }
    for (const test of [...byTest.keys()].sort(compareIds)) out.push(byTest.get(test));
  }
  return out;
}

/**
 * One rollup per RGAA criterion that at least one rule is linked to, grouping
 * those rules, in the shape of src/catalogs/composites.wcag.js entries. They
 * carry the rgaa tag, so only a run that asks for RGAA (its profile) produces
 * them, and meta.standard 'RGAA' with the criterion, so a consumer can tell
 * them from WCAG rollups. Their RGAA entries are the criterion's tests the
 * grouped rules are linked to; the runner narrows them to the rules that
 * decided the outcome, as for any rollup.
 */
function rgaaComposites() {
  const out = [];
  for (const { version } of RGAA_VERSIONS) {
    const table = RGAA_RULE_TESTS[version] || {};
    for (const [criterion, row] of Object.entries(RGAA_CRITERIA[version])) {
      const ruleIds = Object.keys(table)
        .filter((ruleId) => testsOfRule(version, ruleId).some((t) => row.tests.includes(t)))
        .sort();
      if (!ruleIds.length) continue;
      const tests = [
        ...new Set(
          ruleIds
            .flatMap((ruleId) => testsOfRule(version, ruleId))
            .filter((t) => row.tests.includes(t))
        )
      ].sort(compareIds);
      const contributions = {};
      for (const ruleId of ruleIds) {
        const c = contributionOf(version, ruleId, row.tests);
        if (c) contributions[ruleId] = c;
      }
      out.push({
        id: `rgaa-${version}-${criterion}`,
        checksIds: ruleIds,
        meta: {
          ...(Object.keys(contributions).length ? { contributions } : {}),
          title: row.title,
          description: '',
          wcagSc: [],
          level: null,
          standard: 'RGAA',
          version,
          criterion,
          tags: ['rgaa'],
          ...((COMPLETE_CHECK[version] || []).includes(criterion) ? {} : { partial: true }),
          standardMappings: tests.map((t) => entry(version, t, []))
        }
      });
    }
  }
  return out;
}

const ROW_KEYS = ['tests', 'asks', 'reasonCodes', 'findings', 'note', 'outsideCorrespondence'];

// Problems with a row's asks and routes; `at` starts each message.
function routeProblems(row, at) {
  const problems = [];
  // A route's tests may be [] (its findings count toward no test); asks may not.
  const testsField = (tests, where, emptyAllowed = true) => {
    if (tests !== undefined && (!Array.isArray(tests) || (!emptyAllowed && !tests.length))) {
      problems.push(`${at}: ${where} must be a ${emptyAllowed ? '' : 'non-empty '}list of tests`);
    }
  };
  const outcomeField = (outcome, where) => {
    if (outcome !== undefined && outcome !== 'cantTell' && outcome !== 'fail') {
      problems.push(`${at}: ${where}.outcome can only be 'cantTell' or 'fail'`);
    }
  };
  testsField(row.asks, 'asks', false);
  for (const t of listOf(row.asks)) {
    if (row.tests.includes(t)) problems.push(`${at}: asks names ${t}, which tests already counts`);
  }
  if (row.reasonCodes !== undefined) {
    if (!objectOf(row.reasonCodes))
      problems.push(`${at}: reasonCodes must be an object of reason codes`);
    else
      for (const [code, r] of Object.entries(row.reasonCodes)) {
        if (!objectOf(r)) problems.push(`${at}: reasonCodes.${code} must be { tests, outcome }`);
        else {
          testsField(r.tests, `reasonCodes.${code}.tests`);
          outcomeField(r.outcome, `reasonCodes.${code}`);
        }
      }
  }
  if (row.findings !== undefined) {
    if (!Array.isArray(row.findings)) problems.push(`${at}: findings must be a list`);
    else
      row.findings.forEach((f, i) => {
        const where = `findings[${i}]`;
        const when = objectOf(f) && objectOf(f.when);
        if (!when || !Object.keys(when).length) {
          problems.push(`${at}: ${where}.when must name at least one field`);
          return;
        }
        for (const [path, value] of Object.entries(when)) {
          if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
            problems.push(`${at}: ${where}.when.${path} must be a string, number, boolean or null`);
          }
        }
        testsField(f.tests, `${where}.tests`);
        outcomeField(f.outcome, where);
      });
  }
  return problems;
}

/**
 * Problems with the mapping table, given the rules that exist
 * ([{ ruleId, wcagSc }]). Empty means the table is sound.
 */
function validateRgaaRuleTests(rules) {
  const byId = new Map(rules.map((r) => [r.ruleId, r]));
  const problems = [];
  for (const [version, table] of Object.entries(RGAA_RULE_TESTS)) {
    if (!RGAA_TESTS[version]) {
      problems.push(`RGAA version ${version} has no test table`);
      continue;
    }
    for (const [ruleId, row] of Object.entries(table)) {
      const rule = byId.get(ruleId);
      if (!rule) {
        problems.push(`${version} ${ruleId}: no such rule`);
        continue;
      }
      if (!row || !Array.isArray(row.tests) || typeof row.note !== 'string' || !row.note.trim()) {
        problems.push(`${version} ${ruleId}: needs { tests: [...], note: '...' }`);
        continue;
      }
      for (const key of Object.keys(row)) {
        if (!ROW_KEYS.includes(key)) problems.push(`${version} ${ruleId}: unknown field ${key}`);
      }
      const routing = routeProblems(row, `${version} ${ruleId}`);
      problems.push(...routing);
      if (routing.length) continue;
      const linked = testsOfRule(version, ruleId);
      for (const test of Object.keys(exceptionsOf(version, ruleId))) {
        if (!linked.includes(test)) {
          problems.push(
            `${version} ${ruleId}: outsideCorrespondence names ${test}, which is not linked`
          );
        }
      }
      if (new Set(row.tests).size !== row.tests.length) {
        problems.push(`${version} ${ruleId}: lists a test twice`);
      }
      for (const test of linked) {
        if (!RGAA_TESTS[version][test]) {
          problems.push(`${version} ${ruleId}: no such test ${test}`);
          continue;
        }
        const outside = exceptionsOf(version, ruleId);
        const related =
          !(rule.wcagSc || []).length || entry(version, test, rule.wcagSc).wcagSc.length;
        const reason = outside[test];
        if (!related && !(typeof reason === 'string' && reason.trim())) {
          const crit = RGAA_TESTS[version][test].criterion;
          problems.push(
            `${version} ${ruleId}: test ${test} belongs to criterion ${crit}, which RGAA relates to ` +
              `WCAG ${RGAA_CRITERIA[version][crit].wcagSc.join(', ')}, none of the rule's (${rule.wcagSc.join(', ')}); ` +
              `link it only with a reason in outsideCorrespondence`
          );
        }
        if (related && reason !== undefined) {
          problems.push(
            `${version} ${ruleId}: outsideCorrespondence names ${test}, which RGAA already relates to the rule's criteria`
          );
        }
      }
    }
  }
  return problems;
}

// The tests of a version some rule's findings count toward or ask about.
function testsWithRules(version) {
  return new Set(
    Object.keys(RGAA_RULE_TESTS[version] || {}).flatMap((ruleId) => testsOfRule(version, ruleId))
  );
}

module.exports = {
  rgaaMappingsFor,
  rgaaComposites,
  validateRgaaRuleTests,
  testsOfRule,
  testsWithRules,
  COMPLETE_CHECK
};
