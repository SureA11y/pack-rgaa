'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-link-content-label-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body>${body}</body></html>`;
}

function run(body) {
  return runa11yCoreOnHtml(page(body), RUN);
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

test(`${RULE_ID}: a link named only by an attribute fails, naming the source`, () => {
  for (const [body, source] of [
    ['<a href="/" aria-label="Accueil"><svg aria-hidden="true"></svg></a>', 'aria-label'],
    ['<a href="/" title="Accueil"><img src="i.png" alt=""></a>', 'title'],
    ['<a href="/" aria-labelledby="l"></a><span id="l">Accueil</span>', 'aria-labelledby'],
    ['<span role="link" tabindex="0" aria-label="Plan du site"></span>', 'aria-label']
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'nameOutsideContent', body);
    assert.equal(occ.data.details.nameSource, source, body);
    assert.equal(occ.i18n.summaryKey, 'linkContentLabelPresent_summary_fail_nameOutsideContent');
    assert.equal(occ.i18n.params.source, source, body);
  }
});

test(`${RULE_ID}: a link with no label at all fails`, () => {
  for (const body of [
    '<a href="/"></a>',
    '<a href="/"><img src="i.png"></a>',
    '<a href="/"><span aria-hidden="true">Accueil</span></a>',
    '<a href="/"><span style="display:none">Accueil</span></a>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'noContentLabel', body);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'linkContentLabelPresent_summary_fail_noLabel'
    );
  }
});

test(`${RULE_ID}: content that is not plain text is asked about`, () => {
  // The summary names the content that is not plain text.
  for (const [body, variant] of [
    ['<a href="/aide" aria-label="Aide"><span aria-hidden="true">?</span></a>', 'ariaHiddenText'],
    ['<a href="/"><span aria-label="Accueil"></span></a>', 'descendantName'],
    ['<a href="/"><video src="v.mp4"></video></a>', 'embedded']
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'contentNotReadable', body);
    assert.equal(
      occ.i18n.summaryKey,
      `linkContentLabelPresent_summary_cantTell_contentNotReadable_${variant}`,
      body
    );
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: text or an image text alternative in the content passes`, () => {
  for (const body of [
    '<a href="/">Accueil</a>',
    '<a href="/" aria-label="Retour à l’accueil">Accueil</a>',
    '<a href="/"><img src="logo.png" alt="Accueil"></a>',
    '<a href="/"><img src="logo.png" alt="" aria-label="Accueil"></a>',
    '<a href="/"><svg role="img" aria-label="Accueil"></svg></a>',
    '<a href="/"><svg><title>Accueil</title></svg></a>',
    '<a href="/"><span class="sr-only" style="position:absolute;clip:rect(0 0 0 0)">Accueil</span></a>',
    '<a href="/"><img src="i.png" alt="">Accueil</a>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: area, anchors without href and links with another widget role are not applicable`, () => {
  assertRule(
    run(
      '<img src="m.png" alt="Plan" usemap="#m"><map name="m"><area href="/a" shape="rect" coords="0,0,1,1"></map>' +
        '<a name="top"></a><a href="#x" role="button"></a>'
    ),
    RULE_ID,
    'notApplicable'
  );
  // A focusable link keeps its role under role="presentation".
  assertRule(run('<a href="/" role="presentation"></a>'), RULE_ID, 'fail', { minOccurrences: 1 });
});

test(`${RULE_ID}: a link outside the accessibility tree is not applicable`, () => {
  assertRule(
    run('<a href="/" style="display:none"></a><div hidden><a href="/"></a></div>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<main><a href="/" aria-label="Accueil"></a></main>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 6.2 rollup id run it`, () => {
  const html = page('<main><a href="/" aria-label="Accueil"></a></main>');
  for (const opts of [
    { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-6.2' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

function rgaaRun(body) {
  const result = runa11yCoreOnHtml(page(body), {
    engineOptions: { profile: 'rgaa-4.1.2-with-wcag' }
  });
  const rollup = (prefix) => result.rulesResults.find((r) => r.ruleId.startsWith(prefix));
  const rule = (id) => result.checksResults.find((r) => r.ruleId === id);
  return { rollup, rule };
}

test(`${RULE_ID}: an aria-label-only link fails 6.2 under RGAA while WCAG 2.4.4 passes`, () => {
  const { rollup, rule } = rgaaRun(
    '<main><h1>T</h1><a href="/" aria-label="Accueil"><svg aria-hidden="true"></svg></a></main>'
  );
  assert.equal(rule('link-name-present').outcome, 'pass');
  assert.equal(rollupOutcome(rollup('wcag-2.4.4-')), 'passedInPart');
  const rgaa62 = rollup('rgaa-4.1.2-6.2');
  assert.equal(rgaa62.outcome, 'fail');
  assert.deepEqual(rgaa62.data.details.checksIds, [RULE_ID]);
});

// link-name-present fails an unnamed <area>; RGAA judges it under 1.1.2.
test(`${RULE_ID}: an unnamed area fails WCAG 2.4.4 and RGAA 1.1, not RGAA 6.2`, () => {
  const { rollup, rule } = rgaaRun(
    '<img src="m.png" alt="Plan" usemap="#m"><map name="m"><area href="/a" shape="rect" coords="0,0,1,1"></map><main><h1>T</h1></main>'
  );
  assert.equal(rule('link-name-present').outcome, 'fail');
  assert.equal(rollupOutcome(rollup('wcag-2.4.4-')), 'fail');
  assert.equal(rollupOutcome(rollup('rgaa-4.1.2-6.2')), 'noneFoundInPart');
  assert.equal(rollupOutcome(rollup('rgaa-4.1.2-1.1')), 'fail');
  assert.deepEqual(rule('link-name-present').rollupIds, [
    'wcag-2.4.4-link-purpose-in-context',
    'wcag-4.1.2-name'
  ]);
});

test(`${RULE_ID}: both fail an empty link and neither fails a text link`, () => {
  const empty = rgaaRun('<main><h1>T</h1><a href="/"></a></main>');
  assert.equal(rollupOutcome(empty.rollup('wcag-2.4.4-')), 'fail');
  assert.equal(rollupOutcome(empty.rollup('rgaa-4.1.2-6.2')), 'fail');
  const text = rgaaRun('<main><h1>T</h1><a href="/">Accueil</a></main>');
  assert.equal(rollupOutcome(text.rollup('wcag-2.4.4-')), 'passedInPart');
  assert.equal(rollupOutcome(text.rollup('rgaa-4.1.2-6.2')), 'passedInPart');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/rgaa-link-content-label-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'rgaa-link-content-label-present-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 6, maxOccurrences: 6 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'lcl_case_01',
    'lcl_case_02',
    'lcl_case_03',
    'lcl_case_04',
    'lcl_case_10',
    'lcl_case_05'
  ]);
  // jsdom computes no ::before content, so case 10 fails as an empty link
  // here; a browser reports it as generatedTextOnly (see the Chromium test).
  assert.deepEqual(reasons(rule), [
    ['fail', 'nameOutsideContent'],
    ['fail', 'nameOutsideContent'],
    ['fail', 'noContentLabel'],
    ['fail', 'nameOutsideContent'],
    ['fail', 'noContentLabel'],
    ['cantTell', 'contentNotReadable']
  ]);
});

// The label of a link may be rendered by a web component: text in its
// shadow root, or slotted into it, is the content of the link.
test(`${RULE_ID}: a label inside a web component's shadow root counts`, () => {
  const { JSDOM } = require('jsdom');
  const { runa11yCoreOnDom } = require('../../helpers/run.js');
  const scan = (setup) => {
    const dom = new JSDOM(
      '<!doctype html><html lang="fr"><head><title>t</title></head><body><main><a href="/" id="l"><brand-logo></brand-logo></a></main></body></html>',
      { url: 'https://example.test/', pretendToBeVisual: true }
    );
    const host = dom.window.document.querySelector('brand-logo');
    setup(host.attachShadow({ mode: 'open' }), host);
    const rule = runa11yCoreOnDom(dom, RUN).checksResults.find((r) => r.ruleId === RULE_ID);
    dom.window.close();
    return rule.outcome;
  };
  assert.equal(
    scan((root) => (root.innerHTML = '<span>Accueil</span>')),
    'pass'
  );
  assert.equal(
    scan((root, host) => {
      root.innerHTML = '<slot></slot>';
      host.textContent = 'Accueil';
    }),
    'pass'
  );
  assert.equal(
    scan((root) => (root.innerHTML = '<svg aria-hidden="true"></svg>')),
    'fail'
  );
});

// A <canvas>, or an <object> or <embed> of an image type, is an image: with
// no alternative, it gives the link no label. Glossary « Image porteuse
// d'information », note 1: a link's only image is judged under Links.
test(`${RULE_ID}: a link whose only content is an image with no alternative fails`, () => {
  for (const body of [
    '<a href="/plan"><canvas width="10" height="10"></canvas></a>',
    '<a href="/plan"><object type="image/png" data="p.png"></object></a>',
    '<a href="/plan"><embed type="image/png" src="p.png"></a>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail');
    assert.deepEqual(reasons(rule), [['fail', 'noContentLabel']], body);
  }
  for (const body of [
    '<a href="/plan"><canvas width="10" height="10">Plan du site</canvas></a>',
    '<a href="/plan"><canvas aria-label="Plan du site"></canvas></a>',
    '<a href="/plan"><object type="image/png" data="p.png" title="Plan du site"></object></a>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
  // An object of another type may be named by what it shows: a person checks.
  const pdf = assertRule(
    run('<a href="/r"><object type="application/pdf" data="r.pdf"></object></a>'),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasons(pdf), [['cantTell', 'contentNotReadable']]);
});

// The hint names what hides the label, or stands where it should be, so a
// reader who sees text or an icon in the link knows why it does not count.
test(`${RULE_ID}: the hint names the cause the markup shows`, () => {
  for (const [body, cause, hint] of [
    [
      '<a href="/"><span style="display:none">Accueil</span></a>',
      'hiddenText',
      'Its text "Accueil" is in the <span> element with display: none, which hides it from screen readers as well as from view, so the link has no label. Let screen readers read it (a visually-hidden class keeps it off screen but read).'
    ],
    [
      '<a href="/"><span aria-hidden="true">Accueil</span></a>',
      'ariaHiddenText',
      'Its text "Accueil" is in the <span> element with aria-hidden="true", which hides it from screen readers, so the link has no label. Remove aria-hidden from that element.'
    ],
    [
      '<a href="/"><img src="i.png"></a>',
      'imageNoAlt',
      'Its content is the <img> element, with no text alternative, so the link has no label. Give the image a text alternative that says where the link goes.'
    ],
    [
      '<a href="/"><svg><path d="M0 0h1"/></svg></a>',
      'svgNoName',
      'Its content is an <svg> with no <title>, aria-label or aria-labelledby, so the link has no label. Give the <svg> role="img" and an aria-label that says where the link goes, or put text in the link.'
    ],
    [
      '<a href="/" aria-label="Accueil"><i class="icon-home"></i></a>',
      'emptyIcon',
      'Its content is an empty <i class="icon-home">, probably an icon drawn by CSS, which gives no text, so the link has no label. Put text in the link, visually hidden if need be, that says where it goes.'
    ]
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.contentCause, cause, body);
    assert.equal(occ.i18n.hintKey, `linkContentLabelPresent_hint_fail_${cause}`, body);
    assert.equal(occ.hint, hint, body);
  }
});

test(`${RULE_ID}: the question names the content that is not plain text`, () => {
  const summaries = [
    [
      '<a href="/aide" aria-label="Aide"><span aria-hidden="true">?</span></a>',
      'This link\'s text "?" is in the <span> element with aria-hidden="true", so assistive technologies read only its aria-label, not text between <a> and </a>.'
    ],
    [
      '<a href="/"><span aria-label="Accueil"></span></a>',
      'This link has no text of its own: its only label is the aria-label "Accueil" of the <span> element inside it.'
    ],
    [
      '<a href="/"><video src="v.mp4"></video></a>',
      'This link holds an embedded <video>, and no text or image text alternative that assistive technologies read.'
    ]
  ];
  for (const [body, summary] of summaries) {
    assert.equal(assertRule(run(body), RULE_ID, 'cantTell').occurrences[0].summary, summary);
  }
  const fr = assertRule(
    runa11yCoreOnHtml(page(summaries[1][0]), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    fr.occurrences[0].summary,
    'Ce lien n’a pas de texte propre : son seul intitulé est l’attribut aria-label « Accueil » d’un élément <span> placé à l’intérieur.'
  );
});
