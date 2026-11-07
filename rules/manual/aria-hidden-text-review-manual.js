/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-aria-hidden-text-review
 * @atomic true
 * @summary Visible text hidden from assistive technologies is meant to be ignored
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to each outermost element with aria-hidden="true" that holds
 *   visible text of two words or more (letters, not only signs or icon
 *   glyphs). The whole page hidden (on <html> or <body>) is left to
 *   aria-hidden-body. A page with none is notApplicable.
 * @expectation
 *   RGAA 10.8.1: each hidden content « a vocation à être ignoré par les
 *   technologies d'assistance », or is made available to them by a user
 *   action. Its technical note: a content with aria-hidden="true" « ne
 *   sera donc plus vocalisable, mais restera visible ». Visible text a
 *   sighted user reads but a screen reader user never hears is fine when
 *   it repeats text given to them otherwise (a screen-reader-only copy, a
 *   label), and fails 10.8.1 when it is the only place the information
 *   is. Only a person can tell, so each such element is asked about
 *   (visibleTextHidden).
 * @implementation-notes
 * - Manual (cantTell).
 * - Focusable content inside aria-hidden="true" is aria-hidden-focus's
 *   matter, which fails it under 10.8.1.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-aria-hidden-text-review';

const meta = {
  title: 'Visible text hidden from assistive technologies is meant to be ignored',
  description:
    'Flags each element with aria-hidden="true" that holds visible text of two words or more, for a person to check that the text is given to assistive technologies otherwise or is meant to be ignored.',
  i18n: {
    titleKey: 'ariaHiddenTextReview_title',
    descriptionKey: 'ariaHiddenTextReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'aria', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['visibleTextHidden'],
  review: {
    visibleTextHidden: {
      steps: [
        'Find the element the report names: its text shows on screen, but aria-hidden="true" hides it from screen readers.',
        'Read the text, and decide whether it tells anything a visitor needs.',
        'Listen to this part of the page with a screen reader, and check whether the same information is read another way.'
      ],
      passWhen:
        'The text is meant to be ignored, or the screen reader gives the same information another way.',
      failWhen:
        'The text holds information that a screen reader user gets nowhere else, which fails RGAA 10.8.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const isHidden = (el) => norm(dom.getAttribute(el, 'aria-hidden')).toLowerCase() === 'true';

  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }

  const SKIP = new Set(['script', 'style', 'template', 'noscript', 'svg', 'math']);
  function visibleText(root) {
    const parts = [];
    let walker = null;
    try {
      walker = dom.createTreeWalker(dom.ownerDocument(root), root, 4, null);
    } catch {}
    for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
      const t = norm(dom.nodeValue(n));
      if (!t) continue;
      const p = dom.parentElement(n);
      let skip = false;
      for (let a = p; a && a !== dom.parentElement(root); a = dom.parentElement(a)) {
        if (SKIP.has(tagOf(a))) skip = true;
      }
      if (skip || !visible(p)) continue;
      parts.push(t);
    }
    return norm(parts.join(' '));
  }

  const nodes = helpers.queryAll
    ? helpers.queryAll('[aria-hidden]')
    : [...dom.querySelectorAll(ctx.document, '[aria-hidden]')];

  const occurrences = [];
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute') || !isHidden(el)) continue;
    if (['html', 'body'].includes(tagOf(el))) continue;
    let outer = true;
    for (let a = dom.parentElement(el); a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (isHidden(a)) outer = false;
    }
    if (!outer || !visible(el)) continue;
    const text = visibleText(el);
    const words = text.split(' ').filter((w) => /\p{L}{2,}/u.test(w));
    if (words.length < 2) continue;
    const excerpt = text.slice(0, 80);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This visible text ("${excerpt}") is hidden from assistive technologies by aria-hidden="true".`,
        hint: 'Check that the text is given to assistive technologies another way, or carries no information; otherwise remove aria-hidden (RGAA 10.8.1).',
        i18n: {
          summaryKey: 'ariaHiddenTextReview_summary_cantTell',
          hintKey: 'ariaHiddenTextReview_hint_cantTell',
          params: { text: excerpt }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether the hidden text is meant to be ignored, or given to assistive technologies otherwise.'
        },
        data: {
          details: { reasonCode: 'visibleTextHidden', text: excerpt },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
