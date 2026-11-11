'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-moving-content-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 13.8.1: content that moves by itself lasts 5 seconds or less, or the user
// can stop it, hide it, or read it without the movement: a script may give
// that control, so each case is asked about.
test(`${RULE_ID}: content that moves by itself is asked about`, () => {
  for (const [body, code] of [
    ['<marquee>Promotion</marquee>', 'marquee'],
    ['<video autoplay muted loop src="fond.mp4"></video>', 'autoplayVideo'],
    [
      '<svg width="10" height="10"><circle r="5"><animate attributeName="r" values="1;5" dur="1s" repeatCount="indefinite"/></circle></svg>',
      'svgAnimation'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, code, body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: a video with controls, a still marquee, a finite SVG animation or none is not applicable`, () => {
  for (const body of [
    '<video autoplay controls src="a.mp4"></video>',
    '<video src="a.mp4"></video>',
    '<marquee scrollamount="0">Promotion</marquee>',
    '<svg width="10" height="10"><circle r="5"><animate attributeName="r" values="1;5" dur="1s" repeatCount="3"/></circle></svg>',
    '<marquee hidden>Promotion</marquee>',
    '<p>Texte</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['mcr_case_01', 'mcr_case_02']);
});

// The occurrences a body gives, in English or in the locale asked.
function messagesOf(body, locale) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { ...RUN, ...(locale ? { engineOptions: { locale } } : {}) }
  );
  return result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences;
}

test(`${RULE_ID}: an SVG animation names the attribute it changes`, () => {
  const [occ] = messagesOf(
    '<svg width="50" height="50"><circle r="5" cx="10" cy="10"><animate attributeName="r" values="5;10;5" dur="1s" repeatCount="indefinite"/></circle></svg>'
  );
  assert.equal(occ.i18n.summaryKey, 'movingContentReview_summary_svgAnimation_attribute');
  assert.equal(
    occ.summary,
    'This SVG animation repeats indefinitely: its <animate> changes the r attribute.'
  );
});
