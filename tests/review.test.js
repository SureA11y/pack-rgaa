'use strict';

/**
 * The steps that answer an undecided finding ("How to check"): each pack
 * rule lists its reason codes (meta.reasonCodes) and gives steps for every
 * code it asks about (meta.review), which core adds to a result as
 * occurrence.howToCheck. A variant takes its core rule's.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { addHowToCheck } = require('@surea11y/core');
const { runa11yCoreOnHtml, rgaa } = require('./helpers/run.js');
const pack = require('..');

const FIXTURES = path.join(__dirname, 'fixtures');
const OWN = pack.rules.filter((r) => !r.from);
const VARIANTS = pack.rules.filter((r) => r.from).map((r) => r.id);

test('every rule of its own lists its reason codes, and gives steps only for those', () => {
  for (const rule of OWN) {
    const codes = rule.meta.reasonCodes;
    assert.ok(Array.isArray(codes) && codes.length, `${rule.id} lists its reason codes`);
    assert.equal(new Set(codes).size, codes.length, `${rule.id} lists each code once`);
    for (const code of Object.keys(rule.meta.review || {})) {
      assert.ok(codes.includes(code), `${rule.id}: steps for ${code}, which it does not list`);
    }
  }
});

test('every manual rule gives steps for each code it lists', () => {
  for (const rule of OWN.filter((r) => r.meta.type === 'manual')) {
    assert.deepEqual(
      Object.keys(rule.meta.review || {}).sort(),
      [...rule.meta.reasonCodes].sort(),
      rule.id
    );
  }
});

// Every scenario page: each finding a pack rule leaves undecided gives its
// reason code, and the steps to answer it, the variants' from core's rules.
test('on every scenario page, each undecided finding of a pack rule comes with its steps', () => {
  const ids = pack.rules.map((r) => r.id);
  const files = fs.readdirSync(FIXTURES).filter((f) => f.endsWith('.html'));
  let checked = 0;
  for (const file of files) {
    const html = fs.readFileSync(path.join(FIXTURES, file), 'utf8');
    const result = addHowToCheck(
      // Only the pack's rules: core's other rules give no steps checked here,
      // and running them on every page doubled the test's time.
      runa11yCoreOnHtml(html, {
        runOnly: { includeRuleIds: ids },
        engineOptions: { profile: 'rgaa-4.1.2' }
      }),
      { packs: [rgaa] }
    );
    for (const check of result.checksResults.filter((c) => ids.includes(c.ruleId))) {
      for (const occ of check.occurrences || []) {
        if ((occ.occurrenceOutcome || check.outcome) !== 'cantTell') continue;
        const code = occ.data && occ.data.details && occ.data.details.reasonCode;
        assert.ok(code, `${file}: ${check.ruleId} asks without a reason code`);
        if (VARIANTS.includes(check.ruleId)) continue;
        assert.ok(occ.howToCheck, `${file}: ${check.ruleId} asks (${code}) with no steps`);
        assert.ok(occ.howToCheck.steps.length >= 1, `${check.ruleId} ${code}`);
        checked += 1;
      }
    }
  }
  assert.ok(checked > 100, `${checked} undecided findings checked`);
});

test('the steps are given in the scan’s locale, with what fails named the same way', () => {
  const html =
    '<!doctype html><html lang="fr"><head><title>t</title></head><body><main>' +
    '<p>• Pain<br>• Lait<br>• Œufs</p></main></body></html>';
  const run = (locale) =>
    addHowToCheck(runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2', locale } }), {
      packs: [rgaa]
    }).checksResults.find((c) => c.ruleId === 'rgaa-fake-list').occurrences[0].howToCheck;
  const en = run('en');
  assert.match(en.failWhen, /RGAA 9\.3\.1/);
  const fr = run('fr');
  assert.notEqual(fr.failWhen, en.failWhen);
  assert.match(fr.failWhen, /RGAA 9\.3\.1/);
  assert.equal(fr.steps.length, en.steps.length);
});

test("every step of the pack's rules is translated, in every language", () => {
  const en = require('../index').rules.flatMap((rule) => {
    if (rule.from) return [];
    const prefix = rule.meta.i18n.titleKey.replace(/_title$/, '');
    return Object.entries(rule.meta.review || {}).flatMap(([code, entry]) => [
      `${prefix}_review_${code}_pass`,
      `${prefix}_review_${code}_fail`,
      ...entry.steps.map((_, i) => `${prefix}_review_${code}_step${i + 1}`)
    ]);
  });
  for (const locale of ['fr', 'de', 'es', 'ja']) {
    const dictionary = pack.dictionaries[locale];
    assert.deepEqual(
      en.filter((key) => !dictionary[key]),
      [],
      locale
    );
  }
});

test('a finding of a rule linked to several tests reads under the test it fails', () => {
  const { RGAA_RULE_TESTS } = require('../rule-map');
  const { RGAA_CRITERIA } = require('../map');
  const facet = (test) => `test-${test.replace(/\./g, '-')}`;
  for (const rule of pack.rules) {
    if (rule.from) continue;
    const row = RGAA_RULE_TESTS['4.1.2'][rule.id];
    for (const [code, entry] of Object.entries(rule.meta.review || {})) {
      const named = (entry.failWhen.match(/\d+\.\d+(?:\.\d+)?/g) || []).flatMap((id) =>
        id.split('.').length === 2 ? (RGAA_CRITERIA['4.1.2'][id] || {}).tests || [] : [id]
      );
      const linked = named.filter((t) => row.tests.includes(t) || (row.asks || []).includes(t));
      if (!linked.length || !entry.facet) continue;
      assert.ok(
        named.map(facet).includes(entry.facet),
        `${rule.id} ${code} is under ${entry.facet}, and fails ${named.join(', ')}`
      );
    }
  }
});

test("core's steps in RGAA's terms are as generated, and name no WCAG", async () => {
  const { REVIEW } = require('../review');
  const generator = require('../scripts/generate-review');
  const expected = await generator.formatted(generator.renderModule(generator.buildReview()));
  assert.equal(
    fs.readFileSync(path.join(__dirname, '..', 'review.js'), 'utf8'),
    expected,
    'run npm run review'
  );
  assert.doesNotMatch(JSON.stringify(REVIEW), /WCAG|\bAAA?\b|bonnes? pratiques?|18[.,]66|7:1/);
  // A failure names what it fails, whatever core's words were.
  for (const [ruleId, codes] of Object.entries(REVIEW['4.1.2'])) {
    for (const [code, entry] of Object.entries(codes)) {
      assert.match(entry.failWhen, /RGAA/, `${ruleId} ${code}`);
    }
  }
});

test("the generator refuses a code left in WCAG's terms", () => {
  const { buildReview } = require('../scripts/generate-review');
  const dictionary = {
    pageTitlePresent_review_X_step1: 'Regardez.',
    pageTitlePresent_review_X_pass: 'Selon WCAG 2.2, cela va.',
    pageTitlePresent_review_X_fail: 'Niveau AAA.'
  };
  const table = { 'page-title-present': { tests: ['8.5.1'] } };
  assert.throws(() => buildReview(dictionary, table, {}), /still in WCAG's terms/);
});

test("the variants' steps use RGAA's thresholds, in every language", () => {
  const { VARIANT_REVIEW } = require('../review');
  const texts = JSON.stringify(VARIANT_REVIEW['rgaa-contrast-minimum']);
  assert.doesNotMatch(texts, /18[.,]66/);
  assert.match(texts, /18\.5px/);
  assert.doesNotMatch(texts, /WCAG/);
});
