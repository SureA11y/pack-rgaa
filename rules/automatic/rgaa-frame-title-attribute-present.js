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
 *   title's relevance, for frames that have one, which
 *   rgaa-frame-title-relevant asks about) does not apply to it. Test 2.1.1
 *   and its methodology ask only that the attribute be there, so this
 *   follows the criterion and the glossary rather than the test's letter.
 *   An accessible name from aria-label or aria-labelledby does not replace
 *   the title.
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
  coverage: {},
  reasonCodes: ['missingTitle', 'emptyTitle']
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
  const clip = (v) => {
    const t = String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
    return t.length > 60 ? `${t.slice(0, 59)}…` : t;
  };

  // What a frame with no title holds in its place, for the hint: an
  // attribute written close to title (tittle, titel), or an aria-label or
  // aria-labelledby, which RGAA does not take for the title.
  const NOT_TITLE = ['style', 'type', 'name', 'tabindex', 'width', 'height'];
  function titleStandIn(el) {
    const attrs = dom.attributes(el) || [];
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      const value = clip(attrs[i].value);
      if (!value || NOT_TITLE.includes(name) || name === 'title') continue;
      if (distance(name, 'title') <= 1 || name === 'titre') {
        return { kind: 'misspelled', attribute: name, value };
      }
    }
    const label = clip(dom.getAttribute(el, 'aria-label'));
    if (label) return { kind: 'ariaName', attribute: 'aria-label', value: label };
    if (clip(dom.getAttribute(el, 'aria-labelledby'))) {
      return {
        kind: 'ariaName',
        attribute: 'aria-labelledby',
        value: clip(dom.getAttribute(el, 'aria-labelledby'))
      };
    }
    return null;
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.tagName(el)) continue;
    if (isAriaHidden(el)) continue;
    applicableCount += 1;
    const present = dom.hasAttribute(el, 'title');
    // Blank: spaces of any kind, &nbsp; included, give the frame no title.
    if (present && String(dom.getAttribute(el, 'title') || '').trim()) continue;

    const element = String(dom.tagName(el)).toLowerCase();
    const reasonCode = present ? 'emptyTitle' : 'missingTitle';
    const standIn = present ? null : titleStandIn(el);
    // An empty title beside an aria-label that holds text: that text is
    // likely the title meant.
    const ariaLabel = present ? clip(dom.getAttribute(el, 'aria-label')) : '';
    let hint = present
      ? 'Write in the title what the frame contains, for example the name of the map or video it shows.'
      : 'Add a title attribute that says what the frame contains. aria-label does not replace it.';
    if (ariaLabel) {
      hint = `Its aria-label holds "${ariaLabel}", but RGAA 2.1.1 asks for the title attribute, which aria-label does not replace. Copy that text into the title, if it says what the frame contains.`;
    } else if (standIn && standIn.kind === 'misspelled') {
      hint = `It has ${standIn.attribute}="${standIn.value}", but browsers do not read ${standIn.attribute}: did you mean title? Rename the attribute.`;
    } else if (standIn) {
      hint = `It has ${standIn.attribute}="${standIn.value}", but RGAA 2.1.1 asks for the title attribute, which ${standIn.attribute} does not replace. Add a title that says what the frame contains.`;
    }
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: present
          ? `This <${element}> has an empty title attribute.`
          : `This <${element}> has no title attribute.`,
        hint,
        i18n: {
          summaryKey: present
            ? 'frameTitleAttributePresent_summary_empty'
            : 'frameTitleAttributePresent_summary_fail',
          hintKey: present
            ? ariaLabel
              ? 'frameTitleAttributePresent_hint_empty_ariaLabel'
              : 'frameTitleAttributePresent_hint_empty'
            : standIn
              ? `frameTitleAttributePresent_hint_fail_${standIn.kind}`
              : 'frameTitleAttributePresent_hint_fail',
          params: standIn
            ? { element, attribute: standIn.attribute, value: standIn.value }
            : ariaLabel
              ? { element, value: ariaLabel }
              : { element }
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
