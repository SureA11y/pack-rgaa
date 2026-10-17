'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-img-alt-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: an image with no text alternative fails`, () => {
  for (const body of [
    '<img src="photo.jpg">',
    '<img src="photo.jpg" width="300" height="200" role="presentation" tabindex="0">',
    // The only content of a link carries its information, spacer or not.
    '<a href="/home"><img src="pixel.gif" width="1" height="1"></a>',
    // 1.2 does not apply to a captioned image, so 1.1.1 does.
    '<figure><img src="pixel.gif" width="1" height="1"><figcaption>Gap</figcaption></figure>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'missingAlt', body);
    assert.equal(occ.i18n.summaryKey, 'imgAltPresent_summary_fail');
  }
});

test(`${RULE_ID}: an image with a text alternative passes`, () => {
  for (const body of [
    '<img src="logo.png" alt="Example">',
    '<img src="swirl.png" alt="">',
    '<img src="map.png" aria-label="Map">',
    '<span id="c">Map</span><img src="map.png" aria-labelledby="c">',
    '<img src="logo.png" title="Example">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a spacer, a hidden image and a presentational one are left out`, () => {
  for (const body of [
    '<img src="pixel.gif" width="1" height="1">',
    '<img src="rule.gif" width="600" height="2">',
    '<img src="swirl.png" aria-hidden="true">',
    '<img src="swirl.png" role="presentation">',
    '<img src="swirl.png" hidden>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

// RGAA files a decorative image under 1.2 and an informative one under 1.1:
// a spacer with no alt fails 1.2 alone, where img-alt-present, the WCAG
// rule, would fail it under 1.1 too.
test(`${RULE_ID}: a spacer with no alt fails 1.2 and not 1.1`, () => {
  const result = runa11yCoreOnHtml(page('<img src="pixel.gif" width="1" height="1">'), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  const images = rollup(result, 'rgaa-4.1.2-1.1');
  assert.ok(!images || images.outcome !== 'fail', images && images.outcome);
  assert.equal(rollup(result, 'rgaa-4.1.2-1.2').outcome, 'fail');

  const photo = runa11yCoreOnHtml(page('<img src="photo.jpg" width="300" height="200">'), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  assert.equal(rollup(photo, 'rgaa-4.1.2-1.1').outcome, 'fail');
  assert.equal(rollup(photo, 'rgaa-4.1.2-1.2').outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  const byId = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(byId, ['iap_case_01', 'iap_case_02', 'iap_case_03']);
});

test(`${RULE_ID}: an alt of only spaces fails with its own message, and a spacer with one is left to 1.2`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<img src="chart.png" alt=" " width="300" height="200">'), RUN),
    RULE_ID,
    'fail'
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'blankAlt');
  assert.equal(rule.occurrences[0].i18n.summaryKey, 'imgAltPresent_summary_blank');
  const result = runa11yCoreOnHtml(page('<img src="pixel.gif" alt=" " width="1" height="1">'), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  const images = rollup(result, 'rgaa-4.1.2-1.1');
  assert.ok(!images || images.outcome !== 'fail', images && images.outcome);
  assert.equal(rollup(result, 'rgaa-4.1.2-1.2').outcome, 'fail');
});
