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
