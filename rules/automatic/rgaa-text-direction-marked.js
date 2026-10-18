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
 *   - It fails (directionNotMarked) when an element's whole text reads in
 *     the other direction, or when a run of three words or more does,
 *     with no dir between it and its context. In a right-to-left context,
 *     a whole element of one or two left-to-right words (a brand name, a
 *     link to a site) is asked about instead.
 *   - A shorter run inside other text, such as a word quoted in a
 *     sentence, is asked about (cantTell): it is a change of direction,
 *     but whether it is a passage or a name is for a person. So is text in
 *     a <bdi> with no dir, which browsers isolate but RGAA does not name.
 * @implementation-notes
 * - One occurrence per element: the highest element whose text all reads
 *   in the other direction, or the parent of a shorter run.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-text-direction-marked';

const meta = {
  title: 'Text in the other reading direction is marked with dir',
  description:
    'Fails text that reads right to left in a left-to-right context, or the reverse, with no dir attribute around it; asks about short runs inside other text.',
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
  coverage: {}
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

  // Runs of `dir` letters, neutral characters between them allowed, broken
  // by a strong letter of the other direction; their word counts.
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
    return out.map((r) => norm(r).split(' ').length);
  }

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
      targets.set(target, { whole: whole(target), maxRun: 0, bdi: c.dir === 'bdi', other });
    }
    const t = targets.get(target);
    t.maxRun = Math.max(t.maxRun, ...runs(text, other));
  }

  const fails = [];
  const cantTells = [];
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };
  const NAME = { ltr: 'left to right', rtl: 'right to left' };
  for (const [el, t] of targets) {
    const words = t.whole ? norm(dom.textContent(el)).split(' ').length : t.maxRun;
    const certain = !t.bdi && (t.maxRun >= 3 || words >= 3 || (t.whole && t.other === 'rtl'));
    const params = {
      direction: t.other,
      text: norm(dom.textContent(el)).slice(0, 60)
    };
    if (certain) {
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This text reads ${NAME[t.other]}, unlike its context, and no element around it has a dir attribute.`,
          hint: `Put the text in an element with dir="${t.other}" (RGAA 8.10.1).`,
          i18n: {
            summaryKey: `textDirectionMarked_summary_fail_${t.other}`,
            hintKey: 'textDirectionMarked_hint_fail',
            params
          },
          data: { details: { reasonCode: 'directionNotMarked', ...params }, visibilityFilter: VF }
        })
      );
    } else {
      cantTells.push(
        helpers.reportOccurrence(el, {
          summary: t.bdi
            ? `This text reads ${NAME[t.other]}, unlike its context, inside a <bdi> with no dir attribute.`
            : `This text holds a short run that reads ${NAME[t.other]}, unlike its context, with no dir attribute around it.`,
          hint: `If the run is a passage of text in that direction, put it in an element with dir="${t.other}" (RGAA 8.10.1).`,
          i18n: {
            summaryKey: t.bdi
              ? `textDirectionMarked_summary_cantTell_bdi_${t.other}`
              : `textDirectionMarked_summary_cantTell_${t.other}`,
            hintKey: 'textDirectionMarked_hint_cantTell',
            params
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the run is a passage that reads in the other direction.'
          },
          data: {
            details: { reasonCode: t.bdi ? 'bdiWithoutDir' : 'shortRun', ...params },
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
