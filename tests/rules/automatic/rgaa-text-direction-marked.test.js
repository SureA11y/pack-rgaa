'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-text-direction-marked';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, htmlAttrs = '') {
  return `<!doctype html><html lang="fr" ${htmlAttrs}><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const AR = 'مرحبا بكم في موقعنا';

// 8.10.1: « chaque texte dont le sens de lecture est différent du sens de
// lecture par défaut est contenu dans une balise possédant un attribut
// dir »; the glossary « Sens de lecture » makes left to right the default.
test(`${RULE_ID}: text in the other direction with no dir fails`, () => {
  for (const [body, attrs, tag, direction] of [
    [`<p>${AR}</p>`, '', 'p', 'rtl'],
    [
      `<p>${AR.split(' ')[0]} <strong>${AR.split(' ')[1]}</strong> ${AR.split(' ')[2]}</p>`,
      '',
      'p',
      'rtl'
    ],
    [`<p>On dit ${AR} pour accueillir.</p>`, '', 'p', 'rtl'],
    ['<p>Visit Google Maps today</p>', 'dir="rtl"', 'p', 'ltr']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body, attrs), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'directionNotMarked', body);
    assert.equal(occ.data.details.direction, direction);
    assert.ok(occ.html.startsWith(`<${tag}`), occ.html);
    assert.equal(occ.i18n.summaryKey, `textDirectionMarked_summary_fail_${direction}`);
  }
});

test(`${RULE_ID}: a text of one or two words, or a <bdi> with no dir, is asked about`, () => {
  for (const [body, attrs, code] of [
    ['<p>Le mot شكرا veut dire merci.</p>', '', 'shortRun'],
    // The letter of 8.10.1 covers it, but one or two words display the
    // same with or without dir.
    ['<ul><li><a href="/ar" lang="ar">العربية</a></li></ul>', '', 'shortText'],
    ['<p>مرحبا بكم</p>', '', 'shortText'],
    ['<p>مرحبا <span>Google</span></p>', 'dir="rtl"', 'shortText'],
    ['<p>Utilisateur <bdi>إيان</bdi> : 3 messages</p>', '', 'bdiWithoutDir']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body, attrs), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, code, body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: text in its context's direction, marked, under dir="auto" or in code is not applicable`, () => {
  for (const [body, attrs] of [
    ['<p>Bonjour tout le monde</p>', ''],
    [`<p dir="rtl" lang="ar">${AR}</p>`, ''],
    [`<p>${AR}</p>`, 'dir="rtl"'],
    [`<p dir="auto">${AR}</p>`, ''],
    [`<pre>${AR}</pre>`, ''],
    [`<p hidden>${AR}</p>`, '']
  ]) {
    assertRule(runa11yCoreOnHtml(page(body, attrs), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const byId = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome
  ]);
  assert.deepEqual(byId, [
    ['tdm_case_01', 'fail'],
    ['tdm_case_02', 'cantTell']
  ]);
});
