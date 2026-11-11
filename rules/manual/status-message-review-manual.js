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
 *   "status". The methodology also accepts aria-live with
 *   aria-atomic="true", polite for a status and assertive for an alert, and
 *   aria-live="polite" for a log, which depends on what the message says.
 *   Whether the element is a status message (glossary
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
  coverage: {},
  reasonCodes: ['liveWithoutRole', 'possibleStatusMessage'],
  review: {
    liveWithoutRole: {
      steps: [
        'Find the element the report names: it has aria-live, but none of the roles status, alert, log or progressbar.',
        'Use the page, and check whether this text appears or changes as a result of what you do, without taking you anywhere else. A text shown from the start that never changes is not a status message.',
        'Decide what it tells: a success, a result or a state; an error or a suggestion; or a progress.',
        'Inspect the element for its role, aria-live and aria-atomic attributes.'
      ],
      passWhen:
        'The text is not a status message, or the element has the matching role: status, alert, or log, progressbar or status for a progress. The RGAA methodology also accepts aria-live with aria-atomic="true", polite for status and assertive for alert, and aria-live="polite" for log. A progress shown as a progress bar needs an explicit role="progressbar".',
      failWhen:
        'The status message has neither the role nor the attributes that match its nature, which fails RGAA 7.5.1 for a success, a result or a state, RGAA 7.5.2 for an error or a suggestion, and RGAA 7.5.3 for a progress.'
    },
    possibleStatusMessage: {
      steps: [
        'Find the element the report names: its class or id suggests a message, and it has none of the roles status, alert, log or progressbar.',
        'Use the page, and check whether this text appears or changes as a result of what you do, without taking you anywhere else. A text shown from the start that never changes is not a status message.',
        'Decide what it tells: a success, a result or a state; an error or a suggestion; or a progress.',
        'Inspect the element for its role, aria-live and aria-atomic attributes.'
      ],
      passWhen:
        'The text is not a status message, or the element has the matching role: status, alert, or log, progressbar or status for a progress. The RGAA methodology also accepts aria-live with aria-atomic="true", polite for status and assertive for alert, and aria-live="polite" for log. A progress shown as a progress bar needs an explicit role="progressbar".',
      failWhen:
        'The status message has neither the role nor the attributes that match its nature, which fails RGAA 7.5.1 for a success, a result or a state, RGAA 7.5.2 for an error or a suggestion, and RGAA 7.5.3 for a progress.'
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
  // The class token, or else the id, that names the element as a message:
  // { attribute, token }, or null.
  const named = (el) => {
    const token = String(dom.getAttribute(el, 'class') || '')
      .split(/\s+/)
      .find((t) => t && NAME.test(t));
    if (token) return { attribute: 'class', token };
    const idv = String(dom.getAttribute(el, 'id') || '');
    return idv && NAME.test(idv) ? { attribute: 'id', token: idv } : null;
  };

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
    const name = live && live !== 'off' ? null : named(el);
    if (live && live !== 'off') kind = 'liveWithoutRole';
    else if (name) {
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
    // Say what made the element look like a status message: its aria-live
    // value, or the class or id that names it so.
    const params =
      kind === 'liveWithoutRole' ? { text, live } : { text, [name.attribute]: name.token };
    const variant = kind === 'liveWithoutRole' ? '' : `_${name.attribute}`;
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          kind === 'liveWithoutRole'
            ? `This element has aria-live="${live}" but no role="status", "alert", "log" or "progressbar" ("${text}").`
            : name.attribute === 'class'
              ? `This element's class "${name.token}" suggests a status message ("${text}"), but it has no role="status", "alert", "log" or "progressbar".`
              : `This element's id "${name.token}" suggests a status message ("${text}"), but it has no role="status", "alert", "log" or "progressbar".`,
        hint: 'If it is a status message, use role="status" for a success, result or state, role="alert" for an error or a suggestion, and role="log", "progressbar" or "status" for a progress (RGAA 7.5).',
        i18n: {
          summaryKey: `statusMessageReview_summary_cantTell_${kind}${variant}`,
          hintKey: 'statusMessageReview_hint_cantTell',
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the element is a status message, and which role it needs.'
        },
        data: {
          details: { reasonCode: kind, ...params },
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
