'use strict';

/**
 * How a person assesses RGAA by hand: each criterion a requirement and each
 * test a facet, in RGAA's own words, read through core's procedures.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('@surea11y/core');
const pack = require('..');
const { RGAA_CRITERIA, RGAA_TESTS, RGAA_THEMES } = require('../map');
const { RGAA_GLOSSARY } = require('../glossary');
const { COMPLETE_CHECK, testsRulesDecide } = require('../mappings');
const { CORE_MANUAL_RULES } = require('../review');

const V = '4.1.2';
const options = { packs: [pack], standard: 'rgaa' };
const listed = core.listProcedures(options);

test('every criterion is listed, in its theme, with a facet per test', () => {
  assert.equal(listed.standard, 'RGAA');
  assert.equal(listed.version, V);
  assert.deepEqual(
    listed.requirements.map((r) => r.id).sort(),
    Object.keys(RGAA_CRITERIA[V]).sort()
  );
  for (const r of listed.requirements) {
    assert.equal(r.complete, true, r.id);
    assert.deepEqual(
      r.facets.map((f) => f.label.split(' ')[1]),
      RGAA_CRITERIA[V][r.id].tests,
      r.id
    );
  }
  assert.deepEqual(
    listed.groups.map((g) => g.title),
    RGAA_THEMES[V].map((t) => t.title)
  );
  assert.equal(
    listed.groups.flatMap((g) => g.requirements).length,
    Object.keys(RGAA_CRITERIA[V]).length
  );
});

test("a facet's steps are RGAA's methodology, and it says which test fails", () => {
  const { facets } = core.proceduresFor('8.5', options);
  assert.deepEqual(facets[0].procedure.steps, RGAA_TESTS[V]['8.5.1'].methodology.steps);
  assert.equal(facets[0].procedure.passWhen, RGAA_TESTS[V]['8.5.1'].methodology.passWhen);
  assert.match(facets[0].procedure.failWhen, /le test 8\.5\.1 n’est pas validé.*RGAA 8\.5/);
});

test('a test copying another takes its steps, and says which part is its own', () => {
  assert.deepEqual(RGAA_TESTS[V]['7.5.2'].methodology, RGAA_TESTS[V]['7.5.1'].methodology);
  for (const [criterion, parts] of [
    ['7.5', [/étape 3/, /étape 4/, /étape 5/]],
    ['8.1', [/présence/, /validité/, /avant la balise <html>/]]
  ]) {
    const { facets } = core.proceduresFor(criterion, options);
    facets.forEach((f, i) => assert.match(f.procedure.failWhen, parts[i], f.id));
  }
});

test('how much the rules decide follows the mapping, and a rule that only asks decides nothing', () => {
  const manual = (id) =>
    CORE_MANUAL_RULES.includes(id) ||
    pack.rules.some((r) => r.id === id && r.meta.type === 'manual');
  const decided = testsRulesDecide(V, manual);
  for (const r of listed.requirements) {
    for (const f of r.facets) {
      const id = f.label.split(' ')[1];
      const expected = !decided.has(id)
        ? 'manual'
        : COMPLETE_CHECK[V].includes(r.id)
          ? 'full'
          : 'partial';
      assert.equal(f.automation, expected, id);
    }
  }
  assert.equal(core.proceduresFor('1.4', options).facets[0].automation, 'manual');
});

test("a facet gives the test's own conditions", () => {
  const [first] = core.proceduresFor('10.6', options).facets;
  assert.match(first.label, /au survol autre qu’un changement de couleur/);
  assert.doesNotMatch(core.proceduresFor('13.8', options).facets[0].label, /^$/);
});

test("what RGAA writes after a test's verdict is a note, not part of passing", () => {
  const r = core.proceduresFor('13.8', options);
  assert.match(r.facets[1].procedure.passWhen, /le test est validé\.?$/);
  assert.match(r.note, /Note du test 13\.8\.2 : .*prise de focus/);
});

test('a test with nothing to check is not applicable, and nothing else reads as failing it', () => {
  assert.ok(
    listed.notes.some((n) => /première étape ne trouve rien est donc non applicable/.test(n))
  );
  assert.match(core.proceduresFor('1.1', options).facets[0].procedure.failWhen, /élément concerné/);
});

test('the tools come from what a test asks, not from a word that looks like it', () => {
  const tools = (requirement, i = 0) =>
    core.proceduresFor(requirement, options).facets[i].tools.map((t) => t.id);
  assert.ok(!tools('3.2').includes('screen-reader'));
  assert.ok(!tools('13.10').includes('keyboard'));
  assert.ok(tools('7.1').includes('screen-reader'));
  assert.ok(tools('7.3', 1).includes('keyboard'));
  assert.ok(tools('10.11').includes('zoom'));
});

test('a pack rule is listed under the facets of the tests it checks', () => {
  const { facets } = core.proceduresFor('8.1', options);
  assert.ok(facets[0].rules.includes('rgaa-doctype-present'));
  // Its undecided findings read under the test they count toward.
  const { facets: lang } = core.proceduresFor('13.8', options);
  assert.ok(lang.some((f) => f.variants.some((v) => v.ruleId === 'rgaa-moving-content-review')));
});

test("a criterion's notes and glossary terms come with it", () => {
  const contrast = core.proceduresFor('3.2', options);
  assert.match(contrast.note, /Cas particuliers : .*logo/);
  assert.match(contrast.note, /Glossaire : /);
  const images = core.proceduresFor('1.1', options);
  assert.match(images.note, /image porteuse d’information/i);
});

test('RGAA relates its criteria to WCAG, both ways', () => {
  const related = core.relatedRequirements('1.4.3', { packs: [pack] });
  assert.deepEqual(related.map((r) => r.id).sort(), ['10.5', '3.2'].sort());
  assert.equal(related[0].relation, 'relatesTo');
  assert.deepEqual(
    core.relatedRequirements('8.5', options).map((r) => r.id),
    RGAA_CRITERIA[V]['8.5'].wcagSc
  );
});

test('the standard is read in French, and a page of its procedures says so', () => {
  assert.equal(core.listProcedures({ ...options, locale: 'de' }).locale, 'fr');
  const html = core.renderProcedures(core.procedureChecklist(options), { packs: [pack] });
  assert.match(html, /<html lang="fr"/);
  assert.match(html, /méthodologie de test du RGAA 4\.1\.2/);
});

test('every word a test links to has its definition', () => {
  for (const [id, t] of Object.entries(RGAA_TESTS[V])) {
    for (const anchor of t.glossary || []) assert.ok(RGAA_GLOSSARY[V][anchor], `${id}: ${anchor}`);
  }
  assert.equal(Object.keys(RGAA_GLOSSARY[V]).length, 119);
});
