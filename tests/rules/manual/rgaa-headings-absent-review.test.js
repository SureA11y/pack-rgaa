'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-headings-absent-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
}
const TEXT =
  '<p>' + 'Les horaires de la mairie changent pendant les vacances scolaires. '.repeat(5) + '</p>';

// 9.1.3: « chaque passage de texte constituant un titre est-il structuré à
// l'aide d'une balise <hx> »; a page of some length with no heading usually
// has such passages, but a person decides.
test(`${RULE_ID}: a page with text and no heading is asked about`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page(TEXT), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'noHeading');
  assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
});

test(`${RULE_ID}: a page with a heading, or with little text, is not applicable`, () => {
  for (const body of [
    '<h1>Mairie</h1>' + TEXT,
    '<div role="heading" aria-level="1">Mairie</div>' + TEXT,
    '<h2 hidden>Mairie</h2>' + TEXT,
    '<p>Page en travaux.</p>',
    '<div hidden>' + TEXT + '</div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  assertRule(result, RULE_ID, 'notApplicable');
});
