'use strict';

/**
 * One finding, one test (rule-map.js): where one rule's findings fail
 * different tests, each criterion's result judges the rule by the findings
 * that belong to it and names only their tests, rather than every test the
 * rule is linked to. Contrast by text size and weight, lists by their
 * element, unnamed widgets by role, and images without alt asked about as
 * decorative.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml, core } = require('./helpers/run.js');
const { RGAA_RULE_TESTS } = require('../rule-map');

const scan = (body) =>
  runa11yCoreOnHtml(
    `<!doctype html><html lang="fr"><head><title>Page</title></head><body style="background:#fff"><main>${body}</main></body></html>`,
    { engineOptions: { profile: 'rgaa-4.1.2' } }
  );
const criterion = (result, id) => result.rulesResults.find((r) => r.ruleId === `rgaa-4.1.2-${id}`);
const tests = (rollup) =>
  rollup.meta.normativeMappings
    .filter((m) => m.standard === 'RGAA')
    .map((m) => m.requirement)
    .sort();
const contributor = (rollup, ruleId) =>
  rollup.data.details.contributors.find((c) => c.testId === ruleId);
const pale = (style, text) => `<p style="color:#aaa;${style}">${text}</p>`;

test('a contrast failure names the 3.2 test of its text size and weight', () => {
  const cases = [
    ['font-size:16px', '3.2.1'],
    ['font-size:16px;font-weight:700', '3.2.2'],
    ['font-size:24px', '3.2.3'],
    ['font-size:19px;font-weight:700', '3.2.4']
  ];
  for (const [style, expected] of cases) {
    const rollup = criterion(scan(pale(style, 'Texte pâle')), '3.2');
    assert.equal(rollup.outcome, 'fail', style);
    assert.deepEqual(tests(rollup), [expected], style);
    assert.deepEqual(contributor(rollup, 'rgaa-contrast-minimum').requirements, [expected], style);
  }
  const both = criterion(
    scan(pale('font-size:16px', 'Petit') + pale('font-size:24px', 'Grand')),
    '3.2'
  );
  assert.deepEqual(tests(both), ['3.2.1', '3.2.3']);
});

test('an invalid list child names the test of its own list', () => {
  const ul = criterion(scan('<ul><li>a</li><p>b</p></ul>'), '9.3');
  assert.equal(ul.outcome, 'fail');
  assert.deepEqual(tests(ul), ['9.3.1']);
  const ol = criterion(scan('<ol><li>a</li><p>b</p></ol>'), '9.3');
  assert.equal(ol.outcome, 'fail');
  assert.deepEqual(tests(ol), ['9.3.2']);
});

// Core asks where only HTML breaks; RGAA 9.3 names the elements a list is
// structured with, so these stay failures of the standard.
test('a broken description list fails 9.3.3', () => {
  for (const html of ['<dl><dd>b</dd><dt>a</dt></dl>', '<dl><p>a</p></dl>', '<dt>a</dt>']) {
    const rollup = criterion(scan(html), '9.3');
    assert.equal(rollup.outcome, 'fail', html);
    assert.deepEqual(tests(rollup), ['9.3.3'], html);
  }
});

test('a list item outside a list names 9.3.1, and one in an <ol> made something else 9.3.2', () => {
  const orphan = criterion(scan('<div><li>a</li></div>'), '9.3');
  assert.equal(orphan.outcome, 'fail');
  assert.deepEqual(tests(orphan), ['9.3.1']);
  // A widget role on the list is asked about, under the test of its list.
  const ol = criterion(scan('<ol role="tablist"><li>a</li></ol>'), '9.3');
  assert.equal(ol.outcome, 'cantTell');
  assert.ok(tests(ol).includes('9.3.2'));
  assert.deepEqual(contributor(ol, 'listitem-parent-valid').requirements, ['9.3.2']);
});

test('an unnamed widget is a question under the criterion of its role, and a progress bar neither', () => {
  const grid = scan('<div role="grid"><div role="row"><div role="gridcell">a</div></div></div>');
  assert.equal(contributor(criterion(grid, '7.1'), 'aria-role-name-present').outcome, 'cantTell');
  const radios = scan(
    '<div role="radiogroup"><label><input type="radio" name="a"> Oui</label><label><input type="radio" name="a"> Non</label></div>'
  );
  assert.equal(
    contributor(criterion(radios, '11.6'), 'aria-role-name-present').outcome,
    'cantTell'
  );
  assert.equal(contributor(criterion(radios, '7.1'), 'aria-role-name-present').outcome, 'pass');
  const bar = scan('<div role="progressbar" aria-valuenow="5"></div>');
  const name = bar.checksResults.find((c) => c.ruleId === 'aria-role-name-present');
  assert.equal(name.outcome, 'cantTell');
  for (const id of ['7.1', '11.6']) {
    const rollup = criterion(bar, id);
    if (rollup) assert.equal(contributor(rollup, 'aria-role-name-present').outcome, 'pass', id);
  }
});

// With no alt, an image fails 1.1.1 if it carries information and 1.2.1 if it
// is decorative: which of the two takes a person, so neither is failed.
test('an image without alt is a question under both 1.1 and 1.2', () => {
  const result = scan('<img src="photo.png">');
  assert.equal(criterion(result, '1.1').outcome, 'cantTell');
  assert.equal(criterion(result, '1.2').outcome, 'cantTell');
});

test("a rule's result still names every test it can bear on", () => {
  const catalog = core.getChecksCatalog({ profile: 'rgaa-4.1.2' });
  const named = (id) =>
    catalog
      .find((c) => c.ruleId === id)
      .normativeMappings.filter((m) => m.standard === 'RGAA')
      .map((m) => m.requirement)
      .sort();
  assert.deepEqual(named('rgaa-img-alt-present'), ['1.1.1']);
  assert.deepEqual(
    named('rgaa-contrast-minimum'),
    RGAA_RULE_TESTS['4.1.2']['rgaa-contrast-minimum'].tests
  );
});

test('a bare <canvas> is a question under both 1.1 and 1.2', () => {
  const result = scan('<canvas width="40" height="20"></canvas>');
  for (const [id, test] of [
    ['1.1', '1.1.8'],
    ['1.2', '1.2.5']
  ]) {
    const c = contributor(criterion(result, id), 'rgaa-canvas-role-img');
    assert.deepEqual([c.outcome, c.requirements], ['cantTell', [test]], id);
  }
});

test('a decorative SVG that keeps a <title> fails 1.2.4 and is a question under 1.1.5', () => {
  const result = scan(
    '<svg aria-hidden="true" width="10" height="10"><title>Logo</title><circle r="4"/></svg>'
  );
  const decorative = criterion(result, '1.2');
  assert.equal(decorative.outcome, 'fail');
  assert.ok(tests(decorative).includes('1.2.4'));
  const informative = contributor(criterion(result, '1.1'), 'rgaa-svg-hidden-no-alternative');
  assert.deepEqual([informative.outcome, informative.requirements], ['cantTell', ['1.1.5']]);
});
