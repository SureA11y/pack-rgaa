'use strict';

/**
 * While a modal dialog is open, the rest of the page is inert: the scan
 * sees the dialog, not the page. RGAA's rules about the page's zones and its
 * skip links report notApplicable then, as core's whole-page rules do, and
 * judge the page as before once the dialog is closed.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/run.js');

const page = (dialog) =>
  '<!doctype html><html lang="fr"><head><title>Boutique</title></head><body>' +
  '<a href="#contenu">Aller au contenu</a>' +
  '<header><nav aria-label="Principal"><a href="/">Accueil</a></nav></header>' +
  '<main id="contenu"><h1>Boutique</h1><p>Produits</p></main>' +
  '<footer><p>Mentions</p></footer>' +
  dialog +
  '</body></html>';
// jsdom can't open a modal dialog: an open <dialog aria-modal="true"> stands
// in for showModal() only with engineOptions.assumeModal. A script-made
// modal (role="dialog" with aria-modal="true") counts without it.
const MODAL =
  '<dialog open aria-modal="true" aria-label="Connexion"><p>Identifiant</p><button>Fermer</button></dialog>';
const SCRIPT_MODAL =
  '<div role="dialog" aria-modal="true" aria-label="Connexion"><p>Identifiant</p><button>Fermer</button></div>';

for (const ruleId of [
  'rgaa-page-zones-reachable',
  'rgaa-skip-link-present',
  'rgaa-skip-link-placement'
]) {
  test(`${ruleId}: notApplicable while a modal dialog is open, judged without one`, () => {
    const outcome = (html, engineOptions) =>
      runa11yCoreOnHtml(html, {
        runOnly: { includeRuleIds: [ruleId] },
        engineOptions
      }).checksResults.find((r) => r.ruleId === ruleId).outcome;
    assert.equal(outcome(page(MODAL), { assumeModal: true }), 'notApplicable');
    assert.equal(outcome(page(SCRIPT_MODAL)), 'notApplicable');
    assert.notEqual(outcome(page('')), 'notApplicable');
    // Without the option, jsdom has no modal dialog open, and the page is judged.
    assert.notEqual(outcome(page(MODAL)), 'notApplicable');
  });
}
