'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-field-hidden-label-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main><form>${body}</form></main></body></html>`;
}
const SR =
  'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';

// 11.1.3 covers a field « ayant une étiquette dont le contenu n'est pas
// visible »: a title or visible text next to it must make the input clear.
test(`${RULE_ID}: a field whose label is visually hidden is asked about`, () => {
  for (const body of [
    `<label for="q" style="${SR}">Rechercher</label><input id="q"><button>OK</button>`,
    `<style>.sr{${SR}}</style><label for="q" class="sr">Rechercher</label><input id="q" title="Rechercher">`
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'hiddenLabel', body);
    assert.equal(rule.occurrences[0].data.details.label, 'Rechercher');
  }
});

test(`${RULE_ID}: the summary names the CSS that hides the label, and the element it is on`, () => {
  const run = (body, locale) =>
    assertRule(
      runa11yCoreOnHtml(page(body), { ...RUN, engineOptions: locale ? { locale } : {} }),
      RULE_ID,
      'cantTell'
    ).occurrences[0];
  const self = run(
    '<style>.sr{position:absolute;clip:rect(0 0 0 0)}</style><label for="q" class="sr">Rechercher</label><input id="q" title="Rechercher sur le site">'
  );
  assert.equal(self.i18n.summaryKey, 'fieldHiddenLabelReview_summary_cantTell_hiddenBySelf_title');
  assert.deepEqual(self.data.details.hiddenBy, {
    element: 'label class="sr"',
    css: 'clip: rect(0 0 0 0)'
  });
  assert.equal(
    self.summary,
    'This field\'s label ("Rechercher") is visually hidden by clip: rect(0 0 0 0) on the <label class="sr">. Its title attribute is "Rechercher sur le site".'
  );

  const body =
    '<div id="zone" style="opacity:0"><label for="m">Courriel</label></div><input id="m">';
  const ancestor = run(body);
  assert.equal(
    ancestor.i18n.summaryKey,
    'fieldHiddenLabelReview_summary_cantTell_hiddenByAncestor'
  );
  assert.equal(
    ancestor.summary,
    'This field\'s label ("Courriel") is visually hidden by opacity: 0 on the <div id="zone"> around it.'
  );
  assert.equal(
    run(body, 'fr').summary,
    'L’étiquette de ce champ (« Courriel ») est masquée visuellement par opacity: 0 sur la balise <div id="zone"> qui la contient.'
  );

  const none = run('<label for="n" style="display:none">Nom</label><input id="n">');
  assert.deepEqual(none.data.details.hiddenBy, { element: 'label', css: 'display: none' });
});

test(`${RULE_ID}: a visible label, or visible text linked by aria-labelledby, is not applicable`, () => {
  for (const body of [
    '<label for="q">Rechercher</label><input id="q">',
    `<label for="q" style="${SR}">Rechercher</label><span id="v">Recherche</span><input id="q" aria-labelledby="v">`,
    '<input aria-label="Rechercher">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="fhl_case_01"/);
});
