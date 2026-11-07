/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-text-image-review
 * @atomic true
 * @summary Images of text that carry information are replaced by styled text where possible
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible images that likely show text (glossary « Image
 *   texte »), with a text alternative, so informative: an image button
 *   (<input type="image">), an image inside a heading, and an <img> or
 *   role="img" whose file name, class or id names text, a title, a banner
 *   or a button (texte, text, titre, title, bandeau, banner, slogan,
 *   bouton, button, btn). Logos and brand names are left out (1.8's
 *   particular case): an image whose alternative, file name, class or id,
 *   or that of an ancestor, says logo, marque or brand. A page with none is
 *   notApplicable.
 * @expectation
 *   RGAA 1.8.1 and 1.8.2: each informative image of text, « en l’absence
 *   d’un mécanisme de remplacement, doit si possible être remplacée par du
 *   texte stylé ». Whether the image holds text, whether a replacement
 *   mechanism exists, and whether its rendering is essential are for a
 *   person, so each such image is asked about (imageButton,
 *   imageInHeading, textImageName), one occurrence per element.
 * @implementation-notes
 * - Manual (cantTell).
 * - Images of <object>, <embed>, <canvas> and <svg> (1.8.3 to 1.8.6) are
 *   not looked at: nothing in their markup says they hold text.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-text-image-review';

const meta = {
  title: 'Images of text that carry information are replaced by styled text where possible',
  description:
    'Flags image buttons, images in headings and images named like text or banners, outside logos, for a person to check whether they show text that styled text could replace.',
  i18n: {
    titleKey: 'textImageReview_title',
    descriptionKey: 'textImageReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['imageButton', 'imageInHeading', 'textImageName'],
  review: {
    imageButton: {
      steps: [
        'Find the image button the report names, and look at it on screen.',
        'Decide whether the image shows text.',
        'If it does, decide whether styled text could look the same, or whether the effect cannot be done with CSS.',
        'Look for a control on the page that replaces the image with text.'
      ],
      passWhen:
        'The image shows no text, a control replaces it with text, or its effect cannot be done with CSS.',
      failWhen:
        'The image shows text that styled text could replace, with no control to replace it, which fails RGAA 1.8.2.'
    },
    imageInHeading: {
      steps: [
        'Find the image the report names, inside a heading, and look at it on screen.',
        'Decide whether the image shows text.',
        'If it does, decide whether styled text could look the same, or whether the effect cannot be done with CSS.',
        'Look for a control on the page that replaces the image with text.'
      ],
      passWhen:
        'The image shows no text, a control replaces it with text, or its effect cannot be done with CSS.',
      failWhen:
        'The image shows text that styled text could replace, with no control to replace it, which fails RGAA 1.8.1.'
    },
    textImageName: {
      steps: [
        'Find the image the report names, and look at it on screen: its file name, class or id suggests it shows text.',
        'Decide whether the image shows text, leaving out logos and brand names.',
        'If it does, decide whether styled text could look the same, or whether the effect cannot be done with CSS.',
        'Look for a control on the page that replaces the image with text.'
      ],
      passWhen:
        'The image shows no text, a control replaces it with text, or its effect cannot be done with CSS.',
      failWhen:
        'The image shows text that styled text could replace, with no control to replace it, which fails RGAA 1.8.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const norm = (v) =>
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
  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };
  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }
  const query = (sel) =>
    helpers.queryAllSmart ? helpers.queryAllSmart(sel) : helpers.queryAll(sel);

  const LOGO = /logo|marque|brand/i;
  // File names and classes that name text: split on separators, so that
  // « context » or « subtitle-photo » do not match « text » or « title ».
  const TEXT_NAME =
    /(?:^|[^a-z])(?:textes?|texts?|titres?|titles?|bandeaux?|bandeau|banners?|slogans?|boutons?|buttons?|btn)(?:$|[^a-z])/i;

  function alternative(el) {
    const ref = norm(attr(el, 'aria-labelledby'));
    if (ref) {
      const parts = ref
        .split(' ')
        .map((r) => {
          try {
            const t = helpers.getElementByIdInTree(el, r);
            return t ? norm(dom.textContent(t)) : '';
          } catch {
            return '';
          }
        })
        .filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    return norm(attr(el, 'aria-label')) || norm(attr(el, 'alt')) || norm(attr(el, 'title'));
  }
  const fileName = (el) =>
    String(attr(el, 'src') || '')
      .split(/[?#]/)[0]
      .split('/')
      .pop();
  function isLogo(el, alt) {
    if (LOGO.test(alt) || LOGO.test(fileName(el))) return true;
    let a = el;
    for (let i = 0; a && dom.nodeType(a) === 1 && i < 4; i += 1, a = dom.parentElement(a)) {
      if (LOGO.test(String(attr(a, 'class') || '')) || LOGO.test(String(attr(a, 'id') || ''))) {
        return true;
      }
    }
    return false;
  }
  function inHeading(el) {
    for (let a = dom.parentElement(el); a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (/^h[1-6]$/.test(tagOf(a)) || roleOf(a) === 'heading') return true;
    }
    return false;
  }
  const hidden = (el) => {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (norm(attr(a, 'aria-hidden')).toLowerCase() === 'true') return true;
    }
    return false;
  };

  const SUMMARY = {
    imageButton: 'This image button may show its label as an image of text ("{{alt}}").',
    imageInHeading: 'This image is part of a heading and may be an image of text ("{{alt}}").',
    textImageName: 'This image\'s file name or class suggests it shows text ("{{alt}}", {{name}}).'
  };
  const fill = (s, p) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => p[k]);

  const occurrences = [];
  const seen = new Set();
  function ask(el, kind, params) {
    if (seen.has(el)) return;
    seen.add(el);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: fill(SUMMARY[kind], params),
        hint: 'If the image shows text that carries information, replace it with styled text, unless a mechanism lets the user replace it or its exact rendering is essential (RGAA 1.8).',
        i18n: {
          summaryKey: `textImageReview_summary_cantTell_${kind}`,
          hintKey: 'textImageReview_hint_cantTell',
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the image holds text that styled text could replace.'
        },
        data: {
          details: { reasonCode: kind, ...params },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  for (const el of query('input, img, [role~="img" i]')) {
    const tag = tagOf(el);
    const button = tag === 'input' && String(attr(el, 'type') || '').toLowerCase() === 'image';
    if (tag === 'input' && !button) continue;
    if (tag !== 'img' && !button && roleOf(el) !== 'img') continue;
    if (tag === 'svg') continue;
    const alt = alternative(el);
    if (!alt || hidden(el) || !visible(el) || isLogo(el, alt)) continue;
    if (button) {
      ask(el, 'imageButton', { alt });
      continue;
    }
    if (inHeading(el)) {
      ask(el, 'imageInHeading', { alt });
      continue;
    }
    const name = [fileName(el), String(attr(el, 'class') || ''), String(attr(el, 'id') || '')]
      .map(norm)
      .find((v) => v && TEXT_NAME.test(v));
    if (name) ask(el, 'textImageName', { alt, name });
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
