/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-modal-tab-order
 * @atomic true
 * @summary While a modal dialog is open, focus should stay inside it
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to each dialog shown as modal by aria-modal="true" (an element
 *   with role dialog or alertdialog, or a <dialog>), rendered, and not
 *   opened with showModal(), which makes the rest of the page inert. A page
 *   with none is notApplicable.
 * @expectation
 *   The 12.8.1 methodology names this case: « l'ordre de tabulation dans
 *   une fenêtre modale ne doit considérer que les éléments … au sein de
 *   cette fenêtre ». aria-modal="true" tells assistive technologies that
 *   the rest of the page is out of reach, but does not stop the Tab key:
 *   elements outside the dialog that can take focus (not disabled, no
 *   tabindex="-1", not inert, not hidden) are reachable unless a script
 *   keeps focus inside the dialog, which only a person can check. The
 *   dialog is asked about (cantTell), naming how many such elements there
 *   are.
 * @implementation-notes
 * - Manual (cantTell): a script may trap focus, which the markup does not
 *   show.
 * - aria-hidden="true" on the rest of the page does not take it out of the
 *   tab order, so it does not count; inert and the hidden attribute do.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-modal-tab-order';

const meta = {
  title: 'Focus stays inside an open modal dialog',
  description:
    'Flags each open dialog marked aria-modal="true" while elements outside it can still take focus, for a person to check that focus stays inside it.',
  i18n: {
    titleKey: 'modalTabOrder_title',
    descriptionKey: 'modalTabOrder_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'keyboard', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['focusableOutsideModal'],
  review: {
    focusableOutsideModal: {
      steps: [
        'Open the dialog the report names, as a visitor would.',
        'Press Tab repeatedly until you have gone past its last element, watching where the focus goes.',
        'Press Shift+Tab repeatedly in the same way, going back past its first element.'
      ],
      passWhen: 'The focus stays inside the dialog while it is open.',
      failWhen:
        'The focus reaches elements outside the dialog while it is open, which fails RGAA 12.8.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const trim = (v) => String(v == null ? '' : v).trim();
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();

  function layout() {
    const html = dom.documentElement(document);
    try {
      return !!(html && (dom.getClientRects(html) || []).length);
    } catch {
      return false;
    }
  }
  const hasLayout = layout();

  function rendered(el) {
    if (!hasLayout) return true;
    try {
      return (dom.getClientRects(el) || []).length > 0;
    } catch {
      return true;
    }
  }

  function shownModally(el) {
    try {
      return dom.matches(el, ':modal');
    } catch {
      return false;
    }
  }

  // Inert, hidden or disabled: out of the tab order.
  function outOfTabOrder(el) {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (dom.hasAttribute(a, 'inert') || dom.hasAttribute(a, 'hidden')) return true;
    }
    try {
      if (dom.matches(el, ':disabled')) return true;
    } catch {}
    return !rendered(el);
  }

  const FOCUSABLE =
    'a[href], area[href], button, input:not([type="hidden" i]), select, textarea, iframe, [tabindex], [contenteditable]:not([contenteditable="false" i]), summary';

  // Every element of the document, not only those the scan keeps: while a
  // modal is open, the scan sees the dialog alone.
  const all = [...dom.querySelectorAll(document, '[aria-modal]')];
  const dialogs = all.filter((el) => {
    if (trim(dom.getAttribute(el, 'aria-modal')).toLowerCase() !== 'true') return false;
    const role = helpers.aria.getExplicitRole(el);
    if (!(role === 'dialog' || role === 'alertdialog' || tagOf(el) === 'dialog')) return false;
    if (tagOf(el) === 'dialog' && !dom.hasAttribute(el, 'open')) return false;
    return !shownModally(el) && !outOfTabOrder(el);
  });

  const occurrences = [];
  for (const dialog of dialogs) {
    const outside = [...dom.querySelectorAll(document, FOCUSABLE)].filter((el) => {
      if (dom.contains(dialog, el)) return false;
      if (trim(dom.getAttribute(el, 'tabindex')) === '-1') return false;
      return !outOfTabOrder(el);
    });
    if (!outside.length) continue;
    const count = outside.length;
    occurrences.push(
      helpers.reportOccurrence(dialog, {
        summary: `This dialog is marked aria-modal="true", but ${count} element(s) outside it can still take focus with the Tab key.`,
        hint: 'Check that focus stays inside the dialog while it is open, for instance by making the rest of the page inert or by opening a <dialog> with showModal() (RGAA 12.8.1).',
        i18n: {
          summaryKey: 'modalTabOrder_summary_cantTell',
          hintKey: 'modalTabOrder_hint_cantTell',
          params: { count }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether a script keeps focus inside the dialog while it is open.'
        },
        data: {
          details: { reasonCode: 'focusableOutsideModal', count },
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
