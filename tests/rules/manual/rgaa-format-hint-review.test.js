'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-format-hint-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main><form>${body}</form></main></body></html>`;
}

const field = (label, attrs, tag = 'input') =>
  `<label for="f">${label}</label><${tag} id="f" ${attrs}>${tag === 'textarea' ? '</textarea>' : ''}`;
const PATTERN = field('Numéro de client', 'pattern="[A-Z]{2}[0-9]{6}"');

// RGAA 11.11.1 and 11.11.2: an input error suggests the expected format and
// an example « si nécessaire »; the message shows only once a value is
// rejected, so a field with a constraint stated nowhere is asked about.
test(`${RULE_ID}: a field with a constraint and no format or example around it is asked about`, () => {
  for (const [body, constraint, control] of [
    [PATTERN, 'pattern', 'pattern="[A-Z]{2}[0-9]{6}"'],
    [field('Mot de passe', 'type="password" minlength="12"'), 'minlength', 'minlength="12"'],
    [field('Commentaire', 'minlength="20"', 'textarea'), 'minlength', 'minlength="20"'],
    [field('Quantité', 'type="number" min="1" max="10"'), 'min/max', 'min="1" max="10"'],
    [field('Date d’arrivée', 'type="date" min="2026-01-01"'), 'min/max', 'min="2026-01-01"'],
    [field('Montant', 'inputmode="decimal"'), 'inputmode', 'inputmode="decimal"']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const d = rule.occurrences[0].data.details;
    assert.deepEqual([d.reasonCode, d.constraint], ['formatWithoutHint', constraint], body);
    assert.equal(d.control, control, body);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'formatHintReview_summary_cantTell_labelled',
      body
    );
  }
  const unlabelled = assertRule(
    runa11yCoreOnHtml(page('<input pattern="[0-9]{5}">'), RUN),
    RULE_ID,
    'cantTell'
  ).occurrences[0];
  assert.equal(unlabelled.i18n.summaryKey, 'formatHintReview_summary_cantTell');
  assert.equal(
    unlabelled.summary,
    'This field has an input control (pattern="[0-9]{5}") but its label, description and placeholder give no format or example.'
  );
  const rule = assertRule(runa11yCoreOnHtml(page(PATTERN), RUN), RULE_ID, 'cantTell');
  assert.equal(
    rule.occurrences[0].summary,
    'This field ("Numéro de client") has an input control (pattern="[A-Z]{2}[0-9]{6}") but its label, description and placeholder give no format or example.'
  );
  assert.equal(rule.occurrences[0].data.details.label, 'Numéro de client');
});

test(`${RULE_ID}: a hint, a pattern title, no constraint or an unusable field are not applicable`, () => {
  for (const body of [
    // A format or example in the label, a description or the placeholder.
    field('Code postal (ex. : 75001)', 'pattern="[0-9]{5}"'),
    field('Date', 'pattern=".+" placeholder="jj/mm/aaaa"'),
    field('Référence', 'pattern="[A-Z]+" aria-describedby="h"') +
      '<p id="h">Format : lettres capitales</p>',
    field('Mot de passe', 'type="password" minlength="12" aria-describedby="h"') +
      '<p id="h">Au moins douze caractères.</p>',
    field('Quantité', 'type="number" min="1" max="10" placeholder="Entre 1 et 10"'),
    // Technical note of 11.11: a pattern with a title validates the criterion.
    field('Référence', 'pattern="[A-Z]+" title="Lettres capitales uniquement"'),
    // maxlength alone raises no error, and no constraint at all.
    field('Nom', 'maxlength="40"'),
    field('Courriel', 'type="email"'),
    field('Quantité', 'type="number"'),
    field('Recherche', 'inputmode="search"'),
    // Disabled, read-only, hidden, and types with no typed value.
    field('Code', 'pattern="[0-9]+" disabled'),
    field('Code', 'pattern="[0-9]+" readonly'),
    field('Code', 'pattern="[0-9]+" style="display:none"'),
    field('Volume', 'type="range" min="0" max="10"'),
    field('Code', 'type="hidden" pattern="[0-9]+"')
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: messages follow the scan locale; the map and rollup put it under 11.11`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(PATTERN), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Ce champ (« Numéro de client ») a un contrôle de saisie (pattern="[A-Z]{2}[0-9]{6}") mais son étiquette, sa description et son placeholder ne donnent ni format ni exemple.'
  );
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['11.11.1', '11.11.2']);
  const result = runa11yCoreOnHtml(page(PATTERN), { engineOptions: { profile: 'rgaa-4.1.2' } });
  assert.equal(
    result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-11.11').outcome,
    'cantTell'
  );
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(PATTERN));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['fhr_case_01', 'fhr_case_02']);
});
