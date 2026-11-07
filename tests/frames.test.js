'use strict';

/**
 * A document shown in a frame is no web page of its own, as core reads it:
 * RGAA's page-level rules leave it alone, and a test runner that shows the
 * page in a frame says otherwise with engineOptions.topLevelDocument.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/run.js');

const PAGE_RULES = [
  'rgaa-page-language-present',
  'rgaa-html-lang-code-valid',
  'rgaa-doctype-present',
  'rgaa-doctype-position',
  'rgaa-doctype-valid',
  'rgaa-page-title-unique',
  'rgaa-skip-link-present',
  'rgaa-page-zones-reachable',
  'rgaa-main-element-structure',
  'rgaa-navigation-systems-review',
  'rgaa-headings-absent-review',
  'rgaa-default-language-review'
];

const html = '<html><body><p>Le contenu du cadre, sans langue ni doctype.</p></body></html>';
const scan = (topLevelDocument) =>
  runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2', topLevelDocument } });

test('a framed document is not judged as a page', () => {
  const framed = scan(false);
  for (const id of PAGE_RULES) {
    const rule = framed.checksResults.find((r) => r.ruleId === id);
    assert.equal(rule ? rule.outcome : 'notApplicable', 'notApplicable', id);
  }
  for (const id of ['8.1', '8.3', '8.5']) {
    const rollup = framed.rulesResults.find((r) => r.ruleId === `rgaa-4.1.2-${id}`);
    assert.notEqual(rollup.outcome, 'fail', id);
  }
});

test('a page a test runner shows in a frame is judged as a page', () => {
  const page = scan(true);
  const outcome = (id) => page.checksResults.find((r) => r.ruleId === id).outcome;
  assert.equal(outcome('rgaa-page-language-present'), 'fail');
  assert.equal(outcome('rgaa-doctype-present'), 'fail');
});
