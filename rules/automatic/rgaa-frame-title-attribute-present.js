/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-frame-title-attribute-present
 * @atomic true
 * @summary Each frame must have a title attribute that is not empty
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every <iframe> and <frame> in the scan scope that is not
 *   hidden from assistive technologies by aria-hidden="true", on itself or
 *   on an ancestor. The RGAA glossary "Titre de cadre", note 2, makes
 *   criteria 2.1 and 2.2 not applicable to such a frame. A frame removed
 *   from the tab order (tabindex="-1") is still in scope. Frames hidden by
 *   the default hidden-content policy (display:none, hidden) are not
 *   checked. A page with no applicable frame is notApplicable.
 * @expectation
 *   The frame has a title attribute (RGAA 2.1.1: « Chaque cadre (balise
 *   <iframe> ou <frame>) a-t-il un attribut title ? »), and it is not empty.
 *   Criterion 2.1 asks for a « titre de cadre », which the glossary defines
 *   as the content of that attribute, so an empty or blank title gives the
 *   frame no title: it fails here, as auditors report it, and 2.2.1 (the
 *   title's relevance, for frames that have one) does not apply to it. An
 *   accessible name from aria-label or aria-labelledby does not replace the
 *   title.
 * @implementation-notes
 * - WCAG 4.1.2 accepts any accessible name, so iframe-name-present passes
 *   a frame named by aria-label and skips frames with tabindex="-1".
 *   RGAA 2.1.1 asks for the title attribute on every frame, so this rule
 *   reports 2.1.1 in its place.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-frame-title-attribute-present';

const meta = {
  title: 'Frames have a title attribute',
  description:
    'Checks that every <iframe> and <frame> has a title attribute that is not empty, unless it is hidden with aria-hidden="true".',
  i18n: {
    titleKey: 'frameTitleAttributePresent_title',
    descriptionKey: 'frameTitleAttributePresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'iframe', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe, frame')
    : helpers.queryAll('iframe, frame');

  // aria-hidden="true" on the frame or on an ancestor, across shadow roots.
  function isAriaHidden(el) {
    for (
      let n = el;
      n;
      n = helpers.composedParent ? helpers.composedParent(n) : dom.parentNode(n)
    ) {
      if (!dom.get(n, 'getAttribute')) continue;
      const v = dom.getAttribute(n, 'aria-hidden');
      if (v != null && String(v).trim().toLowerCase() === 'true') return true;
    }
    return false;
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.tagName(el)) continue;
    if (isAriaHidden(el)) continue;
    applicableCount += 1;
    const present = dom.hasAttribute(el, 'title');
    if (present && /[^ \t\n\f\r]/.test(String(dom.getAttribute(el, 'title') || ''))) continue;

    const element = String(dom.tagName(el)).toLowerCase();
    const reasonCode = present ? 'emptyTitle' : 'missingTitle';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: present
          ? `This <${element}> has an empty title attribute.`
          : `This <${element}> has no title attribute.`,
        hint: present
          ? 'Write in the title what the frame contains, for example the name of the map or video it shows.'
          : 'Add a title attribute that says what the frame contains. aria-label does not replace it.',
        i18n: {
          summaryKey: present
            ? 'frameTitleAttributePresent_summary_empty'
            : 'frameTitleAttributePresent_summary_fail',
          hintKey: present
            ? 'frameTitleAttributePresent_hint_empty'
            : 'frameTitleAttributePresent_hint_fail',
          params: { element }
        },
        data: {
          details: { reasonCode, element },
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
