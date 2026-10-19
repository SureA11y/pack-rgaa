/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-same-name-checkboxes-review
 * @atomic true
 * @summary Sets of checkboxes sharing a name, and sets of role="radio", are grouped if needed
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to sets of three or more visible <input type="checkbox"> with
 *   the same name in the same form (or outside any form), and to sets of
 *   two or more visible elements with role="radio" (native radio buttons
 *   left out) that share a parent element. A page where every such set is
 *   grouped, or with none, is notApplicable.
 * @expectation
 *   RGAA 11.5.1: « Les champs de même nature sont regroupés dans une balise
 *   <fieldset> », « dans une balise possédant un attribut WAI-ARIA
 *   role="group" », and, for radios (role="radio" included), « dans une
 *   balise possédant un attribut WAI-ARIA role="radiogroup" ou
 *   role="group" », « si nécessaire ». The glossary « Champs de même
 *   nature » names « un ensemble de boutons radio ou de cases à cocher qui
 *   se rapportent à une question » and adds that they « doivent être
 *   regroupés lorsque les intitulés de label ne sont pas suffisants ». A
 *   set with no common group is asked about (ungroupedCheckboxes,
 *   ungroupedRadios), since only a person can tell whether its labels are
 *   enough.
 * @implementation-notes
 * - Manual (cantTell).
 * - Native radio buttons are left to rgaa-radio-group-present.
 * - Two checkboxes sharing a name are not asked about: a pair is often a
 *   field and its hidden twin, or two independent options.
 * - One occurrence per set, reported on its first field.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-same-name-checkboxes-review';

const meta = {
  title: 'Sets of checkboxes and custom radio buttons are grouped if needed',
  description:
    'Flags three or more checkboxes sharing a name, or two or more role="radio" elements in one parent, that are not inside a fieldset or a role="group" (or, for radios, role="radiogroup"), for a person to decide whether they need grouping.',
  i18n: {
    titleKey: 'sameNameCheckboxesReview_title',
    descriptionKey: 'sameNameCheckboxesReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const GROUP = 'fieldset, [role~="group" i], [role~="radiogroup" i]';

  function explicitRole(el) {
    try {
      return el && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el) || ''
        : '';
    } catch {
      return '';
    }
  }
  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }
  const query = (sel) =>
    helpers.queryAllSmart ? helpers.queryAllSmart(sel) : helpers.queryAll(sel);
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();

  // A fieldset counts unless it was given another role; role="radiogroup"
  // counts only for radios (11.5.1 names it for them alone).
  function isGroup(el, radios) {
    const role = explicitRole(el);
    if (tagOf(el) === 'fieldset' && (!role || role === 'group' || role === 'radiogroup')) {
      return true;
    }
    return role === 'group' || (radios && role === 'radiogroup');
  }

  function hasCommonGroup(set, radios) {
    const parentGroup = (el) =>
      dom.parentElement(el) ? dom.closest(dom.parentElement(el), GROUP) : null;
    for (let g = parentGroup(set[0]); g; g = parentGroup(g)) {
      if (isGroup(g, radios) && set.every((f) => dom.contains(g, f))) return true;
    }
    return false;
  }

  const occurrences = [];
  function ask(set, kind, params) {
    const checkboxes = kind === 'ungroupedCheckboxes';
    occurrences.push(
      helpers.reportOccurrence(set[0], {
        summary: checkboxes
          ? `The ${params.count} checkboxes named "${params.name}" are not grouped in a fieldset or role="group".`
          : `These ${params.count} role="radio" elements are not grouped in a fieldset, role="group" or role="radiogroup".`,
        hint: checkboxes
          ? 'If their labels do not say which question they answer, group them in a <fieldset> with a <legend>, or in an element with role="group" and a name (RGAA 11.5.1).'
          : 'If their labels do not say which question they answer, group them in an element with role="radiogroup" (or a <fieldset> or role="group") and a name (RGAA 11.5.1).',
        i18n: {
          summaryKey: `sameNameCheckboxesReview_summary_cantTell_${kind}`,
          hintKey: `sameNameCheckboxesReview_hint_cantTell_${kind}`,
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the labels alone tell that the fields belong to one set.'
        },
        data: {
          details: { reasonCode: kind, ...params, count: set.length },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  // Checkboxes, keyed by form owner and name, in document order.
  const sets = new Map();
  const formKeys = new Map();
  for (const box of query('input[type="checkbox" i][name]')) {
    if (!box || !dom.get(box, 'getAttribute') || !visible(box)) continue;
    const name = String(dom.getAttribute(box, 'name') || '');
    if (!name.trim()) continue;
    const form = dom.get(box, 'form') || null;
    if (!formKeys.has(form)) formKeys.set(form, formKeys.size);
    const key = `${formKeys.get(form)}|${name}`;
    if (!sets.has(key)) sets.set(key, []);
    sets.get(key).push(box);
  }
  for (const set of sets.values()) {
    if (set.length < 3 || hasCommonGroup(set, false)) continue;
    const name = String(dom.getAttribute(set[0], 'name'));
    ask(set, 'ungroupedCheckboxes', { count: String(set.length), name });
  }

  // role="radio" elements, keyed by parent element. Native radio buttons are
  // rgaa-radio-group-present's.
  const byParent = new Map();
  for (const el of query('[role~="radio" i]')) {
    if (!el || explicitRole(el) !== 'radio') continue;
    if (tagOf(el) === 'input') continue;
    if (!visible(el)) continue;
    const parent = dom.parentElement(el);
    if (!parent) continue;
    if (!byParent.has(parent)) byParent.set(parent, []);
    byParent.get(parent).push(el);
  }
  for (const set of byParent.values()) {
    if (set.length < 2 || hasCommonGroup(set, true)) continue;
    ask(set, 'ungroupedRadios', { count: String(set.length) });
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
