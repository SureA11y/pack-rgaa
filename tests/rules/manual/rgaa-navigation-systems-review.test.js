'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const { RGAA_RULE_TESTS } = require('../../../rule-map.js');

const RULE_ID = 'rgaa-navigation-systems-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, title = 'Mairie de Lunel') {
  return `<!doctype html><html lang="fr"><head><title>${title}</title></head><body>${body}</body></html>`;
}

const MENU =
  '<nav aria-label="Menu principal"><ul><li><a href="/actualites">Actualités</a></li><li><a href="/demarches">Démarches</a></li><li><a href="/contact">Contact</a></li></ul></nav>';
const HEADER_LIST =
  '<header><a href="/">Mairie</a><ul><li><a href="/actualites">Actualités</a></li><li><a href="/demarches">Démarches</a></li><li><a href="/agenda">Agenda</a></li></ul></header>';
const SITEMAP = '<footer><a href="/plan-du-site">Plan du site</a></footer>';
const SITEMAP_EN = '<footer><a href="/sitemap">Site map</a></footer>';
const SEARCH_FORM =
  '<form action="/recherche"><label for="q">Rechercher</label><input type="search" id="q" name="q"><button>OK</button></form>';
const SEARCH_ROLE =
  '<div role="search"><input type="text" aria-label="Mots-clés"><button>OK</button></div>';
const SEARCH_LABEL =
  '<form action="/r"><label>Rechercher sur le site <input type="text" name="terme"></label></form>';
const SEARCH_LINK = '<a href="/recherche">Rechercher</a>';
const SEARCH_BUTTON = '<button type="button" aria-label="Rechercher">🔍</button>';
const MAIN = '<main><h1>Accueil</h1><p>Bienvenue.</p></main>';

function found(html) {
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.match(occ.html, /^<body/);
  assert.equal(occ.data.details.reasonCode, 'fewerThanTwoSystems');
  assert.equal(occ.uncertainty.code, 'judgement-required');
  return occ.data.details.found;
}

// 12.1.1: each « ensemble de pages » has a menu and a site map, a menu and a
// search engine, or a search engine and a site map. One page cannot decide.
test(`${RULE_ID}: a page with fewer than two navigation systems is asked about once`, () => {
  for (const [body, expected] of [
    [MAIN, ''],
    [MENU + MAIN, 'menu'],
    [HEADER_LIST + MAIN, 'menu'],
    [MAIN + SITEMAP, 'siteMap'],
    [MAIN + SITEMAP_EN, 'siteMap'],
    [SEARCH_FORM + MAIN, 'search'],
    [SEARCH_ROLE + MAIN, 'search'],
    [SEARCH_LABEL + MAIN, 'search'],
    [SEARCH_LINK + MAIN, 'search'],
    [SEARCH_BUTTON + MAIN, 'search']
  ]) {
    assert.equal(found(page(body)), expected, body);
  }
});

test(`${RULE_ID}: breadcrumbs, paginations, skip links and footer links are not menus`, () => {
  for (const body of [
    '<nav aria-label="Fil d’Ariane"><a href="/">Accueil</a> <a href="/a">A</a> <a href="/a/b">B</a></nav>',
    '<nav class="breadcrumb"><a href="/">Accueil</a> <a href="/a">A</a> <a href="/a/b">B</a></nav>',
    '<nav aria-labelledby="p"><h2 id="p">Pagination</h2><a href="?p=1">1</a> <a href="?p=2">2</a> <a href="?p=3">3</a></nav>',
    '<nav><a href="#contenu">Contenu</a> <a href="#menu">Menu</a> <a href="#pied">Pied de page</a></nav>',
    '<footer><nav><a href="/mentions">Mentions légales</a> <a href="/accessibilite">Accessibilité</a> <a href="/cgu">CGU</a></nav></footer>',
    '<nav><a href="/a">A</a> <a href="/b">B</a></nav>',
    '<main><article><header><ul><li><a href="/a">A</a></li><li><a href="/b">B</a></li><li><a href="/c">C</a></li></ul></header></article></main>',
    '<template><nav><a href="/a">A</a> <a href="/b">B</a> <a href="/c">C</a></nav></template>'
  ]) {
    assert.equal(found(page(body)), '', body);
  }
});

test(`${RULE_ID}: a field that is not a search, and an XML site map, are not counted`, () => {
  for (const body of [
    '<form><label for="n">Nom</label><input type="text" id="n" name="nom"></form>',
    '<form><input type="email" name="search"></form>',
    '<a href="/sitemap.xml">sitemap.xml</a>'
  ]) {
    assert.equal(found(page(body)), '', body);
  }
});

test(`${RULE_ID}: two systems or more, or a step of a process, are not applicable`, () => {
  for (const html of [
    page(MENU + SEARCH_FORM + MAIN),
    page(HEADER_LIST + MAIN + SITEMAP),
    page(SEARCH_ROLE + MAIN + SITEMAP_EN),
    page(MENU + SEARCH_LINK + MAIN + SITEMAP),
    page(MAIN, 'Commande – étape 2 sur 4 : livraison'),
    page(
      '<form><label for="cc">Numéro de carte</label><input id="cc" autocomplete="cc-number"></form>'
    ),
    page('<form><input name="card_number"><input name="cvv"></form>')
  ]) {
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'notApplicable', html);
  }
});

test(`${RULE_ID}: messages follow the scan locale; the map links it to 12.1.1`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(MENU + MAIN), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette page présente un menu de navigation, mais ni lien vers le plan du site ni moteur de recherche.'
  );
  const en = assertRule(runa11yCoreOnHtml(page(MAIN), RUN), RULE_ID, 'cantTell');
  assert.equal(
    en.occurrences[0].summary,
    'This page shows no navigation menu, site map link or search engine.'
  );
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['12.1.1']);
  const result = runa11yCoreOnHtml(page(MENU + MAIN), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-12.1').outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  // One question for the whole page: only the menu of case 01 counts.
  assert.equal(rule.occurrences[0].data.details.found, 'menu');
});

// A page-level question cannot be asked of part of a page: a scan with a
// contextSelector or a fragment leaves it alone, as the pack's other
// page-level rules do.
test(`${RULE_ID}: notApplicable on a scoped run or a fragment`, () => {
  const html = page(MAIN);
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell');
  assertRule(
    runa11yCoreOnHtml(html, { ...RUN, contextSelector: 'body' }),
    RULE_ID,
    'notApplicable'
  );
  assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { fragment: true } }),
    RULE_ID,
    'notApplicable'
  );
});

// The occurrences a body gives, in English or in the locale asked.
function messagesOf(body, locale) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
    { ...RUN, ...(locale ? { engineOptions: { locale } } : {}) }
  );
  return result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences;
}

test(`${RULE_ID}: the <nav> it does not count is named, with the reason`, () => {
  const [footer] = messagesOf(
    '<p>x</p></main><footer><nav class="footer-links"><a href="/a">a</a><a href="/b">b</a><a href="/c">c</a></nav></footer><main>'
  );
  assert.equal(footer.i18n.hintKey, 'navigationSystemsReview_hint_cantTell_skipped_inFooter');
  assert.match(
    footer.hint,
    /^The <nav class="footer-links"> is in the page footer, so it is not counted as a navigation menu\. Check/
  );
  const [few] = messagesOf('<nav><a href="/a">a</a></nav>');
  assert.equal(few.i18n.hintKey, 'navigationSystemsReview_hint_cantTell_skipped_fewLinks');
  assert.deepEqual(few.data.details.notCounted, { reason: 'fewLinks', nav: '<nav>', count: 1 });
  const [search] = messagesOf(
    '<nav><a href="/a">a</a><a href="/b">b</a><a href="/c">c</a></nav><input type="text" name="q">'
  );
  assert.equal(search.i18n.hintKey, 'navigationSystemsReview_hint_cantTell_skipped_search');
  assert.match(search.hint, /^The <input name="q"> looks like a search field/);
});
