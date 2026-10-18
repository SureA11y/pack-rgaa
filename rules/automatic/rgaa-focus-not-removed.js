/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-focus-not-removed
 * @atomic true
 * @summary A script does not remove focus from an element that receives it
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements with an inline onfocus or onfocusin handler that
 *   calls blur() or moves focus to another element. A page with none is
 *   notApplicable.
 * @expectation
 *   RGAA 7.3.2: « Un script ne doit pas supprimer le focus d'un élément qui
 *   le reçoit. »
 *   - A handler that blurs the element (this.blur(), blur(),
 *     event.target.blur(), document.activeElement.blur()) fails
 *     (blurOnFocus): the element loses focus as it gets it. The particular
 *     case of 7.3, a feature with no universal equivalent such as freehand
 *     drawing, does not cover removing focus.
 *   - A handler that gives focus to another element is asked about
 *     (focusMovedOnFocus): a widget may pass focus on to its active part on
 *     purpose, which only a person can judge.
 * @implementation-notes
 * - Handlers attached from script files (addEventListener) are not seen.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-focus-not-removed';

const meta = {
  title: 'Scripts do not remove focus from an element that receives it',
  description:
    'Fails an element whose inline onfocus handler blurs it; asks about one whose handler moves focus to another element.',
  i18n: {
    titleKey: 'focusNotRemoved_title',
    descriptionKey: 'focusNotRemoved_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'keyboard', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const BLUR =
    /(^|[^\w$.])(?:(?:this|event\.target|e\.target|evt\.target|document\.activeElement)\s*\.\s*)?blur\s*\(\s*\)/;
  const FOCUS_ELSEWHERE = /\.\s*focus\s*\(/;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[onfocus], [onfocusin]')
    : helpers.queryAll('[onfocus], [onfocusin]');

  const fails = [];
  const cantTells = [];
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    for (const attribute of ['onfocus', 'onfocusin']) {
      const code = String(dom.getAttribute(el, attribute) || '').trim();
      if (!code) continue;
      const params = { attribute, code: code.slice(0, 80) };
      if (BLUR.test(code)) {
        fails.push(
          helpers.reportOccurrence(el, {
            summary: `This element's ${attribute} handler ("${params.code}") removes focus from it as soon as it receives it.`,
            hint: 'Remove the blur() call: a keyboard user must be able to reach and use the element, and see where focus is (RGAA 7.3.2).',
            i18n: {
              summaryKey: 'focusNotRemoved_summary_fail',
              hintKey: 'focusNotRemoved_hint_fail',
              params
            },
            data: { details: { reasonCode: 'blurOnFocus', ...params }, visibilityFilter: VF }
          })
        );
        break;
      }
      if (FOCUS_ELSEWHERE.test(code)) {
        cantTells.push(
          helpers.reportOccurrence(el, {
            summary: `This element's ${attribute} handler ("${params.code}") moves focus to another element when it receives it.`,
            hint: 'Check that the element keeps focus, or that focus moves on purpose to a part of the same component, such as its active item (RGAA 7.3.2).',
            i18n: {
              summaryKey: 'focusNotRemoved_summary_cantTell',
              hintKey: 'focusNotRemoved_hint_cantTell',
              params
            },
            uncertainty: {
              code: 'judgement-required',
              needed:
                'Whether moving focus away removes it from the element a user wanted to reach.'
            },
            data: {
              details: { reasonCode: 'focusMovedOnFocus', ...params },
              visibilityFilter: VF
            }
          })
        );
        break;
      }
    }
  }

  if (!fails.length && !cantTells.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
