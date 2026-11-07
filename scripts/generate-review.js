'use strict';

/**
 * Generate review.js and the French of its steps: how a person answers core's
 * undecided findings, in RGAA's terms. Core's steps name WCAG, which a report
 * against RGAA doesn't judge by; these are core's own steps, with what fails
 * named as the RGAA tests the finding bears on (rule-map.js). A finding only
 * the RGAA profile asks about reads them (core's standard.review).
 *
 * standard.review is English, from core's English steps; its French, from
 * core's French steps put in RGAA's terms the same way, goes in i18n/fr.json
 * under rgaa_standardReview_<rule id>_<CODE>_step<n>, _pass and _fail, which
 * core reads in a French scan. The build fails if an entry differs between
 * the two languages (a code, a number of steps, a placeholder).
 *
 * A code that counts toward no RGAA test is left out, and reads core's steps.
 * Where core's steps are WCAG's logic rather than its name,
 * data/review-overrides.js says it in RGAA's terms, in both languages, and
 * the build fails on a code left speaking of WCAG in either.
 *
 * Usage:
 *   node scripts/generate-review.js           write review.js and i18n/fr.json
 *   node scripts/generate-review.js --check   exit 1 if either is out of date
 */

const fs = require('fs');
const path = require('path');

const core = require('@surea11y/core');
const { RGAA_RULE_TESTS } = require('../rule-map');
const { facetOf } = require('../procedures');
const { overrides: overridesIn } = require('./data/review-overrides');

const OUTPUT_FILE = path.join(__dirname, '..', 'review.js');
const VERSION = '4.1.2';
// The standard's key, which starts its dictionary keys (index.js).
const STANDARD_KEY = 'rgaa';
const TRANSLATED = ['fr'];

const coreDictionary = (lang) => require(`@surea11y/core/procedures/${lang}`);

// The tests a code's findings bear on: where its route sends them, else the
// row's own and those it asks about.
function testsOfCode(row, code) {
  const route = row.reasonCodes && row.reasonCodes[code];
  if (route && Array.isArray(route.tests)) return route.tests;
  const routed = (row.findings || []).flatMap((f) =>
    f.when.reasonCode === code ? f.tests || row.tests : []
  );
  if (routed.length) return [...new Set(routed)];
  return [...row.tests, ...(row.asks || [])];
}

// The test a code's findings are filed under, as index.js files a pack
// rule's: its route's first test, else that of the finding route for the
// code alone (or its first one by finding), else the row's first test or
// question. A route on a field alone, with no reason code, is no code's:
// the code's findings go to more than one test, and its entry is filed
// under the row's first.
function routedTestOf(row, code) {
  const route = row.reasonCodes && row.reasonCodes[code];
  const routes = (row.findings || []).filter((f) => f.when.reasonCode === code);
  const finding = routes.find((f) => Object.keys(f.when).length === 1) || routes[0];
  return [
    ...((route && route.tests) || []),
    ...((finding && finding.tests) || []),
    ...row.tests,
    ...(row.asks || [])
  ][0];
}

const NUMBER = String.raw`\d+(?:\.\d+)*`;

// Each language's words: the tests named, and core's naming of WCAG
// replaced by them.
const WORDS = {
  en: {
    named: (tests) =>
      tests.length > 1 ? `RGAA tests ${tests.join(', ')}` : `RGAA test ${tests[0]}`,
    fails: (failWhen, named) => `${failWhen.replace(/\.$/, '')}, which fails ${named}.`,
    inRgaaTerms(text, tests) {
      const named = this.named(tests);
      const list = String.raw`${NUMBER}(?:(?:,| and| or) ${NUMBER})*(?: \(or ${NUMBER}\))?`;
      return text
        .replace(/18[.,]66/g, '18.5')
        .replace(new RegExp(String.raw`\bfails WCAG ${list}`, 'g'), `fails ${named}`)
        .replace(new RegExp(String.raw`\bof WCAG ${list}`, 'g'), `of ${named}`)
        .replace(new RegExp(String.raw`\s*\(WCAG ${list}\)`, 'g'), ` (${named})`);
    }
  },
  fr: {
    named: (tests) =>
      tests.length > 1 ? `les tests ${tests.join(', ')} du RGAA` : `le test ${tests[0]} du RGAA`,
    ofNamed: (tests) =>
      tests.length > 1 ? `des tests ${tests.join(', ')} du RGAA` : `du test ${tests[0]} du RGAA`,
    fails: (failWhen, named) => `${failWhen.replace(/\.$/, '')}, ce qui ne respecte pas ${named}.`,
    inRgaaTerms(text, tests) {
      const named = this.named(tests);
      const list = String.raw`${NUMBER}(?:(?:,| et| ou) ${NUMBER})*(?: \(ou ${NUMBER}\))?`;
      return text
        .replace(/18[.,]66/g, '18,5')
        .replace(
          new RegExp(
            String.raw`ne (?:respecte|satisfait) pas (?:à )?(?:(?:le|les) critères? )?WCAG ${list}`,
            'g'
          ),
          `ne respecte pas ${named}`
        )
        .replace(new RegExp(String.raw`\bde WCAG ${list}`, 'g'), this.ofNamed(tests))
        .replace(new RegExp(String.raw`\s*\((?:critères? )?WCAG ${list}\)`, 'g'), ` (${named})`);
    }
  }
};

// What RGAA doesn't have, in either language: WCAG, its levels, its
// criteria by number (an RGAA criterion is named with « du RGAA », or
// "RGAA criterion"), and best practice.
const WCAG_WORDS =
  /WCAG|\bAAA?\b|niveau A|\blevel AA?\b|critères? \d(?![\d.]* du RGAA)|(?<!RGAA )\bcriteri(?:on|a) \d|bonnes? pratiques?|best[ -]practices?|18[.,]66|7:1|\((?:ARIA|SCR|F|G|H|C)\d+[,)]/;

// WCAG's technique ids, one or a list: « (F54) », « (F54, F42) », « (ARIA22) ».
const TECHNIQUES = /\s*\((?:(?:ARIA|SCR|F|G|H|C)\d+(?:, )?)+\)/g;

// Core's text with what fails named as the tests.
const inRgaaTerms = (lang, text, tests) =>
  WORDS[lang].inRgaaTerms(text, tests).replace(TECHNIQUES, '');

function entryOf(lang, ruleId, code, entry, tests, overrides, problems) {
  const words = WORDS[lang];
  const byRule = overrides[ruleId] || {};
  const override = byRule[code] || {};
  const stepKeys = Object.keys(entry)
    .filter((k) => k.startsWith('step'))
    .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
  const ours = (text) => text.replace(/@TESTS@/g, words.named(tests));
  let steps = override.steps
    ? override.steps.map(ours)
    : stepKeys.map((k) => inRgaaTerms(lang, entry[k], tests));
  let passWhen = ours(override.passWhen || inRgaaTerms(lang, entry.pass, tests));
  let failWhen = ours(override.failWhen || inRgaaTerms(lang, entry.fail, tests));
  if (!/RGAA/.test(failWhen)) failWhen = words.fails(failWhen, words.named(tests));
  // A rule's '*' entry edits each of its codes after the rest.
  const all = byRule['*'] ? byRule['*']({ steps, passWhen, failWhen }, code) : null;
  if (all) ({ steps, passWhen, failWhen } = all);
  for (const text of [...steps, passWhen, failWhen]) {
    if (WCAG_WORDS.test(text)) problems.push(`${ruleId} ${code} (${lang}): ${text}`);
  }
  return { steps, passWhen, failWhen };
}

/**
 * Core's steps for the codes that count toward an RGAA test, in RGAA's
 * terms, in one language: { ruleId: { CODE: { steps, passWhen, failWhen,
 * facet } } }, facet being that of the test the code's findings are filed
 * under. English by default, the language of standard.review.
 */
function buildReview({
  lang = 'en',
  dictionary = coreDictionary(lang),
  table = RGAA_RULE_TESTS[VERSION],
  overrides = overridesIn(lang)
} = {}) {
  const prefixes = new Map();
  for (const check of core.getChecksCatalog()) {
    const key = check.i18n && check.i18n.titleKey;
    if (key) prefixes.set(key.replace(/_title$/, ''), check.ruleId);
  }
  const found = {};
  for (const [key, text] of Object.entries(dictionary)) {
    const m = /^(.+)_review_(.+)_(step\d+|pass|fail)$/.exec(key);
    const ruleId = m && prefixes.get(m[1]);
    if (!ruleId || !table[ruleId]) continue;
    ((found[ruleId] = found[ruleId] || {})[m[2]] = found[ruleId][m[2]] || {})[m[3]] = text;
  }
  const out = {};
  const problems = [];
  for (const ruleId of Object.keys(found).sort()) {
    for (const code of Object.keys(found[ruleId]).sort()) {
      const tests = testsOfCode(table[ruleId], code);
      if (!tests.length) continue;
      (out[ruleId] = out[ruleId] || {})[code] = {
        ...entryOf(lang, ruleId, code, found[ruleId][code], tests, overrides, problems),
        facet: facetOf(routedTestOf(table[ruleId], code))
      };
    }
  }
  if (problems.length) {
    throw new Error(`still in WCAG's terms:\n${problems.join('\n')}`);
  }
  return out;
}

const placeholders = (text) =>
  [...String(text).matchAll(/\{\{\s*([^|}]+?)\s*\|/g)].map((m) => m[1]).sort();

/**
 * The dictionary keys that translate an English review into another
 * language's (`rgaa_standardReview_<rule id>_<CODE>_step<n>`, `_pass`,
 * `_fail`), each entry whole. Throws where the two differ: a code one of
 * them lacks, another number of steps, other placeholders.
 */
function translationKeys(english, other, lang) {
  const out = {};
  const problems = [];
  for (const ruleId of Object.keys(other)) {
    for (const code of Object.keys(other[ruleId])) {
      if (!(english[ruleId] && english[ruleId][code])) {
        problems.push(`${ruleId} ${code}: in ${lang}, not in English`);
      }
    }
  }
  for (const [ruleId, codes] of Object.entries(english)) {
    for (const [code, en] of Object.entries(codes)) {
      const tr = other[ruleId] && other[ruleId][code];
      const at = `${ruleId} ${code} (${lang})`;
      if (!tr) {
        problems.push(`${at}: no entry`);
        continue;
      }
      if (tr.steps.length !== en.steps.length) {
        problems.push(`${at}: ${tr.steps.length} steps, where the English has ${en.steps.length}`);
        continue;
      }
      const stem = `${STANDARD_KEY}_standardReview_${ruleId}_${code}_`;
      const pairs = [
        ...en.steps.map((text, i) => [`step${i + 1}`, text, tr.steps[i]]),
        ['pass', en.passWhen, tr.passWhen],
        ['fail', en.failWhen, tr.failWhen]
      ];
      for (const [part, source, text] of pairs) {
        if (placeholders(source).join() !== placeholders(text).join()) {
          problems.push(`${at} ${part}: other placeholders than the English`);
        }
        out[`${stem}${part}`] = text;
      }
    }
  }
  if (problems.length) throw new Error(`the languages differ:\n${problems.join('\n')}`);
  return out;
}

// A dictionary with its standard.review keys replaced by `keys`, at its end.
function withTranslations(dictionary, keys) {
  const start = `${STANDARD_KEY}_standardReview_`;
  const kept = Object.entries(dictionary).filter(([key]) => !key.startsWith(start));
  return { ...Object.fromEntries(kept), ...keys };
}

// The pack's dictionary for a language, as the generator writes it.
function translatedDictionary(lang, english = buildReview()) {
  const file = path.join(__dirname, '..', 'i18n', `${lang}.json`);
  const dictionary = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keys = translationKeys(english, buildReview({ lang }), lang);
  return `${JSON.stringify(withTranslations(dictionary, keys), null, 2)}\n`;
}

// Variants read their base's steps, which name WCAG: each gives them in its
// own name instead, in English, with the other languages in its dictionary.
const VARIANTS = {
  'rgaa-contrast-minimum': {
    base: 'contrastMinimum',
    prefix: 'contrastMinimumRgaa',
    sc: { '1.4.3': 'RGAA 3.2' }
  },
  'rgaa-valid-lang': {
    base: 'validLang',
    prefix: 'validLangRgaa',
    sc: { '3.1.2': 'RGAA 8.8', '3.1.1': 'RGAA 8.4' }
  }
};
const LOCALES = ['en', 'fr'];
const dictionaryOf = (locale) => require(`@surea11y/core/procedures/${locale}`);

// What a variant's steps say of WCAG beyond its name.
const VARIANT_DROPS = {
  'rgaa-contrast-minimum': {
    // 3.2 has no exception for the browser's own colors, which 3.3 has.
    PLACEHOLDER_BELOW_THRESHOLD: true
  }
};

function inVariantTerms(text, sc) {
  // RGAA's bold text is large from 18.5px, where WCAG's is from 14pt.
  const out = String(text)
    .replace(/WCAG (\d+\.\d+\.\d+)/g, (m, id) => sc[id] || m)
    .replace(/18([.,])66/g, '18$15')
    .replace(/fails the check/g, `fails ${Object.values(sc)[0]}`)
    .replace(/\s*\(G\d+\)/g, '');
  return /WCAG/.test(out) ? null : out;
}

function buildVariants() {
  const out = {};
  for (const [ruleId, { base, prefix, sc }] of Object.entries(VARIANTS)) {
    const en = dictionaryOf('en');
    const codes = [
      ...new Set(
        Object.keys(en).flatMap((k) => {
          const m = new RegExp(`^${base}_review_(.+)_(?:step\\d+|pass|fail)$`).exec(k);
          return m ? [m[1]] : [];
        })
      )
    ].sort();
    const review = {};
    const dictionaries = {};
    for (const code of codes) {
      if ((VARIANT_DROPS[ruleId] || {})[code]) continue;
      const keys = Object.keys(en).filter((k) =>
        new RegExp(`^${base}_review_${code}_(?:step\\d+|pass|fail)$`).test(k)
      );
      const texts = {};
      let usable = true;
      for (const locale of LOCALES) {
        const dict = dictionaryOf(locale);
        texts[locale] = {};
        for (const key of keys) {
          const text = inVariantTerms(dict[key] || en[key], sc);
          if (text === null) usable = false;
          texts[locale][key.slice(`${base}_review_${code}_`.length)] = text;
        }
      }
      if (!usable) continue;
      const steps = Object.keys(texts.en)
        .filter((k) => k.startsWith('step'))
        .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
      review[code] = {
        steps: steps.map((k) => texts.en[k]),
        passWhen: texts.en.pass,
        failWhen: texts.en.fail
      };
      for (const locale of LOCALES.slice(1)) {
        for (const [part, text] of Object.entries(texts[locale])) {
          (dictionaries[locale] = dictionaries[locale] || {})[`${prefix}_review_${code}_${part}`] =
            text;
        }
      }
    }
    out[ruleId] = { review, dictionaries };
  }
  return out;
}

const manualRules = () =>
  core
    .getChecksCatalog()
    .filter((check) => check.type === 'manual')
    .map((check) => check.ruleId)
    .sort();

function renderModule(review, variants = buildVariants()) {
  return `/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person answers core's undecided findings, in RGAA's terms (core's
 * standard.review), by rule and reason code, each with the facet of the test
 * its findings are filed under. English; i18n/fr.json has the French, under
 * rgaa_standardReview_<rule id>_<CODE>_step<n>, _pass and _fail.
 *
 * GENERATED by scripts/generate-review.js from core's steps and rule-map.js
 * -- do not edit by hand; tests/review.test.js fails on any drift.
 */

const REVIEW = { '${VERSION}': ${JSON.stringify(review, null, 2)} };

// The pack's variants of core's rules: { [ruleId]: { review, dictionaries } }.
const VARIANT_REVIEW = ${JSON.stringify(variants, null, 2)};

// Core's rules that only ask, so decide no test.
const CORE_MANUAL_RULES = ${JSON.stringify(manualRules())};

module.exports = { REVIEW, VARIANT_REVIEW, CORE_MANUAL_RULES };
`;
}

async function formatted(source) {
  const prettier = require('prettier');
  const options = (await prettier.resolveConfig(OUTPUT_FILE)) || {};
  return prettier.format(source, { ...options, filepath: OUTPUT_FILE });
}

// What the generator writes: review.js, and each translated dictionary.
async function outputs() {
  const review = buildReview();
  return [
    [OUTPUT_FILE, await formatted(renderModule(review))],
    ...TRANSLATED.map((lang) => [
      path.join(__dirname, '..', 'i18n', `${lang}.json`),
      translatedDictionary(lang, review)
    ])
  ];
}

async function main() {
  const files = await outputs();
  const name = (file) => path.relative(path.join(__dirname, '..'), file);
  if (process.argv.includes('--check')) {
    const stale = files.filter(
      ([file, text]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text
    );
    if (stale.length) {
      console.error(
        `[generate-rgaa-review] ${stale.map(([file]) => name(file)).join(', ')} out of date; run npm run review`
      );
      process.exit(1);
    }
    console.log('[generate-rgaa-review] up to date');
    return;
  }
  for (const [file, text] of files) {
    fs.writeFileSync(file, text, 'utf8');
    console.log(`[generate-rgaa-review] wrote ${name(file)}`);
  }
}

module.exports = {
  buildReview,
  renderModule,
  formatted,
  outputs,
  translationKeys,
  WCAG_WORDS
};

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
