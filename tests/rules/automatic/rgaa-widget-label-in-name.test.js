'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-widget-label-in-name';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

function run(body) {
  return runa11yCoreOnHtml(page(body), RUN);
}

const TAB = (attrs, text) =>
  `<div role="tablist"><div role="tab" tabindex="0" aria-selected="true" ${attrs}>${text}</div></div>`;

test(`${RULE_ID}: a widget whose accessible name does not contain its visible text fails`, () => {
  for (const body of [
    TAB('aria-label="Réglages"', 'Paramètres'),
    '<ul role="menu"><li role="menuitem" tabindex="-1" aria-labelledby="l">Imprimer</li></ul><span id="l">Exporter</span>',
    '<ul role="tree"><li role="treeitem" aria-label="Dossier">Documents</li></ul>',
    '<div role="listbox" aria-label="Couleurs"><div role="option" aria-selected="false" aria-label="Bleu">Rouge</div></div>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
    assert.equal(rule.occurrences[0].i18n.summaryKey, 'widgetLabelInName_summary_fail_name');
  }
});

// The particular cases of 7.1.3 excuse only punctuation, capital letters and
// symbols.
test(`${RULE_ID}: a name that leaves out text in parentheses, changes an ending or writes out an abbreviation fails`, () => {
  for (const body of [
    '<div role="tablist"><div role="tab" tabindex="0" aria-label="Messages">Messages (3)</div></div>',
    '<ul role="menu"><li role="menuitem" tabindex="-1" aria-label="Paramètres avancés">Param. avancés</li></ul>',
    '<ul role="menu"><li role="menuitem" tabindex="-1" aria-label="Imprimer">Impression</li></ul>',
    '<button aria-label="Rechercher">Recherche</button>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
  }
});

test(`${RULE_ID}: a single letter that may be a symbol is asked about`, () => {
  const rule = assertRule(
    run(
      '<ul role="menu"><li role="menuitem" tabindex="-1" aria-label="Mettre en gras">B</li></ul>'
    ),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasons(rule), [['cantTell', 'POSSIBLE_SYMBOL']]);
});

test(`${RULE_ID}: a name that contains the visible text passes; punctuation and case ignored`, () => {
  for (const body of [
    TAB('aria-label="Paramètres avancés"', 'Paramètres'),
    TAB('aria-label="PARAMÈTRES !"', 'Paramètres')
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// A button outside a form does nothing unless a script drives it: 7.1.3
// covers it, and 11.9.2 only the buttons inside a form.
test(`${RULE_ID}: a button outside a form whose name lacks its visible label fails`, () => {
  for (const body of [
    '<button type="button" aria-label="Fermer">Valider</button>',
    '<input type="button" value="Envoyer" aria-label="Valider">',
    '<div role="button" tabindex="0" aria-label="Fermer">Valider</div>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
  }
  assertRule(
    run('<button type="button" aria-label="Ouvrir le menu">Menu</button>'),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: a title is not checked, and links, buttons in a form and fields are other rules' business`, () => {
  for (const body of [
    TAB('title="Réglages"', 'Paramètres'),
    TAB('', 'Paramètres'),
    '<form><button aria-label="Fermer">Valider</button></form>',
    '<a href="/c" aria-label="Écrire">Contact</a>',
    '<div role="checkbox" aria-checked="false" tabindex="0" aria-label="Accepter">J’accepte</div>',
    '<select><option aria-label="Bleu">Rouge</option></select>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

// --- opt-in gate -------------------------------------------------------------

const WIDGET_PAGE = page(TAB('aria-label="Réglages"', 'Paramètres'));

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(WIDGET_PAGE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the rgaa-4.1.2 profile, the rgaa tag and the 7.1 rollup run it`, () => {
  for (const options of [
    { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-7.1' } } }
  ]) {
    const result = runa11yCoreOnHtml(WIDGET_PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 7.1.3, and label-in-name to no RGAA test`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['7.1.3']);
  assert.deepEqual(map['label-in-name'].tests, []);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(body) {
  const result = runa11yCoreOnHtml(page(body), {
    engineOptions: { profile: 'rgaa-4.1.2-with-wcag' }
  });
  const outcome = (ruleId) => {
    const r = result.rulesResults.find((x) => x.ruleId === ruleId);
    return r ? rollupOutcome(r) : 'missing';
  };
  // Nothing found there: notApplicable, or a criterion that asks only
  // because some of its tests have no rule (partial coverage).
  const found = (ruleId) => {
    const r = result.rulesResults.find((x) => x.ruleId === ruleId);
    return r && r.data.details.reasonCode === 'composite.rollup.cantTell.partialCoverage'
      ? 'notApplicable'
      : outcome(ruleId);
  };
  return {
    rgaa: outcome('rgaa-4.1.2-7.1'),
    wcag: outcome('wcag-2.5.3-label-in-name'),
    others: ['rgaa-4.1.2-6.1', 'rgaa-4.1.2-11.2', 'rgaa-4.1.2-11.9'].map(found)
  };
}

test(`${RULE_ID}: WCAG and RGAA agree on a replaced tab name, reported under 7.1.3 only`, () => {
  const bad = rollups(TAB('aria-label="Réglages"', 'Paramètres'));
  assert.equal(bad.wcag, 'fail');
  assert.equal(bad.rgaa, 'fail');
  assert.deepEqual(bad.others, ['notApplicable', 'notApplicable', 'notApplicable']);
  const good = rollups(TAB('aria-label="Paramètres avancés"', 'Paramètres'));
  assert.equal(good.wcag, 'passedInPart');
  assert.equal(good.rgaa, 'passedInPart');
});

test(`${RULE_ID}: WCAG asks about a hyphenation difference, RGAA ignores punctuation and passes`, () => {
  const r = rollups(TAB('aria-label="Email"', 'E-mail'));
  assert.equal(r.wcag, 'cantTell');
  assert.equal(r.rgaa, 'passedInPart');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/rgaa-widget-label-in-name-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'rgaa-widget-label-in-name-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail');
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome,
    o.data.details.reasonCode
  ]);
  got.sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(got, [
    ['wlin_case_01', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['wlin_case_02', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['wlin_case_03', 'cantTell', 'POSSIBLE_SYMBOL'],
    ['wlin_case_06', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['wlin_case_08', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['wlin_case_09', 'fail', 'NAME_LACKS_VISIBLE_LABEL']
  ]);
});

// Screen-reader-only text is not on screen, so it is no part of the visible
// label (unistra.fr's pagination: <span class="sr-only">Page2</span>2).
test(`${RULE_ID}: screen-reader-only text is left out of the visible label`, () => {
  const result = run(
    '<div role="tablist"><div role="tab" tabindex="0" aria-label="Tarifs">Tarifs<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)"> de l’offre</span></div></div>'
  );
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule && rule.outcome !== 'fail', rule && JSON.stringify(reasons(rule)));
});
