/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-tooltip-review
 * @atomic true
 * @summary Content shown on hover or focus can be dismissed, hovered and stays visible
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to author tooltips and popovers: an element with
 *   role="tooltip", and a visible element with a tooltip library's
 *   attribute (data-tooltip, data-tippy-content, data-balloon, or
 *   data-toggle / data-bs-toggle set to "tooltip", or to "popover" with a
 *   hover or focus trigger, since a popover otherwise opens on click). A
 *   role="tooltip" referenced by aria-describedby or aria-labelledby is
 *   reported on the element that references it. The title attribute is
 *   left out: 10.13's particular case makes content « contrôlé par l’agent
 *   utilisateur (par exemple, attribut title) » not applicable. A page with
 *   none is notApplicable.
 * @expectation
 *   RGAA 10.13: content that appears on hover or focus can be hidden by the
 *   user without moving the pointer or the focus (10.13.1), can be hovered
 *   without disappearing (10.13.2), and stays visible until the pointer or
 *   focus leaves, the user hides it, or it is no longer valid (10.13.3).
 *   Each is behaviour a script decides, so every tooltip is asked about
 *   (tooltipRole, tooltipAttribute), one occurrence per element.
 * @implementation-notes
 * - Manual (cantTell).
 * - A role="tooltip" is reported whether or not it is shown, since a
 *   tooltip is usually hidden until it is needed; content in <template> is
 *   left out.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-tooltip-review';

const meta = {
  title: 'Content shown on hover or focus can be dismissed, hovered and stays visible',
  description:
    'Flags author tooltips and popovers (role="tooltip", or a tooltip library attribute), for a person to check that what they show can be dismissed with Escape, hovered, and stays until the pointer or focus leaves.',
  i18n: {
    titleKey: 'tooltipReview_title',
    descriptionKey: 'tooltipReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'aria', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
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
  const inTemplate = (el) => {
    for (let a = dom.parentElement(el); a; a = dom.parentElement(a)) {
      if (tagOf(a) === 'template') return true;
    }
    return false;
  };
  // Every element, shown or not: a tooltip is usually hidden until needed.
  const query = (sel) => Array.from(dom.querySelectorAll(document, sel));

  const occurrences = [];
  const seen = new Set();
  function ask(el, kind, params) {
    if (seen.has(el)) return;
    seen.add(el);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          kind === 'tooltipRole'
            ? 'This element shows a tooltip (role="tooltip") on hover or focus.'
            : `This element shows a tooltip or popover (${params.attribute}) on hover or focus.`,
        hint: 'Check that what appears can be hidden without moving the pointer or the focus (with Escape, say), can be hovered without disappearing, and stays visible until the pointer or focus leaves it (RGAA 10.13).',
        i18n: {
          summaryKey: `tooltipReview_summary_cantTell_${kind}`,
          hintKey: 'tooltipReview_hint_cantTell',
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the content can be dismissed, hovered, and stays visible.'
        },
        data: {
          details: { reasonCode: kind, ...params },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  // Elements that reference a tooltip: reported in its place.
  const referrers = new Map();
  for (const el of query('[aria-describedby], [aria-labelledby]')) {
    for (const name of ['aria-describedby', 'aria-labelledby']) {
      for (const ref of norm(dom.getAttribute(el, name)).split(' ').filter(Boolean)) {
        if (!referrers.has(ref)) referrers.set(ref, el);
      }
    }
  }

  for (const tip of query('[role~="tooltip" i]')) {
    if (roleOf(tip) !== 'tooltip' || inTemplate(tip)) continue;
    const ref = norm(dom.getAttribute(tip, 'id'));
    const trigger = ref && referrers.get(ref);
    if (trigger && !visible(trigger)) continue;
    ask(trigger || tip, 'tooltipRole', {});
  }

  const ATTRS = ['data-tooltip', 'data-tippy-content', 'data-balloon'];
  for (const el of query(
    '[data-tooltip], [data-tippy-content], [data-balloon], [data-toggle], [data-bs-toggle]'
  )) {
    if (inTemplate(el) || !visible(el)) continue;
    let attribute = ATTRS.find((a) => dom.hasAttribute(el, a));
    if (!attribute) {
      for (const a of ['data-bs-toggle', 'data-toggle']) {
        const v = norm(dom.getAttribute(el, a)).toLowerCase();
        // A popover opens on click unless its trigger says hover or focus.
        const trigger = norm(
          dom.getAttribute(el, a === 'data-bs-toggle' ? 'data-bs-trigger' : 'data-trigger')
        );
        if (v === 'tooltip' || (v === 'popover' && /\b(?:hover|focus)\b/i.test(trigger))) {
          attribute = `${a}="${v}"`;
          break;
        }
      }
    }
    if (attribute) ask(el, 'tooltipAttribute', { attribute });
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
