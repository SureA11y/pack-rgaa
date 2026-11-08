'use strict';

/**
 * rgaa-link-state-colors-review in a real browser. Where the page has a layout,
 * the rule puts each link in its visited, hover, active and focus states and
 * reads the colors, so it passes or fails what jsdom can only ask about. The
 * tests check those verdicts, that the page's selectors, attributes and focus
 * are put back, and the WCAG and RGAA rollups side by side under the RGAA
 * profile.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}

function findExecutable() {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

const executablePath = findExecutable();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

const RULE_ID = 'rgaa-link-state-colors-review';
// Core's browser bundle with the RGAA pack registered, every scan naming it.
const { BROWSER_BUNDLE: BUNDLE, rollupOutcome } = require('../../helpers/run.js');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);

// Surrounding text is black on white; #f60 contrasts 8.4:1 with it.
function page(css, body) {
  return `<!doctype html><html lang="fr"><head><title>t</title><style>body{color:#000;background:#fff} p a{color:#f60;text-decoration:none} ${css}</style></head><body><main>${body}</main><input id="field" aria-label="Champ"></body></html>`;
}
const LINK = '<p>Lire <a id="l" href="/x">la suite</a> ici.</p>';

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, engineOptions = { rules: { include: RULE_ID } }, setup) {
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      await p.addScriptTag({ content: BUNDLE });
      if (setup) await p.evaluate(setup);
      const selectors = () =>
        [...document.styleSheets].flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('\n');
      const before = await p.evaluate(selectors);
      await p.evaluate(() => {
        const f = document.getElementById('field');
        if (f) f.focus();
      });
      const result = await p.evaluate(
        (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
        engineOptions
      );
      const after = await p.evaluate(selectors);
      const state = await p.evaluate(() => ({
        marked: document.querySelectorAll('[data-surea11y-link-state]').length,
        active: document.activeElement && document.activeElement.id,
        ring: window.__ring || null
      }));
      assert.equal(after, before, 'the style rules are put back as they were');
      assert.equal(state.marked, 0, 'no state attribute is left behind');
      return { result, state };
    } finally {
      await p.close();
    }
  }

  const rule = (result) => result.checksResults.find((r) => r.ruleId === RULE_ID);
  const verdict = (result) => {
    const r = rule(result);
    return {
      outcome: r.outcome,
      findings: (r.occurrences || []).map((o) => [
        (String(o.html || '').match(/id="([^"]+)"/) || [])[1],
        o.occurrenceOutcome,
        o.data.details.reasonCode,
        o.data.details.states
      ])
    };
  };

  await t.test('the fixture', async () => {
    const { result } = await scan(FIXTURE);
    assert.deepEqual(verdict(result), {
      outcome: 'fail',
      findings: [
        ['lscr_case_01', 'fail', 'STATE_CONTRAST_LOW', ['visited']],
        // The focus rule changes the color too, but the browser's focus ring
        // still marks that state by more than color.
        ['lscr_case_02', 'fail', 'STATE_CONTRAST_LOW', ['hover']],
        ['lscr_case_03', 'cantTell', 'BROWSER_STATE_COLORS', []]
      ]
    });
  });

  await t.test('each state below 3:1 fails, and is named', async () => {
    for (const [css, states] of [
      ['a:visited{color:#333}', ['visited']],
      ['a:hover{color:#222}', ['hover']],
      ['a:active{color:#222}', ['active']],
      ['a:focus{color:#222;outline:none}', ['focus']],
      ['a:focus-visible{color:#222;outline:none}', ['focus']],
      // An author outline removed at rest, or in a cascade layer, removes
      // the browser's focus ring too.
      ['a{outline:0} a:focus{color:#222}', ['focus']],
      ['@layer base{a:focus{outline:none}} a:focus{color:#222}', ['focus']],
      // :hover on an ancestor matches while the link is hovered.
      ['p:hover a{color:#222}', ['hover']],
      // In the visited state :link no longer matches, wherever it sits.
      ['a:visited{color:#333} p a:link{color:#f60}', ['visited']],
      ['@media (min-width: 1px){a:hover{color:#222}}', ['hover']]
    ]) {
      const { result } = await scan(page(css, LINK));
      assert.deepEqual(
        verdict(result),
        {
          outcome: 'fail',
          findings: [['l', 'fail', 'STATE_CONTRAST_LOW', states]]
        },
        css
      );
    }
  });

  // #595959 on black is 2.998:1: below 3, so it fails, and it must not read 3.00.
  // A state's color is read at once, not at the start of the page's own
  // transition toward it (the freeze sheet is gone afterwards: the style
  // rules compare equal in scan()).
  await t.test('a color transition on the link does not hide its hover color', async () => {
    const page = (transition) =>
      `<!doctype html><html lang="fr"><head><title>t</title><style>body{color:#000;background:#fff} a{color:#4a90e2;text-decoration:none;${transition}} a:hover{color:#333}</style></head><body><main><p>Lisez <a id="l" href="/x">la notice</a> avant.</p></main></body></html>`;
    for (const transition of [
      '',
      'transition:color 2s linear',
      'transition:all 2s linear!important'
    ]) {
      const { result } = await scan(page(transition));
      assert.equal(rule(result).outcome, 'fail', transition || 'no transition');
    }
  });

  await t.test('a ratio just below 3 fails and reads 2.99', async () => {
    const { result } = await scan(page('a:hover{color:#595959}', LINK));
    const occ = rule(result).occurrences[0];
    assert.equal(occ.occurrenceOutcome, 'fail');
    assert.equal(occ.i18n.params.ratio, '2.99');
  });

  await t.test('states that keep 3:1, add a mark or keep the color pass', async () => {
    for (const css of [
      'a:hover,a:focus{color:#09f}',
      'a:hover{color:#222;text-decoration:underline}',
      'a:focus{color:#222}',
      'a:visited{color:#f60}',
      ''
    ]) {
      const { result, state } = await scan(page(css, LINK));
      assert.equal(rule(result).outcome, 'pass', css);
      assert.equal(state.active, 'field', 'focus goes back where it was');
    }
  });

  // The ring drawn at rest saves the browser a layout only where focus
  // draws an outline, so a tree whose styles remove it does without: the
  // document and #h3 here. #h1 and #h2, copies of one component, share one
  // probe. The verdicts are the same either way.
  await t.test('the ring at rest goes only where focus draws an outline', async () => {
    const links = (id) =>
      `<p>Lire <a id="${id}1" href="/1">la suite</a> ou <a id="${id}2" href="/2">ceci</a>.</p>`;
    const none = 'p a:focus{color:#222;outline:none}';
    const shadow = (id, css) =>
      `<div id="${id}"><template shadowrootmode="open"><style>p a{color:#f60;text-decoration:none} ${css}</style>${links(id)}</template></div>`;
    const html = page(
      none,
      `${links('d')}${shadow('h1', 'p a:focus{color:#222}')}${shadow('h2', 'p a:focus{color:#222}')}${shadow('h3', none)}`
    );
    const { result, state } = await scan(html, undefined, () => {
      window.__ring = [];
      const watch = (root) =>
        new MutationObserver((records) => {
          for (const r of records) {
            // The value the attribute had before this change.
            const v = r.oldValue || '';
            if (/\bring\b/.test(v) && !window.__ring.includes(r.target.id)) {
              window.__ring.push(r.target.id);
            }
          }
        }).observe(root, {
          subtree: true,
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ['data-surea11y-link-state']
        });
      watch(document);
      for (const id of ['h1', 'h2', 'h3']) watch(document.getElementById(id).shadowRoot);
    });
    assert.deepEqual(state.ring.sort(), ['h11', 'h12', 'h21', 'h22']);
    const states = Object.fromEntries(
      rule(result).occurrences.map((o) => [
        (o.html.match(/id="([^"]+)"/) || [])[1],
        o.data.details.states
      ])
    );
    assert.deepEqual(states, {
      d1: ['focus'],
      d2: ['focus'],
      h31: ['focus'],
      h32: ['focus']
    });
  });

  // A closed shadow root cannot be seen from a script, so a link in a
  // custom element goes without the ring drawn at rest, which would have
  // overridden its ::slotted rule and drawn an outline that rule removes.
  await t.test('a closed shadow root keeps its ::slotted rule', async () => {
    const shadow =
      '<style>::slotted(a){color:#f60;text-decoration:none} ::slotted(a:focus){outline:none}</style><slot></slot>';
    const html = page(
      'a:focus{color:#222}',
      `${LINK}<x-text id="xt">Voir <a id="s1" href="/s">ceci</a> puis.</x-text>` +
        `<script>document.getElementById('xt').attachShadow({ mode: 'closed' }).innerHTML = '${shadow}';</script>`
    );
    // #l keeps the ring, so its focus look is outlined and passes.
    const { result } = await scan(html);
    assert.deepEqual(verdict(result).findings, [['s1', 'fail', 'STATE_CONTRAST_LOW', ['focus']]]);
  });

  await t.test('jsdom asks about what the browser fails', async () => {
    const { runa11yCoreOnHtml } = require('../../helpers/run.js');
    const r = runa11yCoreOnHtml(page('a:hover{color:#222}', LINK), {
      runOnly: { includeRuleIds: [RULE_ID] }
    }).checksResults.find((x) => x.ruleId === RULE_ID);
    assert.equal(r.outcome, 'cantTell');
  });

  // A style sheet from another origin cannot be read, so the rule cannot
  // tell which rules it holds; the computed color still shows whether the
  // author set the link's color.
  await t.test('a style sheet from another origin: the computed color decides', async () => {
    async function scanCrossOrigin(sheet) {
      const p = await browser.newPage();
      try {
        await p.route('https://site.test/', (r) =>
          r.fulfill({
            contentType: 'text/html',
            body: `<!doctype html><html lang="fr"><head><title>t</title><link rel="stylesheet" href="https://cdn.test/site.css"></head><body><main>${LINK}</main></body></html>`
          })
        );
        await p.route('https://cdn.test/site.css', (r) =>
          r.fulfill({ contentType: 'text/css', body: sheet })
        );
        await p.goto('https://site.test/');
        await p.addScriptTag({ content: BUNDLE });
        return await p.evaluate(() =>
          window.a11ycore.runa11yCoreInPage(
            null,
            null,
            { rules: { include: 'rgaa-link-state-colors-review' } },
            null
          )
        );
      } finally {
        await p.close();
      }
    }
    const base = 'body{color:#222;background:#fff} a:visited{color:#111}';
    // The author's color: not the browser's, so the question is the sheet.
    assert.deepEqual(verdict(await scanCrossOrigin(`a{color:#000;text-decoration:none} ${base}`)), {
      outcome: 'cantTell',
      findings: [['l', 'cantTell', 'STYLESHEET_UNREADABLE', []]]
    });
    // The browser's own link color: its visited color applies too.
    assert.deepEqual(verdict(await scanCrossOrigin('a{text-decoration:none} body{color:#222}')), {
      outcome: 'cantTell',
      findings: [['l', 'cantTell', 'BROWSER_STATE_COLORS', []]]
    });
  });

  await t.test('under the RGAA profile: WCAG 1.4.1 does not fail, RGAA 10.6 does', async () => {
    const { result } = await scan(page('a:hover{color:#222}', LINK), {
      profile: 'rgaa-4.1.2-with-wcag'
    });
    const rollup = (id) => rollupOutcome(result.rulesResults.find((r) => r.ruleId === id));
    assert.equal(rule(result).outcome, 'fail');
    assert.notEqual(rollup('wcag-1.4.1-use-of-color'), 'fail');
    assert.equal(rollup('rgaa-4.1.2-10.6'), 'fail');
  });
});
