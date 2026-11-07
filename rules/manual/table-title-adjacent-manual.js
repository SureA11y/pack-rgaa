/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-table-title-adjacent
 * @atomic true
 * @summary A heading just before a data table may be its title, not tied to it
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible data tables (a <table> with a <th>, not
 *   role="presentation" or "none") with no <caption>, title, aria-label or
 *   aria-labelledby, whose previous element is a heading (<h1>-<h6>, or
 *   role="heading"). A page with none is notApplicable.
 * @expectation
 *   RGAA 5.4.1: « Pour chaque tableau de données ayant un titre, le titre
 *   est-il correctement associé au tableau de données ? » A heading right
 *   before the table may be the table's title, given as plain text and not
 *   tied to it, or the title of the section the table belongs to: a person
 *   decides (adjacentHeading). If it is the table's title, a <caption> or
 *   aria-labelledby ties it.
 * @implementation-notes
 * - Manual (cantTell): the role of the heading is a person's call.
 * - A first row holding one cell above the data, the other way of giving a
 *   title as plain text, is asked about by table-fake-caption.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-table-title-adjacent';

const meta = {
  title: 'A heading just before a data table is tied to it if it is its title',
  description:
    "Flags each data table with no caption or name that comes right after a heading, for a person to check whether the heading is the table's title and should be tied to it.",
  i18n: {
    titleKey: 'tableTitleAdjacent_title',
    descriptionKey: 'tableTitleAdjacent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'tables', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['adjacentHeading'],
  review: {
    adjacentHeading: {
      steps: [
        'Find the table the report names, and the heading right before it.',
        'Read the heading, and whatever else comes under it.',
        'Decide whether the heading is the title of this table, or of a section that holds more than the table.'
      ],
      passWhen: 'The heading is the title of a section, not of the table.',
      failWhen:
        'The heading is the title of the table, and neither a <caption> nor a title, aria-label or aria-labelledby ties a title to it, which fails RGAA 5.4.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const text = (el) =>
    String(dom.textContent(el) || '')
      .replace(/\s+/g, ' ')
      .trim();
  const has = (el, name) => !!String(dom.getAttribute(el, name) || '').trim();

  const tables = helpers.queryAllSmart ? helpers.queryAllSmart('table') : helpers.queryAll('table');

  const occurrences = [];
  for (const table of tables) {
    if (['presentation', 'none'].includes(roleOf(table))) continue;
    const ownTh = Array.from(dom.querySelectorAll(table, 'th')).some(
      (th) => dom.closest(th, 'table') === table
    );
    if (!ownTh) continue;
    const caption = Array.from(dom.querySelectorAll(table, ':scope > caption')).some((c) =>
      text(c)
    );
    if (
      caption ||
      has(table, 'title') ||
      has(table, 'aria-label') ||
      has(table, 'aria-labelledby')
    ) {
      continue;
    }
    const prev = dom.previousElementSibling(table);
    if (!prev) continue;
    const isHeading = /^h[1-6]$/.test(tagOf(prev)) || roleOf(prev) === 'heading';
    if (!isHeading || !text(prev)) continue;
    const heading = text(prev).slice(0, 80);
    occurrences.push(
      helpers.reportOccurrence(table, {
        summary: `This data table has no caption or name, and comes right after the heading "${heading}".`,
        hint: "If the heading is the table's title, tie it to the table: move it into a <caption>, or point the table's aria-labelledby at it (RGAA 5.4.1).",
        i18n: {
          summaryKey: 'tableTitleAdjacent_summary_cantTell',
          hintKey: 'tableTitleAdjacent_hint_cantTell',
          params: { heading }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: "Whether the heading is the table's title or the title of its section."
        },
        data: {
          details: { reasonCode: 'adjacentHeading', heading },
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
