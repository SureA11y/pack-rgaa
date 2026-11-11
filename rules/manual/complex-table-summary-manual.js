/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-complex-table-summary
 * @atomic true
 * @summary A complex data table should have a summary
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to complex data tables, in RGAA's sense: tables whose header
 *   cells are not all in the first row or the first column, or whose
 *   headers do not apply to a whole row or column. A <table>, or an element
 *   with role="table" (5.1.1 step 1), counts as complex when:
 *   - a header cell (<th>, role="columnheader" or role="rowheader") sits
 *     outside both the first row and the first column;
 *   - a cell uses the headers attribute;
 *   - a header has scope="rowgroup" or scope="colgroup"; or
 *   - two or more first-row headers each span several columns (as in
 *     "2025" and "2026" over their quarters), or two or more first-column
 *     headers each span several rows, so each heads a group of columns or
 *     rows rather than whole ones.
 *   Tables with role="presentation" or "none" are left out. A page with
 *   none is notApplicable. When every complex table has its summary marked
 *   (aria-describedby, or a summary attribute where it counts), the rule
 *   passes: whether that summary is good is rgaa-complex-table-summary-quality's
 *   question.
 * @expectation
 *   A complex table without an aria-describedby that points to text (an
 *   id that names nothing, or an empty element, is no summary), and without a summary
 *   attribute where one still counts, is flagged for a person to check that
 *   a summary is available, as RGAA 5.1.1 asks: in the <caption>, or in a
 *   passage near the table. The summary attribute counts only on a <table>
 *   in a document whose doctype is not HTML5: 5.1.1 step 2 accepts it only
 *   "dans les versions de HTML et de XHTML antérieures à HTML 5". A document
 *   with no doctype is not HTML5. An ARIA table's summary comes only through
 *   aria-describedby.
 * @implementation-notes
 * - Manual (cantTell): whether the <caption> explains the table's nature
 *   and structure is for a person; 5.1.1 accepts no other passage unless
 *   aria-describedby ties it to the table.
 * - Positions account for colspan and rowspan (aria-colspan and
 *   aria-rowspan in an ARIA table). Nested tables are checked on their own.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-complex-table-summary';

const meta = {
  title: 'Complex data tables have a summary',
  description:
    'Flags a data table whose headers are not all in the first row or column, or head only a group of rows or columns, and that has no aria-describedby (nor, before HTML5, a summary attribute), for a person to check that a summary is available.',
  i18n: {
    titleKey: 'complexTableSummary_title',
    descriptionKey: 'complexTableSummary_description'
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
  reasonCodes: ['complexTableNoSummary'],
  review: {
    complexTableNoSummary: {
      steps: [
        'Find the table the report names, and check that it is a complex data table: its headers are not only in the first row and/or first column, or some do not apply to a whole row or column.',
        'Read its <caption>, any text its aria-describedby points to, and its summary attribute (before HTML 5).',
        'Look there for a summary: a passage that explains how the table is built (what its groups of headers are and how to read a cell).'
      ],
      passWhen:
        'The <caption>, a passage tied to the table with aria-describedby, or the summary attribute (before HTML 5) explains the nature and structure of the table; or the table is in fact not complex.',
      failWhen: 'None of these explains the structure of the complex table, which fails RGAA 5.1.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  // The HTML5 doctype: name html, no public id, no system id or
  // about:legacy-compat. Same test as rgaa-presentational-elements-absent.
  const isHtml5 = (() => {
    const doctype = document && dom.doctype(document);
    return (
      !!doctype &&
      String(doctype.name || '').toLowerCase() === 'html' &&
      !doctype.publicId &&
      (!doctype.systemId || doctype.systemId === 'about:legacy-compat')
    );
  })();

  function hasText(v) {
    return v != null && String(v).trim() !== '';
  }

  // The resolved explicit role: the first token of the role fallback list
  // that names a known role, lower-cased, or '' when none does.
  // The text aria-describedby points to, in the table's own tree. An id
  // that names nothing, or only an empty element, is no summary.
  function describedByText(table) {
    const ids = dom.getAttribute(table, 'aria-describedby');
    if (!hasText(ids)) return '';
    if (helpers && typeof helpers.getTextFromIdRefs === 'function') {
      try {
        const r = helpers.getTextFromIdRefs(ids, ctx, {}, table);
        return r && hasText(r.text) ? String(r.text) : '';
      } catch {
        return '';
      }
    }
    return String(ids);
  }

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

  // The table an ARIA row or native row belongs to: the nearest ancestor
  // that is a <table> or has a table role.
  function owningTable(el) {
    let cur = dom.parentElement(el);
    while (cur) {
      if (String(dom.tagName(cur)).toLowerCase() === 'table') return cur;
      if (ARIA_TABLE_ROLES.includes(explicitRole(cur))) return cur;
      cur = dom.parentElement(cur);
    }
    return null;
  }

  // Rows as arrays of cells, with the attribute names that carry spans.
  function gridOf(table) {
    if (String(dom.tagName(table)).toLowerCase() === 'table') {
      return {
        rows: [...(table.rows || [])].map((row) => [...(row.cells || [])]),
        colspan: 'colspan',
        rowspan: 'rowspan'
      };
    }
    const rows = [...dom.querySelectorAll(table, '[role]')]
      .filter((el) => explicitRole(el) === 'row' && owningTable(el) === table)
      .map((row) =>
        [...dom.querySelectorAll(row, ':scope > *')].filter((cell) =>
          ARIA_CELL_ROLES.includes(explicitRole(cell))
        )
      );
    return { rows, colspan: 'aria-colspan', rowspan: 'aria-rowspan' };
  }

  // A cell's text, collapsed and cut at 40 characters, for a message.
  function cellText(cell) {
    const t = String(dom.textContent(cell) || '')
      .replace(/\s+/g, ' ')
      .trim();
    return t.length > 40 ? `${t.slice(0, 39)}…` : t;
  }

  // Why the table is complex: a list of reasons, empty for a simple table.
  // `evidence` gets, for each reason, the cell that shows it.
  function complexity(table, evidence) {
    const reasons = [];
    const taken = [];
    const grid = gridOf(table);
    const placed = [];
    let outside = false;
    let headersAttr = false;
    let groupScope = false;
    grid.rows.forEach((cells, r) => {
      let c = 0;
      for (const cell of cells) {
        taken[r] = taken[r] || [];
        while (taken[r][c]) c += 1;
        const cols = span(cell, grid.colspan);
        const rowsSpanned = span(cell, grid.rowspan);
        for (let dr = 0; dr < rowsSpanned; dr += 1) {
          taken[r + dr] = taken[r + dr] || [];
          for (let dc = 0; dc < cols; dc += 1) taken[r + dr][c + dc] = true;
        }
        if (isHeader(cell)) {
          if (r > 0 && c > 0) {
            outside = true;
            if (!evidence.headersOutsideFirstRowAndColumn) {
              evidence.headersOutsideFirstRowAndColumn = { header: cellText(cell) };
            }
          }
          placed.push({ r, c, cols, rows: rowsSpanned, cell });
          const scope = String(dom.getAttribute(cell, 'scope') || '')
            .trim()
            .toLowerCase();
          if (scope === 'rowgroup' || scope === 'colgroup') {
            groupScope = true;
            if (!evidence.groupScope) evidence.groupScope = { header: cellText(cell), scope };
          }
        }
        if (hasText(dom.getAttribute(cell, 'headers'))) headersAttr = true;
        c += cols;
      }
    });
    const overColumns = placed.filter((h) => h.r === 0 && h.cols > 1);
    const overRows = placed.filter((h) => h.c === 0 && h.rows > 1);
    const groupSpan = overColumns.length > 1 || overRows.length > 1;
    if (groupSpan) {
      const [a, b] = overColumns.length > 1 ? overColumns : overRows;
      evidence.groupSpanningHeader = {
        header: cellText(a.cell),
        other: cellText(b.cell),
        axis: overColumns.length > 1 ? 'columns' : 'rows'
      };
    }
    if (outside) reasons.push('headersOutsideFirstRowAndColumn');
    if (headersAttr) reasons.push('headersAttribute');
    if (groupScope) reasons.push('groupScope');
    if (groupSpan) reasons.push('groupSpanningHeader');
    return reasons;
  }

  const tables = helpers.queryAllSmart
    ? helpers.queryAllSmart('table, [role]')
    : helpers.queryAll('table, [role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const table of tables) {
    if (!table || !dom.get(table, 'getAttribute')) continue;
    const role = explicitRole(table);
    const isNative = String(dom.tagName(table)).toLowerCase() === 'table';
    if (isNative ? role === 'presentation' || role === 'none' : role !== 'table') continue;
    const evidence = {};
    const reasons = complexity(table, evidence);
    if (!reasons.length) continue;
    applicableCount += 1;
    if (describedByText(table)) continue;
    const describedby = hasText(dom.getAttribute(table, 'aria-describedby'));
    // summary is a résumé only on a <table> before HTML5 (5.1.1 step 2).
    const hasSummaryAttr = isNative && hasText(dom.getAttribute(table, 'summary'));
    if (hasSummaryAttr && !isHtml5) continue;

    const caption =
      isNative && table.caption ? String(dom.textContent(table.caption) || '').trim() : '';

    // The summary names what makes the table complex, on the first cell
    // that shows it; the hint names what the reviewer sees and why it does
    // not count, or where a summary may already be.
    const why = reasons[0];
    const shown = evidence[why] || {};
    const params = { ...shown };
    delete params.axis;
    const named = why === 'headersAttribute' || Object.values(shown).every((v) => v);
    const WHY = {
      headersOutsideFirstRowAndColumn: `its header "${shown.header}" is outside the first row and column`,
      headersAttribute: 'its cells are tied to their headers with the headers attribute',
      groupScope: `its header "${shown.header}" has scope="${shown.scope}"`,
      groupSpanningHeader: `its headers "${shown.header}" and "${shown.other}" each head a group of ${shown.axis}`
    };
    const keyOf = (w) =>
      w === 'groupSpanningHeader' ? `${w}_${shown.axis === 'rows' ? 'rows' : 'columns'}` : w;
    const summary = named
      ? `This table looks like a complex data table: ${WHY[why]}. Nothing marks a summary of its structure.`
      : 'This table looks like a complex data table, and nothing marks a summary of its structure.';
    const ids = String(dom.getAttribute(table, 'aria-describedby') || '').trim();
    let hintVariant = '';
    let hint =
      'Check that a summary explains how the table is organised, in its <caption> or in a passage next to it, ideally linked with aria-describedby.';
    if (describedby) {
      hintVariant = '_describedbyUnresolved';
      params.ids = ids;
      hint = `Its aria-describedby="${ids}" points to no text, so it gives no summary. Point it at a passage that explains how the table is organised, or put that explanation in the <caption> (RGAA 5.1.1).`;
    } else if (hasSummaryAttr) {
      hintVariant = '_summaryAttribute';
      hint =
        'Its summary attribute does not count in HTML5: RGAA 5.1.1 accepts it only in earlier versions. Put the summary in the <caption>, or in a passage tied to the table with aria-describedby.';
    } else if (caption) {
      hintVariant = '_caption';
      params.caption = caption.length > 80 ? `${caption.slice(0, 79)}…` : caption;
      hint = `Check whether its caption, "${params.caption}", explains how the table is organised; if not, add that explanation there or in a passage tied to the table with aria-describedby (RGAA 5.1.1).`;
    }
    occurrences.push(
      helpers.reportOccurrence(table, {
        summary,
        hint,
        i18n: {
          summaryKey: named
            ? `complexTableSummary_summary_cantTell_${keyOf(why)}`
            : 'complexTableSummary_summary_cantTell',
          hintKey: `complexTableSummary_hint_cantTell${hintVariant}`,
          params
        },
        data: {
          details: {
            reasonCode: 'complexTableNoSummary',
            reasons,
            ...(named && why !== 'headersAttribute' ? { evidence: shown } : {}),
            hasCaption: Boolean(caption),
            ...(describedby ? { describedbyUnresolved: true } : {}),
            ...(hasSummaryAttr ? { summaryAttributeIgnored: true } : {})
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
