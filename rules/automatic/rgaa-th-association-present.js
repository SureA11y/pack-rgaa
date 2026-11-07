/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-th-association-present
 * @atomic true
 * @summary Each header of a data table has an id, a scope or a header role
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the <th> elements with text of tables that are not
 *   presentation tables (role="presentation" or "none"). A page with none
 *   is notApplicable.
 * @expectation
 *   RGAA 5.7.1: each <th> « s'appliquant à la totalité de la ligne ou de la
 *   colonne » has a unique id, a scope, or role="rowheader" or
 *   "columnheader".
 *   - In a table with headers on both axes (a first row of <th> and rows
 *     that start with a <th> followed by <td>) and no rowspan or colspan,
 *     each <th> with none of the three fails (noAssociation): such a
 *     header covers a whole row or column, and the shape leaves no doubt.
 *   - A table whose headers all sit in a single row or a single column
 *     passes: criterion 5.7's particular case lets such headers be <th>
 *     without scope.
 *   - Elsewhere, the table is asked about once (noAssociationSimple): with
 *     spans, or headers that do not line up as a first row and first
 *     column, a header may cover only part of a row or column, which 5.7.1
 *     leaves to 5.7.3.
 * @implementation-notes
 * - An empty <th>, such as the top-left corner of a table, is left out.
 * - Whether a scope value is right is rgaa-th-scope-row-col's matter.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-th-association-present';

const meta = {
  title: 'Table headers have an id, a scope or a header role',
  description:
    'Fails a <th> with no id, scope or header role in a table with headers on both axes; passes headers on a single row or column; asks about other tables whose headers have none.',
  i18n: {
    titleKey: 'thAssociationPresent_title',
    descriptionKey: 'thAssociationPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'tables', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['noAssociation', 'noAssociationSimple'],
  review: {
    noAssociationSimple: {
      steps: [
        'Find the table the report names: some of its <th> cells have no id, scope or role="rowheader" or "columnheader".',
        'Look at the table on screen: are all its headers in a single row or a single column? If not, decide for each of those headers whether it covers a whole row or column, or only part of one.'
      ],
      passWhen:
        'All the table’s headers sit in a single row or a single column, which RGAA 5.7’s particular case allows without scope; or each of those <th> covers only part of its row or column, so RGAA 5.7.1 does not apply to it (5.7.3 then asks it for a unique id).',
      failWhen:
        'The table has headers in more than one row or column, and a <th> that covers a whole row or column has no unique id, scope or header role, which fails RGAA 5.7.1.'
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

  function rowsOf(table) {
    return [...dom.querySelectorAll(table, 'tr')].filter(
      (tr) => dom.closest(tr, 'table') === table
    );
  }
  const cellsOf = (tr) => [...dom.querySelectorAll(tr, ':scope > th, :scope > td')];
  const spanned = (c) =>
    Number(dom.getAttribute(c, 'rowspan') || 1) > 1 ||
    Number(dom.getAttribute(c, 'colspan') || 1) > 1;

  const associated = (th) =>
    !!String(dom.getAttribute(th, 'id') || '').trim() ||
    dom.hasAttribute(th, 'scope') ||
    ['rowheader', 'columnheader'].includes(roleOf(th));

  const tables = helpers.queryAllSmart ? helpers.queryAllSmart('table') : helpers.queryAll('table');

  const fails = [];
  const cantTells = [];
  let applicable = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const table of tables) {
    if (['presentation', 'none'].includes(roleOf(table))) continue;
    const rows = rowsOf(table);
    const grid = rows.map(cellsOf);
    const ths = grid.flat().filter((c) => tagOf(c) === 'th' && text(c));
    if (!ths.length) continue;
    applicable += 1;
    const missing = ths.filter((th) => !associated(th));
    if (!missing.length) continue;

    const anySpan = grid.flat().some(spanned);
    // RGAA 5.7's particular case: headers on a single row or a single
    // column may be <th> without scope.
    const at = grid.flatMap((cells, r) =>
      cells.flatMap((c, i) => (tagOf(c) === 'th' && text(c) ? [{ r, i }] : []))
    );
    const oneRow = new Set(at.map((p) => p.r)).size === 1;
    const oneColumn = !anySpan && new Set(at.map((p) => p.i)).size === 1;
    if (oneRow || oneColumn) continue;
    const first = grid[0] || [];
    const columnHeaders = first.filter((c) => tagOf(c) === 'th').length >= 2;
    const rowHeaders = grid
      .slice(1)
      .some(
        (cells) =>
          cells.length > 1 &&
          tagOf(cells[0]) === 'th' &&
          cells.slice(1).every((c) => tagOf(c) === 'td')
      );

    if (columnHeaders && rowHeaders && !anySpan) {
      for (const th of missing) {
        const label = text(th).slice(0, 60);
        fails.push(
          helpers.reportOccurrence(th, {
            summary: `This header ("${label}") of a table with headers on both axes has no id, scope or header role.`,
            hint: 'Add scope="col" to the headers of the first row and scope="row" to those that start a row (RGAA 5.7.1).',
            i18n: {
              summaryKey: 'thAssociationPresent_summary_fail',
              hintKey: 'thAssociationPresent_hint_fail',
              params: { label }
            },
            data: { details: { reasonCode: 'noAssociation', label }, visibilityFilter: VF }
          })
        );
      }
    } else {
      const count = missing.length;
      cantTells.push(
        helpers.reportOccurrence(table, {
          summary: `${count} header(s) of this table have no id, scope or header role.`,
          hint: 'RGAA 5.7.1 asks each <th> that covers a whole row or column for a scope, a unique id or a header role; add scope="col" or scope="row" (RGAA 5.7.1).',
          i18n: {
            summaryKey: 'thAssociationPresent_summary_cantTell',
            hintKey: 'thAssociationPresent_hint_cantTell',
            params: { count }
          },
          uncertainty: {
            code: 'judgement-required',
            needed:
              'Whether the headers cover whole rows or columns and need a scope, an id or a role.'
          },
          data: { details: { reasonCode: 'noAssociationSimple', count }, visibilityFilter: VF }
        })
      );
    }
  }

  if (applicable === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
