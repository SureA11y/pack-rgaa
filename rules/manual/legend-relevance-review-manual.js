/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-legend-relevance-review
 * @atomic true
 * @summary The legend of a group of form fields is relevant
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible <fieldset> elements with a <legend> child holding
 *   text, and to visible elements with role="group" or role="radiogroup"
 *   named by aria-label or by aria-labelledby passages holding text, that
 *   contain at least one form field (input other than hidden, select,
 *   textarea, or an element with a form field role). A page with none is
 *   notApplicable.
 * @expectation
 *   RGAA 11.7.1: « Chaque légende associée à un regroupement de champs de
 *   même nature est-elle pertinente ? ». The glossary « Légende » names
 *   the <legend> of a <fieldset>, and the passage linked by
 *   aria-labelledby or the aria-label of a role="group". Relevance is for
 *   a person, so each legend is asked about (legendRelevance), quoted.
 * @implementation-notes
 * - Manual (cantTell).
 * - Groups with no legend are rgaa-field-group-legend's (11.6.1).
 * - A <fieldset> that also carries role="group" or role="radiogroup" is
 *   quoted by its <legend> when it has one.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-legend-relevance-review';

const meta = {
  title: 'Legends of groups of form fields are relevant',
  description:
    'Flags each <legend> of a fieldset, and each aria-label or aria-labelledby of a role="group" or role="radiogroup", holding form fields, for a person to check that it says what the fields have in common.',
  i18n: {
    titleKey: 'legendRelevanceReview_title',
    descriptionKey: 'legendRelevanceReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  reasonCodes: ['legendRelevance'],
  review: {
    legendRelevance: {
      steps: [
        'Find the group of fields the report names, and read its legend in the report.',
        'Read the labels of the fields of the group.',
        'Decide whether the legend says what they have in common, such as the question a set of choices answers, or the person an address belongs to.'
      ],
      passWhen: 'The legend says what the fields of the group have in common.',
      failWhen: 'The legend does not say what the fields have in common, which fails RGAA 11.7.1.'
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
  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }
  function explicitRole(el) {
    try {
      return el && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el) || ''
        : '';
    } catch {
      return '';
    }
  }
  const query = (sel) =>
    helpers.queryAllSmart ? helpers.queryAllSmart(sel) : helpers.queryAll(sel);

  const NATIVE_FIELDS = 'input:not([type="hidden" i]), select, textarea';
  const FIELD_ROLES = [
    'checkbox',
    'radio',
    'textbox',
    'combobox',
    'listbox',
    'spinbutton',
    'slider',
    'switch',
    'searchbox'
  ];
  const ROLE_FIELDS = FIELD_ROLES.map((r) => `[role~="${r}" i]`).join(', ');

  function hasField(group) {
    if (dom.querySelector(group, NATIVE_FIELDS)) return true;
    return [...dom.querySelectorAll(group, ROLE_FIELDS)].some((el) =>
      FIELD_ROLES.includes(explicitRole(el))
    );
  }
  function labelledbyText(el) {
    return norm(
      norm(dom.getAttribute(el, 'aria-labelledby'))
        .split(' ')
        .filter(Boolean)
        .map((ref) => {
          try {
            const t = helpers.getElementByIdInTree
              ? helpers.getElementByIdInTree(el, ref)
              : dom.getElementById(dom.getRootNode(el), ref);
            return t ? norm(dom.textContent(t)) : '';
          } catch {
            return '';
          }
        })
        .join(' ')
    );
  }

  const occurrences = [];
  for (const group of query('fieldset, [role]')) {
    if (!group || !dom.get(group, 'getAttribute')) continue;
    const isFieldset = tagOf(group) === 'fieldset';
    const role = explicitRole(group);
    const isAriaGroup = role === 'group' || role === 'radiogroup';
    if (isFieldset ? role && !isAriaGroup : !isAriaGroup) continue;
    if (!visible(group) || !hasField(group)) continue;

    let legend = '';
    let source = '';
    if (isFieldset) {
      const el = [...dom.querySelectorAll(group, ':scope > *')].find((c) => tagOf(c) === 'legend');
      legend = el ? norm(dom.textContent(el)) : '';
      source = 'legend';
    }
    if (!legend && isAriaGroup) {
      legend = labelledbyText(group);
      source = 'aria-labelledby';
      if (!legend) {
        legend = norm(dom.getAttribute(group, 'aria-label'));
        source = 'aria-label';
      }
    }
    if (!legend) continue;

    const quoted = legend.slice(0, 80);
    const element = isFieldset ? 'fieldset' : `role="${role}"`;
    occurrences.push(
      helpers.reportOccurrence(group, {
        summary: `This group of form fields has the legend "${quoted}".`,
        hint: 'Check that the legend says what the fields of the group have in common, such as the question a set of choices answers or the person an address belongs to (RGAA 11.7.1).',
        i18n: {
          summaryKey: 'legendRelevanceReview_summary_cantTell',
          hintKey: 'legendRelevanceReview_hint_cantTell',
          params: { legend: quoted }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the legend is relevant to the fields it groups.'
        },
        data: {
          details: { reasonCode: 'legendRelevance', legend: quoted, element, source },
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
