/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA entries for a rule or composite, shaped as `normativeMappings`
 * entries, for the profile's descriptor (index.js).
 */

const { RGAA_VERSIONS, RGAA_CRITERIA, RGAA_TESTS } = require('./map');
const { RGAA_RULE_TESTS } = require('./rule-map');

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

// A row's `reasonCodes`: { [code]: { tests, outcome } } sends the rule's
// findings of one reason code to other tests (`tests`, default the row's;
// [] for none), and `outcome: 'cantTell'` makes a failing one a question
// there.
function codesOf(row) {
  return row && row.reasonCodes && typeof row.reasonCodes === 'object' ? row.reasonCodes : null;
}

function ownTestsOf(row) {
  return row && Array.isArray(row.tests) ? row.tests : [];
}

// Every test a rule's findings count toward: the row's, and those its
// reason codes send findings to.
function testsOfRule(version, ruleId) {
  const row = rowOf(version, ruleId);
  const own = ownTestsOf(row);
  const codes = codesOf(row);
  if (!codes) return own;
  const all = new Set(own);
  for (const c of Object.values(codes)) {
    for (const t of c && Array.isArray(c.tests) ? c.tests : []) all.add(t);
  }
  return [...all].sort(compareIds);
}

// What a rule's findings do in the rollup of criterion `tests` (its tests),
// by reason code: 'count', 'cantTell' (a failing one is a question) or
// 'ignore', and `default` for a code not listed; null for a rule without
// reasonCodes, which is judged whole. Core reads it from the rollup's
// meta.contributions, as for a standard built with ruleMappedStandard.
function contributionOf(version, ruleId, tests) {
  const row = rowOf(version, ruleId);
  const codes = codesOf(row);
  if (!codes) return null;
  const own = ownTestsOf(row);
  const touches = (list) => list.some((t) => tests.includes(t));
  const out = { default: touches(own) ? 'count' : 'ignore', codes: {} };
  for (const [code, c] of Object.entries(codes)) {
    const list = c && Array.isArray(c.tests) ? c.tests : own;
    out.codes[code] = !touches(list)
      ? 'ignore'
      : c && c.outcome === 'cantTell'
        ? 'cantTell'
        : 'count';
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
      // The rules judged by their findings' reason codes in this rollup.
      const contributions = {};
      for (const ruleId of ruleIds) {
        const c = contributionOf(version, ruleId, row.tests);
        if (c) contributions[ruleId] = c;
      }
      // A criterion some of whose tests no rule checks: core rolls it up as
      // cantTell (partialCoverage) rather than notApplicable when its rules
      // are all notApplicable, since they only found none of the cases
      // they look for.
      const partial = row.tests.some((t) => !tests.includes(t));
      out.push({
        id: `rgaa-${version}-${criterion}`,
        checksIds: ruleIds,
        meta: {
          ...(Object.keys(contributions).length ? { contributions } : {}),
          ...(partial ? { partial: true } : {}),
          title: row.title,
          description: '',
          wcagSc: [],
          level: null,
          standard: 'RGAA',
          version,
          criterion,
          tags: ['rgaa'],
          standardMappings: tests.map((t) => entry(version, t, []))
        }
      });
    }
  }
  return out;
}

const ROW_KEYS = ['tests', 'note', 'outsideCorrespondence', 'reasonCodes'];
const CODE_KEYS = ['tests', 'outcome'];

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
      if (row.reasonCodes !== undefined) {
        const codes = row.reasonCodes;
        if (!codes || typeof codes !== 'object' || Array.isArray(codes)) {
          problems.push(`${version} ${ruleId}: reasonCodes must be an object of reason codes`);
        } else {
          for (const [code, c] of Object.entries(codes)) {
            if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(code)) {
              problems.push(`${version} ${ruleId}: reasonCodes names ${code}, not a reason code`);
            }
            if (!c || typeof c !== 'object' || Array.isArray(c)) {
              problems.push(`${version} ${ruleId}: reasonCodes ${code} must be { tests, outcome }`);
              continue;
            }
            for (const key of Object.keys(c)) {
              if (!CODE_KEYS.includes(key)) {
                problems.push(`${version} ${ruleId}: reasonCodes ${code}: unknown field ${key}`);
              }
            }
            if (c.tests !== undefined && !Array.isArray(c.tests)) {
              problems.push(`${version} ${ruleId}: reasonCodes ${code}: tests must be a list`);
            }
            if (c.outcome !== undefined && c.outcome !== 'cantTell') {
              problems.push(
                `${version} ${ruleId}: reasonCodes ${code}: outcome can only be 'cantTell'`
              );
            }
          }
        }
      }
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

module.exports = { rgaaMappingsFor, rgaaComposites, validateRgaaRuleTests };
