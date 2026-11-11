'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-figure-caption-structure';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const figure = (attrs, image = '<img src="a.png" alt="Chart">', caption = 'Sales in 2025') =>
  `<figure ${attrs}>${image}<figcaption>${caption}</figcaption></figure>`;

test(`${RULE_ID}: role="figure" or "group" with an aria-label matching the caption passes`, () => {
  for (const role of ['figure', 'group', 'FIGURE']) {
    const html = page(figure(`role="${role}" aria-label="Sales in 2025"`));
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: whitespace in the label or caption does not count as a difference`, () => {
  const html = page(
    figure('role="figure" aria-label=" Sales  in 2025"', undefined, '\n Sales in\n 2025 ')
  );
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass');
});

test(`${RULE_ID}: a figure without a captioned image is not applicable`, () => {
  const cases = [
    '<figure><img src="a.png" alt="Chart"></figure>',
    '<figure><pre>code</pre><figcaption>Code</figcaption></figure>',
    '<figure><img src="a.png" alt="Chart"><figcaption> </figcaption></figure>',
    // The image belongs to the inner figure, which has no caption.
    '<figure><figure><img src="a.png" alt="Chart"></figure><figcaption>Outer</figcaption></figure>'
  ];
  for (const body of cases)
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: each missing piece has its own reason and summary`, () => {
  const cases = [
    [
      '',
      'missingRole',
      ['missingRole', 'missingAriaLabel'],
      'figureCaptionStructure_summary_fail_role'
    ],
    [
      'role="figure"',
      'missingAriaLabel',
      ['missingAriaLabel'],
      'figureCaptionStructure_summary_fail_label'
    ],
    [
      'role="figure" aria-label="Chart"',
      'ariaLabelMismatch',
      ['ariaLabelMismatch'],
      'figureCaptionStructure_summary_fail_mismatch'
    ],
    [
      'role="region" aria-label="Sales in 2025"',
      'missingRole',
      ['missingRole'],
      'figureCaptionStructure_summary_fail_role'
    ]
  ];
  for (const [attrs, reasonCode, reasons, summaryKey] of cases) {
    const rule = assertRule(runa11yCoreOnHtml(page(figure(attrs)), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, reasonCode, attrs);
    assert.deepEqual(occ.data.details.reasons, reasons, attrs);
    assert.equal(occ.data.details.caption, 'Sales in 2025');
    assert.equal(occ.i18n.summaryKey, summaryKey, attrs);
    assert.equal(
      occ.i18n.hintKey,
      reasonCode === 'ariaLabelMismatch'
        ? 'figureCaptionStructure_hint_fail_mismatch'
        : 'figureCaptionStructure_hint_fail'
    );
  }
});

test(`${RULE_ID}: image buttons and role="img" count as images`, () => {
  for (const image of [
    '<input type="image" src="a.png" alt="Go">',
    '<span role="img" aria-label="Star">*</span>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(figure('', image)), RUN), RULE_ID, 'fail');
  }
});

// RGAA 1.9.2 to 1.9.5 ask the same of an object image, an embedded image, an
// SVG and a canvas as 1.9.1 does of an <img>.
test(`${RULE_ID}: every kind of image 1.9 names counts, and records its kind`, () => {
  for (const [image, kind] of [
    ['<img src="a.png" alt="Chart">', 'img'],
    ['<input type="image" src="a.png" alt="Go">', 'img'],
    ['<span role="img" aria-label="Star">*</span>', 'img'],
    ['<object type="image/svg+xml" data="a.svg"></object>', 'object'],
    ['<object type="IMAGE/PNG" data="a.png"></object>', 'object'],
    ['<embed type="image/png" src="a.png">', 'embed'],
    ['<embed src="a.svg">', 'embed'],
    ['<svg width="20" height="20"><circle r="5"></circle></svg>', 'svg'],
    ['<svg role="img" aria-label="Logo"><g role="img"></g></svg>', 'svg'],
    ['<canvas role="img" aria-label="Chart"></canvas>', 'canvas']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(figure('', image)), RUN), RULE_ID, 'fail', {
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.imageKind, kind, image);
  }
});

test(`${RULE_ID}: an object or embed of another type is not an image`, () => {
  for (const image of [
    '<object type="text/html" data="a.html"></object>',
    '<object data="a.png"></object>',
    '<embed type="video/mp4" src="a.mp4">',
    '<embed type="application/pdf" src="a.pdf">'
  ]) {
    assertRule(runa11yCoreOnHtml(page(figure('', image)), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: a figure's first image decides its kind`, () => {
  const html = page(figure('', '<canvas></canvas><img src="a.png" alt="Chart">'));
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', { maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.imageKind, 'canvas');
});

test(`${RULE_ID}: each finding counts toward the 1.9 test of its image`, () => {
  const RGAA = { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } };
  for (const [image, test] of [
    ['<img src="a.png" alt="Chart">', '1.9.1'],
    ['<object type="image/png" data="a.png"></object>', '1.9.2'],
    ['<embed type="image/png" src="a.png">', '1.9.3'],
    ['<svg width="20" height="20"></svg>', '1.9.4'],
    ['<canvas></canvas>', '1.9.5']
  ]) {
    const result = runa11yCoreOnHtml(page(figure('', image)), RGAA);
    const rollup = result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-1.9');
    assert.equal(rollup.outcome, 'fail', image);
    const failing = rollup.data.details.contributors.find((c) => c.testId === RULE_ID);
    assert.deepEqual(
      failing.requirements.map((r) => r.requirement || r),
      [test],
      image
    );
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(figure('')));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/rgaa-figure-caption-structure-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'rgaa-figure-caption-structure-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.data.details.imageKind
  ]);
  assert.deepEqual(got, [
    ['fcs_case_01', 'img'],
    ['fcs_case_02', 'img'],
    ['fcs_case_03', 'img'],
    ['fcs_case_04', 'svg'],
    ['fcs_case_09', 'object'],
    ['fcs_case_10', 'embed'],
    ['fcs_case_11', 'canvas']
  ]);
});

// A caption or an image hidden with CSS or the hidden attribute is none to a
// user (glossary « Contenu caché »).
test(`${RULE_ID}: a hidden caption or a hidden image is left out`, () => {
  for (const body of [
    '<figure><img src="a.png" alt="G"><figcaption style="display:none">Légende</figcaption></figure>',
    '<figure><img src="a.png" alt="G"><figcaption hidden>Légende</figcaption></figure>',
    '<figure><img src="a.png" alt="G" hidden><figcaption>Légende</figcaption></figure>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

// A mismatch shows both texts, so a near difference (a final period, a
// capital) can be seen.
test(`${RULE_ID}: a mismatch names the aria-label and the caption`, () => {
  const html = page(
    figure('role="figure" aria-label="Sales in 2025"', undefined, 'Sales in 2025.')
  );
  const occ = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail').occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'ariaLabelMismatch');
  assert.deepEqual(occ.i18n.params, { label: 'Sales in 2025', caption: 'Sales in 2025.' });
  assert.equal(
    occ.summary,
    'This figure\'s aria-label, "Sales in 2025", differs from its caption, "Sales in 2025.".'
  );
  assert.equal(occ.i18n.hintKey, 'figureCaptionStructure_hint_fail_mismatch');
  assert.equal(
    occ.hint,
    'Give the aria-label the caption\'s text, exactly: aria-label="Sales in 2025.".'
  );
  const fr = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  ).occurrences[0];
  assert.equal(
    fr.summary,
    'L’aria-label de cette figure, « Sales in 2025 », diffère de sa légende, « Sales in 2025. ».'
  );
});
