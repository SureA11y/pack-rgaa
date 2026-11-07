'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-required-field-indication';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const CITY = '<label for="v">Ville</label><input id="v">';
const form = (fields) => `<form>${fields}${CITY}<button>Envoyer</button></form>`;
const codes = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);

// 11.10.2: « Une indication de champ obligatoire est visible et située dans
// l'étiquette associée au champ » or in a linked passage.
test(`${RULE_ID}: a required field with no visible indication in its label fails`, () => {
  for (const fields of [
    '<label for="a">Nom</label><input id="a" required>',
    '<span id="l">Nom</span><div role="textbox" contenteditable aria-labelledby="l" aria-required="true"></div>',
    '<label for="a">Nom</label><select id="a" required><option>x</option></select>',
    // Screen-reader-only text is not visible.
    '<label for="a">Nom <span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">obligatoire</span></label><input id="a" required>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(form(fields)), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(codes(rule), ['requiredNotIndicated'], fields);
    assert.equal(rule.occurrences[0].data.details.label, 'Nom');
  }
});

test(`${RULE_ID}: an indication in the label or a linked passage passes`, () => {
  for (const fields of [
    '<label for="a">Nom (obligatoire)</label><input id="a" required>',
    '<label for="a">Name (required)</label><input id="a" required>',
    '<label for="a">Nom</label><input id="a" required aria-describedby="h"><span id="h">Champ requis</span>',
    '<p>Les champs marqués d\'un * sont obligatoires.</p><label for="a">Nom *</label><input id="a" required>',
    '<p>Les champs suivis d\'un astérisque sont obligatoires.</p><label for="a">Nom <span aria-hidden="true">*</span></label><input id="a" required>',
    '<label for="a">Nom <img src="r.png" alt="obligatoire"></label><input id="a" required>',
    '<fieldset><legend>Civilité (obligatoire)</legend><input type="radio" name="c" id="m" required><label for="m">M.</label><input type="radio" name="c" id="f"><label for="f">Mme</label></fieldset>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(form(fields)), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// Glossary « Indication de champ obligatoire »: the explanation of a sign
// comes « visuellement et dans l'ordre du code source, avant la première
// utilisation de l'indication ».
test(`${RULE_ID}: a sign explained after its first use, or never, fails`, () => {
  for (const [fields, code] of [
    [
      '<label for="a">Nom <span aria-hidden="true">*</span></label><input id="a" required><p>* champs obligatoires</p>',
      'markerExplainedAfter'
    ],
    ['<label for="a">Nom *</label><input id="a" required>', 'markerNotExplained']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(form(fields)), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(codes(rule), [code], fields);
  }
});

test(`${RULE_ID}: where an indication may be elsewhere, it asks`, () => {
  for (const [fields, code] of [
    ['<label for="a">Nom *</label><input id="a">', 'signMayMeanOther'],
    [
      '<label for="a">Nom <abbr title="obligatoire">*</abbr></label><input id="a" required>',
      'signMayMeanOther'
    ],
    [
      '<div><label for="a">Nom</label> <input id="a" required> <span>*</span></div>',
      'indicationOutsideLabel'
    ],
    [
      '<label for="a">Nom</label><input id="a" required placeholder="Nom (obligatoire)">',
      'indicationOutsideLabel'
    ],
    [
      '<fieldset><legend>Adresse (obligatoire)</legend><label for="a">Rue</label><input id="a" required></fieldset>',
      'indicationInLegend'
    ],
    ['<input id="a" required aria-label="Nom">', 'noVisibleLabel'],
    [
      '<label for="a">Nom <img src="req.png"></label><input id="a" required>',
      'indicationMayBeImage'
    ],
    [
      '<input type="checkbox" id="a" required><label for="a">J\'accepte les conditions</label>',
      'indicationMayBeImage'
    ],
    [
      '<p>Tous les champs sont obligatoires.</p><label for="a">Nom</label><input id="a" required>',
      'allFieldsRequiredSentence'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(form(fields)), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(codes(rule), [code], fields);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: without a layout, a page with style sheets is asked about, not failed`, () => {
  const html = page(form('<label for="a">Nom</label><input id="a" required>')).replace(
    '</head>',
    '<link rel="stylesheet" href="s.css"></head>'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell');
  assert.deepEqual(codes(rule), ['stylesNotRead']);
});

// 11.10 particular case: not applicable to a form with one field, or one
// that marks its optional fields « de manière visible » in their label or
// legend. 11.10 covers forms only (glossary « Formulaire »).
test(`${RULE_ID}: one field, optional fields marked, or no form is not applicable`, () => {
  for (const body of [
    '<form role="search"><label for="q">Rechercher</label><input id="q" required><button>OK</button></form>',
    '<form><label for="a">Nom</label><input id="a" required><label for="b">Ville (facultatif)</label><input id="b"></form>',
    '<label for="a">Nom</label><input id="a" required>' + CITY,
    form('<label for="a">Nom</label><input id="a" required hidden>'),
    form('<label for="a">Nom</label><input id="a">')
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  const byId = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome
  ]);
  assert.deepEqual(byId, [
    ['rfi_case_01', 'fail'],
    ['rfi_case_03', 'fail'],
    ['rfi_case_04', 'cantTell']
  ]);
});
