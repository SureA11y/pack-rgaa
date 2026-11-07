'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-img-describedby-target';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 1.6.9: « l'attribut WAI-ARIA aria-describedby associe-t-il la
// description détaillée ? »
test(`${RULE_ID}: an image whose aria-describedby points to nothing fails`, () => {
  for (const body of [
    '<img src="c.png" alt="Ventes 2024" aria-describedby="desc">',
    '<svg role="img" aria-label="Ventes" aria-describedby="a b"><rect width="9" height="9"/></svg>',
    '<canvas aria-label="Carte" aria-describedby="x"></canvas>',
    '<div role="img" aria-label="Plan" aria-describedby="plan-desc"></div>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'targetMissing', body);
  }
});

test(`${RULE_ID}: a partly broken or empty association is asked about`, () => {
  for (const [body, code] of [
    [
      '<img src="c.png" alt="Ventes" aria-describedby="d1 d2"><p id="d1">Les ventes montent.</p>',
      'someTargetsMissing'
    ],
    ['<img src="c.png" alt="Ventes" aria-describedby="d1"><p id="d1"></p>', 'emptyDescription']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, code, body);
  }
});

test(`${RULE_ID}: an association to a passage with text passes`, () => {
  assertRule(
    runa11yCoreOnHtml(
      page(
        '<img src="c.png" alt="Ventes" aria-describedby="d"><p id="d">Les ventes montent de 5 %.</p>'
      ),
      RUN
    ),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: decorative images and other elements are not applicable`, () => {
  for (const body of [
    '<img src="s.png" alt="" aria-describedby="x">',
    '<img src="s.png" role="presentation" aria-describedby="x">',
    '<div aria-hidden="true"><img src="s.png" alt="Logo" aria-describedby="x"></div>',
    '<input type="text" aria-label="Nom" aria-describedby="x">',
    '<img src="c.png" alt="Ventes">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="idt_case_01"/);
});
