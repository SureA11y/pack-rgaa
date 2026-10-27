'use strict';

/**
 * The pack's profile, rgaa-4.1.2: RGAA alone, the pack's own rules and the
 * core rules rule-map.js gives an RGAA test, whether WCAG or best-practice
 * rules, judged by WCAG 2.1, the version RGAA 4.1.2 is built on, with RGAA's
 * criteria only in the results. The tests' own profile, which adds every
 * WCAG 2.1 A and AA rule (tests/helpers/run.js), must give the same RGAA
 * results on every scenario page: the rules it adds count for no RGAA test.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml, TEST_PROFILE } = require('./helpers/run.js');
const { CHECK_DEFS } = require('@surea11y/core');
const rgaa = require('..');
const { RGAA_RULE_TESTS } = require('../rule-map');

const PAGE =
  '<!doctype html><html lang="fr"><head><title>Accueil</title></head><body><main>' +
  '<h1>Médiathèque</h1><img src="logo.png"><p id="a">Horaires</p><p id="a">Accès</p>' +
  '<p style="color:#767676;background:#fff">Texte gris</p></main></body></html>';

const scan = (profile, html = PAGE) => runa11yCoreOnHtml(html, { engineOptions: { profile } });
const ran = (result) => result.checksResults.map((c) => c.ruleId).sort();
const check = (result, id) => result.checksResults.find((c) => c.ruleId === id);

// The core rules rule-map.js gives at least one RGAA 4.1.2 test, as one its
// findings fail or one they only ask about.
const MAPPED_CORE = CHECK_DEFS.map((d) => d.ruleId).filter((id) => {
  const row = RGAA_RULE_TESTS['4.1.2'][id] || {};
  return (row.tests || []).length > 0 || (row.asks || []).length > 0;
});
const OWN = rgaa.rules.map((r) => r.id);

test('rgaa-4.1.2 runs the pack’s rules and the core rules mapped to an RGAA test, nothing else', () => {
  const result = scan('rgaa-4.1.2');
  assert.equal(result.engine.profile, 'rgaa-4.1.2');
  assert.deepEqual(ran(result), OWN.concat(MAPPED_CORE).sort());
  for (const c of result.checksResults) {
    assert.ok(
      c.rollupIds.some((id) => id.startsWith('rgaa-4.1.2-')) ||
        c.ruleId.startsWith('rgaa-') ||
        c.outcome === 'notApplicable',
      `${c.ruleId} counts for an RGAA criterion`
    );
  }
  assert.ok(!ran(result).includes('contrast-minimum'), 'RGAA judges contrast with its own rule');
});

test('rgaa-4.1.2 reports RGAA’s criteria and no WCAG ones', () => {
  const result = scan('rgaa-4.1.2');
  assert.ok(result.rulesResults.length > 40);
  for (const r of result.rulesResults) assert.match(r.ruleId, /^rgaa-4\.1\.2-/);
});

test('rgaa-4.1.2 is judged by WCAG 2.1, so a duplicate id fails RGAA 8.2.1', () => {
  const result = scan('rgaa-4.1.2');
  assert.equal(result.engine.wcagVersion, '2.1');
  assert.equal(check(result, 'duplicate-id').outcome, 'fail');
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-8.2').outcome, 'fail');
});

test('the published pack has one profile, rgaa-4.1.2', () => {
  assert.deepEqual(Object.keys(rgaa.standard.profiles), ['rgaa-4.1.2']);
});

test('the tests’ own profile adds every WCAG 2.1 A and AA rule, and WCAG’s criteria', () => {
  const only = scan('rgaa-4.1.2');
  const both = scan(TEST_PROFILE);
  assert.equal(both.engine.profile, TEST_PROFILE);
  assert.equal(both.engine.wcagVersion, '2.1');
  for (const id of ran(only)) assert.ok(ran(both).includes(id), `${id} runs with WCAG too`);
  assert.ok(ran(both).includes('contrast-minimum'));
  assert.ok(ran(both).length > ran(only).length);
  assert.ok(both.rulesResults.some((r) => r.ruleId === 'wcag-1.4.3-contrast-minimum'));
});

test('rgaa-4.1.2 and the tests’ profile give the same RGAA results on every scenario page', () => {
  const dir = path.join(__dirname, 'fixtures');
  const pages = fs.readdirSync(dir).filter((f) => f.endsWith('-all-scenarios.html'));
  assert.ok(pages.length > 60);
  const rgaaOf = (result) => ({
    criteria: result.rulesResults
      .filter((r) => r.ruleId.startsWith('rgaa-4.1.2-'))
      .map((r) => [r.ruleId, r.outcome]),
    rules: result.checksResults
      .filter((c) => c.rollupIds.some((id) => id.startsWith('rgaa-4.1.2-')))
      .map((c) => [c.ruleId, c.outcome, c.occurrences.length])
      .sort()
  });
  for (const page of pages) {
    const html = fs.readFileSync(path.join(dir, page), 'utf8');
    assert.deepEqual(rgaaOf(scan('rgaa-4.1.2', html)), rgaaOf(scan(TEST_PROFILE, html)), page);
  }
});
