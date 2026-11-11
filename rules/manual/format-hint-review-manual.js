/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-format-hint-review
 * @atomic true
 * @summary Fields with a format constraint suggest the format or an example
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible, enabled, editable text-like fields (<textarea>,
 *   and <input> of type text, search, tel, url, email, password, number,
 *   date, time, datetime-local, month or week) that carry an input
 *   control (glossary « Contrôle de saisie »): a pattern, a minlength, a
 *   min or max on a number, date or time field, or an inputmode of
 *   numeric, decimal, tel, email or url. Fields whose label, title,
 *   aria-labelledby or aria-describedby passages or placeholder show a
 *   digit or a word such as « ex. », « format » or « jj/mm/aaaa » are
 *   left out, as are fields with a pattern and a title (technical note of
 *   11.11). A page with none left is notApplicable.
 * @expectation
 *   RGAA 11.11.1: « Pour chaque erreur de saisie, les types et les formats
 *   de données sont-ils suggérés, si nécessaire ? »; 11.11.2: « des
 *   exemples de valeurs attendues sont-ils suggérés, si nécessaire ? ».
 *   The error message itself only shows once a value is rejected, and it
 *   may be the one the browser writes, so a field whose constraint is
 *   stated nowhere around it is asked about (formatWithoutHint).
 * @implementation-notes
 * - Manual (cantTell).
 * - maxlength alone is not a constraint here: the browser stops the
 *   typing at the limit, so no input error arises from it.
 * - The technical note of 11.11 says the title of a field with a pattern
 *   « valide également le critère », so such a field is not asked about.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-format-hint-review';

const meta = {
  title: 'Fields with a format constraint suggest the format or an example',
  description:
    'Flags a field with a pattern, minlength, min/max or inputmode whose label, description and placeholder give no format or example, for a person to check that an input error suggests the expected format and an example.',
  i18n: {
    titleKey: 'formatHintReview_title',
    descriptionKey: 'formatHintReview_description'
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
  reasonCodes: ['formatWithoutHint'],
  review: {
    formatWithoutHint: {
      steps: [
        'Find the field the report names: the report gives the constraint on what it accepts.',
        'Enter a value that breaks the constraint, and send the form.',
        'Read the error message for this field.',
        'Decide whether the message alone lets you write a valid value; a field with an input mask (a date or time field) needs no format indication.'
      ],
      passWhen:
        'The error message says the expected type or format, or none is needed (the field has an input mask); and where the format alone does not let a user write a valid value, it also gives an example.',
      failWhen:
        'The error message does not say the expected type or format although one is needed, which fails RGAA 11.11.1. (A message that states the format but lacks an example the user needs fails RGAA 11.11.2.)'
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
  const attr = (el, name) => {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  };
  const has = (el, name) => attr(el, name) != null;
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
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

  const TEXT_TYPES = ['text', 'search', 'tel', 'url', 'email', 'password'];
  const RANGE_TYPES = ['number', 'date', 'time', 'datetime-local', 'month', 'week'];
  const INPUTMODES = ['numeric', 'decimal', 'tel', 'email', 'url'];
  // A digit, or a word that announces a format or an example.
  const HINT =
    /\d|\b(?:ex|exemple|exemples|example|examples|e\.g|format|formats|ejemplo|beispiel|z\.b|jj|mm|aaaa|aa|dd|yyyy|yy|hh|caract[eè]res?|characters?|chiffres?|digits?|lettres?|letters?)\b|例|形式/i;

  function refText(el, name) {
    return norm(attr(el, name))
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
      .join(' ');
  }
  function labelText(el) {
    let labels = [];
    try {
      labels = helpers.getAssociatedLabelElements
        ? helpers.getAssociatedLabelElements(el) || []
        : [];
    } catch {}
    return labels.map((l) => norm(dom.textContent(l))).join(' ');
  }
  function shortLabel(el) {
    return norm(labelText(el) || refText(el, 'aria-labelledby') || attr(el, 'aria-label')).slice(
      0,
      60
    );
  }

  // The constraint the field carries, or '' for none.
  function constraintOf(el, type) {
    const textLike = tagOf(el) === 'textarea' || TEXT_TYPES.includes(type);
    if (textLike && norm(attr(el, 'pattern'))) return 'pattern';
    if (textLike && /^\s*[1-9]\d*\s*$/.test(String(attr(el, 'minlength') || ''))) {
      return 'minlength';
    }
    if (RANGE_TYPES.includes(type) && (norm(attr(el, 'min')) || norm(attr(el, 'max')))) {
      return 'min/max';
    }
    const mode = norm(attr(el, 'inputmode')).toLowerCase();
    if ((textLike || type === 'number') && INPUTMODES.includes(mode)) return 'inputmode';
    return '';
  }

  const occurrences = [];
  for (const el of query('input, textarea')) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const tag = tagOf(el);
    const type = tag === 'textarea' ? '' : norm(attr(el, 'type')).toLowerCase() || 'text';
    if (tag === 'input' && !TEXT_TYPES.includes(type) && !RANGE_TYPES.includes(type)) continue;
    if (has(el, 'disabled') || has(el, 'readonly')) continue;
    const constraint = constraintOf(el, type);
    if (!constraint) continue;
    if (constraint === 'pattern' && norm(attr(el, 'title'))) continue;
    if (!visible(el)) continue;

    const around = [
      labelText(el),
      refText(el, 'aria-labelledby'),
      refText(el, 'aria-describedby'),
      attr(el, 'aria-label'),
      attr(el, 'aria-description'),
      attr(el, 'title'),
      attr(el, 'placeholder')
    ]
      .map(norm)
      .join(' ');
    if (HINT.test(around)) continue;

    const label = shortLabel(el);
    // The control as written in the markup, with its value, so the reviewer
    // sees the format the field expects.
    const value = (name) => {
      const v = norm(attr(el, name));
      return `${name}="${v.length > 60 ? `${v.slice(0, 59)}…` : v}"`;
    };
    const control =
      constraint === 'min/max'
        ? ['min', 'max']
            .filter((n) => norm(attr(el, n)))
            .map(value)
            .join(' ')
        : value(constraint);
    const params = label ? { constraint, control, label } : { constraint, control };
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: label
          ? `This field ("${label}") has an input control (${control}) but its label, description and placeholder give no format or example.`
          : `This field has an input control (${control}) but its label, description and placeholder give no format or example.`,
        hint: 'Check that, when the value is rejected, the error message says which type or format of data is expected and gives an example of a valid value (RGAA 11.11.1, 11.11.2).',
        i18n: {
          summaryKey: label
            ? 'formatHintReview_summary_cantTell_labelled'
            : 'formatHintReview_summary_cantTell',
          hintKey: 'formatHintReview_hint_cantTell',
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether an input error suggests the expected format and an example.'
        },
        data: {
          details: { reasonCode: 'formatWithoutHint', constraint, label, control },
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
