'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-quotation-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, lang = 'fr') {
  return `<!doctype html><html lang="${lang}"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const MALRAUX =
  'La culture ne s’hérite pas, elle se conquiert, et chaque génération doit la reconquérir.';

// 9.4.2: « chaque bloc de citation utilise-t-il une balise <blockquote> ? »
test(`${RULE_ID}: a block wholly in quotation marks is asked about (9.4.2)`, () => {
  for (const [body, sample] of [
    [`<p>« ${MALRAUX} »</p>`, MALRAUX],
    [`<p>«&nbsp;${MALRAUX}&nbsp;».</p>`, MALRAUX],
    [`<p>“${MALRAUX}”</p>`, MALRAUX],
    [`<li>"${MALRAUX}"</li>`, MALRAUX],
    [`<div>„${MALRAUX}“</div>`, MALRAUX],
    [`<p><em>« ${MALRAUX} »</em></p>`, MALRAUX]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.deepEqual(occ.data.details, { reasonCode: 'quotedBlock', sample }, body);
    assert.equal(occ.uncertainty.code, 'judgement-required');
    assert.match(occ.hint, /<blockquote>/);
  }
});

// 9.4.1: « chaque citation courte utilise-t-elle une balise <q> ? »
test(`${RULE_ID}: a passage of 8 words or more in running text is asked about (9.4.1)`, () => {
  for (const [body, sample] of [
    [
      '<p>Le maire a rappelé que « la médiathèque restera ouverte tout l’été, y compris le samedi matin » lors du conseil.</p>',
      'la médiathèque restera ouverte tout l’été, y compris le samedi matin'
    ],
    [
      '<p>She said “we will keep the library open all summer long” at the meeting.</p>',
      'we will keep the library open all summer long'
    ],
    [`<p>« ${MALRAUX} » — André Malraux</p>`, MALRAUX]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(
      rule.occurrences[0].data.details,
      { reasonCode: 'quotedPassage', sample },
      body
    );
    assert.match(rule.occurrences[0].hint, /<q>/);
  }
});

test(`${RULE_ID}: titles, terms, marked-up quotations, code, links, headings and hidden text are not applicable`, () => {
  for (const body of [
    '<p>Exposition « Les couleurs du port » jusqu’au 30 juin.</p>',
    '<p>Le terme « accessibilité numérique » désigne une pratique.</p>',
    '<p>« Bienvenue à la mairie »</p>',
    '<p>Lisez « Le Rouge et le Noir » et « Les Misérables » cet été.</p>',
    `<p>Le maire a dit : <q>${MALRAUX}</q></p>`,
    `<p><q>« ${MALRAUX} »</q></p>`,
    `<blockquote><p>« ${MALRAUX} »</p></blockquote>`,
    `<blockquote>« ${MALRAUX} »</blockquote>`,
    `<figure><blockquote><p>« ${MALRAUX} »</p></blockquote><figcaption>André Malraux</figcaption></figure>`,
    `<p><cite>« ${MALRAUX} »</cite></p>`,
    `<pre>« ${MALRAUX} »</pre>`,
    `<p><code>"${MALRAUX}"</code></p>`,
    `<p>Lire l’article <a href="/a">« Comment la ville prépare la transition énergétique d’ici 2030 »</a>.</p>`,
    `<h2>« ${MALRAUX} »</h2>`,
    `<textarea>« ${MALRAUX} »</textarea>`,
    `<p aria-hidden="true">« ${MALRAUX} »</p>`,
    `<p style="display:none">« ${MALRAUX} »</p>`,
    '<p>« Ouvert » le lundi, « fermé » le dimanche, « sur rendez-vous » le reste de la semaine.</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: one occurrence per element; nested blocks are read on their own`, () => {
  const html = page(
    `<div>Intro « ${MALRAUX} » et « ${MALRAUX} »<p>Le maire : « la médiathèque restera ouverte tout l’été, y compris le samedi »</p></div>`
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', {
    minOccurrences: 2,
    maxOccurrences: 2
  });
  assert.deepEqual(
    rule.occurrences.map((o) => o.data.details.reasonCode),
    ['quotedPassage', 'quotedPassage']
  );
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const html = page(`<p>« ${MALRAUX} »</p>`);
  const rule = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.equal(
    rule.occurrences[0].summary,
    `Ce bloc est entre guillemets (« ${MALRAUX} ») ; vérifiez s’il s’agit d’une citation.`
  );
  assert.equal(
    rule.occurrences[0].hint,
    'S’il cite une personne ou un texte, structurez-le avec un élément <blockquote> (RGAA 9.4.2).'
  );
});

test(`${RULE_ID}: a long sample is shortened`, () => {
  const long = Array.from({ length: 30 }, (_, i) => `mot${i}`).join(' ');
  const rule = assertRule(runa11yCoreOnHtml(page(`<p>« ${long} »</p>`), RUN), RULE_ID, 'cantTell');
  const { sample } = rule.occurrences[0].data.details;
  assert.ok(sample.length <= 100 && sample.endsWith('…'), sample);
});

test(`${RULE_ID}: the map links it to 9.4.1 and 9.4.2; opt-in`, () => {
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['9.4.1', '9.4.2']);
  const html = page(`<p>« ${MALRAUX} »</p>`);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
  }
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  const rollup = result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-9.4');
  assert.equal(rollup.outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['qtr_case_01', 'qtr_case_02']);
});
