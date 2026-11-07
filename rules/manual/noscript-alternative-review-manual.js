/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-noscript-alternative-review
 * @atomic true
 * @summary A <noscript> alternative gives similar content and features
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to each <noscript> element in the body whose content holds
 *   text. One holding only tags, such as a tracking image or frame, is no
 *   alternative and is left out. A page with none is notApplicable.
 * @expectation
 *   RGAA 7.2.1: a script with an alternative passes when « l'alternative
 *   entre <noscript> et </noscript> permet d'accéder à des contenus et des
 *   fonctionnalités similaires ». Each <noscript> with text is asked about
 *   (noscriptAlternative), for a person to compare it with what the script
 *   gives; a message such as « Activez JavaScript » gives neither.
 * @implementation-notes
 * - Manual (cantTell).
 * - With scripting on, browsers keep the content of <noscript> as raw
 *   text; tags are stripped from it before looking for text.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-noscript-alternative-review';

const meta = {
  title: 'A <noscript> alternative gives similar content and features',
  description:
    'Flags each <noscript> element with text, for a person to check that it gives content and features similar to those of the script.',
  i18n: {
    titleKey: 'noscriptAlternativeReview_title',
    descriptionKey: 'noscriptAlternativeReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'scripts', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['noscriptAlternative'],
  review: {
    noscriptAlternative: {
      steps: [
        'Find the <noscript> element the report names, and read its text in the report.',
        'With JavaScript on, note what the script gives at this place on the page.',
        'Turn JavaScript off in the browser, reload the page, and use what appears at this place.'
      ],
      passWhen: 'With JavaScript off, it gives access to the same content and to similar features.',
      failWhen:
        'With JavaScript off, it gives less, such as a message asking to turn JavaScript on, which fails RGAA 7.2.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const body = dom.body(document);
  const nodes = body ? [...dom.querySelectorAll(body, 'noscript')] : [];

  const occurrences = [];
  for (const el of nodes) {
    const raw = String(dom.textContent(el) || '');
    const text = raw
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!/\p{L}/u.test(text)) continue;
    const excerpt = text.slice(0, 80);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This <noscript> alternative says "${excerpt}".`,
        hint: 'Check that, with JavaScript off, it gives content and features similar to those of the script; a message asking to turn JavaScript on gives neither (RGAA 7.2.1).',
        i18n: {
          summaryKey: 'noscriptAlternativeReview_summary_cantTell',
          hintKey: 'noscriptAlternativeReview_hint_cantTell',
          params: { text: excerpt }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether the alternative gives content and features similar to those of the script.'
        },
        data: {
          details: { reasonCode: 'noscriptAlternative', text: excerpt },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
