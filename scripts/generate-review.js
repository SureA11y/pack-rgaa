'use strict';

/**
 * Generate review.js: how a person answers core's undecided findings, in
 * RGAA's terms. Core's steps name WCAG, which a report against RGAA doesn't
 * judge by; these are core's own French steps, with what fails named as the
 * RGAA tests the finding bears on (rule-map.js). A finding only the RGAA
 * profile asks about reads them (core's standard.review), in French, the
 * language the standard declares.
 *
 * A code that counts toward no RGAA test is left out, and reads core's steps.
 * Where core's steps are WCAG's logic rather than its name,
 * data/review-overrides.js says it in RGAA's terms, and the build fails on a
 * code left speaking of WCAG.
 *
 * Usage:
 *   node scripts/generate-review.js           write the module
 *   node scripts/generate-review.js --check   exit 1 if it is out of date
 */

const fs = require('fs');
const path = require('path');

const core = require('@surea11y/core');
const { RGAA_RULE_TESTS } = require('../rule-map');
const OVERRIDES = require('./data/review-overrides');

const OUTPUT_FILE = path.join(__dirname, '..', 'review.js');
const VERSION = '4.1.2';

const french = () => require('@surea11y/core/procedures/fr');

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

const named = (tests) =>
  tests.length > 1 ? `les tests ${tests.join(', ')} du RGAA` : `le test ${tests[0]} du RGAA`;
const ofNamed = (tests) =>
  tests.length > 1 ? `des tests ${tests.join(', ')} du RGAA` : `du test ${tests[0]} du RGAA`;

const NUMBER = String.raw`\d+(?:\.\d+)*`;
const LIST = String.raw`${NUMBER}(?:(?:,| et| ou) ${NUMBER})*(?: \(ou ${NUMBER}\))?`;

// What RGAA doesn't have: WCAG, its levels, its criteria by number, and
// best practice.
const WCAG_WORDS = /WCAG|\bAAA?\b|niveau A|critères? \d|bonnes? pratiques?|18[.,]66|7:1/;

// Core's text with what fails named as the tests.
function inRgaaTerms(text, tests) {
  return text
    .replace(/ pour WCAG 1\.4\.3, et à 7:1 \([^)]*\) pour 1\.4\.6/g, '')
    .replace(/18[.,]66/g, '18,5')
    .replace(
      new RegExp(
        String.raw`ne (?:respecte|satisfait) pas (?:à )?(?:(?:le|les) critères? )?WCAG ${LIST}`,
        'g'
      ),
      `ne respecte pas ${named(tests)}`
    )
    .replace(new RegExp(String.raw`\bde WCAG ${LIST}`, 'g'), ofNamed(tests))
    .replace(new RegExp(String.raw`\s*\((?:critères? )?WCAG ${LIST}\)`, 'g'), ` (${named(tests)})`)
    .replace(/\s*\((?:F|G|H)\d+\)/g, '');
}

function entryOf(ruleId, code, entry, tests, overrides, problems) {
  const override = (overrides[ruleId] && overrides[ruleId][code]) || {};
  const stepKeys = Object.keys(entry)
    .filter((k) => k.startsWith('step'))
    .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
  const ours = (text) => text.replace(/@TESTS@/g, named(tests));
  const steps = override.steps
    ? override.steps.map(ours)
    : stepKeys.map((k) => inRgaaTerms(entry[k], tests));
  const passWhen = ours(override.passWhen || inRgaaTerms(entry.pass, tests));
  let failWhen = ours(override.failWhen || inRgaaTerms(entry.fail, tests));
  if (!/RGAA/.test(failWhen)) {
    failWhen = `${failWhen.replace(/\.$/, '')}, ce qui ne respecte pas ${named(tests)}.`;
  }
  const texts = [...steps, passWhen, failWhen];
  for (const text of texts) {
    if (WCAG_WORDS.test(text)) problems.push(`${ruleId} ${code}: ${text}`);
  }
  return { steps, passWhen, failWhen };
}

function buildReview(
  dictionary = french(),
  table = RGAA_RULE_TESTS[VERSION],
  overrides = OVERRIDES
) {
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
      (out[ruleId] = out[ruleId] || {})[code] = entryOf(
        ruleId,
        code,
        found[ruleId][code],
        tests,
        overrides,
        problems
      );
    }
  }
  if (problems.length) {
    throw new Error(`still in WCAG's terms:\n${problems.join('\n')}`);
  }
  return out;
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
 * How a person answers core's undecided findings, in RGAA's terms and in
 * French (core's standard.review), by rule and reason code.
 *
 * GENERATED by scripts/generate-review.js from core's French steps and
 * rule-map.js -- do not edit by hand; tests/review.test.js fails on any drift.
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

async function main() {
  const expected = await formatted(renderModule(buildReview()));
  if (process.argv.includes('--check')) {
    const actual = fs.existsSync(OUTPUT_FILE) ? fs.readFileSync(OUTPUT_FILE, 'utf8') : '';
    if (actual !== expected) {
      console.error('[generate-rgaa-review] review.js is out of date; run npm run review');
      process.exit(1);
    }
    console.log('[generate-rgaa-review] up to date');
    return;
  }
  fs.writeFileSync(OUTPUT_FILE, expected, 'utf8');
  console.log('[generate-rgaa-review] wrote review.js');
}

module.exports = { buildReview, renderModule, formatted };

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
