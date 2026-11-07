'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-legend-relevance-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const FIELDS = '<label for="a">Rue</label><input id="a"><label for="b">Ville</label><input id="b">';
const FIELDSET = `<fieldset id="g"><legend>Adresse de livraison</legend>${FIELDS}</fieldset>`;

// RGAA 11.7.1 and the glossary « Légende »: the legend of a group of
// fields of the same kind is relevant, which only a person can judge.
test(`${RULE_ID}: each legend of a group of fields is asked about, quoted`, () => {
  for (const [body, legend, element, source] of [
    [FIELDSET, 'Adresse de livraison', 'fieldset', 'legend'],
    [
      `<div id="g" role="group" aria-label="Date de naissance">${FIELDS}</div>`,
      'Date de naissance',
      'role="group"',
      'aria-label'
    ],
    [
      '<p id="q">Mode de paiement</p><div id="g" role="radiogroup" aria-labelledby="q" aria-label="x">' +
        '<label><input type="radio" name="p"> Carte</label><label><input type="radio" name="p"> Virement</label></div>',
      'Mode de paiement',
      'role="radiogroup"',
      'aria-labelledby'
    ],
    [
      `<fieldset id="g" role="group" aria-label="Autre"><legend>Identité</legend>${FIELDS}</fieldset>`,
      'Identité',
      'fieldset',
      'legend'
    ],
    [
      '<div id="g" role="radiogroup" aria-label="Taille"><span role="radio" aria-checked="true">S</span></div>',
      'Taille',
      'role="radiogroup"',
      'aria-label'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.match(occ.html, /id="g"/, body);
    assert.deepEqual(
      occ.data.details,
      { reasonCode: 'legendRelevance', legend, element, source },
      body
    );
    assert.equal(occ.summary, `This group of form fields has the legend "${legend}".`);
  }
});

test(`${RULE_ID}: nested groups are each asked about`, () => {
  const body = `<fieldset><legend>Commande</legend>${FIELDSET}</fieldset>`;
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
});

test(`${RULE_ID}: groups with no legend, no field, another role or hidden are not applicable`, () => {
  for (const body of [
    // No legend: rgaa-field-group-legend's (11.6.1).
    `<fieldset>${FIELDS}</fieldset>`,
    `<fieldset><legend> </legend>${FIELDS}</fieldset>`,
    `<fieldset aria-label="Adresse">${FIELDS}</fieldset>`,
    `<div role="group" title="Adresse">${FIELDS}</div>`,
    `<div role="group" aria-labelledby="none">${FIELDS}</div>`,
    // No form field.
    '<div role="group" aria-label="Mise en forme"><button type="button">Gras</button></div>',
    '<fieldset><legend>Envoi</legend><button>Envoyer</button></fieldset>',
    // A fieldset given another role, and a hidden fieldset.
    `<fieldset role="presentation"><legend>Adresse</legend>${FIELDS}</fieldset>`,
    `<fieldset style="display:none"><legend>Adresse</legend>${FIELDS}</fieldset>`,
    // A legend that is not a child of the fieldset.
    `<fieldset><div><legend>Adresse</legend></div>${FIELDS}</fieldset>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: messages follow the scan locale; the map and rollup put it under 11.7.1`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(FIELDSET), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Ce regroupement de champs de formulaire a pour légende « Adresse de livraison ».'
  );
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['11.7.1']);
  const result = runa11yCoreOnHtml(page(FIELDSET), { engineOptions: { profile: 'rgaa-4.1.2' } });
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-11.7').outcome, 'cantTell');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(FIELDSET));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['lgr_case_01', 'lgr_case_02']);
});
