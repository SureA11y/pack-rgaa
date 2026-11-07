/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-object-embed-decorative-aria-hidden
 * @atomic true
 * @summary A decorative image object or embed must have aria-hidden="true" and no alternative
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <object> and <embed> elements of an image type
 *   (type="image/…") marked decorative: with aria-hidden="true" on the
 *   element, or with role="none"/"presentation". One inside a <figure>
 *   with a <figcaption> is left out: criterion 1.2 does not apply to an
 *   image with a caption (légende). Content hidden with CSS or the hidden
 *   attribute is left out too. A page with none is notApplicable.
 * @expectation
 *   RGAA 1.2.3 (<object>) and 1.2.6 (<embed>): a decorative image has
 *   aria-hidden="true" and no text alternative, on itself or its children,
 *   and an <object> no text between <object> and </object>.
 *   Fails:
 *   - aria-hidden="true" with an alternative (hiddenImageHasAlternative).
 *     If the image is decorative, it breaks 1.2.3 or 1.2.6; if it carries
 *     information, hiding it breaks 1.1.6 or 1.1.7. Either way the page
 *     fails;
 *   - role="none"/"presentation" without aria-hidden="true" and no
 *     content (presentationWithoutAriaHidden): the role marks it
 *     decorative, and RGAA asks for aria-hidden="true".
 *   Asks (cantTell): an <object> with role="none"/"presentation", no
 *   aria-hidden="true" and content inside it (presentationWithContent):
 *   that content may be its alternative.
 * @implementation-notes
 * - Its runInPage follows rgaa-canvas-decorative-aria-hidden (1.2.5).
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-object-embed-decorative-aria-hidden';

const meta = {
  title: 'Decorative image objects and embeds have aria-hidden="true" and no alternative',
  description:
    'Checks that an <object> or <embed> image marked decorative has aria-hidden="true", no aria-labelledby, aria-label or title, and no alternative content inside it.',
  i18n: {
    titleKey: 'objectEmbedDecorativeAriaHidden_title',
    descriptionKey: 'objectEmbedDecorativeAriaHidden_description'
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
  reasonCodes: [
    'hiddenImageHasAlternative',
    'presentationWithoutAriaHidden',
    'presentationWithContent'
  ],
  review: {
    presentationWithContent: {
      steps: [
        'Find the <object> the report names: it has role="none" or role="presentation", no aria-hidden="true", and content between its tags.',
        'Look at the image on screen, and decide whether it carries information or only decorates.',
        'Read the content between <object> and </object>, and compare it with what the image shows.'
      ],
      passWhen:
        'The image carries information and that content gives the same information, so RGAA 1.2.3 does not apply; removing the role settles it.',
      failWhen:
        'The image is decorative, with no aria-hidden="true" and with content inside it, which fails RGAA 1.2.3.'
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

  function hasCaption(el) {
    const figure = dom.get(el, 'closest') ? dom.closest(el, 'figure') : null;
    if (!figure) return false;
    return Array.from(dom.querySelectorAll(figure, ':scope > *')).some(
      (c) => tagOf(c) === 'figcaption'
    );
  }

  // The alternatives 1.2.3 and 1.2.6 forbid, on the element and its
  // children.
  function alternativesOf(el) {
    const found = [];
    for (const name of ['aria-labelledby', 'aria-label', 'title']) {
      if (trim(attr(el, name))) found.push(name);
    }
    const children = Array.from(dom.querySelectorAll(el, '*'));
    const childAlt = children.some((c) =>
      ['alt', 'aria-label', 'aria-labelledby', 'title'].some((n) => trim(attr(c, n)))
    );
    if (childAlt) found.push('childAlternative');
    if (trim(dom.textContent(el))) found.push('fallbackContent');
    return found;
  }

  // Attribute names as written; content inside as <object>…</object>.
  function display(found, tag) {
    const out = found.filter((f) => f !== 'childAlternative' && f !== 'fallbackContent');
    if (found.length > out.length) out.push(`<${tag}>…</${tag}>`);
    return out.join(', ');
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('object[type^="image/" i], embed[type^="image/" i]')
    : helpers.queryAll('object[type^="image/" i], embed[type^="image/" i]');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const ariaHidden = trim(attr(el, 'aria-hidden')).toLowerCase() === 'true';
    const role = trim(attr(el, 'role')).toLowerCase().split(' ')[0];
    const presentational = role === 'none' || role === 'presentation';
    if (!ariaHidden && !presentational) continue;
    if (hasCaption(el)) continue;
    applicableCount += 1;

    const tag = tagOf(el);
    const test = tag === 'object' ? '1.2.3' : '1.2.6';
    const found = alternativesOf(el);
    const alternatives = display(found, tag);

    if (ariaHidden) {
      if (!found.length) continue;
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This <${tag}> image is hidden with aria-hidden="true" but carries an alternative: ${alternatives}.`,
          hint: `If the image is decorative, remove the alternative (RGAA ${test}). If it carries information, remove aria-hidden and give it role="img" and an aria-label or aria-labelledby.`,
          i18n: {
            summaryKey: 'objectEmbedDecorativeAriaHidden_summary_fail_hidden',
            hintKey: 'objectEmbedDecorativeAriaHidden_hint_fail_hidden',
            params: { alternatives, tag, test }
          },
          data: {
            details: { reasonCode: 'hiddenImageHasAlternative', alternatives: found, tag },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }

    if (found.includes('fallbackContent') || found.includes('childAlternative')) {
      cantTells.push(
        helpers.reportOccurrence(el, {
          summary: `This <${tag} role="${role}"> has no aria-hidden="true" and has content between <${tag}> and </${tag}>.`,
          hint: 'If the image carries information, remove the role and keep the content as its alternative. If it is decorative, add aria-hidden="true" and remove the content.',
          i18n: {
            summaryKey: 'objectEmbedDecorativeAriaHidden_summary_cantTell_content',
            hintKey: 'objectEmbedDecorativeAriaHidden_hint_cantTell_content',
            params: { role, tag, test }
          },
          data: {
            details: { reasonCode: 'presentationWithContent', role, alternatives: found, tag },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }

    fails.push(
      helpers.reportOccurrence(el, {
        summary: `This <${tag} role="${role}"> is marked decorative but has no aria-hidden="true".`,
        hint: `Add aria-hidden="true" to a decorative image, and give it no aria-label, aria-labelledby or title (RGAA ${test}).`,
        i18n: {
          summaryKey: 'objectEmbedDecorativeAriaHidden_summary_fail_role',
          hintKey: 'objectEmbedDecorativeAriaHidden_hint_fail_role',
          params: { role, tag, test }
        },
        data: {
          details: { reasonCode: 'presentationWithoutAriaHidden', role, alternatives: found, tag },
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
