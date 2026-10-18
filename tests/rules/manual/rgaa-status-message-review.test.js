'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-status-message-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 7.5.1 to 7.5.3 name role="status", "alert", "log" and "progressbar".
test(`${RULE_ID}: possible status messages with none of those roles are asked about`, () => {
  for (const [body, code] of [
    ['<div aria-live="polite">Votre panier est mis à jour</div>', 'liveWithoutRole'],
    ['<p class="alert alert-success">Message envoyé avec succès</p>', 'possibleStatusMessage'],
    ['<div class="error-message">Le champ nom est obligatoire</div>', 'possibleStatusMessage'],
    [
      '<div class="flash"><p class="flash-msg">Connexion réussie, bienvenue</p></div>',
      'possibleStatusMessage'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, code, body);
  }
});

test(`${RULE_ID}: a role 7.5 names, an empty or long block, or a sign is not applicable`, () => {
  for (const body of [
    '<div role="status" class="message">Enregistré avec succès</div>',
    '<div role="alert" aria-live="assertive">Erreur de saisie</div>',
    '<section class="messages"><h2>Messagerie</h2><ul><li>a</li></ul></section>',
    '<div class="error"></div>',
    '<span class="icon-warning">!</span>',
    '<div aria-live="off">Texte statique ici</div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="smr_case_01"/);
});
