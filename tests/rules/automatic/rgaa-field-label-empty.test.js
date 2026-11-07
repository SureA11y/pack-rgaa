'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-field-label-empty';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main><form>${body}</form></main></body></html>`;
}
const codes = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);

// 11.2.1 to 11.2.4: each label source « permet de connaître la fonction
// exacte du champ »; an empty one tells nothing.
test(`${RULE_ID}: a field whose label sources are all empty fails, once per source`, () => {
  for (const [body, expected] of [
    ['<label for="a"></label><input id="a">', ['emptyLabel']],
    ['<label for="a"> </label><input id="a" title="">', ['emptyLabel', 'emptyTitle']],
    ['<input title="">', ['emptyTitle']],
    ['<input aria-label=" ">', ['emptyAriaLabel']],
    ['<input aria-labelledby="x"><span id="x"></span>', ['emptyLabelledby']],
    ['<label><select><option>Paris</option></select></label>', ['emptyLabel']]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail');
    assert.deepEqual(codes(rule), expected, body);
  }
});

test(`${RULE_ID}: a field with one source that holds text passes`, () => {
  for (const body of [
    '<label for="a"></label><input id="a" aria-label="Nom">',
    '<label><img src="l.png" alt="Rechercher"><input></label>',
    '<label for="a">Nom</label><input id="a">',
    '<input title="Nom">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a field with no source, or one pointing to no element, is left to 11.1.1`, () => {
  for (const body of ['<input>', '<input aria-labelledby="nope">', '<input type="hidden">']) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="fle_case_01"/);
});
