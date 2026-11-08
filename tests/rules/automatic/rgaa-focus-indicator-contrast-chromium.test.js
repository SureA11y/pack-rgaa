'use strict';

/**
 * rgaa-focus-indicator-contrast in a real browser. Where the page has a layout
 * the rule focuses each element and measures what Chromium draws, against
 * what is painted next to it, so it settles cases jsdom can only ask about
 * (variables, @media, a positioned layer behind the element). The tests
 * check those verdicts, that focus and the style attribute are put back,
 * and the WCAG and RGAA rollups side by side under the RGAA profile.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

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

const RULE_ID = 'rgaa-focus-indicator-contrast';
// Core's browser bundle with the RGAA pack registered, every scan naming it.
const { BROWSER_BUNDLE: BUNDLE } = require('../../helpers/run.js');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);

function summarize(result) {
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  return {
    outcome: rule.outcome,
    findings: (rule.occurrences || []).map((o) => [
      (String(o.html || '').match(/id="([^"]+)"/) || [])[1],
      o.occurrenceOutcome,
      o.data.details.reasonCode
    ])
  };
}

// Each case sits in its own white block with room around it, so every side
// of the indicator is measured against the block it belongs to.
const PAGE = `<!doctype html><html lang="en"><head><title>t</title><style>
  :root { --low: #dddddd; --high: #000000; }
  body { margin: 0; background: #ffffff; }
  .case { padding: 30px; }
  #var_low:focus { outline: 2px solid var(--low); }
  #var_high:focus { outline: 2px solid var(--high); }
  @media (min-width: 1px) { #media_low:focus { outline: 2px solid #eeeeee; } }
  .layer { position: relative; }
  .layer .back { position: absolute; inset: 0; background: #111111; }
  #layer_dark { position: relative; color: #ffffff; }
  #layer_dark:focus { outline: 2px solid #222222; }
  .grad { background: linear-gradient(#ffffff, #000000); }
  #grad:focus { outline: 2px solid #cccccc; }
  #slow { transition: box-shadow 2s; }
  #slow:focus { outline: none; box-shadow: 0 0 0 3px #f0f0f0; }
  #styled:focus { outline: 2px solid #000000; }
</style></head><body>
  <div class="case"><a id="var_low" href="/1">One</a></div>
  <div class="case"><a id="var_high" href="/2">Two</a></div>
  <div class="case"><a id="media_low" href="/3">Three</a></div>
  <div class="case layer"><div class="back"></div><a id="layer_dark" href="/4">Four</a></div>
  <div class="case grad"><a id="grad" href="/5">Five</a></div>
  <div class="case"><button id="slow" type="button">Six</button></div>
  <div class="case"><a id="styled" href="/7" style="color: #333333">Seven</a></div>
  <div class="case"><input id="field" aria-label="Field"></div>
</body></html>`;

const outcomes = (result) =>
  Object.fromEntries(
    (result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences || []).map((o) => [
      (String(o.html || '').match(/id="([^"]+)"/) || [])[1],
      [o.occurrenceOutcome, o.data.details.reasonCode]
    ])
  );

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  async function scan(html, engineOptions, before) {
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      await p.addScriptTag({ content: BUNDLE });
      if (before) await p.evaluate(before);
      const result = await p.evaluate(
        (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
        engineOptions
      );
      const after = await p.evaluate(() => ({
        active: document.activeElement && document.activeElement.id,
        style: document.getElementById('styled')
          ? document.getElementById('styled').getAttribute('style')
          : null,
        bare:
          !!document.getElementById('var_low') &&
          document.getElementById('var_low').hasAttribute('style'),
        ring: window.__ring || null
      }));
      return { result, after };
    } finally {
      await p.close();
    }
  }

  await t.test('the fixture: what jsdom fails still fails', async () => {
    const { result } = await scan(FIXTURE, { rules: { include: RULE_ID } });
    assert.deepEqual(summarize(result), {
      outcome: 'fail',
      findings: [
        ['fic_case_01', 'fail', 'lowContrast'],
        ['fic_case_02', 'fail', 'lowContrast'],
        ['fic_case_03', 'fail', 'lowContrast'],
        ['fic_case_06', 'cantTell', 'notComputable'],
        // Case 07's variable is never defined, so Chromium drops the whole
        // outline declaration: the focus rule removes the outline with
        // nothing in its place, which is css-focus-indicator-suppressed's case.
        ['fic_case_08', 'cantTell', 'oneSide'],
        ['fic_case_09', 'cantTell', 'notMeasured']
      ]
    });
  });

  await t.test('rendered values settle what the stylesheets alone cannot', async () => {
    const { result, after } = await scan(PAGE, { rules: { include: RULE_ID } }, () =>
      document.getElementById('field').focus()
    );
    assert.deepEqual(outcomes(result), {
      var_low: ['fail', 'lowContrast'],
      media_low: ['fail', 'lowContrast'],
      // White page around it, but a dark layer is painted right behind it.
      layer_dark: ['fail', 'lowContrast'],
      grad: ['cantTell', 'notComputable'],
      // Measured at its end value, not halfway through the transition.
      slow: ['fail', 'lowContrast']
    });
    // var_high and styled pass: black on white.
    assert.equal(after.active, 'field', 'focus goes back where it was');
    assert.equal(after.style, 'color: #333333', 'the style attribute is put back');
    assert.equal(after.bare, false, 'no style attribute is left on an element that had none');
  });

  // Each was failed on a real page with colors nobody sees: a cookie consent
  // overlay read as the background (lcl.fr), a ::before painting the
  // button's visible fill (bordeaux.fr), and below the fold, a parent with
  // the button's own box read as what is around it (insee.fr).
  const details = (result, elementId) =>
    result.checksResults
      .find((r) => r.ruleId === RULE_ID)
      .occurrences.find((o) => o.html.includes(`id="${elementId}"`)).data.details;

  await t.test('colors the indicator is not seen against are not measured', async () => {
    const html = `<!doctype html><html lang="en"><head><title>t</title><style>
      body { margin: 0; background: #f9f9f9; }
      .case { padding: 30px; }
      button:focus { outline: 2px solid #525252; outline-offset: 2px; }
      #covered { background: transparent; border: 0; }
      #consent { position: relative; }
      #overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); }
      #pill { position: relative; z-index: 0; background: #ffcc00; color: #ffffff; border: 0; }
      #pill::before { content: ''; position: absolute; inset: 0; z-index: -1; background: #2b2a2a; }
      #pill:focus { outline: 2px solid #3d86d8; }
      #spacer { height: 2000px; }
      ul { list-style: none; margin: 0; padding: 0; background: #f7f7f7; }
      li { background: #3467ae; }
      #below { display: block; width: 100%; background: #3467ae; color: #fff; border: 0; }
      #below:focus { outline: 2px solid #81888a; }
    </style></head><body>
      <div class="case" id="consent"><button id="covered" type="button">Menu</button><div id="overlay"></div></div>
      <div class="case" style="background: #ffcc00"><button id="pill" type="button">Personnaliser</button></div>
      <div id="spacer"></div>
      <div class="case"><ul><li><button id="below" type="button">Thème</button></li></ul></div>
    </body></html>`;
    const { result } = await scan(html, { rules: { include: RULE_ID } });
    const found = outcomes(result);
    assert.deepEqual(found.covered, ['cantTell', 'notComputable']);
    assert.deepEqual(found.pill, ['cantTell', 'notComputable']);
    assert.notEqual(details(result, 'pill').cause, 'covered');
    // Around the list, #f7f7f7 gives 3.4:1, so one side reaches 3:1.
    assert.notEqual((found.below || [])[0], 'fail', JSON.stringify(found.below));
    assert.equal(details(result, 'covered').cause, 'covered');
  });

  // RGAA 10.7.1 asks that a focus style be visible, not that it be drawn on
  // the element's own box: a ring on a wrapper or a label is not measured
  // here, so a faint outline beside it is asked about, not failed.
  await t.test('a ring drawn on a wrapper or a label is asked about', async () => {
    const field = (css) =>
      `<!doctype html><html lang="en"><head><title>t</title><style>html,body{background:#fff;color:#000} input:focus{outline:1px solid #eee} ${css}</style></head><body><main><div class="wrap"><label for="f" id="l">Name</label><input id="f"></div></main></body></html>`;
    for (const css of [
      '.wrap:focus-within{box-shadow:0 0 0 3px #000}',
      '.wrap:has(input:focus-visible){outline:3px solid #000}',
      '.wrap:focus-within label{text-decoration:underline;color:#c00}'
    ]) {
      const { result } = await scan(field(css), { rules: { include: RULE_ID } });
      assert.deepEqual(
        summarize(result),
        { outcome: 'cantTell', findings: [['f', 'cantTell', 'notMeasured']] },
        css
      );
    }
    const { result } = await scan(field(''), { rules: { include: RULE_ID } });
    assert.equal(summarize(result).outcome, 'fail');
  });

  // An element in a shadow tree is hit tested in its own shadow root: the
  // document's hit test stops at the host, which read as something painted
  // over the element, so every one was asked about. Its root sees its tree
  // and every tree around it, so a cover in any of them still counts.
  await t.test('in shadow trees, indicators are measured', async () => {
    const css =
      '.case{position:relative;padding:30px} a{color:#000} .cover{position:absolute;inset:0;background:rgba(0,0,0,.5)}';
    const html = `<!doctype html><html lang="en"><head><title>t</title><style>body{margin:0;background:#fff} ${css}</style></head><body>
      <div id="h"><template shadowrootmode="open"><style>${css}
        #low:focus{outline:2px solid #dddddd} #high:focus,#under:focus{outline:2px solid #000000}
        .back{position:absolute;inset:0;background:#111111} #dark{position:relative;color:#fff}
        #dark:focus{outline:2px solid #222222}</style>
        <div class="case"><a id="low" href="/1">One</a></div>
        <div class="case"><a id="high" href="/2">Two</a></div>
        <div class="case"><div class="back"></div><a id="dark" href="/3">Three</a></div>
        <div class="case"><a id="under" href="/4">Four</a><div class="cover"></div></div>
        <div class="case"><div><template shadowrootmode="open"><style>#deep:focus,#deeper:focus{outline:2px solid #dddddd}</style><a id="deep" href="/5">Five</a></template></div></div>
        <div class="case"><div><template shadowrootmode="open"><style>#deeper:focus{outline:2px solid #dddddd}</style><a id="deeper" href="/6">Six</a></template></div><div class="cover"></div></div>
      </template></div>
      <div class="case"><div><template shadowrootmode="open"><style>#outer:focus{outline:2px solid #dddddd}</style><a id="outer" href="/7">Seven</a></template></div><div class="cover"></div></div>
    </body></html>`;
    const { result } = await scan(html, { rules: { include: RULE_ID } });
    assert.deepEqual(outcomes(result), {
      low: ['fail', 'lowContrast'],
      // A dark layer is painted right behind it, in its own tree.
      dark: ['fail', 'lowContrast'],
      // Covered in its own tree, in the tree around it, in the document.
      under: ['cantTell', 'notComputable'],
      deep: ['fail', 'lowContrast'],
      deeper: ['cantTell', 'notComputable'],
      outer: ['cantTell', 'notComputable']
    });
    for (const id of ['under', 'deeper', 'outer']) {
      assert.equal(details(result, id).cause, 'covered', id);
    }
    // #222222 against #111111 on both sides, read in the shadow tree.
    assert.deepEqual(details(result, 'dark').ratios, [1.19, 1.19]);
  });

  // The ring drawn at rest saves the browser a layout only where focus
  // draws an outline, so a tree whose styles remove it does without: the
  // document and #h3 here. #h1 and #h2, copies of one component, share one
  // probe. The verdicts are the same either way.
  await t.test('the ring at rest goes only where focus draws an outline', async () => {
    const tree = (css) =>
      `<style>a{color:#000} ${css}</style><p><a id="$1" href="/1">One</a> <a id="$2" href="/2">Two</a></p>`;
    const none = 'a:focus{outline:none;box-shadow:0 0 0 2px #dddddd}';
    const shadow = (id, css) =>
      `<div id="${id}"><template shadowrootmode="open">${tree(css).replace(/\$/g, id)}</template></div>`;
    const html = `<!doctype html><html lang="en"><head><title>t</title><style>body{background:#fff}</style></head><body>${tree(none).replace(/\$/g, 'd')}${shadow('h1', '')}${shadow('h2', '')}${shadow('h3', none)}</body></html>`;
    const { result, after } = await scan(html, { rules: { include: RULE_ID } }, () => {
      window.__ring = { doc: false, roots: [] };
      new MutationObserver((records) => {
        for (const r of records) {
          for (const n of r.addedNodes) {
            if (String(n.textContent).includes('surea11y-focus-ring')) window.__ring.doc = true;
          }
        }
      }).observe(document.head, { childList: true });
      const own = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, 'adoptedStyleSheets');
      for (const id of ['h1', 'h2', 'h3']) {
        Object.defineProperty(document.getElementById(id).shadowRoot, 'adoptedStyleSheets', {
          configurable: true,
          get() {
            return own.get.call(this);
          },
          set(v) {
            const ring = [...v].some((s) =>
              [...s.cssRules].some((x) => x.cssText.includes('surea11y-focus-ring'))
            );
            if (ring && !window.__ring.roots.includes(id)) window.__ring.roots.push(id);
            own.set.call(this, v);
          }
        });
      }
    });
    assert.deepEqual(after.ring, { doc: false, roots: ['h1', 'h2'] });
    assert.deepEqual(outcomes(result).d1, ['fail', 'lowContrast']);
    assert.deepEqual(outcomes(result).d2, ['fail', 'lowContrast']);
  });

  await t.test('the same elements in jsdom are asked about, not failed', () => {
    const rule = runa11yCoreOnHtml(PAGE, {
      runOnly: { includeRuleIds: [RULE_ID] }
    }).checksResults.find((r) => r.ruleId === RULE_ID);
    const tiers = Object.fromEntries(
      rule.occurrences.map((o) => [(o.html.match(/id="([^"]+)"/) || [])[1], o.occurrenceOutcome])
    );
    assert.equal(tiers.var_low, 'cantTell');
    assert.equal(tiers.media_low, 'cantTell');
  });

  await t.test('under the RGAA profile: WCAG 2.4.7 does not fail, RGAA 10.7 does', async () => {
    const html = PAGE.replace(
      /<body>[\s\S]*<\/body>/,
      '<body><div class="case"><a id="var_low" href="/1">One</a></div></body>'
    );
    const { result } = await scan(html, { profile: 'rgaa-4.1.2-with-wcag' });
    const rollup = (id) => result.rulesResults.find((r) => r.ruleId === id);
    assert.equal(result.checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'fail');
    assert.notEqual(rollupOutcome(rollup('wcag-2.4.7-focus-visible')), 'fail');
    assert.equal(rollupOutcome(rollup('rgaa-4.1.2-10.7')), 'fail');
  });
});
