'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-script-redirect-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main><p>x</p>${body}</main></body></html>`;
}

// 13.1.3: a redirection done by a script can be stopped, extended ten
// times, or announced twenty seconds ahead.
test(`${RULE_ID}: a script that redirects from a timer is asked about`, () => {
  for (const body of [
    '<script>setTimeout(function(){ window.location.href = "/accueil"; }, 5000);</script>',
    '<script>setTimeout(() => location.replace("/x"), 3000)</script>',
    '<script>setInterval(function () { location.assign("/y") }, 60000)</script>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'timedScriptRedirect', body);
  }
});

test(`${RULE_ID}: an immediate redirect, a comparison or a data block is not applicable`, () => {
  for (const body of [
    '<script>location.href = "/maintenant";</script>',
    '<script>if (location.href == "/a") {} setTimeout(init, 10)</script>',
    '<script type="application/ld+json">{"a":"setTimeout(location.href=1)"}</script>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});
