'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml, rollupOutcome } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-form-button-name-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

test(`${RULE_ID}: a button in a form with no label fails`, () => {
  // The hint names a cause the markup shows, when there is one.
  for (const [body, hintKey] of [
    ['<form><button></button></form>', 'formButtonNamePresent_hint_fail_nameMissing'],
    ['<form><input type="button"></form>', 'buttonNameCause_hint_inputNoValue'],
    ['<form><button><img src="a.png" alt=""></button></form>', 'buttonNameCause_hint_imageNoAlt'],
    [
      '<div role="form" aria-label="Filtres"><span role="button" tabindex="0"></span></div>',
      'formButtonNamePresent_hint_fail_nameMissing'
    ],
    [
      '<form><fieldset><div><button type="submit"> </button></div></fieldset></form>',
      'formButtonNamePresent_hint_fail_nameMissing'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['fail', 'nameMissing']], body);
    const occ = rule.occurrences[0];
    assert.equal(occ.i18n.summaryKey, 'formButtonNamePresent_summary_fail_nameMissing');
    assert.equal(occ.i18n.hintKey, hintKey, body);
    assert.equal(occ.summary, 'This button in a form has no label.');
  }
});

test(`${RULE_ID}: every label source the glossary lists passes`, () => {
  for (const body of [
    '<div role="form" aria-label="Connexion"><button>OK</button></div>',
    '<form><button aria-label="Fermer"></button></form>',
    '<form><span id="l">Envoyer</span><button aria-labelledby="l"></button></form>',
    '<form><button title="Fermer"></button></form>',
    '<form><input type="button" value="Calculer"></form>',
    '<form><input type="image" src="a.png" alt="Rechercher"></form>',
    '<form><button><svg role="img"><title>Rechercher</title></svg></button></form>',
    '<form><button><img src="a.png" alt="Rechercher"></button></form>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a submit or reset input with no value shows the browser label and passes`, () => {
  assertRule(
    runa11yCoreOnHtml(page('<form><input type="submit"><input type="reset"></form>'), RUN),
    RULE_ID,
    'pass',
    { maxOccurrences: 0 }
  );
});

test(`${RULE_ID}: an image button with no alt is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<form><input type="image" src="a.png"></form>'), RUN),
    RULE_ID,
    'cantTell',
    { maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(rule), [['cantTell', 'imageButtonNoAlt']]);
  assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'formButtonNamePresent_summary_cantTell_imageButtonNoAlt'
  );
});

// Its form attribute makes it a button of that form (glossary « Bouton
// (formulaire) »), so 11.9.1 applies.
test(`${RULE_ID}: a nameless button that joins a form from outside fails`, () => {
  const html = page('<form id="f" action="/send"></form><button form="f"></button>');
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    maxOccurrences: 1
  });
  assert.deepEqual(reasons(rule), [['fail', 'formAttributeOnly']]);
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'formButtonNamePresent_summary_fail_formAttributeOnly'
  );
  // An image button with no alt joined this way gets the browser's generic
  // name, which is asked about.
  const image = assertRule(
    runa11yCoreOnHtml(page('<form id="f"></form><input type="image" src="x.png" form="f">'), RUN),
    RULE_ID,
    'cantTell',
    { maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(image), [['cantTell', 'imageButtonNoAlt']]);
  // Named, it passes; a form attribute that names no form leaves it out.
  assertRule(
    runa11yCoreOnHtml(page('<form id="f"></form><button form="f">Envoyer</button>'), RUN),
    RULE_ID,
    'pass'
  );
  assertRule(
    runa11yCoreOnHtml(page('<div id="f"></div><button form="f"></button>'), RUN),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: buttons outside a form, other roles and hidden buttons are not applicable`, () => {
  for (const body of [
    '<button onclick="void 0"></button>',
    '<div role="button" tabindex="0"></div>',
    '<form><button role="tab"></button></form>',
    '<form><button role="none" disabled></button></form>',
    '<form><button aria-hidden="true" tabindex="-1"></button></form>',
    '<form><div hidden><button></button></div></form>',
    '<form><input type="text" aria-label="Nom"></form>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: a fail and a question on one page give fail with both occurrences`, () => {
  const html = page('<form><button></button><input type="image" src="a.png"></form>');
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail');
  assert.deepEqual(reasons(rule), [
    ['fail', 'nameMissing'],
    ['cantTell', 'imageButtonNoAlt']
  ]);
});

// --- opt-in gate -------------------------------------------------------------

const FORM_PAGE = page('<form><button></button></form>');

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(FORM_PAGE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the rgaa-4.1.2 profile, the rgaa tag and the 11.9 rollup run it`, () => {
  for (const options of [
    { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-11.9' } } }
  ]) {
    const result = runa11yCoreOnHtml(FORM_PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 11.9.1, and button-name-present no longer`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['11.9.1']);
  assert.deepEqual(map['button-name-present'].tests, []);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(body) {
  const result = runa11yCoreOnHtml(page(body), {
    engineOptions: { profile: 'rgaa-4.1.2-with-wcag' }
  });
  const outcome = (id) => {
    const r = result.rulesResults.find((x) => x.ruleId === id);
    return r ? rollupOutcome(r) : 'missing';
  };
  return { rgaa: outcome('rgaa-4.1.2-11.9'), wcag: outcome('wcag-4.1.2-name'), result };
}

test(`${RULE_ID}: WCAG fails an unnamed button outside a form, RGAA 11.9 does not apply`, () => {
  const r = rollups('<button onclick="void 0"></button>');
  assert.equal(r.wcag, 'fail');
  assert.equal(r.rgaa, 'noneFoundInPart');
  const rgaa = r.result.rulesResults.find((x) => x.ruleId === 'rgaa-4.1.2-11.9');
  assert.ok(!rgaa.data.details.checksIds.includes('button-name-present'));
});

test(`${RULE_ID}: WCAG and RGAA agree on an unnamed button in a form and on a named one`, () => {
  const bad = rollups('<form><button></button></form>');
  assert.equal(bad.wcag, 'fail');
  assert.equal(bad.rgaa, 'fail');
  const good = rollups('<div role="form" aria-label="Connexion"><button>OK</button></div>');
  assert.equal(good.wcag, 'passedInPart');
  assert.equal(good.rgaa, 'passedInPart');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/rgaa-form-button-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'rgaa-form-button-name-present-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail');
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome,
    o.data.details.reasonCode
  ]);
  got.sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(got, [
    ['fbnp_case_01', 'fail', 'nameMissing'],
    ['fbnp_case_02', 'fail', 'nameMissing'],
    ['fbnp_case_03', 'fail', 'nameMissing'],
    ['fbnp_case_04', 'cantTell', 'imageButtonNoAlt'],
    ['fbnp_case_05', 'fail', 'formAttributeOnly'],
    ['fbnp_case_10', 'cantTell', 'imageButtonNoAlt']
  ]);
});

// The hint names what the markup shows in place of a label, so a reader who
// sees text or a name-like attribute in the button knows why it does not
// count.
test(`${RULE_ID}: the hint names the cause the markup shows`, () => {
  for (const [body, cause, hint] of [
    [
      '<style>.nav-text{display:none}</style><form><button><span class="nav-text">Menü</span><span class="nav-bars"></span></button></form>',
      'hiddenText',
      'Its text "Menü" is in a <span> with display: none, which hides it from screen readers as well as from view, so it gives no name. Let screen readers read it (a visually-hidden class keeps it off screen but read), or name the button with aria-label.'
    ],
    [
      '<form><button><span hidden>Envoyer</span></button></form>',
      'hiddenText',
      'Its text "Envoyer" is in a <span> with the hidden attribute, which hides it from screen readers as well as from view, so it gives no name. Let screen readers read it (a visually-hidden class keeps it off screen but read), or name the button with aria-label.'
    ],
    [
      '<form><button><span aria-hidden="true">OK</span></button></form>',
      'ariaHiddenText',
      'Its text "OK" is in a <span> with aria-hidden="true", which hides it from screen readers, so it gives no name. Remove aria-hidden from that element, or name the button with aria-label.'
    ],
    [
      '<form><button arialabel="Rechercher"></button></form>',
      'misspelledAttribute',
      'It has arialabel="Rechercher", but browsers do not read arialabel: did you mean aria-label? Rename the attribute so that it names the button.'
    ],
    [
      '<form><button aria-labelledby="Lbl"></button><span id="lbl">Rechercher</span></form>',
      'labelledbyMissing',
      'Its aria-labelledby names "Lbl", but no element of the page has that id (did you mean "lbl"?), so it gives no name. Point aria-labelledby at the id of the element that holds the button\'s text, or name the button with aria-label.'
    ],
    [
      '<form><button aria-labelledby="lbl"></button><span id="lbl"></span></form>',
      'labelledbyEmpty',
      'Its aria-labelledby points to a <span> with id "lbl" that holds no text, so it gives no name. Put the button\'s text in that element, or name the button with aria-label.'
    ],
    [
      '<form><button aria-label=" "></button></form>',
      'ariaLabelBlank',
      'Its aria-label is empty, so it gives no name. Write in aria-label what the button does, or give the button visible text.'
    ],
    [
      '<form><button><img src="loupe.png"></button></form>',
      'imageNoAlt',
      'Its content is an <img> with no alt, so it gives no name. Give the image an alt that says what the button does, or name the button with aria-label.'
    ],
    [
      '<form><button><svg><path d="M0 0h1"/></svg></button></form>',
      'svgNoName',
      'Its content is an <svg> with no <title>, aria-label or aria-labelledby, so it gives no name. Name the button with aria-label, or give the <svg> role="img" and an aria-label that says what the button does.'
    ],
    [
      '<form><button><i class="fa fa-search"></i></button></form>',
      'emptyIcon',
      'Its content is an empty <i class="fa fa-search">, probably an icon drawn by CSS, which gives no text, so the button has no name. Name the button with aria-label, or add text, visually hidden if need be, that says what it does.'
    ]
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'nameMissing', body);
    assert.equal(occ.data.details.nameCause, cause, body);
    assert.equal(occ.i18n.hintKey, `buttonNameCause_hint_${cause}`, body);
    assert.equal(occ.hint, hint, body);
  }
});

test(`${RULE_ID}: the cause hint follows the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(
      page('<form><button><span style="display:none">Menü</span></button></form>'),
      {
        ...RUN,
        engineOptions: { locale: 'fr' }
      }
    ),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].hint,
    'Son texte « Menü » se trouve dans un <span> avec display: none, qui le masque aux lecteurs d’écran comme à la vue : il ne donne donc aucun nom. Laissez les lecteurs d’écran le lire (une classe de masquage accessible le retire de l’écran tout en le laissant lu), ou nommez le bouton avec aria-label.'
  );
});
