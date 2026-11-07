'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-language-change-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

// A French page: enough French text that the default language is right.
const FR_TEXT =
  '<p>La médiathèque municipale ouvre ses portes du mardi au samedi. Les horaires changent pendant les vacances scolaires : elle est alors ouverte le matin seulement.</p>' +
  '<p>Vous pouvez emprunter jusqu’à dix documents pour une durée de trois semaines, et les prolonger une fois sur votre compte en ligne.</p>';
function page(body, lang = 'fr') {
  return `<!doctype html><html lang="${lang}"><head><title>t</title></head><body><main>${FR_TEXT}${body}</main></body></html>`;
}
const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);
const EN_P = 'This website uses cookies to improve your experience and to measure the audience.';

// 8.7.1: « chaque texte écrit dans une langue différente de la langue par
// défaut » has lang « sur l’élément contenant le texte » or « sur un des
// éléments parents ».
test(`${RULE_ID}: a passage clearly in another language, with no lang, is asked about`, () => {
  for (const [body, guessed] of [
    [`<p id="t">${EN_P}</p>`, 'en'],
    [`<ul><li id="t">${EN_P}</li></ul>`, 'en'],
    [`<table><tr><td id="t">${EN_P}</td></tr></table>`, 'en'],
    [`<blockquote><p id="t">« ${EN_P} »</p></blockquote>`, 'en'],
    ['<h2 id="t">Die Anmeldung ist für alle Einwohner der Stadt kostenlos</h2>', 'de'],
    [
      '<p id="t">Los datos están protegidos por la ley y no pueden usarse con fines comerciales.</p>',
      'es'
    ],
    [
      '<p id="t">I dati sono protetti dalla legge e non possono essere usati per fini commerciali.</p>',
      'it'
    ],
    [
      '<p id="t">Os dados são protegidos por lei e não podem ser usados para fins comerciais.</p>',
      'pt'
    ],
    [
      '<p id="t">De gegevens zijn wettelijk beschermd en mogen niet voor commerciële doeleinden worden gebruikt.</p>',
      'nl'
    ],
    // Text with an inline element: the element's whole own text counts.
    [
      `<p id="t">This website <a href="/c">uses cookies</a> to improve your experience and to measure the audience.</p>`,
      'en'
    ]
  ]) {
    const rule = assertRule(run(page(body)), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.match(occ.html, /id="t"/, body);
    assert.deepEqual(
      occ.data.details,
      { reasonCode: 'undeclaredLanguageChange', guessed, declared: 'fr' },
      body
    );
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: the language in effect is the nearest lang`, () => {
  // An English section whose French paragraph has no lang of its own.
  const html = page(
    '<section lang="en-GB"><p>The library is open from Tuesday to Saturday, and only in the morning during the holidays.</p>' +
      '<p id="t">Les inscriptions sont gratuites pour les habitants de la commune et pour les personnes qui y travaillent.</p></section>'
  );
  const rule = assertRule(run(html), RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /id="t"/);
  assert.deepEqual(rule.occurrences[0].data.details, {
    reasonCode: 'undeclaredLanguageChange',
    guessed: 'fr',
    declared: 'en-GB'
  });
});

test(`${RULE_ID}: passages with a right lang, names, short quotes, borrowed words and code are not applicable`, () => {
  for (const body of [
    // Bilingual page with lang on the passages.
    `<p lang="en">${EN_P}</p>`,
    `<div lang="en"><p>${EN_P}</p><ul><li>You can borrow up to ten items for three weeks and renew them once.</li></ul></div>`,
    `<p>Comme le dit le proverbe anglais : <span lang="en">${EN_P}</span></p>`,
    `<p xml:lang="en" lang="en">${EN_P}</p>`,
    // A French text with a few English words, names and technical terms.
    '<p>Abonnez-vous à notre newsletter pour suivre les actualités de la start-up et du meeting du week-end.</p>',
    '<p>Le serveur renvoie une erreur « 404 not found » quand la page est absente du cache.</p>',
    '<p>Comme le disait Steve Jobs : stay hungry, stay foolish, et ne jamais cesser d’apprendre.</p>',
    '<p>Le film The Lord of the Rings sort en salle ce mercredi.</p>',
    '<p>Rendez-vous à la Casa de la Música, avenida de la Constitución, pour le concert.</p>',
    // A name or the title of a work, in another language.
    '<h2>The Lord of the Rings: The Return of the King</h2>',
    '<p>Universidad Nacional Autónoma de México y Museo Nacional de Antropología</p>',
    // Too short.
    `<p>${'Read more about the project'}</p>`,
    // Seven words of English.
    '<p>Made with love in Paris by us</p>',
    // Code, preformatted text, form controls, hidden text.
    `<pre>${EN_P}</pre>`,
    `<p><code>${EN_P}</code></p>`,
    `<textarea>${EN_P}</textarea>`,
    `<button type="button">${EN_P}</button>`,
    `<p hidden>${EN_P}</p>`,
    `<p aria-hidden="true">${EN_P}</p>`
  ]) {
    assertRule(run(page(body)), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: no language in effect, an unknown one, or a page all in another language`, () => {
  const p = `<p>${EN_P}</p>`;
  // No lang: 8.3's matter; a language the guess does not know.
  assertRule(
    run(`<!doctype html><html><body>${FR_TEXT}${p}</body></html>`),
    RULE_ID,
    'notApplicable'
  );
  assertRule(run(page(p, 'ca')), RULE_ID, 'notApplicable');
  assertRule(run(page(`<div lang="">${p}</div>`)), RULE_ID, 'notApplicable');
  // The whole page is French under lang="en": rgaa-default-language-review asks.
  assertRule(run(page(FR_TEXT, 'en')), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: one occurrence per element, none for its parent`, () => {
  const html = page(
    `<div><blockquote><p id="a">${EN_P}</p><p id="b">${EN_P}</p></blockquote></div>`
  );
  const rule = assertRule(run(html), RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.deepEqual(
    rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]),
    ['a', 'b']
  );
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const html = page(`<p>${EN_P}</p>`);
  const rule = assertRule(
    run(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Ce texte semble écrit en « en », alors que la langue en vigueur ici est « fr ».'
  );
  const en = assertRule(run(html), RULE_ID, 'cantTell');
  assert.equal(
    en.occurrences[0].summary,
    'This text looks written in "en", while the language in effect here is "fr".'
  );
});

test(`${RULE_ID}: the map links it to 8.7.1; opt-in; the 8.7 rollup asks`, () => {
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['8.7.1']);
  const html = page(`<p>${EN_P}</p>`);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
  }
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-8.7').outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(run(fs.readFileSync(fixturePath, 'utf8')), RULE_ID, 'cantTell', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['lgc_case_01', 'lgc_case_02']);
});
