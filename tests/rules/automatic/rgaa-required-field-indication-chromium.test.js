'use strict';

/**
 * rgaa-required-field-indication in a real browser: generated content,
 * screen-reader-only classes and background images are read there.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { BROWSER_BUNDLE } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-required-field-indication';

function page(head, fields) {
  return `<!doctype html><html lang="fr"><head><title>t</title><style>${head}</style></head><body><main><form>${fields}<label for="v">Ville</label><input id="v"><button>Envoyer</button></form></main></body></html>`;
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

test(`${RULE_ID} in Chromium: styles are read`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  async function outcome(css, fields) {
    const p = await browser.newPage();
    try {
      await p.setContent(page(css, fields));
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
  const SR = '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}';
  // « (obligatoire) » added by CSS is visible text in the label.
  assert.deepEqual(
    await outcome(
      '.req::after{content:" (obligatoire)"}',
      '<label for="a" class="req">Nom</label><input id="a" required>'
    ),
    ['pass', []]
  );
  // An icon font or a background image may be the indication.
  assert.deepEqual(
    await outcome(
      '.req::after{content:"\\e900";font-family:icons}',
      '<label for="a" class="req">Nom</label><input id="a" required>'
    ),
    ['cantTell', ['indicationMayBeImage']]
  );
  assert.deepEqual(
    await outcome(
      '.req{padding-right:12px;background:url(data:image/gif;base64,R0lGODlhAQABAAAAACw=) no-repeat right}',
      '<label for="a" class="req">Nom</label><input id="a" required>'
    ),
    ['cantTell', ['indicationMayBeImage']]
  );
  // Text hidden by a screen-reader-only class is not visible.
  assert.deepEqual(
    await outcome(
      SR,
      '<label for="a">Nom <span class="sr">obligatoire</span></label><input id="a" required>'
    ),
    ['fail', ['requiredNotIndicated']]
  );
  assert.deepEqual(await outcome('', '<label for="a">Nom</label><input id="a" required>'), [
    'fail',
    ['requiredNotIndicated']
  ]);
});
