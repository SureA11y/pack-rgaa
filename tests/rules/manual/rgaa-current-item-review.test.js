'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-current-item-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
}

// Glossary « Indication donnée par la forme, la taille ou la position »:
// « la présence d'un marqueur visuel, pour indiquer la page active dans un
// menu de navigation ».
test(`${RULE_ID}: a navigation link marked current by a class only is asked about`, () => {
  for (const body of [
    '<nav><ul><li class="active"><a href="/">Accueil</a></li><li><a href="/a">A</a></li></ul></nav>',
    '<nav><a href="/" class="nav-link is-active">Accueil</a></nav>',
    '<div role="navigation"><a href="/" class="menu-item--current">Accueil</a></div>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'currentByLookOnly', body);
  }
});

test(`${RULE_ID}: the summary names the class, and whether it is on the link or its list item`, () => {
  const occ = (body, locale) =>
    assertRule(
      runa11yCoreOnHtml(page(body), { ...RUN, engineOptions: locale ? { locale } : {} }),
      RULE_ID,
      'cantTell'
    ).occurrences[0];
  const item =
    '<nav><ul><li class="menu-item active"><a href="/">Accueil</a></li><li><a href="/a">A</a></li></ul></nav>';
  const onItem = occ(item);
  assert.equal(onItem.i18n.summaryKey, 'currentItemReview_summary_cantTell_item');
  assert.deepEqual(onItem.i18n.params, { label: 'Accueil', class: 'active' });
  assert.equal(
    onItem.summary,
    'This navigation link ("Accueil") is marked as the current one only by the class "active" on its <li>, with no aria-current and no text that says so.'
  );
  assert.equal(
    occ(item, 'fr').summary,
    'Ce lien de navigation (« Accueil ») est marqué comme courant par la seule classe « active » de sa balise <li>, sans aria-current ni texte qui le dise.'
  );
  const onLink = occ('<nav><a href="/" class="nav-link is-active">Accueil</a></nav>');
  assert.equal(onLink.i18n.summaryKey, 'currentItemReview_summary_cantTell_link');
  assert.deepEqual(onLink.data.details, {
    reasonCode: 'currentByLookOnly',
    label: 'Accueil',
    class: 'is-active',
    classOn: 'link'
  });
});

test(`${RULE_ID}: aria-current, a text that says so, or a link outside navigation is not applicable`, () => {
  for (const body of [
    '<nav><a href="/" class="active" aria-current="page">Accueil</a></nav>',
    '<nav><ul><li class="active" aria-current="true"><a href="/">Accueil</a></li></ul></nav>',
    '<nav><a href="/" class="current">Accueil <span class="sr-only">(page actuelle)</span></a></nav>',
    '<main><a href="/" class="active">Accueil</a></main>',
    '<nav><a href="/" class="interactive">Carte</a></nav>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="cir_case_01"/);
});
