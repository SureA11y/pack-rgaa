/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-text-direction-marked
 * @atomic true
 * @summary Text that reads in the other direction is in an element with a dir attribute
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible text whose strong characters read in the direction
 *   opposite to that of its context: right-to-left letters (Hebrew,
 *   Arabic, Syriac, Thaana, NKo and related blocks) where the direction is
 *   left to right, or other letters where it is right to left. The context
 *   is the nearest ancestor whose dir is ltr or rtl, and left to right with
 *   none (glossary « Sens de lecture »: « le sens de lecture par défaut est
 *   de gauche à droite »). Text under dir="auto" is left to
 *   rgaa-dir-attribute-valid; code, scripts and styles are left out. A
 *   page with none is notApplicable.
 * @expectation
 *   RGAA 8.10.1: « chaque texte dont le sens de lecture est différent du
 *   sens de lecture par défaut est contenu dans une balise possédant un
 *   attribut dir ».
 *   The test has no exception for short text, and its methodology names
 *   the passages « qui utilisent une langue qui se lit dans le sens
 *   inverse de la langue du document (comme l'arabe ou l'hébreu pour le
 *   français) ». It fails, with no dir between the text and its context:
 *   - directionNotMarked: a run of right-to-left script (Hebrew, Arabic,
 *     Syriac, Thaana, NKo…) with two letters or more in a left-to-right
 *     context, as a whole element or inside other text, whatever its
 *     length (« العربية » in a language menu, « شكرا » quoted in a
 *     sentence): those scripts write only languages read right to left,
 *     so such a run is words of one. Also a text of three words or more
 *     that reads left to right in a right-to-left context;
 *   - bdiWithoutDir: the same text inside a <bdi> with no dir: browsers
 *     isolate it, but RGAA asks for a dir attribute, which a <bdi> does
 *     not replace.
 *   It asks (cantTell) where the characters may not be words of such a
 *   language, as a whole element (shortText) or a run inside other text
 *   (shortRun): a right-to-left run with fewer than two letters (a single
 *   letter, Arabic-Indic digits, a sign of those blocks such as ﷼),
 *   Arabic Mathematical Alphabetic Symbols (U+1EE00 to U+1EEFF), or a
 *   left-to-right run of one or two words in a right-to-left context (a
 *   brand name, an acronym). Text with no letter at all (Western digits,
 *   punctuation) is not looked at.
 * @implementation-notes
 * - One occurrence per element: the highest element whose text all reads
 *   in the other direction, or the parent of a shorter run.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-text-direction-marked';

const meta = {
  title: 'Text in the other reading direction is marked with dir',
  description:
    'Fails Hebrew, Arabic or other right-to-left script of two letters or more in a left-to-right context, and left-to-right text of three words or more in a right-to-left context, with no dir attribute around it, a <bdi> included; asks about a single letter and shorter left-to-right text.',
  i18n: {
    titleKey: 'textDirectionMarked_title',
    descriptionKey: 'textDirectionMarked_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'language', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['directionNotMarked', 'shortText', 'shortRun', 'bdiWithoutDir'],
  review: {
    shortText: {
      steps: [
        'Find the text the report names: a single letter, a mathematical symbol, or one or two words, written in a script that reads in the other direction from the text around them, such as a Hebrew letter in a French page or a Latin brand name in an Arabic page.',
        'Check whether they are words of a language read in that direction, not a symbol, a letter used as a label, or a name or acronym of the surrounding language.',
        'Inspect them: check whether an element around them has a dir attribute.'
      ],
      passWhen:
        'The characters are not text in a language read in the other direction, or an element around them has a dir attribute.',
      failWhen:
        'The characters are words of a language read in the other direction and no element around them has a dir attribute, which fails RGAA 8.10.1, whatever their length.'
    },
    shortRun: {
      steps: [
        'Find the element the report names, and in it the single letter, mathematical symbol, or one or two words written in a script that reads in the other direction from the text around them, such as a Hebrew letter in a French sentence or a Latin brand name in an Arabic one.',
        'Check whether they are words of a language read in that direction, not a symbol, a letter used as a label, or a name or acronym of the surrounding language.',
        'Inspect them: check whether an element around them has a dir attribute.'
      ],
      passWhen:
        'The characters are not text in a language read in the other direction, or an element around them has a dir attribute.',
      failWhen:
        'The characters are words of a language read in the other direction and no element around them has a dir attribute, which fails RGAA 8.10.1, whatever their length.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿\u{10800}-\u{10FFF}\u{1E800}-\u{1EFFF}]/u;
  const LETTER = /\p{L}/u;
  const SKIP = new Set([
    'script',
    'style',
    'template',
    'noscript',
    'code',
    'pre',
    'kbd',
    'samp',
    'var',
    'textarea',
    'svg',
    'math'
  ]);

  const INLINE = new Set([
    'a',
    'abbr',
    'b',
    'bdo',
    'cite',
    'dfn',
    'em',
    'i',
    'label',
    'mark',
    'q',
    's',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'time',
    'u'
  ]);
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const strong = (ch) => (RTL_CHAR.test(ch) ? 'rtl' : LETTER.test(ch) ? 'ltr' : '');

  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }

  // The element that sets the direction (dir ltr or rtl), and that direction;
  // 'auto' when a dir="auto" or a <bdi> comes first.
  function context(el) {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (dom.hasAttribute(a, 'dir')) {
        const v = String(dom.getAttribute(a, 'dir')).toLowerCase();
        if (v === 'ltr' || v === 'rtl') return { el: a, dir: v };
        if (v === 'auto') return { el: a, dir: 'auto' };
      }
      if (tagOf(a) === 'bdi') return { el: a, dir: 'bdi' };
    }
    return { el: null, dir: 'ltr' };
  }

  // Strong letters of `text` in each direction.
  function counts(text) {
    const c = { ltr: 0, rtl: 0 };
    for (const ch of String(text || '')) {
      const s = strong(ch);
      if (s) c[s] += 1;
    }
    return c;
  }

  // Arabic Mathematical Alphabetic Symbols: letters by Unicode, but math
  // symbols, not words.
  const MATH_ARABIC = /[\u{1EE00}-\u{1EEFF}]/u;
  // Letters of a right-to-left script in `run` (not marks, digits or
  // punctuation of those blocks, nor its mathematical symbols).
  const rtlLetters = (run) =>
    [...run].filter((ch) => RTL_CHAR.test(ch) && LETTER.test(ch) && !MATH_ARABIC.test(ch)).length;

  // Runs of `dir` letters, neutral characters between them allowed, broken
  // by a strong letter of the other direction.
  function runs(text, dir) {
    const out = [];
    let cur = '';
    let pending = '';
    for (const ch of String(text || '')) {
      const s = strong(ch);
      if (s === dir) {
        cur += pending + ch;
        pending = '';
      } else if (s) {
        if (cur) out.push(cur);
        cur = '';
        pending = '';
      } else if (cur) pending += ch;
    }
    if (cur) out.push(cur);
    return out;
  }
  const wordsOf = (run) => norm(run).split(' ').length;

  const body = dom.body(document);
  if (!body) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  let walker = null;
  try {
    walker = dom.createTreeWalker(document, body, 4, null);
  } catch {}

  const targets = new Map();
  for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
    const text = String(dom.nodeValue(n) || '');
    if (!LETTER.test(text)) continue;
    const p = dom.parentElement(n);
    if (!p) continue;
    let skip = false;
    for (let a = p; a && a !== body; a = dom.parentElement(a)) {
      if (SKIP.has(tagOf(a))) {
        skip = true;
        break;
      }
    }
    if (skip || !visible(p)) continue;
    const c = context(p);
    if (c.dir === 'auto') continue;
    const base = c.dir === 'bdi' ? context(dom.parentElement(c.el)).dir : c.dir;
    if (base !== 'ltr' && base !== 'rtl') continue;
    const other = base === 'ltr' ? 'rtl' : 'ltr';
    const own = counts(text);
    if (!own[other]) continue;

    // The highest element, below the context, whose text all reads in the
    // other direction, climbing through inline elements only.
    let target = p;
    const whole = (el) => {
      const k = counts(dom.textContent(el));
      return k[other] > 0 && k[base] === 0;
    };
    if (whole(p)) {
      for (
        let a = dom.parentElement(p);
        a && a !== c.el && a !== body && INLINE.has(tagOf(target));
        a = dom.parentElement(a)
      ) {
        if (!whole(a)) break;
        target = a;
      }
    }
    if (!targets.has(target)) {
      targets.set(target, {
        whole: whole(target),
        maxRun: 0,
        maxLetters: 0,
        bdi: c.dir === 'bdi',
        other
      });
    }
    const t = targets.get(target);
    for (const r of runs(text, other)) {
      t.maxRun = Math.max(t.maxRun, wordsOf(r));
      t.maxLetters = Math.max(t.maxLetters, rtlLetters(r));
    }
  }

  const fails = [];
  const cantTells = [];
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };
  const NAME = { ltr: 'left to right', rtl: 'right to left' };
  for (const [el, t] of targets) {
    const words = t.whole ? norm(dom.textContent(el)).split(' ').length : t.maxRun;
    // Right-to-left script: two letters or more in one run are words of a
    // language read right to left (« العربية » in a language menu), whatever
    // their length; a whole element is read as one run, so a word split
    // by markup counts whole. A single letter or a mathematical symbol may
    // not be a word, and is asked about. Left-to-right text in a
    // right-to-left context fails from three words: one or two may be a
    // brand name or an acronym.
    const letters = t.whole
      ? Math.max(0, ...runs(dom.textContent(el), 'rtl').map(rtlLetters))
      : t.maxLetters;
    const certain =
      t.other === 'rtl' ? Math.max(letters, t.maxLetters) >= 2 : t.maxRun >= 3 || words >= 3;
    const kind = certain ? (t.bdi ? 'bdi' : 'text') : t.whole ? 'short' : 'run';
    const params = {
      direction: t.other,
      text: norm(dom.textContent(el)).slice(0, 60)
    };
    if (certain) {
      fails.push(
        helpers.reportOccurrence(el, {
          summary:
            kind === 'bdi'
              ? `This text reads ${NAME[t.other]}, unlike its context, inside a <bdi> with no dir attribute.`
              : `This text reads ${NAME[t.other]}, unlike its context, and no element around it has a dir attribute.`,
          hint:
            kind === 'bdi'
              ? `Give the <bdi>, or an element around the text, dir="${t.other}": a <bdi> does not replace the dir attribute (RGAA 8.10.1).`
              : `Put the text in an element with dir="${t.other}" (RGAA 8.10.1).`,
          i18n: {
            summaryKey:
              kind === 'bdi'
                ? `textDirectionMarked_summary_fail_bdi_${t.other}`
                : `textDirectionMarked_summary_fail_${t.other}`,
            hintKey:
              kind === 'bdi'
                ? 'textDirectionMarked_hint_fail_bdi'
                : 'textDirectionMarked_hint_fail',
            params
          },
          data: {
            details: {
              reasonCode: kind === 'bdi' ? 'bdiWithoutDir' : 'directionNotMarked',
              ...params
            },
            visibilityFilter: VF
          }
        })
      );
    } else {
      cantTells.push(
        helpers.reportOccurrence(el, {
          summary: {
            short: `This short text reads ${NAME[t.other]}, unlike its context, with no dir attribute around it.`,
            run: `This text holds a short run that reads ${NAME[t.other]}, unlike its context, with no dir attribute around it.`
          }[kind],
          hint: `If the text reads in that direction, put it in an element with dir="${t.other}" (RGAA 8.10.1).`,
          i18n: {
            summaryKey: {
              short: `textDirectionMarked_summary_cantTell_short_${t.other}`,
              run: `textDirectionMarked_summary_cantTell_${t.other}`
            }[kind],
            hintKey: 'textDirectionMarked_hint_cantTell',
            params
          },
          uncertainty: {
            code: 'judgement-required',
            needed:
              'Whether the text is words of a language read in the other direction, which 8.10.1 asks to be in an element with dir.'
          },
          data: {
            details: {
              reasonCode: { short: 'shortText', run: 'shortRun' }[kind],
              ...params
            },
            visibilityFilter: VF
          }
        })
      );
    }
  }

  if (!fails.length && !cantTells.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'moderate');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
