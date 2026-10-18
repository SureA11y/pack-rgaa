'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-invalid-field-message';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 11.10.4: the message is « visible et situé dans l'étiquette associée au
// champ » or in a passage linked by aria-labelledby or aria-describedby.
test(`${RULE_ID}: a field marked invalid with no linked visible passage is asked about`, () => {
  for (const [body, code] of [
    [
      '<form><label for="a">Courriel</label><input id="a" aria-invalid="true"></form>',
      'noLinkedMessage'
    ],
    [
      '<form><label for="a">Courriel</label><input id="a" aria-invalid="true" aria-errormessage="e"><p id="e">Format invalide</p></form>',
      'errormessageOnly'
    ],
    [
      '<form><label for="a">Courriel</label><input id="a" aria-invalid="true" aria-describedby="e"><p id="e" hidden>Format invalide</p></form>',
      'noLinkedMessage'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, code, body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: a linked visible message, a valid field or no form is not applicable`, () => {
  for (const body of [
    '<form><label for="a">Courriel</label><input id="a" aria-invalid="true" aria-describedby="e"><p id="e">Format invalide</p></form>',
    '<form><label for="a">Courriel</label><input id="a" aria-invalid="false"></form>',
    '<label for="a">Courriel</label><input id="a" aria-invalid="true">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="ifm_case_01"/);
});
