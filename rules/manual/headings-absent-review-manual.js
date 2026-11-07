/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-headings-absent-review
 * @atomic true
 * @summary A page with text but no heading is reviewed for passages that act as headings
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a page with no heading at all (no <h1>-<h6> and no
 *   role="heading", hidden ones included) whose visible text holds 30
 *   words or more. A page with a heading, or with less text, is
 *   notApplicable, and so is a scan of part of a page (a contextSelector or
 *   a fragment), which cannot see the whole page.
 * @expectation
 *   RGAA 9.1.3: « chaque passage de texte constituant un titre est-il
 *   structuré à l'aide d'une balise <hx> » or role="heading" with
 *   aria-level. A page of some length with no heading at all usually has
 *   passages that act as headings, but a short page may have none: the
 *   page is asked about (noHeading), for a person to look for them.
 * @implementation-notes
 * - Manual (cantTell): whether a passage acts as a heading is a person's
 *   call.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-headings-absent-review';

const meta = {
  title: 'A page with text but no heading is reviewed',
  description:
    'Flags a page with 30 words or more of text and no heading at all, for a person to check whether some passages act as headings and need <hx> markup.',
  i18n: {
    titleKey: 'headingsAbsentReview_title',
    descriptionKey: 'headingsAbsentReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'headings', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['noHeading'],
  review: {
    noHeading: {
      steps: [
        'This finding is about the page: it has no heading in its code. Read it on screen.',
        'Look for text that acts as a heading: a title above a section, or a bold or larger line opening a block.',
        'Inspect that text: it is not an <h1> to <h6>, nor role="heading" with aria-level.'
      ],
      passWhen: 'No passage of the page acts as a heading.',
      failWhen: 'A passage acts as a heading with no heading markup, which fails RGAA 9.1.3.'
    }
  }
};

// A document shown in a frame is no web page of its own (RGAA's « page web »),
// and a scan of part of a page (a contextSelector or a fragment) cannot say
// what the whole page holds.
function applicability(ctx) {
  const { helpers } = ctx;
  if (helpers.isTopLevelDocument && !helpers.isTopLevelDocument()) return false;
  return helpers.isWholeDocumentScope ? helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const na = { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };

  const body = dom.body(document);
  if (!body) return na;
  const headings = [
    ...dom.querySelectorAll(document, 'h1, h2, h3, h4, h5, h6, [role~="heading" i]')
  ].filter((el) => {
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (/^h[1-6]$/.test(tag)) return true;
    try {
      return helpers.aria.getExplicitRole(el) === 'heading';
    } catch {
      return false;
    }
  });
  if (headings.length) return na;

  // Visible words of the page.
  const SKIP = new Set(['script', 'style', 'template', 'noscript']);
  const visible = (el) => {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  };
  let walker = null;
  try {
    walker = dom.createTreeWalker(document, body, 4, null);
  } catch {}
  let words = 0;
  for (let n = walker && walker.nextNode(); n && words < 30; n = walker.nextNode()) {
    const t = String(dom.nodeValue(n) || '').trim();
    if (!t) continue;
    const p = dom.parentElement(n);
    if (!p || SKIP.has(String(dom.localName(p) || '').toLowerCase()) || !visible(p)) continue;
    words += t.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  }
  if (words < 30) return na;

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [
      helpers.reportOccurrence(body, {
        summary: 'This page has text but no heading at all.',
        hint: 'Check whether some passages act as headings (a title above a section, a bold line opening a block); mark each with <h1>-<h6> (RGAA 9.1.3).',
        i18n: {
          summaryKey: 'headingsAbsentReview_summary_cantTell',
          hintKey: 'headingsAbsentReview_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether some passages of the page act as headings.'
        },
        data: {
          details: { reasonCode: 'noHeading' },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    ]
  };
}

module.exports = { id, meta, runInPage, applicability };
