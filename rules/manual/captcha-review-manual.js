/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-captcha-review
 * @atomic true
 * @summary CAPTCHA images have a relevant alternative and a non-graphic way in
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible CAPTCHAs (glossary « CAPTCHA »): an image (<img>,
 *   <area>, <input type="image">, <svg>, <canvas>, an image <object> or
 *   <embed>, role="img") whose alternative, file name, id, class or name
 *   says captcha; and a reCAPTCHA or hCaptcha widget (its frame, or the
 *   element the service fills). A page with none is notApplicable.
 * @expectation
 *   RGAA 1.4: the alternative of an image used as a CAPTCHA « permet
 *   d’identifier la nature et la fonction de l’image ». RGAA 1.5: for each
 *   image used as a CAPTCHA, « il existe une autre forme de CAPTCHA non
 *   graphique, au moins » or « une autre solution d’accès à la
 *   fonctionnalité ». Both are for a person, so each CAPTCHA is asked
 *   about (imageCaptcha, under 1.4 and 1.5; captchaWidget, whose images
 *   come from another site, under 1.5), one occurrence per element.
 * @implementation-notes
 * - Manual (cantTell).
 * - A CAPTCHA that names itself nowhere in the markup is not found.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-captcha-review';

const meta = {
  title: 'CAPTCHA images have a relevant alternative and a non-graphic way in',
  description:
    'Flags CAPTCHA images and reCAPTCHA or hCaptcha widgets, for a person to check that the alternative says what the CAPTCHA is and does, and that a non-graphic CAPTCHA or another way to the function is offered.',
  i18n: {
    titleKey: 'captchaReview_title',
    descriptionKey: 'captchaReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['imageCaptcha', 'captchaWidget'],
  review: {
    imageCaptcha: {
      steps: [
        'Find the image the report names, used as a CAPTCHA, a test that tells people from programs.',
        'Read its text alternative: it should say what the image is and what it is for, such as "Security image: type the letters shown".',
        'Look next to it for a form of the test that needs no sight, such as an audio or a text question, or another way to the same function, such as a telephone number.'
      ],
      passWhen:
        'The alternative says what the image is and does, and a non-graphic test or another way in is offered.',
      failWhen:
        'The alternative does not say what the image is and does, which fails RGAA 1.4; or nothing but the image gives access, which fails RGAA 1.5.'
    },
    captchaWidget: {
      steps: [
        'Find the CAPTCHA the report names, a test from another service that tells people from programs.',
        'Run it, and when it shows images look for an audio or other non-graphic version.',
        'Look around it for another way to the same function, such as a telephone number or a contact form that needs no CAPTCHA.'
      ],
      passWhen:
        'The test offers a non-graphic version, or another way to the same function is offered.',
      failWhen:
        'Only images can get a person through, and nothing else gives access to the function, which fails RGAA 1.5.'
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

  const CAPTCHA = /captcha|securimage/i;
  const WIDGETS = [
    {
      service: 'reCAPTCHA',
      src: /(?:google\.com|recaptcha\.net)\/recaptcha\//i,
      cls: /\bg-recaptcha\b/
    },
    { service: 'hCaptcha', src: /hcaptcha\.com\//i, cls: /\bh-captcha\b/ }
  ];

  const alternative = (el) =>
    norm(attr(el, 'aria-label')) || norm(attr(el, 'alt')) || norm(attr(el, 'title'));

  const occurrences = [];
  const seen = new Set();
  function ask(el, kind, params) {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (seen.has(a)) return;
    }
    seen.add(el);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          kind === 'imageCaptcha'
            ? `This image looks like a CAPTCHA (alternative: "${params.alt}").`
            : `This is a ${params.service} CAPTCHA.`,
        hint:
          kind === 'imageCaptcha'
            ? 'Check that its alternative says what the CAPTCHA is and what to do (RGAA 1.4), and that a non-graphic CAPTCHA, or another way to the function it protects, is offered (RGAA 1.5).'
            : 'Check that a non-graphic CAPTCHA, or another way to the function it protects, is offered (RGAA 1.5).',
        i18n: {
          summaryKey: `captchaReview_summary_cantTell_${kind}`,
          hintKey: `captchaReview_hint_cantTell_${kind}`,
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether the CAPTCHA has a relevant alternative and a non-graphic CAPTCHA or another way in.'
        },
        data: {
          details: { reasonCode: kind, ...params },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  // Widgets first, so an image inside one is not asked about again.
  for (const el of query('iframe, div, span')) {
    const src = String(attr(el, 'src') || '');
    const cls = String(attr(el, 'class') || '');
    const w = WIDGETS.find((x) => (tagOf(el) === 'iframe' ? x.src.test(src) : x.cls.test(cls)));
    if (!w || !visible(el)) continue;
    // A service's frame inside its own container is the same CAPTCHA.
    ask(el, 'captchaWidget', { service: w.service });
  }

  for (const el of query('img, area, input, svg, canvas, object, embed, [role~="img" i]')) {
    const tag = tagOf(el);
    if (tag === 'input' && String(attr(el, 'type') || '').toLowerCase() !== 'image') continue;
    if (
      (tag === 'object' || tag === 'embed') &&
      !/^image\//i.test(String(attr(el, 'type') || ''))
    ) {
      continue;
    }
    if (
      !['img', 'area', 'input', 'svg', 'canvas', 'object', 'embed'].includes(tag) &&
      roleOf(el) !== 'img'
    ) {
      continue;
    }
    const alt = alternative(el);
    const marks = [
      alt,
      String(attr(el, 'src') || attr(el, 'data') || ''),
      String(attr(el, 'id') || ''),
      String(attr(el, 'class') || ''),
      String(attr(el, 'name') || '')
    ];
    if (!marks.some((m) => CAPTCHA.test(m))) continue;
    if (tag !== 'area' && !visible(el)) continue;
    ask(el, 'imageCaptcha', { alt, element: tag });
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
