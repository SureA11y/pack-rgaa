/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA's own reading of a scan and of an audit: the status of each criterion,
 * as an audit grid records it, and the rate of conformity DINUM defines
 * (« Évaluation de la conformité »).
 *
 * A scan decides little of RGAA, so a status of NT (non testé) is the usual
 * answer: it says a person has that criterion to do, not that it is met.
 */

const { RGAA_VERSIONS, RGAA_CRITERIA } = require('./map.js');

const LATEST = RGAA_VERSIONS[RGAA_VERSIONS.length - 1].version;

// conforme, non conforme, non applicable; a criterion a person has to assess,
// and one no rule looks at, are non testé.
const STATUS_OF_OUTCOME = { pass: 'C', fail: 'NC', notApplicable: 'NA' };

/**
 * One row per criterion of the version, in RGAA's order:
 * { criterion, title, status: 'C' | 'NC' | 'NA' | 'NT', outcome }, `outcome`
 * being the scan's, or null for a criterion no rule checks.
 */
function rgaaCriteriaStatus(result, { version = LATEST } = {}) {
  const criteria = RGAA_CRITERIA[version];
  if (!criteria) throw new RangeError(`RGAA has no version ${version}`);
  const prefix = `rgaa-${version}-`;
  const scanned = new Map();
  for (const rule of (result && result.rulesResults) || []) {
    if (String(rule.ruleId).startsWith(prefix)) {
      scanned.set(rule.ruleId.slice(prefix.length), rule.outcome);
    }
  }
  return Object.entries(criteria).map(([criterion, { title }]) => {
    const outcome = scanned.has(criterion) ? scanned.get(criterion) : null;
    return { criterion, title, status: STATUS_OF_OUTCOME[outcome] || 'NT', outcome };
  });
}

function rateOf(validated, applicable) {
  return applicable ? validated / applicable : null;
}

/**
 * The rates of a sample of pages, each page a list of { criterion, status }
 * (rgaaCriteriaStatus's, completed by the auditor). A criterion is validated
 * if it is on every page of the sample, and applicable if it is on one; the
 * rate is validated over applicable. `average` is the mean of the pages'
 * rates. `complete` is false while a criterion is NT on some page, and the
 * rates then count only what was assessed, so they are no conformity claim.
 */
function rgaaConformityRate(pages) {
  const byCriterion = new Map();
  let complete = true;
  const pageRates = pages.map((rows) => {
    let validated = 0;
    let applicable = 0;
    for (const { criterion, status } of rows) {
      if (status === 'NT') {
        complete = false;
        continue;
      }
      const seen = byCriterion.get(criterion) || { applicable: false, failed: false };
      if (status === 'C' || status === 'NC') {
        seen.applicable = true;
        applicable += 1;
      }
      if (status === 'C') validated += 1;
      if (status === 'NC') seen.failed = true;
      byCriterion.set(criterion, seen);
    }
    return rateOf(validated, applicable);
  });
  const rows = [...byCriterion.values()];
  const applicable = rows.filter((c) => c.applicable).length;
  const validated = rows.filter((c) => c.applicable && !c.failed).length;
  const rated = pageRates.filter((r) => r !== null);
  return {
    validated,
    applicable,
    rate: rateOf(validated, applicable),
    pageRates,
    average: rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null,
    complete
  };
}

module.exports = { rgaaCriteriaStatus, rgaaConformityRate };
