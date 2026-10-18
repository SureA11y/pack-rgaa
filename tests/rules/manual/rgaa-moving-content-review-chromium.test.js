'use strict';

/**
 * rgaa-moving-content-review in a real browser, where CSS animations run.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { BROWSER_BUNDLE } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-moving-content-review';

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

test(`${RULE_ID} in Chromium: CSS animations`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  async function outcome(css, body) {
    const p = await browser.newPage();
    try {
      await p.setContent(page(css, body));
      await p.addScriptTag({ content: BROWSER_BUNDLE });
      const result = await p.evaluate(
        (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
        { rules: { include: RULE_ID } }
      );
      const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
      return [rule.outcome, rule.occurrences.map((o) => o.data.details.reasonCode)];
    } finally {
      await p.close();
    }
  }
  const SLIDE = '@keyframes slide{from{transform:translateX(0)}to{transform:translateX(100px)}}';
  const BLINK = '@keyframes blink{50%{opacity:0}}';
  assert.deepEqual(
    await outcome(SLIDE + '.b{animation:slide 2s infinite}', '<p class="b">Promo</p>'),
    ['cantTell', ['movingAnimation']]
  );
  assert.deepEqual(
    await outcome(BLINK + '.b{animation:blink 1s infinite}', '<p class="b">Nouveau</p>'),
    ['cantTell', ['blinkingAnimation']]
  );
  // 5 seconds or less is allowed by 13.8.
  assert.deepEqual(await outcome(SLIDE + '.b{animation:slide 1s 3}', '<p class="b">Promo</p>'), [
    'notApplicable',
    []
  ]);
  assert.deepEqual(
    await outcome(
      '',
      '<svg width="10" height="10"><circle r="5"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite"/></circle></svg>'
    ),
    ['cantTell', ['svgAnimation']]
  );
});
