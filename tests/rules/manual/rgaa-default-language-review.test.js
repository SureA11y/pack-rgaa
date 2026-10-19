'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-default-language-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(htmlAttrs, body) {
  return `<!doctype html><html${htmlAttrs}><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);

const FR =
  '<p>La médiathèque municipale ouvre ses portes du mardi au samedi. Les horaires changent pendant les vacances scolaires : elle est alors ouverte le matin seulement.</p>' +
  '<p>Vous pouvez emprunter jusqu’à dix documents pour une durée de trois semaines, et les prolonger une fois sur votre compte en ligne.</p>' +
  '<p>Les inscriptions sont gratuites pour les habitants de la commune et pour les personnes qui y travaillent. Un justificatif de domicile vous sera demandé.</p>';
const EN =
  '<p>The library is open from Tuesday to Saturday, and it is open in the morning only during the school holidays.</p>' +
  '<p>You can borrow up to ten items for three weeks and renew them once from your account on the website.</p>' +
  '<p>Registration is free for the people who live or work in the town, and a proof of address will be asked for on your first visit.</p>';
const DE =
  '<p>Die Bibliothek ist von Dienstag bis Samstag geöffnet. In den Schulferien ist sie nur am Vormittag geöffnet.</p>' +
  '<p>Sie können bis zu zehn Medien für drei Wochen ausleihen und sie einmal über Ihr Konto verlängern.</p>' +
  '<p>Die Anmeldung ist für die Einwohner der Stadt und für die Menschen, die dort arbeiten, kostenlos und wird bei dem ersten Besuch gemacht.</p>';

// 8.4.1: « Le code de langue est valide ; Le code de langue est pertinent »,
// pertinent: « qui indique la langue principale du document ».
test(`${RULE_ID}: und and mul are asked about`, () => {
  for (const [attrs, attribute, lang] of [
    [' lang="und"', 'lang', 'und'],
    [' lang="MUL"', 'lang', 'MUL'],
    [' lang="und-FR"', 'lang', 'und-FR'],
    [' xml:lang="mul"', 'xml:lang', 'mul']
  ]) {
    const rule = assertRule(run(page(attrs, FR)), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.deepEqual(occ.data.details, { reasonCode: 'undeterminedLang', attribute, lang }, attrs);
    assert.match(occ.html, /^<html/);
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: page text clearly in another language than lang is asked about`, () => {
  for (const [lang, body, guessed] of [
    ['en', FR, 'fr'],
    ['en-GB', FR, 'fr'],
    ['fr', EN, 'en'],
    ['fr', DE, 'de'],
    ['de', FR, 'fr']
  ]) {
    const rule = assertRule(run(page(` lang="${lang}"`, body)), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(
      rule.occurrences[0].data.details,
      { reasonCode: 'langMismatch', attribute: 'lang', lang, guessed },
      `${lang} ${guessed}`
    );
  }
});

test(`${RULE_ID}: a right default language, a bilingual page with lang on passages, borrowed words and names are not applicable`, () => {
  for (const [lang, body] of [
    ['fr', FR],
    ['FR-fr', FR],
    ['en', EN],
    ['de', DE],
    // Most text has its own lang: what is left is French.
    [
      'fr',
      `<p>Bienvenue sur le site de la médiathèque.</p><div lang="en">${EN}</div><div lang="de">${DE}</div>`
    ],
    // French text full of English words, names and technical terms.
    [
      'fr',
      '<p>Abonnez-vous à notre newsletter pour suivre les actualités de la start-up. Le meeting du week-end avec Steve Jobs et Mary Smith a été un vrai succès, et le podcast est en ligne sur le cloud.</p>' +
        '<p>Le serveur renvoie une erreur « 404 not found » quand la page est absente du cache. Le design du dashboard a été revu par notre équipe marketing et le feedback des utilisateurs est très bon.</p>'
    ],
    // Too little text to judge.
    ['en', '<p>Les inscriptions sont gratuites pour les habitants de la commune.</p>'],
    // A language the guess does not know, an invalid code, no language.
    ['ca', FR],
    ['english', FR],
    ['', FR]
  ]) {
    assertRule(
      run(page(lang ? ` lang="${lang}"` : '', body)),
      RULE_ID,
      'notApplicable',
      `${lang}: ${body.slice(0, 60)}`
    );
  }
});

test(`${RULE_ID}: code, form controls and hidden text do not count`, () => {
  const hidden = FR.replace(/<p>/g, '<p hidden>');
  assertRule(run(page(' lang="en"', hidden)), RULE_ID, 'notApplicable');
  assertRule(
    run(page(' lang="en"', `<pre>${FR.replace(/<\/?p>/g, '')}</pre>`)),
    RULE_ID,
    'notApplicable'
  );
  assertRule(
    run(page(' lang="en"', `<textarea>${FR.replace(/<\/?p>/g, '')}</textarea>`)),
    RULE_ID,
    'notApplicable'
  );
  assertRule(
    run(page(' lang="en"', `<div aria-hidden="true">${FR}</div>`)),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: a run narrowed to a fragment is not applicable`, () => {
  const html = page(' lang="und"', `<div id="part">${FR}</div>`);
  assertRule(run(html, { ...RUN, contextSelector: '#part' }), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const fr = run(page(' lang="en"', FR), { ...RUN, engineOptions: { locale: 'fr' } });
  const rule = assertRule(fr, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(
    rule.occurrences[0].summary,
    'La langue par défaut de la page est indiquée par lang="en", mais son texte semble écrit en « fr ».'
  );
  const en = assertRule(run(page(' lang="und"', FR)), RULE_ID, 'cantTell');
  assert.equal(
    en.occurrences[0].summary,
    'The page\'s default language is given as lang="und", which names no language.'
  );
});

test(`${RULE_ID}: the map links it to 8.4.1; opt-in; the 8.4 rollup asks`, () => {
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['8.4.1']);
  const html = page(' lang="en"', FR);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
  }
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-8.4').outcome, 'cantTell');
  const good = runa11yCoreOnHtml(page(' lang="fr"', FR), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  assert.equal(good.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-8.4').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(run(fs.readFileSync(fixturePath, 'utf8')), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'langMismatch',
    attribute: 'lang',
    lang: 'en',
    guessed: 'fr'
  });
});
