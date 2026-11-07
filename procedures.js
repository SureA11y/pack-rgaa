/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person assesses RGAA by hand: core's proceduresFor, listProcedures
 * and procedureChecklist read these, criterion by criterion, in RGAA's own
 * French. RGAA is the source, so nothing here is written: a criterion is a
 * requirement, and each of its tests a facet with RGAA's methodology
 * (data/methodologies-4.1.2.json, in map.js) as its steps.
 *
 * What the methodology doesn't give is derived: when a test fails, which
 * RGAA only says of passing; which tools it needs, from its words; and how
 * much of it the rules decide, from rule-map.js.
 */

const { RGAA_VERSIONS, RGAA_THEMES, RGAA_CRITERIA, RGAA_TESTS } = require('./map');
const { RGAA_GLOSSARY } = require('./glossary');
const { COMPLETE_CHECK, testsWithRules } = require('./mappings');

// A test's facet id: the test's number in the shape of core's ids.
const facetOf = (test) => `test-${test.replace(/\./g, '-')}`;

// What a test needs besides a browser, by what its methodology says.
const TOOLS = [
  ['keyboard', /clavier|touche|tabulation/i],
  ['pointer', /dispositif de pointage|souris/i],
  ['screen-reader', /technologies? d.assistance|lecteur d.écran|restitution|restitué/i],
  ['zoom', /zoom/i],
  ['devtools', /élément|attribut|balise|code source|propriété|CSS|WAI-ARIA/]
];

function toolsOf(methodology) {
  const text = methodology.steps.join(' ');
  return TOOLS.filter(([, words]) => words.test(text)).map(([tool]) => tool);
}

const quoted = (lines) => lines.join(' ');

// The criterion's own « cas particuliers » and « notes techniques », and the
// glossary terms its tests lean on, under its heading.
function noteOf(version, criterion) {
  const row = RGAA_CRITERIA[version][criterion];
  const glossary = RGAA_GLOSSARY[version];
  const terms = [...new Set(row.tests.flatMap((t) => RGAA_TESTS[version][t].glossary || []))].map(
    (anchor) => glossary[anchor].term
  );
  const parts = [];
  if (row.particularCases) parts.push(`Cas particuliers : ${quoted(row.particularCases)}`);
  if (row.technicalNotes) parts.push(`Notes techniques : ${quoted(row.technicalNotes)}`);
  if (terms.length) parts.push(`Glossaire : ${terms.join(' ; ')}.`);
  return parts.join(' ');
}

function requirementOf(version, criterion, ruled) {
  const row = RGAA_CRITERIA[version][criterion];
  const complete = (COMPLETE_CHECK[version] || []).includes(criterion);
  const note = noteOf(version, criterion);
  return {
    title: row.title,
    relatesTo: row.wcagSc,
    ...(note ? { note } : {}),
    facets: row.tests.map((test) => {
      const { title, methodology } = RGAA_TESTS[version][test];
      return {
        id: facetOf(test),
        label: `Test ${test} : ${title}`,
        automation: !ruled.has(test) ? 'manual' : complete ? 'full' : 'partial',
        tools: toolsOf(methodology),
        steps: methodology.steps,
        passWhen: methodology.passWhen || 'Si c’est le cas, le test est validé.',
        failWhen: `Si ce n’est pas le cas, le test ${test} n’est pas validé, ce qui invalide {{requirement}}.`
      };
    })
  };
}

const procedures = {};
const groups = {};
for (const { version } of RGAA_VERSIONS) {
  const ruled = testsWithRules(version);
  procedures[version] = {};
  for (const criterion of Object.keys(RGAA_CRITERIA[version])) {
    procedures[version][criterion] = requirementOf(version, criterion, ruled);
  }
  groups[version] = RGAA_THEMES[version].map(({ number, title }) => ({
    id: String(number),
    title,
    requirements: Object.keys(RGAA_CRITERIA[version]).filter(
      (criterion) => RGAA_CRITERIA[version][criterion].theme === number
    )
  }));
}

// What a reader should know before using them, in a page of procedures.
const notes = {
  '4.1.2': [
    'Ces procédures reprennent la méthodologie de test du RGAA 4.1.2 (DINUM, Licence Ouverte 2.0). Elles s’utilisent avec le référentiel et son glossaire (https://accessibilite.numerique.gouv.fr/methode/glossaire/) et ne les remplacent pas.',
    'Un audit porte sur un échantillon représentatif de pages. Chaque critère y est conforme, non conforme ou non applicable : il est validé s’il l’est sur toutes les pages de l’échantillon, et applicable s’il l’est sur une seule. Le taux de conformité est la part des critères applicables qui sont validés.',
    'Les tests de restitution se font sur les combinaisons de technologies d’assistance et de navigateurs de l’environnement de test du RGAA (https://accessibilite.numerique.gouv.fr/methode/environnement-de-test/).'
  ]
};

module.exports = { procedures, groups, notes, facetOf };
