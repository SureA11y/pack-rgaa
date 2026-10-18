'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-markup-for-presentation';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const codes = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);

// 8.9.1 methodology: role="presentation" « peut toutefois se justifier …
// sur un élément <blockquote> ou un paragraphe vide, mais sera considéré
// comme non-conforme sur un titre »; its note names « des paragraphes
// vides ou encore des espaces utilisés pour créer des effets de marges ».
test(`${RULE_ID}: a presentational heading and a paragraph of spaces fail`, () => {
  for (const [body, code] of [
    ['<h2 role="presentation">Nos services</h2>', 'headingPresentation'],
    ['<h3 role="none">Nos services</h3>', 'headingPresentation'],
    ['<p>Texte</p><p>&nbsp;</p><p>Suite</p>', 'spacerParagraph'],
    ['<p><br></p>', 'spacerParagraph'],
    ['<p><strong>&nbsp;</strong></p>', 'spacerParagraph']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(codes(rule), [code], body);
  }
});

test(`${RULE_ID}: what may be legitimate is asked about`, () => {
  for (const [body, code] of [
    ['<p></p>', 'emptyParagraph'],
    ['<blockquote></blockquote>', 'emptyBlockquote'],
    ['<p role="status"></p>', 'placeholder'],
    ['<p aria-live="polite">&nbsp;</p>', 'placeholder'],
    ['<p>Première ligne<br><br>Deuxième ligne</p>', 'consecutiveBr'],
    ['<p>&nbsp;&nbsp;&nbsp;&nbsp;Texte en retrait</p>', 'spacesForMargin']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(codes(rule), [code], body);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: content, role="presentation" on a paragraph, addresses and code are not applicable`, () => {
  for (const body of [
    '<h2>Nos services</h2><p>Texte</p>',
    '<p role="presentation">&nbsp;</p>',
    '<blockquote><p>Une citation</p></blockquote>',
    '<blockquote><img src="a.png" alt="Citation"></blockquote>',
    '<p>Ligne 1<br>Ligne 2</p>',
    '<address>1 rue de la Paix<br><br>75002 Paris</address>',
    '<p>10&nbsp;000&nbsp;€</p>',
    // Runs between words are 10.1.3's matter.
    '<p>Nom&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Prix</p>',
    '<pre>&nbsp;&nbsp;&nbsp;&nbsp;code</pre>',
    '<p hidden>&nbsp;</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  const byId = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome
  ]);
  assert.deepEqual(byId, [
    ['mfp_case_01', 'fail'],
    ['mfp_case_02', 'fail'],
    ['mfp_case_03', 'cantTell']
  ]);
});
