/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-script-redirect-review
 * @atomic true
 * @summary A redirection done by a script after a delay can be controlled
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to inline <script> elements whose code loads another address
 *   from a timer: setTimeout or setInterval followed, within a few hundred
 *   characters, by an assignment to location or location.href, or a call
 *   to location.assign or location.replace. A page with none is
 *   notApplicable.
 * @expectation
 *   RGAA 13.1.3: each redirection done by a script lets the user stop or
 *   restart it, extend its time limit ten times at least, or be warned
 *   with twenty seconds to extend it, unless the limit is twenty hours or
 *   more. A timed redirection is asked about (timedScriptRedirect), for a
 *   person to check which of these holds.
 * @implementation-notes
 * - Manual (cantTell).
 * - Script files are not read; a redirection they hold is not found.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-script-redirect-review';

const meta = {
  title: 'A timed redirection done by a script can be controlled',
  description:
    'Flags each inline script that loads another address from a timer, for a person to check that the user can stop, extend or be warned of the redirection.',
  i18n: {
    titleKey: 'scriptRedirectReview_title',
    descriptionKey: 'scriptRedirectReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'scripts', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const TIMED =
    /set(?:Timeout|Interval)\s*\([\s\S]{0,400}?(?:location(?:\.href)?\s*=(?!=)|location\.(?:assign|replace)\s*\()/;
  const DATA = /json|template|text\/x-|text\/html/i;

  const occurrences = [];
  for (const script of Array.from(dom.querySelectorAll(document, 'script:not([src])'))) {
    const type = String(dom.getAttribute(script, 'type') || '');
    if (DATA.test(type)) continue;
    const code = String(dom.textContent(script) || '');
    const m = TIMED.exec(code);
    if (!m) continue;
    const excerpt = m[0].replace(/\s+/g, ' ').slice(0, 80);
    occurrences.push(
      helpers.reportOccurrence(script, {
        summary: `This script loads another address after a delay ("${excerpt}").`,
        hint: 'Check that the user can stop or restart the redirection, extend its delay ten times at least, or is warned with twenty seconds to extend it (RGAA 13.1.3).',
        i18n: {
          summaryKey: 'scriptRedirectReview_summary_cantTell',
          hintKey: 'scriptRedirectReview_hint_cantTell',
          params: { code: excerpt }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the user can control the timed redirection.'
        },
        data: {
          details: { reasonCode: 'timedScriptRedirect', code: excerpt },
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
