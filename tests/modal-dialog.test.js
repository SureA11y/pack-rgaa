'use strict';

/**
 * While a modal dialog is open, the rest of the page is inert: the scan
 * sees the dialog, not the page. RGAA's rules about the page's zones and its
 * skip links report notApplicable then, as core's whole-page rules do, and
 * judge the page as before once the dialog is closed. jsdom can't open a
 * modal dialog (showModal), so the tests stand in for one with open and
 * aria-modal="true", which core takes as modal with assumeModal (core 1.16).
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
const MODAL =
  '<dialog open aria-modal="true" aria-label="Connexion"><p>Identifiant</p><button>Fermer</button></dialog>';

for (const ruleId of [
  'rgaa-page-zones-reachable',
  'rgaa-skip-link-present',
  'rgaa-skip-link-placement'
]) {
  test(`${ruleId}: notApplicable while a modal dialog is open, judged without one`, () => {
    const outcome = (html) =>
      runa11yCoreOnHtml(html, {
        runOnly: { includeRuleIds: [ruleId] },
        engineOptions: { assumeModal: true }
      }).checksResults.find((r) => r.ruleId === ruleId).outcome;
    assert.equal(outcome(page(MODAL)), 'notApplicable');
    assert.notEqual(outcome(page('')), 'notApplicable');
  });
}
