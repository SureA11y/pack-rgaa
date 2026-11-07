'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-img-no-alt-decorative';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const reasons = (rule) =>
  rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: an image with no alt is asked about`, () => {
  for (const body of [
    '<img src="photo.jpg">',
    '<p>Read <a href="/a">the report <img src="arrow.png"></a></p>',
    '<img src="a.png" alt-text="x" width="300">'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['cantTell', 'noAltUnknownRole']], body);
    const occ = rule.occurrences[0];
    assert.equal(occ.i18n.summaryKey, 'imgNoAltDecorative_summary_cantTell');
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

// With no layout (jsdom), the size comes from the width and height attributes.
test(`${RULE_ID}: a spacer, 2 px or less, fails`, () => {
  for (const body of [
    '<img src="pixel.gif" width="1" height="1">',
    '<img src="rule.gif" width="600" height="2">',
    '<img src="gap.gif" width="1px">'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(reasons(rule), [['fail', 'spacerNoAlt']], body);
    assert.equal(rule.occurrences[0].i18n.summaryKey, 'imgNoAltDecorative_summary_fail');
  }
  const rule = assertRule(
    runa11yCoreOnHtml(page('<img src="rule.gif" width="600" height="2">'), RUN),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'This image is 600 by 2 px, so it is decorative, and it has no alt attribute.'
  );
});

// The only content of a link or button carries its information: not
// decorative, so 1.1.1 (img-alt-present) alone, as with bordeaux.fr's
// social icons.
test(`${RULE_ID}: an image that is a link's or button's only content is left out`, () => {
  for (const body of [
    '<a href="https://facebook.com/x" title="Facebook"><img src="fb.svg" width="16"></a>',
    '<button type="button"><img src="menu.png"></button>',
    '<div role="link" tabindex="0"> <img src="next.png"> </div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: an image with an alt, an alternative, a decorative marker or a caption is left out`, () => {
  for (const body of [
    '<img src="a.png" alt="">',
    '<img src="a.png" alt="Chart">',
    '<img src="a.png" title="Chart">',
    '<img src="a.png" aria-label="Chart">',
    '<img src="a.png" aria-hidden="true">',
    '<img src="a.png" role="presentation">',
    '<figure><img src="a.png"><figcaption>Chart</figcaption></figure>',
    '<img src="a.png" hidden>',
    '<p>No image</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

// An image with no alt fails one criterion, not both: 1.1 through
// img-alt-present, and 1.2 here, failed for a spacer and asked otherwise.
// Glossary « Image porteuse d'information », note 1: a link's only image
// is judged as the link's label, under Links.
test(`${RULE_ID}: under the RGAA profile, a link's only image fails 6.2, not 1.1 or 1.2`, () => {
  const opts = { engineOptions: { profile: 'rgaa-4.1.2' } };
  const icon = runa11yCoreOnHtml(
    page('<a href="https://facebook.com/x"><img src="fb.svg"></a>'),
    opts
  );
  const images = rollup(icon, 'rgaa-4.1.2-1.1');
  assert.ok(!images || images.outcome !== 'fail', images && images.outcome);
  assert.equal(rollup(icon, 'rgaa-4.1.2-6.2').outcome, 'fail');
  const decorative = rollup(icon, 'rgaa-4.1.2-1.2');
  assert.ok(!decorative || decorative.outcome !== 'fail', decorative && decorative.outcome);

  const spacer = runa11yCoreOnHtml(page('<img src="pixel.gif" width="1" height="1">'), opts);
  assert.equal(rollup(spacer, 'rgaa-4.1.2-1.2').outcome, 'fail');
  // A photo may be decorative or carry information: both criteria ask.
  const photo = runa11yCoreOnHtml(page('<img src="photo.jpg">'), opts);
  assert.equal(rollup(photo, 'rgaa-4.1.2-1.1').outcome, 'cantTell');
  assert.equal(rollup(photo, 'rgaa-4.1.2-1.2').outcome, 'cantTell');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<img src="p.gif" width="1" height="1">'), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette image mesure 1 px sur 1 px : c’est une image de décoration, et elle n’a pas d’attribut alt.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<img src="photo.jpg">');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const byId = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.occurrenceOutcome
  ]);
  assert.deepEqual(byId, [
    ['inad_case_01', 'fail'],
    ['inad_case_02', 'fail'],
    ['inad_case_03', 'cantTell'],
    ['inad_case_04', 'cantTell']
  ]);
});

// alt="" is the decorative marker; an alt of only spaces is not.
test(`${RULE_ID}: an alt of only spaces is not the empty alt 1.2.1 asks for`, () => {
  const spacer = assertRule(
    runa11yCoreOnHtml(page('<img src="pixel.gif" alt=" " width="1" height="1">'), RUN),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(spacer), [['fail', 'spacerBlankAlt']]);
  assert.equal(spacer.occurrences[0].i18n.summaryKey, 'imgNoAltDecorative_summary_fail_blank');
  const photo = assertRule(
    runa11yCoreOnHtml(page('<img src="photo.jpg" alt="  " width="300" height="200">'), RUN),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasons(photo), [['cantTell', 'blankAltUnknownRole']]);
});

// Criterion 1.2 asks that a decorative image be ignored by assistive
// technologies, which an aria-hidden ancestor already does.
test(`${RULE_ID}: an image inside an aria-hidden container is left out`, () => {
  assertRule(
    runa11yCoreOnHtml(
      page('<div aria-hidden="true"><img src="pixel.gif" width="1" height="1"></div>'),
      RUN
    ),
    RULE_ID,
    'notApplicable'
  );
});
