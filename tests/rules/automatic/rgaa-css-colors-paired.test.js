'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-css-colors-paired';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(css, body = '<p>Texte</p>') {
  return `<!doctype html><html lang="fr"><head><title>t</title><style>${css}</style></head><body>${body}</body></html>`;
}
const run = (css, body, opts = RUN) => runa11yCoreOnHtml(page(css, body), opts);
const found = (rule) =>
  rule.occurrences.map((o) => [o.data.details.element, o.data.details.reasonCode]);

test(`${RULE_ID}: a text color with no background anywhere fails 10.5.1`, () => {
  for (const [css, body, element] of [
    ['p{color:#555}', undefined, 'p'],
    ['', '<p style="color:#555">Texte</p>', 'p'],
    ['body{color:white}', undefined, 'body'], // F24 example 2
    ['a:link{color:red} a:visited{color:maroon}', '<p><a href="/x">Lien</a></p>', 'a'] // F24 example 3
  ]) {
    const rule = assertRule(run(css, body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(found(rule), [[element, 'COLOR_WITHOUT_BACKGROUND']], css || body);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'cssColorsPaired_summary_fail_colorWithoutBackground'
    );
  }
});

test(`${RULE_ID}: a background color with no text color anywhere fails 10.5.2`, () => {
  const rule = assertRule(run('body{background-color:white}'), RULE_ID, 'fail'); // F24 example 1
  assert.deepEqual(found(rule), [['body', 'BACKGROUND_WITHOUT_COLOR']]);
  const td = assertRule(
    run('', '<table><tr><td bgcolor="#eee">Texte</td></tr></table>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(found(td), [['td', 'BACKGROUND_WITHOUT_COLOR']]);
});

test(`${RULE_ID}: a background image with no background color fails 10.5.3`, () => {
  const rule = assertRule(
    run('body{color:#000} .hero{background-image:url(h.png)}', '<div class="hero">Texte</div>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(found(rule), [
    ['body', 'COLOR_WITHOUT_BACKGROUND'],
    ['div', 'BACKGROUND_IMAGE_WITHOUT_COLOR']
  ]);
});

test(`${RULE_ID}: colors paired on the element or an ancestor pass`, () => {
  for (const [css, body] of [
    ['body{color:#222;background:#fff} p{color:#555}', undefined],
    [
      'body{color:#222;background-color:#fff} .box{background:#eee}',
      '<div class="box">Texte</div>'
    ],
    ['html{background:#fff} body{color:#000}', undefined],
    ['body{color:#000;background:#fff url(bg.png)}', undefined],
    [':root{--bg:#fff} body{color:#000;background:var(--bg)}', undefined]
  ]) {
    assertRule(run(css, body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: browser defaults and keywords that declare no color are not declarations`, () => {
  for (const [css, body] of [
    ['', '<p><a href="/x">Lien</a> et <button>Bouton</button></p>'],
    ['*{color:inherit;background-color:transparent}', undefined],
    ['p{color:currentColor}', undefined]
  ]) {
    assertRule(run(css, body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: hidden text, print rules and text in a shadow root are not judged`, () => {
  assertRule(run('.x{color:#555}', '<p class="x" hidden>Texte</p>'), RULE_ID, 'notApplicable');
  assertRule(run('@media print{p{color:#000}}'), RULE_ID, 'notApplicable');
  assertRule(
    run('', '<link rel="stylesheet" media="print" href="data:text/css,p{color:red}"><p>Texte</p>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: one occurrence per element declaring the color, however much text it reaches`, () => {
  const rule = assertRule(
    run('.c{color:#555}', '<div class="c"><p>Un</p><p>Deux</p><p>Trois</p></div>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(found(rule), [['div', 'COLOR_WITHOUT_BACKGROUND']]);
});

test(`${RULE_ID}: opt-in, so a default run and a WCAG profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(page('p{color:#555}'), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: each finding counts toward its own 10.5 test, and no WCAG criterion`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['10.5.1', '10.5.2', '10.5.3']);
  const result = run('p{color:#555}', undefined, {
    engineOptions: { profile: 'rgaa-4.1.2-with-wcag' }
  });
  const check = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.equal(check.outcome, 'fail');
  assert.ok(
    check.rollupIds.every((id) => id.startsWith('rgaa-')),
    check.rollupIds.join()
  );
  const rollup = result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-10.5');
  assert.equal(rollup.outcome, 'fail');
  const c = rollup.data.details.contributors.find((x) => x.testId === RULE_ID);
  assert.deepEqual(
    c.requirements.map((r) => r.requirement || r),
    ['10.5.1']
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail');
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.data.details.reasonCode
  ]);
  assert.deepEqual(got, [
    ['ccp_case_01', 'COLOR_WITHOUT_BACKGROUND'],
    ['ccp_case_02', 'BACKGROUND_WITHOUT_COLOR'],
    ['ccp_case_03', 'BACKGROUND_IMAGE_WITHOUT_COLOR']
  ]);
});

test(`${RULE_ID}: screen-reader-only text is never drawn, so its colors are not judged`, () => {
  const SR =
    'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
  // bordeaux-metropole.fr: the cookie panel's visually hidden heading
  // declared a text color with no background anywhere.
  for (const [css, body] of [
    [
      `.sr{${SR};color:#555}`,
      '<div class="sr" role="heading" aria-level="2">Panneau</div><p>Texte</p>'
    ],
    [`.sr{${SR}} .sr span{color:#555}`, '<div class="sr"><span>Panneau</span></div><p>Texte</p>']
  ]) {
    assertRule(run(css, body), RULE_ID, 'notApplicable');
  }
  // The same color on shown text still fails.
  const rule = assertRule(
    run(`.sr{${SR};color:#555} p{color:#555}`, '<div class="sr">Panneau</div><p>Texte</p>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(found(rule), [['p', 'COLOR_WITHOUT_BACKGROUND']]);
});
