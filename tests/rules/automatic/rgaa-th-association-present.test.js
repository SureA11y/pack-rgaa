'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-th-association-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const BOTH = (th) =>
  `<table><tr><td></td>${th('2023')}${th('2024')}</tr><tr>${th('Paris')}<td>1</td><td>2</td></tr><tr>${th('Lyon')}<td>3</td><td>4</td></tr></table>`;

// 5.7.1: each <th> « s'appliquant à la totalité de la ligne ou de la
// colonne » has a unique id, a scope or a header role.
test(`${RULE_ID}: headers with none of the three in a table with headers on both axes fail`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(BOTH((t) => `<th>${t}</th>`)), RUN),
    RULE_ID,
    'fail',
    { minOccurrences: 4, maxOccurrences: 4 }
  );
  assert.deepEqual(
    rule.occurrences.map((o) => o.data.details.label),
    ['2023', '2024', 'Paris', 'Lyon']
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'noAssociation');
});

test(`${RULE_ID}: a scope, an id or a header role passes`, () => {
  for (const th of [
    (t) => `<th scope="col">${t}</th>`,
    (t) => `<th id="h-${t}">${t}</th>`,
    (t) => `<th role="columnheader">${t}</th>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(BOTH(th)), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// 5.7's particular case: headers on a single row or a single column may be
// <th> without scope.
test(`${RULE_ID}: headers on a single row or a single column pass`, () => {
  for (const body of [
    '<table><tr><th>Nom</th><th>Âge</th></tr><tr><td>Ana</td><td>31</td></tr></table>',
    '<table><tr><th colspan="2">Population</th></tr><tr><td>2</td><td>1</td></tr></table>',
    '<table><tr><th>Paris</th><td>2</td></tr><tr><th>Lyon</th><td>1</td></tr></table>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// With spans, or headers off a first row and column, a header may cover
// only part of a row or column.
test(`${RULE_ID}: a table with headers on two axes and spans is asked about once`, () => {
  for (const body of [
    '<table><tr><th colspan="2">Population</th></tr><tr><th>Paris</th><td>2</td></tr><tr><th>Lyon</th><td>1</td></tr></table>',
    '<table><tr><th>Ville</th><th>2023</th></tr><tr><td>Paris</td><td>2</td></tr><tr><th colspan="2">Sud</th></tr><tr><td>Nice</td><td>1</td></tr></table>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'noAssociationSimple', body);
  }
});

test(`${RULE_ID}: a presentation table or one with no header is not applicable`, () => {
  for (const body of [
    '<table role="presentation"><tr><th>x</th><td>y</td></tr></table>',
    '<table><tr><td>a</td><td>b</td></tr></table>',
    '<table><tr><th></th><td>b</td></tr></table>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  // A fixture id would give the header an association: case 01's header is
  // found by its text.
  assert.equal(rule.occurrences[0].occurrenceOutcome, 'fail');
  assert.match(rule.occurrences[0].html, />2023</);
  assert.equal(rule.occurrences[1].occurrenceOutcome, 'cantTell');
  assert.match(rule.occurrences[1].html, /id="tap_case_02"/);
});
