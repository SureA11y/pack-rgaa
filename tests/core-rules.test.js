'use strict';

/**
 * RGAA's reading of core's rules: which RGAA tests a core (WCAG or
 * best-practice) rule names on its result, and how it counts in RGAA's
 * rollups, under the rgaa-4.1.2 profile. These are RGAA's decisions, made in
 * rule-map.js, so they are tested here rather than in core's rule tests.
 * That a profile never changes a rule's outcome is core's guarantee, tested
 * in core over every profile.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml, rollupOutcome } = require('./helpers/run.js');

const RGAA = { engineOptions: { profile: 'rgaa-4.1.2-with-wcag' } };
const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
const rgaaTestsOf = (rule) =>
  (rule.meta.normativeMappings || [])
    .filter((m) => m.standard === 'RGAA')
    .map((m) => m.requirement)
    .sort();

// [rule, page, its outcome, the RGAA tests it names, why]
const CASES = [
  [
    'deprecated-elements-not-used',
    page('<marquee>News</marquee>'),
    'cantTell',
    [],
    'a question for no test: 13.8.1 comes from rgaa-moving-content-review; 10.1.1 comes from rgaa-presentational-elements-absent and 8.2.1 from rgaa-html-elements-attributes-valid, so the element is counted once in each'
  ],
  [
    'server-side-image-map-absent',
    page('<a href="/carte"><img alt="Carte" src="map.png" ismap></a><a href="/nord">Nord</a>'),
    'cantTell',
    ['1.1.4'],
    'RGAA 1.1.4 looks for exactly <img ismap>'
  ],
  [
    'input-image-alt-present',
    page('<form><input type="image" src="a.png" alt="Submit"></form>'),
    'cantTell',
    ['1.1.3'],
    'RGAA 1.1.3 accepts any alt; whether it says what the button does is asked'
  ],
  [
    'link-name-present',
    page('<main><a href="/x"></a></main>'),
    'fail',
    [],
    'RGAA 6.2.1 asks for a label in the link content, which rgaa-link-content-label-present checks'
  ],
  [
    'area-alt-quality',
    page(
      '<img src="x.png" usemap="#m" alt="Map"><map name="m"><area id="a1" href="/paris" title="Paris" shape="rect" coords="0,0,10,10"></map>'
    ),
    'cantTell',
    ['1.3.2'],
    'RGAA 1.3.2 lists every text-alternative source of an area, not only alt'
  ],
  [
    'input-image-alt-quality',
    page('<form><input id="b" type="image" src="a.png" aria-label="Rechercher"></form>'),
    'cantTell',
    ['1.3.3'],
    'RGAA 1.3.3 lists every text-alternative source of an image button'
  ],
  [
    'video-caption',
    page('<video controls src="a.mp4"><track kind="subtitles" srclang="en" src="en.vtt"></video>'),
    'cantTell',
    ['4.3.1', '4.4.1'],
    'subtitles may be dialogue alone, without speakers and sounds'
  ],
  [
    'no-autoplay-audio',
    page('<div style="display:none"><audio autoplay loop src="m.mp3"></audio></div>'),
    'cantTell',
    ['4.10.1'],
    'hidden audio that plays on its own is still sound'
  ],
  [
    'click-handler-keyboard-operable',
    page('<main><span role="button" onclick="ouvrir()">Gérer mes cookies</span></main>'),
    'fail',
    ['7.3.1'],
    'RGAA 7.3.1 asks that an element with a script handler be reachable by keyboard'
  ],
  [
    'canvas-text-alternative-quality',
    page('<canvas id="canvas1">Sales 2024: 10k</canvas>'),
    'cantTell',
    ['1.3.7', '1.3.8'],
    "RGAA 1.3.8 asks whether a canvas's fallback content is rendered correctly, which the same review answers"
  ]
];

for (const [ruleId, html, outcome, tests, why] of CASES) {
  test(`${ruleId}: ${outcome}, naming RGAA ${tests.join(', ') || 'no test'} (${why})`, () => {
    const rule = runa11yCoreOnHtml(html, RGAA).checksResults.find((r) => r.ruleId === ruleId);
    assert.ok(rule, `${ruleId} runs under rgaa-4.1.2`);
    assert.equal(rule.outcome, outcome);
    assert.deepEqual(rgaaTestsOf(rule), tests);
    // Its WCAG mappings are kept beside RGAA's.
    assert.ok(rule.meta.normativeMappings.some((m) => m.standard === 'WCAG'));
  });
}

// img-alt-present's WCAG verdict stays. Under RGAA, a link's only image is
// judged as the link's label (glossary « Image porteuse d'information »,
// note 1): rgaa-link-content-label-present fails it, not theme 1.
test('alt=" " on a link\'s only image fails RGAA 6.2.1, not 1.1.1, and img-alt-decorative does not ask', () => {
  const result = runa11yCoreOnHtml(page('<a href="/"><img id="a" src="a.png" alt=" "></a>'), RGAA);
  const rule = (id) => result.checksResults.find((r) => r.ruleId === id);
  assert.equal(rule('img-alt-decorative').outcome, 'notApplicable');
  assert.equal(rule('img-alt-present').outcome, 'fail');
  assert.ok(!rgaaTestsOf(rule('img-alt-present')).includes('1.1.1'));
  assert.equal(rule('rgaa-img-alt-present').outcome, 'notApplicable');
  assert.equal(rule('rgaa-link-content-label-present').outcome, 'fail');
});

// A video with a captions track is asked whether the captions are complete
// (CAPTIONS_REVIEW): that is 4.4.1, their relevance, not 4.3.1, their
// presence.
test('video-caption asks about complete captions under RGAA 4.4.1, and about missing ones under 4.3.1', () => {
  const run = (track) =>
    runa11yCoreOnHtml(page(`<video controls src="a.mp4">${track}</video>`), RGAA);
  const outcome = (result, id) => rollupOutcome(result.rulesResults.find((r) => r.ruleId === id));
  const captioned = run('<track kind="captions" srclang="fr" src="fr.vtt">');
  const occ = captioned.checksResults.find((r) => r.ruleId === 'video-caption').occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'CAPTIONS_REVIEW');
  assert.equal(outcome(captioned, 'rgaa-4.1.2-4.4'), 'cantTell');
  assert.notEqual(outcome(captioned, 'rgaa-4.1.2-4.3'), 'cantTell');
  const bare = run('');
  assert.equal(outcome(bare, 'rgaa-4.1.2-4.3'), 'cantTell');
  assert.notEqual(outcome(bare, 'rgaa-4.1.2-4.4'), 'cantTell');
});

// RGAA 5.7.4 covers cells associated with headers that have an id; a cell
// with no header at all is not one, so td-has-header does not report under
// 5.7 while its WCAG 1.3.1 verdict stays.
test('td-has-header fails WCAG 1.3.1 but not RGAA 5.7 in the same run', () => {
  // Headers over the first two columns only: the cells of the other two
  // have none. A table with no header at all is only asked about.
  const head = '<tr><th>A</th><th>B</th><td>3</td><td>4</td></tr>';
  const rows =
    head +
    [5, 9, 13]
      .map((n) => `<tr>${[0, 1, 2, 3].map((i) => `<td>${n + i}</td>`).join('')}</tr>`)
      .join('');
  const result = runa11yCoreOnHtml(page(`<table>${rows}</table>`), RGAA);
  const rollup = (id) => result.rulesResults.find((r) => r.ruleId === id);
  assert.equal(result.checksResults.find((r) => r.ruleId === 'td-has-header').outcome, 'fail');
  assert.equal(rollupOutcome(rollup('wcag-1.3.1-info-and-relationships')), 'fail');
  const r57 = rollup('rgaa-4.1.2-5.7');
  assert.ok(!r57 || !r57.data.details.checksIds.includes('td-has-header'));
  assert.ok(!r57 || r57.outcome !== 'fail');
});

// Rules RGAA maps but WCAG does not: the profile runs them (mappedRules).
test('the profile runs the best-practice rules RGAA maps: skip-link and heading-order', () => {
  const result = runa11yCoreOnHtml(page('<h1>a</h1><h3>b</h3>'), RGAA);
  for (const id of ['skip-link', 'heading-order']) {
    assert.ok(
      result.checksResults.some((r) => r.ruleId === id),
      `${id} runs under rgaa-4.1.2`
    );
  }
});
