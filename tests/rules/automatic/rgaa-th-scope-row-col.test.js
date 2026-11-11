'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-th-scope-row-col';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const GROUP_TABLE =
  '<table><tr><td></td><th scope="colgroup" colspan="2">2025</th></tr>' +
  '<tr><td></td><th scope="col">Q1</th><th scope="col">Q2</th></tr>' +
  '<tr><th scope="row">North</th><td>1</td><td>2</td></tr></table>';
const COL_TABLE =
  '<table><tr><th scope="col">Name</th><th scope="col">Age</th></tr><tr><td>Ada</td><td>36</td></tr></table>';

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

// Any scope but row or col fails 5.7.2 (whole row or column) or 5.7.3
// (part of one): criterion 5.7 fails either way.
test(`${RULE_ID}: a scope other than row or col fails`, () => {
  for (const [scope, expected] of [
    ['colgroup', 'colgroup'],
    ['rowgroup', 'rowgroup'],
    ['ColGroup', 'colgroup'],
    [' rowgroup ', 'rowgroup'],
    ['column', 'column'],
    ['', '']
  ]) {
    const body = `<table><tr><th scope="${scope}">G</th></tr><tr><td>1</td></tr></table>`;
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'otherScope');
    assert.equal(occ.data.details.scope, expected);
    assert.equal(occ.i18n.summaryKey, 'thScopeRowCol_summary_fail_otherScope');
  }
});

test(`${RULE_ID}: a scope pointing the wrong way fails where the table's shape is certain`, () => {
  const rowHeader =
    '<table><tr><th scope="col">Day</th><th scope="col">Hours</th></tr>' +
    '<tr><th id="x" scope="col">Monday</th><td>9</td></tr></table>';
  const rule = assertRule(runa11yCoreOnHtml(page(rowHeader), RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'wrongAxis',
    scope: 'col',
    axis: 'row'
  });
  const colHeader =
    '<table><tr><th scope="row">Name</th><th scope="row">Age</th></tr>' +
    '<tr><td>Ada</td><td>36</td></tr><tr><td>Bob</td><td>40</td></tr></table>';
  const cols = assertRule(runa11yCoreOnHtml(page(colHeader), RUN), RULE_ID, 'fail');
  assert.equal(cols.occurrences.length, 2);
  assert.equal(cols.occurrences[0].i18n.summaryKey, 'thScopeRowCol_summary_fail_wrongAxis_col');
  // With a span, or without a first row of headers, the shape is a person's call.
  for (const body of [
    '<table><tr><th scope="col" colspan="2">Day</th></tr><tr><th scope="col">Monday</th><td>9</td></tr></table>',
    '<table><tr><td>a</td><th scope="col">b</th></tr><tr><th scope="col">c</th><td>d</td></tr></table>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: row and col scopes that match pass, and other elements and layout tables are out of scope`, () => {
  for (const body of [COL_TABLE, '<table><tr><th scope="row">A</th><td>1</td></tr></table>']) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
  for (const body of [
    '<table><tr><th>A</th></tr><tr><td>1</td></tr></table>',
    '<table><tr><td scope="colgroup">A</td></tr></table>',
    '<table role="presentation"><tr><th scope="colgroup">A</th></tr></table>',
    '<table role="none"><tr><th scope="rowgroup">A</th></tr></table>',
    '<p>No table</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(GROUP_TABLE), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cet en-tête a un attribut scope="colgroup" : le RGAA n’accepte que scope="row" ou scope="col".'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page(GROUP_TABLE), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 5.7 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-5.7' } } }
  ]) {
    const rule = runa11yCoreOnHtml(page(GROUP_TABLE), opts).checksResults.find(
      (r) => r.ruleId === RULE_ID
    );
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

test(`${RULE_ID}: occurrences carry RGAA 5.7.2 and 5.7.3`, () => {
  const rule = runa11yCoreOnHtml(page(GROUP_TABLE), RGAA).checksResults.find(
    (r) => r.ruleId === RULE_ID
  );
  assert.deepEqual(
    rule.meta.normativeMappings.filter((m) => m.standard === 'RGAA').map((m) => m.requirement),
    ['5.7.2', '5.7.3']
  );
});

// WCAG technique H63 accepts colgroup and rowgroup; RGAA 5.7 accepts only row
// and col on a header over a whole row or column, and no scope otherwise.
test(`${RULE_ID}: RGAA 5.7 fails a group scope that WCAG 1.3.1 passes in the same run`, () => {
  const result = runa11yCoreOnHtml(page(GROUP_TABLE), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-5.7').outcome, 'fail');
  assert.equal(rollupOutcome(rollup(result, 'wcag-1.3.1-info-and-relationships')), 'passedInPart');
});

test(`${RULE_ID}: RGAA 5.7 and WCAG 1.3.1 find nothing wrong with scope="col"`, () => {
  const result = runa11yCoreOnHtml(page(COL_TABLE), RGAA);
  assert.ok(
    ['passedInPart', 'noneFoundInPart'].includes(rollupOutcome(rollup(result, 'rgaa-4.1.2-5.7')))
  );
  assert.equal(rollupOutcome(rollup(result, 'wcag-1.3.1-info-and-relationships')), 'passedInPart');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'rgaa-th-scope-row-col-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['tsrc_case_01', 'tsrc_case_02', 'tsrc_case_06', 'tsrc_case_07']);
});

// The occurrences a body gives, in English or in the locale asked.
function messagesOf(body, locale) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { ...RUN, ...(locale ? { engineOptions: { locale } } : {}) }
  );
  return result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences;
}

test(`${RULE_ID}: a scope close to col or row names the value meant`, () => {
  const [col] = messagesOf(
    '<table><tr><th scope="column">A</th><th scope="col">B</th></tr><tr><td>1</td><td>2</td></tr></table>'
  );
  assert.equal(col.data.details.reasonCode, 'otherScope');
  assert.equal(col.i18n.hintKey, 'thScopeRowCol_hint_fail_otherScope_col');
  assert.match(col.hint, /^Did you mean scope="col"\?/);
  const [group] = messagesOf(
    '<table><tr><th scope="colgroup">A</th></tr><tr><td>1</td></tr></table>'
  );
  assert.equal(group.i18n.hintKey, 'thScopeRowCol_hint_fail_otherScope');
});
