'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-link-title-content-name';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const img = (alt) => `<img src="${IMG}" width="40" height="40" alt="${alt}">`;

// Glossary « Intitulé (ou nom accessible) de lien », note 2: a link whose
// title does not repeat at least its name from content is « non-explicite ».
test(`${RULE_ID}: an image link whose title drops the alternative fails 6.1.2`, () => {
  for (const [body, name] of [
    [
      `<a href="/" title="Accueil">${img("Retour à la page d'accueil")}</a>`,
      "Retour à la page d'accueil"
    ],
    [`<a href="/" title="Logo">${img('Mairie')}${img('de Lyon')}</a>`, 'Mairie de Lyon'],
    [
      `<a href="/" title="Accueil"><svg role="img" aria-label="Page d'accueil" width="20" height="20"></svg></a>`,
      "Page d'accueil"
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const d = rule.occurrences[0].data.details;
    assert.deepEqual([d.reasonCode, d.name, d.test], ['imageLinkTitle', name, '6.1.2'], body);
  }
});

test(`${RULE_ID}: a title that contains the name passes, ignoring case and punctuation`, () => {
  for (const body of [
    `<a href="/" title="Retour à la page d'accueil du site">${img("Retour à la page d'accueil")}</a>`,
    `<a href="/" title="ACCUEIL - Mairie">${img('Accueil')}</a>`,
    `<a href="/r.pdf" title="Rapport annuel (PDF, 2 Mo)">Rapport annuel ${img('PDF')}</a>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', body);
  }
});

// A composite link's title must hold its text and the alternative of each
// of its images, in any order, punctuation and capital letters aside.
test(`${RULE_ID}: a composite link whose title keeps the text but drops the image fails 6.1.3`, () => {
  for (const [body, name] of [
    [`<a href="/r.pdf" title="Rapport annuel">Rapport annuel ${img('PDF')}</a>`, 'PDF'],
    [
      `<a href="/r.pdf" title="Rapport annuel (PDF)">Rapport annuel ${img('Fichier PDF')}</a>`,
      'Fichier PDF'
    ],
    [
      `<a href="/p" title="Plan d'accès, PDF">${img('PDF')} Plan d'accès ${img('Nouvelle fenêtre')}</a>`,
      'Nouvelle fenêtre'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const d = rule.occurrences[0].data.details;
    assert.deepEqual([d.reasonCode, d.name, d.test], ['compositeLinkTitle', name, '6.1.3'], body);
  }
});

test(`${RULE_ID}: a composite link whose title holds its text and each alternative in any order passes`, () => {
  for (const body of [
    `<a href="/r.pdf" title="Rapport annuel, PDF">${img('PDF')} Rapport annuel</a>`,
    `<a href="/r.pdf" title="PDF : rapport annuel">Rapport annuel ${img('PDF')}</a>`,
    `<a href="/p" title="Plan d'accès (PDF, nouvelle fenêtre)">${img('Nouvelle fenêtre')} Plan d'accès ${img('PDF')}</a>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', body);
  }
});

test(`${RULE_ID}: a composite link whose title drops only a one-character alternative is asked about`, () => {
  for (const alt of ['i', 'B']) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(`<a href="/aide" title="Aide">Aide ${img(alt)}</a>`), RUN),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    const d = rule.occurrences[0].data.details;
    assert.deepEqual([d.reasonCode, d.test], ['compositeSymbolAlternative', '6.1.3'], alt);
    assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  }
  // A punctuation alternative ("»") is set aside with punctuation: the
  // title holds the rest of the name, and the link passes.
  assertRule(
    runa11yCoreOnHtml(page(`<a href="/s" title="Suivant">Suivant ${img('»')}</a>`), RUN),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: a one-character alternative is asked about`, () => {
  for (const alt of ['>', 'B']) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(`<a href="/s" title="Page suivante">${img(alt)}</a>`), RUN),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'symbolAlternative', alt);
  }
});

test(`${RULE_ID}: text links, links without title, unclear content and hidden links are not applicable`, () => {
  for (const body of [
    '<a href="/c" title="Nous écrire">Contact</a>',
    `<a href="/">${img('Accueil')}</a>`,
    `<a href="/" title="Accueil">${img('')}</a>`,
    `<a href="/r.pdf" title="Annuel">Rapport annuel ${img('PDF')}</a>`,
    `<a href="/" title="Accueil">${img('Mairie')}<span aria-hidden="true">Mairie de Lyon</span></a>`,
    `<a href="/" title="Accueil" style="display:none">${img('Mairie')}</a>`,
    `<a href="/" title="Accueil" aria-hidden="true">${img('Mairie')}</a>`
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: messages follow the scan locale; the map links it to 6.1.2 and 6.1.3`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(`<a href="/" title="Accueil">${img('Mairie')}</a>`), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Le title de ce lien image (« Accueil ») ne contient pas l’alternative textuelle de son image (« Mairie »).'
  );
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['6.1.2', '6.1.3']);
});

test(`${RULE_ID}: opt-in, and RGAA 6.1 fails under the profile`, () => {
  const html = page(`<a href="/" title="Accueil">${img('Mairie')}</a>`);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
  }
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } });
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-6.1').outcome, 'fail');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome,
    o.data.details.reasonCode
  ]);
  assert.deepEqual(got, [
    ['ltc_case_01', 'fail', 'imageLinkTitle'],
    ['ltc_case_02', 'fail', 'compositeLinkTitle'],
    ['ltc_case_05', 'cantTell', 'compositeSymbolAlternative']
  ]);
});
