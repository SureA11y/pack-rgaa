'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-tooltip-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 10.13: content shown on hover or focus can be dismissed, hovered, and
// stays visible; how a script handles it is for a person to test.
test(`${RULE_ID}: a role="tooltip" is asked about on the element that references it`, () => {
  const body =
    '<button type="button" id="b" aria-describedby="tip">Partager</button><div role="tooltip" id="tip" hidden>Partager cette page</div>';
  const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.match(occ.html, /^<button id="b"|^<button type="button" id="b"/);
  assert.equal(occ.data.details.reasonCode, 'tooltipRole');
  assert.equal(occ.uncertainty.code, 'judgement-required');
  assert.equal(occ.summary, 'This element shows a tooltip (role="tooltip") on hover or focus.');
});

test(`${RULE_ID}: an unreferenced role="tooltip" is asked about on itself, hidden or not`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<span role="tooltip" id="t" style="display:none">Aide</span>'), RUN),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.match(rule.occurrences[0].html, /id="t"/);
});

test(`${RULE_ID}: tooltip library attributes are asked about`, () => {
  for (const [body, attribute] of [
    ['<a href="/a" data-tooltip="Aide">Aide</a>', 'data-tooltip'],
    ['<button type="button" data-tippy-content="Copier">Copier</button>', 'data-tippy-content'],
    ['<span tabindex="0" data-balloon="Info">i</span>', 'data-balloon'],
    [
      '<a href="/a" data-bs-toggle="tooltip" data-bs-title="Aide">Aide</a>',
      'data-bs-toggle="tooltip"'
    ],
    ['<a href="/a" data-toggle="tooltip" title="Aide">Aide</a>', 'data-toggle="tooltip"'],
    [
      '<button type="button" data-bs-toggle="popover" data-bs-trigger="hover focus">Info</button>',
      'data-bs-toggle="popover"'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(
      rule.occurrences[0].data.details,
      { reasonCode: 'tooltipAttribute', attribute },
      body
    );
  }
});

test(`${RULE_ID}: a title, a click popover, other toggles, hidden triggers and templates are not applicable`, () => {
  for (const body of [
    '<a href="/contact" title="Nous écrire">Contact</a>',
    '<button type="button" data-bs-toggle="popover" data-bs-content="x">Info</button>',
    '<button type="button" data-bs-toggle="collapse" data-bs-target="#m">Menu</button>',
    '<a href="/a" data-tooltip="Aide" style="display:none">Aide</a>',
    '<template><div role="tooltip">x</div></template>',
    '<button type="button" aria-describedby="tip" hidden>x</button><div role="tooltip" id="tip">y</div>',
    '<p>Rien</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: messages follow the scan locale; the map links it to 10.13.1-10.13.3`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<a href="/a" data-tooltip="Aide">Aide</a>'), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cet élément affiche une infobulle ou un popover (data-tooltip) au survol ou à la prise de focus.'
  );
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['10.13.1', '10.13.2', '10.13.3']);
});

test(`${RULE_ID}: opt-in, and RGAA 10.13 asks under the profile`, () => {
  const html = page('<a href="/a" data-tooltip="Aide">Aide</a>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
  }
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } });
  assert.equal(
    result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-10.13').outcome,
    'cantTell'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['ttr_case_01', 'ttr_case_02']);
});
