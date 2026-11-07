/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-field-hidden-label-review
 * @atomic true
 * @summary A field whose <label> is visually hidden is understandable from what is on screen
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible form fields (<input> other than hidden and the
 *   button types, <select>, <textarea>) whose <label> elements all hold
 *   text but are visually hidden (clipped away, 1 by 1 px with their
 *   overflow hidden, and the like), and that have no aria-labelledby
 *   pointing to visible text. A page with none is notApplicable.
 * @expectation
 *   RGAA 11.1.3 covers a field « ayant une étiquette dont le contenu n'est
 *   pas visible » and asks for one of: a title that makes the expected
 *   input understandable, a passage next to the field that becomes visible
 *   on focus, or a visible passage next to it. Whether the text on screen
 *   (a button beside a search field, a placeholder, an icon) does that is
 *   for a person: the field is asked about (hiddenLabel), naming whether it
 *   has a title.
 * @implementation-notes
 * - Manual (cantTell).
 * - Fields named by aria-label, title or a placeholder alone are asked
 *   about by form-control-programmatic-label-quality.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-field-hidden-label-review';

const meta = {
  title: 'A field with a visually hidden label is understandable from the screen',
  description:
    'Flags each form field whose <label> is visually hidden, for a person to check that a title or visible text next to it makes the expected input understandable.',
  i18n: {
    titleKey: 'fieldHiddenLabelReview_title',
    descriptionKey: 'fieldHiddenLabelReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['hiddenLabel'],
  review: {
    hiddenLabel: {
      steps: [
        'Find the field the report names: its <label> exists in the code, but is not shown on screen.',
        'Look at what is shown next to the field: a button beside it, an icon, a text. Press Tab to reach the field, and see whether a text appears.',
        'Inspect the field for a title attribute.',
        'Decide whether you can tell what to enter from these alone.'
      ],
      passWhen:
        'A title, or a text next to the field that is visible or shows on focus, makes it clear what to enter.',
      failWhen: 'Nothing on screen and no title says what to enter, which fails RGAA 11.1.3.'
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

  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }
  function offScreen(el) {
    if (typeof helpers.isVisuallyHidden !== 'function') return false;
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      try {
        if (helpers.isVisuallyHidden(a)) return true;
      } catch {}
    }
    return false;
  }
  const seen = (el) => visible(el) && !offScreen(el);

  function labelsOf(el) {
    try {
      return helpers.getAssociatedLabelElements ? helpers.getAssociatedLabelElements(el) || [] : [];
    } catch {
      return [];
    }
  }
  function refsOf(el) {
    const v = norm(dom.getAttribute(el, 'aria-labelledby'));
    if (!v) return [];
    return v
      .split(' ')
      .map((ref) => {
        try {
          return helpers.getElementByIdInTree
            ? helpers.getElementByIdInTree(el, ref)
            : dom.getElementById(dom.getRootNode(el), ref);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  const SELECTOR =
    'input:not([type="hidden" i]):not([type="submit" i]):not([type="reset" i]):not([type="button" i]):not([type="image" i]), select, textarea';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(SELECTOR)
    : helpers.queryAll(SELECTOR);

  const occurrences = [];
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute') || !seen(el)) continue;
    const labels = labelsOf(el).filter((l) => norm(dom.textContent(l)));
    if (!labels.length || labels.some(seen)) continue;
    if (refsOf(el).some((r) => seen(r) && norm(dom.textContent(r)))) continue;
    const label = norm(dom.textContent(labels[0])).slice(0, 80);
    const title = !!norm(dom.getAttribute(el, 'title'));
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This field's label ("${label}") is visually hidden.`,
        hint: 'Check that a title, or text next to the field that is visible or becomes visible on focus, makes the expected input understandable (RGAA 11.1.3).',
        i18n: {
          summaryKey: 'fieldHiddenLabelReview_summary_cantTell',
          hintKey: 'fieldHiddenLabelReview_hint_cantTell',
          params: { label }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether what is on screen makes the expected input understandable.'
        },
        data: {
          details: { reasonCode: 'hiddenLabel', label, title },
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
