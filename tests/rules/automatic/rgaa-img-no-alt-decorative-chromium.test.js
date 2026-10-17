'use strict';

/**
 * rgaa-img-no-alt-decorative in a real browser, where the rendered size of
 * an image decides whether it is a spacer, whatever its attributes say.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { BROWSER_BUNDLE } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-img-no-alt-decorative';

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
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

test(`${RULE_ID} in Chromium: the rendered size decides`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const p = await browser.newPage();
  const pixel =
    'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
  await p.setContent(
    page(
      `<img id="line" src="${pixel}" style="width: 400px; height: 1px">` +
        `<img id="big" src="${pixel}" width="1" height="1" style="width: 120px; height: 80px">`
    )
  );
  await p.addScriptTag({ content: BROWSER_BUNDLE });
  const result = await p.evaluate(
    (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
    { rules: { include: RULE_ID } }
  );
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.deepEqual(
    rule.occurrences.map((o) => [(o.html.match(/id="([^"]+)"/) || [])[1], o.occurrenceOutcome]),
    [
      ['line', 'fail'],
      ['big', 'cantTell']
    ]
  );
});
