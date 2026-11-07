/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-current-item-review
 * @atomic true
 * @summary The active item of a menu is not shown by its look alone
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to links inside a navigation (<nav>, role="navigation" or
 *   role="menubar") that are marked as the current one by a class (active,
 *   current, selected, is-active…, on the link or its list item), with no
 *   aria-current on them and no text inside that says so. A page with none
 *   is notApplicable.
 * @expectation
 *   RGAA 10.9.1: information is not given « uniquement par la forme,
 *   taille ou position », and the glossary « Indication donnée par la
 *   forme, la taille ou la position » gives as its first example « la
 *   présence d'un marqueur visuel, pour indiquer la page active dans un
 *   menu de navigation ». Such a link is asked about (currentByLookOnly):
 *   if the class shows the active page, it needs aria-current="page" or a
 *   text that says so.
 * @implementation-notes
 * - Manual (cantTell): the class may change nothing on screen.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-current-item-review';

const meta = {
  title: 'The active item of a menu is not shown by its look alone',
  description:
    'Flags each navigation link marked current by a class only, with no aria-current and no text that says so, for a person to check how the active page is told.',
  i18n: {
    titleKey: 'currentItemReview_title',
    descriptionKey: 'currentItemReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'navigation', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['currentByLookOnly'],
  review: {
    currentByLookOnly: {
      steps: [
        'Find the navigation link the report names, and look at it on screen.',
        'Check whether it looks different from the other links of the menu, and whether that shows it leads to the page you are on.',
        'Listen to it with a screen reader, and check whether anything other than its look says it is the current page.'
      ],
      passWhen:
        'The link does not stand for the current page, or something other than its look says so, such as aria-current="page" or a text.',
      failWhen: 'Only the look of the link shows the current page, which fails RGAA 10.9.1.'
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
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };
  const CURRENT_CLASS =
    /^(?:is-|has-)?(?:active|current|selected|on)$|[-_](?:active|current|selected)$|^(?:active|current|selected)[-_]/i;
  const SAYS_CURRENT =
    /\b(?:actuel(?:le)?|courante?|en cours|s[ée]lectionn[ée]e?|current|active|selected|actual|aktuell)\b/i;

  const inNavigation = (el) => {
    for (let a = dom.parentElement(el); a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (tagOf(a) === 'nav' || ['navigation', 'menubar'].includes(roleOf(a))) return true;
    }
    return false;
  };
  const markedCurrent = (el) =>
    String(dom.getAttribute(el, 'class') || '')
      .split(/\s+/)
      .some((c) => CURRENT_CLASS.test(c));
  const hasAriaCurrent = (el) => {
    const v = norm(dom.getAttribute(el, 'aria-current')).toLowerCase();
    return !!v && v !== 'false';
  };

  const links = helpers.queryAllSmart
    ? helpers.queryAllSmart('a[href]')
    : helpers.queryAll('a[href]');

  const occurrences = [];
  for (const link of links) {
    if (!link || !dom.get(link, 'getAttribute') || !inNavigation(link)) continue;
    const item = dom.closest(link, 'li');
    const marked = markedCurrent(link) || (item && markedCurrent(item));
    if (!marked) continue;
    if (hasAriaCurrent(link) || (item && hasAriaCurrent(item))) continue;
    const text = norm(dom.textContent(link)) + ' ' + norm(dom.getAttribute(link, 'title'));
    if (SAYS_CURRENT.test(text)) continue;
    const label = norm(dom.textContent(link)).slice(0, 60);
    occurrences.push(
      helpers.reportOccurrence(link, {
        summary: `This navigation link ("${label}") is marked as the current one by a class only, with no aria-current and no text that says so.`,
        hint: 'If the class shows the active page, add aria-current="page" to the link, or a text that says so (RGAA 10.9.1).',
        i18n: {
          summaryKey: 'currentItemReview_summary_cantTell',
          hintKey: 'currentItemReview_hint_cantTell',
          params: { label }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the active page is shown only by the look of the link.'
        },
        data: {
          details: { reasonCode: 'currentByLookOnly', label },
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
