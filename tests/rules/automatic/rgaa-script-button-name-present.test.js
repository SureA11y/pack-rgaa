'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-script-button-name-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 7.1.3: « Le composant possède un nom pertinent », with no alternative.
test(`${RULE_ID}: a button outside a form with no name fails`, () => {
  for (const body of [
    '<button type="button"></button>',
    '<button type="button"><svg width="10" height="10"><rect width="10" height="10"/></svg></button>',
    '<button type="button"><img src="x.png" alt=""></button>',
    '<div role="button" tabindex="0"></div>',
    '<input type="button">'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'nameMissing', body);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'scriptButtonNamePresent_summary_fail_nameMissing'
    );
  }
});

test(`${RULE_ID}: an image button the browser names "Submit" is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<input type="image" src="a.png">'), RUN),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'imageButtonNoAlt');
});

test(`${RULE_ID}: a named button passes`, () => {
  for (const body of [
    '<button type="button">Menu</button>',
    '<button type="button" aria-label="Fermer"><svg aria-hidden="true"></svg></button>',
    '<button type="button" title="Rechercher"><img src="l.png" alt=""></button>',
    '<input type="button" value="Imprimer">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: buttons of a form, hidden buttons and other roles are not applicable`, () => {
  for (const body of [
    '<form><button></button></form>',
    '<form id="f"></form><button form="f"></button>',
    '<button hidden></button>',
    '<button aria-hidden="true" tabindex="-1"></button>',
    '<div role="tablist"><button role="tab" aria-selected="true"></button></div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="sbn_case_01"/);
});

// The hint names what the markup shows in place of a name.
test(`${RULE_ID}: the hint names the cause the markup shows`, () => {
  for (const [body, cause] of [
    ['<button type="button"><span style="display:none">Menu</span></button>', 'hiddenText'],
    ['<button type="button" aria-labelledby="nope"></button>', 'labelledbyMissing'],
    ['<button type="button" aria-lable="Fermer"></button>', 'misspelledAttribute'],
    ['<button type="button"><span class="icon-close"></span></button>', 'emptyIcon'],
    ['<input type="button">', 'inputNoValue']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.nameCause, cause, body);
    assert.equal(occ.i18n.hintKey, `buttonNameCause_hint_${cause}`, body);
  }
  const occ = assertRule(
    runa11yCoreOnHtml(page('<button type="button" aria-lable="Fermer"></button>'), RUN),
    RULE_ID,
    'fail'
  ).occurrences[0];
  assert.equal(
    occ.hint,
    'It has aria-lable="Fermer", but browsers do not read aria-lable: did you mean aria-label? Rename the attribute so that it names the button.'
  );
});
