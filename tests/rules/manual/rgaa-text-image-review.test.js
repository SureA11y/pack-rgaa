'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-text-image-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 1.8.1 and 1.8.2: an informative image of text is replaced by styled
// text where possible; whether it holds text is for a person.
test(`${RULE_ID}: image buttons, images in headings and text-named images are asked about`, () => {
  for (const [body, kind] of [
    [`<form><input type="image" src="${IMG}" alt="Rechercher"></form>`, 'imageButton'],
    [`<h2><img src="${IMG}" alt="Nos engagements"></h2>`, 'imageInHeading'],
    [`<div role="heading" aria-level="2"><img src="${IMG}" alt="Agenda"></div>`, 'imageInHeading'],
    ['<img src="/img/bandeau-soldes.png" alt="Soldes d\'été">', 'textImageName'],
    ['<img src="/img/btn_envoyer.gif" alt="Envoyer">', 'textImageName'],
    [`<img src="${IMG}" class="hero-title" alt="Bienvenue">`, 'textImageName']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, kind, body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: photos, logos, decorative and hidden images are not applicable`, () => {
  for (const body of [
    '<img src="/img/photo-mairie.jpg" alt="La mairie vue depuis la place">',
    '<img src="/img/context-map.png" alt="Plan">',
    `<h1><a href="/"><img src="${IMG}" class="site-logo" alt="Mairie de Lyon"></a></h1>`,
    `<h1><img src="/img/logo.svg" alt="Mairie"></h1>`,
    `<h2><img src="${IMG}" alt="Logo de la Région"></h2>`,
    `<h2><img src="${IMG}" alt=""> Actualités</h2>`,
    `<h2 aria-hidden="true"><img src="${IMG}" alt="Agenda"></h2>`,
    `<h2><img src="${IMG}" alt="Agenda" style="display:none"></h2>`,
    `<form><input type="submit" value="Rechercher"></form>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: messages follow the scan locale; the map links it to 1.8.1 and 1.8.2`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(`<h2><img src="${IMG}" alt="Agenda"></h2>`), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette image fait partie d’un titre et est peut-être une image texte (« Agenda »).'
  );
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['1.8.1', '1.8.2']);
});

test(`${RULE_ID}: opt-in, and RGAA 1.8 asks under the profile`, () => {
  const html = page(`<h2><img src="${IMG}" alt="Agenda"></h2>`);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
  }
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } });
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-1.8').outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['tir_case_01', 'tir_case_02']);
});
