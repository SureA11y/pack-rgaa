/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person assesses RGAA by hand: core's proceduresFor, listProcedures
 * and procedureChecklist read these, criterion by criterion, in RGAA's own
 * French. RGAA is the source, so its text is not rewritten: a criterion is a
 * requirement, each of its tests a facet labelled with the test and its
 * conditions, with RGAA's methodology (data/methodologies-4.1.2.json, in
 * map.js) as its steps.
 *
 * What the methodology doesn't give is derived: when a test fails, which
 * RGAA only says of passing; which tools it needs, from its words; and how
 * much of it the rules decide, from rule-map.js. A rule that can only ask
 * decides nothing, so a test it looks at is still manual.
 */

const { RGAA_VERSIONS, RGAA_THEMES, RGAA_CRITERIA, RGAA_TESTS } = require('./map');
const { RGAA_GLOSSARY } = require('./glossary');
const { COMPLETE_CHECK, testsRulesDecide } = require('./mappings');

// A test's facet id: the test's number in the shape of core's ids.
const facetOf = (test) => `test-${test.replace(/\./g, '-')}`;

// What a test needs besides a browser, by what it says.
const TOOLS = [
  ['keyboard', /clavier|\btouches?\b(?! d)|tabulation|\bfocus\b/i],
  ['pointer', /survol|dispositif de pointage|souris|\bclic/i],
  ['screen-reader', /technologies? d.assistance|lecteur d.écran|restitués? par/i],
  ['zoom', /zoom (?:texte|graphique|du navigateur)|\b(?:320|256) ?px/i],
  ['devtools', /attribut|\bbalise|code source|propriété|CSS|WAI-ARIA|<[a-z]/]
];

// Where the words mislead: the test's own subject, and « toucher » (a touch
// screen), which is no key.
const TOOLS_OF_TEST = {
  '7.1.1': ['screen-reader', 'devtools'],
  '7.1.2': ['screen-reader', 'keyboard'],
  '7.1.3': ['screen-reader', 'devtools'],
  '7.3.2': ['keyboard'],
  '7.5.1': ['screen-reader', 'devtools'],
  '7.5.2': ['screen-reader', 'devtools'],
  '7.5.3': ['screen-reader', 'devtools'],
  '13.10.1': ['pointer'],
  '13.10.2': ['pointer']
};

function toolsOf(test, row) {
  if (TOOLS_OF_TEST[test]) return TOOLS_OF_TEST[test];
  const text = [row.title, ...(row.conditions || []), ...row.methodology.steps].join(' ');
  return TOOLS.filter(([, words]) => words.test(text)).map(([tool]) => tool);
}

// The criterion's own « cas particuliers » and « notes techniques », the
// notes of its tests, and the glossary terms it leans on, under its heading.
function noteOf(version, criterion) {
  const row = RGAA_CRITERIA[version][criterion];
  const parts = [];
  if (row.particularCases) parts.push(`Cas particuliers : ${row.particularCases.join(' ')}`);
  if (row.technicalNotes) parts.push(`Notes techniques : ${row.technicalNotes.join(' ')}`);
  for (const test of row.tests) {
    const { note } = RGAA_TESTS[version][test].methodology;
    if (note) parts.push(`Note du test ${test} : ${note}`);
  }
  const terms = row.glossary.map((anchor) => RGAA_GLOSSARY[version][anchor].term);
  if (terms.length) parts.push(`Glossaire : ${terms.join(' ; ')}.`);
  return parts.join(' ');
}

function requirementOf(version, criterion, decided) {
  const row = RGAA_CRITERIA[version][criterion];
  const complete = (COMPLETE_CHECK[version] || []).includes(criterion);
  const note = noteOf(version, criterion);
  return {
    title: row.title,
    relatesTo: row.wcagSc,
    ...(note ? { note } : {}),
    facets: row.tests.map((test) => {
      const entry = RGAA_TESTS[version][test];
      const conditions = (entry.conditions || []).map((c) => `- ${c}`);
      return {
        id: facetOf(test),
        label: [`Test ${test} : ${entry.title}`, ...conditions].join(' '),
        automation: !decided.has(test) ? 'manual' : complete ? 'full' : 'partial',
        tools: toolsOf(test, entry),
        steps: entry.methodology.steps,
        passWhen: entry.methodology.passWhen || 'Si c’est le cas, le test est validé.',
        failWhen: `Si un élément concerné ne le vérifie pas, le test ${test} n’est pas validé, ce qui invalide {{requirement}}.`
      };
    })
  };
}

// What a reader should know before using them, in a page of procedures.
const notes = {
  '4.1.2': [
    'Ces procédures reprennent la méthodologie de test du RGAA 4.1.2 (DINUM, Licence Ouverte 2.0). Elles s’utilisent avec le référentiel et son glossaire (https://accessibilite.numerique.gouv.fr/methode/glossaire/) et ne les remplacent pas.',
    'Un audit porte sur un échantillon représentatif de pages. Chaque critère y est conforme, non conforme ou non applicable : il est validé s’il l’est sur toutes les pages de l’échantillon, et applicable s’il l’est sur une seule. Le taux de conformité est la part des critères applicables qui sont validés.',
    'Un critère est non applicable à une page dans trois cas : le contenu ou la fonctionnalité dont il traite n’existe pas sur la page ; ce contenu est exempté de l’obligation d’accessibilité ; ou il est soumis à dérogation pour charge disproportionnée et accompagné d’une alternative numérique accessible. Un test dont la première étape ne trouve rien est donc non applicable, et non invalidé.',
    'Les tests de restitution se font sur les combinaisons de technologies d’assistance et de navigateurs de l’environnement de test du RGAA (https://accessibilite.numerique.gouv.fr/methode/environnement-de-test/).',
    'Les facettes listent les règles propres à ce module. Les règles de @surea11y/core qui vérifient aussi un test figurent dans docs/RGAA_MAPPING.md.'
  ]
};

/**
 * The standard's procedures, groups and notes. `isManual` says whether a rule
 * only asks: `automation` reads it, so what the rules decide is what they do.
 */
function proceduresOf(isManual) {
  const procedures = {};
  const groups = {};
  for (const { version } of RGAA_VERSIONS) {
    const decided = testsRulesDecide(version, isManual);
    procedures[version] = {};
    for (const criterion of Object.keys(RGAA_CRITERIA[version])) {
      procedures[version][criterion] = requirementOf(version, criterion, decided);
    }
    groups[version] = RGAA_THEMES[version].map(({ number, title }) => ({
      id: String(number),
      title,
      requirements: Object.keys(RGAA_CRITERIA[version]).filter(
        (criterion) => RGAA_CRITERIA[version][criterion].theme === number
      )
    }));
  }
  return { procedures, groups, notes };
}

module.exports = { proceduresOf, facetOf };
