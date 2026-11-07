'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-svg-role-img';
const WCAG_RULE = 'svg-text-alternative-present';
const RGAA_ROLLUP = 'rgaa-4.1.2-1.1';
const WCAG_ROLLUP = 'wcag-1.1.1-non-text-content';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const run = (body) => runa11yCoreOnHtml(page(body), RUN);

test(`${RULE_ID}: role="img" with aria-label or aria-labelledby passes`, () => {
  for (const body of [
    '<svg role="img" aria-label="Logo"></svg>',
    '<svg role="img" aria-labelledby="t"><title id="t">Logo</title></svg>',
    '<svg role="img" aria-label="Logo"><title>Logo</title></svg>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// An alternative does not prove the image carries information: an SVG that
// is not a control's only content, nor focusable, may be decorative, and
// then fails 1.2.4 instead (1.1.5 methodology: « déterminer si l'image est
// porteuse d'information »).
test(`${RULE_ID}: an alternative without role="img" is asked about and names the alternatives`, () => {
  const cases = [
    ['<svg><title>Logo</title><circle r="4"/></svg>', ['<title>']],
    ['<svg aria-label="Logo"></svg>', ['aria-label']],
    ['<p id="l">Logo</p><svg aria-labelledby="l"></svg>', ['aria-labelledby']],
    [
      '<svg role="graphics-document" aria-label="Plan"><title>Plan</title></svg>',
      ['aria-label', '<title>']
    ],
    ['<svg role="presentation" aria-label="Logo"></svg>', ['aria-label']]
  ];
  for (const [body, alternatives] of cases) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'missingRoleMayBeDecorative', body);
    assert.deepEqual(occ.data.details.alternatives, alternatives, body);
    assert.deepEqual(occ.i18n.params, { alternatives: alternatives.join(', ') });
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

// RGAA 4.1.2 added the content of <title> to 1.1.5 step 5's sources.
test(`${RULE_ID}: role="img" named only by <title> passes`, () => {
  assertRule(run('<svg role="img"><title>Logo</title></svg>'), RULE_ID, 'pass');
});

// The only content of a link or a button, or an SVG that takes focus,
// carries information: without role="img" it fails 1.1.5.
test(`${RULE_ID}: an SVG that certainly carries information fails without role="img"`, () => {
  for (const body of [
    '<figure><svg><title>Plan</title><circle r="4"/></svg><figcaption>Plan du site</figcaption></figure>',
    '<svg tabindex="0" aria-label="Plan"></svg>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'missingRoleImg', body);
  }
  // A control's only image is judged as the control's label (glossary
  // « Image porteuse d'information », notes 1 and 2), outside theme 1.
  for (const body of [
    '<a href="/"><svg><title>Accueil</title><circle r="4"/></svg></a>',
    '<button type="button"><svg aria-label="Fermer"></svg></button>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable');
  }
  // Beside the control's own text, the icon may be decorative.
  const icon = assertRule(
    run('<button type="button"><svg><title>loupe</title></svg> Rechercher</button>'),
    RULE_ID,
    'cantTell'
  );
  assert.equal(icon.occurrences[0].data.details.reasonCode, 'missingRoleMayBeDecorative');
});

test(`${RULE_ID}: hidden, unnamed, nested and desc-only SVGs are not applicable`, () => {
  for (const body of [
    '<svg aria-hidden="true"><title>x</title></svg>',
    '<div aria-hidden="true"><svg aria-label="x"></svg></div>',
    '<div hidden><svg aria-label="x"></svg></div>',
    '<svg role="img"></svg>',
    '<svg><desc>Une étoile</desc></svg>',
    '<svg title="Logo"></svg>',
    '<svg role="img" aria-labelledby="missing"></svg>',
    '<p>No SVG</p>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable');
  }
  // Only the outer <svg> is judged.
  const nested = assertRule(
    run('<svg role="img" aria-label="Carte"><svg aria-label="Région"></svg></svg>'),
    RULE_ID,
    'pass'
  );
  assert.equal(nested.occurrences.length, 0);
});

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  const html = page('<svg aria-label="Logo"></svg>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
  const byTag = runa11yCoreOnHtml(html, { engineOptions: { tags: { include: 'rgaa' } } });
  assert.ok(byTag.checksResults.some((r) => r.ruleId === RULE_ID));
});

function verdicts(body) {
  const html = page(body);
  const rgaa = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } });
  const wcag = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  const rollup = (r, id) => rollupOutcome(r.rulesResults.find((x) => x.ruleId === id));
  const check = (r, id) => (r.checksResults.find((x) => x.ruleId === id) || {}).outcome;
  assert.equal(rollup(rgaa, WCAG_ROLLUP), rollup(wcag, WCAG_ROLLUP), body);
  assert.equal(check(rgaa, WCAG_RULE), check(wcag, WCAG_RULE), body);
  return {
    rule: check(rgaa, RULE_ID),
    rgaa: rollup(rgaa, RGAA_ROLLUP),
    wcagRule: check(wcag, WCAG_RULE)
  };
}

test(`${RULE_ID}: RGAA profile, a named SVG without role="img": WCAG passes it, RGAA 1.1 asks or fails`, () => {
  for (const body of [
    '<svg><title>Logo</title><circle r="4"/></svg>',
    '<svg aria-label="Logo"></svg>'
  ]) {
    assert.deepEqual(
      verdicts(body),
      { rule: 'cantTell', rgaa: 'cantTell', wcagRule: 'pass' },
      body
    );
  }
  assert.deepEqual(verdicts('<svg tabindex="0" aria-label="Accueil"></svg>'), {
    rule: 'fail',
    rgaa: 'fail',
    wcagRule: 'pass'
  });
});

test(`${RULE_ID}: RGAA profile, role="img" named only by <title>: neither WCAG nor RGAA 1.1 fails it`, () => {
  assert.deepEqual(verdicts('<svg role="img"><title>Logo</title></svg>'), {
    rule: 'pass',
    rgaa: 'passedInPart',
    wcagRule: 'pass'
  });
});

test(`${RULE_ID}: RGAA profile, the two standards agree on aria-label with role="img" and on no name`, () => {
  assert.deepEqual(verdicts('<svg role="img" aria-label="Logo"></svg>'), {
    rule: 'pass',
    rgaa: 'passedInPart',
    wcagRule: 'pass'
  });
  // An unnamed <svg role="img"> stays with svg-text-alternative-present, which keeps 1.1.5.
  assert.deepEqual(verdicts('<svg role="img" width="10" height="10"></svg>'), {
    rule: 'notApplicable',
    rgaa: 'fail',
    wcagRule: 'fail'
  });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/rgaa-svg-role-img-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  assert.deepEqual(
    rule.occurrences.map((o) => [(o.html.match(/id="([^"]+)"/) || [])[1], o.occurrenceOutcome]),
    [
      ['sri_case_10', 'fail'],
      ['sri_case_01', 'cantTell'],
      ['sri_case_02', 'cantTell'],
      ['sri_case_03', 'cantTell']
    ]
  );
});
