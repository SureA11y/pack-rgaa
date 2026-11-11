'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-aria-attribute-conformance';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const run = (body) => runa11yCoreOnHtml(page(body), RUN);
const reasons = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);

// Each case was run through the W3C validator 26.9.27, the reference named by
// RGAA 8.2.1 step 1: every case listed with a reason code is an error there,
// every "pass" case is not.
const VALIDATOR_CASES = [
  ['<button aria-labeledby="x">a</button>', 'unknownAttribute'],
  ['<div aria-foo="1">a</div>', 'unknownAttribute'],
  ['<button aria-expanded="">a</button>', 'invalidValue'],
  ['<button aria-expanded="TRUE">a</button>', 'invalidValue'],
  ['<button aria-pressed=" true">a</button>', 'invalidValue'],
  ['<div role="heading" aria-level="0">a</div>', 'invalidValue'],
  ['<div role="heading" aria-level="+2">a</div>', 'invalidValue'],
  ['<div role="list"><div role="listitem" aria-setsize="-2">a</div></div>', 'invalidValue'],
  ['<div role="slider" tabindex="0" aria-valuenow="abc">a</div>', 'invalidValue'],
  ['<button aria-describedby="  ">a</button>', 'invalidValue'],
  ['<div role="listbox" tabindex="0" aria-activedescendant="nope"></div>', 'invalidValue'],
  ['<p aria-live="polite" aria-relevant="removals all">a</p>', 'invalidValue'],
  ['<a href="/" aria-pressed="true">a</a>', 'attributeNotAllowed'],
  ['<a href="/" aria-checked="true">a</a>', 'attributeNotAllowed'],
  ['<table><tr><td aria-sort="ascending">1</td></tr></table>', 'attributeNotAllowed'],
  ['<section aria-selected="true">a</section>', 'attributeNotAllowed'],
  ['<details><summary aria-expanded="true">a</summary>b</details>', 'attributeNotAllowed'],
  ['<label aria-required="true"><input> a</label>', 'attributeNotAllowed'],
  ['<input type="hidden" aria-hidden="true">', 'attributeNotAllowed'],
  ['<div role="link" aria-pressed="true" tabindex="0">a</div>', 'attributeNotAllowed'],
  ['<div aria-label="Menu">Menu</div>', 'namingProhibited'],
  ['<p aria-label="x">text</p>', 'namingProhibited'],
  ['<button><span aria-label="Fermer">X</span></button>', 'namingProhibited'],
  ['<table><caption aria-label="x">c</caption><tr><td>1</td></tr></table>', 'namingProhibited'],
  ['<p role="paragraph" aria-label="x">text</p>', 'namingProhibited'],
  ['<input type="checkbox" checked aria-checked="true">', 'nativeCheckedConflict'],
  ['<input type="radio" aria-checked="false">', 'nativeCheckedConflict'],
  ['<button disabled aria-disabled="false">a</button>', 'nativeAttributeConflict'],
  ['<input type="text" required aria-required="false">', 'nativeAttributeConflict'],
  ['<textarea readonly aria-readonly="false"></textarea>', 'nativeAttributeConflict'],
  ['<div hidden aria-hidden="false">a</div>', 'nativeAttributeConflict'],
  ['<input type="text" placeholder="a" aria-placeholder="a">', 'nativeAttributeConflict'],
  ['<div role="heading">a</div>', 'missingRequired'],
  ['<h2 role="heading">a</h2>', 'missingRequired'],
  ['<div role="combobox" tabindex="0" aria-label="x"></div>', 'missingRequired'],
  ['<div role="checkbox" tabindex="0">a</div>', 'missingRequired'],
  ['<div role="slider" tabindex="0" aria-label="x"></div>', 'missingRequired'],
  ['<h2 aria-expanded="true">T</h2>', 'pass'],
  ['<div role="heading" aria-level="2" aria-expanded="true">T</div>', 'pass'],
  ['<button aria-describedby="nope">a</button>', 'pass'],
  ['<button aria-labelledby="nope">a</button>', 'pass'],
  ['<button aria-errormessage="nope" aria-invalid="true">a</button>', 'pass'],
  ['<label><input type="checkbox" role="switch"> a</label>', 'pass'],
  ['<div role="menu"><input type="radio" role="menuitemradio"></div>', 'pass'],
  ['<button disabled aria-disabled="true">a</button>', 'pass'],
  ['<div hidden aria-hidden="true">a</div>', 'pass'],
  ['<div role="none" aria-label="x">a</div>', 'pass'],
  ['<div aria-roledescription="x">a</div>', 'pass'],
  ['<ul><li aria-level="2" aria-setsize="3" aria-posinset="1">a</li></ul>', 'pass'],
  ['<p aria-live="polite" aria-relevant=" additions text ">a</p>', 'pass'],
  ['<div role="slider" tabindex="0" aria-valuenow="1e3">a</div>', 'pass'],
  [
    '<div role="grid" aria-rowcount="-1"><div role="row"><div role="gridcell">c</div></div></div>',
    'pass'
  ],
  ['<my-widget aria-foo="1">a</my-widget>', 'notApplicable']
];

test(`${RULE_ID}: agrees with the W3C validator 26.9.27`, () => {
  for (const [body, expected] of VALIDATOR_CASES) {
    const rule = check(run(body), RULE_ID);
    if (expected === 'pass' || expected === 'notApplicable') {
      assert.equal(rule.outcome, expected, body);
    } else {
      assert.equal(rule.outcome, 'fail', body);
      assert.ok(reasons(rule).includes(expected), `${body}: ${reasons(rule)}`);
    }
  }
});

test(`${RULE_ID}: one occurrence per attribute, with the attribute and its value`, () => {
  const rule = assertRule(
    run('<button aria-expanded="yes" aria-pressed="maybe">a</button>'),
    RULE_ID,
    'fail',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  const occ = rule.occurrences[0];
  assert.equal(occ.i18n.summaryKey, 'ariaAttributeConformance_summary_fail_invalidValue');
  assert.deepEqual(occ.i18n.params, {
    element: 'button',
    attr: 'aria-expanded',
    value: 'yes',
    allowed: '"true", "false", "undefined"'
  });
  assert.equal(occ.summary, 'aria-expanded="yes" on this <button> is not a valid value.');
  assert.equal(occ.i18n.hintKey, 'ariaAttributeConformance_hint_fail_invalidValueAllowed');
  assert.equal(
    occ.hint,
    'aria-expanded takes one of these values: "true", "false", "undefined". Use one of them, written exactly, in lowercase and with no spaces around it.'
  );
});

// A name or token close to a known one is named as the one meant.
test(`${RULE_ID}: the hint names the attribute or value meant`, () => {
  for (const [body, hintKey, hint] of [
    [
      '<div aria-labeledby="l">a</div><span id="l">b</span>',
      'ariaAttributeConformance_hint_fail_unknownAttributeSuggest',
      'aria-labeledby is not an ARIA attribute: did you mean aria-labelledby? Rename it, or remove it.'
    ],
    [
      '<div aria-hiden="true">a</div>',
      'ariaAttributeConformance_hint_fail_unknownAttributeSuggest',
      'aria-hiden is not an ARIA attribute: did you mean aria-hidden? Rename it, or remove it.'
    ],
    [
      '<button aria-pressed="ture">a</button>',
      'ariaAttributeConformance_hint_fail_invalidValueSuggest',
      'aria-pressed takes one of these values: "true", "false", "mixed", "undefined". Did you mean "true"? Write it exactly, in lowercase and with no spaces around it.'
    ],
    [
      '<div aria-live="Polite">a</div>',
      'ariaAttributeConformance_hint_fail_invalidValueSuggest',
      'aria-live takes one of these values: "off", "polite", "assertive". Did you mean "polite"? Write it exactly, in lowercase and with no spaces around it.'
    ],
    [
      '<div aria-zzz="1">a</div>',
      'ariaAttributeConformance_hint_fail_unknownAttribute',
      'Correct the attribute name (for example aria-labelledby, not aria-labeledby) or remove it.'
    ]
  ]) {
    const occ = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 })
      .occurrences[0];
    assert.equal(occ.i18n.hintKey, hintKey, body);
    assert.equal(occ.hint, hint, body);
  }
  const fr = assertRule(
    runa11yCoreOnHtml(page('<div aria-hiden="true">a</div>'), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'fail'
  ).occurrences[0];
  assert.equal(
    fr.hint,
    'aria-hiden n’est pas un attribut ARIA : vouliez-vous écrire aria-hidden ? Renommez-le, ou supprimez-le.'
  );
});

test(`${RULE_ID}: a role decides the allowed attributes, and the message names it`, () => {
  const rule = assertRule(
    run('<div role="link" tabindex="0" aria-pressed="true">a</div>'),
    RULE_ID,
    'fail'
  );
  const occ = rule.occurrences[0];
  assert.equal(
    occ.i18n.summaryKey,
    'ariaAttributeConformance_summary_fail_attributeNotAllowedRole'
  );
  assert.deepEqual(occ.i18n.params, { element: 'div', attr: 'aria-pressed', role: 'link' });
});

test(`${RULE_ID}: aria-hidden on <html> and aria-hidden="true" on <body> fail`, () => {
  const html = runa11yCoreOnHtml(
    '<!doctype html><html lang="en" aria-hidden="false"><head><title>t</title></head><body><p>x</p></body></html>',
    RUN
  );
  const rule = assertRule(html, RULE_ID, 'fail');
  assert.equal(rule.occurrences[0].i18n.summaryKey.endsWith('nativeAttributeConflictHtml'), true);
  const body = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body aria-hidden="true"><p>x</p></body></html>',
    RUN
  );
  assert.equal(
    assertRule(body, RULE_ID, 'fail').occurrences[0].i18n.summaryKey.endsWith(
      'nativeAttributeConflictBody'
    ),
    true
  );
});

// RGAA 8.2.1 judges the generated source, hidden markup included.
test(`${RULE_ID}: hidden content is checked, while aria-valid-attr-value skips it`, () => {
  for (const body of [
    '<div hidden><button aria-expanded="yes">a</button></div>',
    '<div style="display:none"><button aria-expanded="yes">a</button></div>'
  ]) {
    const result = runa11yCoreOnHtml(page(body), {
      runOnly: { includeRuleIds: [RULE_ID, 'aria-valid-attr-value'] }
    });
    assert.equal(check(result, RULE_ID).outcome, 'fail', body);
    assert.equal(check(result, 'aria-valid-attr-value').outcome, 'notApplicable', body);
  }
});

test(`${RULE_ID}: a page with no aria-* attribute and no role that needs one is not applicable`, () => {
  assertRule(run('<p>Text</p><div role="button" tabindex="0">a</div>'), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<div role="heading">a</div>'), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette balise <div> a role="heading" mais pas d’attribut aria-level, que ce rôle exige.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<button aria-expanded="">a</button>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!check(result, RULE_ID), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 8.2 rollup id run it`, () => {
  const html = page('<button aria-expanded="">a</button>');
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-8.2' } } }
  ]) {
    const rule = check(runa11yCoreOnHtml(html, opts), RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// Under the RGAA profile, 8.2 takes this rule's verdict, while WCAG 4.1.2 in
// the same run keeps the WCAG rules'.
test(`${RULE_ID}: RGAA 8.2 fails an empty aria-expanded that WCAG 4.1.2 passes`, () => {
  const result = runa11yCoreOnHtml(page('<button aria-expanded="">Menu</button>'), RGAA);
  assert.equal(check(result, 'aria-valid-attr-value').outcome, 'pass');
  assert.equal(rollupOutcome(rollup(result, 'wcag-4.1.2-aria-validity')), 'passedInPart');
  assert.equal(rollupOutcome(rollup(result, 'rgaa-4.1.2-8.2')), 'fail');
});

test(`${RULE_ID}: RGAA 8.2 fails role="heading" without aria-level, which WCAG 4.1.2 only asks about`, () => {
  const result = runa11yCoreOnHtml(page('<div role="heading">News</div>'), RGAA);
  assert.equal(check(result, 'aria-required-attr').outcome, 'cantTell');
  assert.equal(rollupOutcome(rollup(result, 'wcag-4.1.2-aria-validity')), 'cantTell');
  assert.equal(rollupOutcome(rollup(result, 'rgaa-4.1.2-8.2')), 'fail');
});

test(`${RULE_ID}: WCAG 4.1.2 asks about aria-expanded on a heading, which RGAA 8.2 does not fail`, () => {
  const result = runa11yCoreOnHtml(page('<h2 aria-expanded="true">Section</h2>'), RGAA);
  assert.equal(check(result, 'aria-allowed-attr').outcome, 'cantTell');
  assert.equal(rollupOutcome(rollup(result, 'wcag-4.1.2-aria-validity')), 'cantTell');
  assert.equal(check(result, RULE_ID).outcome, 'pass');
  // rgaa-markup-validation-review keeps 8.2 at cantTell: the rule's pass is not a
  // pass of the whole test.
  const rgaa = rollup(result, 'rgaa-4.1.2-8.2');
  assert.equal(rgaa.outcome, 'cantTell');
  assert.ok(!rgaa.data.details.checksIds.includes('aria-allowed-attr'));
});

test(`${RULE_ID}: RGAA 8.2 and WCAG 4.1.2 agree on a misspelt value and on valid attributes`, () => {
  const bad = runa11yCoreOnHtml(page('<button aria-pressed="yes">a</button>'), RGAA);
  assert.equal(rollupOutcome(rollup(bad, 'wcag-4.1.2-aria-validity')), 'fail');
  assert.equal(rollupOutcome(rollup(bad, 'rgaa-4.1.2-8.2')), 'fail');
  const good = runa11yCoreOnHtml(page('<button aria-pressed="true">a</button>'), RGAA);
  assert.equal(check(good, RULE_ID).outcome, 'pass');
  assert.equal(rollupOutcome(rollup(good, 'wcag-4.1.2-aria-validity')), 'passedInPart');
  assert.equal(rollupOutcome(rollup(good, 'rgaa-4.1.2-8.2')), 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 15, maxOccurrences: 15 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  const expected = [];
  for (let i = 1; i <= 14; i++) expected.push(`aac_case_${String(i).padStart(2, '0')}`);
  expected.push('aac_case_20');
  assert.deepEqual(ids, expected);
  assert.deepEqual(
    rule.occurrences
      .filter((o) => o.occurrenceOutcome === 'cantTell')
      .map((o) => o.data.details.reasonCode),
    ['emptyIdReference']
  );
});

// A shadow root is part of the page's generated source (« code source
// généré »), which RGAA 8.2.1 judges like the rest.
function shadowRun(light, shadow) {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/run.js');
  const dom = createDom(page(light));
  const root = dom.window.document.getElementById('host').attachShadow({ mode: 'open' });
  root.innerHTML = shadow;
  return runa11yCoreOnDom(dom, RUN);
}

test(`${RULE_ID}: markup inside an open shadow root fails like markup outside it`, () => {
  const rule = assertRule(
    shadowRun('<div id="host"></div>', '<div aria-labeledby="x">a</div>'),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'unknownAttribute');
  assert.equal(occ.data.details.inShadowRoot, undefined);
  assert.equal(occ.uncertainty, undefined);
});

test(`${RULE_ID}: an aria-activedescendant naming an element across a shadow boundary is asked about`, () => {
  // From a shadow root to the document.
  const out = assertRule(
    shadowRun(
      '<div id="host"></div><div id="opt1" role="option">A</div>',
      '<input role="combobox" aria-expanded="true" aria-activedescendant="opt1">'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(out.occurrences[0].data.details.reasonCode, 'idReferenceOtherTree');
  assert.equal(out.occurrences[0].uncertainty.code, 'judgement-required');
  // From the document to a shadow root.
  const into = assertRule(
    shadowRun(
      '<div id="host"></div><input role="combobox" aria-expanded="true" aria-activedescendant="opt1">',
      '<div id="opt1" role="option">A</div>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasons(into), ['idReferenceOtherTree']);
});

test(`${RULE_ID}: an aria-activedescendant naming no element of the page fails, in a shadow root too`, () => {
  const rule = assertRule(
    shadowRun(
      '<div id="host"></div>',
      '<input role="combobox" aria-expanded="true" aria-activedescendant="nowhere">'
    ),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), ['invalidValue']);
  // Found in its own shadow root, it passes.
  assertRule(
    shadowRun(
      '<div id="host"></div>',
      '<input role="combobox" aria-expanded="true" aria-activedescendant="o"><div id="o" role="option">A</div>'
    ),
    RULE_ID,
    'pass'
  );
});

// ARIA element reflection (el.ariaLabelledByElements = [...]) writes an empty
// attribute and keeps the reference in the DOM property, as Chromium does:
// an empty ID reference is asked about, for a person to read the
// accessibility tree.
test(`${RULE_ID}: an empty ID-reference attribute is asked about`, () => {
  for (const body of [
    '<button aria-labelledby="">a</button>',
    '<button aria-describedby="">a</button>',
    '<button aria-controls="" aria-expanded="false">a</button>',
    '<div role="listbox" tabindex="0" aria-activedescendant=""></div>',
    '<button aria-details="">a</button>',
    '<input aria-errormessage="" aria-invalid="true">'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'emptyIdReference', body);
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: an ID reference of whitespace, or naming no element, still fails`, () => {
  for (const body of [
    '<button aria-describedby="  ">a</button>',
    '<div role="listbox" tabindex="0" aria-activedescendant="nope"></div>'
  ]) {
    assert.deepEqual(reasons(assertRule(run(body), RULE_ID, 'fail')), ['invalidValue'], body);
  }
});
