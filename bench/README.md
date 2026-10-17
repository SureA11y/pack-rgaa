# Comparing the pack with other RGAA engines

This folder scans pages with `@surea11y/pack-rgaa` and with the other open-source engines that check RGAA automatically and report per RGAA criterion, and compares what each finds. It lives on its own branch, isn't part of the published package, and has its own dependencies.

```sh
cd bench
npm install                  # installs the pack from the working tree (a copy, not a link)
npx playwright install chromium
npm run vendor               # fetches and builds the engines that aren't on npm (vendor/)
npm run scan                 # all corpora; or: node run.mjs fixtures neutral
node run.mjs fixtures --engines pack  # rescan one engine; the others' results are kept
npm run summarize            # results/summary.json: each engine against what is known of the pages
npm run diff                 # results/diff.json: the pack against each engine, criterion by criterion
npm run report               # RESULTS.md, from both
```

## The engines

Each one runs in Chromium, on the page as loaded, and gives a verdict per RGAA 4.1 criterion.

| Engine | Where it comes from | How it runs here |
|---|---|---|
| `@surea11y/pack-rgaa` | this repository | `@surea11y/core` with the pack and its `rgaa-4.1.2` profile, through `packScript()` and `runa11yCoreInPage`. A criterion's verdict is the pack's result for it. |
| `@uuv/a11y` | npm | `RgaaChecker`, from its browser bundle. Every check comes back as an issue; a check that found elements in error fails its criterion, one with elements to check manually asks. |
| `@a11ylint/core` | npm | Its rules in their `dom` mode, in the page (`vendor/a11ylint.js`), given the page's images, frames, links, form fields, headings, and each element with text of its own paired with the nearest ancestor with a background. Its Playwright helper collects only frames, images and the document, so it is not used. It reports failures only. Its test 8.1.3 is inverted, so it fails 8.1 on every page whose doctype comes first ([TRIAGE.md](./TRIAGE.md)). |
| RGAA Checker (ARNEO) | [arneoio/rgaa-checker](https://github.com/arneoio/rgaa-checker), the browser extension's criteria | Its criterion classes, bundled (`vendor/arneo.js`) and run as the extension runs them. C passes, NC fails, NA is inapplicable; NT with elements highlighted to check asks, NT without says nothing. |
| RGAA Audit (Le Singe Du Numérique) | [Stan69000/rgaa-audit](https://github.com/Stan69000/rgaa-audit), its CLI's rules | Its rules (`cli/src/rules`), run on the page as its CLI runs them. A probable error fails its criterion, a heuristic warning asks, a good signal passes; a manual-only result says nothing. |

`vendor.json` pins the commits of the two engines that aren't on npm; `npm run vendor` fetches them there and builds the bundles.

**axe-core** is a WCAG engine whose rules carry RGAA tags, so its results are not RGAA's: it isn't compared by default. `node run.mjs neutral --engines axe` scans with its `RGAAv4` rules as a reference.

**Not scanned:** Asqatasun and Tanaguru need a Java server, a database and Docker. The other RGAA tools found on GitHub and npm are audit checklists, AI assistants, static source linters, a SaaS client, or are built on axe-core.

## The corpora

- **`fixtures`**: the pack's own scenario pages (`../tests/fixtures`), each case marked FAIL, PASS or CANTTELL for one rule. A finding is placed in the case that holds its element. They were written for the pack, so they favour it.
- **`neutral`** (`corpus/neutral.json`): W3C's Before and After Demonstration, four pages with barriers and the same four repaired.
- **`audited`** (`corpus/audited.json`): 12 French sites whose accessibility statement, from a human RGAA 4.1 audit, lists the non-conforming criteria and the sample pages. Each entry's `notes` says what was inferred (HAS and Insee describe their failures in prose; impots.gouv.fr lists its main ones).

## How pages are scored

Each engine scans each page in a fresh browser context, one after the other in the same pass. Rescan the live corpora with every engine, not one: a site changes, and throttles repeated visits (Insee answers with errors), so an engine rescanned alone is judged on a different visit from the others. Rescanning one engine is fine on the fixtures. The browser sends its own user agent without the word "Headless", since some sites answer headless Chromium with a block page. A page that answers with an error or a block page, or that any engine refused or failed on, is left out for every engine, so all are judged on the same pages.

- **`summarize`** judges each engine against what is known: on the fixtures, its verdict in each case against the case's expected outcome; on the BAD demo, what it fails before and after the repair; on the audited sites, the criteria it fails on at least one of a site's sample pages against the audit's list.
- **`diff`** puts the pack and each other engine side by side, page by page and criterion by criterion: both fail, neither fails, one fails while the other asks or passes, or only one judges the criterion at all. Where both fail, it matches the elements each failed by their path in the page.

The pack refuses pages whose scripts replace a JavaScript built-in it relies on (core's `PAGE_BUILTINS_BROKEN`): HAS loads Prototype.js, which replaces `Array.from`.
