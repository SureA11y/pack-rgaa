'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-field-group-legend';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const FLAGGED = '<fieldset><input aria-label="Street"><input aria-label="City"></fieldset>';

test(`${RULE_ID}: a fieldset without a legend is flagged, never failed`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(FLAGGED), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'groupWithoutLegend',
    element: 'fieldset',
    fields: 'Street | City'
  });
  assert.equal(occ.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_fieldset');
  assert.equal(
    occ.summary,
    'This fieldset groups 2 form field(s) (Street | City) but has no legend.'
  );
});

test(`${RULE_ID}: an empty legend counts as none, and the summary says it is empty`, () => {
  const html = page('<fieldset><legend> </legend><input aria-label="a"></fieldset>');
  const occ = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell').occurrences[0];
  assert.equal(occ.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_fieldset_emptyLegend');
  assert.equal(occ.data.details.emptyLegend, true);
  assert.equal(
    occ.summary,
    'This fieldset groups 1 form field(s) (a), but its <legend> has no text.'
  );
});

test(`${RULE_ID}: the summary names what the reviewer sees that is not a legend`, () => {
  const occ = (body, locale) =>
    assertRule(
      runa11yCoreOnHtml(page(body), { ...RUN, engineOptions: locale ? { locale } : {} }),
      RULE_ID,
      'cantTell'
    ).occurrences[0];
  const nested = occ(
    '<fieldset><div><legend>Adresse</legend></div><input aria-label="Rue"><input aria-label="Ville"><input aria-label="Code"><input aria-label="Pays"></fieldset>'
  );
  assert.equal(nested.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_fieldset_nestedLegend');
  assert.equal(
    nested.summary,
    'This fieldset groups 4 form field(s) (Rue | Ville | Code | …), but its <legend> ("Adresse") is not a direct child of the fieldset, so it is not the fieldset\'s legend.'
  );
  const aria = occ('<fieldset aria-label="Adresse"><input></fieldset>');
  assert.equal(aria.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_fieldset_ariaName');
  assert.equal(
    aria.summary,
    "This fieldset groups 1 form field(s) (<input>) but has no <legend>; its aria-label does not count as a fieldset's legend."
  );
  const body = '<div role="group" aria-labelledby="absent"><input aria-label="Jour"></div>';
  const unnamed = occ(body);
  assert.equal(unnamed.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_group_emptyName');
  assert.equal(unnamed.data.details.attribute, 'aria-labelledby="absent"');
  assert.equal(
    occ(body, 'fr').summary,
    'Cet élément role="group" regroupe 1 champ(s) de formulaire (Jour), mais son attribut aria-labelledby="absent" ne donne aucun texte : il n’a donc pas de nom.'
  );
});

test(`${RULE_ID}: role="group" without a name is flagged with its own summary`, () => {
  const html = page('<div role="group"><input type="checkbox" aria-label="a"></div>');
  const occ = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell').occurrences[0];
  assert.equal(occ.data.details.element, 'role="group"');
  assert.equal(occ.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_group');
});

// RGAA 11.6.1 step 2 names a <legend> for a fieldset and aria-label or
// aria-labelledby for role="group"/"radiogroup", nothing else.
test(`${RULE_ID}: a fieldset legend, or aria-label/aria-labelledby on a group, is enough`, () => {
  for (const body of [
    '<fieldset><legend>Address</legend><input aria-label="a"></fieldset>',
    '<div role="group" aria-label="Date"><input aria-label="a"></div>',
    '<p id="h">Date</p><div role="group" aria-labelledby="h"><input aria-label="a"></div>',
    '<div role="radiogroup" aria-label="Civility"><input type="radio" name="c" aria-label="Mr"></div>',
    '<fieldset role="radiogroup" aria-label="Civility"><input type="radio" name="c" aria-label="Mr"></fieldset>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: aria-label on a plain fieldset, and title on a group, are not a legend`, () => {
  for (const [body, element] of [
    ['<fieldset aria-label="Address"><input aria-label="a"></fieldset>', 'fieldset'],
    [
      '<p id="h">Address</p><fieldset aria-labelledby="h"><input aria-label="a"></fieldset>',
      'fieldset'
    ],
    ['<div role="group" title="Address"><input aria-label="a"></div>', 'role="group"']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.element, element, body);
  }
});

test(`${RULE_ID}: role="radiogroup" without aria-label or aria-labelledby is flagged`, () => {
  for (const body of [
    '<div role="radiogroup"><input type="radio" name="c" aria-label="Mr"></div>',
    '<div role="radiogroup" title="Civility"><div role="radio" aria-checked="false" aria-label="Mr"></div></div>'
  ]) {
    const occ = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    }).occurrences[0];
    assert.equal(occ.data.details.element, 'role="radiogroup"');
    assert.equal(occ.i18n.summaryKey, 'fieldGroupLegend_summary_cantTell_group');
    assert.deepEqual(occ.i18n.params, { role: 'radiogroup', count: 1, fields: 'Mr' });
    assert.equal(
      occ.summary,
      'This role="radiogroup" element groups 1 form field(s) (Mr) but has no aria-label or aria-labelledby.'
    );
  }
});

test(`${RULE_ID}: groups without form fields, and fieldsets given another role, are left out`, () => {
  for (const body of [
    '<div role="group"><button>Bold</button></div>',
    '<fieldset><input type="hidden" name="t"></fieldset>',
    '<fieldset role="presentation"><input aria-label="a"></fieldset>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(FLAGGED));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/rgaa-field-group-legend-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'rgaa-field-group-legend-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 6, maxOccurrences: 6 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'fgl_case_01',
    'fgl_case_02',
    'fgl_case_03',
    'fgl_case_07',
    'fgl_case_08',
    'fgl_case_09'
  ]);
});
