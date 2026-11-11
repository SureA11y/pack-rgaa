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
 *   Each is behaviour a script decides, so every tooltip is asked about,
 *   once per test, so that each answer is filed under its own test:
 *   tooltipRoleDismiss, tooltipRoleHover and tooltipRolePersist for a
 *   role="tooltip" (10.13.1, 10.13.2, 10.13.3), and the same for a library
 *   attribute (tooltipAttribute…).
 * @implementation-notes
 * - Manual (cantTell).
 * - A role="tooltip" is reported whether or not it is shown, since a
 *   tooltip is usually hidden until it is needed; content in <template> is
 *   left out.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-tooltip-review';

// The steps for each test of 10.13, for a role="tooltip" or, with
// `attribute`, a library attribute, where nothing may appear at all.
const NOTHING = 'Nothing appears on hover or focus; or ';
const either = (attribute, text) =>
  attribute ? NOTHING + text[0].toLowerCase() + text.slice(1) : text;
const TESTS = {
  dismiss: (attribute) => ({
    steps: [
      'Find the element the report names, and show its tooltip by hovering it, then by reaching it with the Tab key.',
      'Check whether the tooltip covers informative content, the element that triggered it included, also with the page zoomed.',
      'If it does, try to hide it with the keyboard (Escape or a key the page documents) without moving the pointer or the focus.'
    ],
    passWhen: either(
      attribute,
      'The tooltip covers no informative content, whatever the viewing conditions (zoom included), or a keyboard action hides it without moving the pointer or the focus.'
    ),
    failWhen:
      'The tooltip covers informative content and no keyboard action hides it without moving the pointer or the focus, which fails RGAA 10.13.1.'
  }),
  hover: (attribute) => ({
    steps: [
      'Find the element the report names, and show its tooltip by hovering it.',
      'Move the pointer from the element onto the tooltip.'
    ],
    passWhen: either(
      attribute,
      'The tooltip stays visible while the pointer moves onto it and over it.'
    ),
    failWhen: 'The tooltip disappears when the pointer moves onto it, which fails RGAA 10.13.2.'
  }),
  persist: (attribute) => ({
    steps: [
      'Find the element the report names, and show its tooltip by hovering it, then by reaching it with the Tab key.',
      'Each time, wait without moving the pointer or the focus.'
    ],
    passWhen: either(
      attribute,
      'The tooltip stays visible until the pointer or the focus leaves it and the element that triggered it, until the user hides it, or until its information is no longer valid.'
    ),
    failWhen:
      'The tooltip disappears by itself while the pointer or the focus is still on it or on its trigger and its information is still valid, which fails RGAA 10.13.3.'
  })
};

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
  coverage: {},
  // One code per test for each kind of tooltip: role="tooltip", or a
  // library attribute. Each element is asked about once per test.
  reasonCodes: [
    'tooltipRoleDismiss',
    'tooltipRoleHover',
    'tooltipRolePersist',
    'tooltipAttributeDismiss',
    'tooltipAttributeHover',
    'tooltipAttributePersist'
  ],
  review: {
    tooltipRoleDismiss: TESTS.dismiss(false),
    tooltipRoleHover: TESTS.hover(false),
    tooltipRolePersist: TESTS.persist(false),
    tooltipAttributeDismiss: TESTS.dismiss(true),
    tooltipAttributeHover: TESTS.hover(true),
    tooltipAttributePersist: TESTS.persist(true)
  }
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
  const query = (sel) => [...dom.querySelectorAll(document, sel)];

  // A text quoted in a summary: collapsed, cut at 80 characters.
  function excerpt(v) {
    const t = norm(v);
    return t.length > 80 ? `${t.slice(0, 79)}…` : t;
  }

  const occurrences = [];
  const seen = new Set();
  function ask(el, kind, params) {
    if (seen.has(el)) return;
    seen.add(el);
    for (const test of ['Dismiss', 'Hover', 'Persist']) askOne(el, kind, params, kind + test);
  }
  function askOne(el, kind, params, reasonCode) {
    // With the tooltip's text known, the summary quotes it.
    const saying = params.text ? `, saying "${params.text}"` : '';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          kind === 'tooltipRole'
            ? `This element shows a tooltip (role="tooltip") on hover or focus${saying}.`
            : `This element shows a tooltip or popover (${params.attribute}) on hover or focus${saying}.`,
        hint: 'Check that what appears can be hidden without moving the pointer or the focus (with Escape, say), can be hovered without disappearing, and stays visible until the pointer or focus leaves it (RGAA 10.13).',
        i18n: {
          summaryKey: `tooltipReview_summary_cantTell_${kind}${params.text ? 'Text' : ''}`,
          hintKey: 'tooltipReview_hint_cantTell',
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the content can be dismissed, hovered, and stays visible.'
        },
        data: {
          details: { reasonCode, ...params },
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
    const text = excerpt(dom.textContent(tip));
    ask(trigger || tip, 'tooltipRole', text ? { text } : {});
  }

  const ATTRS = ['data-tooltip', 'data-tippy-content', 'data-balloon'];
  // Where each library keeps the text it shows: the attribute itself, or
  // Bootstrap's title and content attributes.
  const TEXT_ATTRS = [
    ...ATTRS,
    'data-bs-title',
    'data-bs-content',
    'data-original-title',
    'data-content',
    'title'
  ];
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
    if (!attribute) continue;
    const text = excerpt(TEXT_ATTRS.map((a) => dom.getAttribute(el, a)).find((v) => norm(v)));
    ask(el, 'tooltipAttribute', text ? { attribute, text } : { attribute });
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
