'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-noscript-alternative-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 7.2.1: « l'alternative entre <noscript> et </noscript> permet d'accéder à
// des contenus et des fonctionnalités similaires ».
test(`${RULE_ID}: a <noscript> with text is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(
      page('<noscript><p>Activez JavaScript pour voir la carte.</p></noscript>'),
      RUN
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'noscriptAlternative');
  assert.equal(rule.occurrences[0].data.details.text, 'Activez JavaScript pour voir la carte.');
});

test(`${RULE_ID}: a <noscript> with tags only, or none, is not applicable`, () => {
  for (const body of [
    '<noscript><img src="https://t.example/p.gif" width="1" height="1" alt=""></noscript>',
    '<noscript><iframe src="https://t.example/ns" height="0" width="0"></iframe></noscript>',
    '<p>Texte</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="nar_case_01"/);
});
