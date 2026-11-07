'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const fr = require('../../../i18n/fr.json');
const en = require('../../../i18n/en.json');

const RULE_ID = 'rgaa-label-placement-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// RGAA 11.4 is about where a label sits on screen: without a layout (jsdom)
// there is nothing to compare, so the rule stays out of it. Its questions are
// tested in rgaa-label-placement-review-chromium.test.js.
test(`${RULE_ID}: without a layout, every field is not applicable`, () => {
  for (const body of [
    '<input id="a" type="text"> <label for="a">Nom</label>',
    '<label for="b">J’accepte</label> <input id="b" type="checkbox">',
    '<label for="c">Ville</label><input id="c" style="margin-left:400px">',
    '<span id="d">Pays</span><div role="combobox" aria-labelledby="d" tabindex="0"></div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: messages exist in French; the map links each reason to its test`, () => {
  for (const code of ['labelFarFromField', 'labelNotAboveOrLeft', 'labelNotBelowOrRight']) {
    for (const kind of ['summary', 'hint']) {
      const key = `labelPlacementReview_${kind}_cantTell_${code}`;
      assert.ok(fr[key] && en[key] && fr[key] !== en[key], key);
    }
  }
  assert.equal(
    fr.labelPlacementReview_summary_cantTell_labelNotAboveOrLeft,
    'L’étiquette « {{label}} » n’est ni juste au-dessus de ce champ ni juste avant lui sur la même ligne.'
  );
  const row = RGAA_RULE_TESTS['4.1.2'][RULE_ID];
  assert.deepEqual(row.tests, ['11.4.1', '11.4.2', '11.4.3']);
  assert.deepEqual(row.reasonCodes.labelFarFromField.tests, ['11.4.1']);
  assert.deepEqual(row.reasonCodes.labelNotAboveOrLeft.tests, ['11.4.2']);
  assert.deepEqual(row.reasonCodes.labelNotBelowOrRight.tests, ['11.4.3']);
});

test(`${RULE_ID}: without a layout it adds nothing to the 11.4 rollup`, () => {
  const result = runa11yCoreOnHtml(page('<input id="a" type="text"> <label for="a">Nom</label>'), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.equal(rule.outcome, 'notApplicable');
  const c = result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-11.4');
  assert.ok(c, 'criterion 11.4 is rolled up');
  assert.equal(c.data.details.reasonCode, 'composite.rollup.cantTell.partialCoverage');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  // Without a layout; in Chromium, cases 01 to 03 are asked about.
  assertRule(result, RULE_ID, 'notApplicable');
});
