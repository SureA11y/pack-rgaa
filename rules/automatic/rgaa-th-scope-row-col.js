/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-th-scope-row-col
 * @atomic true
 * @summary A header with a scope attribute must use scope="row" or scope="col", the right one
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every <th> with a scope attribute, except in a <table> with
 *   role="presentation" or role="none", which is not a data table. Headers
 *   hidden by the default hidden-content policy are not checked. A page
 *   with none is notApplicable.
 * @expectation
 *   RGAA gives a <th> two choices. A header over a whole row or column that
 *   has a scope uses scope="row" or scope="col" (5.7.2). A header over
 *   only part of a row or column has no scope, no role="rowheader" or
 *   "columnheader", and a unique id (5.7.3); the glossary « En-tête de
 *   colonne ou de ligne » adds that only a <th> can be used then. So:
 *   - a scope other than row or col (rowgroup, colgroup, a misspelt or
 *     empty value) fails (otherScope): the header fails 5.7.2 if it covers
 *     a whole row or column, and 5.7.3 if it covers part of one;
 *   - a scope pointing the wrong way fails (wrongAxis): scope="col" on the
 *     first cell of a body row whose other cells are <td>, under a first
 *     row of <th> only (a row header), and scope="row" on a cell of a
 *     first row of <th> only, above rows that start with a <td> (a column
 *     header). A table with a rowspan or colspan is left out of this
 *     check, since the cells' places are then a person's call.
 * @implementation-notes
 * - scope-attr-valid, the WCAG rule, accepts rowgroup and colgroup, as
 *   WCAG technique H63 does, and only asks about other values. It is not
 *   linked to 5.7.2: this rule takes the test.
 * - Values are compared without regard to case or surrounding spaces.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-th-scope-row-col';

const meta = {
  title: 'Table headers use scope="row" or scope="col", the right one',
  description:
    'Checks that every <th> with a scope attribute uses scope="row" or scope="col", which RGAA requires, and that the value matches whether the header heads a row or a column.',
  i18n: {
    titleKey: 'thScopeRowCol_title',
    descriptionKey: 'thScopeRowCol_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'tables', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['otherScope', 'wrongAxis']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

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
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const scopeOf = (el) =>
    String(dom.getAttribute(el, 'scope') || '')
      .trim()
      .toLowerCase();

  // The table's own rows, not those of a table nested in it.
  function rowsOf(table) {
    return [...dom.querySelectorAll(table, 'tr')].filter(
      (tr) => dom.closest(tr, 'table') === table
    );
  }
  const cellsOf = (tr) => [...dom.querySelectorAll(tr, ':scope > th, :scope > td')];
  const spans = (table) =>
    [...dom.querySelectorAll(table, 'th, td')].some(
      (c) =>
        dom.closest(c, 'table') === table &&
        (Number(dom.getAttribute(c, 'rowspan') || 1) > 1 ||
          Number(dom.getAttribute(c, 'colspan') || 1) > 1)
    );

  // What axisOf needs to know of a table's shape, read once per table: a
  // table with scope on every header would otherwise read all its rows and
  // cells again for each header. null when the shape settles no header.
  const shapes = new Map();
  function shapeOf(table) {
    if (shapes.has(table)) return shapes.get(table);
    let shape = null;
    if (!spans(table)) {
      const rows = rowsOf(table);
      const first = rows.length >= 2 ? cellsOf(rows[0]) : [];
      if (first.length > 1 && first.every((c) => tagOf(c) === 'th')) {
        const bodyStartsWithTd = rows.slice(1).every((r) => {
          const cells = cellsOf(r);
          return cells.length && tagOf(cells[0]) === 'td';
        });
        shape = { firstRow: rows[0], bodyStartsWithTd };
      }
    }
    shapes.set(table, shape);
    return shape;
  }

  // The way a header heads, when the table's shape makes it certain:
  // 'row' for the first cell of a body row of a table whose first row is
  // all <th>, 'col' for a cell of that first row when rows below start
  // with a <td>; null otherwise.
  function axisOf(th, table) {
    const shape = shapeOf(table);
    if (!shape) return null;
    const tr = dom.closest(th, 'tr');
    if (tr === shape.firstRow) return shape.bodyStartsWithTd ? 'col' : null;
    const cells = cellsOf(tr);
    if (cells[0] === th && cells.length > 1 && cells.slice(1).every((c) => tagOf(c) === 'td')) {
      return 'row';
    }
    return null;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('th[scope]')
    : helpers.queryAll('th[scope]');

  const occurrences = [];
  let applicableCount = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const table = dom.get(el, 'closest') ? dom.closest(el, 'table') : null;
    if (table) {
      const role = explicitRole(table);
      if (role === 'presentation' || role === 'none') continue;
    }
    applicableCount += 1;
    const scope = scopeOf(el);

    if (scope !== 'row' && scope !== 'col') {
      // A value written close to row or col (column, rows, colonne), but not
      // rowgroup or colgroup, which the generic hint covers.
      const bare = scope.replace(/[^a-z]/g, '');
      const meant = /^(col(s|umns?|onnes?)?|colum|cl|coll|clo|ocl)$/.test(bare)
        ? 'col'
        : /^(rows?|lignes?|rwo|raw|ro|rw|orw)$/.test(bare)
          ? 'row'
          : '';
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This header has scope="${scope}": RGAA accepts only scope="row" or scope="col".`,
          hint: meant
            ? `Did you mean scope="${meant}"? Use it if the header covers a whole ${meant === 'col' ? 'column' : 'row'}. If it covers only part of one, remove scope, give the <th> a unique id and list that id in the headers attribute of the cells it covers.`
            : 'If the header covers a whole row or column, use scope="row" or scope="col". If it covers only part of one, remove scope, give the <th> a unique id and list that id in the headers attribute of the cells it covers.',
          i18n: {
            summaryKey: 'thScopeRowCol_summary_fail_otherScope',
            hintKey: meant
              ? `thScopeRowCol_hint_fail_otherScope_${meant}`
              : 'thScopeRowCol_hint_fail_otherScope',
            params: { scope }
          },
          data: {
            details: { reasonCode: 'otherScope', scope, ...(meant ? { suggestion: meant } : {}) },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }

    const axis = table ? axisOf(el, table) : null;
    if (axis && axis !== scope) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This header heads a ${axis === 'row' ? 'row' : 'column'} but has scope="${scope}".`,
          hint: `Use scope="${axis}" on this header.`,
          i18n: {
            summaryKey: `thScopeRowCol_summary_fail_wrongAxis_${axis}`,
            hintKey: 'thScopeRowCol_hint_fail_wrongAxis',
            params: { scope, axis }
          },
          data: { details: { reasonCode: 'wrongAxis', scope, axis }, visibilityFilter: VF }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
