'use strict';

/**
 * The public entry point in RGAA's terms: what words mean, the status of each
 * criterion, and the rate of conformity DINUM defines.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RGAA_CRITERIA,
  rgaaCriteriaStatus,
  rgaaConformityRate,
  rgaaGlossaryFor
} = require('../public');
const { runa11yCoreOnHtml } = require('./helpers/run.js');

const page =
  '<!doctype html><html><head><title>Accueil</title></head><body><main><h1>Accueil</h1></main></body></html>';

test('a scan is read as an audit grid: a status per criterion, all of them', () => {
  const rows = rgaaCriteriaStatus(
    runa11yCoreOnHtml(page, { engineOptions: { profile: 'rgaa-4.1.2' } })
  );
  assert.equal(rows.length, Object.keys(RGAA_CRITERIA['4.1.2']).length);
  const of = (id) => rows.find((r) => r.criterion === id);
  assert.deepEqual([of('8.3').status, of('8.3').outcome], ['NC', 'fail']);
  assert.deepEqual([of('8.5').status, of('8.5').outcome], ['C', 'pass']);
  // What a person must assess, and what no rule looks at, is not tested.
  assert.deepEqual([of('8.6').status, of('8.6').outcome], ['NT', 'cantTell']);
  assert.deepEqual([of('10.2').status, of('10.2').outcome], ['NT', null]);
  assert.throws(() => rgaaCriteriaStatus({}, { version: '3' }), RangeError);
});

test('a criterion counts as validated only if it is on every page of the sample', () => {
  const rate = rgaaConformityRate([
    [
      { criterion: '1.1', status: 'C' },
      { criterion: '1.2', status: 'C' },
      { criterion: '1.3', status: 'NA' }
    ],
    [
      { criterion: '1.1', status: 'NC' },
      { criterion: '1.2', status: 'NA' },
      { criterion: '1.3', status: 'NA' }
    ]
  ]);
  // 1.1 fails on one page; 1.2 is applicable on one page and validated there;
  // 1.3 is not applicable anywhere.
  assert.deepEqual(
    [rate.validated, rate.applicable, rate.rate, rate.pageRates],
    [1, 2, 0.5, [1, 0]]
  );
  assert.equal(rate.average, 0.5);
  assert.equal(rate.complete, true);
});

test('a sample with criteria still to assess is no conformity claim', () => {
  const rate = rgaaConformityRate([[{ criterion: '1.1', status: 'NT' }]]);
  assert.deepEqual([rate.rate, rate.average, rate.complete], [null, null, false]);
});

test("a test's or a criterion's words have their definitions", () => {
  const [first] = rgaaGlossaryFor('1.1.1');
  assert.ok(first.anchor && first.term && first.definition.length);
  assert.ok(rgaaGlossaryFor('1.1').length >= rgaaGlossaryFor('1.1.1').length);
  assert.deepEqual(rgaaGlossaryFor('99.9'), []);
});
