/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-img-alt-present
 * @atomic true
 * @summary An <img> with no alt attribute fails 1.1.1, unless it is a spacer
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <img> elements included in the accessibility tree, as
 *   img-alt-present does: role="presentation" or role="none" leaves an image
 *   out only when it is not focusable, and hidden images are left out. A
 *   spacer is left out too: an image 2 px wide or high, or less, as rendered
 *   or, with no layout, by its width or height attribute, unless it is in a
 *   <figure> with a <figcaption> or is the only content of a link or a
 *   button. A page with none is notApplicable.
 * @expectation
 *   Each applicable <img> has an alt attribute (alt="" included), a
 *   non-empty aria-label or aria-labelledby, or a non-empty title. One with
 *   none of these fails 1.1.1 step 1: RGAA 1.1.1 asks each image carrying
 *   information for a text alternative. A spacer carries none, so it is
 *   decorative, and the alt="" it lacks is 1.2.1's matter, which
 *   rgaa-img-no-alt-decorative fails.
 * @implementation-notes
 * - img-alt-present, the WCAG rule, fails every such image, spacers
 *   included, as WCAG 1.1.1 covers decorative images too. RGAA splits them:
 *   1.1 for images carrying information, 1.2 for decorative ones. Linked to
 *   1.1.1, img-alt-present failed a spacer under 1.1 as well as
 *   rgaa-img-no-alt-decorative under 1.2. This rule takes 1.1.1 instead.
 * - An image that is not a spacer still fails here, decorative or not: it
 *   fails 1.1.1 if it carries information and 1.2.1 if it does not, and
 *   rgaa-img-no-alt-decorative asks which under 1.2.1.
 * - The spacer test is rgaa-img-no-alt-decorative's: a rendered size of 0
 *   by 0 (an image not loaded yet) says nothing, so it is not a spacer.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-img-alt-present';

const meta = {
  title: 'Images that are not spacers have an alt attribute',
  description:
    'Checks that each exposed <img> has an alt attribute or another text alternative, except a spacer image, which is decorative.',
  i18n: {
    titleKey: 'imgAltPresent_title',
    descriptionKey: 'imgAltPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  // An image this many px wide or high, or less, is a spacer.
  const SPACER = 2;

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

  function inAccTree(el) {
    const check =
      typeof helpers.isIncludedInAccessibilityTree === 'function'
        ? helpers.isIncludedInAccessibilityTree
        : typeof helpers.isAccTreeEligible === 'function'
          ? helpers.isAccTreeEligible
          : null;
    if (!check) return true;
    let r;
    try {
      r = check(el, ctx);
    } catch {
      return true;
    }
    if (r === false) return false;
    return !(r && r.eligible === false);
  }

  function focusable(el) {
    if (typeof helpers.getFocusableInfo !== 'function') return false;
    try {
      const fi = helpers.getFocusableInfo(el, ctx);
      return !!(fi && (fi.focusable || fi.tabbable));
    } catch {
      return false;
    }
  }

  function ariaNamed(el) {
    if (typeof helpers.getAriaNameInfo === 'function') {
      try {
        const info = helpers.getAriaNameInfo(el, ctx);
        if (info && info.present) return true;
      } catch {}
    }
    return false;
  }

  function hasLayout() {
    const probe = dom.documentElement(document) || null;
    if (!probe || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }

  function hasCaption(el) {
    const figure = dom.get(el, 'closest') ? dom.closest(el, 'figure') : null;
    if (!figure) return false;
    return Array.from(dom.querySelectorAll(figure, ':scope > *')).some(
      (c) => tagOf(c) === 'figcaption'
    );
  }

  // Whether the image is the only content of a link or button.
  function onlyContentOfControl(el) {
    let control = null;
    for (let a = dom.parentElement(el); a && !control; a = dom.parentElement(a)) {
      const tag = tagOf(a);
      const role = helpers.aria.getExplicitRole(a);
      if (role === 'link' || role === 'button') control = a;
      else if (!role && ((tag === 'a' && dom.hasAttribute(a, 'href')) || tag === 'button')) {
        control = a;
      }
    }
    if (!control) return false;
    if (trim(dom.textContent(control))) return false;
    return !Array.from(dom.querySelectorAll(control, 'img, svg, [role~="img" i]')).some(
      (n) =>
        n !== el && (['img', 'svg'].includes(tagOf(n)) || helpers.aria.getExplicitRole(n) === 'img')
    );
  }

  // The image's size as rendered, or by its attributes with no layout.
  function size(el, layout) {
    if (layout) {
      try {
        const r = dom.getBoundingClientRect(el);
        return { width: r.width, height: r.height };
      } catch {
        return null;
      }
    }
    const n = (name) => {
      const v = /^\s*(\d+(?:\.\d+)?)\s*(px)?\s*$/i.exec(String(attr(el, name) || ''));
      return v ? Number(v[1]) : null;
    };
    return { width: n('width'), height: n('height') };
  }

  const isSpacer = (s) =>
    !!s &&
    [s.width, s.height].some((d) => d != null && d <= SPACER) &&
    // Rendered at 0 by 0, an image says nothing about its size.
    !(s.width === 0 && s.height === 0);

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('img') : helpers.queryAll('img');
  const layout = hasLayout();

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!inAccTree(el)) continue;
    const role = helpers.aria.getExplicitRole(el);
    if ((role === 'presentation' || role === 'none') && !focusable(el)) continue;
    // A spacer is decorative: rgaa-img-no-alt-decorative fails it under 1.2.1.
    if (
      !dom.hasAttribute(el, 'alt') &&
      !hasCaption(el) &&
      !onlyContentOfControl(el) &&
      isSpacer(size(el, layout))
    ) {
      continue;
    }
    applicableCount += 1;

    // alt="" marks a decorative image; an alt of only spaces names nothing.
    const alt = attr(el, 'alt');
    if (alt === '' || (alt != null && trim(alt))) continue;
    if (ariaNamed(el)) continue;
    if (trim(attr(el, 'title'))) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This <img> has no alt attribute.',
        hint: 'Add an alt attribute that says what the image shows, or alt="" if the image is decorative.',
        i18n: {
          summaryKey: 'imgAltPresent_summary_fail',
          hintKey: 'imgAltPresent_hint_fail',
          params: {}
        },
        data: {
          details: { reasonCode: 'missingAlt' },
          visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
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
