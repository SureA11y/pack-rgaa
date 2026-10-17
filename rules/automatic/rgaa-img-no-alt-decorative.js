/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-img-no-alt-decorative
 * @atomic true
 * @summary An <img> with no alt attribute fails 1.2.1 if it is decorative
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <img> elements with no alt attribute, or an alt of only
 *   spaces, which is not the empty alt 1.2.1 asks for, and no alternative
 *   (no non-empty aria-label, aria-labelledby or title), not marked
 *   decorative (role="presentation"/"none"), not hidden with
 *   aria-hidden="true" on itself or an ancestor (assistive technologies
 *   then ignore it, which is what criterion 1.2 asks), and not in
 *   a <figure> with a <figcaption> (criterion 1.2 does not apply to an
 *   image with a caption). An image that is the only content of a link or a
 *   button is left out: it carries the control's information, so it is not
 *   decorative, and rgaa-img-alt-present fails it under 1.1.1. Content hidden
 *   with CSS or the hidden attribute is left out too. A page with none is
 *   notApplicable.
 * @expectation
 *   Such an image fails one criterion, and which one depends on what it is:
 *   1.1.1 if it carries information (rgaa-img-alt-present fails it there), 1.2.1
 *   if it is decorative, since 1.2.1 step 2 asks a decorative <img> for
 *   alt="" (or aria-hidden="true", or role="presentation"). This rule
 *   reports the 1.2.1 side:
 *   - Fails a spacer: an image 2 px wide or high, or less, as rendered or,
 *     with no layout, by its width or height attribute. A line or a pixel
 *     carries no information.
 *   - Asks (cantTell) about the others: if the image is decorative, it
 *     fails 1.2.1; if it carries information, 1.1.1 only. A person decides.
 * @implementation-notes
 * - img-alt-present used to be linked to both 1.1.1 and 1.2.1, so every
 *   image with no alt failed both criteria, though it fails only one: on
 *   bordeaux.fr, social icons that are the only content of their links
 *   failed 1.2. rgaa-img-alt-present now takes 1.1.1 and leaves spacers
 *   out, so a spacer fails here alone.
 * - A rendered size of 0 says nothing (an image not loaded yet), so it is
 *   asked about.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-img-no-alt-decorative';

const meta = {
  title: 'Decorative images with no alt attribute',
  description:
    'Checks each <img> with no alt attribute and no alternative: fails a spacer image, and asks whether the others are decorative.',
  i18n: {
    titleKey: 'imgNoAltDecorative_title',
    descriptionKey: 'imgNoAltDecorative_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
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

  // aria-hidden="true" on the image or an ancestor: it is ignored by
  // assistive technologies, which is what criterion 1.2 asks.
  function insideAriaHidden(el) {
    for (let n = el; n && dom.nodeType(n) === 1; n = dom.parentElement(n)) {
      if (trim(attr(n, 'aria-hidden')).toLowerCase() === 'true') return true;
    }
    return false;
  }

  function hasCaption(el) {
    const figure = dom.get(el, 'closest') ? dom.closest(el, 'figure') : null;
    if (!figure) return false;
    return Array.from(dom.querySelectorAll(figure, ':scope > *')).some(
      (c) => tagOf(c) === 'figcaption'
    );
  }

  // The link or button the image is the only content of, or null.
  function controlOf(el) {
    let control = null;
    for (let a = dom.parentElement(el); a && !control; a = dom.parentElement(a)) {
      const tag = tagOf(a);
      const role = helpers.aria.getExplicitRole(a);
      if (role === 'link' || role === 'button') control = a;
      else if (!role && ((tag === 'a' && dom.hasAttribute(a, 'href')) || tag === 'button')) {
        control = a;
      }
    }
    if (!control) return null;
    if (trim(dom.textContent(control))) return null;
    const others = Array.from(dom.querySelectorAll(control, 'img, svg, [role~="img" i]')).filter(
      (n) =>
        n !== el && (['img', 'svg'].includes(tagOf(n)) || helpers.aria.getExplicitRole(n) === 'img')
    );
    return others.length ? null : control;
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

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    // alt="" is the decorative marker; an alt of only spaces is not, and
    // 1.2.1 asks a decorative <img> for an empty one.
    const blank = dom.hasAttribute(el, 'alt');
    if (blank && (attr(el, 'alt') === '' || trim(attr(el, 'alt')))) continue;
    if (insideAriaHidden(el)) continue;
    const role = trim(attr(el, 'role')).toLowerCase().split(' ')[0];
    if (role === 'none' || role === 'presentation') continue;
    if (['aria-labelledby', 'aria-label', 'title'].some((n) => trim(attr(el, n)))) continue;
    if (hasCaption(el)) continue;
    if (controlOf(el)) continue;
    applicableCount += 1;

    const s = size(el, layout);
    if (isSpacer(s)) {
      const width = s.width == null ? null : Math.round(s.width);
      const height = s.height == null ? null : Math.round(s.height);
      fails.push(
        helpers.reportOccurrence(el, {
          summary: blank
            ? `This image is ${width ?? '?'} by ${height ?? '?'} px, so it is decorative, and its alt is only spaces, not empty.`
            : `This image is ${width ?? '?'} by ${height ?? '?'} px, so it is decorative, and it has no alt attribute.`,
          hint: 'Give a decorative image an empty alt (alt=""), or draw it with CSS.',
          i18n: {
            summaryKey: blank
              ? 'imgNoAltDecorative_summary_fail_blank'
              : 'imgNoAltDecorative_summary_fail',
            hintKey: 'imgNoAltDecorative_hint_fail',
            params: { width: width ?? '?', height: height ?? '?' }
          },
          data: {
            details: { reasonCode: blank ? 'spacerBlankAlt' : 'spacerNoAlt', width, height },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }

    cantTells.push(
      helpers.reportOccurrence(el, {
        summary: blank
          ? 'This image has an alt of only spaces. If it is decorative, it fails 1.2.1; if it carries information, 1.1.1.'
          : 'This image has no alt attribute. If it is decorative, it fails 1.2.1; if it carries information, 1.1.1.',
        hint: 'If the image is decorative, give it an empty alt (alt=""). If it carries information, give it an alt text that says what it shows.',
        i18n: {
          summaryKey: blank
            ? 'imgNoAltDecorative_summary_cantTell_blank'
            : 'imgNoAltDecorative_summary_cantTell',
          hintKey: 'imgNoAltDecorative_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the image is decorative or carries information.',
          evidence: { reasonCode: blank ? 'blankAltUnknownRole' : 'noAltUnknownRole' }
        },
        data: {
          details: { reasonCode: blank ? 'blankAltUnknownRole' : 'noAltUnknownRole' },
          visibilityFilter: VF
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'minor');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
