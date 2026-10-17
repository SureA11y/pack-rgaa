// Writes RESULTS.md from results/summary.json and results/diff.json.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(readFileSync(path.join(here, 'results', f), 'utf8'));
const summary = read('summary.json');
const diff = read('diff.json');

const engines = Object.keys(summary.engines).filter((e) => !summary.engines[e].reference);
const label = (e) => summary.engines[e].label;
const pct = (x) => (x === null || x === undefined ? '—' : `${Math.round(x * 100)}%`);
const row = (cells) => `| ${cells.join(' | ')} |`;
const table = (head, rows, align) =>
  [row(head), row(head.map((_, i) => (align && align[i] === 'r' ? '---:' : '---'))), ...rows.map(row)].join('\n');
const out = [];

out.push('# Results');
out.push('');
out.push(`Scanned ${summary.corpora.audited?.meta.scannedAt.slice(0, 10) || summary.generatedAt.slice(0, 10)}, in Chromium. How the engines run and how pages are scored: [README.md](./README.md).`);
out.push('');
out.push(table(['Engine', 'Version', 'Reports', 'Criteria it judged'],
  engines.map((e) => [label(e), summary.engines[e].version, summary.engines[e].reports.join(', '), `${(summary.coverage[e] || []).length} of 106`]), ['', '', '', 'r']));
out.push('');
out.push('"Criteria it judged" counts the RGAA criteria an engine gave a verdict or a finding for on any page scanned. What the main divergences come from: [TRIAGE.md](./TRIAGE.md).');

// ---- audited sites ----------------------------------------------------------

const au = summary.corpora.audited;
if (au) {
  out.push('');
  out.push('## Against human audits');
  out.push('');
  out.push(`${au.sites.length} French sites whose accessibility statement lists the criteria a human RGAA audit found non-conforming. An engine finds a criterion when it fails it on at least one of the site's sample pages.`);
  out.push('');
  out.push(table(['Engine', 'Found (of the audits\' failures)', 'Failed beyond the audit', 'Precision', 'Recall', 'Missed, in its scope', 'Missed, out of its scope'],
    engines.map((e) => {
      const t = au.totals[e];
      return [label(e), `${t.agree} of ${t.nonConform}`, t.extra, pct(t.precision), pct(t.recall), t.missedCoverable, t.missedUncovered];
    }), ['', 'r', 'r', 'r', 'r', 'r', 'r']));
  out.push('');
  out.push('Precision is the share of an engine\'s failed criteria the audit also failed; an audit samples pages and may not list every failure, so a criterion "beyond the audit" is not always a false positive. Recall is the share of the audit\'s failures the engine found; about half of RGAA needs a human, so no engine comes near all of them.');
  out.push('');
  out.push(table(['Site', 'Pages', 'Audit fails', ...engines.map(label)],
    au.sites.map((s) => [s.site, s.pages.length, s.nonConform.length, ...engines.map((e) => `${s.engines[e].agree.length} found, ${s.engines[e].extra.length} beyond`)]),
    ['', 'r', 'r', ...engines.map(() => 'r')]));
  const left = au.sites.flatMap((s) => [...s.blocked.map((b) => `${s.site}: ${b.name} (blocked, ${b.status})`), ...s.refused.map((r) => `${s.site}: ${r.name} (${Object.entries(r.engines).map(([e, m]) => `${e}: ${m.slice(0, 80)}`).join('; ')})`)]);
  if (left.length) {
    out.push('');
    out.push(`<details><summary>${left.length} pages left out for every engine</summary>`);
    out.push('');
    for (const l of left) out.push(`- ${l}`);
    out.push('');
    out.push('</details>');
  }
}

// ---- BAD demo ------------------------------------------------------------------

const nt = summary.corpora.neutral;
if (nt) {
  out.push('');
  out.push('## W3C\'s Before and After Demonstration');
  out.push('');
  out.push('Criteria failed, summed over the four pages: before the repair, and after. A criterion still failed after the repair is a likely false positive, or a barrier the demo left.');
  out.push('');
  out.push(table(['Engine', 'Before', 'After'], engines.map((e) => [label(e), nt.totals[e].before, nt.totals[e].after]), ['', 'r', 'r']));
}

// ---- fixtures ------------------------------------------------------------------

const fx = summary.corpora.fixtures;
if (fx) {
  out.push('');
  out.push('## On the pack\'s fixtures');
  out.push('');
  out.push('Each case of the pack\'s scenario pages, by what it expects, and what each engine did on the criteria the case\'s rule checks. These pages were written for the pack, so they favour it.');
  out.push('');
  const cell = (t) => (t ? `${t.fail} fail, ${t.cantTell} ask, ${t.none} nothing` : '—');
  out.push(table(['Engine', 'FAIL cases', 'PASS cases', 'CANTTELL cases'],
    engines.map((e) => [label(e), cell(fx.tally[e].FAIL), cell(fx.tally[e].PASS), cell(fx.tally[e].CANTTELL)])));
}

// ---- the pack against each engine ----------------------------------------------

const NAMES = {
  AGREE_FAIL: 'Both fail',
  AGREE_NO_FAIL: 'Neither fails',
  PACK_FAILS_ASKED: 'Pack fails, other asks',
  PACK_FAILS_PASSED: 'Pack fails, other passes',
  OTHER_FAILS_ASKED: 'Other fails, pack asks',
  OTHER_FAILS_PASSED: 'Other fails, pack passes',
  PACK_ONLY: 'Only the pack judges it',
  OTHER_ONLY: 'Only the other judges it'
};

for (const [name, c] of Object.entries(diff.corpora)) {
  const others = Object.keys(c.engines);
  out.push('');
  out.push(`## The pack against each engine: ${name === 'audited' ? 'audited sites' : 'BAD demo'}`);
  out.push('');
  out.push(`${c.pages} pages every engine scanned. Each cell counts (page, criterion) pairs.`);
  out.push('');
  out.push(table(['', ...others.map((e) => c.engines[e].label)],
    [
      ...diff.buckets.map((b) => [NAMES[b], ...others.map((e) => c.engines[e].totals[b])]),
      ['**When either fails, both do**', ...others.map((e) => `**${pct(c.engines[e].failAgreement)}**`)],
      ['Where both fail: elements both failed', ...others.map((e) => c.engines[e].elements.shared)],
      ['… only the pack failed', ...others.map((e) => c.engines[e].elements.packOnly)],
      ['… only the other failed', ...others.map((e) => c.engines[e].elements.otherOnly)]
    ], ['', ...others.map(() => 'r')]));
  if (name !== 'audited') continue;
  out.push('');
  out.push('Where they diverge most, by criterion (pages where one fails and the other passes it):');
  for (const e of others) {
    const top = Object.entries(c.engines[e].byCriterion)
      .map(([crit, t]) => [crit, t.PACK_FAILS_PASSED, t.OTHER_FAILS_PASSED])
      .filter(([, a, b]) => a + b > 0)
      .sort((x, y) => y[1] + y[2] - (x[1] + x[2]))
      .slice(0, 8);
    if (!top.length) continue;
    out.push('');
    out.push(`- **${c.engines[e].label}:** ` + top.map(([crit, a, b]) => `${crit} (pack only ${a}, other only ${b})`).join(', '));
  }
}

out.push('');
writeFileSync(path.join(here, 'RESULTS.md'), out.join('\n'));
console.log('wrote RESULTS.md');
