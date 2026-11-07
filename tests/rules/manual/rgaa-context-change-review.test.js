'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-context-change-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 7.4.1: a change of context is announced by a text first, or started by
// an explicit button or link; a field is neither.
test(`${RULE_ID}: a field that submits or navigates when it changes is asked about`, () => {
  for (const body of [
    '<form><select onchange="this.form.submit()" aria-label="Langue"><option>A</option></select></form>',
    '<select onchange="location.href = this.value" aria-label="Aller à"><option>A</option></select>',
    '<input type="checkbox" onchange="window.open(\'/aide\')" aria-label="Aide">'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'fieldChangesContext', body);
  }
});

test(`${RULE_ID}: other handlers, or none, are not applicable`, () => {
  for (const body of [
    '<input aria-label="Nom" onchange="validate(this)">',
    '<select aria-label="Langue"><option>A</option></select><button>OK</button>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="ccr_case_01"/);
});
