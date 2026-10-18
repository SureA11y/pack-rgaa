/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-invalid-field-message
 * @atomic true
 * @summary A field marked invalid has its error message in its label or a linked passage
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to each visible field of a form (a <form> or role="form") with
 *   aria-invalid="true" and no visible text in a passage linked by
 *   aria-describedby or aria-labelledby. A page with none is notApplicable.
 * @expectation
 *   RGAA 11.10.4 and 11.10.7 ask a field with aria-invalid="true" for its
 *   error message, or its format instruction, visible in its label or in a
 *   passage of text linked by aria-labelledby or aria-describedby
 *   (glossary « Passage de texte lié par aria-labelledby ou
 *   aria-describedby »); aria-errormessage is not one of those places. With
 *   no such passage, only the label is left, and whether it holds the
 *   message is for a person (cantTell).
 * @implementation-notes
 * - Manual (cantTell): the engine cannot tell an error message from the
 *   label's own words.
 * - A field with a visible linked passage is not flagged: the passage may
 *   be the message, which 11.10.4 accepts.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-invalid-field-message';

const meta = {
  title: 'Fields marked invalid have their error message in their label or a linked passage',
  description:
    'Flags each field of a form with aria-invalid="true" and no visible passage linked by aria-describedby or aria-labelledby, for a person to check that its label holds the error message.',
  i18n: {
    titleKey: 'invalidFieldMessage_title',
    descriptionKey: 'invalidFieldMessage_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'manual'],
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
  const { document, helpers, rule } = ctx;

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };

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
  function refs(el, name) {
    const v = dom.getAttribute(el, name);
    if (!v || !norm(v) || !helpers.resolveIdRefs) return [];
    try {
      const r = helpers.resolveIdRefs(v, ctx, { maxRefs: 8 }, el);
      return r && Array.isArray(r.refs) ? r.refs : [];
    } catch {
      return [];
    }
  }
  const shown = (n) => visible(n) && !offScreen(n) && !!norm(dom.textContent(n));

  const inForm = (el) => {
    for (let a = dom.parentElement(el); a; a = dom.parentElement(a)) {
      if (tagOf(a) === 'form' || roleOf(a) === 'form') return true;
    }
    return false;
  };

  const occurrences = [];
  for (const el of Array.from(dom.querySelectorAll(document, '[aria-invalid]'))) {
    if (norm(dom.getAttribute(el, 'aria-invalid')).toLowerCase() !== 'true') continue;
    if (!inForm(el) || !visible(el) || offScreen(el)) continue;
    if (refs(el, 'aria-describedby').concat(refs(el, 'aria-labelledby')).some(shown)) continue;
    const errormessage = !!norm(dom.getAttribute(el, 'aria-errormessage'));
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: errormessage
          ? 'This field is marked aria-invalid="true"; its message is linked by aria-errormessage only, which is not one of the places RGAA 11.10.4 names.'
          : 'This field is marked aria-invalid="true", and no visible passage is linked to it by aria-describedby or aria-labelledby.',
        hint: "Check that the error message is visible in the field's label, or link it with aria-describedby (RGAA 11.10.4, 11.10.7).",
        i18n: {
          summaryKey: errormessage
            ? 'invalidFieldMessage_summary_cantTell_errormessage'
            : 'invalidFieldMessage_summary_cantTell',
          hintKey: 'invalidFieldMessage_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed: "Whether the field's label holds the error message."
        },
        data: {
          details: { reasonCode: errormessage ? 'errormessageOnly' : 'noLinkedMessage' },
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
