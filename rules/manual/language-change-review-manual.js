/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-language-change-review
 * @atomic true
 * @summary A passage written in another language than the one in effect has its language given
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible blocks of text (a paragraph, list item, cell,
 *   heading, quotation, label, caption, div…) whose own text, without the
 *   blocks inside them and the elements inside them that carry their own
 *   lang, holds 8 words or more, and whose language in effect (the nearest
 *   lang or xml:lang on the block or a parent) is one the rule can
 *   recognise: fr, en, es, pt, it, de, nl. Code, preformatted text,
 *   scripts, styles, form controls, buttons and aria-hidden content are
 *   left out. A page with no such passage is notApplicable.
 * @expectation
 *   RGAA 8.7.1: « Dans chaque page web, chaque texte écrit dans une langue
 *   différente de la langue par défaut vérifie-t-il une de ces conditions
 *   (hors cas particuliers) ? L’indication de langue est donnée sur
 *   l’élément contenant le texte (attribut lang et/ou xml:lang) ; […] sur
 *   un des éléments parents ». A block whose text is clearly in another
 *   language, by the share of frequent function words of each language,
 *   is asked about (undeclaredLanguageChange), one occurrence per element.
 *   The particular cases make proper nouns and foreign common nouns of the
 *   dictionary not applicable: words of that kind do not count in the
 *   guess, passages under 8 words are not looked at, and a passage whose
 *   words other than function words all start with a capital (a name, the
 *   title of a work) is skipped. A guess is not proof, so a person
 *   confirms.
 * @implementation-notes
 * - Manual (cantTell).
 * - Same guess as rgaa-default-language-review: it asks only when the
 *   guessed language's stopwords number 3 or more, a quarter of the words
 *   or more, more than any other language's and three times the declared
 *   language's. A block that mixes two languages is not found.
 * - When the page's whole text is in another language than lang on
 *   <html>, that is a wrong default language (8.4.1), which
 *   rgaa-default-language-review asks about: the blocks under <html>'s
 *   language are then not asked about one by one.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-language-change-review';

const meta = {
  title: 'A passage in another language has its language given',
  description:
    'Flags a block of 8 words or more whose text, guessed from its frequent words, is clearly in another language than the lang in effect, for a person to check that the change of language is given with lang.',
  i18n: {
    titleKey: 'languageChangeReview_title',
    descriptionKey: 'languageChangeReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'language', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['undeclaredLanguageChange'],
  review: {
    undeclaredLanguageChange: {
      steps: [
        'Find the text the report names, and read it; the language the report gives is only a guess from frequent words.',
        'Decide whether it is written in another language than the one the report says is in effect.',
        'Leave out proper nouns, and foreign words that are in the dictionary of the page’s language or in common use.',
        'Inspect the text: check for a lang or xml:lang attribute on its element or on a parent, which gives its language.'
      ],
      passWhen:
        'The text is in the language in effect, or is made of words the test leaves out, or a lang on it or a parent gives its language.',
      failWhen:
        'The text is in another language and neither its element nor a parent gives it, which fails RGAA 8.7.1.'
    }
  }
};

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
  const langValue = (el) =>
    dom.hasAttribute(el, 'lang')
      ? norm(dom.getAttribute(el, 'lang'))
      : norm(dom.getAttribute(el, 'xml:lang'));
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
  const BLOCKS = new Set(
    (
      'address article aside blockquote body caption dd details dialog div dl dt fieldset ' +
      'figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup legend li label main ' +
      'nav ol p section summary table tbody td tfoot th thead tr ul'
    ).split(' ')
  );

  const html = document && dom.documentElement(document);
  const body = document && dom.body(document);
  if (!html || !body) return na;

  // Each visible text, grouped under its nearest block; text inside an
  // element with its own lang belongs to a passage of that element.
  const groups = new Map();
  const pageParts = [];
  let walker = null;
  try {
    walker = dom.createTreeWalker(document, body, 4, null);
  } catch {}
  for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
    const t = norm(dom.nodeValue(n));
    if (!t) continue;
    const p = dom.parentElement(n);
    if (!p) continue;
    let block = null;
    let skip = false;
    let underOwnLang = false;
    for (let a = p; a && a !== html; a = dom.parentElement(a)) {
      if (SKIP.has(tagOf(a)) || norm(dom.getAttribute(a, 'aria-hidden')).toLowerCase() === 'true') {
        skip = true;
        break;
      }
      if (!block && (BLOCKS.has(tagOf(a)) || hasOwnLang(a))) block = a;
      if (hasOwnLang(a)) underOwnLang = true;
    }
    if (skip || !block || !visible(p)) continue;
    if (!underOwnLang) pageParts.push(t);
    if (!groups.has(block)) groups.set(block, []);
    groups.get(block).push(t);
  }

  // A page whose whole text is in another language than <html> says is
  // rgaa-default-language-review's matter (8.4.1).
  const defaultValue = langValue(html);
  const wrongDefault = !!guessOther(pageParts.join(' '), primaryOf(defaultValue), 50, 0.2);

  const occurrences = [];
  for (const [block, parts] of groups) {
    let holder = null;
    for (let a = block; a && !holder; a = dom.parentElement(a)) {
      if (hasOwnLang(a)) holder = a;
    }
    if (!holder || (holder === html && wrongDefault)) continue;
    const declared = langValue(holder);
    const guessed = guessOther(parts.join(' '), primaryOf(declared), 8, 0.25);
    if (!guessed) continue;
    occurrences.push(
      helpers.reportOccurrence(block, {
        summary: `This text looks written in "${guessed}", while the language in effect here is "${declared}".`,
        hint: `If it is in another language, and is not a proper noun or a word the dictionary of the page's language has, give its language with lang on the element or a parent, for example lang="${guessed}" (RGAA 8.7.1).`,
        i18n: {
          summaryKey: 'languageChangeReview_summary_cantTell',
          hintKey: 'languageChangeReview_hint_cantTell',
          params: { guessed, declared }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Which language the text is written in: the guess comes from its frequent words.'
        },
        data: {
          details: { reasonCode: 'undeclaredLanguageChange', guessed, declared },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) return na;
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
