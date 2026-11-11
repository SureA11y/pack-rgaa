/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-field-group-legend
 * @atomic true
 * @summary A group of form fields should have a legend
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <fieldset> elements and elements with role="group" or
 *   role="radiogroup" that contain at least one form field (input other
 *   than hidden, select, textarea, or an element with a form field role).
 *   A page with none is notApplicable. When every group has a legend (or,
 *   for an ARIA group, an aria-label or aria-labelledby), the rule passes:
 *   11.6.1 asks that one exists, and whether it is relevant is 11.7's
 *   question.
 * @expectation
 *   RGAA 11.6.1 step 2: a <fieldset> has a <legend> child with text; an
 *   element with role="group" or role="radiogroup" has an aria-label or an
 *   aria-labelledby that resolves to text. A fieldset that itself carries
 *   role="group" or role="radiogroup" may use either. aria-label on a plain
 *   fieldset, and title on a group, do not count: step 2 names only those
 *   mechanisms. A group without one is flagged for a person to decide
 *   whether it groups fields of the same kind, which is when RGAA 11.6.1
 *   requires a legend, and, if so, whether every field instead carries a
 *   title, aria-label, aria-labelledby or aria-describedby that names the
 *   group (step 3).
 * @implementation-notes
 * - Manual (cantTell): a fieldset can group unrelated fields for layout,
 *   and a toolbar can use role="group". Only a person can tell.
 * - Step 3 is not decided here: whether a field's title or aria-label
 *   "permet de déterminer l'appartenance du champ au groupement" is a
 *   judgment, and most fields carry an aria-label or title for their own
 *   name. So a group whose fields all carry one of those attributes is
 *   still asked about.
 * - Opt-in (tag `rgaa`): WCAG does not require a legend on every group.
 */

const id = 'rgaa-field-group-legend';

const meta = {
  title: 'Groups of form fields have a legend',
  description:
    'Flags a <fieldset> without a legend, or a role="group" or role="radiogroup" without aria-label or aria-labelledby, holding form fields, for a person to decide whether it groups fields of the same kind.',
  i18n: {
    titleKey: 'fieldGroupLegend_title',
    descriptionKey: 'fieldGroupLegend_description'
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
  reasonCodes: ['groupWithoutLegend'],
  review: {
    groupWithoutLegend: {
      steps: [
        'Find the group the report names (a <fieldset>, or an element with role="group" or role="radiogroup") and the fields in it.',
        'Decide whether it gathers fields of the same kind that need a shared heading to be understood, such as the parts of an address or a set of radio buttons.',
        'If it does, look for its legend: a <legend> in a fieldset, or an aria-label or aria-labelledby on an ARIA group.',
        'Without one, check whether each field has a title, aria-label, aria-labelledby or aria-describedby that says which group it belongs to.'
      ],
      passWhen:
        'The group only lays out unrelated fields, or each field says which group it belongs to.',
      failWhen:
        'Fields of the same kind are grouped with no legend and nothing on the fields names the group, which fails RGAA 11.6.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

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
  // A role selector matches the token anywhere in the fallback list, so its
  // elements are kept only when that is their role.
  const ROLE_FIELDS = FIELD_ROLES.map((r) => `[role~="${r}" i]`).join(', ');

  function hasText(v) {
    return v != null && String(v).trim() !== '';
  }

  // The resolved explicit role: the first token of the role fallback list
  // that names a known role, lower-cased, or '' when none does.
  function explicitRole(el) {
    try {
      return el && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  function hasField(group) {
    if (dom.querySelector(group, NATIVE_FIELDS)) return true;
    return [...dom.querySelectorAll(group, ROLE_FIELDS)].some((el) =>
      FIELD_ROLES.includes(explicitRole(el))
    );
  }

  function labelledbyText(el) {
    const ids = String(dom.getAttribute(el, 'aria-labelledby') || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : dom.ownerDocument(el);
    return ids
      .map((i) => {
        const target = root && dom.get(root, 'getElementById') ? dom.getElementById(root, i) : null;
        return target ? dom.textContent(target) : '';
      })
      .join(' ');
  }

  function hasAriaName(el) {
    return hasText(dom.getAttribute(el, 'aria-label')) || hasText(labelledbyText(el));
  }

  // The group's fields, in order.
  function fieldsOf(group) {
    return [...dom.querySelectorAll(group, `${NATIVE_FIELDS}, ${ROLE_FIELDS}`)].filter(
      (el) => dom.matches(el, NATIVE_FIELDS) || FIELD_ROLES.includes(explicitRole(el))
    );
  }

  // The fields named for a message: the first three, each by its
  // accessible name (or else its tag), cut at 30 characters, joined with
  // " | ".
  function fieldsText(fields) {
    const names = fields.slice(0, 3).map((el) => {
      let v = '';
      try {
        const info = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
        v = info && info.value ? String(info.value) : '';
      } catch {}
      v = v.replace(/\s+/g, ' ').trim();
      if (!v) v = `<${String(dom.localName(el) || dom.tagName(el)).toLowerCase()}>`;
      return v.length > 30 ? `${v.slice(0, 29)}…` : v;
    });
    return names.join(' | ') + (fields.length > 3 ? ' | …' : '');
  }

  const cut = (v, n) => {
    const t = String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
    return t.length > n ? `${t.slice(0, n - 1)}…` : t;
  };

  // Filtered below by the first role token.
  const groups = helpers.queryAllSmart
    ? helpers.queryAllSmart('fieldset, [role]')
    : helpers.queryAll('fieldset, [role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const group of groups) {
    if (!group || !dom.get(group, 'getAttribute')) continue;
    const isFieldset = String(dom.tagName(group)).toLowerCase() === 'fieldset';
    const role = explicitRole(group);
    const isAriaGroup = role === 'group' || role === 'radiogroup';
    // A fieldset given another role (say role="presentation") is not a group.
    if (isFieldset ? role && !isAriaGroup : !isAriaGroup) continue;
    if (!hasField(group)) continue;
    applicableCount += 1;

    // RGAA 11.6.1 step 2: a legend for a fieldset, aria-label or
    // aria-labelledby for role="group"/"radiogroup".
    if (isAriaGroup && hasAriaName(group)) continue;
    let legend = null;
    if (isFieldset) {
      legend = [...dom.querySelectorAll(group, ':scope > *')].find(
        (c) => String(dom.tagName(c)).toLowerCase() === 'legend'
      );
      if (legend && hasText(dom.textContent(legend))) continue;
    }

    // Name the fields, and what the reviewer may see that does not count as
    // a legend: an empty <legend>, one that is not the fieldset's child, an
    // aria-label or aria-labelledby that gives no text.
    const fields = fieldsOf(group);
    const params = { role, count: fields.length, fields: fieldsText(fields) };
    let variant = isFieldset ? 'fieldset' : 'group';
    let why = '';
    if (isFieldset) {
      const nested = legend ? null : dom.querySelector(group, 'legend');
      if (legend) {
        variant = 'fieldset_emptyLegend';
        why = ', but its <legend> has no text';
      } else if (nested && hasText(dom.textContent(nested))) {
        variant = 'fieldset_nestedLegend';
        params.legend = cut(dom.textContent(nested), 60);
        why = `, but its <legend> ("${params.legend}") is not a direct child of the fieldset, so it is not the fieldset's legend`;
      } else if (hasAriaName(group)) {
        // RGAA 11.6.1 takes only a <legend> as a fieldset's legend.
        variant = 'fieldset_ariaName';
        params.attribute = hasText(dom.getAttribute(group, 'aria-label'))
          ? 'aria-label'
          : 'aria-labelledby';
        why = ` but has no <legend>; its ${params.attribute} does not count as a fieldset's legend`;
      }
    } else {
      const ids = String(dom.getAttribute(group, 'aria-labelledby') || '').trim();
      if (ids) params.attribute = `aria-labelledby="${cut(ids, 40)}"`;
      else if (dom.hasAttribute(group, 'aria-label')) params.attribute = 'aria-label';
      if (params.attribute) {
        variant = 'group_emptyName';
        why = `, but its ${params.attribute} gives no text, so it has no name`;
      }
    }
    const lead = isFieldset
      ? `This fieldset groups ${params.count} form field(s) (${params.fields})`
      : `This role="${role}" element groups ${params.count} form field(s) (${params.fields})`;
    const summary = why
      ? `${lead}${why}.`
      : isFieldset
        ? `${lead} but has no legend.`
        : `${lead} but has no aria-label or aria-labelledby.`;

    const element = isFieldset ? 'fieldset' : `role="${role}"`;
    occurrences.push(
      helpers.reportOccurrence(group, {
        summary,
        hint: 'If the fields are of the same kind (an address, a date, a set of choices), give the group a legend: a <legend> for a fieldset, aria-label or aria-labelledby for role="group" or role="radiogroup". Otherwise check that each field has a title, aria-label, aria-labelledby or aria-describedby that names the group.',
        i18n: {
          summaryKey: `fieldGroupLegend_summary_cantTell_${variant}`,
          hintKey: 'fieldGroupLegend_hint_cantTell',
          params
        },
        data: {
          details: {
            reasonCode: 'groupWithoutLegend',
            element,
            fields: params.fields,
            ...(params.legend ? { legend: params.legend } : {}),
            ...(params.attribute ? { attribute: params.attribute } : {}),
            ...(variant === 'fieldset_emptyLegend' ? { emptyLegend: true } : {})
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
