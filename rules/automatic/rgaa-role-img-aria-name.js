/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-role-img-aria-name
 * @atomic true
 * @summary An element with role="img" must have a text alternative from aria-labelledby or aria-label
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements whose role attribute starts with the token img,
 *   except <img> (RGAA lists its own sources for it) and an outer <svg>
 *   (RGAA test 1.1.5, see rgaa-svg-role-img and svg-text-alternative-present). An
 *   element with aria-hidden="true", on itself or an ancestor, is left out:
 *   the glossary entry "Image de décoration" says an element with role="img"
 *   is decorative only with aria-hidden="true". Content hidden with CSS or
 *   the hidden attribute is left out too, and so is an element that is the
 *   only content of a link or a button: its alternative is the control's
 *   name, which the glossary « Image porteuse d'information » (notes 1 and
 *   2) sends to Links (6.1), Forms (11.9) or Scripts (7.1). A page with
 *   none is notApplicable.
 * @expectation
 *   The element has a text alternative from one of the two sources RGAA
 *   1.1.1 step 4 lists for role="img": text referenced by aria-labelledby, or
 *   a non-empty aria-label. A name that comes only from the title attribute,
 *   or no name at all, fails: the glossary entry "Alternative textuelle
 *   (image)" lists title for <img>, <input type="image">, <object> and
 *   <embed> only.
 *   An element in the SVG namespace (a <g role="img">, for example) named
 *   by a <title> child passes: since RGAA 4.1.2 the glossary entry
 *   "Alternative textuelle (image)" counts an SVG's <title> as its
 *   alternative, and 1.1.5 step 5 lists it.
 * @implementation-notes
 * - The graphics-* roles are not checked: no RGAA test names them.
 * - aria-labelledby counts when it resolves to text; one that points to
 *   nothing gives way to aria-label, as in the glossary's order.
 * - Opt-in (tag `rgaa`): WCAG accepts a title-only name, so the rule runs
 *   only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'rgaa-role-img-aria-name';

const meta = {
  title: 'Elements with role="img" are named with aria-labelledby or aria-label',
  description:
    'Checks that each exposed element with role="img" (other than <img> and an outer <svg>) has a text alternative from aria-labelledby or aria-label, the two sources RGAA accepts.',
  i18n: {
    titleKey: 'roleImgAriaName_title',
    descriptionKey: 'roleImgAriaName_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'aria', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['titleOnly', 'missingAlternative']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const trim = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const attr = (el, name) => {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  };
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const parentOf = (el) =>
    helpers.composedParent ? helpers.composedParent(el) : dom.parentElement(el) || null;

  function insideAriaHidden(el) {
    for (let n = el; n && dom.nodeType(n) === 1; n = parentOf(n)) {
      if (trim(attr(n, 'aria-hidden')).toLowerCase() === 'true') return true;
    }
    return false;
  }

  function isOuterSvg(el) {
    if (tagOf(el) !== 'svg') return false;
    const p = dom.parentElement(el);
    return !(p && dom.get(p, 'closest') && dom.closest(p, 'svg'));
  }

  function ariaName(el) {
    if (helpers.getAriaNameInfo) {
      try {
        const info = helpers.getAriaNameInfo(el, ctx);
        if (info && info.present && trim(info.value)) return info.mechanism;
        return '';
      } catch {}
    }
    return trim(attr(el, 'aria-label')) ? 'aria-label' : '';
  }

  function svgTitleChildText(el) {
    if (dom.namespaceURI(el) !== SVG_NS) return '';
    for (const child of [...dom.querySelectorAll(el, ':scope > *')]) {
      if (tagOf(child) === 'title') return trim(dom.textContent(child));
    }
    return '';
  }

  // Optimal string alignment distance: a transposition counts as one edit.
  function distance(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) d.push([i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  const clip = (v, max) => {
    const t = trim(v);
    return t.length > max ? `${t.slice(0, max - 1)}…` : t;
  };

  // Why an element with role="img" has no text alternative, when its
  // markup holds something a reader could take for one: a misspelled
  // aria-label or aria-labelledby, an alt (which names only images), an
  // aria-labelledby that finds no text, or a blank aria-label. Returns
  // { cause, params } or null; it changes no outcome.
  function alternativeCause(el) {
    const KNOWN = new Set(
      (
        'aria-activedescendant aria-atomic aria-autocomplete aria-braillelabel ' +
        'aria-brailleroledescription aria-busy aria-checked aria-colcount aria-colindex ' +
        'aria-colindextext aria-colspan aria-controls aria-current aria-describedby ' +
        'aria-description aria-details aria-disabled aria-dropeffect aria-errormessage ' +
        'aria-expanded aria-flowto aria-grabbed aria-haspopup aria-hidden aria-invalid ' +
        'aria-keyshortcuts aria-label aria-labelledby aria-level aria-live aria-modal ' +
        'aria-multiline aria-multiselectable aria-orientation aria-owns aria-placeholder ' +
        'aria-posinset aria-pressed aria-readonly aria-relevant aria-required ' +
        'aria-roledescription aria-rowcount aria-rowindex aria-rowindextext aria-rowspan ' +
        'aria-selected aria-setsize aria-sort aria-valuemax aria-valuemin aria-valuenow ' +
        'aria-valuetext alt title value label lang style class id href src role type name ' +
        'tabindex hidden dir for form size width height rel target'
      ).split(' ')
    );
    const attrs = dom.attributes(el) || [];
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      const value = clip(attrs[i].value, 60);
      if (!value) continue;
      if (name === 'alt') return { cause: 'altNotRead', params: { value } };
      if (KNOWN.has(name) || name.slice(0, 5) === 'data-') continue;
      for (const target of ['aria-labelledby', 'aria-label']) {
        if (
          name.replace(/[-_:]/g, '') === target.replace(/[-_:]/g, '') ||
          distance(name, target) <= 2
        ) {
          return {
            cause: 'misspelledAttribute',
            params: { attribute: name, value, suggestion: target }
          };
        }
      }
    }

    const labelledby = trim(attr(el, 'aria-labelledby'));
    if (labelledby) {
      const ids = labelledby.split(' ');
      const found = [];
      for (const ref of ids) {
        let target = null;
        try {
          target = helpers.getElementByIdInTree
            ? helpers.getElementByIdInTree(el, ref)
            : dom.getElementById(dom.getRootNode(el), ref);
        } catch {}
        if (target) found.push(target);
      }
      if (!found.length) {
        // An id of the page close to the first one named: a case or
        // spelling slip, or a leading #.
        let suggestion = '';
        let best = Infinity;
        let root = null;
        try {
          root = dom.getRootNode(el);
        } catch {}
        const ref = ids[0].replace(/^#/, '');
        const withId =
          root && dom.get(root, 'querySelectorAll') ? [...dom.querySelectorAll(root, '[id]')] : [];
        for (const n of withId) {
          const candidate = String(attr(n, 'id') || '');
          if (!candidate) continue;
          const d =
            candidate === ref || candidate.toLowerCase() === ref.toLowerCase()
              ? 0
              : distance(candidate, ref);
          if (d < best && d <= (ref.length > 5 ? 2 : ref.length > 2 ? 1 : 0)) {
            best = d;
            suggestion = candidate;
          }
        }
        return { cause: 'labelledbyMissing', params: { ids: clip(labelledby, 60), suggestion } };
      }
      if (found.every((t) => !trim(dom.textContent(t)))) {
        return {
          cause: 'labelledbyEmpty',
          params: { id: String(attr(found[0], 'id') || ''), element: tagOf(found[0]) }
        };
      }
    }
    const ariaLabel = attr(el, 'aria-label');
    if (ariaLabel != null && !trim(ariaLabel)) return { cause: 'ariaLabelBlank', params: {} };
    return null;
  }

  function causeHint(c) {
    const p = c.params;
    switch (c.cause) {
      case 'misspelledAttribute':
        return `It has ${p.attribute}="${p.value}", but browsers do not read ${p.attribute}: did you mean ${p.suggestion}? Rename the attribute so that it names the image.`;
      case 'altNotRead':
        return `It has alt="${p.value}", but alt names only an <img>, an <area> or an <input type="image">, not an element with role="img". Move the text to aria-label.`;
      case 'labelledbyMissing':
        return `Its aria-labelledby names "${p.ids}", but no element of the page has that id${p.suggestion ? ` (did you mean "${p.suggestion}"?)` : ''}, so it gives no text alternative. Point aria-labelledby at the id of the text that describes the image, or use aria-label.`;
      case 'labelledbyEmpty':
        return `Its aria-labelledby points to the <${p.element}> element with id "${p.id}" that holds no text, so it gives no text alternative. Put the description in that element, or use aria-label.`;
      default:
        return 'Its aria-label is empty, so it gives no text alternative. Write in aria-label what the image shows.';
    }
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;

  // The only content of a link or a button: its alternative is the
  // control's name, which the glossary « Image porteuse d'information »
  // (notes 1 and 2) sends to Links (6.1), Forms (11.9) or Scripts (7.1).
  function onlyContentOfControl(el) {
    const tagName = (n) => String(dom.localName(n) || '').toLowerCase();
    let control = null;
    for (let a = dom.parentElement(el); a && !control; a = dom.parentElement(a)) {
      const r = helpers.aria.getExplicitRole(a);
      if (r === 'link' || r === 'button') control = a;
      else if (
        !r &&
        ((tagName(a) === 'a' && dom.hasAttribute(a, 'href')) || tagName(a) === 'button')
      ) {
        control = a;
      }
    }
    if (!control) return false;
    if (String(dom.textContent(control) || '').trim()) return false;
    return ![...dom.querySelectorAll(control, 'img, svg, canvas, object, embed')].some(
      (n) => n !== el && !dom.contains(el, n)
    );
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (trim(attr(el, 'role')).toLowerCase().split(' ')[0] !== 'img') continue;
    if (tagOf(el) === 'img' || isOuterSvg(el)) continue;
    if (insideAriaHidden(el)) continue;
    if (onlyContentOfControl(el)) continue;
    applicableCount += 1;

    if (ariaName(el)) continue;

    const element = tagOf(el);
    if (svgTitleChildText(el)) continue;

    const titleText = trim(attr(el, 'title'));
    const titleOnly = !!titleText;
    const title = titleText.length > 60 ? `${titleText.slice(0, 59)}…` : titleText;
    // A cause the markup shows replaces the generic hint.
    const cause = titleOnly ? null : alternativeCause(el);
    fails.push(
      helpers.reportOccurrence(el, {
        summary: titleOnly
          ? `This <${element}> with role="img" is named only by its title attribute; RGAA accepts only aria-labelledby or aria-label.`
          : `This <${element}> with role="img" has no text alternative.`,
        hint: cause
          ? causeHint(cause)
          : titleOnly
            ? `Its title "${title}" does not count as a text alternative here: move that text to aria-label, if it says what the image shows.`
            : 'Give it an aria-label, or an aria-labelledby that points to text describing the image.',
        i18n: {
          summaryKey: titleOnly
            ? 'roleImgAriaName_summary_fail_titleOnly'
            : 'roleImgAriaName_summary_fail_missing',
          hintKey: cause
            ? `roleImgAriaName_hint_fail_${cause.cause}`
            : titleOnly
              ? 'roleImgAriaName_hint_fail_titleOnly'
              : 'roleImgAriaName_hint_fail',
          params: { element, ...(titleOnly ? { title } : {}), ...(cause ? cause.params : {}) }
        },
        data: {
          details: {
            reasonCode: titleOnly ? 'titleOnly' : 'missingAlternative',
            ...(cause ? { alternativeCause: cause.cause } : {})
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
