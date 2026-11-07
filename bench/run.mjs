// Scans the corpora with every engine and writes results/<corpus>.json.
//
//   node run.mjs                     all corpora
//   node run.mjs fixtures neutral    some of them
//   node run.mjs audited --engines pack,arneo
//   node run.mjs neutral --engines axe   axe-core, as a reference

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { ENGINES, RUNNERS, COMPARED } from './engines.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const args = process.argv.slice(2);
const engineArg = args.indexOf('--engines');
const engines = engineArg >= 0 ? args[engineArg + 1].split(',') : COMPARED;
const corpora = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--engines');
const wanted = corpora.length ? corpora : ['fixtures', 'neutral', 'audited'];

mkdirSync(path.join(here, 'results'), { recursive: true });

// The fixtures load as they do in the pack's tests: over HTTP, from the repo.
function serve(root) {
  const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript' };
  const server = createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(root) || !existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Headless Chromium says so in its user agent, and some sites answer it with
// a block page. The browser's own user agent, without "Headless", gets the
// site; nothing else is disguised. A page that still answers with an error
// or a block page is marked blocked and left out of the scores.
let USER_AGENT;
const BLOCKED_TITLE = /access denied|forbidden|just a moment|attention required|captcha|request rejected|403|blocked/i;

// What a load got: enough to tell the page from a block page, and one
// engine's visit from another's.
async function loadState(page, response) {
  const status = response ? response.status() : null;
  const s = await page.evaluate(() => ({
    title: document.title,
    doctype: Boolean(document.doctype),
    lang: document.documentElement.getAttribute('lang'),
    textLength: document.body ? document.body.innerText.length : 0
  }));
  return { status, ...s, finalUrl: page.url(), blocked: (status !== null && status >= 400) || BLOCKED_TITLE.test(s.title) || s.textLength < 200 };
}
const sameDocument = (a, b) => !a.blocked && a.title === b.title && a.doctype === b.doctype && a.lang === b.lang;

// Lazy content loads as it scrolls into view, so the page is scrolled down
// and back before an engine runs, and given time to settle.
async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(innerHeight * 0.8, 400);
    for (let y = step; y < Math.min(document.documentElement.scrollHeight, 30000); y += step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function scanPage(browser, url) {
  const out = {};
  let loaded = null;
  for (const name of engines) {
    if (loaded && loaded.blocked) {
      out[name] = { error: 'not scanned: the page is blocked' };
      continue;
    }
    // Each engine gets a fresh page, so no engine sees another's injected
    // script; one that gets another document than the first engine did (a
    // block page, an error page) tries once more, then is marked failed.
    for (let attempt = 1; attempt <= 2; attempt++) {
      const context = await browser.newContext({ locale: 'fr-FR', viewport: { width: 1280, height: 900 }, userAgent: USER_AGENT });
      const page = await context.newPage();
      const started = Date.now();
      let retry = false;
      try {
        const response = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        await settle(page);
        const state = await loadState(page, response);
        if (!loaded && (!state.blocked || attempt === 2)) loaded = state;
        if (!loaded || !sameDocument(state, loaded)) {
          retry = attempt === 1;
          if (!retry && state.blocked) throw new Error(`blocked: ${state.status} ${JSON.stringify(state.title.slice(0, 60))}`);
          if (!retry) throw new Error(`got another document than the first engine: ${JSON.stringify({ status: state.status, title: state.title.slice(0, 60), doctype: state.doctype, lang: state.lang })}`);
        } else {
          const r = await RUNNERS[name](page);
          if (r.findings.length) r.findings = await placeInCases(page, r.findings);
          out[name] = { ...r, ms: Date.now() - started };
        }
      } catch (e) {
        const error = String(e.message || e).split('\n')[0];
        out[name] = { error, ms: Date.now() - started };
        // A failed navigation is tried again; an engine's own error isn't.
        retry = attempt === 1 && /^page\.goto|net::ERR_/.test(error);
      }
      await context.close();
      if (!retry) break;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return { results: out, loaded };
}

// Each finding's element is found in the page, by its selector or else by
// its HTML, and named by its path from the root (child indexes), so
// findings of engines whose selectors differ can be matched. Findings of
// one rule with the same HTML (repeated markup) take the matching elements
// in document order, one each. A fixture's cases are .case blocks; a
// finding also belongs to the case that holds its element.
async function placeInCases(page, findings) {
  return page.evaluate((findings) => {
    const cases = [...document.querySelectorAll('.case[id]')];
    const pathOf = (el) => {
      const parts = [];
      for (let e = el; e && e.parentElement; e = e.parentElement) parts.unshift([...e.parentElement.children].indexOf(e));
      return parts.join('/');
    };
    const byHtml = new Map();
    const candidates = (html) => {
      if (!byHtml.has(html)) {
        const tag = /^<([a-zA-Z][\w:-]*)/.exec(html);
        const pool = tag ? [...document.getElementsByTagName(tag[1])] : [];
        // Engines shorten long markup; the start before an ellipsis still
        // has to match.
        const starts = [html, html.replace(/(\.\.\.|…)$/, ''), html.slice(0, 120)];
        let found = [];
        for (const start of starts) {
          found = pool.filter((e) => e.outerHTML.startsWith(start));
          if (found.length) break;
        }
        byHtml.set(html, found);
      }
      return byHtml.get(html);
    };
    const taken = new Map();
    return findings.map((f) => {
      let el = null;
      try { el = f.selector ? document.querySelector(f.selector) : null; } catch { el = null; }
      if (!el && f.html) {
        const found = candidates(f.html);
        const key = `${f.rule}\u0000${f.html}`;
        const n = taken.get(key) || 0;
        taken.set(key, n + 1);
        el = found[Math.min(n, found.length - 1)] || null;
      }
      let c = el && el.closest('.case[id]');
      if (!c && f.html && cases.length) c = cases.find((k) => k.outerHTML.includes(f.html.slice(0, 200)));
      return { ...f, path: el ? pathOf(el) : null, case: c ? c.id : null };
    });
  }, findings);
}

async function readCases(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.case[id]')].map((c) => {
      const title = (c.querySelector('.case-title') || {}).textContent || '';
      const m = /\b(PASS|FAIL|CANTTELL|INAPPLICABLE|NOTAPPLICABLE)\b/.exec(title);
      return { id: c.id, title: title.trim(), expected: m ? m[1].replace('NOTAPPLICABLE', 'INAPPLICABLE') : 'OTHER' };
    })
  );
}

async function runFixtures(browser) {
  const server = await serve(repo);
  const base = `http://127.0.0.1:${server.address().port}`;
  const rgaa = (await import('@surea11y/pack-rgaa')).default;
  const files = readdirSync(path.join(repo, 'tests/fixtures')).filter((f) => f.endsWith('-all-scenarios.html')).sort();
  const pages = [];
  for (const file of files) {
    const rule = file.replace(/-all-scenarios\.html$/, '');
    const url = `${base}/tests/fixtures/${file}`;
    const probe = await browser.newPage();
    await probe.goto(url);
    const cases = await readCases(probe);
    await probe.close();
    const def = rgaa.rules.find((r) => r.id === rule);
    process.stdout.write(`fixtures  ${rule} (${cases.length} cases) `);
    const { results, loaded } = await scanPage(browser, url);
    console.log(Object.entries(results).map(([k, v]) => `${k}:${v.error ? 'ERR' : v.ms + 'ms'}`).join(' '));
    pages.push({ id: rule, url: `tests/fixtures/${file}`, rule, ruleType: def && def.meta && def.meta.type, cases, loaded, results });
  }
  server.close();
  return { pages };
}

async function runUrls(browser, corpusName, corpus) {
  const pages = [];
  const list = corpus.pages || corpus.flatMap((site) => site.pages.map((p, i) => ({ ...p, id: `${slug(site.site)}-${i + 1}`, site: site.site })));
  for (const p of list) {
    process.stdout.write(`${corpusName}  ${p.id} `);
    const { results, loaded } = await scanPage(browser, p.url);
    const state = loaded ? `${loaded.status}${loaded.blocked ? ' BLOCKED' : ''} ` : '';
    console.log(state + Object.entries(results).map(([k, v]) => `${k}:${v.error ? 'ERR ' + v.error.slice(0, 60) : v.ms + 'ms'}`).join(' '));
    pages.push({ ...p, loaded, results });
  }
  return { pages };
}

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const browser = await chromium.launch();
{
  const p = await browser.newPage();
  USER_AGENT = (await p.evaluate(() => navigator.userAgent)).replace('HeadlessChrome', 'Chrome');
  await p.close();
}
for (const name of wanted) {
  let data;
  if (name === 'fixtures') data = await runFixtures(browser);
  else {
    const file = path.join(here, 'corpus', `${name}.json`);
    if (!existsSync(file)) { console.log(`${name}: no corpus/${name}.json, skipped`); continue; }
    data = await runUrls(browser, name, JSON.parse(readFileSync(file, 'utf8')));
  }
  const meta = {
    corpus: name,
    scannedAt: new Date().toISOString(),
    engines: Object.fromEntries(engines.map((e) => [e, { label: ENGINES[e].label, version: ENGINES[e].version(), reports: ENGINES[e].reports }]))
  };
  // A run of some engines keeps the other engines' results from earlier runs.
  const out = path.join(here, 'results', `${name}.json`);
  if (existsSync(out)) {
    const prev = JSON.parse(readFileSync(out, 'utf8'));
    meta.engines = { ...prev.meta.engines, ...meta.engines };
    const prevPages = new Map(prev.pages.map((p) => [p.id, p]));
    for (const p of data.pages) {
      const old = prevPages.get(p.id);
      if (old) p.results = { ...old.results, ...p.results };
      if (old && !p.loaded) p.loaded = old.loaded;
    }
  }
  writeFileSync(out, JSON.stringify({ meta, ...data }, null, 1));
  console.log(`wrote results/${name}.json`);
}
await browser.close();
