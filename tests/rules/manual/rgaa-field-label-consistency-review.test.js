'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-field-label-consistency-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

let n = 0;
const field = (label, ac, extra = '') => {
  n += 1;
  return `<label for="f${n}">${label}</label><input id="f${n}" autocomplete="${ac}" ${extra}>`;
};
const EMAILS = () =>
  `<form>${field('Adresse électronique', 'email')}</form><form>${field('Courriel', 'email')}</form>`;

// RGAA 11.3.1 and the glossary « Étiquettes cohérentes »: labels of fields
// asking for the same information in one page leave no ambiguity.
test(`${RULE_ID}: fields with the same autocomplete value and different labels are asked about once`, () => {
  const body = EMAILS() + field('E-mail', 'email');
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'inconsistentLabels',
    token: 'email',
    labels: ['Adresse électronique', 'Courriel', 'E-mail'],
    count: 3
  });
  assert.equal(
    occ.summary,
    'The 3 fields with autocomplete="email" have different labels: "Adresse électronique", "Courriel", "E-mail".'
  );
});

test(`${RULE_ID}: a wrapping label and an aria-labelledby passage are read`, () => {
  const body =
    '<label>Téléphone <input autocomplete="tel"></label>' +
    '<span id="l2">Numéro de portable</span><input autocomplete="tel" aria-labelledby="l2">';
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', { maxOccurrences: 1 });
});

test(`${RULE_ID}: same labels up to case, accents and punctuation, or other purposes, are not applicable`, () => {
  for (const body of [
    field('Téléphone :', 'tel') + field('telephone *', 'tel'),
    field('Email', 'email') + field('E-mail (obligatoire)', 'email'),
    // Different sections or address types ask for different information.
    field('Code postal de livraison', 'shipping postal-code') +
      field('Code postal de facturation', 'billing postal-code'),
    field('Ville', 'section-a address-level2') + field('Commune', 'section-b address-level2'),
    // on/off say nothing about the information asked for.
    field('Nom', 'off') + field('Prénom', 'off'),
    field('Nom', 'on') + field('Prénom', 'on'),
    // A hidden field, and a field with no visible label.
    field('Courriel', 'email') + field('Adresse', 'email', 'style="display:none"'),
    field('Courriel', 'email') + '<input autocomplete="email" aria-label="Adresse">',
    // Fields with no autocomplete value are not compared.
    '<label for="a">Nom</label><input id="a"><label for="b">Votre nom</label><input id="b">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: messages follow the scan locale; the map and rollup put it under 11.3.1`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(EMAILS()), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Les 2 champs avec autocomplete="email" ont des étiquettes différentes : "Adresse électronique", "Courriel".'
  );
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['11.3.1']);
  const result = runa11yCoreOnHtml(page(EMAILS()), { engineOptions: { profile: 'rgaa-4.1.2' } });
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-11.3').outcome, 'cantTell');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(EMAILS()));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['flc_case_01']);
});
