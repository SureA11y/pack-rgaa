/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-field-label-empty
 * @atomic true
 * @summary A field's only label sources are not empty
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible form fields (<input> other than hidden and the
 *   button types, <select>, <textarea>) that carry at least one label
 *   source of RGAA 11.1.1 (a <label>, title, aria-label or
 *   aria-labelledby) and whose sources are all empty. A field with no
 *   source at all is 11.1.1's matter. A page with none is notApplicable.
 * @expectation
 *   RGAA 11.2.1 to 11.2.4 ask whether each <label>, title, aria-label and
 *   aria-labelledby passage « permet de connaître la fonction exacte du
 *   champ ». An empty one tells nothing, so when every source the field
 *   has is empty, the field fails, once for each empty source: emptyLabel
 *   (11.2.1), emptyTitle (11.2.2), emptyAriaLabel (11.2.3) and
 *   emptyLabelledby (11.2.4, an aria-labelledby whose passages hold no
 *   text). An aria-labelledby that points to no element is no passage, and
 *   is left to 11.1.1.
 * @implementation-notes
 * - The text of a <label> leaves out the field's own content (a <select>'s
 *   options) and counts the alt of an image inside it.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-field-label-empty';

const meta = {
  title: "A field's label sources are not all empty",
  description:
    'Fails a form field whose only label sources (<label>, title, aria-label, aria-labelledby) are all empty.',
  i18n: {
    titleKey: 'fieldLabelEmpty_title',
    descriptionKey: 'fieldLabelEmpty_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['emptyLabel', 'emptyTitle', 'emptyAriaLabel', 'emptyLabelledby']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const CONTROLS = new Set(['input', 'select', 'textarea', 'button', 'option', 'optgroup']);
  const SKIP = new Set(['script', 'style', 'template']);

  // Text of a node, leaving out controls inside it and counting image alts.
  function textOf(node) {
    const parts = [];
    const visit = (n) => {
      for (const c of [...(dom.childNodes(n) || [])]) {
        const type = dom.nodeType(c);
        if (type === 3) parts.push(String(dom.nodeValue(c) || ''));
        else if (type === 1) {
          const tag = tagOf(c);
          if (CONTROLS.has(tag) || SKIP.has(tag)) continue;
          if (tag === 'img') parts.push(String(dom.getAttribute(c, 'alt') || ''));
          else if (tag === 'svg') {
            const t = dom.querySelectorAll(c, ':scope > title')[0];
            parts.push(String(dom.getAttribute(c, 'aria-label') || (t ? dom.textContent(t) : '')));
          } else visit(c);
        }
      }
    };
    visit(node);
    return norm(parts.join(' '));
  }

  function labelsOf(el) {
    try {
      return helpers.getAssociatedLabelElements ? helpers.getAssociatedLabelElements(el) || [] : [];
    } catch {
      return [];
    }
  }
  function refsOf(el) {
    const v = norm(dom.getAttribute(el, 'aria-labelledby'));
    if (!v) return [];
    return v.split(' ').map((ref) => {
      try {
        return helpers.getElementByIdInTree
          ? helpers.getElementByIdInTree(el, ref)
          : dom.getElementById(dom.getRootNode(el), ref);
      } catch {
        return null;
      }
    });
  }
  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }

  const SELECTOR =
    'input:not([type="hidden" i]):not([type="submit" i]):not([type="reset" i]):not([type="button" i]):not([type="image" i]), select, textarea';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(SELECTOR)
    : helpers.queryAll(SELECTOR);

  const occurrences = [];
  let applicable = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };
  const TEST = {
    emptyLabel: '11.2.1',
    emptyTitle: '11.2.2',
    emptyAriaLabel: '11.2.3',
    emptyLabelledby: '11.2.4'
  };
  const SUMMARY = {
    emptyLabel: 'This field has a <label>, but it is empty, and the field has no other label.',
    emptyTitle:
      'This field has a title attribute, but it is empty, and the field has no other label.',
    emptyAriaLabel:
      'This field has an aria-label, but it is empty, and the field has no other label.',
    emptyLabelledby:
      'This field has an aria-labelledby, but it points to no text, and the field has no other label.'
  };

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute') || !visible(el)) continue;
    const sources = [];
    const labels = labelsOf(el);
    if (labels.length) sources.push(['emptyLabel', labels.some((l) => textOf(l))]);
    if (dom.hasAttribute(el, 'title')) {
      sources.push(['emptyTitle', !!norm(dom.getAttribute(el, 'title'))]);
    }
    if (dom.hasAttribute(el, 'aria-label')) {
      sources.push(['emptyAriaLabel', !!norm(dom.getAttribute(el, 'aria-label'))]);
    }
    // An aria-labelledby that points to no element is no passage at all:
    // 11.1.1's matter, not 11.2.4's.
    const refs = refsOf(el).filter(Boolean);
    if (refs.length) sources.push(['emptyLabelledby', refs.some((r) => textOf(r))]);
    if (!sources.length) continue;
    applicable += 1;
    if (sources.some(([, filled]) => filled)) continue;
    for (const [kind] of sources) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: SUMMARY[kind],
          hint: `Give the field a label that says what to enter, in its <label> or another source (RGAA ${TEST[kind]}).`,
          i18n: {
            summaryKey: `fieldLabelEmpty_summary_${kind}`,
            hintKey: 'fieldLabelEmpty_hint',
            params: { test: TEST[kind] }
          },
          data: { details: { reasonCode: kind, test: TEST[kind] }, visibilityFilter: VF }
        })
      );
    }
  }

  if (applicable === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
