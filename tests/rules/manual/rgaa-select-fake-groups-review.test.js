'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-select-fake-groups-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main><label>Liste ${body}</label></main></body></html>`;
}

// 11.8.1: « les items de même nature d'une liste de choix sont-ils regroupés
// avec une balise <optgroup>, si nécessaire ? »
test(`${RULE_ID}: options used as group headings are asked about`, () => {
  for (const [body, text] of [
    [
      '<select><option>Choisissez</option><option disabled>Europe</option><option>France</option><option disabled>Asie</option><option>Japon</option></select>',
      'Europe'
    ],
    [
      '<select><option>Choisissez</option><option>-- Fruits --</option><option>Pomme</option></select>',
      '-- Fruits --'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.text, text, body);
  }
});

test(`${RULE_ID}: a placeholder, one sold-out item, <optgroup> or plain options are not applicable`, () => {
  for (const body of [
    '<select><option disabled selected>Choisissez</option><option>France</option></select>',
    '<select><option>S</option><option disabled>M (épuisé)</option><option>L</option></select>',
    '<select><optgroup label="Europe"><option disabled>France</option><option disabled>Italie</option></optgroup></select>',
    '<select><option>Paris - Lyon</option><option>Bien -- très bien</option></select>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="sfg_case_01"/);
});

// The occurrences a body gives, in English or in the locale asked.
function messagesOf(body, locale) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { ...RUN, ...(locale ? { engineOptions: { locale } } : {}) }
  );
  return result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences;
}

test(`${RULE_ID}: every option that looks like a heading is named`, () => {
  const [occ] = messagesOf(
    '<select><option>-- Fruits --</option><option>Apple</option><option>-- Veg --</option><option>Leek</option></select>'
  );
  assert.equal(occ.i18n.summaryKey, 'selectFakeGroupsReview_summary_cantTell_several');
  assert.equal(
    occ.summary,
    'This list has no <optgroup>, but 2 of its options look like group headings: "-- Fruits -- | -- Veg --".'
  );
  // A first option that reads as a placeholder is left out.
  const [placeholder] = messagesOf(
    '<select><option value="">-- Choose --</option><option>-- Fruits --</option><option>Apple</option></select>'
  );
  assert.equal(placeholder.i18n.summaryKey, 'selectFakeGroupsReview_summary_cantTell');
});
