'use strict';

/**
 * The standard is built from data with core's standardFromData
 * (standard-data.js). Before, the pack built it with its own functions
 * (mappings.js up to 1.0.0); what they gave with core 1.16.1 is
 * recorded in tests/fixtures/standard/core-1.16.1.json (tests/helpers/
 * standard-facts.js): every rollup, every rule's entries, every WCAG
 * rollup's entries and the validation of every rule. Core's give the same.
 * The comparison is skipped with another core, or one whose rules changed.
 * What the pack has changed on purpose since is listed (CHANGED_SINCE).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  standardDataOf,
  checkStandardData,
  checkPack,
  describePacks,
  lawOf
} = require('@surea11y/core/pack');
const pack = require('..');
const { STANDARD_DATA } = require('../standard-data');
const { RGAA_CRITERIA, RGAA_TESTS } = require('../map');
const { standardFacts, catalogHash, FILE, CORE_VERSION } = require('./helpers/standard-facts');

const recorded = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : null;
const skip =
  (!recorded && `nothing recorded with core ${CORE_VERSION}`) ||
  (recorded.catalog !== catalogHash() && `core ${CORE_VERSION}'s rules changed since`);

// What the pack has changed on purpose since the record was taken, rollup
// by rollup, with the reason: these differ from it, and nothing else does.
const CHANGED_SINCE = {
  // 1.2.0: requiredNotIndicated and markerNotExplained count toward 11.10.2
  // only. They are given only for a field with required or
  // aria-required="true", which condition 2 of 11.10.1 accepts.
  'rgaa-4.1.2-11.10': '1.2.0',
  // 1.2.0: rgaa-cryptic-content-review's titleOnly code counts toward no
  // test, so content with a title counts as checked rather than not found.
  'rgaa-4.1.2-13.5': '1.2.0'
};

test(
  'core’s functions give what the pack’s own gave: rollups, entries, validation',
  { skip },
  () => {
    const facts = standardFacts(pack.standard);
    const was = new Map(recorded.rollups);
    for (const [id, h] of facts.rollups) {
      if (!CHANGED_SINCE[id]) continue;
      assert.notEqual(h, was.get(id), `${id} changed in ${CHANGED_SINCE[id]}`);
    }
    facts.rollups = facts.rollups.map(([id, h]) => [id, CHANGED_SINCE[id] ? was.get(id) : h]);
    assert.deepEqual(facts, recorded);
  }
);

test('the pack’s standard gives back its data, sound and frozen', () => {
  const data = standardDataOf(pack.standard);
  assert.ok(data);
  assert.deepEqual(checkStandardData(data), []);
  assert.deepEqual(JSON.parse(JSON.stringify(data)), JSON.parse(JSON.stringify(STANDARD_DATA)));
  assert.ok(Object.isFrozen(data.data['4.1.2'].ruleMap));
  assert.equal(
    Object.keys(data.data['4.1.2'].requirements).length,
    Object.keys(RGAA_CRITERIA['4.1.2']).length
  );
  assert.equal(
    Object.keys(data.data['4.1.2'].tests).length,
    Object.keys(RGAA_TESTS['4.1.2']).length
  );
  assert.deepEqual(checkPack(pack), []);
});

test('the profile serves article 47, which results and describePacks name', () => {
  assert.equal(pack.standard.profiles['rgaa-4.1.2'].law, 'fr-article-47');
  const law = lawOf(pack.standard, 'fr-article-47', 'fr');
  assert.equal(law.jurisdiction, 'FR');
  assert.equal(law.lang, 'fr');
  // Named, with its official text, and nothing more: the pack doesn't
  // document the law.
  assert.deepEqual(Object.keys(pack.standard.laws['fr-article-47']).sort(), [
    'jurisdiction',
    'name',
    'sources'
  ]);
  assert.match(law.sources[0].url, /^https:\/\/www\.legifrance\.gouv\.fr\//);
  const { runa11yCoreOnHtml } = require('./helpers/run.js');
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="fr"><head><title>t</title></head><body><main><p>x</p></main></body></html>',
    { engineOptions: { profile: 'rgaa-4.1.2' } }
  );
  assert.deepEqual(result.engine.law, {
    id: 'fr-article-47',
    name: 'Article 47 de la loi n° 2005-102 du 11 février 2005',
    jurisdiction: 'FR',
    lang: 'fr'
  });
  const [described] = describePacks([pack]);
  assert.deepEqual(
    described.standard.laws.map((l) => [l.id, l.profiles]),
    [['fr-article-47', ['rgaa-4.1.2']]]
  );
  // The experimental APIs of core it uses, for which its range is ~1.16.1.
  assert.deepEqual(described.experimental.map((e) => e.id).sort(), [
    'ruleMappedStandard tests',
    'skip-link details.lean',
    'standard data',
    'standard laws',
    'standard.review dictionary keys'
  ]);
});
