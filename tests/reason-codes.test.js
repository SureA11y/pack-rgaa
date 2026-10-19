'use strict';

/**
 * RGAA files some of core's findings by reason code (rule-map.js
 * `reasonCodes`): a cause that WCAG fails is asked about under an RGAA test,
 * or counts toward another test, or toward none. Each case checks the RGAA
 * rollup, and that the core rule's own outcome is unchanged.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml, runa11yCoreOnDom, createDom } = require('./helpers/run.js');
const { rgaaComposites } = require('../mappings.js');

const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };
const page = (body, lang = 'fr') =>
  `<!doctype html><html${lang ? ` lang="${lang}"` : ''}><head><title>t</title></head><body>${body}</body></html>`;
const IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

const outcomes = (result) => ({
  rollup: (id) => (result.rulesResults.find((r) => r.ruleId === `rgaa-4.1.2-${id}`) || {}).outcome,
  rule: (id) => (result.checksResults.find((r) => r.ruleId === id) || {}).outcome
});

test('9.3 asks about <li role="presentation"> in a list, and still fails other stray children', () => {
  const pager = page(
    '<main><ul><li role="presentation"><a href="/1">1</a></li><li role="presentation"><a href="/2">2</a></li></ul></main>'
  );
  const r = outcomes(runa11yCoreOnHtml(pager, RGAA));
  assert.equal(r.rule('list-children-valid'), 'fail');
  assert.equal(r.rollup('9.3'), 'cantTell');
  const stray = page('<main><ul><div><a href="/1">1</a></div><li>2</li></ul></main>');
  assert.equal(outcomes(runa11yCoreOnHtml(stray, RGAA)).rollup('9.3'), 'fail');
});

test('9.3 asks about a plain <li> in a list with a widget role', () => {
  const tabs = page('<main><ul role="tablist"><li><a role="tab" href="#a">A</a></li></ul></main>');
  const r = outcomes(runa11yCoreOnHtml(tabs, RGAA));
  assert.equal(r.rule('listitem-parent-valid'), 'fail');
  assert.equal(r.rollup('9.3'), 'cantTell');
  const loose = page('<main><div><li>Seul</li></div></main>');
  assert.equal(outcomes(runa11yCoreOnHtml(loose, RGAA)).rollup('9.3'), 'fail');
});

test('8.2 asks about duplicate ids inside one shadow tree, and fails them in the document', () => {
  const dom = createDom(page('<main><div id="host"></div></main>'));
  const root = dom.window.document.getElementById('host').attachShadow({ mode: 'open' });
  root.innerHTML = '<p id="a">1</p><p id="a">2</p>';
  const r = outcomes(runa11yCoreOnDom(dom, RGAA));
  assert.equal(r.rule('duplicate-id'), 'fail');
  assert.equal(r.rollup('8.2'), 'cantTell');
  const doc = page('<main><p id="a">1</p><p id="a">2</p></main>');
  assert.equal(outcomes(runa11yCoreOnHtml(doc, RGAA)).rollup('8.2'), 'fail');
});

test('an invalid default language on <body> fails 8.4, not 8.8', () => {
  const html = page('<main><p>Bonjour</p></main>', '').replace(
    '<body>',
    '<body lang="zz-invalid-1">'
  );
  const r = outcomes(runa11yCoreOnHtml(html, RGAA));
  assert.equal(r.rule('valid-lang'), 'fail');
  assert.equal(r.rollup('8.4'), 'fail');
  assert.notEqual(r.rollup('8.8'), 'fail');
  // A change of language inside the page still fails 8.8.
  const change = page('<main><p>Bonjour <span lang="zz-invalid-1">x</span></p></main>');
  assert.equal(outcomes(runa11yCoreOnHtml(change, RGAA)).rollup('8.8'), 'fail');
});

test("a link's or button's only image is not judged under theme 1", () => {
  const html = page(
    `<main><a href="/"><img src="${IMG}" width="40" height="40" alt="Accueil"></a><button type="button"><svg role="img" aria-label="Fermer" width="20" height="20"></svg></button></main>`
  );
  const r = outcomes(runa11yCoreOnHtml(html, RGAA));
  assert.equal(r.rule('img-alt-quality'), 'cantTell');
  for (const id of ['1.1', '1.2', '1.3']) assert.notEqual(r.rollup(id), 'cantTell', id);
  // An image beside text in the link is still asked about.
  const beside = page(
    `<main><a href="/r.pdf">Rapport <img src="${IMG}" width="16" height="16" alt="PDF"></a></main>`
  );
  assert.equal(outcomes(runa11yCoreOnHtml(beside, RGAA)).rollup('1.3'), 'cantTell');
});

test('rollups carry the reason-code contributions of their rules', () => {
  const c93 = rgaaComposites().find((c) => c.id === 'rgaa-4.1.2-9.3');
  assert.deepEqual(c93.meta.contributions['list-children-valid'], {
    default: 'count',
    codes: { LIST_ITEM_ROLE_OVERRIDDEN: 'cantTell' }
  });
  const c84 = rgaaComposites().find((c) => c.id === 'rgaa-4.1.2-8.4');
  assert.deepEqual(c84.meta.contributions['valid-lang'], {
    default: 'ignore',
    codes: { DEFAULT_LANG_INVALID: 'count' }
  });
  const c88 = rgaaComposites().find((c) => c.id === 'rgaa-4.1.2-8.8');
  assert.deepEqual(c88.meta.contributions['valid-lang'].codes, { DEFAULT_LANG_INVALID: 'ignore' });
});

test('9.1 does not ask about a paragraph that is only a number, and still asks about a link-only one', () => {
  const css = '<style>.k{font-size:32px;font-weight:700}</style>';
  const html = (body) => page(body).replace('</head>', `${css}</head>`);
  const figure = outcomes(
    runa11yCoreOnHtml(
      html('<main><h1>Bilan</h1><p class="k">12 000</p><p>habitants accompagnés.</p></main>'),
      RGAA
    )
  );
  assert.equal(figure.rule('p-as-heading'), 'cantTell');
  assert.notEqual(figure.rollup('9.1'), 'cantTell');
  const card = outcomes(
    runa11yCoreOnHtml(
      html(
        '<main><h1>Actualités</h1><p class="k"><a href="/a">Rénovation de la médiathèque</a></p><p>Les travaux commencent.</p></main>'
      ),
      RGAA
    )
  );
  assert.equal(card.rollup('9.1'), 'cantTell');
});
