'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-svg-decorative-aria-hidden';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const reasons = (rule) =>
  rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
const RECT = '<rect width="16" height="16"/>';

// 1.2.4 condition 1 accepts only aria-hidden="true" for a decorative SVG,
// unlike 1.2.1 for <img>, which accepts role="presentation".
test(`${RULE_ID}: role="presentation" or "none" without aria-hidden fails`, () => {
  for (const role of ['presentation', 'none']) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(`<p>Contact <svg role="${role}">${RECT}</svg></p>`), RUN),
      RULE_ID,
      'fail',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.deepEqual(reasons(rule), [['fail', 'presentationWithoutAriaHidden']]);
    assert.deepEqual(rule.occurrences[0].i18n.params, { role });
  }
});

test(`${RULE_ID}: an exposed SVG that may be decorative is asked about`, () => {
  for (const body of [
    `<button type="button"><svg><title>loupe</title>${RECT}</svg> Rechercher</button>`,
    `<svg width="40" height="40">${RECT}</svg>`,
    `<a href="/r">Rapport <svg aria-label="PDF">${RECT}</svg></a>`
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['cantTell', 'exposedMayBeDecorative']], body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: hidden, informative, captioned, role="img" and sprite SVGs are left out`, () => {
  for (const body of [
    `<svg aria-hidden="true">${RECT}</svg>`,
    `<div aria-hidden="true"><svg>${RECT}</svg></div>`,
    `<a href="/"><svg aria-label="Accueil">${RECT}</svg></a>`,
    `<svg tabindex="0" aria-label="Plan">${RECT}</svg>`,
    `<svg role="img" aria-label="Plan">${RECT}</svg>`,
    `<svg role="graphics-document" aria-label="Plan">${RECT}</svg>`,
    `<figure><svg>${RECT}</svg><figcaption>Plan</figcaption></figure>`,
    `<svg style="position:absolute;width:0;height:0"><symbol id="i">${RECT}</symbol></svg>`,
    `<svg hidden>${RECT}</svg>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  assert.deepEqual(
    rule.occurrences.map((o) => [(o.html.match(/id="([^"]+)"/) || [])[1], o.occurrenceOutcome]),
    [
      ['sda_case_01', 'fail'],
      ['sda_case_02', 'cantTell'],
      ['sda_case_03', 'cantTell']
    ]
  );
});
