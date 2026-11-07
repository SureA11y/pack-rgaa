'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-modal-tab-order';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
}
const PAGE = '<header><a href="/">Accueil</a><button>Menu</button></header><main><p>x</p></main>';

// 12.8.1 methodology: « l'ordre de tabulation dans une fenêtre modale ne
// doit considérer que les éléments … au sein de cette fenêtre »; aria-modal
// does not stop the Tab key.
test(`${RULE_ID}: an open aria-modal dialog with focusable elements outside is asked about`, () => {
  for (const dialog of [
    '<div role="dialog" aria-modal="true" aria-label="Connexion"><button>Fermer</button></div>',
    '<div role="alertdialog" aria-modal="true" aria-label="Erreur"><button>OK</button></div>',
    '<dialog open aria-modal="true" aria-label="Connexion"><button>Fermer</button></dialog>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(PAGE + dialog), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.deepEqual(occ.data.details, { reasonCode: 'focusableOutsideModal', count: 2 }, dialog);
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: no modal, a hidden one, or an inert page behind it is not applicable`, () => {
  for (const body of [
    PAGE + '<div role="dialog" aria-label="Aide"><button>Fermer</button></div>',
    PAGE + '<div role="dialog" aria-modal="true" aria-label="A" hidden><button>x</button></div>',
    '<div inert>' +
      PAGE +
      '</div><div role="dialog" aria-modal="true" aria-label="A"><button>x</button></div>',
    '<main><p>x</p><a href="/" tabindex="-1">Accueil</a></main><div role="dialog" aria-modal="true" aria-label="A"><button>x</button></div>',
    PAGE
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

// Core's view of modality (helpers.getOpenModalDialogs, isModalInert): under
// jsdom an open <dialog aria-modal="true"> is modal only with assumeModal,
// and then the page behind it is inert, so nothing there takes focus.
test(`${RULE_ID}: a dialog core takes as modal, and what is behind it, are not asked about`, () => {
  const assumeModal = { ...RUN, engineOptions: { assumeModal: true } };
  const modal =
    '<dialog open aria-modal="true" aria-label="Connexion"><button>Fermer</button></dialog>';
  assertRule(runa11yCoreOnHtml(page(PAGE + modal), assumeModal), RULE_ID, 'notApplicable');
  // A script-made modal behind it is inert too, with all it would reach.
  const behind =
    '<div role="dialog" aria-modal="true" aria-label="Aide"><button>Fermer</button></div>';
  assertRule(runa11yCoreOnHtml(page(PAGE + behind + modal), assumeModal), RULE_ID, 'notApplicable');
  // Without the option, the same <dialog> is not modal, and is asked about.
  assertRule(runa11yCoreOnHtml(page(PAGE + modal), RUN), RULE_ID, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="mto_case_01"/);
});
