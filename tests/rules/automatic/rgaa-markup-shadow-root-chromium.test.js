'use strict';

/**
 * The 8.2.1 rules in a real browser, with markup inside open shadow roots: a
 * shadow root is part of the page's generated source (« code source
 * généré »), so its markup fails like the rest, with the same reason codes.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { BROWSER_BUNDLE } = require('../../helpers/run.js');

const RULES = [
  'rgaa-aria-attribute-conformance',
  'rgaa-aria-role-conformance',
  'rgaa-html-nesting-valid',
  'rgaa-html-elements-attributes-valid'
];

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

test(
  '8.2.1 rules in Chromium: markup in a shadow root fails as it does outside',
  { skip },
  async (t) => {
    const browser = await chromium.launch({ executablePath });
    t.after(() => browser.close());
    async function outcomes(body) {
      const p = await browser.newPage();
      try {
        await p.setContent(page(body));
        await p.addScriptTag({ content: BROWSER_BUNDLE });
        const result = await p.evaluate(
          (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
          { rules: { include: RULES } }
        );
        const out = {};
        for (const r of result.checksResults) {
          if (!RULES.includes(r.ruleId)) continue;
          out[r.ruleId] = [r.outcome, r.occurrences.map((o) => o.data.details.reasonCode)];
        }
        return out;
      } finally {
        await p.close();
      }
    }
    const shadow = (inner) =>
      `<div id="host"></div><script>document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML = ${JSON.stringify(inner)};</script>`;
    for (const [inner, ruleId] of [
      ['<span aria-label="x">y</span>', 'rgaa-aria-attribute-conformance'],
      ['<nav role="tab">x</nav>', 'rgaa-aria-role-conformance'],
      ['<ul><div>x</div></ul>', 'rgaa-html-nesting-valid'],
      ['<p id="">x</p>', 'rgaa-html-elements-attributes-valid']
    ]) {
      const inShadow = await outcomes(shadow(inner));
      const light = await outcomes(inner);
      assert.equal(inShadow[ruleId][0], 'fail', inner);
      assert.equal(light[ruleId][0], 'fail', inner);
      assert.deepEqual(inShadow[ruleId][1], light[ruleId][1], inner);
    }
    // An aria-activedescendant naming an element only across the shadow
    // boundary is asked about; one naming no element of the page fails.
    const across = await outcomes(
      '<div id="opt1" role="option">A</div>' +
        shadow('<input role="combobox" aria-expanded="true" aria-activedescendant="opt1">')
    );
    assert.deepEqual(across['rgaa-aria-attribute-conformance'], [
      'cantTell',
      ['idReferenceOtherTree']
    ]);
    const nowhere = await outcomes(
      shadow('<input role="combobox" aria-expanded="true" aria-activedescendant="opt9">')
    );
    assert.deepEqual(nowhere['rgaa-aria-attribute-conformance'], ['fail', ['invalidValue']]);
  }
);
