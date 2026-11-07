// Reads results/neutral.json and results/audited.json and writes
// results/diff.json: the pack against each other engine, page by page and
// RGAA criterion by criterion, in one of these buckets:
//
//   AGREE_FAIL          both fail the criterion
//   AGREE_NO_FAIL       both give it a verdict, and neither fails it
//   PACK_FAILS_ASKED    the pack fails it, the other asks
//   PACK_FAILS_PASSED   the pack fails it, the other passes it or finds it inapplicable
//   OTHER_FAILS_ASKED   the other fails it, the pack asks
//   OTHER_FAILS_PASSED  the other fails it, the pack passes it or finds it inapplicable
//   PACK_ONLY           only the pack gives it a verdict: out of the other's scope
//   OTHER_ONLY          only the other gives it a verdict
//
// For AGREE_FAIL, the elements each failed are matched (elements.mjs), to
// tell whether they fail the same elements.
// The fixtures aren't diffed: they were written for the pack, and
// summarize.mjs scores every engine on their cases instead.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchElements } from './elements.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const load = (name) => {
  const f = path.join(here, 'results', `${name}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null;
};
const byNum = (a, b) => a.localeCompare(b, undefined, { numeric: true });

export const BUCKETS = [
  'AGREE_FAIL', 'AGREE_NO_FAIL',
  'PACK_FAILS_ASKED', 'PACK_FAILS_PASSED',
  'OTHER_FAILS_ASKED', 'OTHER_FAILS_PASSED',
  'PACK_ONLY', 'OTHER_ONLY'
];
const EXAMPLES = 8;

function bucket(p, o) {
  if (p === undefined && o === undefined) return null;
  if (o === undefined) return 'PACK_ONLY';
  if (p === undefined) return 'OTHER_ONLY';
  if (p === 'fail' && o === 'fail') return 'AGREE_FAIL';
  if (p === 'fail') return o === 'cantTell' ? 'PACK_FAILS_ASKED' : 'PACK_FAILS_PASSED';
  if (o === 'fail') return p === 'cantTell' ? 'OTHER_FAILS_ASKED' : 'OTHER_FAILS_PASSED';
  return 'AGREE_NO_FAIL';
}

// What an engine says of a criterion on a page: its verdict, or, for an
// engine that reports only some outcomes, what its findings imply.
function verdict(r, criterion) {
  if (r.criteria[criterion]) return r.criteria[criterion];
  const f = r.findings.filter((x) => x.criterion === criterion);
  if (f.some((x) => x.outcome === 'fail')) return 'fail';
  if (f.some((x) => x.outcome === 'cantTell')) return 'cantTell';
  return undefined;
}

const failed = (r, criterion) => r.findings.filter((f) => f.criterion === criterion && f.outcome === 'fail');

function diffCorpus(data) {
  const engines = Object.keys(data.meta.engines).filter((e) => !data.meta.engines[e].reference);
  const others = engines.filter((e) => e !== 'pack');
  const usable = data.pages.filter(
    (p) => !(p.loaded && p.loaded.blocked) && engines.every((e) => p.results[e] && !p.results[e].error)
  );
  const out = {};
  for (const e of others) {
    const totals = Object.fromEntries(BUCKETS.map((b) => [b, 0]));
    const byCriterion = {};
    const examples = Object.fromEntries(BUCKETS.map((b) => [b, []]));
    const elements = { shared: 0, packOnly: 0, otherOnly: 0 };
    for (const p of usable) {
      const pack = p.results.pack;
      const other = p.results[e];
      const crits = new Set([
        ...Object.keys(pack.criteria), ...Object.keys(other.criteria),
        ...pack.findings.map((f) => f.criterion), ...other.findings.map((f) => f.criterion)
      ]);
      for (const c of crits) {
        const pv = verdict(pack, c);
        const ov = verdict(other, c);
        const b = bucket(pv, ov);
        if (!b) continue;
        totals[b]++;
        (byCriterion[c] = byCriterion[c] || Object.fromEntries(BUCKETS.map((k) => [k, 0])))[b]++;
        if (b === 'AGREE_FAIL') {
          const m = matchElements(failed(pack, c), failed(other, c));
          elements.shared += m.shared.length;
          elements.packOnly += m.aOnly.length;
          elements.otherOnly += m.bOnly.length;
        }
        if (examples[b].length < EXAMPLES && b !== 'AGREE_NO_FAIL' && !b.endsWith('_ONLY')) {
          const pick = (r, outcome) =>
            r.findings.filter((f) => f.criterion === c && f.outcome === outcome).slice(0, 2)
              .map((f) => ({ rule: f.rule, message: (f.message || '').slice(0, 160), html: (f.html || '').slice(0, 120) }));
          examples[b].push({
            page: p.id, url: p.url, criterion: c, pack: pv, other: ov,
            packFindings: pick(pack, pv), otherFindings: pick(other, ov)
          });
        }
      }
    }
    const decided = totals.AGREE_FAIL + totals.AGREE_NO_FAIL + totals.PACK_FAILS_ASKED + totals.PACK_FAILS_PASSED + totals.OTHER_FAILS_ASKED + totals.OTHER_FAILS_PASSED;
    const anyFail = decided - totals.AGREE_NO_FAIL;
    out[e] = {
      label: data.meta.engines[e].label,
      version: data.meta.engines[e].version,
      pages: usable.length,
      totals,
      // Of the criteria both judge on a page and either fails: how often both fail it.
      failAgreement: anyFail ? totals.AGREE_FAIL / anyFail : null,
      elements,
      byCriterion: Object.fromEntries(Object.entries(byCriterion).sort(([a], [b]) => byNum(a, b))),
      examples
    };
  }
  return { pages: usable.length, scanned: data.pages.length, engines: out };
}

const diff = { generatedAt: new Date().toISOString(), buckets: BUCKETS, corpora: {} };
for (const name of ['neutral', 'audited']) {
  const data = load(name);
  if (data) diff.corpora[name] = { meta: data.meta, ...diffCorpus(data) };
}
writeFileSync(path.join(here, 'results', 'diff.json'), JSON.stringify(diff, null, 1));
console.log('wrote results/diff.json');
for (const [name, c] of Object.entries(diff.corpora)) {
  console.log(`\n== ${name} (${c.pages} of ${c.scanned} pages)`);
  for (const [e, d] of Object.entries(c.engines)) {
    const t = d.totals;
    console.log(
      `pack vs ${e.padEnd(9)} both fail ${t.AGREE_FAIL}, neither ${t.AGREE_NO_FAIL}, pack fails/other asks ${t.PACK_FAILS_ASKED}, pack fails/other passes ${t.PACK_FAILS_PASSED}, other fails/pack asks ${t.OTHER_FAILS_ASKED}, other fails/pack passes ${t.OTHER_FAILS_PASSED}, pack only ${t.PACK_ONLY}, other only ${t.OTHER_ONLY}; elements shared ${d.elements.shared}, pack only ${d.elements.packOnly}, other only ${d.elements.otherOnly}`
    );
  }
}
