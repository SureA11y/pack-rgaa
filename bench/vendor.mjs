// Fetches the engines that aren't on npm, at the commits the bench was run
// with, into vendor/ (gitignored), and builds what needs building.
//
//   node vendor.mjs

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const vendor = path.join(here, 'vendor');

// The commits are in vendor.json, which the results name.
const commits = JSON.parse(readFileSync(path.join(here, 'vendor.json'), 'utf8'));
const VENDORED = {
  // ARNEO's RGAA Checker browser extension: one class per RGAA criterion.
  arneo: { repo: 'https://github.com/arneoio/rgaa-checker.git', commit: commits.arneo },
  // Le Singe Du Numérique's RGAA Audit: the rules of its Playwright CLI.
  stan: { repo: 'https://github.com/Stan69000/rgaa-audit.git', commit: commits.stan }
};

const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();

mkdirSync(vendor, { recursive: true });
for (const [name, { repo, commit }] of Object.entries(VENDORED)) {
  const dir = path.join(vendor, name);
  if (!existsSync(dir)) git(vendor, 'clone', '--quiet', repo, name);
  if (git(dir, 'rev-parse', 'HEAD') !== commit) {
    git(dir, 'fetch', '--quiet', 'origin', commit);
    git(dir, 'checkout', '--quiet', '--detach', commit);
  }
  console.log(`${name} at ${commit.slice(0, 7)}`);
}

// ARNEO's criteria are TypeScript classes the extension runs in the page.
// The bundle runs each one and returns what it decided; names are kept,
// since a criterion reads its number from its class name.
const arneoSrc = path.join(vendor, 'arneo/styleguide/assets/scripts/extension');
const entry = path.join(vendor, 'arneo-entry.ts');
writeFileSync(
  entry,
  `import AccessibilityTester from ${JSON.stringify(path.join(arneoSrc, 'AccessibilityTester'))};
// The extension keeps the elements it flags as nodes; the bench needs a
// selector for each, so a finding can be matched with another engine's.
const cssPath = (el: Element): string => {
  const parts: string[] = [];
  for (let e: Element | null = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
    const parent = e.parentElement;
    const same = parent ? [...parent.children].filter((c) => c.localName === e!.localName) : [];
    parts.unshift(same.length > 1 ? \`\${e.localName}:nth-of-type(\${same.indexOf(e) + 1})\` : e.localName);
  }
  return ['html', ...parts].join(' > ');
};
(window as any).__arneoRun = () => {
  const tester = new AccessibilityTester();
  const out: any = {};
  for (const [key, criterion] of Object.entries<any>(tester.criterionList)) {
    try {
      const status = criterion.runTest();
      // What the extension highlights: a criterion that overrides
      // getHighlightedElements() lists the elements at fault there; the
      // others list what they checked in elementList.
      const own = Object.getPrototypeOf(criterion).hasOwnProperty('getHighlightedElements');
      const elements = ((own ? criterion.getHighlightedElements() : criterion.elementList) || [])
        .filter((el: any) => el && el.nodeType === 1)
        .map((el: any) => ({ selector: cssPath(el), html: el.outerHTML.slice(0, 300) }));
      out[key] = { status, tests: criterion.testList || {}, message: (criterion.messageList || {})[status] || '', elements };
    } catch (e: any) {
      out[key] = { error: String((e && e.message) || e) };
    }
  }
  return out;
};
`
);
await build({
  entryPoints: [entry],
  bundle: true,
  format: 'iife',
  keepNames: true,
  target: 'es2020',
  logLevel: 'warning',
  outfile: path.join(vendor, 'arneo.js')
});
console.log('built vendor/arneo.js');

// @a11ylint/core runs in Node on elements its Playwright helper collects,
// and that helper collects only frames, images and the document. Its 'dom'
// mode takes the page's own elements, so the bundle runs it in the page and
// gives every rule what it reads. Its audit writer needs fs, and isn't used.
const a11ylintEntry = path.join(vendor, 'a11ylint-entry.js');
writeFileSync(
  a11ylintEntry,
  `import { Core } from '@a11ylint/core/build/core.js';
const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
// Text a person sees: rendered, and not clipped away as screen-reader-only text.
const shown = (el) => {
  if (!el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false;
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
};
const backgroundOf = (el) => {
  for (let e = el; e; e = e.parentElement) {
    const bg = getComputedStyle(e).backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\\([^)]*,\\s*0\\)$/.test(bg)) return e;
  }
  return document.documentElement;
};
window.__a11ylintRun = () => {
  const all = (s) => [...document.querySelectorAll(s)];
  const texts = all('body *').filter((el) => hasOwnText(el) && !['script', 'style', 'noscript', 'template'].includes(el.localName) && shown(el));
  return new Core().run({
    mode: 'dom',
    document,
    images: all('img, area, svg, input[type="image"], [role="img"]'),
    frames: all('iframe, frame'),
    links: all('a[href], [role="link"]'),
    colorsElements: texts.map((el) => ({ foregroundElement: el, backgroundElement: backgroundOf(el) })),
    formFields: all('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea'),
    headings: all('h1, h2, h3, h4, h5, h6, [role="heading"]')
  });
};
`
);
await build({
  entryPoints: [a11ylintEntry],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  logLevel: 'warning',
  nodePaths: [path.join(here, 'node_modules')],
  plugins: [
    {
      name: 'no-audit-writer',
      setup(b) {
        b.onResolve({ filter: /generateAudit\.js$/ }, () => ({ path: 'audit-writer', namespace: 'stub' }));
        b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export class AuditGenerator {}' }));
      }
    }
  ],
  outfile: path.join(vendor, 'a11ylint.js')
});
console.log('built vendor/a11ylint.js');
