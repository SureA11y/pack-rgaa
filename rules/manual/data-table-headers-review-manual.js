/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-data-table-headers-review
 * @atomic true
 * @summary A table with no header cells should be checked for headers that are not marked up
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a <table>, or an element with role="table", that has at
 *   least two rows and two columns and no header cell at all: no <th>
 *   (without another role) and no cell with role="columnheader" or
 *   role="rowheader". Tables with role="presentation" or "none" are left
 *   out, and so is a table with no text in its cells. A table that has
 *   headers, no spans, and a first row or first column (of two cells or
 *   more) whose cells are all bold data cells applies too.
 * @expectation
 *   Each such table is asked about (cantTell). RGAA 5.6.1 and 5.6.2 want
 *   each header that applies to a whole column or row marked with <th> or
 *   a columnheader or rowheader role. A data table usually has headers in
 *   its first row or column, but only a person can tell whether this one
 *   does, or whether it is a layout table, which 5.3 and 5.8 cover.
 *   In a table with headers, a first row or column of bold data cells
 *   (<strong>, <b>, or a font weight of 600 or more) is asked about
 *   (BOLD_CELLS_MAY_BE_HEADERS): headers marked up as <td> fail 5.6.1 or
 *   5.6.2.
 * @implementation-notes
 * - A table with at least one header cell is not asked about. Whether all
 *   of its headers are marked up is not something the markup shows.
 * - td-has-header fails large headerless tables under WCAG 1.3.1. It is
 *   not linked to 5.6, because a cell with no header does not show that a
 *   header was left unmarked.
 * - Positions account for colspan and rowspan (aria-colspan and
 *   aria-rowspan in an ARIA table). Nested tables are checked on their own.
 * - Manual (cantTell): the rule never passes.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-data-table-headers-review';

const meta = {
  title: 'Tables with no header cells are checked for unmarked headers',
  description:
    'Flags a table of at least two rows and two columns with no <th> and no columnheader or rowheader role, or a table whose first row or column holds bold data cells, for a person to check whether headers should be marked up.',
  i18n: {
    titleKey: 'dataTableHeadersReview_title',
    descriptionKey: 'dataTableHeadersReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'tables', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  reasonCodes: ['NO_HEADER_CELLS'],
  review: {
    NO_HEADER_CELLS: {
      steps: [
        'Find the table the report names and look at it on screen.',
        'Decide whether it presents data in rows and columns, with a row or column that labels the others, or only lays out content side by side.',
        'If it holds data, find the cells that label each column or row and inspect them: they are <td>, not <th>.',
        'If it lays content out, read the page with styles turned off or with a screen reader and check that the content still reads in a sensible order.'
      ],
      passWhen:
        'The table only lays out content, which reads in a sensible order, or it holds data with no cell that labels a whole row or column.',
      failWhen:
        'The table holds data but its header cells are marked as <td> without a columnheader or rowheader role, which fails RGAA 5.6.1 or 5.6.2; a layout table whose content no longer makes sense once read in order fails RGAA 5.3.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function hasText(v) {
    return v != null && String(v).trim() !== '';
  }

  // The resolved explicit role: the first token of the role fallback list
  // that names a known role, lower-cased, or '' when none does.
  function explicitRole(el) {
    try {
      return el && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  function isHeader(cell) {
    const role = explicitRole(cell);
    if (role === 'columnheader' || role === 'rowheader') return true;
    // A <th> given another role (role="cell", say) is not a header.
    return String(dom.tagName(cell)).toLowerCase() === 'th' && !role;
  }

  function span(cell, attr) {
    const n = Number.parseInt(dom.getAttribute(cell, attr), 10);
    return Number.isFinite(n) && n > 1 ? Math.min(n, 1000) : 1;
  }

  const ARIA_TABLE_ROLES = ['table', 'grid', 'treegrid'];
  const ARIA_CELL_ROLES = ['cell', 'gridcell', 'columnheader', 'rowheader'];

  function owningTable(el) {
    let cur = dom.parentElement(el);
    while (cur) {
      if (String(dom.tagName(cur)).toLowerCase() === 'table') return cur;
      if (ARIA_TABLE_ROLES.includes(explicitRole(cur))) return cur;
      cur = dom.parentElement(cur);
    }
    return null;
  }

  function gridOf(table) {
    if (String(dom.tagName(table)).toLowerCase() === 'table') {
      return {
        rows: Array.from(table.rows || []).map((row) => Array.from(row.cells || [])),
        colspan: 'colspan',
        rowspan: 'rowspan'
      };
    }
    const rows = Array.from(dom.querySelectorAll(table, '[role]'))
      .filter((el) => explicitRole(el) === 'row' && owningTable(el) === table)
      .map((row) =>
        Array.from(dom.querySelectorAll(row, ':scope > *')).filter((cell) =>
          ARIA_CELL_ROLES.includes(explicitRole(cell))
        )
      );
    return { rows, colspan: 'aria-colspan', rowspan: 'aria-rowspan' };
  }

  // Row and column counts, with spans; null once a header cell is found.
  function sizeWithoutHeaders(table) {
    const grid = gridOf(table);
    const taken = [];
    let cols = 0;
    let withText = false;
    for (let r = 0; r < grid.rows.length; r += 1) {
      let c = 0;
      for (const cell of grid.rows[r]) {
        if (isHeader(cell)) return null;
        if (hasText(dom.textContent(cell))) withText = true;
        taken[r] = taken[r] || [];
        while (taken[r][c]) c += 1;
        const colSpan = span(cell, grid.colspan);
        const rowSpan = span(cell, grid.rowspan);
        for (let dr = 0; dr < rowSpan; dr += 1) {
          taken[r + dr] = taken[r + dr] || [];
          for (let dc = 0; dc < colSpan; dc += 1) taken[r + dr][c + dc] = true;
        }
        c += colSpan;
        cols = Math.max(cols, c);
      }
    }
    return { rows: taken.length, cols, withText };
  }

  const occurrences = [];

  // A cell whose text is all bold: inside <strong> or <b>, or, where the
  // page has a layout, drawn with a font weight of 600 or more.
  function allBold(cell) {
    const text = String(dom.textContent(cell) || '').trim();
    if (!text) return false;
    let walker = null;
    try {
      walker = dom.createTreeWalker(dom.ownerDocument(cell), cell, 4, null);
    } catch {}
    if (!walker) return false;
    const view = dom.defaultView(dom.ownerDocument(cell));
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!String(dom.nodeValue(n) || '').trim()) continue;
      const p = dom.parentElement(n);
      let bold = false;
      for (let a = p; a && a !== dom.parentElement(cell); a = dom.parentElement(a)) {
        const tag = String(dom.tagName(a)).toLowerCase();
        if (tag === 'strong' || tag === 'b') bold = true;
      }
      if (!bold && view && typeof view.getComputedStyle === 'function') {
        try {
          bold = Number.parseInt(view.getComputedStyle(p).fontWeight, 10) >= 600;
        } catch {}
      }
      if (!bold) return false;
    }
    return true;
  }

  // In a table with headers, a first row or first column of bold data cells
  // with no header among them may be headers marked up as <td>.
  function boldAxis(table) {
    const grid = gridOf(table);
    const rows = grid.rows;
    if (rows.length < 2) return;
    const spanned = rows.flat().some((c) => span(c, grid.colspan) > 1 || span(c, grid.rowspan) > 1);
    if (spanned) return;
    const first = rows[0];
    const rowCells = first.slice(
      first.length > 1 && !String(dom.textContent(first[0])).trim() ? 1 : 0
    );
    const colCells = rows
      .slice(1)
      .map((r) => r[0])
      .filter(Boolean);
    const axes = [];
    if (rowCells.length >= 2 && rowCells.every((c) => !isHeader(c) && allBold(c))) axes.push('row');
    if (colCells.length >= 2 && colCells.every((c) => !isHeader(c) && allBold(c)))
      axes.push('column');
    for (const axis of axes) {
      occurrences.push(
        helpers.reportOccurrence(table, {
          summary:
            axis === 'row'
              ? 'The first row of this table holds bold data cells, which may be column headers marked up as <td>.'
              : 'The first column of this table holds bold data cells, which may be row headers marked up as <td>.',
          hint: 'If these cells are headers, mark them with <th> (or role="columnheader" or role="rowheader" in an ARIA table), with a scope (RGAA 5.6.1, 5.6.2).',
          i18n: {
            summaryKey: `dataTableHeadersReview_summary_cantTell_bold_${axis}`,
            hintKey: 'dataTableHeadersReview_hint_cantTell_bold',
            params: {}
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the bold cells are headers.'
          },
          data: {
            details: { reasonCode: 'BOLD_CELLS_MAY_BE_HEADERS', axis },
            visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
          }
        })
      );
    }
  }

  const tables = helpers.queryAllSmart
    ? helpers.queryAllSmart('table, [role]')
    : helpers.queryAll('table, [role]');

  for (const table of tables) {
    if (!table || !dom.get(table, 'getAttribute')) continue;
    const role = explicitRole(table);
    const isNative = String(dom.tagName(table)).toLowerCase() === 'table';
    if (isNative ? role === 'presentation' || role === 'none' : role !== 'table') continue;

    const size = sizeWithoutHeaders(table);
    if (!size) {
      boldAxis(table);
      continue;
    }
    if (!size.withText || size.rows < 2 || size.cols < 2) continue;

    occurrences.push(
      helpers.reportOccurrence(table, {
        summary:
          'This table has no header cells. If it is a data table, check whether its first row or column holds headers.',
        hint: 'Mark each header that applies to a whole column or row with <th> (or role="columnheader" or role="rowheader" in an ARIA table). If the table is only used for layout, give it role="presentation" instead.',
        i18n: {
          summaryKey: 'dataTableHeadersReview_summary_cantTell',
          hintKey: 'dataTableHeadersReview_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether this is a data table, and whether any of its cells is a header that should be marked up.',
          evidence: { rows: size.rows, columns: size.cols }
        },
        data: {
          details: { reasonCode: 'NO_HEADER_CELLS', rows: size.rows, columns: size.cols },
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
