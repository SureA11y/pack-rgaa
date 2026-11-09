'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-cryptic-content-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

// 13.5.1: each « contenu cryptique (art ASCII, émoticône, syntaxe
// cryptique) » has a title or is defined by the adjacent context.
test(`${RULE_ID}: emoticons, emoji and ASCII art with no title are asked about`, () => {
  for (const [body, kind] of [
    ['<p>Merci pour votre visite :-)</p>', 'emoticon'],
    ['<p>À bientôt ;)</p>', 'emoticon'],
    ['<p>Bonne nouvelle 🎉 pour tous</p>', 'emoji'],
    ['<pre>  /\\_/\\\n ( o.o )\n  > ^ <</pre>', 'asciiArt']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, kind, body);
  }
});

// A title is RGAA's: rule-map.js counts it toward no test. A standard that
// doesn't accept one (RAWeb 1.1) asks about it.
test(`${RULE_ID}: content with a title is reported apart, as titleOnly`, () => {
  for (const [body, kind] of [
    ['<p><abbr title="sourire">:-)</abbr></p>', 'emoticon'],
    ['<p>Bravo <span title="fête">🎉</span></p>', 'emoji'],
    ['<pre title="un chat">  /\\_/\\\n ( o.o )\n  > ^ <</pre>', 'asciiArt']
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(
      [rule.occurrences[0].data.details.reasonCode, rule.occurrences[0].data.details.kind],
      ['titleOnly', kind],
      body
    );
  }
});

test(`${RULE_ID}: a named role="img", code, signs or plain text is not applicable`, () => {
  for (const body of [
    '<p>Bravo <span role="img" aria-label="fête">🎉</span></p>',
    '<p>Bravo <span aria-hidden="true">🎉</span></p>',
    '<code>a :) b</code>',
    '<p>Copyright © 2024 ™</p>',
    '<p>Horaires : 9h-12h (fermé le lundi)</p>',
    '<pre>const a = 1;\nconst b = 2;\nconst c = a + b;</pre>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.deepEqual(
    rule.occurrences.map((o) => [/id="(ccv_case_\d+)"/.exec(o.html)[1], o.data.details.reasonCode]),
    [
      ['ccv_case_01', 'emoticon'],
      ['ccv_case_02', 'titleOnly']
    ]
  );
});
