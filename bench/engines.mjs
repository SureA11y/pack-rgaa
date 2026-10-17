// Each engine scans the page it's given and returns the same shape:
//   { criteria: { '8.1': 'fail' | 'cantTell' | 'pass' | 'inapplicable' }, findings: [{ criterion, outcome, selector, html, rule }] }
// criteria is the engine's verdict per RGAA criterion on the whole page;
// findings are what it flagged, with an element so a finding can be placed
// in a fixture's case. An engine that only reports failures leaves the
// other criteria out.
//
// The engines compared are the ones that check RGAA and report per RGAA
// criterion. axe-core is a WCAG engine whose rules carry RGAA tags; it can
// be scanned as a reference (--engines axe), and isn't compared by default.

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const vendor = path.join(path.dirname(fileURLToPath(import.meta.url)), 'vendor');
const vendored = (name) => require('./vendor.json')[name];

const RANK = { fail: 3, cantTell: 2, pass: 1, inapplicable: 0 };
const worst = (a, b) => (a === undefined || RANK[b] > RANK[a] ? b : a);
const criterionOf = (test) => test.split('.').slice(0, 2).join('.');

export const ENGINES = {
  pack: {
    label: '@surea11y/pack-rgaa',
    version: () => require('@surea11y/pack-rgaa/package.json').version,
    reports: ['fail', 'cantTell', 'pass', 'inapplicable']
  },
  axe: {
    label: 'axe-core (RGAAv4 tags)',
    version: () => require('axe-core/package.json').version,
    reports: ['fail', 'cantTell', 'pass', 'inapplicable'],
    reference: true
  },
  uuv: {
    label: '@uuv/a11y (RgaaChecker)',
    version: () => JSON.parse(readFileSync(require.resolve('@uuv/a11y/bundle').replace(/bundle\/.*$/, 'package.json'), 'utf8')).version,
    reports: ['fail', 'cantTell', 'pass']
  },
  a11ylint: {
    label: '@a11ylint/core',
    version: () => require('@a11ylint/core/package.json').version,
    reports: ['fail']
  },
  arneo: {
    label: 'RGAA Checker (ARNEO)',
    version: () => `git ${vendored('arneo').slice(0, 7)}`,
    reports: ['fail', 'cantTell', 'pass', 'inapplicable']
  },
  stan: {
    label: 'RGAA Audit (Le Singe Du Numérique)',
    version: () => `git ${vendored('stan').slice(0, 7)}`,
    reports: ['fail', 'cantTell', 'pass']
  }
};

export const COMPARED = Object.keys(ENGINES).filter((e) => !ENGINES[e].reference);

// ---- @surea11y/pack-rgaa, through core's in-page runner -------------------

const { runa11yCoreInPage } = require('@surea11y/core');
const { packScript } = require('@surea11y/core/pack');
const rgaa = require('@surea11y/pack-rgaa');
const PACK_SCRIPT = packScript([rgaa]);
const PACK_OPTIONS = { packs: [`${rgaa.name}@${rgaa.version}`], profile: 'rgaa-4.1.2', locale: 'fr' };

export async function runPack(page) {
  await page.evaluate(PACK_SCRIPT);
  const result = await page.evaluate(
    `(${runa11yCoreInPage})(location.href, null, ${JSON.stringify(PACK_OPTIONS)}, null)`
  );
  if ((result.skippedPacks || []).length) throw new Error('pack skipped: ' + JSON.stringify(result.skippedPacks));
  const criteria = {};
  for (const r of result.rulesResults) {
    const m = /^rgaa-4\.1\.2-(\d+\.\d+)$/.exec(r.ruleId);
    if (m) criteria[m[1]] = r.outcome === 'notApplicable' ? 'inapplicable' : r.outcome;
  }
  const findings = [];
  for (const check of result.checksResults) {
    if (check.outcome !== 'fail' && check.outcome !== 'cantTell') continue;
    const crits = (check.rollupIds || []).map((id) => /^rgaa-4\.1\.2-(\d+\.\d+)$/.exec(id)).filter(Boolean).map((m) => m[1]);
    for (const criterion of crits) {
      for (const o of check.occurrences.length ? check.occurrences : [{}]) {
        // Each occurrence has its own outcome: a check that fails can also ask
        // about some of its elements.
        findings.push({ criterion, outcome: o.occurrenceOutcome || check.outcome, selector: o.selector || null, html: o.html || null, rule: check.ruleId, message: o.summary || check.title });
      }
    }
  }
  return { criteria, findings, raw: { engine: result.engine } };
}

// ---- axe-core, with the rules it tags RGAAv4 --------------------------------

const AXE_SOURCE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

export async function runAxe(page) {
  await page.evaluate(AXE_SOURCE);
  const res = await page.evaluate(() =>
    window.axe.run(document, { runOnly: { type: 'tag', values: ['RGAAv4'] }, resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'] })
  );
  const criteria = {};
  const findings = [];
  const kinds = [['violations', 'fail'], ['incomplete', 'cantTell'], ['passes', 'pass'], ['inapplicable', 'inapplicable']];
  for (const [key, outcome] of kinds) {
    for (const rule of res[key]) {
      const crits = [...new Set(rule.tags.map((t) => /^RGAA-(\d+\.\d+\.\d+)$/.exec(t)).filter(Boolean).map((m) => criterionOf(m[1])))];
      for (const criterion of crits) {
        criteria[criterion] = worst(criteria[criterion], outcome);
        if (outcome === 'fail' || outcome === 'cantTell') {
          for (const node of rule.nodes) {
            const target = node.target[node.target.length - 1];
            findings.push({ criterion, outcome, selector: Array.isArray(target) ? null : target, html: node.html, rule: rule.id, message: rule.help });
          }
        }
      }
    }
  }
  return { criteria, findings };
}

// ---- @uuv/a11y's RgaaChecker -------------------------------------------------

const UUV_BUNDLE = readFileSync(require.resolve('@uuv/a11y/bundle'), 'utf8');
// Rules whose query never returns an element, so their success checked
// nothing: 11.1.1's FormQuery.execute() returns [] (dist/lib/query/form.query.js).
const UUV_NOT_RUN = new Set(['11.1.1']);

export async function runUuv(page) {
  await page.evaluate(UUV_BUNDLE);
  const issues = await page.evaluate(async () => {
    const r = await new window.uuvA11y.RgaaChecker(location.href).validate().toPromise();
    // Every rule comes back as an issue; what it found is in its validations.
    return r.result.issues.map((i) => ({
      code: i.code,
      criterion: i.runnerExtras.rule.criterion,
      check: i.runnerExtras.rule.check,
      message: i.message,
      validations: i.runnerExtras.validations.map((v) => ({
        status: v.status,
        errorNodes: v.errorNodes.map((n) => ({ selector: n.selector, html: n.html })),
        manualNodes: v.nodesToCheckManually.map((n) => ({ selector: n.selector, html: n.html }))
      }))
    }));
  });
  const criteria = {};
  const findings = [];
  for (const i of issues) {
    if (UUV_NOT_RUN.has(i.code)) continue;
    for (const v of i.validations) {
      if (v.errorNodes.length) {
        criteria[i.criterion] = worst(criteria[i.criterion], 'fail');
        for (const n of v.errorNodes) findings.push({ criterion: i.criterion, outcome: 'fail', selector: n.selector || null, html: n.html, rule: i.code, message: i.message });
      } else if (v.manualNodes.length || v.status === 'manual') {
        criteria[i.criterion] = worst(criteria[i.criterion], 'cantTell');
        for (const n of v.manualNodes) findings.push({ criterion: i.criterion, outcome: 'cantTell', selector: n.selector || null, html: n.html, rule: i.code, message: i.message });
      } else if (v.status === 'success') {
        criteria[i.criterion] = worst(criteria[i.criterion], 'pass');
      }
    }
  }
  return { criteria, findings };
}

// ---- @a11ylint/core, in the page, on the page's own elements ---------------

const A11YLINT_SOURCE = readFileSync(path.join(vendor, 'a11ylint.js'), 'utf8');

export async function runA11ylint(page) {
  await page.evaluate(A11YLINT_SOURCE);
  const res = await page.evaluate(() => window.__a11ylintRun());
  const criteria = {};
  const findings = [];
  for (const [key, list] of Object.entries(res || {})) {
    const m = /(\d+\.\d+)(?:\.\d+)?/.exec(key);
    if (!m) continue;
    criteria[m[1]] = 'fail';
    for (const f of list) findings.push({ criterion: m[1], outcome: 'fail', selector: null, html: f.element || null, rule: key, message: f.message });
  }
  return { criteria, findings };
}

// ---- RGAA Checker (ARNEO), its criteria classes bundled by vendor.mjs -------
// C, NC and NA are its verdicts. NT is a criterion it leaves to the auditor:
// with elements, it highlights them to check (asked about); without, it
// says nothing.

const ARNEO_SOURCE = readFileSync(path.join(vendor, 'arneo.js'), 'utf8');
const ARNEO = { C: 'pass', NC: 'fail', NA: 'inapplicable' };

export async function runArneo(page) {
  await page.evaluate(ARNEO_SOURCE);
  const res = await page.evaluate(() => window.__arneoRun());
  const criteria = {};
  const findings = [];
  for (const [criterion, r] of Object.entries(res)) {
    if (r.error) continue;
    const outcome = ARNEO[r.status] || (r.status === 'NT' && r.elements.length ? 'cantTell' : null);
    if (!outcome) continue;
    criteria[criterion] = outcome;
    if (outcome === 'fail' || outcome === 'cantTell') {
      // A criterion can list an element once per thing wrong with it.
      const elements = [...new Map(r.elements.map((el) => [el.selector, el])).values()];
      for (const el of elements.length ? elements : [{}]) {
        findings.push({ criterion, outcome, selector: el.selector || null, html: el.html || null, rule: `arneo-${criterion}`, message: r.message });
      }
    }
  }
  return { criteria, findings };
}

// ---- RGAA Audit (Le Singe Du Numérique), the rules of its CLI ---------------
// Its rules run in the page through page.evaluate. A probable error fails
// its criterion, a heuristic warning asks, a good signal passes; a
// manual-only result (often: nothing on the page to check) says nothing,
// and so does a good signal it still wants checked by hand.

const stanLogger = require(path.join(vendor, 'stan/cli/src/logger.js'));
stanLogger.log = () => {};
const { runDomRules: runStanRules } = require(path.join(vendor, 'stan/cli/src/rules/index.js'));
const STAN = { probable_error: 'fail', heuristic_warning: 'cantTell', good_signal: 'pass' };

export async function runStan(page) {
  const results = await runStanRules(page);
  const criteria = {};
  const findings = [];
  for (const r of results) {
    const outcome = r.resultType === 'good_signal' && r.manualReviewRecommended ? null : STAN[r.resultType];
    if (!outcome || !/^\d+\.\d+$/.test(r.id)) continue;
    criteria[r.id] = worst(criteria[r.id], outcome);
    if (outcome !== 'pass') findings.push({ criterion: r.id, outcome, selector: null, html: r.snippet || null, rule: `stan-${r.id}`, message: r.message });
  }
  return { criteria, findings };
}

// A finding keeps the start of its element's HTML, enough to place it in a
// fixture's case and to recognise it, and no more.
const trim = (run) => async (page) => {
  const r = await run(page);
  for (const f of r.findings) if (f.html && f.html.length > 300) f.html = f.html.slice(0, 300);
  return r;
};

export const RUNNERS = { pack: trim(runPack), axe: trim(runAxe), uuv: trim(runUuv), a11ylint: trim(runA11ylint), arneo: trim(runArneo), stan: trim(runStan) };
