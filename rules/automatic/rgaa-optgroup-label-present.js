/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-optgroup-label-present
 * @atomic true
 * @summary Every <optgroup> in a <select> must have a label
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <optgroup> elements inside a <select>. A page with none is
 *   notApplicable.
 * @expectation
 *   The <optgroup> has a label attribute (RGAA 11.8.2: « vérifier qu'il
 *   possède un attribut label »). An empty or whitespace-only label meets
 *   11.8.2; that it names nothing is a relevance failure under 11.8.3,
 *   which this rule does not judge.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not require the attribute, so the rule
 *   runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'rgaa-optgroup-label-present';

const meta = {
  title: 'Option groups have a label',
  description: 'Checks that every <optgroup> in a <select> has a label attribute.',
  i18n: {
    titleKey: 'optgroupLabelPresent_title',
    descriptionKey: 'optgroupLabelPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  // The reason codes the rule gives, so definePack can check that `review`
  // names only these.
  reasonCodes: ['missingLabel']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('select optgroup')
    : helpers.queryAll('select optgroup');

  // An attribute written close to label (lable, labell, libelle), which
  // browsers do not read: the hint names it.
  function misspelledLabel(el) {
    const attrs = dom.attributes(el) || [];
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (!name || name === 'label' || /^(aria|data)-/.test(name)) continue;
      if (['class', 'id', 'style', 'disabled', 'title', 'lang', 'dir', 'hidden'].includes(name)) {
        continue;
      }
      // Optimal string alignment distance to "label".
      const a = name;
      const b = 'label';
      const d = [];
      for (let x = 0; x <= a.length; x++) d.push([x]);
      for (let y = 1; y <= b.length; y++) d[0][y] = y;
      for (let x = 1; x <= a.length; x++) {
        for (let y = 1; y <= b.length; y++) {
          const cost = a[x - 1] === b[y - 1] ? 0 : 1;
          d[x][y] = Math.min(d[x - 1][y] + 1, d[x][y - 1] + 1, d[x - 1][y - 1] + cost);
          if (x > 1 && y > 1 && a[x - 1] === b[y - 2] && a[x - 2] === b[y - 1]) {
            d[x][y] = Math.min(d[x][y], d[x - 2][y - 2] + 1);
          }
        }
      }
      if (d[a.length][b.length] <= 1 || ['libelle', 'libellé', 'labelle'].includes(name)) {
        const value = String(attrs[i].value || '')
          .replace(/\s+/g, ' ')
          .trim();
        return { attribute: name, value: value.length > 60 ? `${value.slice(0, 59)}…` : value };
      }
    }
    return null;
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    applicableCount += 1;

    if (dom.hasAttribute(el, 'label')) continue;
    const misspelled = misspelledLabel(el);

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This option group has no label attribute.',
        hint: misspelled
          ? `It has ${misspelled.attribute}="${misspelled.value}", but browsers do not read ${misspelled.attribute}: did you mean label? Rename the attribute.`
          : 'Give the <optgroup> a label attribute naming what its options have in common.',
        i18n: {
          summaryKey: 'optgroupLabelPresent_summary_fail_missing',
          hintKey: misspelled
            ? 'optgroupLabelPresent_hint_misspelled'
            : 'optgroupLabelPresent_hint_fail',
          params: misspelled || {}
        },
        data: {
          details: {
            reasonCode: 'missingLabel',
            ...(misspelled ? { misspelledAttribute: misspelled.attribute } : {})
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
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
