'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-valid-lang';
const WCAG_RULE = 'valid-lang';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } };

function page(lang, text = 'Bonjour') {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main><p id="p" lang="${lang}">${text}</p></main></body></html>`;
}

const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: ISO 639-1 codes pass`, () => {
  for (const lang of ['fr', 'EN', 'en-US', 'zh-Hant-TW', 'ast']) {
    assertRule(run(page(lang)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// 8.8.1: « conforme à la norme ISO 639-1 ou ISO 639-2 et suivantes ».
test(`${RULE_ID}: ISO 639-2 codes the IANA registry leaves out pass, and the local-use range`, () => {
  for (const lang of ['fra', 'fre', 'ger', 'deu-DE', 'eng-GB', 'chi', 'qaa', 'qtz']) {
    assertRule(run(page(lang)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a code that is not ISO 639 fails, with the variant's messages`, () => {
  for (const [lang, summaryKey, hintKey = 'validLangRgaa_hint_fail'] of [
    ['xx', 'validLangRgaa_summary_unknown'],
    ['qza', 'validLangRgaa_summary_unknown'],
    ['english', 'validLangRgaa_summary_unknown'],
    ['en_US', 'validLangRgaa_summary_fail', 'validLangRgaa_hint_fail_underscore']
  ]) {
    const rule = assertRule(run(page(lang)), RULE_ID, 'fail', { maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'ELEMENT_LANG_INVALID', lang);
    assert.equal(occ.i18n.summaryKey, summaryKey, lang);
    assert.equal(occ.i18n.hintKey, hintKey, lang);
  }
});

test(`${RULE_ID}: opt-in, so a default run and a WCAG profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(page('xx'), { engineOptions });
    assert.ok(!check(result, RULE_ID), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the map links it to 8.8.1, and valid-lang to no RGAA test`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['8.8.1']);
  assert.deepEqual(map[WCAG_RULE].tests, []);
});

// WCAG 3.1.2 checks against the IANA registry (ACT de46e4), RGAA 8.8.1
// against ISO 639, so lang="fra" fails one and passes the other.
test(`${RULE_ID}: lang="fra" fails WCAG 3.1.2 and passes RGAA 8.8`, () => {
  const result = run(page('fra'), RGAA);
  assert.equal(check(result, WCAG_RULE).outcome, 'fail');
  assert.equal(check(result, RULE_ID).outcome, 'pass');
  assert.equal(rollupOutcome(rollup(result, 'wcag-3.1.2-language-of-parts')), 'fail');
  assert.notEqual(rollupOutcome(rollup(result, 'rgaa-4.1.2-8.8')), 'fail');
});

test(`${RULE_ID}: a code that is no language fails both`, () => {
  const result = run(page('xx'), RGAA);
  assert.equal(rollupOutcome(rollup(result, 'wcag-3.1.2-language-of-parts')), 'fail');
  assert.equal(rollupOutcome(rollup(result, 'rgaa-4.1.2-8.8')), 'fail');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(run(fs.readFileSync(fixturePath, 'utf8')), RULE_ID, 'fail', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  assert.deepEqual(
    rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]),
    ['rvl_case_05', 'rvl_case_06']
  );
});
