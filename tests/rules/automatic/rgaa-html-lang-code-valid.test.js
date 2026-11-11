'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-html-lang-code-valid';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } };

function page(htmlAttrs, body = '<main><p>Hello</p></main>') {
  return `<!doctype html><html${htmlAttrs}><head><title>t</title></head><body>${body}</body></html>`;
}

const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: ISO 639-1 codes pass, with any option after the hyphen`, () => {
  for (const lang of ['fr', 'EN', 'en-US', 'fr-FR-!!', 'zh-Hant-TW']) {
    assertRule(run(page(` lang="${lang}"`)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// 8.4.1: « conforme à la norme ISO 639-1 ou ISO 639-2 et suivantes ».
test(`${RULE_ID}: ISO 639-2 codes pass, including those the IANA registry leaves out`, () => {
  for (const lang of ['fra', 'fre', 'ger', 'eng-GB', 'gsw', 'qaa', 'hbs']) {
    assertRule(run(page(` lang="${lang}"`)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a code that is not ISO 639 fails`, () => {
  for (const [lang, code, suggestion] of [
    ['xx', 'xx'],
    ['english', 'english', 'en'],
    ['en_US', 'en_US', 'en-US'],
    ['x-klingon', 'x'],
    ['zzz', 'zzz']
  ]) {
    const rule = assertRule(run(page(` lang="${lang}"`)), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'invalidLanguageCode');
    assert.deepEqual(occ.i18n.params, {
      attribute: 'lang',
      value: lang,
      code,
      ...(suggestion ? { suggestion } : {})
    });
    assert.equal(occ.i18n.summaryKey, 'htmlLangCodeValid_summary_fail');
  }
});

test(`${RULE_ID}: xml:lang on <html> is judged as well`, () => {
  assertRule(run(page(' xml:lang="en"')), RULE_ID, 'pass');
  const rule = assertRule(run(page(' lang="en" xml:lang="english"')), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.attribute, 'xml:lang');
  assert.equal(
    rule.occurrences[0].summary,
    'The page\'s default language is given as xml:lang="english", and "english" is not an ISO 639 language code.'
  );
});

// 8.4.1 covers pages « ayant une langue par défaut ».
test(`${RULE_ID}: a page with no language on <html> is not applicable`, () => {
  for (const attrs of ['', ' lang=""', ' lang="  "']) {
    assertRule(run(page(attrs)), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
  const scoped = run(page(' lang="xx"'), { ...RUN, contextSelector: 'main' });
  assertRule(scoped, RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run(page(' lang="xx"'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'La langue par défaut de la page est indiquée par lang="xx", et « xx » n’est pas un code de langue ISO 639.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page(' lang="xx"'), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 8.4 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-8.4' } } }
  ]) {
    const rule = runa11yCoreOnHtml(page(' lang="xx"'), opts).checksResults.find(
      (r) => r.ruleId === RULE_ID
    );
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// html-lang-attr-present checks the IANA registry, which has no "fra".
test(`${RULE_ID}: RGAA 8.4 accepts lang="fra", which WCAG 3.1.1 fails in the same run`, () => {
  const result = runa11yCoreOnHtml(page(' lang="fra"'), RGAA);
  assert.equal(rollupOutcome(rollup(result, 'rgaa-4.1.2-8.4')), 'passedInPart');
  assert.equal(rollupOutcome(rollup(result, 'rgaa-4.1.2-8.3')), 'pass');
  assert.equal(rollupOutcome(rollup(result, 'wcag-3.1.1-language-of-page')), 'fail');
});

test(`${RULE_ID}: RGAA 8.4 and WCAG 3.1.1 agree on lang="xx" and on lang="fr"`, () => {
  const bad = runa11yCoreOnHtml(page(' lang="xx"'), RGAA);
  assert.equal(rollupOutcome(rollup(bad, 'rgaa-4.1.2-8.4')), 'fail');
  // The language is present: 8.3 passes although the code is invalid.
  assert.equal(rollupOutcome(rollup(bad, 'rgaa-4.1.2-8.3')), 'pass');
  assert.equal(rollupOutcome(rollup(bad, 'wcag-3.1.1-language-of-page')), 'fail');
  const good = runa11yCoreOnHtml(page(' lang="fr"'), RGAA);
  assert.equal(rollupOutcome(rollup(good, 'rgaa-4.1.2-8.4')), 'passedInPart');
  assert.equal(rollupOutcome(rollup(good, 'wcag-3.1.1-language-of-page')), 'passedInPart');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(run(fs.readFileSync(fixturePath, 'utf8')), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.value, 'english');
});

// The hint names the value the page likely means.
test(`${RULE_ID}: the hint names the value meant`, () => {
  for (const [lang, hintKey, hint] of [
    [
      'fr_FR',
      'htmlLangCodeValid_hint_fail_underscore',
      'Did you mean lang="fr-FR"? A language tag joins its parts with a hyphen, not an underscore.'
    ],
    [
      'french',
      'htmlLangCodeValid_hint_fail_suggest',
      'Did you mean lang="fr"? The value starts with the ISO 639 code of the page\'s main language, not its name or a country code.'
    ],
    [
      'jp',
      'htmlLangCodeValid_hint_fail_suggest',
      'Did you mean lang="ja"? The value starts with the ISO 639 code of the page\'s main language, not its name or a country code.'
    ]
  ]) {
    const occ = assertRule(run(page(` lang="${lang}"`)), RULE_ID, 'fail').occurrences[0];
    assert.equal(occ.i18n.hintKey, hintKey, lang);
    assert.equal(occ.hint, hint, lang);
  }
});
