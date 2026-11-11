/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-heading-role-level-present
 * @atomic true
 * @summary An element with role="heading" must have an aria-level attribute
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements other than <h1>-<h6> whose role is heading, that are
 *   included in the accessibility tree. A native <hx> is a heading by its
 *   tag, whatever its attributes, so it is not matched. A page with no such
 *   element is notApplicable.
 * @expectation
 *   The element has an aria-level attribute whose value is a number. RGAA
 *   defines a heading as an <hx> element or an element with both
 *   role="heading" and aria-level (glossary "Titre"), and 9.1.3 step 1
 *   accepts only these two structures ("un attribut WAI-ARIA
 *   aria-level=x", "x" being a number). WAI-ARIA gives role="heading" a
 *   default level of 2, which WCAG accepts, but RGAA does not.
 * @implementation-notes
 * - The role is the first token of the role attribute that WAI-ARIA knows,
 *   so role="heading", role="foo heading" and role="heading button" match,
 *   and role="button heading" does not.
 * - An aria-level that is present but empty or not a number fails with its
 *   own reasonCode. A number out of the range WAI-ARIA allows (0, -1) is
 *   still a number for 9.1.3; the invalid value is a matter of 8.2.1.
 * - Opt-in (tag `rgaa`): WCAG accepts the default level, so the rule runs
 *   only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'rgaa-heading-role-level-present';

const meta = {
  title: 'ARIA headings have an aria-level attribute',
  description: 'Checks that each element with role="heading" also has an aria-level attribute.',
  i18n: {
    titleKey: 'headingRoleLevelPresent_title',
    descriptionKey: 'headingRoleLevelPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'headings', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['missingAriaLevel', 'ariaLevelNotNumber']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // The role the attribute resolves to: its first known, non-abstract token,
  // in any case.
  function roleOf(el) {
    return helpers.aria.getExplicitRole(el);
  }

  function isIncluded(el) {
    const r = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible
        ? helpers.isAccTreeEligible(el, ctx)
        : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
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

  // An attribute written close to aria-level (arialevel, aria-lvl), which
  // browsers do not read; ARIA's own attributes do not count.
  const ARIA_NEAR = ['aria-label', 'aria-level', 'aria-live', 'aria-hidden', 'aria-modal'];
  function misspelledLevel(el) {
    const attrs = dom.attributes(el) || [];
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (ARIA_NEAR.includes(name)) continue;
      if (name.replace(/[-_]/g, '') === 'arialevel' || distance(name, 'aria-level') <= 2) {
        return { attribute: name, attrValue: String(attrs[i].value || '') };
      }
    }
    return null;
  }

  // The number a level written otherwise likely means: h2, "level 2",
  // two, deux.
  const WORDS = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    un: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5
  };
  function levelMeant(raw) {
    const v = String(raw).trim().toLowerCase();
    const digits = v.match(/^(?:h|level|niveau)?\s*-?\s*(\d+)$/);
    if (digits) return digits[1];
    return WORDS[v] ? String(WORDS[v]) : '';
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const tag = String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
    if (/^h[1-6]$/.test(tag)) continue;
    if (roleOf(el) !== 'heading') continue;
    if (!isIncluded(el)) continue;

    applicableCount += 1;

    const raw = dom.getAttribute(el, 'aria-level');
    if (raw != null && /^\s*[+-]?\d+(\.\d+)?\s*$/.test(raw)) continue;

    const missing = raw == null;
    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : null;

    // What the markup holds in place of a numeric aria-level, when it is
    // close: a misspelled attribute, or a level written with letters.
    const slip = missing ? misspelledLevel(el) : null;
    const suggestion = missing ? '' : levelMeant(raw);
    let hint =
      'Add aria-level with the heading level (for example aria-level="2"), or use an <h1>-<h6> element instead.';
    let hintKey = 'headingRoleLevelPresent_hint_fail';
    if (slip) {
      hint = `It has ${slip.attribute}="${slip.attrValue}", but browsers do not read ${slip.attribute}: did you mean aria-level? Rename the attribute.`;
      hintKey = 'headingRoleLevelPresent_hint_fail_misspelled';
    } else if (suggestion) {
      hint = `Did you mean aria-level="${suggestion}"? aria-level takes the level as a number alone.`;
      hintKey = 'headingRoleLevelPresent_hint_fail_suggest';
    }

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: missing
          ? 'This element has role="heading" but no aria-level attribute.'
          : `This element has role="heading" and aria-level="${raw}", which is not a number.`,
        hint,
        i18n: {
          summaryKey: missing
            ? 'headingRoleLevelPresent_summary_fail_missing'
            : 'headingRoleLevelPresent_summary_fail_notNumber',
          hintKey,
          params: {
            value: missing ? '' : raw,
            ...(slip || {}),
            ...(suggestion ? { suggestion } : {})
          }
        },
        data: {
          details: {
            reasonCode: missing ? 'missingAriaLevel' : 'ariaLevelNotNumber',
            ariaLevel: missing ? null : raw
          },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
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
