'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-focus-not-removed';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 7.3.2: « Un script ne doit pas supprimer le focus d'un élément qui le
// reçoit. »
test(`${RULE_ID}: a handler that blurs the element on focus fails`, () => {
  for (const body of [
    '<a href="/x" onfocus="this.blur()">Lien</a>',
    '<button type="button" onfocus="blur()">OK</button>',
    '<a href="/x" onfocus="if (window.x) { event.target.blur(); }">Lien</a>',
    '<div tabindex="0" onfocusin="document.activeElement.blur();">Zone</div>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'blurOnFocus', body);
  }
});

test(`${RULE_ID}: a handler that moves focus elsewhere is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(
      page(
        '<div tabindex="0" onfocus="document.getElementById(\'i\').focus()">Liste</div><input id="i" aria-label="x">'
      ),
      RUN
    ),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'focusMovedOnFocus');
});

test(`${RULE_ID}: other focus handlers, or none, are not applicable`, () => {
  for (const body of [
    '<a href="/x" onfocus="this.classList.add(\'on\')">Lien</a>',
    '<input aria-label="x" onfocus="showHelp()">',
    '<a href="/x" onblur="save()">Lien</a>',
    '<a href="/x">Lien</a>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="fnr_case_01"/);
});
