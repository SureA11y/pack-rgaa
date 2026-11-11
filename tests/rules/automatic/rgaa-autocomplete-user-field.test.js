'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-autocomplete-user-field';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main><form action="/f">${body}</form></main></body></html>`;
}

const reasons = (rule) =>
  rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

// The author says the field is about the user, and the browser can't use it.
test(`${RULE_ID}: a malformed value naming a listed field fails`, () => {
  for (const body of [
    '<label for="e">Courriel</label><input id="e" type="email" autocomplete="email home">',
    '<input aria-label="Photo" autocomplete="work photo">',
    '<input aria-label="Code" autocomplete="postal-code shipping">'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['fail', 'malformedUserField']], body);
    assert.equal(rule.occurrences[0].i18n.summaryKey, 'autocompleteUserField_summary_fail');
  }
});

// Only a person can say whether the information concerns the user.
test(`${RULE_ID}: a field that looks like personal data with no valid value is asked about`, () => {
  for (const [body, code] of [
    ['<label for="e">Courriel</label><input id="e" type="email">', 'noAutocomplete'],
    ['<input type="tel" aria-label="Numéro">', 'noAutocomplete'],
    ['<label for="n">Nom</label><input id="n" autocomplete="off">', 'onOff'],
    ['<label for="p">Prénom</label><input id="p" autocomplete="on">', 'onOff'],
    ['<input name="lastname" aria-label="Champ 2" autocomplete="nope">', 'noFieldName'],
    ['<input placeholder="Votre adresse" aria-label="A">', 'noAutocomplete'],
    ['<input aria-label="パスワード" type="text">', 'noAutocomplete']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['cantTell', code]], body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: a well-formed value passes`, () => {
  for (const body of [
    '<label for="e">Courriel</label><input id="e" type="email" autocomplete="email">',
    '<input aria-label="Tel" autocomplete="section-a work tel">',
    '<input aria-label="Code" autocomplete="shipping postal-code webauthn">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// 11.13 applies to fields about the user only.
test(`${RULE_ID}: search fields and fields that do not concern the user are out of scope`, () => {
  for (const body of [
    '<label for="q">Rechercher</label><input id="q" type="search" autocomplete="nope">',
    '</form><form role="search"><label for="q">Mots</label><input id="q" autocomplete="nope">',
    '</form><search><label for="q">Nom</label><input id="q"></search><form>',
    '<label for="f">Filtrer</label><input id="f" autocomplete="nope">',
    '<input type="checkbox" aria-label="Nom" autocomplete="nope">',
    '<input aria-label="Nom" disabled>',
    '<input type="hidden" name="email">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: under the RGAA profile it takes 11.13.1 from autocomplete-valid`, () => {
  const result = runa11yCoreOnHtml(
    page('<label for="q">Filtrer</label><input id="q" autocomplete="nope">'),
    { engineOptions: { profile: 'rgaa-4.1.2' } }
  );
  const r = rollup(result, 'rgaa-4.1.2-11.13');
  assert.ok(!r || r.outcome !== 'fail', r && r.outcome);
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
    ['auf_case_01', 'fail'],
    ['auf_case_02', 'cantTell'],
    ['auf_case_03', 'cantTell']
  ]);
});

// 11.13.1 wants the value « pertinente »: a field name the input type
// cannot hold means one of the two is wrong.
test(`${RULE_ID}: a value that contradicts the input type is asked about`, () => {
  for (const body of [
    '<input type="tel" autocomplete="email" aria-label="Téléphone">',
    '<input type="email" autocomplete="tel" aria-label="Courriel">',
    '<input type="email" autocomplete="new-password" aria-label="Mot de passe">'
  ]) {
    const result = runa11yCoreOnHtml(page(`<form>${body}</form>`), RUN);
    const r = result.checksResults.find((c) => c.ruleId === RULE_ID);
    assert.equal(r.outcome, 'cantTell', body);
    assert.equal(r.occurrences[0].data.details.reasonCode, 'contradictsType', body);
  }
  for (const body of [
    '<input type="email" autocomplete="email" aria-label="Courriel">',
    '<input type="text" autocomplete="tel" aria-label="Tél">',
    '<input type="tel" autocomplete="tel-national" aria-label="Tél">',
    '<input type="number" autocomplete="bday-year" aria-label="Année">'
  ]) {
    const result = runa11yCoreOnHtml(page(`<form>${body}</form>`), RUN);
    assert.equal(result.checksResults.find((c) => c.ruleId === RULE_ID).outcome, 'pass', body);
  }
});

// The occurrences a body gives, in English or in the locale asked.
function messagesOf(body, locale) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { ...RUN, ...(locale ? { engineOptions: { locale } } : {}) }
  );
  return result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences;
}

test(`${RULE_ID}: a value close to one of the list names the value meant`, () => {
  const cases = [
    ['<label>E-mail <input autocomplete="e-mail"></label>', 'e-mail', 'email', 'email'],
    [
      '<label>Code postal <input autocomplete="shipping postcode"></label>',
      'postcode',
      'postal-code',
      'shipping postal-code'
    ],
    [
      '<label>Nom <input autocomplete="famly-name"></label>',
      'famly-name',
      'family-name',
      'family-name'
    ]
  ];
  for (const [body, token, suggestion, suggested] of cases) {
    const [occ] = messagesOf(body);
    assert.equal(occ.data.details.reasonCode, 'noFieldName', body);
    assert.equal(occ.i18n.hintKey, 'autocompleteUserField_hint_cantTell_nearValue');
    assert.deepEqual(
      { token: occ.i18n.params.token, suggestion: occ.i18n.params.suggestion },
      { token, suggestion }
    );
    assert.equal(
      occ.hint,
      `"${token}" is not a value of the list: did you mean "${suggestion}"? If the field asks for information about the user, write autocomplete="${suggested}".`
    );
  }
  const [none] = messagesOf('<label>Nom <input autocomplete="xyz"></label>');
  assert.equal(none.i18n.hintKey, 'autocompleteUserField_hint_cantTell');
});
