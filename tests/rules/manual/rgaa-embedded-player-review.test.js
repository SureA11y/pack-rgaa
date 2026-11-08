'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');
const rgaaComposites = () => require('../../..').standard.composites();

const RULE_ID = 'rgaa-embedded-player-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}
const frame = (src, attr = 'src') =>
  `<iframe ${attr}="${src}" title="Vidéo" width="320" height="180"></iframe>`;

// A player shows « un média temporel »: theme 4 asks for its alternatives
// and controls, which only a person can check.
test(`${RULE_ID}: known players are asked about`, () => {
  for (const [src, service] of [
    ['https://www.youtube.com/embed/abc', 'YouTube'],
    ['https://www.youtube-nocookie.com/embed/abc?rel=0', 'YouTube'],
    ['https://player.vimeo.com/video/123', 'Vimeo'],
    ['https://www.dailymotion.com/embed/video/x8', 'Dailymotion'],
    ['https://peertube.example.org/videos/embed/9c9de5e8', 'PeerTube'],
    ['https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1', 'SoundCloud']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(frame(src)), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(
      rule.occurrences[0].data.details,
      { reasonCode: 'embeddedPlayer', service },
      src
    );
  }
  // A lazy loader's data-src counts.
  assertRule(
    runa11yCoreOnHtml(page(frame('https://www.youtube.com/embed/abc', 'data-src')), RUN),
    RULE_ID,
    'cantTell'
  );
});

test(`${RULE_ID}: a player that starts by itself is asked about under 4.10 too`, () => {
  for (const src of [
    'https://www.youtube.com/embed/abc?autoplay=1&mute=0',
    'https://w.soundcloud.com/player/?url=x&auto_play=true'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(frame(src)), RUN), RULE_ID, 'cantTell');
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'embeddedPlayerAutoplay', src);
  }
  const at = (body) => {
    const r = runa11yCoreOnHtml(page(body), RGAA).rulesResults.find(
      (x) => x.ruleId === 'rgaa-4.1.2-4.10'
    );
    return r ? r.outcome : 'notApplicable';
  };
  assert.equal(at(frame('https://www.youtube.com/embed/abc?autoplay=1')), 'cantTell');
  // Without autoplay nothing is asked about under 4.10, and the criterion is
  // only partly checked.
  assert.equal(
    runa11yCoreOnHtml(page(frame('https://www.youtube.com/embed/abc')), RGAA).rulesResults.find(
      (x) => x.ruleId === 'rgaa-4.1.2-4.10'
    ).data.details.reasonCode,
    'composite.rollup.cantTell.partialCheck'
  );
  const c = rgaaComposites().find((x) => x.id === 'rgaa-4.1.2-4.10');
  assert.deepEqual(c.meta.contributions[RULE_ID], {
    default: 'ignore',
    codes: { embeddedPlayerAutoplay: { act: 'count', requirements: ['4.10.1'] } }
  });
});

test(`${RULE_ID}: other frames and hidden players are not applicable`, () => {
  for (const body of [
    frame('https://www.openstreetmap.org/export/embed.html'),
    frame('https://www.youtube.com/channel/abc'),
    '<div style="display:none">' + frame('https://www.youtube.com/embed/abc') + '</div>',
    '<p>Pas de vidéo</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable', body);
  }
});

test(`${RULE_ID}: messages follow the scan locale; RGAA 4.1 asks under the profile`, () => {
  const html = page(frame('https://player.vimeo.com/video/123'));
  const rule = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].summary, 'Ce lecteur Vimeo affiche un média.');
  const r = runa11yCoreOnHtml(html, RGAA).rulesResults.find((x) => x.ruleId === 'rgaa-4.1.2-4.1');
  assert.equal(r.outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['epr_case_01', 'epr_case_02']);
});
