'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-dir-attribute-valid';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, htmlAttrs = '') {
  return `<!doctype html><html lang="en" ${htmlAttrs}><head><title>t</title></head><body>${body}</body></html>`;
}

test(`${RULE_ID}: ltr and rtl pass, whatever the case`, () => {
  const html = page(
    '<p dir="rtl">\u0645\u0631\u062d\u0628\u0627</p><p dir="LTR">b</p><p dir="Rtl">\u05e9\u05dc\u05d5\u05dd</p>',
    'dir="ltr"'
  );
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

// HTML matches the keyword apart from case only, so browsers ignore a value
// with spaces around it.
test(`${RULE_ID}: surrounding spaces make the value invalid`, () => {
  for (const value of [' RTL ', 'ltr ']) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(`<p dir="${value}">\u0645\u0631\u062d\u0628\u0627</p>`), RUN),
      RULE_ID,
      'fail',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'invalidDir');
    assert.equal(rule.occurrences[0].data.details.value, value);
  }
});

test(`${RULE_ID}: a page without dir is not applicable`, () => {
  assertRule(runa11yCoreOnHtml(page('<p>a</p>'), RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: dir="auto" on reverse-direction text fails with its own reason`, () => {
  const html = page('<p dir="auto">\u0645\u0631\u062d\u0628\u0627</p>');
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'autoDir');
  assert.equal(occ.i18n.summaryKey, 'dirAttributeValid_summary_fail_auto');
  assert.equal(occ.summary, 'This element uses dir="auto"; RGAA accepts only ltr or rtl.');
});

// RGAA 8.10.2 step 1 covers only the text passages of 8.10.1, which read in
// the reverse direction of the document.
test(`${RULE_ID}: dir="auto" without reverse-direction text is not applicable`, () => {
  for (const body of [
    '<input dir="auto" aria-label="c">',
    '<p dir="auto">Latin text</p>',
    '<p dir="auto">123 !</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
  // Hebrew inside a right-to-left ancestor reads in the inherited direction;
  // only the ancestor's own dir is judged.
  for (const [body, attrs] of [
    ['<div dir="rtl"><p dir="auto">\u05e9\u05dc\u05d5\u05dd</p></div>', ''],
    ['<p dir="auto">\u05e9\u05dc\u05d5\u05dd</p>', 'dir="RTL"']
  ]) {
    assertRule(runa11yCoreOnHtml(page(body, attrs), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: dir="auto" on Latin text inside a right-to-left block fails`, () => {
  const html = page('<div dir="rtl"><p dir="auto" id="x">Hello</p></div>');
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'autoDir');
});

test(`${RULE_ID}: dir="auto" on a text field reads its value`, () => {
  const html = page('<input dir="auto" aria-label="c" value="\u0645\u0631\u062d\u0628\u0627">');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', { minOccurrences: 1 });
});

test(`${RULE_ID}: any other value fails and is quoted as written`, () => {
  for (const value of ['rlt', '', 'right']) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(`<p dir="${value}">a</p>`), RUN),
      RULE_ID,
      'fail',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'invalidDir', value);
    assert.equal(occ.data.details.value, value);
    assert.equal(occ.i18n.summaryKey, 'dirAttributeValid_summary_fail_invalid');
    assert.deepEqual(occ.i18n.params, { value });
  }
});

// 8.10.2: « La valeur de l'attribut dir est pertinente ». A dir that turns
// the direction on text whose letters all read the old way is not.
test(`${RULE_ID}: a dir that turns text the wrong way fails`, () => {
  for (const [body, attrs] of [
    ['<p dir="rtl">Bonjour tout le monde</p>', ''],
    ['<p>Bonjour</p>', 'dir="rtl"'],
    ['<div dir="rtl"><p dir="ltr">\u0645\u0631\u062d\u0628\u0627</p></div>', '']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body, attrs), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'directionNotRelevant', body);
  }
  for (const [body, attrs] of [
    // Text of its own direction inside, or no letters at all.
    ['<p dir="rtl"><span dir="ltr">Hello</span> 123</p>', ''],
    ['<p dir="rtl">\u0645\u0631\u062d\u0628\u0627 (Google)</p>', ''],
    ['<p dir="ltr">Hello</p>', 'dir="rtl"'],
    ['<input dir="rtl" aria-label="x">', '']
  ]) {
    assertRule(runa11yCoreOnHtml(page(body, attrs), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: the root element is checked too`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page('<p>a</p>', 'dir="rtl-x"'), RUN), RULE_ID, 'fail');
  assert.equal(rule.occurrences[0].data.details.value, 'rtl-x');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page('<p dir="auto">a</p>'));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/rgaa-dir-attribute-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'rgaa-dir-attribute-valid-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['dav_case_01', 'dav_case_02', 'dav_case_03', 'dav_case_06']);
});
