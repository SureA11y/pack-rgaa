/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-context-change-review
 * @atomic true
 * @summary A change of context started from a field is announced or comes from a button or link
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to form fields (<select>, <input>, <textarea>) whose inline
 *   onchange, oninput or onblur handler submits a form, loads another
 *   address or opens a window (submit(), location, window.open). A page
 *   with none is notApplicable.
 * @expectation
 *   RGAA 7.4.1: a script that starts a change of context passes when the
 *   user is warned by a text of what it does before it happens, or when a
 *   button or a link starts it. A field that navigates or submits as soon
 *   as its value changes is neither a button nor a link, so it passes only
 *   with that warning, which a person checks (fieldChangesContext).
 * @implementation-notes
 * - Manual (cantTell): the warning can be anywhere before the field.
 * - Handlers attached from script files are not seen.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-context-change-review';

const meta = {
  title: 'A change of context from a field is announced first',
  description:
    'Flags each form field whose inline handler submits a form or loads another page when its value changes, for a person to check that a text warns the user first.',
  i18n: {
    titleKey: 'contextChangeReview_title',
    descriptionKey: 'contextChangeReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'scripts', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const CHANGE = /\.\s*submit\s*\(|\blocation\b|window\.open\s*\(|\.href\s*=/;
  const SELECTOR =
    'select[onchange], select[oninput], select[onblur], input[onchange], input[oninput], input[onblur], textarea[onchange], textarea[oninput], textarea[onblur]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(SELECTOR)
    : helpers.queryAll(SELECTOR);

  const occurrences = [];
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const attribute = ['onchange', 'oninput', 'onblur'].find((a) =>
      CHANGE.test(String(dom.getAttribute(el, a) || ''))
    );
    if (!attribute) continue;
    const code = String(dom.getAttribute(el, attribute)).trim().slice(0, 80);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This field's ${attribute} handler ("${code}") changes the context when its value changes, without a button or a link.`,
        hint: 'Check that a text before the field warns of what happens, or start the change with an explicit button (RGAA 7.4.1).',
        i18n: {
          summaryKey: 'contextChangeReview_summary_cantTell',
          hintKey: 'contextChangeReview_hint_cantTell',
          params: { attribute, code }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether a text warns the user of the change of context before it happens.'
        },
        data: {
          details: { reasonCode: 'fieldChangesContext', attribute, code },
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
