/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-default-language-review
 * @atomic true
 * @summary The page's default language code names the language the page is written in
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document whose <html> element has a lang
 *   (or, failing that, xml:lang) whose language code is und or mul, or is
 *   one of the languages the rule can recognise (fr, en, es, pt, it, de,
 *   nl). A page with no default language, or an invalid one, is
 *   notApplicable here: rgaa-page-language-present (8.3.1) and
 *   rgaa-html-lang-code-valid (8.4.1, « valide ») judge it. So is a page
 *   in another language, and a run narrowed by contextSelector or
 *   engineOptions.fragment.
 * @expectation
 *   RGAA 8.4.1: « Pour chaque page web ayant une langue par défaut, le code
 *   de langue vérifie-t-il ces conditions ? Le code de langue est valide ;
 *   Le code de langue est pertinent », and the methodology reads pertinent
 *   as « qui indique la langue principale du document ». Two cases are
 *   asked about, on <html>:
 *   - undeterminedLang: the code is und (undetermined) or mul (multiple
 *     languages). Both are valid ISO 639-2 codes, but neither names the
 *     page's main language, which may still be known.
 *   - langMismatch: the page's own visible text (outside elements that
 *     carry their own lang, code, scripts and form controls) holds 50 words
 *     or more, and, by the share of frequent function words of each
 *     language, is clearly written in another language than the code says
 *     (lang="en" on a page of French text). A guess from words is not
 *     proof, so a person confirms.
 * @implementation-notes
 * - Manual (cantTell).
 * - The guess counts stopwords of French, English, Spanish, Portuguese,
 *   Italian, German and Dutch; it asks only when the guessed language's
 *   are at least a fifth of the words, more than any other language's and
 *   three times the declared language's. Close languages that share most
 *   function words (Spanish and Portuguese) are often not told apart, and
 *   then nothing is asked.
 * - rgaa-language-change-review uses the same guess for passages (8.7.1),
 *   and leaves the page to this rule when the whole page is in another
 *   language.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-default-language-review';

const meta = {
  title: "The page's default language code names its main language",
  description:
    "Flags a page whose lang on <html> is und or mul, or whose text, guessed from its frequent words, is clearly in another language than lang says, for a person to check that the code gives the page's main language.",
  i18n: {
    titleKey: 'defaultLanguageReview_title',
    descriptionKey: 'defaultLanguageReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'language', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['undeterminedLang', 'langMismatch'],
  review: {
    undeterminedLang: {
      steps: [
        'Find the language code the report names, on the <html> element: it is und (undetermined) or mul (several languages).',
        'Read the page, and decide which language most of it is written in.'
      ],
      passWhen:
        'No main language can be named, for instance because the page gives the same weight to several languages.',
      failWhen: 'The page has a main language that the code does not give, which fails RGAA 8.4.1.'
    },
    langMismatch: {
      steps: [
        'Find the language code the report names, on the <html> element.',
        'Read the page, and decide which language most of it is written in; the language the report gives is only a guess from frequent words.',
        'Compare it with the code.'
      ],
      passWhen: 'The code gives the main language of the page.',
      failWhen:
        'The main language of the page is not the one the code gives, which fails RGAA 8.4.1.'
    }
  }
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const na = { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };

  // Stopword language guess, the same in rgaa-default-language-review and
  // rgaa-language-change-review. Each list holds frequent function words
  // (articles, prepositions, pronouns, auxiliaries) of one language: their
  // share of a text tells its language, while nouns, names and technical
  // terms, borrowed across languages, count for none.
  const STOPWORDS = {
    fr: 'a à au aux avec c ce ces cet cette d dans de des du elle elles en est et été être il ils j je l la le les leur leurs lui ma mais me mes moi mon n ne nos notre nous on ont ou où par pas plus pour qu que qui sa sans se ses son sont sous sur ta te tes toi ton tous tout très tu un une vos votre vous y',
    en: 'a about all an and are as at be been but by can could do does for from had has have he her his how i if in into is it its may more my no not of on or our should so than that the their them there these they this those to us was we were what when which who will with would you your',
    es: 'a al como con cuando de del donde el ella en entre era es esta este estos está están fue hay la las le les lo los mas más muy no nos nuestra nuestro o para pero por porque que se ser si sin sobre son su sus también todo todos un una usted y ya',
    pt: 'a ao aos as à com como da das de do dos e ela ele em entre era essa esse está estão foi há isso já mais mas muito na nas não no nos o os ou para pela pelo por que se sem ser seu seus sua suas são também um uma você é',
    it: 'a ai al alla alle anche che ci come con da dal dalla degli dei del della delle di dove e gli ha hanno il in la le lo ma molto ne nei nel nella non o per più questa questo se si sono stato sua sue suo suoi tra tutti tutto un una uno è',
    de: 'als am an auch auf aus bei bin bis das dass dem den der des die dies diese dieser dieses du durch ein eine einem einen einer eines er es für hat haben ich ihr ihre im in ist kann können mit nach nicht noch nur oder sich sie sind so um und uns unter vom von war was werden wie wir wird wurde zu zum zur über',
    nl: 'aan al als bij dan dat de deze die dit door een en er geen haar heeft hebben het hij hoe ik in is je kan maar met meer naar niet nog of om ons onder ook op over te tot u uit van voor was wat we werd wij wordt worden ze zich zijn zo'
  };
  const LANGS = Object.keys(STOPWORDS);
  const LISTS = {};
  for (const l of LANGS) LISTS[l] = new Set(STOPWORDS[l].split(' '));
  const primaryOf = (value) =>
    String(value || '')
      .trim()
      .split('-')[0]
      .toLowerCase();
  // The language a text is clearly written in, other than `declared`, or
  // null: at least minWords words; the guessed language's stopwords at
  // least 3, at least minShare of the words, strictly more than any other
  // language's, and three times the declared language's or more.
  function guessOther(text, declared, minWords, minShare) {
    if (!LISTS[declared]) return null;
    const words = String(text).match(/\p{L}+/gu) || [];
    if (words.length < minWords) return null;
    const hits = {};
    for (const l of LANGS) hits[l] = 0;
    for (const w of words) {
      const t = w.toLowerCase();
      for (const l of LANGS) if (LISTS[l].has(t)) hits[l] += 1;
    }
    const ranked = LANGS.slice().sort((a, b) => hits[b] - hits[a]);
    const guessed = ranked[0];
    const h = hits[guessed];
    if (guessed === declared || h <= hits[ranked[1]]) return null;
    if (h < 3 || h < minShare * words.length || h < 3 * hits[declared]) return null;
    // A name or a title of a work (« The Lord of the Rings »): every word
    // but the first that is not a stopword starts with a capital.
    const content = words.slice(1).filter((w) => !LISTS[guessed].has(w.toLowerCase()));
    if (content.length && content.every((w) => w[0] !== w[0].toLowerCase())) return null;
    return guessed;
  }

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const hasOwnLang = (el) => dom.hasAttribute(el, 'lang') || dom.hasAttribute(el, 'xml:lang');
  const visibleCache = new Map();
  function visible(el) {
    if (visibleCache.has(el)) return visibleCache.get(el);
    let v = true;
    try {
      if (helpers.isDomVisibleEligible) {
        v = !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    visibleCache.set(el, v);
    return v;
  }
  const SKIP = new Set([
    'script',
    'style',
    'template',
    'noscript',
    'code',
    'kbd',
    'samp',
    'pre',
    'var',
    'textarea',
    'select',
    'option',
    'button',
    'input',
    'svg',
    'math'
  ]);

  const html = document && dom.documentElement(document);
  if (!html || tagOf(html) !== 'html') return na;
  let attribute = 'lang';
  let value = norm(dom.getAttribute(html, 'lang'));
  if (!value) {
    attribute = 'xml:lang';
    value = norm(dom.getAttribute(html, 'xml:lang'));
  }
  const lang = primaryOf(value);
  let occurrence = null;

  if (lang === 'und' || lang === 'mul') {
    occurrence = helpers.reportOccurrence(html, {
      summary: `The page's default language is given as ${attribute}="${value}", which names no language.`,
      hint: `"und" means undetermined and "mul" several languages: give the code of the page's main language instead, for example "fr" (RGAA 8.4.1).`,
      i18n: {
        summaryKey: 'defaultLanguageReview_summary_cantTell_undeterminedLang',
        hintKey: 'defaultLanguageReview_hint_cantTell_undeterminedLang',
        params: { attribute, lang: value }
      },
      uncertainty: {
        code: 'judgement-required',
        needed: 'Which language the page is mainly written in, and whether it can be named.'
      },
      data: {
        details: { reasonCode: 'undeterminedLang', attribute, lang: value },
        visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
      }
    });
  } else if (LISTS[lang]) {
    // The page's own visible text: what the default language applies to.
    const parts = [];
    const body = dom.body(document);
    let walker = null;
    try {
      walker = body ? dom.createTreeWalker(document, body, 4, null) : null;
    } catch {}
    for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
      const t = norm(dom.nodeValue(n));
      if (!t) continue;
      const p = dom.parentElement(n);
      let keep = !!p;
      for (let a = p; keep && a && a !== html; a = dom.parentElement(a)) {
        if (SKIP.has(tagOf(a)) || hasOwnLang(a)) keep = false;
        else if (norm(dom.getAttribute(a, 'aria-hidden')).toLowerCase() === 'true') keep = false;
      }
      if (keep && visible(p)) parts.push(t);
    }
    const guessed = guessOther(parts.join(' '), lang, 50, 0.2);
    if (guessed) {
      occurrence = helpers.reportOccurrence(html, {
        summary: `The page's default language is given as ${attribute}="${value}", but its text looks written in "${guessed}".`,
        hint: `Check which language the page is mainly written in, and give its code in lang on <html> (RGAA 8.4.1).`,
        i18n: {
          summaryKey: 'defaultLanguageReview_summary_cantTell_langMismatch',
          hintKey: 'defaultLanguageReview_hint_cantTell_langMismatch',
          params: { attribute, lang: value, guessed }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Which language the page is mainly written in: the guess comes from its frequent words.'
        },
        data: {
          details: { reasonCode: 'langMismatch', attribute, lang: value, guessed },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      });
    }
  }

  if (!occurrence) return na;
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'serious',
    occurrences: [occurrence]
  };
}

module.exports = { id, meta, runInPage, applicability };
