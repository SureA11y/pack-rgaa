'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-table-title-adjacent';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const TABLE = (attrs = '', inner = '') =>
  `<table ${attrs}>${inner}<tr><th scope="col">Ville</th><th scope="col">Habitants</th></tr><tr><td>Lyon</td><td>520 000</td></tr></table>`;

// 5.4.1: « Pour chaque tableau de données ayant un titre, le titre est-il
// correctement associé au tableau de données ? »
test(`${RULE_ID}: a data table with no name right after a heading is asked about`, () => {
  for (const body of [
    '<h2>Population des villes</h2>' + TABLE(),
    '<div role="heading" aria-level="3">Population</div>' + TABLE()
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'adjacentHeading', body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: a table tied to a title, a layout table or no heading before is not applicable`, () => {
  for (const body of [
    '<h2>Population</h2>' + TABLE('', '<caption>Population des villes</caption>'),
    '<h2 id="t">Population</h2>' + TABLE('aria-labelledby="t"'),
    '<h2>Population</h2>' + TABLE('aria-label="Population"'),
    '<h2>Population</h2><p>Chiffres 2024.</p>' + TABLE(),
    '<h2>Mise en page</h2><table role="presentation"><tr><th>x</th></tr></table>',
    '<h2>Liste</h2><table><tr><td>a</td></tr></table>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="tta_case_01"/);
});
