'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-object-embed-decorative-aria-hidden';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const OBJ = 'type="image/png" data="a.png"';
const EMB = 'type="image/png" src="a.png"';
const code = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);

// 1.2.3 and 1.2.6: a decorative image has aria-hidden="true" and no
// alternative.
test(`${RULE_ID}: a decorative image with an alternative, or without aria-hidden, fails`, () => {
  for (const [body, expected] of [
    [`<object ${OBJ} aria-hidden="true" title="Logo"></object>`, 'hiddenImageHasAlternative'],
    [`<embed ${EMB} aria-hidden="true" aria-label="Logo">`, 'hiddenImageHasAlternative'],
    [`<object ${OBJ} aria-hidden="true">Logo</object>`, 'hiddenImageHasAlternative'],
    [`<object ${OBJ} role="presentation"></object>`, 'presentationWithoutAriaHidden'],
    [`<embed ${EMB} role="none">`, 'presentationWithoutAriaHidden']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(code(rule), [expected], body);
  }
});

test(`${RULE_ID}: role="none" with content inside an object is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(`<object ${OBJ} role="none">Logo</object>`), RUN),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(code(rule), ['presentationWithContent']);
});

test(`${RULE_ID}: aria-hidden alone passes; other types, captions and unmarked images are not applicable`, () => {
  assertRule(runa11yCoreOnHtml(page(`<embed ${EMB} aria-hidden="true">`), RUN), RULE_ID, 'pass');
  for (const body of [
    '<object type="application/pdf" data="a.pdf" aria-hidden="true" title="x"></object>',
    `<figure><object ${OBJ} aria-hidden="true" title="x"></object><figcaption>Logo</figcaption></figure>`,
    `<object ${OBJ}></object>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="oed_case_01"/);
});
