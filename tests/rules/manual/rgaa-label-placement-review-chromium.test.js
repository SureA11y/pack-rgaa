'use strict';

/**
 * rgaa-label-placement-review in a real browser, where labels and fields
 * have boxes to compare.
 *
 * Skipped when Playwright or its Chromium build is not installed. Set
 * CHROMIUM_EXECUTABLE_PATH to use another Chromium build.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { BROWSER_BUNDLE } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-label-placement-review';
const FIXTURE = path.join(__dirname, '../../fixtures', `${RULE_ID}-all-scenarios.html`);

function page(body, { lang = 'fr', dir = 'ltr', css = '' } = {}) {
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><title>t</title><style>body{font:16px/1.2 sans-serif;margin:16px}${css}</style></head><body><main>${body}</main></body></html>`;
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

test(`${RULE_ID} in Chromium: label placement`, { skip }, async (t) => {
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  async function run(html, opts = {}) {
    const p = await browser.newPage();
    try {
      await p.setContent(html);
      await p.addScriptTag({ content: BROWSER_BUNDLE });
      return await p.evaluate((o) => window.a11ycore.runa11yCoreInPage(null, null, o, null), {
        rules: { include: RULE_ID },
        ...opts
      });
    } finally {
      await p.close();
    }
  }
  async function codes(body, options) {
    const result = await run(page(body, options));
    const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
    return [rule.outcome, rule.occurrences.map((o) => o.data.details.reasonCode)];
  }
  const NA = ['notApplicable', []];

  await t.test('text fields: above or left passes, right or below is asked about', async () => {
    // Above.
    assert.deepEqual(
      await codes(
        '<label for="a" style="display:block">Courriel</label><input id="a" type="email">'
      ),
      NA
    );
    // Left, same line.
    assert.deepEqual(await codes('<label for="a">Nom</label> <input id="a">'), NA);
    // Wrapping label, text first.
    assert.deepEqual(await codes('<label>Nom <input></label>'), NA);
    // A select and a textarea with their label on the left.
    assert.deepEqual(
      await codes(
        '<p><label for="s">Pays</label> <select id="s"><option>France</option></select></p><p><label for="t">Message</label> <textarea id="t"></textarea></p>'
      ),
      NA
    );
    // Right.
    assert.deepEqual(await codes('<input id="a"> <label for="a">Nom</label>'), [
      'cantTell',
      ['labelNotAboveOrLeft']
    ]);
    // Wrapping label, text after the field.
    assert.deepEqual(await codes('<label><input> Nom</label>'), [
      'cantTell',
      ['labelNotAboveOrLeft']
    ]);
    // Below.
    assert.deepEqual(
      await codes('<input id="a" style="display:block"><label for="a">Nom</label>'),
      ['cantTell', ['labelNotAboveOrLeft']]
    );
    // aria-labelledby pointing to visible text on the right.
    assert.deepEqual(await codes('<input aria-labelledby="l"> <span id="l">Code postal</span>'), [
      'cantTell',
      ['labelNotAboveOrLeft']
    ]);
  });

  await t.test(
    'check boxes and radio buttons: right or below passes, left is asked about',
    async () => {
      assert.deepEqual(
        await codes('<input id="c" type="checkbox"> <label for="c">Recevoir la lettre</label>'),
        NA
      );
      assert.deepEqual(await codes('<label><input type="radio" name="r"> Oui</label>'), NA);
      assert.deepEqual(
        await codes(
          '<input id="c" type="checkbox" style="display:block"><label for="c">Recevoir</label>'
        ),
        NA
      );
      assert.deepEqual(
        await codes(
          '<label for="c">J’accepte les conditions</label> <input id="c" type="checkbox">'
        ),
        ['cantTell', ['labelNotBelowOrRight']]
      );
      assert.deepEqual(await codes('<label>J’accepte <input type="checkbox"></label>'), [
        'cantTell',
        ['labelNotBelowOrRight']
      ]);
      // role="switch" named by visible text on its left.
      assert.deepEqual(
        await codes(
          '<span id="w">Mode sombre</span> <span role="switch" aria-checked="false" aria-labelledby="w" tabindex="0" style="display:inline-block;width:32px;height:16px;border:1px solid"></span>'
        ),
        ['cantTell', ['labelNotBelowOrRight']]
      );
      // A check box drawn by CSS (the input itself is transparent) is left out.
      assert.deepEqual(
        await codes('<label>J’accepte <input type="checkbox" style="opacity:0"></label>'),
        NA
      );
    }
  );

  await t.test('a label far from its field is asked about', async () => {
    assert.deepEqual(
      await codes(
        '<div style="display:flex"><label for="a" style="width:80px">Ville</label><input id="a" style="margin-left:300px"></div>'
      ),
      ['cantTell', ['labelFarFromField']]
    );
    assert.deepEqual(
      await codes(
        '<label for="a" style="display:block">Ville</label><div style="height:200px"></div><input id="a">'
      ),
      ['cantTell', ['labelFarFromField']]
    );
    // Far and on the wrong side: both questions.
    assert.deepEqual(
      await codes(
        '<input id="a"><span style="display:inline-block;width:300px"></span><label for="a">Ville</label>'
      ),
      ['cantTell', ['labelFarFromField', 'labelNotAboveOrLeft']]
    );
  });

  await t.test('grid layouts', async () => {
    const GRID =
      '.g{display:grid;grid-template-columns:120px 200px;gap:8px 12px;align-items:center}';
    // Labels in one column, fields in the next.
    assert.deepEqual(
      await codes(
        '<div class="g"><label for="a">Nom</label><input id="a"><label for="b">Prénom</label><input id="b"></div>',
        { css: GRID }
      ),
      NA
    );
    // Fields in the first column, labels after them.
    assert.deepEqual(
      await codes(
        '<div class="g"><input id="a"><label for="a">Nom</label><input id="b"><label for="b">Prénom</label></div>',
        { css: '.g{display:grid;grid-template-columns:200px 120px;gap:8px 12px}' }
      ),
      ['cantTell', ['labelNotAboveOrLeft', 'labelNotAboveOrLeft']]
    );
    // Labels in a header row, fields in the row below: above, passes.
    assert.deepEqual(
      await codes(
        '<div class="g"><label for="a">Nom</label><label for="b">Prénom</label><input id="a"><input id="b"></div>',
        { css: '.g{display:grid;grid-template-columns:200px 200px;gap:4px 12px}' }
      ),
      NA
    );
    // A label column far from the fields.
    assert.deepEqual(
      await codes('<div class="g"><label for="a">Nom</label><input id="a"></div>', {
        css: '.g{display:grid;grid-template-columns:60px 200px;column-gap:300px}'
      }),
      ['cantTell', ['labelFarFromField']]
    );
  });

  await t.test(
    'right-to-left labels swap sides; mixed ones are left out of 11.4.2 and 11.4.3',
    async () => {
      const RTL = { lang: 'ar', dir: 'rtl' };
      // In a right-to-left page the label comes first, on the right.
      assert.deepEqual(await codes('<label for="a">الاسم</label> <input id="a">', RTL), NA);
      assert.deepEqual(
        await codes('<input id="c" type="checkbox"> <label for="c">أوافق</label>', RTL),
        NA
      );
      // The other way round is asked about.
      assert.deepEqual(await codes('<input id="a"> <label for="a">الاسم</label>', RTL), [
        'cantTell',
        ['labelNotAboveOrLeft']
      ]);
      // A label mixing both directions.
      assert.deepEqual(await codes('<input id="a"> <label for="a">الاسم Name</label>', RTL), NA);
      // A form with labels in both directions.
      assert.deepEqual(
        await codes(
          '<form dir="rtl"><p><input id="a"> <label for="a">الاسم</label></p><p><input id="c" type="checkbox"> <label for="c" dir="ltr">Produit</label></p></form>'
        ),
        NA
      );
    }
  );

  await t.test('names that are not visible labels, and hidden fields, are left out', async () => {
    for (const body of [
      '<input aria-label="Nom"> <span>Nom</span>',
      '<input title="Nom" placeholder="Nom">',
      '<input id="a"> <label for="a" style="position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden">Nom</label>',
      '<input id="a" type="hidden"> <label for="a">Nom</label>',
      '<div style="display:none"><input id="a"> <label for="a">Nom</label></div>',
      // A floating label drawn over its field.
      '<div style="position:relative"><input id="a" style="height:40px;width:200px"><label for="a" style="position:absolute;left:8px;top:12px">Nom</label></div>'
    ]) {
      assert.deepEqual(await codes(body), NA, body);
    }
  });

  await t.test('the summary names the side of the field the label is on', async () => {
    const occurrencesOf = async (body) =>
      (await run(page(body))).checksResults.find((r) => r.ruleId === RULE_ID).occurrences;
    const [below] = await occurrencesOf(
      '<input id="a" style="display:block"><label for="a">Nom</label>'
    );
    assert.equal(
      below.i18n.summaryKey,
      'labelPlacementReview_summary_cantTell_labelNotAboveOrLeft_side'
    );
    assert.equal(below.data.details.side, 'below');
    assert.match(
      below.summary,
      /^The label "Nom" is below this field, \d+ px away, not just above it or before it on the same line\.$/
    );
    const [left] = await occurrencesOf(
      '<label for="c">J’accepte</label> <input id="c" type="checkbox">'
    );
    assert.equal(
      left.i18n.summaryKey,
      'labelPlacementReview_summary_cantTell_labelNotBelowOrRight_side'
    );
    assert.equal(left.data.details.side, 'left');
    assert.match(
      left.summary,
      /is to the left of this check box, radio button or switch, \d+ px away/
    );
  });

  await t.test('French messages and the RGAA rollup', async () => {
    const result = await run(page('<input id="a"> <label for="a">Nom</label>'), {
      locale: 'fr',
      profile: 'rgaa-4.1.2'
    });
    const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
    assert.equal(rule.outcome, 'cantTell');
    assert.match(
      rule.occurrences[0].summary,
      /^L’étiquette « Nom » se trouve à droite de ce champ, à \d+ px, et non juste au-dessus de lui ni juste avant lui sur la même ligne\.$/
    );
    // The full RGAA profile rolls the question up into criterion 11.4.
    const all = await run(page('<input id="a"> <label for="a">Nom</label>'), {
      rules: undefined,
      profile: 'rgaa-4.1.2'
    });
    const c = all.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-11.4');
    assert.equal(c.outcome, 'cantTell');
  });

  await t.test(`${path.basename(FIXTURE)}: cases 01 to 03 are asked about`, async () => {
    const result = await run(fs.readFileSync(FIXTURE, 'utf8'));
    const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
    assert.equal(rule.outcome, 'cantTell');
    assert.deepEqual(
      rule.occurrences.map((o) => [
        (o.html.match(/id="([^"]+)"/) || [])[1],
        o.data.details.reasonCode
      ]),
      [
        ['lpr_case_01', 'labelNotAboveOrLeft'],
        ['lpr_case_02', 'labelNotBelowOrRight'],
        ['lpr_case_03', 'labelFarFromField']
      ]
    );
  });
});
