/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-select-fake-groups-review
 * @atomic true
 * @summary Options of the same kind are grouped with <optgroup>, not with fake heading options
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <select> elements with no <optgroup> that hold an option
 *   used as a group heading: two disabled options or more after the first
 *   one (a single one is often an item out of stock), or an option whose
 *   text is framed by dashes or similar signs (« -- Europe -- », « ===
 *   Fruits === »). The first option, often a « Choisissez »
 *   placeholder, is left out. A page with none is notApplicable.
 * @expectation
 *   RGAA 11.8.1: « les items de même nature d'une liste de choix sont-ils
 *   regroupés avec une balise <optgroup>, si nécessaire ? » A fake heading
 *   option shows that the author grouped the items visually; assistive
 *   technologies read it as one more choice. Whether grouping is needed is
 *   for a person, so the list is asked about (fakeGroupHeading).
 * @implementation-notes
 * - Manual (cantTell).
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-select-fake-groups-review';

const meta = {
  title: 'Options are grouped with <optgroup>, not with fake heading options',
  description:
    'Flags each <select> without <optgroup> whose options include disabled or dash-framed headings, for a person to check whether the items should be grouped with <optgroup>.',
  i18n: {
    titleKey: 'selectFakeGroupsReview_title',
    descriptionKey: 'selectFakeGroupsReview_description'
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
  const { helpers, rule } = ctx;

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const FRAMED =
    /^[-–—=_*•.~]{2,}\s*\S.*\S?\s*[-–—=_*•.~]{2,}$|^[-–—=_*•.~]{2,}\s*\S|\S\s*[-–—=_*•.~]{2,}$/;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('select')
    : helpers.queryAll('select');

  const occurrences = [];
  for (const select of nodes) {
    if (!select || !dom.get(select, 'getAttribute')) continue;
    if (dom.querySelectorAll(select, 'optgroup').length) continue;
    const options = Array.from(dom.querySelectorAll(select, 'option')).slice(1);
    // One disabled option is often an item out of stock; headings come in
    // sets, so disabled options count from two.
    const disabled = options.filter(
      (o) => dom.hasAttribute(o, 'disabled') && norm(dom.textContent(o))
    );
    const heading =
      options.find((o) => FRAMED.test(norm(dom.textContent(o)))) ||
      (disabled.length >= 2 ? disabled[0] : null);
    if (!heading) continue;
    const text = norm(dom.textContent(heading)).slice(0, 60);
    occurrences.push(
      helpers.reportOccurrence(select, {
        summary: `This list has no <optgroup>, but its option "${text}" looks like a group heading.`,
        hint: 'If the items fall into groups, put each group in an <optgroup> whose label names it, instead of a heading option (RGAA 11.8.1).',
        i18n: {
          summaryKey: 'selectFakeGroupsReview_summary_cantTell',
          hintKey: 'selectFakeGroupsReview_hint_cantTell',
          params: { text }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the items of the list should be grouped with <optgroup>.'
        },
        data: {
          details: { reasonCode: 'fakeGroupHeading', text },
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
