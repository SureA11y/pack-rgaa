'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-color-reference-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, lang = 'fr') {
  return `<!doctype html><html lang="${lang}"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 3.1.2: « Pour chaque indication de couleur donnée par un texte,
// l’information ne doit pas être donnée uniquement par la couleur ».
test(`${RULE_ID}: text that indicates something by a colour is asked about`, () => {
  for (const [body, sample] of [
    ['<p>Les champs indiqués en rouge sont obligatoires.</p>', 'indiqués en rouge'],
    ['<p>Les éléments en vert sont disponibles.</p>', 'éléments en vert'],
    ['<p>Cochez les cases vertes.</p>', 'cases vertes'],
    ['<p>Errors are <em>shown in red</em>.</p>', 'shown in red'],
    ['<p>The green items are in stock.</p>', 'green items'],
    ['<p>Los campos en rojo son obligatorios.</p>', 'campos en rojo'],
    ['<p>Pflichtfelder sind rot markiert.</p>', 'rot markiert']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.deepEqual(occ.data.details, { reasonCode: 'colorReference', sample }, body);
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: a colour that indicates nothing, code, form controls and hidden text are not applicable`, () => {
  for (const body of [
    '<p>T-shirt rouge en coton bio.</p>',
    '<p>Le Petit Chaperon rouge.</p>',
    '<p>Red Cross volunteers.</p>',
    '<p>Une mission en entreprise.</p>',
    '<code>color: red; /* items in red */</code>',
    '<select><option>Articles en rouge</option></select>',
    '<button type="button">Champs en rouge</button>',
    '<p aria-hidden="true">Les champs indiqués en rouge</p>',
    '<p style="display:none">Les champs indiqués en rouge</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: one occurrence per element; messages follow the scan locale`, () => {
  const html = page('<p>Les champs indiqués en rouge et les cases vertes.</p>');
  const rule = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Ce texte renvoie à une couleur (« indiqués en rouge ») ; vérifiez que l’information n’est pas donnée uniquement par la couleur.'
  );
});

test(`${RULE_ID}: the map links it to 3.1.2; opt-in`, () => {
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['3.1.2']);
  const html = page('<p>Les champs indiqués en rouge sont obligatoires.</p>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
  }
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } });
  const rollup = result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-3.1');
  assert.equal(rollup.outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['crr_case_01', 'crr_case_02']);
});
