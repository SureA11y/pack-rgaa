'use strict';

/**
 * rgaa-css-colors-paired in a real browser, where the cascade says what an
 * author declared: a style sheet from another origin, which a script cannot
 * read, counts like any other, and the page's colors and transitions are as
 * they were once the rule has run.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

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

const RULE_ID = 'rgaa-css-colors-paired';
const { BROWSER_BUNDLE: BUNDLE } = require('../../helpers/run.js');

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  // The page at one origin, its style sheet at another.
  async function scan(html, sheet = '') {
    const p = await browser.newPage();
    try {
      await p.route('https://site.test/', (r) =>
        r.fulfill({ contentType: 'text/html', body: html })
      );
      await p.route('https://cdn.test/site.css', (r) =>
        r.fulfill({ contentType: 'text/css', body: sheet })
      );
      await p.goto('https://site.test/');
      await p.addScriptTag({ content: BUNDLE });
      const result = await p.evaluate(() =>
        window.a11ycore.runa11yCoreInPage(
          null,
          null,
          { rules: { include: 'rgaa-css-colors-paired' } },
          null
        )
      );
      return result.checksResults.find((r) => r.ruleId === RULE_ID);
    } finally {
      await p.close();
    }
  }
  const doc = (head, body = '<p>Texte</p>') =>
    `<!doctype html><html lang="fr"><head><title>t</title>${head}</head><body>${body}</body></html>`;

  await t.test('a style sheet the page cannot read counts, through the cascade', async () => {
    const link = '<link rel="stylesheet" href="https://cdn.test/site.css">';
    const paired = await scan(doc(`${link}<style>p{color:#555}</style>`), 'body{background:#fff}');
    assert.equal(paired.outcome, 'pass');
    const unpaired = await scan(doc(link), 'p{color:#555}');
    assert.equal(unpaired.outcome, 'fail');
    assert.deepEqual(
      unpaired.occurrences.map((o) => o.data.details.reasonCode),
      ['COLOR_WITHOUT_BACKGROUND']
    );
  });

  await t.test('the browser’s own colors are not declarations', async () => {
    const rule = await scan(
      doc('', '<p>Texte <a href="/x">lien</a> <button>Bouton</button> <mark>m</mark></p>')
    );
    assert.equal(rule.outcome, 'notApplicable');
  });

  // The sentinel must never reach another rule. rgaa-link-state-colors-review
  // runs after this one and reads the link's computed colors in each state.
  await t.test('a rule reading colors after this one finds the same', async () => {
    const html = doc(
      '<style>body{background:#fff} p{color:#000} p a{color:#b00000;text-decoration:none;transition:color 1s} a:hover{color:#555}</style>',
      '<p>Du texte avec <a href="/x">un lien</a> dans la phrase.</p>'
    );
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      await p.addScriptTag({ content: BUNDLE });
      const both = await p.evaluate(async () => {
        const run = async (include) =>
          (
            await window.a11ycore.runa11yCoreInPage(null, null, { rules: { include } }, null)
          ).checksResults
            .filter((r) => r.ruleId === 'rgaa-link-state-colors-review')
            .map((r) => [r.outcome, r.occurrences.map((o) => o.data.details)]);
        return [
          await run(['rgaa-link-state-colors-review']),
          await run(['rgaa-css-colors-paired', 'rgaa-link-state-colors-review'])
        ];
      });
      assert.equal(both[0].length, 1);
      assert.notEqual(both[0][0][0], 'notApplicable');
      assert.deepEqual(both[1], both[0]);
    } finally {
      await p.close();
    }
  });

  await t.test('the page’s colors and transitions are as they were', async () => {
    const p = await browser.newPage();
    try {
      await p.setContent(
        doc(
          '<style>p{color:#555;transition:color 2s linear} body{background:#fff}</style>',
          '<p id="t">Texte</p>'
        )
      );
      await p.addScriptTag({ content: BUNDLE });
      const after = await p.evaluate(async () => {
        await window.a11ycore.runa11yCoreInPage(
          null,
          null,
          { rules: { include: 'rgaa-css-colors-paired' } },
          null
        );
        const el = document.getElementById('t');
        return {
          color: getComputedStyle(el).color,
          transitions: el.getAnimations().length,
          styles: document.querySelectorAll('style').length
        };
      });
      assert.deepEqual(after, { color: 'rgb(85, 85, 85)', transitions: 0, styles: 1 });
    } finally {
      await p.close();
    }
  });

  await t.test('a page of broken images is read without changing the page', async () => {
    const p = await browser.newPage();
    const warnings = [];
    p.on('console', (m) => {
      if (m.type() === 'warning') warnings.push(m.text());
    });
    try {
      await p.route('https://site.test/', (r) =>
        r.fulfill({
          contentType: 'text/html',
          body: doc(
            '<style>body{background:#fff} p{color:#555} img{color:#555}</style>',
            '<p>Texte <img id="i" src="missing.png" alt="Logo"> <img src="gone.png" alt="Photo"></p>'
          )
        })
      );
      await p.route(/\.png$/, (r) => r.fulfill({ status: 404, body: '' }));
      await p.goto('https://site.test/');
      await p.addScriptTag({ content: BUNDLE });
      const after = await p.evaluate(async () => {
        const res = await window.a11ycore.runa11yCoreInPage(
          null,
          null,
          { rules: { include: 'rgaa-css-colors-paired' } },
          null
        );
        const img = document.getElementById('i');
        return {
          outcome: res.checksResults.find((r) => r.ruleId === 'rgaa-css-colors-paired').outcome,
          style: img.getAttribute('style'),
          display: getComputedStyle(img).display,
          styles: document.querySelectorAll('style').length
        };
      });
      assert.deepEqual(after, { outcome: 'pass', style: null, display: 'inline', styles: 1 });
      assert.deepEqual(
        warnings.filter((w) => /changed the page/.test(w)),
        []
      );
    } finally {
      await p.close();
    }
  });

  await t.test(
    'the same page with its style sheets readable fails, or passes once paired',
    async () => {
      const failing = await scan(doc('<style>p{color:#555}</style>'));
      assert.equal(failing.outcome, 'fail');
      const paired = await scan(doc('<style>body{background:#fff} p{color:#555}</style>'));
      assert.equal(paired.outcome, 'pass');
    }
  );
});
