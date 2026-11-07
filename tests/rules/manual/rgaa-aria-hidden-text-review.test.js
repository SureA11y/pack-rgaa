'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-aria-hidden-text-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 10.8.1 technical note: content with aria-hidden="true" « ne sera donc
// plus vocalisable, mais restera visible ».
test(`${RULE_ID}: visible text under aria-hidden="true" is asked about, once per outer element`, () => {
  for (const body of [
    '<p aria-hidden="true">Offre valable jusqu’au 31 mars</p>',
    '<div aria-hidden="true"><p>Deux mots</p><p aria-hidden="true">encore ici</p></div>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'visibleTextHidden', body);
  }
});

test(`${RULE_ID}: signs, one word, icons, hidden text or SVG text are not applicable`, () => {
  for (const body of [
    '<span aria-hidden="true">*</span>',
    '<span aria-hidden="true">Lire</span>',
    '<i aria-hidden="true" class="icon"></i>',
    '<p aria-hidden="true" hidden>Texte caché du tout</p>',
    '<svg aria-hidden="true"><text>Deux mots</text></svg>',
    '<p aria-hidden="false">Texte visible lu</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="aht_case_01"/);
});
