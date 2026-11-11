/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-figure-caption-structure
 * @atomic true
 * @summary An image with a caption must be structured as RGAA 1.9 describes
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <figure> elements that contain an image and a <figcaption>
 *   with text. The images are those of RGAA 1.9's five tests: an <img>,
 *   <input type="image"> or element with role="img" (1.9.1), an
 *   <object type="image/…"> (1.9.2), an <embed> (1.9.3), an <svg> (1.9.4)
 *   and a <canvas> (1.9.5). An <embed> whose type is not an image type is
 *   not an image. The caption and the image must both be rendered: one hidden
 *   with CSS or the hidden attribute is none to a user (glossary « Contenu
 *   caché »). A page with none is notApplicable.
 * @expectation
 *   The <figure> has role="figure" or role="group", and an aria-label whose
 *   text is the same as the caption's, whitespace collapsed (conditions 2
 *   and 3 of each 1.9 test). The caption being inside a <figcaption> is
 *   what makes the figure applicable.
 * @reports
 *   - `reasonCode`: the first condition that fails, `missingRole`,
 *     `missingAriaLabel` or `ariaLabelMismatch`; `reasons` lists all.
 *   - `imageKind`: the figure's first image, in tree order, by the 1.9 test
 *     it belongs to: `img` (1.9.1), `object` (1.9.2), `embed` (1.9.3),
 *     `svg` (1.9.4) or `canvas` (1.9.5). An <svg> or <canvas> with
 *     role="img" counts by its element.
 *   - `caption`: the caption's text, whitespace collapsed.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG requires neither the explicit role nor the
 *   repeated label, so the rule runs only under the rgaa-4.1.2 profile, the
 *   `rgaa` tag or its own id.
 * - One occurrence per figure, whatever the number of images in it.
 * - An element with role="img" inside an <svg> is part of that image, not
 *   one of its own.
 * - An image with a caption that is not in a <figure> at all cannot be found
 *   by markup; that stays with a person.
 */

const id = 'rgaa-figure-caption-structure';

const meta = {
  title: 'Images with a caption use the figure structure RGAA describes',
  description:
    'Checks that a <figure> holding an image and a <figcaption> has role="figure" or "group" and an aria-label matching the caption.',
  i18n: {
    titleKey: 'figureCaptionStructure_title',
    descriptionKey: 'figureCaptionStructure_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['missingRole', 'missingAriaLabel', 'ariaLabelMismatch']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const collapse = (s) =>
    String(s || '')
      .replace(/\s+/g, ' ')
      .trim();

  // The 1.9 test an element belongs to as an image, or null if it is none.
  // An <svg> or <canvas> counts by its element, whatever its role; inside an
  // <svg>, an element is part of that image. An element with role img is one
  // whose role resolves to img: role="link img" is a link.
  function imageKind(el) {
    const tag = String(dom.tagName(el) || '').toLowerCase();
    const type = String(dom.getAttribute(el, 'type') || '')
      .trim()
      .toLowerCase();
    if (tag === 'svg') {
      const parent = dom.parentElement(el);
      return parent && dom.closest(parent, 'svg') ? null : 'svg';
    }
    if (tag === 'canvas') return 'canvas';
    if (tag === 'object') return type.startsWith('image/') ? 'object' : null;
    if (tag === 'embed') return !type || type.startsWith('image/') ? 'embed' : null;
    if (dom.closest(el, 'svg')) return null;
    if (tag === 'img' || (tag === 'input' && type === 'image')) return 'img';
    return helpers.aria.getExplicitRole(el) === 'img' ? 'img' : null;
  }

  // Rendered: a caption or an image hidden with CSS or the hidden attribute
  // is no caption or image to a user (glossary « Contenu caché »).
  function shown(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
      if (helpers.getEligibilityInfo) {
        return !!helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }

  const figures = helpers.queryAllSmart
    ? helpers.queryAllSmart('figure')
    : helpers.queryAll('figure');

  const occurrences = [];
  let applicableCount = 0;

  for (const figure of figures) {
    if (!figure || !dom.get(figure, 'getAttribute')) continue;
    const caption = [...dom.querySelectorAll(figure, ':scope > *')].find(
      (c) => String(dom.tagName(c)).toLowerCase() === 'figcaption' && shown(c)
    );
    const captionText = caption ? collapse(dom.textContent(caption)) : '';
    // Every element, not a selector list: jsdom returns a list's matches out
    // of tree order, and the first image decides the test.
    const image = [...dom.querySelectorAll(figure, '*')].find(
      (el) => dom.closest(el, 'figure') === figure && imageKind(el) && shown(el)
    );
    if (!captionText || !image) continue;
    const kind = imageKind(image);
    applicableCount += 1;

    const role = helpers.aria.getExplicitRole(figure);
    const label = collapse(dom.getAttribute(figure, 'aria-label'));
    const clip = (t) => (t.length > 120 ? `${t.slice(0, 119)}…` : t);

    const reasons = [];
    if (role !== 'figure' && role !== 'group') reasons.push('missingRole');
    if (!label) reasons.push('missingAriaLabel');
    else if (label !== captionText) reasons.push('ariaLabelMismatch');
    if (!reasons.length) continue;

    const reasonCode = reasons[0];
    const texts = {
      missingRole: [
        'This figure holds an image and a caption but has no role="figure" or role="group".',
        'figureCaptionStructure_summary_fail_role'
      ],
      missingAriaLabel: [
        'This figure holds an image and a caption but has no aria-label repeating the caption.',
        'figureCaptionStructure_summary_fail_label'
      ],
      ariaLabelMismatch: [
        `This figure's aria-label, "${clip(label)}", differs from its caption, "${clip(captionText)}".`,
        'figureCaptionStructure_summary_fail_mismatch'
      ]
    };
    const mismatch = reasonCode === 'ariaLabelMismatch';

    occurrences.push(
      helpers.reportOccurrence(figure, {
        summary: texts[reasonCode][0],
        hint: mismatch
          ? `Give the aria-label the caption's text, exactly: aria-label="${clip(captionText)}".`
          : 'Give the <figure> role="figure" and an aria-label with the same text as its <figcaption>.',
        i18n: {
          summaryKey: texts[reasonCode][1],
          hintKey: mismatch
            ? 'figureCaptionStructure_hint_fail_mismatch'
            : 'figureCaptionStructure_hint_fail',
          params: mismatch ? { label: clip(label), caption: clip(captionText) } : {}
        },
        data: {
          details: { reasonCode, reasons, imageKind: kind, caption: captionText },
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
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
