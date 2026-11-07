'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-consequential-form-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const form = (button, fields = '') => `<form action="/x" method="post">${fields}${button}</form>`;

// 11.12: a form with financial, legal or data consequences lets the user
// review, confirm or recover the data; what happens next is not in the
// page, so a person checks.
test(`${RULE_ID}: forms whose submit button names a consequence are asked about`, () => {
  for (const [button, kind] of [
    ['<button>Payer 49,90 €</button>', 'payment'],
    ['<button type="submit">Valider ma commande ›</button>', 'payment'],
    ['<input type="submit" value="Passer la commande">', 'payment'],
    ['<button>Faire un don</button>', 'payment'],
    ['<button>Place order</button>', 'payment'],
    ['<button>Pay now</button>', 'payment'],
    ['<button>Supprimer mon compte</button>', 'accountDeletion'],
    ['<button>Clôturer mon compte</button>', 'accountDeletion'],
    ['<button>Delete account</button>', 'accountDeletion'],
    ['<button>Résilier mon abonnement</button>', 'cancellation'],
    ['<button>Annuler ma réservation</button>', 'cancellation'],
    ['<button>Cancel subscription</button>', 'cancellation'],
    ['<button>Valider et signer</button>', 'signature'],
    ['<button>Signer électroniquement</button>', 'signature'],
    ['<button>Modifier mon mot de passe</button>', 'passwordChange'],
    ['<button>Envoyer mes réponses</button>', 'testAnswers'],
    ['<button>Submit exam</button>', 'testAnswers'],
    ['<button aria-label="Payer la commande"><svg aria-hidden="true"></svg></button>', 'payment']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(form(button)), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, kind, button);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: card fields and a password change are asked about whatever the button says`, () => {
  const card = form(
    '<button>Continuer</button>',
    '<label for="n">Numéro</label><input id="n" autocomplete="cc-number"><label for="c">Cryptogramme</label><input id="c" autocomplete="cc-csc">'
  );
  const r1 = assertRule(runa11yCoreOnHtml(page(card), RUN), RULE_ID, 'cantTell');
  assert.deepEqual(r1.occurrences[0].data.details, { reasonCode: 'payment', label: '' });
  const pwd = form(
    '<button>Enregistrer</button>',
    '<input type="password" autocomplete="current-password" aria-label="Actuel"><input type="password" autocomplete="new-password" aria-label="Nouveau">'
  );
  const r2 = assertRule(runa11yCoreOnHtml(page(pwd), RUN), RULE_ID, 'cantTell');
  assert.equal(r2.occurrences[0].data.details.reasonCode, 'passwordChange');
});

// Generic labels say nothing of the consequences: they are the noise the
// rule must not raise.
test(`${RULE_ID}: generic, navigation and everyday forms are not applicable`, () => {
  for (const body of [
    form('<button>Valider</button>'),
    form('<button>Envoyer</button>'),
    form('<button>Confirmer</button>'),
    form('<button>Continuer</button>'),
    form('<button>Enregistrer</button>'),
    form('<button>Supprimer</button>'),
    form('<button>Annuler</button>'),
    form('<button>Submit</button>'),
    form('<button>Save</button>'),
    form('<button>OK</button>'),
    form(
      '<button>Se connecter</button>',
      '<input type="password" autocomplete="current-password" aria-label="Mot de passe">'
    ),
    form('<button>Sign in</button>'),
    form(
      '<button>Sign up</button>',
      '<input type="password" autocomplete="new-password" aria-label="Mot de passe">'
    ),
    form(
      "<button>S'abonner à la newsletter</button>",
      '<input type="email" aria-label="Courriel">'
    ),
    form('<button>Procéder au paiement</button>'),
    form('<button>Ajouter au panier</button>'),
    form("<button>Supprimer l'article</button>"),
    form('<button>Payer en plusieurs fois : voir les conditions</button>'),
    form('<button type="button">Payer</button>'),
    form('<button type="reset">Supprimer mon compte</button>'),
    '<button>Payer</button>',
    '<form role="search"><input type="search" aria-label="Rechercher"><button>Commander</button></form>',
    '<form style="display:none"><button>Payer</button></form>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: one occurrence per form; messages follow the scan locale`, () => {
  const html = page(form('<button>Payer</button><button>Annuler ma commande</button>'));
  const rule = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Ce formulaire effectue un paiement ou passe une commande (« Payer »).'
  );
});

test(`${RULE_ID}: the map links it to 11.12.1 and 11.12.2; RGAA 11.12 asks under the profile`, () => {
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['11.12.1', '11.12.2']);
  const result = runa11yCoreOnHtml(page(form('<button>Supprimer mon compte</button>')), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  assert.equal(
    result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-11.12').outcome,
    'cantTell'
  );
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const r = runa11yCoreOnHtml(page(form('<button>Payer</button>')), { engineOptions });
    assert.ok(!r.checksResults.some((x) => x.ruleId === RULE_ID));
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['cfr_case_01', 'cfr_case_02']);
});
