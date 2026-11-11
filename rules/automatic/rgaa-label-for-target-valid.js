/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-label-for-target-valid
 * @atomic true
 * @summary A <label for> must point to a form field with that id
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <label> elements carrying a for attribute. A page with none
 *   is notApplicable.
 * @expectation
 *   The first element in the label's own tree whose id equals the for value
 *   exists and is labelable: <button>, <input> other than type="hidden",
 *   <meter>, <output>, <progress>, <select>, <textarea>, or a form-associated
 *   custom element (RGAA 11.1.2). A for attribute that matches nothing means
 *   the label labels nothing, not even a field nested inside it, since the
 *   HTML association falls back to the label's content only when for is
 *   absent. A target that is not labelable but has a form-field ARIA role
 *   (textbox, combobox, listbox, searchbox, spinbutton, slider, progressbar,
 *   checkbox, radio, switch, option: the roles the RGAA glossary "Champ de
 *   saisie de formulaire" counts as fields) passes: 11.1.2 asks only that
 *   the field has an id equal to the for value. HTML does not let such a
 *   label name the field, and that missing name belongs to 11.1.1, not
 *   here.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): a label pointing nowhere is not in itself a WCAG
 *   failure (the field may be named another way, which
 *   form-control-programmatic-label-present checks), so the rule runs only
 *   under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 * - Ids resolve in the label's own tree, so a label inside a shadow root
 *   looks for its field in that shadow root.
 */

const id = 'rgaa-label-for-target-valid';

const meta = {
  title: 'Labels point to a form field',
  description:
    'Checks that the for attribute of each <label> matches the id of a form field it can label.',
  i18n: {
    titleKey: 'labelForTargetValid_title',
    descriptionKey: 'labelForTargetValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'labels', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  // The reason codes the rule gives, so definePack can check that `review`
  // names only these.
  reasonCodes: ['emptyFor', 'missingTarget', 'notLabelable']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, window, helpers, rule } = ctx;

  const LABELABLE = ['button', 'meter', 'output', 'progress', 'select', 'textarea'];
  // Roles the RGAA glossary "Champ de saisie de formulaire" counts as fields.
  const FIELD_ROLES = [
    'progressbar',
    'slider',
    'spinbutton',
    'textbox',
    'listbox',
    'searchbox',
    'combobox',
    'option',
    'checkbox',
    'radio',
    'switch'
  ];

  function hasFieldRole(el) {
    return FIELD_ROLES.includes(helpers.aria.getExplicitRole(el));
  }

  function isLabelable(el) {
    const tag = String(dom.tagName(el) || '').toLowerCase();
    if (LABELABLE.includes(tag)) return true;
    if (tag === 'input')
      return String(dom.getAttribute(el, 'type') || '').toLowerCase() !== 'hidden';
    if (tag.includes('-')) {
      try {
        const definition = window && window.customElements && window.customElements.get(tag);
        return !!(definition && definition.formAssociated === true);
      } catch {
        return false;
      }
    }
    return false;
  }

  function targetOf(label, value) {
    let root = document;
    try {
      const r = dom.getRootNode(label);
      if (r && typeof dom.get(r, 'getElementById') === 'function') root = r;
    } catch {
      // keep the document
    }
    return dom.getElementById(root, value);
  }

  // Optimal string alignment distance: a transposition counts as one edit.
  function distance(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) d.push([i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }

  const isField = (el) => isLabelable(el) || hasFieldRole(el);
  const fieldsIn = (scope) =>
    [...(dom.querySelectorAll(scope, '[id]') || [])].filter(
      (n) => isField(n) && dom.getAttribute(n, 'id')
    );

  // The field the label most likely means, for the hint: a field whose id
  // is the value with its case, spaces or # set aside, or within two edits
  // (one for a short id); else the one field inside the label, or inside
  // the element the value names. Returns { id, element, inside } or null.
  function meantField(label, value, target) {
    if (target) {
      const inner = fieldsIn(target);
      if (inner.length === 1) {
        return {
          id: String(dom.getAttribute(inner[0], 'id')),
          element: String(dom.tagName(inner[0])).toLowerCase(),
          inside: true
        };
      }
      return null;
    }
    let root = document;
    try {
      const r = dom.getRootNode(label);
      if (r && typeof dom.get(r, 'querySelectorAll') === 'function') root = r;
    } catch {
      // keep the document
    }
    const written = value.trim().replace(/^#/, '');
    let best = null;
    let bestDistance = Infinity;
    for (const field of fieldsIn(root)) {
      const candidate = String(dom.getAttribute(field, 'id'));
      const d =
        candidate.toLowerCase() === written.toLowerCase() ? 0 : distance(candidate, written);
      if (d < bestDistance && d <= (written.length > 5 ? 2 : written.length > 2 ? 1 : 0)) {
        best = field;
        bestDistance = d;
      }
    }
    if (!best) {
      const inner = fieldsIn(label);
      if (inner.length === 1) best = inner[0];
    }
    return best
      ? {
          id: String(dom.getAttribute(best, 'id')),
          element: String(dom.tagName(best)).toLowerCase(),
          inside: false
        }
      : null;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('label[for]')
    : helpers.queryAll('label[for]');

  const occurrences = [];
  let applicableCount = 0;

  for (const label of nodes) {
    if (!label || !dom.get(label, 'getAttribute')) continue;
    applicableCount += 1;

    const value = String(dom.getAttribute(label, 'for'));
    let reasonCode = null;
    let target = null;
    if (!value) {
      reasonCode = 'emptyFor';
    } else {
      target = targetOf(label, value);
      if (!target) reasonCode = 'missingTarget';
      else if (!isLabelable(target) && !hasFieldRole(target)) reasonCode = 'notLabelable';
    }
    if (!reasonCode) continue;

    const element = target ? String(dom.tagName(target)).toLowerCase() : '';
    const summaries = {
      emptyFor: {
        text: 'This label has an empty for attribute, so it labels no field.',
        key: 'labelForTargetValid_summary_fail_empty'
      },
      missingTarget: {
        text: `This label points to id "${value}", which no element in its tree has.`,
        key: 'labelForTargetValid_summary_fail_missing'
      },
      notLabelable: {
        text: `This label points to id "${value}", which belongs to the <${element}> element, not to a form field.`,
        key: 'labelForTargetValid_summary_fail_notLabelable'
      }
    };

    // The field the label likely means, named in the hint.
    const meant = reasonCode === 'emptyFor' ? null : meantField(label, value, target);
    // A wrapper that holds several fields: their ids, for the hint.
    const several =
      !meant && reasonCode === 'notLabelable' && target
        ? fieldsIn(target).map((n) => String(dom.getAttribute(n, 'id')))
        : [];
    const fields =
      several.length > 1
        ? several.slice(0, 5).join(' | ') + (several.length > 5 ? ' | …' : '')
        : '';
    const hint = meant
      ? `Did you mean "${meant.id}"? It is the id of the <${meant.element}> field${meant.inside ? ` inside that <${element}>` : ''}. Set the for attribute to it, exactly as written, case included.`
      : fields
        ? `That <${element}> holds several fields, with the ids "${fields}". Set the for attribute to the id of the one this label names, exactly as written, or give each field a label of its own.`
        : 'Set the for attribute to the id of the field this label names, or remove it and put the field inside the label.';

    occurrences.push(
      helpers.reportOccurrence(label, {
        summary: summaries[reasonCode].text,
        hint,
        i18n: {
          summaryKey: summaries[reasonCode].key,
          hintKey: meant
            ? 'labelForTargetValid_hint_fail_suggest'
            : fields
              ? 'labelForTargetValid_hint_fail_severalFields'
              : 'labelForTargetValid_hint_fail',
          params: meant
            ? {
                value,
                element,
                suggestion: meant.id,
                suggestionElement: meant.element,
                inside: meant.inside
              }
            : fields
              ? { value, element, fields }
              : { value, element }
        },
        data: {
          details: {
            reasonCode,
            value,
            target: element || null,
            ...(meant ? { suggestion: meant.id } : {}),
            ...(fields ? { fields: several.slice(0, 20) } : {})
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
