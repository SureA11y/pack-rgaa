'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-field-label-in-name-sources';
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

// 11.2.5's conditions name every source present, but its methodology and
// the glossary « Étiquette de champ de formulaire » judge only the étiquette,
// the source that gives the name: another source that lacks the label is not
// judged, and the field passes.
test(`${RULE_ID}: a source that does not give the name is not judged, and the field passes`, () => {
  for (const body of [
    '<label for="x">E-mail</label><input id="x" title="Adresse électronique">',
    '<label for="x">Nom</label><input id="x" aria-labelledby="y" title="Famille"><span id="y">Nom de famille</span>',
    '<span id="l">Recherche</span><input aria-labelledby="l" title="Chercher sur le site">',
    '<span id="l">Recherche</span><label for="x" hidden>Mots</label><input id="x" aria-labelledby="l">',
    '<label for="x">B</label><input type="checkbox" id="x" title="Mettre en gras">',
    '<label for="x">Téléphone (facultatif)</label><input id="x" title="Téléphone">'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: an accessible name that does not contain the label fails as the name`, () => {
  for (const body of [
    '<label for="x">Nom</label><input id="x" aria-label="Prénom">',
    '<div role="checkbox" aria-checked="false" tabindex="0" aria-label="Accepter les conditions">J’accepte</div>',
    '<label for="s">Pays</label><select id="s" aria-label="Nationalité"><option>France</option></select>'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
    assert.equal(rule.occurrences[0].i18n.summaryKey, 'fieldLabelInNameSources_summary_fail_name');
  }
});

test(`${RULE_ID}: punctuation and capital letters are ignored, accents are not`, () => {
  for (const body of [
    '<label for="x">E-mail :</label><input id="x" title="e-mail">',
    '<label for="x">Déposer</label><input type="file" id="x" title="Déposer un fichier">',
    '<label>Pays <select aria-label="Pays de naissance"><option>France</option></select></label>',
    '<label for="x">Nom</label><input id="x" aria-labelledby="y"><span id="y">Nom de famille</span>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
  const rule = assertRule(
    run('<label for="x">Déposer</label><input type="file" id="x" aria-label="Deposer un fichier">'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']]);
});

// The particular cases of 11.2 excuse only punctuation, capital letters and
// symbols: a name that leaves out text in parentheses shown in the label, or
// writes out an abbreviation shown, does not contain the visible label.
test(`${RULE_ID}: a name that leaves out text in parentheses or writes out an abbreviation fails`, () => {
  for (const body of [
    '<label for="t">Téléphone (facultatif)</label><input type="tel" id="t" aria-label="Téléphone">',
    '<label for="t">N° de dossier</label><input id="t" aria-label="Numéro de dossier">',
    '<label for="t">Tél.</label><input type="tel" id="t" aria-label="Téléphone">'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
  }
});

// A visible label that may be a symbol is still asked about: the name may
// say what the symbol means.
test(`${RULE_ID}: a one-character visible label is asked about as a possible symbol`, () => {
  const rule = assertRule(
    run('<label for="m">B</label><input type="checkbox" id="m" aria-label="Mettre en gras">'),
    RULE_ID,
    'cantTell',
    { maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(rule), [['cantTell', 'POSSIBLE_SYMBOL']]);
});

test(`${RULE_ID}: fields with one source, no visible label, and buttons are not applicable`, () => {
  for (const body of [
    '<label for="x">Ville</label><input id="x">',
    '<input type="search" aria-label="Rechercher">',
    '<input title="Nom" placeholder="Dupont">',
    '<input type="submit" value="Envoyer" aria-label="Valider">',
    '<label for="x">Nom</label><input type="hidden" id="x" title="Autre">',
    '<div hidden><label for="x">Nom</label><input id="x" title="Autre"></div>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

// --- opt-in gate -------------------------------------------------------------

const FIELD_PAGE = page('<label for="x">E-mail</label><input id="x" title="Adresse électronique">');

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(FIELD_PAGE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the rgaa-4.1.2 profile, the rgaa tag and the 11.2 rollup run it`, () => {
  for (const options of [
    { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-11.2' } } }
  ]) {
    const result = runa11yCoreOnHtml(FIELD_PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 11.2.5, and label-in-name to no RGAA test`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['11.2.5']);
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
  return { rgaa: outcome('rgaa-4.1.2-11.2'), wcag: outcome('wcag-2.5.3-label-in-name'), result };
}

test(`${RULE_ID}: a title without the label is outside WCAG 2.5.3 and not judged under RGAA 11.2`, () => {
  const r = rollups('<label for="x">E-mail</label><input id="x" title="Adresse électronique">');
  assert.equal(r.wcag, 'notApplicable');
  assert.notEqual(r.rgaa, 'fail');
  assert.notEqual(r.rgaa, 'cantTell');
  const own = r.result.checksResults.find((x) => x.ruleId === RULE_ID);
  assert.equal(own.outcome, 'pass');
  const rgaa = r.result.rulesResults.find((x) => x.ruleId === 'rgaa-4.1.2-11.2');
  assert.ok(!rgaa.data.details.checksIds.includes('label-in-name'));
});

test(`${RULE_ID}: WCAG and RGAA agree on a replaced name, and neither fails a name that contains the label`, () => {
  const bad = rollups('<label for="x">Nom</label><input id="x" aria-label="Prénom">');
  assert.equal(bad.wcag, 'fail');
  assert.equal(bad.rgaa, 'fail');
  const good = rollups('<label for="x">Nom</label><input id="x" aria-label="Nom de famille">');
  assert.equal(good.wcag, 'passedInPart');
  assert.notEqual(good.rgaa, 'fail');
  const own = good.result.checksResults.find((x) => x.ruleId === RULE_ID);
  assert.equal(own.outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/rgaa-field-label-in-name-sources-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'rgaa-field-label-in-name-sources-all-scenarios.html'
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
    ['fins_case_02', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fins_case_04', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fins_case_05', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fins_case_13', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fins_case_14', 'fail', 'NAME_LACKS_VISIBLE_LABEL'],
    ['fins_case_15', 'cantTell', 'POSSIBLE_SYMBOL']
  ]);
});

// Visually hidden text (clipped, 1px with overflow hidden) is read by
// assistive technologies but not seen, so it is not part of the visible label.
test(`${RULE_ID}: visually hidden text is not part of the visible label`, () => {
  for (const [body, outcome] of [
    [
      '<label for="f">Nom <span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">(obligatoire)</span></label><input id="f" title="Nom">',
      'pass'
    ],
    [
      '<label for="f" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">Nom</label><input id="f" title="Votre nom complet">',
      'notApplicable'
    ]
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, outcome);
  }
});
// Screen-reader-only text is not on screen, so it is no part of the visible
// label (unistra.fr's pagination: <span class="sr-only">Page2</span>2).
test(`${RULE_ID}: screen-reader-only text is left out of the visible label`, () => {
  const result = run(
    '<label for="q">Rechercher<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)"> dans le site</span></label><input id="q" aria-label="Rechercher">'
  );
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule && rule.outcome !== 'fail', rule && JSON.stringify(reasons(rule)));
});

// « Contient au moins l'intitulé visible » is read as words: each visible
// word must appear as a word of the source that gives the name, so a word
// with another ending fails either way (nantes: "Recherche" shown,
// "Rechercher" as the name), and short words are not stretched ("Nom" is not
// "Nombre"). A title that does not give the name is not judged.
test(`${RULE_ID}: a word that differs only by its ending fails`, () => {
  for (const body of [
    '<label for="q">Recherche</label><input id="q" aria-label="Rechercher">',
    '<label for="q">Rechercher</label><input id="q" aria-label="Recherche sur le site">',
    '<label for="n">Nom</label><input id="n" aria-label="Nombre">'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.deepEqual(reasons(rule), [['fail', 'NAME_LACKS_VISIBLE_LABEL']], body);
  }
  assertRule(
    run('<label for="q">Recherche</label><input id="q" title="Rechercher">'),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

// A state word is the field's state, not its étiquette (glossary « Intitulé
// visible »): the field has no visible label for 11.2.5 to compare.
test(`${RULE_ID}: a switch whose only text is its state has no visible label`, () => {
  for (const state of ['Activé', 'ON', 'Off', 'désactivée']) {
    assertRule(
      run(
        `<p>Notifications</p><button role="switch" aria-checked="true" aria-label="Notifications"><span>${state}</span></button>`
      ),
      RULE_ID,
      'notApplicable'
    );
  }
  assertRule(
    run(
      '<span role="checkbox" aria-checked="false" tabindex="0" aria-label="Newsletter">Recevoir les offres</span>'
    ),
    RULE_ID,
    'fail'
  );
});
