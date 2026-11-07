/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-svg-decorative-aria-hidden
 * @atomic true
 * @summary A decorative SVG must be hidden with aria-hidden="true"
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to outer <svg> elements exposed to assistive technologies: no
 *   aria-hidden="true" on themselves or an ancestor, no role="img" or
 *   graphics role, that draw something of their own (not a sprite sheet of
 *   <defs> and <symbol>), and that may be decorative: not the only content
 *   of a link or a button, not focusable themselves (tabindex 0 or more),
 *   and not in a <figure> with a <figcaption> (criterion 1.2 does not apply
 *   to an image with a caption). Content hidden with CSS or the hidden
 *   attribute is left out. A page with none is notApplicable.
 * @expectation
 *   RGAA 1.2.4 asks a decorative <svg> for aria-hidden="true", and for no
 *   alternative, no non-empty <title> or <desc>, and no title attribute.
 *   - An <svg> with role="presentation" or role="none" fails
 *     (presentationWithoutAriaHidden): the author marks it decorative, and
 *     unlike 1.2.1 for <img>, 1.2.4 accepts only aria-hidden="true".
 *   - Any other is asked about (cantTell): if it is decorative, such as an
 *     icon beside a button's text, it fails 1.2.4; if it carries
 *     information, 1.1.5 applies instead, which rgaa-svg-role-img and
 *     svg-text-alternative-present check. The 1.2.x methodology leaves that
 *     call to a person.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-svg-decorative-aria-hidden';

const meta = {
  title: 'Decorative SVGs are hidden with aria-hidden="true"',
  description:
    'Checks each <svg> exposed to assistive technologies that may be decorative: fails one marked role="presentation" without aria-hidden="true", and asks about the others.',
  i18n: {
    titleKey: 'svgDecorativeAriaHidden_title',
    descriptionKey: 'svgDecorativeAriaHidden_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'svg', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['presentationWithoutAriaHidden', 'exposedMayBeDecorative'],
  review: {
    exposedMayBeDecorative: {
      steps: [
        'Find the <svg> the report names.',
        'Look at it on screen, with the text around it.',
        'Decide whether it only decorates, such as an icon beside a text that says the same thing, or carries information.'
      ],
      passWhen:
        'The image carries information, so RGAA 1.2.4 does not apply to it; RGAA 1.1.5 then asks it for role="img" and a text alternative.',
      failWhen:
        'The image is decorative and is not hidden with aria-hidden="true", which fails RGAA 1.2.4.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

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
  const firstRole = (el) => trim(attr(el, 'role')).toLowerCase().split(' ')[0];

  function insideAriaHidden(el) {
    for (let n = el; n && dom.nodeType(n) === 1; n = parentOf(n)) {
      if (trim(attr(n, 'aria-hidden')).toLowerCase() === 'true') return true;
    }
    return false;
  }

  // Children an SVG never draws: what a sprite sheet holds.
  const NOT_DRAWN = new Set([
    'defs',
    'symbol',
    'title',
    'desc',
    'metadata',
    'style',
    'script',
    'lineargradient',
    'radialgradient',
    'pattern',
    'clippath',
    'mask',
    'filter',
    'marker'
  ]);
  const drawsNothing = (svg) =>
    [...dom.querySelectorAll(svg, ':scope > *')].every((c) => NOT_DRAWN.has(tagOf(c)));

  function hasCaption(el) {
    const figure = dom.get(el, 'closest') ? dom.closest(el, 'figure') : null;
    if (!figure) return false;
    return [...dom.querySelectorAll(figure, ':scope > *')].some(
      (c) => tagOf(c) === 'figcaption' && trim(dom.textContent(c))
    );
  }

  // The only content of a link or a button, or an SVG that takes focus
  // itself: it carries information.
  function certainlyInformative(svg) {
    if (/^\d+$/.test(trim(attr(svg, 'tabindex')))) return true;
    let control = null;
    for (let a = parentOf(svg); a && dom.nodeType(a) === 1 && !control; a = parentOf(a)) {
      const tag = tagOf(a);
      const role = helpers.aria.getExplicitRole(a);
      if (role === 'link' || role === 'button') control = a;
      else if (!role && ((tag === 'a' && dom.hasAttribute(a, 'href')) || tag === 'button')) {
        control = a;
      }
    }
    if (!control) return false;
    if (
      [...dom.querySelectorAll(control, 'img, svg')].some((n) => n !== svg && !dom.contains(svg, n))
    ) {
      return false;
    }
    let walker = null;
    try {
      walker = dom.createTreeWalker(dom.ownerDocument(control), control, 4, null);
    } catch {}
    if (!walker) return false;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!trim(dom.nodeValue(n))) continue;
      const p = dom.parentElement(n);
      if (!p || !dom.closest(p, 'svg')) return false;
    }
    return true;
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('svg') : helpers.queryAll('svg');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const svg of nodes) {
    if (!svg || !dom.get(svg, 'getAttribute')) continue;
    const p = dom.parentElement(svg);
    if (p && dom.get(p, 'closest') && dom.closest(p, 'svg')) continue;
    if (insideAriaHidden(svg)) continue;
    const role = firstRole(svg);
    if (role === 'img' || role.startsWith('graphics-')) continue;
    if (drawsNothing(svg) || certainlyInformative(svg) || hasCaption(svg)) continue;
    applicableCount += 1;

    if (role === 'presentation' || role === 'none') {
      fails.push(
        helpers.reportOccurrence(svg, {
          summary: `This <svg> has role="${role}" but no aria-hidden="true", which RGAA 1.2.4 asks of a decorative SVG.`,
          hint: 'Add aria-hidden="true" to the decorative <svg>, and remove any <title>, <desc> or other alternative from it.',
          i18n: {
            summaryKey: 'svgDecorativeAriaHidden_summary_fail',
            hintKey: 'svgDecorativeAriaHidden_hint_fail',
            params: { role }
          },
          data: {
            details: { reasonCode: 'presentationWithoutAriaHidden', role },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }

    cantTells.push(
      helpers.reportOccurrence(svg, {
        summary:
          'This <svg> is exposed to assistive technologies. If it is decorative, it fails 1.2.4, which asks for aria-hidden="true" and no alternative; if it carries information, 1.1.5 applies.',
        hint: 'If the image is decorative, such as an icon beside text, add aria-hidden="true" and remove any <title> or other alternative. If it carries information, give it role="img" and an aria-label.',
        i18n: {
          summaryKey: 'svgDecorativeAriaHidden_summary_cantTell',
          hintKey: 'svgDecorativeAriaHidden_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the image is decorative or carries information.'
        },
        data: { details: { reasonCode: 'exposedMayBeDecorative' }, visibilityFilter: VF }
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
