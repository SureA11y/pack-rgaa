/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-role-img-aria-name
 * @atomic true
 * @summary An element with role="img" must have a text alternative from aria-labelledby or aria-label
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements whose role attribute starts with the token img,
 *   except <img> (RGAA lists its own sources for it) and an outer <svg>
 *   (RGAA test 1.1.5, see rgaa-svg-role-img and svg-text-alternative-present). An
 *   element with aria-hidden="true", on itself or an ancestor, is left out:
 *   the glossary entry "Image de décoration" says an element with role="img"
 *   is decorative only with aria-hidden="true". Content hidden with CSS or
 *   the hidden attribute is left out too. A page with none is
 *   notApplicable.
 * @expectation
 *   The element has a text alternative from one of the two sources RGAA
 *   1.1.1 step 4 lists for role="img": text referenced by aria-labelledby, or
 *   a non-empty aria-label. A name that comes only from the title attribute,
 *   or no name at all, fails: the glossary entry "Alternative textuelle
 *   (image)" lists title for <img>, <input type="image">, <object> and
 *   <embed> only.
 *   An element in the SVG namespace (a <g role="img">, for example) named
 *   by a <title> child passes: since RGAA 4.1.2 the glossary entry
 *   "Alternative textuelle (image)" counts an SVG's <title> as its
 *   alternative, and 1.1.5 step 5 lists it.
 * @implementation-notes
 * - The graphics-* roles are not checked: no RGAA test names them.
 * - aria-labelledby counts when it resolves to text; one that points to
 *   nothing gives way to aria-label, as in the glossary's order.
 * - Opt-in (tag `rgaa`): WCAG accepts a title-only name, so the rule runs
 *   only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'rgaa-role-img-aria-name';

const meta = {
  title: 'Elements with role="img" are named with aria-labelledby or aria-label',
  description:
    'Checks that each exposed element with role="img" (other than <img> and an outer <svg>) has a text alternative from aria-labelledby or aria-label, the two sources RGAA accepts.',
  i18n: {
    titleKey: 'roleImgAriaName_title',
    descriptionKey: 'roleImgAriaName_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'aria', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['titleOnly', 'missingAlternative']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const trim = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const attr = (el, name) => {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  };
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const parentOf = (el) =>
    helpers.composedParent ? helpers.composedParent(el) : dom.parentElement(el) || null;

  function insideAriaHidden(el) {
    for (let n = el; n && dom.nodeType(n) === 1; n = parentOf(n)) {
      if (trim(attr(n, 'aria-hidden')).toLowerCase() === 'true') return true;
    }
    return false;
  }

  function isOuterSvg(el) {
    if (tagOf(el) !== 'svg') return false;
    const p = dom.parentElement(el);
    return !(p && dom.get(p, 'closest') && dom.closest(p, 'svg'));
  }

  function ariaName(el) {
    if (helpers.getAriaNameInfo) {
      try {
        const info = helpers.getAriaNameInfo(el, ctx);
        if (info && info.present && trim(info.value)) return info.mechanism;
        return '';
      } catch {}
    }
    return trim(attr(el, 'aria-label')) ? 'aria-label' : '';
  }

  function svgTitleChildText(el) {
    if (dom.namespaceURI(el) !== SVG_NS) return '';
    for (const child of Array.from(dom.querySelectorAll(el, ':scope > *'))) {
      if (tagOf(child) === 'title') return trim(dom.textContent(child));
    }
    return '';
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (trim(attr(el, 'role')).toLowerCase().split(' ')[0] !== 'img') continue;
    if (tagOf(el) === 'img' || isOuterSvg(el)) continue;
    if (insideAriaHidden(el)) continue;
    applicableCount += 1;

    if (ariaName(el)) continue;

    const element = tagOf(el);
    if (svgTitleChildText(el)) continue;

    const titleOnly = !!trim(attr(el, 'title'));
    fails.push(
      helpers.reportOccurrence(el, {
        summary: titleOnly
          ? `This <${element}> with role="img" is named only by its title attribute; RGAA accepts only aria-labelledby or aria-label.`
          : `This <${element}> with role="img" has no text alternative.`,
        hint: 'Give it an aria-label, or an aria-labelledby that points to text describing the image.',
        i18n: {
          summaryKey: titleOnly
            ? 'roleImgAriaName_summary_fail_titleOnly'
            : 'roleImgAriaName_summary_fail_missing',
          hintKey: 'roleImgAriaName_hint_fail',
          params: { element }
        },
        data: {
          details: { reasonCode: titleOnly ? 'titleOnly' : 'missingAlternative' },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
