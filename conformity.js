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
 *
 * Non applicable is said of a page. A scan of part of one (a contextSelector,
 * which the result records, or engineOptions.fragment, which it doesn't, so
 * pass `fragment: true`) can't say the page lacks what its part lacks, and the
 * page-wide rules (doctype, language, title) leave such a scan alone: there a
 * criterion found non applicable is non testé.
 */
function rgaaCriteriaStatus(result, { version = LATEST, fragment = false } = {}) {
  const criteria = RGAA_CRITERIA[version];
  if (!criteria) throw new RangeError(`RGAA has no version ${version}`);
  const prefix = `rgaa-${version}-`;
  const scanned = new Map();
  for (const rule of (result && result.rulesResults) || []) {
    if (String(rule.ruleId).startsWith(prefix)) {
      scanned.set(rule.ruleId.slice(prefix.length), rule.outcome);
    }
  }
  const narrowed = fragment || (result && result.contextSelector != null);
  return Object.entries(criteria).map(([criterion, { title }]) => {
    const outcome = scanned.has(criterion) ? scanned.get(criterion) : null;
    const status = STATUS_OF_OUTCOME[outcome] || 'NT';
    return { criterion, title, status: narrowed && status === 'NA' ? 'NT' : status, outcome };
  });
}

const STATUSES = ['C', 'NC', 'NA', 'NT'];

function rateOf(validated, applicable) {
  return applicable ? validated / applicable : null;
}

// A page's rows by criterion, refusing what can't be read: an unknown status,
// or a criterion given twice, would change the rate without a word.
function statusesOf(rows) {
  const statuses = new Map();
  for (const { criterion, status } of rows) {
    if (!STATUSES.includes(status)) {
      throw new RangeError(`criterion ${criterion}: unknown status ${status}`);
    }
    if (statuses.has(criterion)) throw new RangeError(`criterion ${criterion} is given twice`);
    statuses.set(criterion, status);
  }
  return statuses;
}

/**
 * The rates of a sample of pages (DINUM's « Taux de conformité »), as shares
 * from 0 to 1. Each page is a list of { criterion, status }, rgaaCriteriaStatus's
 * completed by the auditor, or { rows, process } for a page of a process
 * (making a declaration, say): a criterion is validated on a page of a process
 * only if it is on all the pages of that process.
 *
 * A criterion is validated if it is on every page of the sample, and
 * applicable if it is on one; `rate` is validated over applicable, and
 * `average` the mean of the pages' rates. `complete` is true only where every
 * page gives C, NC or NA for every criterion of the version: until then the
 * rates count what was assessed, and are no conformity claim.
 */
function rgaaConformityRate(pages, { version = LATEST } = {}) {
  const criteria = Object.keys(RGAA_CRITERIA[version] || {});
  if (!criteria.length) throw new RangeError(`RGAA has no version ${version}`);
  const sample = pages.map((page) => {
    const process = Array.isArray(page) ? null : page.process || null;
    return { process, statuses: statusesOf(Array.isArray(page) ? page : page.rows) };
  });
  const failedIn = new Map();
  for (const { process, statuses } of sample) {
    if (!process) continue;
    const failed = failedIn.get(process) || new Set();
    for (const [criterion, status] of statuses) if (status === 'NC') failed.add(criterion);
    failedIn.set(process, failed);
  }
  const overall = new Map();
  const pageRates = sample.map(({ process, statuses }) => {
    let validated = 0;
    let applicable = 0;
    for (const [criterion, status] of statuses) {
      if (status === 'NT') continue;
      const seen = overall.get(criterion) || { applicable: false, failed: false };
      if (status === 'C' || status === 'NC') {
        seen.applicable = true;
        applicable += 1;
      }
      const failed = status === 'NC' || (process && failedIn.get(process).has(criterion));
      if (status === 'C' && !failed) validated += 1;
      if (status === 'NC') seen.failed = true;
      overall.set(criterion, seen);
    }
    return rateOf(validated, applicable);
  });
  const rows = [...overall.values()];
  const applicable = rows.filter((c) => c.applicable).length;
  const validated = rows.filter((c) => c.applicable && !c.failed).length;
  const rated = pageRates.filter((r) => r !== null);
  return {
    validated,
    applicable,
    rate: rateOf(validated, applicable),
    pageRates,
    average: rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null,
    complete:
      sample.length > 0 &&
      sample.every(({ statuses }) =>
        criteria.every((c) => statuses.has(c) && statuses.get(c) !== 'NT')
      )
  };
}

module.exports = { rgaaCriteriaStatus, rgaaConformityRate };
