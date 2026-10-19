'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-color-declarations-paired';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, css = '') {
  return `<!doctype html><html lang="fr"><head><title>t</title><style>${css}</style></head><body><main>${body}</main></body></html>`;
}
function codes(rule) {
  return rule.occurrences.map((o) => [
    o.data.details.reasonCode,
    (String(o.html || '').match(/id="([^"]+)"/) || [])[1] || null
  ]);
}

// 10.5.1: « chaque déclaration CSS de couleurs de police (color), d’un
// élément susceptible de contenir du texte, est-elle accompagnée d’une
// déclaration de couleur de fond (background, background-color), au moins,
// héritée d’un parent ? »
test(`${RULE_ID}: a text colour with no background colour fails 10.5.1`, () => {
  for (const [body, css] of [
    ['<p id="a" style="color:#333">Texte</p>', ''],
    ['<p id="a" class="t">Texte</p>', '.t { color: rgb(51, 51, 51) }'],
    // A background image on an ancestor is no background colour.
    [
      '<div style="background-image:url(fond.png)"><p id="a" style="color:#333;background-image:none">Texte</p></div>',
      ''
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body, css), RUN), RULE_ID, 'fail');
    assert.deepEqual(
      codes(rule).filter(([c]) => c === 'colorWithoutBackground'),
      [['colorWithoutBackground', 'a']],
      body
    );
    assert.equal(
      rule.occurrences.find((o) => o.data.details.reasonCode === 'colorWithoutBackground').data
        .details.color,
      'rgb(51, 51, 51)'
    );
  }
});

test(`${RULE_ID}: reported once, on the element that sets the colour`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(
      page(
        '<div id="a" style="color:#333"><p>Un</p><p>Deux <span>trois</span> <em>quatre</em></p></div>'
      ),
      RUN
    ),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(codes(rule), [['colorWithoutBackground', 'a']]);
});

// 10.5.3: « chaque utilisation d’une image pour créer une couleur de fond
// d’un élément susceptible de contenir du texte, via CSS (background,
// background-image), est-elle accompagnée d’une déclaration de couleur de
// fond (background, background-color), au moins, héritée d’un parent ? »
test(`${RULE_ID}: a background image over text with no background colour fails 10.5.3`, () => {
  for (const body of [
    '<div id="a" style="background-image:url(bandeau.jpg)">Bienvenue</div>',
    '<div id="a" style="background:linear-gradient(#def, #fff)"><p>Bienvenue</p></div>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(codes(rule), [['imageWithoutBackground', 'a']], body);
  }
});

// 10.5.2: « chaque déclaration de couleur de fond (background,
// background-color), d’un élément susceptible de contenir du texte,
// est-elle accompagnée d’une déclaration de couleur de police (color) au
// moins, héritée d’un parent ? »
test(`${RULE_ID}: a background colour over default black text is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<p id="a" style="background-color:#ffffdd">Un <b>deux</b></p>'), RUN),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(codes(rule), [['backgroundWithoutColor', 'a']]);
  assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  assert.equal(rule.occurrences[0].data.details.background, 'rgb(255, 255, 221)');
});

test(`${RULE_ID}: paired colours, browser colours, form controls and hidden text pass or are left out`, () => {
  for (const [body, css] of [
    ['<p>Texte</p>', ''],
    ['<p>Texte</p>', 'body { background: #fff; color: #333 }'],
    ['<p>Texte</p>', 'html { background-color: #fff } body { color: #333 }'],
    ['<div style="background:#fff"><p style="color:#333">Texte</p></div>', ''],
    ['<div style="background:url(a.png) #fff;color:#333">Texte</div>', ''],
    [
      '<div style="background-image:url(a.png)"><p style="background:#fff;color:#333">Texte</p></div>',
      ''
    ],
    ['<p style="color:#333;background:#fff">Texte</p>', ''],
    ['<p>Texte <a href="/x">lien</a> <mark>surligné</mark></p>', ''],
    [
      '<button type="button" style="color:#333">OK</button><input aria-label="x" value="v" style="color:#333">',
      ''
    ],
    ['<select aria-label="x" style="color:#333"><option>Un</option></select>', ''],
    ['<p style="color:#333" hidden>Texte</p>', ''],
    ['<p style="color:#333;display:none">Texte</p>', ''],
    ['<p style="color:#333" aria-hidden="true">Texte</p>', ''],
    ['<h1 style="color:#333;background:url(logo.png);text-indent:-9999px">Logo</h1>', ''],
    [
      '<span class="sr">Texte</span>',
      '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);color:#333}'
    ],
    ['<p style="color:#333">  </p><svg><text style="fill:red">S</text></svg>', ''],
    ['<p>Texte</p>', ':root { color-scheme: dark }'],
    ['<div style="background-image:url(deco.png)"></div>', '']
  ]) {
    assertRule(runa11yCoreOnHtml(page(body, css), RUN), RULE_ID, 'notApplicable', css + body);
  }
});

// Without a layout, the computed style is trusted only when the cascade is
// fully known: a false failure is worse than none.
test(`${RULE_ID}: without a layout, a cascade the DOM cannot compute is not applicable`, () => {
  for (const [body, css, head] of [
    ['<p class="t">Texte</p>', '@media screen { .t { color: #333 } }'],
    ['<p class="t">Texte</p>', '.t { color: #333 } @media screen { body { background: #fff } }'],
    ['<p class="t">Texte</p>', '@layer base { body { background: #fff } } .t { color: #333 }'],
    [
      '<p class="t">Texte</p>',
      '.t { color: #333 } @supports (display: grid) { body { background: #fff } }'
    ],
    ['<p class="t">Texte</p>', ':root { --c: #333 } .t { color: var(--c) }'],
    [
      '<p class="t">Texte</p>',
      ':root { --b: #fff } .t { color: #333; background-color: var(--b) }'
    ],
    ['<table bgcolor="#ffffff"><tr><td style="color:#333">Texte</td></tr></table>', ''],
    ['<p><font color="red">Texte</font></p>', 'body { background: #fff }'],
    [
      '<p style="color:#333">Texte</p>',
      '',
      '<link rel="stylesheet" href="https://example.com/site.css">'
    ]
  ]) {
    const html = page(body, css).replace('</head>', `${head || ''}</head>`);
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'notApplicable', css + body);
  }
  // Pseudo-element rules do not stop the check.
  assertRule(
    runa11yCoreOnHtml(
      page('<p class="t">Texte</p>', '.t { color: #333 } .t::before { content: "»" }'),
      RUN
    ),
    RULE_ID,
    'fail'
  );
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const html = page(
    '<p id="a" style="color:#333">Texte</p><div style="background-image:url(b.jpg)">Bandeau</div><p style="background:#ffd">Encadré</p>'
  );
  const rule = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail',
    { minOccurrences: 3, maxOccurrences: 3 }
  );
  const byCode = Object.fromEntries(rule.occurrences.map((o) => [o.data.details.reasonCode, o]));
  assert.equal(
    byCode.colorWithoutBackground.summary,
    'Cet élément définit la couleur du texte (rgb(51, 51, 51)), mais ni lui ni aucun parent ne déclare de couleur de fond.'
  );
  assert.equal(
    byCode.imageWithoutBackground.summary,
    'Cet élément a du texte sur une image de fond (url("b.jpg")), mais ni lui ni aucun parent ne déclare de couleur de fond.'
  );
  assert.equal(
    byCode.backgroundWithoutColor.summary,
    'Cet élément déclare une couleur de fond (rgb(255, 255, 221)) sous un texte laissé dans le noir par défaut.'
  );
  const en = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail');
  assert.equal(
    en.occurrences.find((o) => o.data.details.reasonCode === 'colorWithoutBackground').summary,
    'This element sets the text colour (rgb(51, 51, 51)), but neither it nor any parent declares a background colour.'
  );
});

test(`${RULE_ID}: the map links it to 10.5.1, 10.5.2 and 10.5.3; opt-in`, () => {
  const row = RGAA_RULE_TESTS['4.1.2'][RULE_ID];
  assert.deepEqual(row.tests, ['10.5.1', '10.5.2', '10.5.3']);
  assert.deepEqual(row.reasonCodes, {
    colorWithoutBackground: { tests: ['10.5.1'] },
    backgroundWithoutColor: { tests: ['10.5.2'] },
    imageWithoutBackground: { tests: ['10.5.3'] }
  });
  const html = page('<p style="color:#333">Texte</p>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
  }
});

test(`${RULE_ID}: the RGAA 10.5 rollup`, () => {
  const rollupOf = (html) =>
    runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } }).rulesResults.find(
      (r) => r.ruleId === 'rgaa-4.1.2-10.5'
    );
  assert.equal(rollupOf(page('<p style="color:#333">Texte</p>')).outcome, 'fail');
  assert.equal(rollupOf(page('<p style="background:#ffd">Texte</p>')).outcome, 'cantTell');
  assert.notEqual(
    rollupOf(page('<p>Texte</p>', 'body { background: #fff; color: #333 }')).outcome,
    'fail'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  assert.deepEqual(codes(rule), [
    ['colorWithoutBackground', 'cdp_case_01'],
    ['imageWithoutBackground', 'cdp_case_02'],
    ['backgroundWithoutColor', 'cdp_case_03']
  ]);
});
