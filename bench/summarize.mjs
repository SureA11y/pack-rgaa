// Reads results/*.json and writes results/summary.json: per corpus, how each
// engine's verdicts compare with what is known about the page.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const load = (name) => {
  const f = path.join(here, 'results', `${name}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
};
const byNum = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const failed = (r) => (r && !r.error ? Object.keys(r.criteria).filter((c) => r.criteria[c] === 'fail').sort(byNum) : []);
const asked = (r) => (r && !r.error ? Object.keys(r.criteria).filter((c) => r.criteria[c] === 'cantTell').sort(byNum) : []);


const map = require(path.join(path.dirname(require.resolve('@surea11y/pack-rgaa/package.json')), 'map.js'));
const CRITERIA = map.RGAA_CRITERIA['4.1.2'];
const criterionTitle = Object.fromEntries(Object.entries(CRITERIA).map(([k, v]) => [k, v.title || v.label || '']));
// The RGAA tests each rule checks, core's and the pack's, from the pack's rule-map.js.
const packDir = path.dirname(require.resolve('@surea11y/pack-rgaa/package.json'));
const RULE_TESTS = require(path.join(packDir, 'rule-map.js')).RGAA_RULE_TESTS['4.1.2'];
const ruleCriteria = Object.fromEntries(
  Object.entries(RULE_TESTS).map(([id, v]) => [id, [...new Set((v.tests || []).map((t) => t.split('.').slice(0, 2).join('.')))]])
);

const summary = { generatedAt: new Date().toISOString(), criterionTitle, corpora: {} };
const engineMeta = {};

// What an engine can say anything about: the criteria it ever gave a verdict
// or a finding for, over every page scanned.
const coverage = {};
function cover(engine, r) {
  if (!r || r.error) return;
  const s = (coverage[engine] = coverage[engine] || new Set());
  // An engine that reports inapplicable says so only of a criterion it checks.
  const checksWhenInapplicable = (engineMeta[engine]?.reports || []).includes('inapplicable');
  for (const [c, o] of Object.entries(r.criteria)) if (o !== 'inapplicable' || checksWhenInapplicable) s.add(c);
  for (const f of r.findings) s.add(f.criterion);
}

// ---- fixtures: per case, the engine's verdict on the rule's criteria --------

const fx = load('fixtures');
if (fx) {
  Object.assign(engineMeta, fx.meta.engines);
  const engines = Object.keys(fx.meta.engines);
  const tally = Object.fromEntries(engines.map((e) => [e, {}]));
  const rows = [];
  for (const p of fx.pages) {
    const crits = ruleCriteria[p.rule] || [];
    for (const e of engines) cover(e, p.results[e]);
    const packOwn = (p.results.pack.findings || []).filter((f) => f.rule === p.rule);
    // A rule about the whole page (a doctype, the language) can't be placed
    // in a case; those fixtures are left out of the per-case scores.
    const pageLevel = packOwn.length > 0 && packOwn.every((f) => !f.case);
    const cases = p.cases.map((c) => {
      const verdicts = {};
      for (const e of engines) {
        const r = p.results[e];
        if (!r || r.error) { verdicts[e] = 'error'; continue; }
        const inCase = r.findings.filter((f) => f.case === c.id && crits.includes(f.criterion));
        verdicts[e] = inCase.some((f) => f.outcome === 'fail') ? 'fail' : inCase.some((f) => f.outcome === 'cantTell') ? 'cantTell' : 'none';
      }
      return { ...c, verdicts };
    });
    if (!pageLevel) {
      for (const c of cases) {
        if (!['PASS', 'FAIL', 'CANTTELL'].includes(c.expected)) continue;
        for (const e of engines) {
          const t = (tally[e][c.expected] = tally[e][c.expected] || { fail: 0, cantTell: 0, none: 0, error: 0 });
          t[c.verdicts[e]]++;
        }
      }
    }
    rows.push({ rule: p.rule, ruleType: p.ruleType, criteria: crits, pageLevel, cases });
  }
  summary.corpora.fixtures = { meta: fx.meta, tally, rows };
}

// ---- neutral: the BAD demo's before and after pages -------------------------

const nt = load('neutral');
if (nt) {
  Object.assign(engineMeta, nt.meta.engines);
  const engines = Object.keys(nt.meta.engines);
  const pages = nt.pages.map((p) => {
    for (const e of engines) cover(e, p.results[e]);
    return {
      id: p.id, pair: p.pair, version: p.version, url: p.url,
      engines: Object.fromEntries(engines.map((e) => {
        const r = p.results[e];
        return [e, r && r.error ? { error: r.error } : {
          failed: failed(r), asked: asked(r),
          findings: r.findings.filter((f) => f.outcome === 'fail').map((f) => ({ criterion: f.criterion, rule: f.rule, message: f.message, html: (f.html || '').slice(0, 160) }))
        }];
      }))
    };
  });
  const totals = Object.fromEntries(engines.map((e) => {
    const sum = (v) => pages.filter((p) => p.version === v).reduce((n, p) => n + (p.engines[e].failed || []).length, 0);
    return [e, { before: sum('before'), after: sum('after') }];
  }));
  summary.corpora.neutral = { meta: nt.meta, pages, totals };
}

// ---- audited: each site's failed criteria against its human audit ----------

const au = load('audited');
const auCorpus = existsSync(path.join(here, 'corpus/audited.json')) ? JSON.parse(readFileSync(path.join(here, 'corpus/audited.json'), 'utf8')) : null;
if (au && auCorpus) {
  Object.assign(engineMeta, au.meta.engines);
  const engines = Object.keys(au.meta.engines);
  // Scores count only pages every engine scanned: a page that blocks the
  // browser, or that an engine refused or failed on, is left out for all of
  // them, so every engine is judged on the same pages.
  const usable = (p) => !(p.loaded && p.loaded.blocked) && engines.every((e) => p.results[e] && !p.results[e].error);
  for (const p of au.pages.filter(usable)) for (const e of engines) cover(e, p.results[e]);
  const sites = auCorpus.map((site) => {
    const all = au.pages.filter((p) => p.site === site.site);
    const pages = all.filter(usable);
    const nc = [...new Set(site.nonConformCriteria)].sort(byNum);
    const perEngine = Object.fromEntries(engines.map((e) => {
      const ok = pages.filter((p) => p.results[e] && !p.results[e].error);
      const fails = [...new Set(ok.flatMap((p) => failed(p.results[e])))].sort(byNum);
      const cov = coverage[e] || new Set();
      return [e, {
        pagesScanned: ok.length,
        errors: pages.filter((p) => p.results[e] && p.results[e].error).map((p) => p.results[e].error),
        failed: fails,
        agree: fails.filter((c) => nc.includes(c)),
        extra: fails.filter((c) => !nc.includes(c)),
        missedCoverable: nc.filter((c) => !fails.includes(c) && cov.has(c)),
        missedUncovered: nc.filter((c) => !fails.includes(c) && !cov.has(c))
      }];
    }));
    return {
      site: site.site, declarationUrl: site.declarationUrl, auditDate: site.auditDate, rgaaVersion: site.rgaaVersion,
      complianceRate: site.complianceRate, notes: site.notes, nonConform: nc,
      blocked: all.filter((p) => p.loaded && p.loaded.blocked).map((p) => ({ name: p.name, url: p.url, status: p.loaded.status, title: p.loaded.title })),
      refused: all.filter((p) => !(p.loaded && p.loaded.blocked) && !usable(p)).map((p) => ({
        name: p.name, url: p.url,
        engines: Object.fromEntries(engines.filter((e) => p.results[e] && p.results[e].error).map((e) => [e, p.results[e].error.replace(/^page\.evaluate: (Error: )?/, '').slice(0, 220)]))
      })),
      pages: pages.map((p) => ({ name: p.name, url: p.url, status: p.loaded && p.loaded.status, errors: Object.fromEntries(engines.filter((e) => p.results[e] && p.results[e].error).map((e) => [e, p.results[e].error])) })),
      engines: perEngine
    };
  }).filter((s) => s.pages.length);
  const totals = Object.fromEntries(engines.map((e) => {
    const t = { agree: 0, extra: 0, missedCoverable: 0, missedUncovered: 0, nonConform: 0 };
    for (const s of sites) {
      if (!s.engines[e].pagesScanned) continue;
      t.agree += s.engines[e].agree.length; t.extra += s.engines[e].extra.length;
      t.missedCoverable += s.engines[e].missedCoverable.length; t.missedUncovered += s.engines[e].missedUncovered.length;
      t.nonConform += s.nonConform.length;
    }
    t.precision = t.agree + t.extra ? t.agree / (t.agree + t.extra) : null;
    t.recall = t.nonConform ? t.agree / t.nonConform : null;
    return [e, t];
  }));
  summary.corpora.audited = { meta: au.meta, sites, totals };
}

summary.engines = engineMeta;
summary.coverage = Object.fromEntries(Object.entries(coverage).map(([e, s]) => [e, [...s].sort(byNum)]));
writeFileSync(path.join(here, 'results', 'summary.json'), JSON.stringify(summary, null, 1));
console.log('wrote results/summary.json');
for (const [name, c] of Object.entries(summary.corpora)) {
  console.log(`\n== ${name}`);
  if (c.tally) for (const [e, t] of Object.entries(c.tally)) console.log(e.padEnd(9), JSON.stringify(t));
  if (c.totals) for (const [e, t] of Object.entries(c.totals)) console.log(e.padEnd(9), JSON.stringify(t));
}
console.log('\n== coverage', Object.fromEntries(Object.entries(summary.coverage).map(([e, s]) => [e, s.length])));
