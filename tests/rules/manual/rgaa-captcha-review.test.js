'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-captcha-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 1.4: a CAPTCHA's alternative names its nature and function; 1.5: a
// non-graphic CAPTCHA or another way in exists. Both are for a person.
test(`${RULE_ID}: images marked as CAPTCHAs are asked about`, () => {
  for (const [body, element] of [
    [`<img src="${IMG}" alt="Image CAPTCHA">`, 'img'],
    ['<img src="/captcha.php?id=3" alt="Code de sécurité">', 'img'],
    [`<img src="${IMG}" class="securimage" alt="">`, 'img'],
    [
      `<form><input type="image" src="${IMG}" name="captcha_refresh" alt="Nouveau code"></form>`,
      'input'
    ],
    ['<canvas id="captcha-canvas" width="100" height="30"></canvas>', 'canvas']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const d = rule.occurrences[0].data.details;
    assert.deepEqual([d.reasonCode, d.element], ['imageCaptcha', element], body);
  }
});

test(`${RULE_ID}: reCAPTCHA and hCaptcha widgets are asked about once`, () => {
  for (const [body, service, attribute, match] of [
    [
      '<div class="g-recaptcha" data-sitekey="x"><iframe src="https://www.google.com/recaptcha/api2/anchor?k=x" title="reCAPTCHA"></iframe></div>',
      'reCAPTCHA',
      'class',
      'g-recaptcha'
    ],
    [
      '<iframe src="https://newassets.hcaptcha.com/captcha/v1/x" title="hCaptcha"></iframe>',
      'hCaptcha',
      'src',
      'hcaptcha.com/'
    ],
    ['<div class="h-captcha" data-sitekey="x"></div>', 'hCaptcha', 'class', 'h-captcha']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(
      rule.occurrences[0].data.details,
      { reasonCode: 'captchaWidget', service, attribute, match },
      body
    );
  }
});

test(`${RULE_ID}: ordinary and hidden images are not applicable`, () => {
  for (const body of [
    `<img src="${IMG}" alt="La mairie">`,
    `<img src="${IMG}" alt="Image CAPTCHA" style="display:none">`,
    '<p>Ce formulaire est protégé par un captcha.</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: messages follow the scan locale; the map links it to 1.4 and 1.5`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(`<img src="${IMG}" alt="Image CAPTCHA">`), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette image semble être un CAPTCHA : son attribut alt contient « Image CAPTCHA » (alternative : « Image CAPTCHA »).'
  );
  const tests = RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests;
  assert.ok(tests.includes('1.4.1') && tests.includes('1.5.1'));
  const result = runa11yCoreOnHtml(page(`<img src="${IMG}" alt="Image CAPTCHA">`), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  for (const c of ['1.4', '1.5']) {
    assert.equal(
      result.rulesResults.find((r) => r.ruleId === `rgaa-4.1.2-${c}`).outcome,
      'cantTell',
      c
    );
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  // Widgets are read first, then images.
  assert.deepEqual(ids, ['cpr_case_02', 'cpr_case_01']);
});

// The occurrences a body gives, in English or in the locale asked.
function messagesOf(body, locale) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { ...RUN, ...(locale ? { engineOptions: { locale } } : {}) }
  );
  return result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences;
}

test(`${RULE_ID}: the attribute that matched is named`, () => {
  const occs = messagesOf(
    '<div class="g-recaptcha" data-sitekey="x"></div><img src="a.png" alt="Captcha image">'
  );
  assert.equal(occs[0].i18n.summaryKey, 'captchaReview_summary_cantTell_captchaWidget_matched');
  assert.equal(occs[0].summary, 'This is a reCAPTCHA CAPTCHA: its class has "g-recaptcha".');
  assert.equal(occs[1].i18n.summaryKey, 'captchaReview_summary_cantTell_imageCaptcha_matched');
  assert.equal(
    occs[1].summary,
    'This image looks like a CAPTCHA: its alt has "Captcha image" (alternative: "Captcha image").'
  );
});
