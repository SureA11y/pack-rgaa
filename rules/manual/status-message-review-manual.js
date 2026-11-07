/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-status-message-review
 * @atomic true
 * @summary Status messages use role="status", "alert", "log" or "progressbar"
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible elements that look like status messages and carry
 *   none of the roles 7.5 names (status, alert, log, progressbar):
 *   - an element with aria-live, which shows the author meant it to be
 *     announced (liveWithoutRole);
 *   - an element whose class or id names a message (alert, message,
 *     notification, notice, toast, flash, success, error, warning,
 *     feedback), holding a short text of 40 words or less
 *     (possibleStatusMessage).
 *   An element inside one with such a role is left out. A page with none
 *   is notApplicable.
 * @expectation
 *   RGAA 7.5.1 to 7.5.3: a status message telling of a success, a result or
 *   a state uses role="status"; one with a suggestion or an error,
 *   role="alert"; one with a progress, role="log", "progressbar" or
 *   "status". The tests name the role attribute, so aria-live alone is not
 *   one of them. Whether the element is a status message (glossary
 *   « Message de statut »: a change in the content that informs the user
 *   without a change of context) is for a person, so each one is asked
 *   about.
 * @implementation-notes
 * - Manual (cantTell): a message shown at page load, or one that never
 *   changes, is no status message.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-status-message-review';

const meta = {
  title: 'Status messages use role="status", "alert", "log" or "progressbar"',
  description:
    'Flags elements that look like status messages (aria-live, or a class such as alert, message or error) with no status, alert, log or progressbar role, for a person to check the role they need.',
  i18n: {
    titleKey: 'statusMessageReview_title',
    descriptionKey: 'statusMessageReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'aria', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
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
  const STATUS_ROLES = new Set([
    'status',
    'alert',
    'log',
    'progressbar',
    'alertdialog',
    'timer',
    'marquee'
  ]);
  const NAME =
    /(?:^|[-_])(?:alert|alerts|message|messages|msg|notification|notifications|notice|toast|flash|success|error|errors|warning|feedback)(?:$|[-_])/i;

  const inStatus = (el) => {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (STATUS_ROLES.has(roleOf(a))) return true;
    }
    return false;
  };
  const named = (el) =>
    String(dom.getAttribute(el, 'class') || '')
      .split(/\s+/)
      .concat(String(dom.getAttribute(el, 'id') || ''))
      .some((t) => t && NAME.test(t));

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[aria-live], [class], [id]')
    : helpers.queryAll('[aria-live], [class], [id]');

  const occurrences = [];
  const flagged = [];
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute') || inStatus(el) || !visible(el)) continue;
    if (flagged.some((f) => dom.contains(f, el))) continue;
    const live = norm(dom.getAttribute(el, 'aria-live')).toLowerCase();
    let kind = null;
    if (live && live !== 'off') kind = 'liveWithoutRole';
    else if (named(el)) {
      const text = norm(dom.textContent(el));
      const words = text.split(' ').filter((w) => /\p{L}/u.test(w)).length;
      if (
        words >= 2 &&
        words <= 40 &&
        !dom.querySelectorAll(el, 'h1,h2,h3,h4,h5,h6,form,ul,ol,table').length
      ) {
        kind = 'possibleStatusMessage';
      }
    }
    if (!kind) continue;
    flagged.push(el);
    const text = norm(dom.textContent(el)).slice(0, 60);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          kind === 'liveWithoutRole'
            ? `This element has aria-live but no role="status", "alert", "log" or "progressbar" ("${text}").`
            : `This element looks like a status message ("${text}") but has no role="status", "alert", "log" or "progressbar".`,
        hint: 'If it is a status message, use role="status" for a success, result or state, role="alert" for an error or a suggestion, and role="log", "progressbar" or "status" for a progress (RGAA 7.5).',
        i18n: {
          summaryKey: `statusMessageReview_summary_cantTell_${kind}`,
          hintKey: 'statusMessageReview_hint_cantTell',
          params: { text }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the element is a status message, and which role it needs.'
        },
        data: {
          details: { reasonCode: kind, text },
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
