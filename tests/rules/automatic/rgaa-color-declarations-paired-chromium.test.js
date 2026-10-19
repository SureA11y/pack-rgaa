'use strict';

/**
 * rgaa-color-declarations-paired in a real browser, where the whole cascade
 * (@media, var(), presentational attributes) is computed.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { BROWSER_BUNDLE } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-color-declarations-paired';

function page(css, body) {
  return `<!doctype html><html lang="fr"><head><title>t</title><style>${css}</style></head><body><main>${body}</main></body></html>`;
}

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  chromium = null;
}
const executablePath = (() => {
  if (!chromium) return null;
  const candidates = [];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  if (process.env.CHROMIUM_EXECUTABLE_PATH) candidates.push(process.env.CHROMIUM_EXECUTABLE_PATH);
  return candidates.find((p) => p && fs.existsSync(p)) || null;
})();
const skip = !chromium
  ? 'playwright not installed'
  : !executablePath
    ? 'no Chromium build found (set CHROMIUM_EXECUTABLE_PATH)'
    : false;

test(`${RULE_ID} in Chromium: computed colours`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  async function outcome(css, body, script) {
    const p = await browser.newPage();
    try {
      await p.setContent(page(css, body));
      if (script) await p.evaluate(script);
      await p.addScriptTag({ content: BROWSER_BUNDLE });
      const result = await p.evaluate(
        (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
        { rules: { include: RULE_ID } }
      );
      const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
      return [
        rule.outcome,
        rule.occurrences.map((o) => [
          o.data.details.reasonCode,
          (String(o.html || '').match(/id="([^"]+)"/) || [])[1] || null
        ])
      ];
    } finally {
      await p.close();
    }
  }

  // 10.5.1: a colour with no background colour, wherever the cascade sets it.
  assert.deepEqual(await outcome('', '<p id="a" style="color:#333">Texte</p>'), [
    'fail',
    [['colorWithoutBackground', 'a']]
  ]);
  assert.deepEqual(await outcome('@media screen { #a { color: #333 } }', '<p id="a">Texte</p>'), [
    'fail',
    [['colorWithoutBackground', 'a']]
  ]);
  assert.deepEqual(
    await outcome(':root { --c: #333 } #a { color: var(--c) }', '<p id="a">Texte</p>'),
    ['fail', [['colorWithoutBackground', 'a']]]
  );
  // Reported once, on the element that sets the colour.
  assert.deepEqual(
    await outcome(
      '',
      '<div id="a" style="color:#333"><p>Un</p><p>Deux <span>trois</span></p></div>'
    ),
    ['fail', [['colorWithoutBackground', 'a']]]
  );
  // A background on a positioned sibling or a ::before is not inherited.
  assert.deepEqual(
    await outcome(
      '.w{position:relative} .bg{position:absolute;inset:0;background:#fff} #a{position:relative;color:#333}',
      '<div class="w"><div class="bg"></div><p id="a">Texte</p></div>'
    ),
    ['fail', [['colorWithoutBackground', 'a']]]
  );
  assert.deepEqual(
    await outcome(
      '#a{position:relative;color:#333} #a::before{content:"";position:absolute;inset:0;background:#fff;z-index:-1}',
      '<p id="a">Texte</p>'
    ),
    ['fail', [['colorWithoutBackground', 'a']]]
  );

  // 10.5.3: a background image over text with no background colour.
  assert.deepEqual(
    await outcome(
      '#a { background-image: linear-gradient(#def, #fff) }',
      '<div id="a">Bienvenue</div>'
    ),
    ['fail', [['imageWithoutBackground', 'a']]]
  );

  // 10.5.2: a background colour over text left in the default black.
  assert.deepEqual(await outcome('', '<p id="a" style="background:#ffd">Texte</p>'), [
    'cantTell',
    [['backgroundWithoutColor', 'a']]
  ]);

  // Passes or is left out.
  for (const [css, body, script] of [
    ['body { background: #fff; color: #333 }', '<p>Texte</p>'],
    ['html { background: #fff } body { color: #333 }', '<p>Texte</p>'],
    ['', '<table bgcolor="#ffffff"><tr><td style="color:#333">Texte</td></tr></table>'],
    ['', '<p>Texte <a href="/x">lien</a> <mark>surligné</mark></p>'],
    ['', '<button type="button" style="color:#333">OK</button><input aria-label="x" value="v">'],
    ['', '<dialog open>Boîte de dialogue</dialog>'],
    [':root { color-scheme: dark }', '<p>Texte</p>'],
    [
      '#a { color: #333; text-indent: -9999px; background-image: url(logo.png) }',
      '<h1 id="a">Logo</h1>'
    ],
    [
      '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);color:#333}',
      '<span class="sr">Texte caché</span>'
    ],
    ['', '<p style="color:#333" hidden>Texte</p>'],
    [
      '',
      '<div id="host"><span style="color:#333">Texte</span></div>',
      () => {
        const root = document.getElementById('host').attachShadow({ mode: 'open' });
        root.innerHTML = '<div style="background:#fff"><slot></slot></div>';
      }
    ]
  ]) {
    assert.deepEqual(await outcome(css, body, script), ['notApplicable', []], css + body);
  }
});
