'use strict';

/**
 * Generate map.js and glossary.js from the RGAA source data in
 * data/ (see the README there for provenance and licence).
 *
 * Usage:
 *   node scripts/generate-map.js           write the module
 *   node scripts/generate-map.js --check   exit 1 if it is out of date
 *
 * The text is RGAA's own, in French, with only its Markdown taken out:
 * glossary links keep their words and code spans lose their backticks, so
 * "Chaque [image porteuse d’information](#image-porteuse-d-information)"
 * becomes "Chaque image porteuse d’information". Nothing is translated or
 * reworded.
 */

const fs = require('fs');
const path = require('path');

const PROFILE_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(PROFILE_DIR, 'data');
const OUTPUT_FILE = path.join(PROFILE_DIR, 'map.js');
const GLOSSARY_FILE = path.join(PROFILE_DIR, 'glossary.js');

// Oldest first. `published` is when the version appeared in the source
// repository; `wcagVersion` is the WCAG version its criteria are built on.
const SOURCES = [
  {
    version: '4.1.2',
    published: '2023-04',
    wcagVersion: '2.1',
    file: 'criteres-4.1.2.json',
    methodologies: 'methodologies-4.1.2.json',
    glossary: 'glossaire-4.1.2.json'
  }
];

function plainText(markdown) {
  return String(markdown)
    .replace(/<(a|span)\s[^>]*>(.*?)<\/\1>/g, '$2')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// The notes of a criterion, as RGAA gives them: strings and { ul: [...] }.
function noteLines(value) {
  const out = [];
  for (const item of Array.isArray(value) ? value : value ? [value] : []) {
    if (typeof item === 'string') out.push(plainText(item));
    else if (item && Array.isArray(item.ul)) {
      out.push(...item.ul.map((li) => `- ${plainText(String(li).replace(/^-\s*/, ''))}`));
    }
  }
  return out.filter(Boolean);
}

// The glossary terms a text links to, by their anchors, in order.
function glossaryLinks(texts) {
  const out = [];
  for (const text of texts) {
    for (const m of String(text).matchAll(/\]\(#([^)]+)\)/g)) {
      if (!out.includes(m[1])) out.push(m[1]);
    }
  }
  return out;
}

const stepText = (markdown) => plainText(String(markdown).replace(/\*\*/g, ''));

// A test's methodology as RGAA writes it: numbered steps, the last of which
// says when the test is passed. A sub-list stays in its step. "Tests
// identiques à 7.5.1" takes that test's steps.
function methodologyOf(id, methodologies) {
  const source = String(methodologies[id] || '');
  const same = /^Tests? identiques? à ([\d.]+)/.exec(source.trim());
  if (same) return methodologyOf(same[1], methodologies);
  const steps = source
    .replace(/^Test [\d.]+\s*/, '')
    .split(/\n(?=\d+\.\s)/)
    .map((step) => stepText(step.replace(/^\s*\d+\.\s*/, '')))
    .filter(Boolean);
  if (!steps.length) throw new Error(`[generate-rgaa-map] no methodology for test ${id}`);
  // The last step says when the test is passed, in all but one test (11.1.3).
  const last = steps.at(-1);
  if (steps.length < 2 || !/test est validé/.test(last)) return { steps };
  // What follows the verdict is a note on the test, not part of the verdict.
  const verdict = /^.*?test est validé\s*\.?/.exec(last)[0];
  const note = last.slice(verdict.length).trim();
  return { steps: steps.slice(0, -1), passWhen: verdict, ...(note ? { note } : {}) };
}

// "1.1.1 Non-text Content (A)" -> "1.1.1"
function wcagScOf(reference) {
  const m = /^(\d+\.\d+\.\d+) .+ \((A|AA|AAA)\)$/.exec(String(reference).trim());
  if (!m) throw new Error(`[generate-rgaa-map] unrecognised WCAG reference: ${reference}`);
  return m[1];
}

function referencesOf(criterium, kind) {
  return (criterium.references || []).flatMap((r) => (Array.isArray(r[kind]) ? r[kind] : []));
}

/**
 * The tables for one version of the source file: themes, criteria keyed
 * "1.1", tests keyed "1.1.1".
 */
function buildVersionTables(source, methodologies = {}) {
  const themes = [];
  const criteria = {};
  const tests = {};
  for (const topic of source.topics) {
    themes.push({ number: topic.number, title: plainText(topic.topic) });
    for (const { criterium } of topic.criteria) {
      const id = `${topic.number}.${criterium.number}`;
      const testIds = Object.keys(criterium.tests)
        .sort((a, b) => Number(a) - Number(b))
        .map((n) => `${id}.${n}`);
      criteria[id] = {
        theme: topic.number,
        title: plainText(criterium.title),
        wcagSc: [...new Set(referencesOf(criterium, 'wcag').map(wcagScOf))],
        techniques: referencesOf(criterium, 'techniques').map(String),
        tests: testIds,
        ...(criterium.particularCases
          ? { particularCases: noteLines(criterium.particularCases) }
          : {}),
        ...(criterium.technicalNote ? { technicalNotes: noteLines(criterium.technicalNote) } : {}),
        glossary: glossaryLinks([
          criterium.title,
          ...Object.values(criterium.tests).flat(),
          JSON.stringify([criterium.particularCases, criterium.technicalNote])
        ])
      };
      for (const testId of testIds) {
        const lines = criterium.tests[testId.slice(id.length + 1)];
        const [question, ...conditions] = lines;
        const glossary = glossaryLinks([...lines, criterium.title]);
        tests[testId] = {
          criterion: id,
          title: plainText(question),
          ...(conditions.length ? { conditions: conditions.map(plainText) } : {}),
          methodology: methodologyOf(testId, methodologies),
          ...(glossary.length ? { glossary } : {})
        };
      }
    }
  }
  return { themes, criteria, tests };
}

// A term's anchor, as RGAA's site makes it from the term.
function termSlug(term) {
  return plainText(term)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const htmlEntities = { amp: '&', lt: '<', gt: '>', quot: '"', nbsp: '\u00a0' };

// A definition's HTML as plain text, a line per paragraph or list item.
function definitionLines(html) {
  return String(html)
    .replace(/<\/(p|li|ul|ol|h\d)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|nbsp);/g, (_, name) => htmlEntities[name])
    .split('\n')
    .map((line) => plainText(line))
    .filter(Boolean);
}

function glossaryOf(source) {
  const out = {};
  for (const { title, body } of source.glossary) {
    out[termSlug(title)] = { term: plainText(title), definition: definitionLines(body) };
  }
  return out;
}

function buildTables(readSource = (file) => fs.readFileSync(path.join(DATA_DIR, file), 'utf8')) {
  const out = { versions: [], themes: {}, criteria: {}, tests: {}, glossary: {} };
  for (const { version, published, wcagVersion, file, methodologies, glossary } of SOURCES) {
    const t = buildVersionTables(
      JSON.parse(readSource(file)),
      JSON.parse(readSource(methodologies))
    );
    out.versions.push({ version, published, wcagVersion });
    out.themes[version] = t.themes;
    out.criteria[version] = t.criteria;
    out.tests[version] = t.tests;
    out.glossary[version] = glossaryOf(JSON.parse(readSource(glossary)));
    // A note may link to an anchor of another page of RGAA's site.
    for (const row of Object.values(t.criteria)) {
      row.glossary = row.glossary.filter((anchor) => out.glossary[version][anchor]);
    }
  }
  return out;
}

function renderModule(tables) {
  const json = (v) => JSON.stringify(v, null, 2);
  return `/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA (Référentiel général d’amélioration de l’accessibilité), the French
 * accessibility standard: its themes, criteria and tests, per version.
 *
 * GENERATED by scripts/generate-map.js from data/
 * -- do not edit by hand; tests/map.test.js fails on any drift.
 *
 * SOURCE: RGAA 4.1.2, DINUM, https://github.com/DISIC/accessibilite.numerique.gouv.fr
 * (RGAA/criteres.json), published under Licence Ouverte 2.0. The text is
 * RGAA's own French wording with its Markdown removed.
 *
 * SHAPE
 * -----
 * - RGAA_VERSIONS: [{ version, published, wcagVersion }], oldest first.
 * - RGAA_THEMES[version]: [{ number, title }], the 13 themes in order.
 * - RGAA_CRITERIA[version]["1.1"]: { theme, title, wcagSc, techniques, tests,
 *   particularCases?, technicalNotes?, glossary }. \`wcagSc\` is RGAA's own
 *   correspondence to WCAG; \`techniques\` the WCAG techniques and failures it
 *   cites; \`tests\` the ids of its tests; \`particularCases\` and
 *   \`technicalNotes\` its « cas particuliers » and « notes techniques »;
 *   \`glossary\` the glossary terms all of these link to.
 * - RGAA_TESTS[version]["1.1.1"]: { criterion, title, conditions?,
 *   methodology, glossary? }. \`conditions\` lists what a test enumerates
 *   ("vérifie-t-il une de ces conditions ?"); \`methodology\` is RGAA's own
 *   { steps, passWhen, note? }, the last step being when the test is passed
 *   and \`note\` what RGAA writes after it;
 *   \`glossary\` the glossary terms it links to, keys of RGAA_GLOSSARY.
 *
 * Like the EN 301 549 table, this states what a published document says,
 * nothing more: which version applies to whom is not an engine question.
 */

const RGAA_VERSIONS = ${json(tables.versions)};

const RGAA_THEMES = ${json(tables.themes)};

const RGAA_CRITERIA = ${json(tables.criteria)};

const RGAA_TESTS = ${json(tables.tests)};

// The criteria of every version that RGAA itself relates to a WCAG Success
// Criterion, oldest version first: [{ version, criterion, title }].
function rgaaCriteriaForSc(sc) {
  const s = String(sc || '').trim();
  const out = [];
  for (const { version } of RGAA_VERSIONS) {
    for (const [criterion, row] of Object.entries(RGAA_CRITERIA[version])) {
      if (row.wcagSc.includes(s)) out.push({ version, criterion, title: row.title });
    }
  }
  return out;
}

module.exports = { RGAA_VERSIONS, RGAA_THEMES, RGAA_CRITERIA, RGAA_TESTS, rgaaCriteriaForSc };
`;
}

function renderGlossary(tables) {
  return `/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA's glossary, per version: what its tests mean by their words.
 *
 * GENERATED by scripts/generate-map.js from data/
 * -- do not edit by hand; tests/map.test.js fails on any drift.
 *
 * SOURCE: RGAA 4.1.2, DINUM, https://github.com/DISIC/accessibilite.numerique.gouv.fr
 * (RGAA/glossaire.json), published under Licence Ouverte 2.0. The text is
 * RGAA's own French wording with its markup removed.
 *
 * SHAPE
 * -----
 * - RGAA_GLOSSARY[version][anchor]: { term, definition }. \`anchor\` is the
 *   term's anchor in RGAA's site, the one a test's \`glossary\` lists;
 *   \`definition\` a line per paragraph or list item.
 */

const RGAA_GLOSSARY = ${JSON.stringify(tables.glossary, null, 2)};

module.exports = { RGAA_GLOSSARY };
`;
}

async function formatted(source) {
  const prettier = require('prettier');
  const options = (await prettier.resolveConfig(OUTPUT_FILE)) || {};
  return prettier.format(source, { ...options, filepath: OUTPUT_FILE });
}

async function main() {
  const tables = buildTables();
  const outputs = [
    [OUTPUT_FILE, await formatted(renderModule(tables))],
    [GLOSSARY_FILE, await formatted(renderGlossary(tables))]
  ];
  if (process.argv.includes('--check')) {
    for (const [file, expected] of outputs) {
      const actual = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      if (actual !== expected) {
        console.error(
          `[generate-rgaa-map] ${path.relative(process.cwd(), file)} is out of date; run npm run map`
        );
        process.exit(1);
      }
    }
    console.log('[generate-rgaa-map] up to date');
    return;
  }
  for (const [file, expected] of outputs) {
    fs.writeFileSync(file, expected, 'utf8');
    console.log(`[generate-rgaa-map] wrote ${path.relative(process.cwd(), file)}`);
  }
}

module.exports = { SOURCES, plainText, buildTables, renderModule, renderGlossary, formatted };

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
