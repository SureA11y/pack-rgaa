'use strict';

/**
 * rgaa-orientation-content-parity in a real browser: the page is laid out as
 * portrait and as landscape by rewriting its orientation media conditions,
 * the content each shows is compared, and the conditions are put back.
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

const RULE_ID = 'rgaa-orientation-content-parity';
// Core's browser bundle with the RGAA pack registered, every scan naming it.
const { BROWSER_BUNDLE: BUNDLE, rollupOutcome } = require('../../helpers/run.js');
const FIXTURE = fs.readFileSync(
  path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`),
  'utf8'
);

function page(css, body) {
  return `<!doctype html><html lang="fr"><head><title>t</title><style>${css}</style></head><body>${body}</body></html>`;
}

test(`${RULE_ID} in Chromium`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());

  // Run in both real orientations: the verdict must not depend on the one
  // the scan happens to run in.
  async function scan(html, engineOptions = { rules: { include: RULE_ID } }) {
    const out = [];
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 800, height: 1280 }
    ]) {
      const p = await browser.newPage({ viewport });
      try {
        await p.setContent(html);
        await p.addScriptTag({ content: BUNDLE });
        const media = () =>
          [...document.styleSheets]
            .map((s) => s.media.mediaText + '|' + [...s.cssRules].map((r) => r.cssText).join('\n'))
            .join(';');
        const before = await p.evaluate(media);
        const result = await p.evaluate(
          (opts) => window.a11ycore.runa11yCoreInPage(null, null, opts, null),
          engineOptions
        );
        assert.equal(await p.evaluate(media), before, 'the media conditions are put back');
        out.push(result);
      } finally {
        await p.close();
      }
    }
    return out;
  }
  const findings = (result) => {
    const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
    return {
      outcome: rule.outcome,
      findings: (rule.occurrences || [])
        .map((o) => [
          (String(o.html || '').match(/id="([^"]+)"/) || [])[1] || o.html.slice(0, 6),
          o.occurrenceOutcome,
          o.data.details.reasonCode
        ])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    };
  };

  await t.test(
    'the fixture: content shown nowhere else fails, the same links twice pass',
    async () => {
      for (const result of await scan(FIXTURE)) {
        assert.deepEqual(findings(result), {
          outcome: 'fail',
          findings: [
            ['ocp_case_01', 'fail', 'CONTENT_MISSING'],
            ['ocp_case_02', 'fail', 'CONTENT_MISSING'],
            ['ocp_case_03', 'fail', 'CONTENT_MISSING']
          ]
        });
      }
    }
  );

  await t.test('a transition on the hidden content does not hide the difference', async () => {
    const page = (transition) =>
      `<!doctype html><html lang="fr"><head><title>t</title><style>.x{${transition}} @media (orientation: portrait){.x{opacity:0}}</style></head><body><main><p>Toujours</p><p class="x">Seulement en paysage</p></main></body></html>`;
    for (const transition of ['', 'transition:all 2s linear', 'transition:opacity 2s!important']) {
      for (const result of await scan(page(transition))) {
        assert.equal(findings(result).outcome, 'fail', transition || 'no transition');
      }
    }
  });

  await t.test('the failure names the orientation and the content', async () => {
    const [result] = await scan(
      page(
        '@media (orientation: portrait){#t{display:none}}',
        '<p id="t">Horaires d’ouverture : 9 h à 17 h</p>'
      )
    );
    const occ = result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences[0];
    assert.equal(occ.i18n.summaryKey, 'orientationContentParity_summary_fail_missing_portrait');
    assert.equal(occ.i18n.params.text, 'Horaires d’ouverture : 9 h à 17 h');
  });

  // An image may show with another alternative in the other orientation (a
  // logo), which a person compares.
  await t.test('an image hidden in one orientation is asked about', async () => {
    const [result] = await scan(
      page(
        '@media (orientation: landscape){#i{display:none}}',
        '<p><img id="i" src="data:," alt="Plan d’accès" width="20" height="20"></p>'
      )
    );
    assert.deepEqual(findings(result).findings, [['i', 'cantTell', 'CONTENT_MAY_DIFFER']]);
  });

  // 13.9.1 lets the presentation and the way to reach it differ.
  await t.test(
    'a menu behind a button, cards for a table, another wording: asked, not failed',
    async () => {
      for (const [css, body] of [
        [
          '.burger{display:none} @media (orientation:portrait){.burger{display:inline-block} .links{display:none}}',
          '<nav><button class="burger" aria-expanded="false">Menu</button><ul class="links"><li><a href="/a">Actualités</a></li><li><a href="/b">Démarches</a></li></ul></nav>'
        ],
        [
          '.cards{display:none} @media (orientation:portrait){table{display:none} .cards{display:block}}',
          '<table><tr><th>Fruit</th><th>Prix</th></tr><tr><td>Pomme</td><td>2 €</td></tr></table><div class="cards"><p>Pomme : 2 €</p></div>'
        ]
      ]) {
        for (const result of await scan(page(css, body))) {
          assert.notEqual(findings(result).outcome, 'fail', body);
        }
      }
    }
  );

  await t.test(
    'content shown only in one orientation, by a default-hidden rule, is found too',
    async () => {
      const [result] = await scan(
        page(
          '#t{display:none} @media (orientation: portrait){#t{display:block}}',
          '<p id="t">Offre mobile</p>'
        )
      );
      assert.deepEqual(findings(result).findings, [['t', 'fail', 'CONTENT_MISSING']]);
    }
  );

  await t.test(
    'main content hidden in one orientation is asked about, and its message is not failed',
    async () => {
      for (const result of await scan(
        page(
          '.rotate{display:none} @media (orientation: portrait){main{display:none} .rotate{display:block}}',
          '<p class="rotate">Tournez votre appareil</p><main><h1>Titre</h1><p>Texte</p></main>'
        )
      )) {
        assert.deepEqual(findings(result), {
          outcome: 'cantTell',
          findings: [['<main>', 'cantTell', 'MAIN_CONTENT_HIDDEN']]
        });
      }
    }
  );

  // 13.9.1: the content stays the same « même si sa présentation et le moyen
  // d'y accéder peut différer », so a menu collapsed behind a toggle in one
  // orientation is a question, not missing content.
  await t.test('content a shown control opens is asked about, not failed', async () => {
    const menu = '<ul id="menu"><li><a href="/agenda">Agenda</a></li></ul>';
    for (const body of [
      `<nav><button aria-controls="menu" aria-expanded="false">Menu</button>${menu}</nav>`,
      `<nav><button aria-expanded="false">Menu</button>${menu}</nav>`
    ]) {
      const [result] = await scan(
        page(
          '@media (orientation: portrait){#menu{display:none}}',
          `${body}<main><p>Texte</p></main>`
        )
      );
      assert.deepEqual(
        findings(result).findings,
        [['menu', 'cantTell', 'CONTENT_BEHIND_CONTROL']],
        body
      );
      const occ = result.checksResults.find((r) => r.ruleId === RULE_ID).occurrences[0];
      assert.equal(
        occ.i18n.summaryKey,
        'orientationContentParity_summary_cantTell_behindControl_portrait'
      );
    }
    // The control is hidden too in that orientation: nothing opens the menu.
    const [hidden] = await scan(
      page(
        '@media (orientation: portrait){#menu,#b{display:none}}',
        `<nav><button id="b" aria-controls="menu" aria-expanded="false">Menu</button>${menu}</nav><main><p>Texte</p></main>`
      )
    );
    assert.deepEqual(findings(hidden).findings, [['menu', 'cantTell', 'CONTENT_MAY_DIFFER']]);
  });

  await t.test('a short hint about the orientation itself is not missing content', async () => {
    for (const hint of [
      'Pour un meilleur confort, tournez votre appareil',
      'Rotate your device for a better view',
      'Drehen Sie Ihr Gerät ins Querformat'
    ]) {
      const [result] = await scan(
        page(
          '#h{display:none} @media (orientation: portrait){#h{display:block}}',
          `<p id="h">${hint}</p><main><p>Texte</p></main>`
        )
      );
      assert.equal(findings(result).outcome, 'pass', hint);
    }
    // Content that only mentions an orientation is still content.
    const [result] = await scan(
      page(
        '@media (orientation: portrait){#t{display:none}}',
        '<p id="t">Horaires du samedi : 9 h à 17 h</p><p>Texte</p>'
      )
    );
    assert.equal(findings(result).outcome, 'fail');
  });

  await t.test('an element with no text to compare is asked about', async () => {
    const [result] = await scan(
      page(
        '@media (orientation: portrait){#v{display:none}}',
        '<p>Texte</p><div id="v" style="width:10px;height:10px;background:red"></div>'
      )
    );
    assert.deepEqual(findings(result).findings, [['v', 'cantTell', 'hiddenInOrientation']]);
  });

  await t.test('a layout change only passes', async () => {
    const [result] = await scan(
      page(
        '@media (orientation: portrait){#f{flex-direction:column}}',
        '<div id="f" style="display:flex"><span>Un</span><span>Deux</span></div>'
      )
    );
    assert.equal(findings(result).outcome, 'pass');
  });

  await t.test('under the RGAA profile: WCAG 1.3.4 does not fail, RGAA 13.9 does', async () => {
    const [result] = await scan(FIXTURE, { profile: 'rgaa-4.1.2-with-wcag' });
    const rollup = (id) => rollupOutcome(result.rulesResults.find((r) => r.ruleId === id));
    assert.notEqual(rollup('wcag-1.3.4-orientation'), 'fail');
    assert.equal(rollup('rgaa-4.1.2-13.9'), 'fail');
  });
});
