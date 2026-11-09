/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA as standard data (core's format surea11y-standard/1): its versions,
 * its criteria and their tests, the tests each core rule and each of the
 * pack's rules checks (rule-map.js), the law the profile serves and the
 * profile, in one plain object. The pack's standard is built from it (core's
 * standardFromData), and a standard built on RGAA, such as RAWeb, starts
 * from it (core's deriveStandard), reading it from the pack:
 *
 *   const { standardDataOf } = require('@surea11y/core/pack');
 *   const base = standardDataOf(require('@surea11y/pack-rgaa').standard);
 *
 * rule-map.js names an RGAA test under `tests`, and core's data names what a
 * row reaches under `requirements` (a criterion or a test): rowOf renames it.
 */

const { RGAA_VERSIONS, RGAA_CRITERIA, RGAA_TESTS } = require('./map');
const { RGAA_RULE_TESTS } = require('./rule-map');
const { COMPLETE_CHECK } = require('./mappings');

// rule-map.js's `tests` as core's `requirements`, in a row, a reason code's
// route and a finding's route alike.
function routeOf(route) {
  if (!route || typeof route !== 'object' || route.tests === undefined) return route;
  const { tests, ...rest } = route;
  return { ...rest, requirements: tests };
}

/** A row of rule-map.js as core's data writes it. */
function rowOf(row) {
  const out = routeOf(row);
  // A row that isn't the shape it should be is kept as it is, for core to
  // say what is wrong with it.
  const reasonCodes = row.reasonCodes;
  if (reasonCodes && typeof reasonCodes === 'object' && !Array.isArray(reasonCodes)) {
    out.reasonCodes = Object.fromEntries(
      Object.entries(reasonCodes).map(([code, route]) => [code, routeOf(route)])
    );
  }
  if (Array.isArray(row.findings)) out.findings = row.findings.map(routeOf);
  return out;
}

const wcagVersionOf = (version) => RGAA_VERSIONS.find((v) => v.version === version).wcagVersion;

// The laws the standard is assessed under. Facts to show, never logic: who a
// law applies to is not the engine's to decide.
const LAWS = {
  'fr-article-47': {
    name: 'Article 47 de la loi n° 2005-102 du 11 février 2005',
    jurisdiction: 'FR',
    appliesTo:
      'Les personnes morales de droit public ; les personnes morales de droit privé chargées d’une mission de service public ; les entreprises dont le chiffre d’affaires annuel moyen en France sur les trois derniers exercices dépasse 250 millions d’euros (décret n° 2019-768, article 2).',
    sources: [
      {
        title: 'Déclaration d’accessibilité, accessibilite.numerique.gouv.fr (DINUM)',
        url: 'https://accessibilite.numerique.gouv.fr/obligations/declaration-accessibilite/'
      }
    ]
  }
};

// RGAA alone: the pack's own rules (the rgaa tag) and the core rules
// rule-map.js gives an RGAA test (mappedRules), and nothing else, so results
// hold RGAA's criteria and no WCAG ones. With no WCAG tag to imply it, the
// profile names the WCAG version RGAA is built on. RGAA 8.2 requires valid
// code as written, which the 2023 errata to WCAG 2.1 no longer count under
// 4.1.1 Parsing: keepsParsing keeps a duplicate id a failure of 8.2.1.
const PROFILES = {
  'rgaa-4.1.2': {
    version: '4.1.2',
    tags: ['rgaa'],
    mappedRules: true,
    wcagVersion: wcagVersionOf('4.1.2'),
    keepsParsing: true,
    law: 'fr-article-47'
  }
};

const STANDARD_DATA = {
  format: 'surea11y-standard/1',
  key: 'rgaa',
  standard: 'RGAA',
  lang: 'fr',
  // RGAA is mapped rule by rule (its criteria are its own, related to WCAG
  // many to many), and a rule is linked only to tests whose WCAG criteria
  // meet its own, unless its row says why (outsideCorrespondence).
  options: { ruleMapped: true, wcagCorrespondence: true },
  versions: RGAA_VERSIONS.map(({ version, wcagVersion }) => ({ version, wcagVersion })),
  data: Object.fromEntries(
    RGAA_VERSIONS.map(({ version }) => [
      version,
      {
        // A criterion's rollup is partial, as core's WCAG rollups are, unless
        // its rules check all of it (COMPLETE_CHECK).
        requirements: Object.fromEntries(
          Object.entries(RGAA_CRITERIA[version]).map(([id, c]) => [
            id,
            {
              title: c.title,
              wcagSc: c.wcagSc,
              tests: c.tests,
              ...((COMPLETE_CHECK[version] || []).includes(id) ? {} : { partial: true })
            }
          ])
        ),
        tests: Object.fromEntries(
          Object.entries(RGAA_TESTS[version]).map(([id, t]) => [
            id,
            { title: t.title, requirements: [t.criterion] }
          ])
        ),
        ruleMap: Object.fromEntries(
          Object.entries(RGAA_RULE_TESTS[version] || {}).map(([ruleId, row]) => [
            ruleId,
            rowOf(row)
          ])
        )
      }
    ])
  ),
  profiles: PROFILES,
  laws: LAWS
};

module.exports = { STANDARD_DATA, rowOf };
