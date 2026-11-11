'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-same-name-checkboxes-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const cb = (name, label, extra = '') =>
  `<label><input type="checkbox" name="${name}" ${extra}> ${label}</label>`;
const BOXES = cb('i', 'Sport', 'id="first"') + cb('i', 'Musique') + cb('i', 'Lecture');
const radio = (label, extra = '') =>
  `<span role="radio" aria-checked="false" tabindex="0" ${extra}>${label}</span>`;
const RADIOS = `<div>${radio('Oui', 'id="first"')}${radio('Non')}</div>`;

// RGAA 11.5.1 and the glossary « Champs de même nature »: a set of
// checkboxes or radio buttons answering one question is grouped if needed.
test(`${RULE_ID}: three checkboxes sharing a name outside any group are asked about once`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(BOXES), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.match(occ.html, /id="first"/);
  assert.deepEqual(occ.data.details, {
    reasonCode: 'ungroupedCheckboxes',
    name: 'i',
    count: 3,
    labels: 'Sport | Musique | Lecture'
  });
  assert.equal(
    occ.i18n.summaryKey,
    'sameNameCheckboxesReview_summary_cantTell_ungroupedCheckboxes_labels'
  );
  assert.equal(
    occ.summary,
    'The 3 checkboxes named "i" are not grouped in a fieldset or role="group". Their labels: "Sport | Musique | Lecture".'
  );
});

test(`${RULE_ID}: two role="radio" elements in one parent outside any group are asked about once`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(RADIOS), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.match(occ.html, /id="first"/);
  assert.deepEqual(occ.data.details, {
    reasonCode: 'ungroupedRadios',
    count: 2,
    labels: 'Oui | Non'
  });
  assert.match(occ.summary, / Their labels: "Oui \| Non"\.$/);
});

test(`${RULE_ID}: a set with no labels keeps the summary without them`, () => {
  const body =
    '<input type="checkbox" name="u"><input type="checkbox" name="u"><input type="checkbox" name="u">';
  const occ = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell').occurrences[0];
  assert.equal(
    occ.i18n.summaryKey,
    'sameNameCheckboxesReview_summary_cantTell_ungroupedCheckboxes'
  );
  assert.equal(occ.data.details.labels, undefined);
});

test(`${RULE_ID}: a set split across two fieldsets is asked about`, () => {
  const body =
    `<fieldset><legend>A</legend>${cb('s', 'Un')}${cb('s', 'Deux')}</fieldset>` +
    `<fieldset><legend>B</legend>${cb('s', 'Trois')}</fieldset>`;
  assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell');
});

test(`${RULE_ID}: grouped, small, hidden, native or split sets are not applicable`, () => {
  for (const body of [
    `<fieldset><legend>Intérêts</legend>${BOXES}</fieldset>`,
    `<div role="group" aria-label="Intérêts"><div>${BOXES}</div></div>`,
    `<fieldset role="group"><legend>Intérêts</legend>${BOXES}</fieldset>`,
    `<div role="radiogroup" aria-label="Choix">${radio('Oui')}${radio('Non')}</div>`,
    `<fieldset><legend>Choix</legend><div>${radio('Oui')}${radio('Non')}</div></fieldset>`,
    // Two checkboxes sharing a name, or three of which one is hidden.
    cb('c', 'A') + cb('c', 'B'),
    cb('c', 'A') + cb('c', 'B') + cb('c', 'C', 'style="display:none"'),
    // The same name in two forms is two sets.
    `<form>${cb('c', 'A')}${cb('c', 'B')}</form><form>${cb('c', 'C')}</form>`,
    // Native radio buttons are rgaa-radio-group-present's.
    '<label><input type="radio" name="r"> A</label><label><input type="radio" name="r"> B</label>',
    // One custom radio per parent, and a single one.
    `<div>${radio('Oui')}</div><div>${radio('Non')}</div>`,
    // A lone checkbox.
    `<div role="presentation">${cb('d', 'A')}</div>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: role="radiogroup" groups radios but not checkboxes`, () => {
  assertRule(
    runa11yCoreOnHtml(page(`<div role="radiogroup" aria-label="x">${BOXES}</div>`), RUN),
    RULE_ID,
    'cantTell'
  );
});

test(`${RULE_ID}: messages follow the scan locale; the map and rollup put it under 11.5.1`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(BOXES), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Les 3 cases à cocher nommées « i » ne sont pas regroupées dans un fieldset ou un role="group". Leurs étiquettes : « Sport | Musique | Lecture ».'
  );
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['11.5.1']);
  const result = runa11yCoreOnHtml(page(RADIOS), { engineOptions: { profile: 'rgaa-4.1.2' } });
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-11.5').outcome, 'cantTell');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(BOXES));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['snc_case_01', 'snc_case_02']);
});
