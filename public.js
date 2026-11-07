/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA, the French accessibility standard: its themes, criteria, tests and
 * glossary per version, with RGAA's own correspondence to WCAG. Published for
 * tools that need to work in RGAA's terms: list the criteria an audit rates,
 * show a test's wording, methodology or definitions, find which criteria RGAA
 * relates to a given WCAG Success Criterion, read a scan as an audit grid
 * does, or work out a sample's rate of conformity.
 *
 * The text is RGAA's own French wording (DINUM, Licence Ouverte 2.0). The
 * objects are frozen: they are the profile's own table (map.js), not copies.
 */

const {
  RGAA_VERSIONS,
  RGAA_THEMES,
  RGAA_CRITERIA,
  RGAA_TESTS,
  rgaaCriteriaForSc
} = require('./map.js');
const { RGAA_GLOSSARY } = require('./glossary.js');
const { rgaaCriteriaStatus, rgaaConformityRate } = require('./conformity.js');

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

deepFreeze(RGAA_VERSIONS);
deepFreeze(RGAA_THEMES);
deepFreeze(RGAA_CRITERIA);
deepFreeze(RGAA_TESTS);
deepFreeze(RGAA_GLOSSARY);

// What a test's or a criterion's words mean: the glossary entries it links
// to, in the latest version that has it, as { anchor, term, definition }.
function rgaaGlossaryFor(id, { version = RGAA_VERSIONS[RGAA_VERSIONS.length - 1].version } = {}) {
  const tests = RGAA_CRITERIA[version]?.[id]?.tests || (RGAA_TESTS[version]?.[id] ? [id] : []);
  const anchors = new Set(tests.flatMap((t) => RGAA_TESTS[version][t].glossary || []));
  return [...anchors].map((anchor) => ({ anchor, ...RGAA_GLOSSARY[version][anchor] }));
}

module.exports = {
  RGAA_VERSIONS,
  RGAA_THEMES,
  RGAA_CRITERIA,
  RGAA_TESTS,
  RGAA_GLOSSARY,
  rgaaCriteriaForSc,
  rgaaGlossaryFor,
  rgaaCriteriaStatus,
  rgaaConformityRate
};
