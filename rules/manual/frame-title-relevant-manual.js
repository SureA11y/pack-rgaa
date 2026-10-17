/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-frame-title-relevant
 * @atomic true
 * @summary A person checks that each frame's title says what the frame contains
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every <iframe> and <frame> in the scan scope whose title
 *   attribute is not empty or blank, and that is not hidden from assistive
 *   technologies by aria-hidden="true", on itself or on an ancestor (RGAA
 *   glossary "Titre de cadre", note 2, makes 2.2 not applicable to it).
 *   Frames hidden by the default hidden-content policy are not checked. A
 *   frame with no title, or an empty one, has no « titre de cadre »:
 *   rgaa-frame-title-attribute-present fails it under 2.1.1. A page with no
 *   applicable frame is notApplicable.
 * @expectation
 *   Each such frame is flagged, quoting its title and its address, for a
 *   person to check RGAA 2.2.1: the content of the title attribute is
 *   relevant, that is, it says what the frame contains. The glossary accepts
 *   a generic mention for a frame used only for technical purposes, such as
 *   title="contenus techniques Facebook".
 * @implementation-notes
 * - Manual (cantTell): the engine cannot judge relevance.
 * - One occurrence per frame. identical-iframes-same-purpose, a WCAG rule,
 *   compares frames by accessible name, which may come from aria-label, so
 *   it is not linked to 2.2.1.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-frame-title-relevant';

const meta = {
  title: 'Frame titles are relevant',
  description:
    'Flags each <iframe> and <frame> with a title for a person to check that the title says what the frame contains.',
  i18n: {
    titleKey: 'frameTitleRelevant_title',
    descriptionKey: 'frameTitleRelevant_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'iframe', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe[title], frame[title]')
    : helpers.queryAll('iframe[title], frame[title]');

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

  for (const el of nodes) {
    if (!el || !dom.tagName(el)) continue;
    if (isAriaHidden(el)) continue;
    const title = String(dom.getAttribute(el, 'title') || '')
      .replace(/[ \t\n\f\r]+/g, ' ')
      .trim();
    if (!title) continue;

    const element = String(dom.tagName(el)).toLowerCase();
    const src = String(dom.getAttribute(el, 'src') || '').trim();
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This <${element}> has the title "${title}".`,
        hint: 'Check that the title says what the frame contains, for example the name of the map or video it shows. A frame used only for technical purposes may have a generic title.',
        i18n: {
          summaryKey: 'frameTitleRelevant_summary_cantTell',
          hintKey: 'frameTitleRelevant_hint_cantTell',
          params: { element, title }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the title says what the frame contains.',
          evidence: { reasonCode: 'frameTitleRelevance', title, src }
        },
        data: {
          details: { reasonCode: 'frameTitleRelevance', element, title, src },
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
