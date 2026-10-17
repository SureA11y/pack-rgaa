// Reads results/audited.json and results/neutral.json and writes
// results/disagreements.json: every (page, criterion) where the pack and
// another engine say different things, grouped so each group can be checked
// by hand. A group is one criterion, one other engine, one kind of
// difference and the rules that raised it, with examples from different
// sites.
//
// Kinds, from the pack's verdict to the other's ("none": no verdict):
//
//   PACK_FAILS        the pack fails, the other asks, passes, finds it inapplicable or says nothing
//   OTHER_FAILS       the other fails, the pack asks, passes, finds it inapplicable or says nothing
//   PACK_ASKS         the pack asks, the other passes, finds it inapplicable or says nothing
//   OTHER_ASKS        the other asks, the pack passes, finds it inapplicable or says nothing
//   PACK_MORE_ELEMENTS   both fail; the pack fails elements the other doesn't
//   OTHER_MORE_ELEMENTS  both fail; the other fails elements the pack doesn't
//
// Pass against inapplicable isn't a difference: neither fails or asks.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchElements } from './elements.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLES = 6;
const byNum = (a, b) => a.localeCompare(b, undefined, { numeric: true });

function verdict(r, criterion) {
  const v = r.criteria[criterion];
  if (v) return v === 'notApplicable' ? 'inapplicable' : v;
  const f = r.findings.filter((x) => x.criterion === criterion);
  if (f.some((x) => x.outcome === 'fail')) return 'fail';
  if (f.some((x) => x.outcome === 'cantTell')) return 'cantTell';
  return 'none';
}

function kindOf(p, o) {
  if (p === o) return p === 'fail' ? 'BOTH_FAIL' : null;
  if (p === 'fail') return 'PACK_FAILS';
  if (o === 'fail') return 'OTHER_FAILS';
  if (p === 'cantTell') return 'PACK_ASKS';
  if (o === 'cantTell') return 'OTHER_ASKS';
  return null;
}

const keep = (f) => ({ rule: f.rule, outcome: f.outcome, message: (f.message || '').slice(0, 200), html: (f.html || '').slice(0, 200), selector: f.selector || null, path: f.path ?? null });
const rulesOf = (findings) => [...new Set(findings.map((f) => f.rule))].sort();

function collect(corpus, data, groups) {
  const engines = Object.keys(data.meta.engines).filter((e) => !data.meta.engines[e].reference);
  const usable = data.pages.filter(
    (p) => !(p.loaded && p.loaded.blocked) && engines.every((e) => p.results[e] && !p.results[e].error)
  );
  for (const e of engines.filter((x) => x !== 'pack')) {
    for (const p of usable) {
      const P = p.results.pack;
      const O = p.results[e];
      const crits = new Set([...Object.keys(P.criteria), ...Object.keys(O.criteria), ...P.findings.map((f) => f.criterion), ...O.findings.map((f) => f.criterion)]);
      for (const c of crits) {
        const pv = verdict(P, c);
        const ov = verdict(O, c);
        let kind = kindOf(pv, ov);
        if (!kind) continue;
        const pf = P.findings.filter((f) => f.criterion === c);
        const of = O.findings.filter((f) => f.criterion === c);
        let packFindings = pf;
        let otherFindings = of;
        const kinds = [];
        if (kind === 'BOTH_FAIL') {
          // Elements are matched as diff.mjs matches them (elements.mjs).
          const m = matchElements(pf.filter((f) => f.outcome === 'fail'), of.filter((f) => f.outcome === 'fail'));
          if (m.aOnly.length) kinds.push(['PACK_MORE_ELEMENTS', m.aOnly, of.filter((f) => f.outcome === 'fail')]);
          if (m.bOnly.length) kinds.push(['OTHER_MORE_ELEMENTS', pf.filter((f) => f.outcome === 'fail' || f.outcome === 'cantTell'), m.bOnly]);
        } else {
          kinds.push([kind, packFindings, otherFindings]);
        }
        for (const [k, pfs, ofs] of kinds) {
          // The rules on the side that fails or asks name the group.
          const packSide = k.startsWith('PACK');
          const relevant = (packSide ? pfs : ofs).filter((f) => f.outcome === (k.endsWith('ASKS') ? 'cantTell' : 'fail') || k.endsWith('ELEMENTS'));
          const rules = rulesOf(relevant).join(' + ') || '(no finding)';
          const id = `${c} ${e} ${k} ${rules}`;
          const g = (groups[id] = groups[id] || { id, criterion: c, engine: e, kind: k, rules, pack: {}, other: {}, pages: 0, elements: 0, sites: new Set(), corpora: new Set(), examples: [] });
          g.pages++;
          g.elements += relevant.length;
          g.pack[pv] = (g.pack[pv] || 0) + 1;
          g.other[ov] = (g.other[ov] || 0) + 1;
          const site = p.site || corpus;
          g.corpora.add(corpus);
          // Examples from as many sites as possible: a new site first.
          const fresh = !g.sites.has(site);
          g.sites.add(site);
          if (g.examples.length < EXAMPLES && (fresh || g.examples.length < EXAMPLES / 2)) {
            g.examples.push({ corpus, page: p.id, site, url: p.url, pack: pv, other: ov, packFindings: pfs.slice(0, 4).map(keep), otherFindings: ofs.slice(0, 4).map(keep) });
          }
        }
      }
    }
  }
}

const groups = {};
for (const name of ['neutral', 'audited']) {
  const f = path.join(here, 'results', `${name}.json`);
  if (existsSync(f)) collect(name, JSON.parse(readFileSync(f, 'utf8')), groups);
}
const list = Object.values(groups)
  .map((g) => ({ ...g, sites: [...g.sites], corpora: [...g.corpora] }))
  .sort((a, b) => byNum(a.criterion, b.criterion) || a.engine.localeCompare(b.engine) || b.pages - a.pages);
writeFileSync(path.join(here, 'results', 'disagreements.json'), JSON.stringify({ generatedAt: new Date().toISOString(), groups: list }, null, 1));

const kinds = {};
for (const g of list) kinds[g.kind] = (kinds[g.kind] || 0) + 1;
console.log(`wrote results/disagreements.json: ${list.length} groups`, kinds);
const byCrit = {};
for (const g of list) byCrit[g.criterion] = (byCrit[g.criterion] || 0) + g.pages;
console.log(Object.entries(byCrit).sort((a, b) => byNum(a[0], b[0])).map(([c, n]) => `${c}:${n}`).join(' '));
