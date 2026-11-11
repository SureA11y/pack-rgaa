'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-frame-title-relevant';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: a frame with a title is asked about, quoting the title`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<iframe src="map.html" title="  Map of\n the city  "></iframe>'), RUN),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.equal(occ.summary, 'This <iframe> has the title "Map of the city".');
  assert.deepEqual(occ.i18n.params, { element: 'iframe', title: 'Map of the city' });
  assert.equal(occ.i18n.summaryKey, 'frameTitleRelevant_summary_cantTell');
  assert.equal(occ.uncertainty.code, 'judgement-required');
  assert.equal(occ.data.details.src, 'map.html');
});

test(`${RULE_ID}: frames with no title, a blank one or aria-hidden are left out`, () => {
  for (const body of [
    '<iframe src="a.html"></iframe>',
    '<iframe src="a.html" title=""></iframe>',
    '<iframe src="a.html" title=" \t"></iframe>',
    '<iframe src="a.html" title="Tracking" aria-hidden="true"></iframe>',
    '<div aria-hidden="true"><iframe src="a.html" title="Tracking"></iframe></div>',
    '<p>No frame</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

// 2.2 applies to frames that have a title: an empty one fails 2.1 alone.
test(`${RULE_ID}: under the RGAA profile, a titled frame is asked about under 2.2`, () => {
  const opts = { engineOptions: { profile: 'rgaa-4.1.2' } };
  const titled = runa11yCoreOnHtml(page('<iframe src="a.html" title="Carte"></iframe>'), opts);
  assert.equal(rollup(titled, 'rgaa-4.1.2-2.1').outcome, 'pass');
  assert.equal(rollup(titled, 'rgaa-4.1.2-2.2').outcome, 'cantTell');

  const empty = runa11yCoreOnHtml(page('<iframe src="a.html" title=""></iframe>'), opts);
  assert.equal(rollup(empty, 'rgaa-4.1.2-2.1').outcome, 'fail');
  const relevance = rollup(empty, 'rgaa-4.1.2-2.2');
  assert.equal(relevance.data.details.reasonCode, 'composite.rollup.cantTell.partialCoverage');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const byId = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(byId, ['ftr_case_01', 'ftr_case_02']);
});

test(`${RULE_ID}: a long title is quoted cut to 80 characters`, () => {
  const long = 'Carte '.repeat(2000).trim();
  const rule = assertRule(
    runa11yCoreOnHtml(page(`<iframe src="map.html" title="${long}"></iframe>`), RUN),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  const quoted = `${long.slice(0, 77)}...`;
  assert.equal(occ.i18n.params.title, quoted);
  assert.equal(occ.data.details.title, quoted);
  assert.equal(occ.summary, `This <iframe> has the title "${quoted}".`);
});

// The occurrences a body gives, in English or in the locale asked.
function messagesOf(body, locale) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { ...RUN, ...(locale ? { engineOptions: { locale } } : {}) }
  );
  return result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences;
}

test(`${RULE_ID}: the host the frame comes from is named`, () => {
  const [occ] = messagesOf('<iframe src="https://maps.example.com/embed" title="iframe"></iframe>');
  assert.equal(occ.i18n.summaryKey, 'frameTitleRelevant_summary_cantTell_host');
  assert.equal(occ.summary, 'This <iframe> from maps.example.com has the title "iframe".');
});
