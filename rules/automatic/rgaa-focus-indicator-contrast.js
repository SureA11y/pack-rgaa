/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-focus-indicator-contrast
 * @atomic true
 * @summary An author focus indicator must have a contrast ratio of at least 3:1 with the colors next to it
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements in the tab order that are rendered, whose native
 *   focus outline an author rule replaces or removes: a `:focus` or
 *   `:focus-visible` rule on the element (or a rule with no state, or its
 *   style attribute) sets `outline-style` or `outline-width`, through the
 *   `outline` shorthand or the longhands, and the rule that wins the cascade
 *   is not `outline: auto`. The element must also have an author indicator
 *   to measure: a visible outline, border or box-shadow from a focus rule,
 *   or another focus style. An element that keeps the browser's outline
 *   meets RGAA 10.7.1's first condition and is not checked. An element
 *   whose outline is removed with no replacement at all is left to
 *   css-focus-indicator-suppressed. A page with none is notApplicable.
 * @expectation
 *   RGAA 10.7.1, step 2: the indicator is « suffisamment contrastée (ratio
 *   de contraste égal ou supérieur à 3.0) ». Each outline, border or
 *   box-shadow of the focus style is measured against the two colors it
 *   touches: the background behind the element and the element's own
 *   background (only the latter for an inset shadow). The element passes
 *   when one indicator reaches 3:1 against both. It fails when every
 *   indicator is below 3:1 against both and nothing else changes on focus.
 *   It is asked about (cantTell) otherwise: a color or background the
 *   engine cannot compute (background image, gradient, `var()`, a
 *   translucent page root in strict contrast mode), a blurred shadow, an
 *   indicator that reaches 3:1 against one side only, a focus style made of
 *   other changes (background, text color, underline, a pseudo-element, a
 *   rule that styles another element), or a cascade the engine cannot
 *   settle.
 *   Margin (`contrast-ratio`): of the focus indicators that reach 3:1
 *   against every color next to them, the one closest to it, with its
 *   lowest ratio unrounded; `context.property` names the outline, border or
 *   box-shadow. `measuredCount` counts the elements whose focus style was
 *   judged.
 * @implementation-notes
 * - RGAA 10.7.1 asks that a focus style be visible, not that it be drawn on
 *   the element's own box. A style that focus inside an ancestor brings
 *   (:focus-within, or :has() holding :focus), and in a browser any change
 *   on focus to the element's ancestors (up to the first one clearly larger
 *   than it, four levels at most) or to its labels, is not measured: the
 *   element is asked about (notMeasured) rather than failed on its own
 *   outline alone.
 * - WCAG 2.4.7 has no contrast requirement (2.4.13 is AAA and not
 *   checked), so css-focus-indicator-suppressed only asks whether some
 *   indicator exists. RGAA 10.7.1 also asks for 3:1, which this rule
 *   checks.
 * - The cascade is worked out per longhand among the matching rules and
 *   the style attribute: !important first, then specificity, then source
 *   order. A selector with :is(), :not(), :where() or :has() gets an
 *   approximate specificity; when that decides between two different
 *   values, the element is asked about.
 * - Rules inside @media apply when window.matchMedia says so, and rules
 *   inside @supports when CSS.supports says so. Where the condition cannot be
 *   evaluated (no matchMedia in jsdom, a container query), a verdict that
 *   rests on such a rule is asked about instead.
 * - Only the document's readable stylesheets and style attributes are
 *   read: cross-origin sheets and shadow-root styles are not.
 * - Colors are read from the declarations; `currentColor` is the color
 *   of the focused element. Backgrounds are resolved by
 *   helpers.contrast.computeEffectiveBackground with the engine's
 *   contrast options.
 * - Where the page has a layout (a browser), each element is focused as by
 *   the keyboard (`focusVisible`), with transitions switched off, and the
 *   outline, borders and box-shadow that differ from the unfocused computed
 *   style are measured. The computed style settles variables, @media and the
 *   cascade, so those are no longer asked about there. The colors outside
 *   the indicator are read from what is painted on each side
 *   (elementsFromPoint, on the shadow root for an element in a shadow
 *   tree), so a positioned layer behind the element counts; a side outside
 *   the viewport falls back to the background of the first ancestor
 *   larger than the element (a parent with the
 *   element's own box has the color under it, not around it). An image or
 *   gradient on any side, a ::before or ::after over most of the element
 *   with a fill of its own (it may be the visible background), an element
 *   something else is painted over (a cookie consent overlay, whose colors
 *   would be read instead), or an animation started by focus, is still
 *   asked about. Focus and the style attribute are put
 *   back afterwards. jsdom keeps the stylesheet reading described above.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-focus-indicator-contrast';

const meta = {
  title: 'Author focus indicators have a contrast ratio of at least 3:1',
  description:
    'Checks that an outline, border or box-shadow drawn by a :focus or :focus-visible rule in place of the browser outline has a contrast ratio of at least 3:1 with the colors next to it, and asks when it cannot be computed.',
  i18n: {
    titleKey: 'focusIndicatorContrast_title',
    descriptionKey: 'focusIndicatorContrast_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'focus', 'contrast', 'css', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {},
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min' },
  reasonCodes: ['lowContrast', 'oneSide', 'notComputable', 'notMeasured'],
  review: {
    oneSide: {
      steps: [
        'Find the element the report names, and move focus to it with the Tab key.',
        'Look at its focus indicator (the outline, border or shadow the report names) against the background behind the element and against the element itself.',
        "Measure the indicator's color against the side for which the report gives a ratio below 3:1, with a color picker and a contrast checker."
      ],
      passWhen:
        'The indicator stands out clearly where it is drawn, at 3:1 or more against the colors that frame it, or another change on focus shows the element.',
      failWhen:
        'The indicator is hard to see against one of its sides and nothing else shows focus, so it is not sufficiently contrasted, which fails RGAA 10.7.1.'
    },
    notComputable: {
      steps: [
        'Find the element the report names, and move focus to it with the Tab key.',
        'Look at the focus indicator the page draws: details.cause says why it could not be measured (a background image or gradient, a CSS variable, a blurred shadow, an animation, an @media condition, or rules the engine cannot order).',
        "With a color picker, take the indicator's color and the colors next to it on both sides, and check their contrast ratio."
      ],
      passWhen:
        'The focus indicator is visible, with a contrast ratio of 3:1 or more against the colors next to it.',
      failWhen:
        'The focus indicator is missing, or below 3:1 against the colors next to it, which fails RGAA 10.7.1.'
    },
    notMeasured: {
      steps: [
        'Find the element the report names, and move focus to it with the Tab key.',
        'Look at what changes on focus: a background, a text color, an underline, a pseudo-element or another element.',
        'Measure that change against what it is shown on: the colors before and after focus, or the indicator against the colors next to it.'
      ],
      passWhen: 'The change makes focus clearly visible, with a contrast ratio of 3:1 or more.',
      failWhen: 'The change is too faint to see where focus is, below 3:1, which fails RGAA 10.7.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule, engineOptions } = ctx;

  const CSS_STYLE_RULE = 1;
  const CSS_IMPORT_RULE = 3;
  const MAX_DEPTH = 10;
  const MIN_RATIO = 3;
  const SIDES = ['top', 'right', 'bottom', 'left'];

  // Focus styles other than outline, border and box-shadow, which change
  // what the user sees but that this rule does not measure.
  const OTHER_PROPS = [
    'background',
    'background-color',
    'background-image',
    'color',
    'content',
    'filter',
    'font-weight',
    'opacity',
    'text-decoration',
    'text-decoration-line',
    'text-decoration-color',
    'text-shadow',
    'transform'
  ];
  const LINE_STYLES = [
    'none',
    'hidden',
    'dotted',
    'dashed',
    'solid',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
    'auto'
  ];
  const WIDTH_KEYWORDS = { thin: 1, medium: 3, thick: 5 };

  const contrastOpts =
    engineOptions && typeof engineOptions.contrast === 'object' && engineOptions.contrast
      ? engineOptions.contrast
      : {};
  const bgOpts = {
    contrast: {
      mode: contrastOpts.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance',
      rootCanvasFallback:
        typeof contrastOpts.rootCanvasFallback === 'string' &&
        contrastOpts.rootCanvasFallback.trim()
          ? contrastOpts.rootCanvasFallback.trim()
          : '#ffffff'
    },
    collectStack: false
  };

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function lower(v) {
    return trim(v).toLowerCase();
  }
  function getProp(style, name) {
    try {
      return style && typeof style.getPropertyValue === 'function'
        ? lower(style.getPropertyValue(name))
        : '';
    } catch {
      return '';
    }
  }
  function isImportant(style, name) {
    try {
      return !!(
        style &&
        typeof style.getPropertyPriority === 'function' &&
        lower(style.getPropertyPriority(name)) === 'important'
      );
    } catch {
      return false;
    }
  }

  // Splits on a separator at the top level only (not inside parentheses).
  function splitTop(value, sep) {
    const parts = [];
    let depth = 0;
    let cur = '';
    for (const ch of String(value || '')) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) {
        if (trim(cur)) parts.push(trim(cur));
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (trim(cur)) parts.push(trim(cur));
    return parts;
  }

  function lengthPx(token) {
    const t = lower(token);
    if (t in WIDTH_KEYWORDS) return WIDTH_KEYWORDS[t];
    const m = /^(-?\d*\.?\d+)(px|em|rem|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax|%)?$/.exec(t);
    if (!m) return null;
    const n = parseFloat(m[1]);
    if (!Number.isFinite(n)) return null;
    // Only the sign and zero matter here, except for pixel values.
    return m[2] === 'pt' ? n * (96 / 72) : n;
  }

  let colorProbe = null;
  function isColorToken(token) {
    const t = lower(token);
    if (!t) return false;
    if (t === 'currentcolor' || t === 'transparent') return true;
    try {
      if (!colorProbe) colorProbe = dom.createElement(document, 'span').style;
      colorProbe.color = '';
      colorProbe.color = t;
      return !!colorProbe.color;
    } catch {
      return false;
    }
  }

  // { value } for a color that can be measured, { unknown: true } for one
  // that cannot (var(), system colors, invert), null for no color token.
  function readColor(token) {
    const t = lower(token);
    if (!t) return null;
    if (t.includes('var(') || t.includes('env(') || t === 'invert' || t[0] === '-') {
      return { unknown: true, raw: t };
    }
    return { value: t };
  }

  // outline shorthand -> { style, width, color } with CSS initial values.
  function parseOutlineShorthand(value) {
    const out = { style: 'none', width: 'medium', color: 'currentcolor' };
    for (const tok of splitTop(value, ' ')) {
      const t = lower(tok);
      if (LINE_STYLES.includes(t)) out.style = t;
      else if (lengthPx(t) != null) out.width = t;
      else out.color = t;
    }
    return out;
  }

  function parseBorderShorthand(value) {
    const out = { style: 'none', width: 'medium', color: 'currentcolor' };
    for (const tok of splitTop(value, ' ')) {
      const t = lower(tok);
      if (LINE_STYLES.includes(t)) out.style = t;
      else if (lengthPx(t) != null) out.width = t;
      else out.color = t;
    }
    return out;
  }

  // CSS-wide keywords: `initial` (and `unset`, none of these properties
  // being inherited but color) becomes the property's initial value; `revert`
  // on outline-style gives the browser's own ring back. Anything else stays
  // as written and is not measured.
  function normalizeKeyword(name, value) {
    const v = lower(value);
    const initialOf = () => {
      if (/-style$/.test(name)) return 'none';
      if (/-width$/.test(name)) return 'medium';
      if (/-color$/.test(name)) return 'currentcolor';
      if (name === 'box-shadow') return 'none';
      return v;
    };
    if (v === 'initial' || (v === 'unset' && name !== 'color')) return initialOf();
    if ((v === 'revert' || v === 'revert-layer') && name === 'outline-style') return 'auto';
    return v;
  }

  // The longhands a declaration block sets, as { name: { value, important } }.
  function longhandsOf(style) {
    const out = {};
    function set(name, value, important) {
      if (value === '' || value == null) return;
      out[name] = { value: normalizeKeyword(name, value), important };
    }
    const outline = getProp(style, 'outline');
    if (outline) {
      const o = parseOutlineShorthand(outline);
      const imp = isImportant(style, 'outline');
      set('outline-style', o.style, imp);
      set('outline-width', o.width, imp);
      set('outline-color', o.color, imp);
    }
    for (const part of ['style', 'width', 'color']) {
      const v = getProp(style, `outline-${part}`);
      if (v) set(`outline-${part}`, v, isImportant(style, `outline-${part}`));
    }
    const border = getProp(style, 'border');
    if (border) {
      const b = parseBorderShorthand(border);
      const imp = isImportant(style, 'border');
      for (const side of SIDES) {
        set(`border-${side}-style`, b.style, imp);
        set(`border-${side}-width`, b.width, imp);
        set(`border-${side}-color`, b.color, imp);
      }
    }
    for (const side of SIDES) {
      const s = getProp(style, `border-${side}`);
      if (s) {
        const b = parseBorderShorthand(s);
        const imp = isImportant(style, `border-${side}`);
        set(`border-${side}-style`, b.style, imp);
        set(`border-${side}-width`, b.width, imp);
        set(`border-${side}-color`, b.color, imp);
      }
    }
    for (const part of ['style', 'width', 'color']) {
      const all = getProp(style, `border-${part}`);
      if (all) {
        const toks = splitTop(all, ' ');
        // top, right, bottom, left from 1 to 4 values.
        const pick = [
          toks[0],
          toks[1] || toks[0],
          toks[2] || toks[0],
          toks[3] || toks[1] || toks[0]
        ];
        SIDES.forEach((side, i) =>
          set(`border-${side}-${part}`, pick[i], isImportant(style, `border-${part}`))
        );
      }
      for (const side of SIDES) {
        const v = getProp(style, `border-${side}-${part}`);
        if (v) set(`border-${side}-${part}`, v, isImportant(style, `border-${side}-${part}`));
      }
    }
    const shadow = getProp(style, 'box-shadow');
    if (shadow) set('box-shadow', shadow, isImportant(style, 'box-shadow'));
    const color = getProp(style, 'color');
    if (color) set('color', color, isImportant(style, 'color'));
    return out;
  }

  function hasOtherStyle(style) {
    return OTHER_PROPS.some((p) => getProp(style, p));
  }

  // Specificity [a, b, c] of one complex selector, and whether it is only
  // approximate (functional pseudo-classes).
  function specificity(part) {
    let s = String(part);
    const approximate = /:(is|not|where|has|nth-child|nth-last-child)\(/i.test(s);
    s = s.replace(/\([^()]*\)/g, '');
    const a = (s.match(/#[\w-]+/g) || []).length;
    const pseudoElements = (s.match(/::[\w-]+|:(before|after|first-line|first-letter)\b/gi) || [])
      .length;
    const b =
      (s.match(/\.[\w-]+/g) || []).length +
      (s.match(/\[[^\]]*\]/g) || []).length +
      (s.match(/(^|[^:]):[\w-]+/g) || []).length -
      (s.match(/(^|[^:]):(before|after|first-line|first-letter)\b/gi) || []).length;
    const c =
      (s.replace(/\[[^\]]*\]/g, '').match(/(^|[\s>+~(])[a-z][\w-]*/gi) || []).length +
      pseudoElements;
    return { spec: [0, a, b, c], approximate };
  }

  function compareSpec(x, y) {
    for (let i = 0; i < 4; i++) {
      if (x[i] !== y[i]) return x[i] - y[i];
    }
    return 0;
  }

  function splitSelectorList(selectorText) {
    return splitTop(selectorText, ',');
  }

  // :focus and :focus-visible, never :focus-within (ancestorFocusBase reads
  // that one, and :has() holding :focus, as styling an ancestor).
  const FOCUS_PSEUDO = /:focus(-visible)?(?![-\w])/g;
  function hasFocusPseudo(part) {
    FOCUS_PSEUDO.lastIndex = 0;
    return FOCUS_PSEUDO.test(part);
  }
  function splitCompounds(part) {
    const compounds = [];
    let depth = 0;
    let cur = '';
    for (const ch of part) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) {
        if (trim(cur)) compounds.push(trim(cur));
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (trim(cur)) compounds.push(trim(cur));
    return compounds;
  }
  // For a selector where focus on a descendant styles an element (a
  // compound with :focus-within, or :has() holding :focus), the compound
  // without them, which the focused element's ancestor matches; else null.
  function ancestorFocusBase(part) {
    const compounds = splitCompounds(part);
    for (const c of compounds) {
      const within = /:focus-within(?![-\w])/i.test(c);
      const inHas = /:has\([^)]*:focus/i.test(c);
      if (!within && !inHas) continue;
      const base = trim(
        c
          .replace(/:focus-within(?![-\w])/gi, '')
          .replace(/:has\((?:[^()]|\([^()]*\))*\)/gi, '')
          .replace(/::?[a-z-]+$/i, '')
      );
      return base || '*';
    }
    return null;
  }

  function stripFocus(sel) {
    return trim(String(sel).replace(FOCUS_PSEUDO, '')) || '*';
  }
  function hasPseudoElement(part) {
    return /::[a-z-]+/i.test(part) || /:(before|after)\b/i.test(part);
  }
  function matchesSafe(el, selector) {
    try {
      return !!(
        el &&
        typeof dom.get(el, 'matches') === 'function' &&
        selector &&
        dom.matches(el, selector)
      );
    } catch {
      return false;
    }
  }
  function closestSafe(el, selector) {
    try {
      return !!(
        el &&
        typeof dom.get(el, 'closest') === 'function' &&
        selector &&
        dom.closest(el, selector)
      );
    } catch {
      return false;
    }
  }

  const view = dom.defaultView(document) || null;
  const CSS_SUPPORTS_RULE = 12;

  // 'yes', 'no', or 'unknown' when the condition cannot be evaluated here
  // (no matchMedia in jsdom, a container query).
  function conditionApplies(cssRule, isSheet) {
    let text;
    try {
      text = lower(cssRule.media && cssRule.media.mediaText);
    } catch {
      text = '';
    }
    if (cssRule.media) {
      if (!text || text === 'all' || text === 'screen') return 'yes';
      if (!view || typeof view.matchMedia !== 'function') return 'unknown';
      try {
        return dom.get(view.matchMedia(text), 'matches') ? 'yes' : 'no';
      } catch {
        return 'unknown';
      }
    }
    if (isSheet) return 'yes';
    if (cssRule.type === CSS_SUPPORTS_RULE) {
      try {
        const css = view && view.CSS;
        if (css && typeof css.supports === 'function') {
          return css.supports(cssRule.conditionText) ? 'yes' : 'no';
        }
      } catch {}
      return 'unknown';
    }
    // @layer and the like carry no condition; @container does.
    return cssRule.conditionText ? 'unknown' : 'yes';
  }

  // Declarations in source order: { base, focus, longhands, spec,
  // approximate, order, other, conditional }.
  const decls = [];
  // Rules where focus on an element styles something else, or a
  // pseudo-element of it: { base, subject }.
  const indirect = [];
  let order = 0;

  function collect(cssRule, conditional) {
    const style = cssRule.style;
    if (!style) return;
    const longhands = longhandsOf(style);
    const other = hasOtherStyle(style);
    if (!Object.keys(longhands).length && !other) return;
    for (const part of splitSelectorList(cssRule.selectorText)) {
      order += 1;
      const { spec, approximate } = specificity(part);
      // Focus inside an ancestor styles that ancestor or what it holds: a
      // ring drawn on a wrapper with :focus-within or :has(:focus).
      const ancestorFocus = ancestorFocusBase(part);
      if (ancestorFocus) {
        indirect.push({ base: ancestorFocus, subject: false });
        continue;
      }
      if (!hasFocusPseudo(part)) {
        if (hasPseudoElement(part)) continue;
        decls.push({
          base: part,
          focus: false,
          longhands,
          spec,
          approximate,
          order,
          other: false,
          conditional
        });
        continue;
      }
      const compounds = splitCompounds(part);
      const focusIndex = compounds.findIndex((c) => hasFocusPseudo(c));
      const isSubject = focusIndex === compounds.length - 1;
      const focusedBase = stripFocus(compounds[focusIndex]).replace(/::?[a-z-]+$/i, '') || '*';
      if (!isSubject || hasPseudoElement(part)) {
        indirect.push({ base: focusedBase, subject: isSubject });
        continue;
      }
      decls.push({
        base: stripFocus(part),
        focus: true,
        longhands,
        spec,
        approximate,
        order,
        other,
        conditional
      });
    }
  }

  function walk(rules, depth, conditional) {
    if (!rules || depth > MAX_DEPTH) return;
    for (const cssRule of rules) {
      if (!cssRule) continue;
      if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
        collect(cssRule, conditional);
        continue;
      }
      const applies = conditionApplies(cssRule, false);
      if (applies === 'no') continue;
      const inner = conditional || applies === 'unknown';
      if (cssRule.type === CSS_IMPORT_RULE) {
        let imported;
        try {
          imported = cssRule.styleSheet ? cssRule.styleSheet.cssRules : null;
        } catch {
          imported = null;
        }
        walk(imported, depth + 1, inner);
        continue;
      }
      let nested;
      try {
        nested = cssRule.cssRules || null;
      } catch {
        nested = null;
      }
      if (nested) walk(nested, depth + 1, inner);
    }
  }

  try {
    for (const sheet of dom.styleSheets(document) || []) {
      const applies = sheet ? conditionApplies(sheet, true) : 'yes';
      if (applies === 'no') continue;
      let rules;
      try {
        rules = sheet && sheet.cssRules ? sheet.cssRules : null;
      } catch {
        continue; // cross-origin
      }
      walk(rules, 0, applies === 'unknown');
    }
  } catch {
    // no-throw
  }

  // The winning value of a longhand for a focused element, or
  // { unsettled: true } when approximate specificity decides between two
  // different values. `from` tells whether a focus rule set it.
  function resolve(list, name) {
    let best = null;
    for (const d of list) {
      const v = d.longhands[name];
      if (!v) continue;
      const cand = { value: v.value, important: v.important, d };
      if (!best) {
        best = cand;
        continue;
      }
      if (cand.important !== best.important) {
        if (cand.important) best = cand;
        continue;
      }
      const cmp = compareSpec(cand.d.spec, best.d.spec);
      const approximate = cand.d.approximate || best.d.approximate;
      if (approximate && cand.value !== best.value) {
        return { unsettled: true };
      }
      if (cmp > 0 || (cmp === 0 && cand.d.order > best.d.order)) best = cand;
    }
    return best ? { value: best.value, fromFocus: dom.get(best.d, 'focus') } : null;
  }

  function inlineDecl(el) {
    const style = el.style;
    if (!style) return null;
    const longhands = longhandsOf(style);
    if (!Object.keys(longhands).length) return null;
    return {
      base: '',
      focus: false,
      longhands,
      spec: [1, 0, 0, 0],
      approximate: false,
      order: Number.MAX_SAFE_INTEGER,
      other: false
    };
  }

  function computedStyleOf(el) {
    try {
      return view && view.getComputedStyle ? view.getComputedStyle(el) : null;
    } catch {
      return null;
    }
  }

  function parentOf(el) {
    return helpers.composedParent ? helpers.composedParent(el) : dom.parentElement(el);
  }

  // The color of the background painted at `el` (its own and what shows
  // through), or null when an image or gradient, or a translucent root in
  // strict mode, makes it unknown.
  function backgroundAt(el) {
    if (!el || dom.nodeType(el) !== 1) return null;
    for (let n = el; n && dom.nodeType(n) === 1; n = parentOf(n)) {
      const cs = computedStyleOf(n);
      if (cs && helpers.contrast.hasBackgroundImageOrGradient(cs)) return null;
      const bg = helpers.contrast.parseCssColorToRgba(cs && cs.backgroundColor);
      if (bg && bg.a >= 1) break;
    }
    const res = helpers.contrast.computeEffectiveBackground(el, bgOpts);
    if (!res || res.ok === false || !res.rgba) return null;
    return { r: res.rgba.r, g: res.rgba.g, b: res.rgba.b, a: 1 };
  }

  function toRgba(colorValue, currentColor) {
    const c = readColor(colorValue);
    if (!c || c.unknown) return null;
    if (c.value === 'currentcolor') return currentColor;
    // parseCssColorToRgba falls back to the platform, which reads an invalid
    // value as the inherited color, so the value is checked first.
    if (!isColorToken(c.value)) return null;
    return helpers.contrast.parseCssColorToRgba(c.value);
  }

  // One indicator's contrast against the colors it touches. `over` is the
  // color it is painted on (for translucent colors).
  function measure(rgba, over, sides) {
    if (!rgba || !over || sides.some((s) => !s)) return null;
    const painted =
      rgba.a != null && rgba.a < 1
        ? helpers.contrast.compositeRgba(rgba, over)
        : { r: rgba.r, g: rgba.g, b: rgba.b, a: 1 };
    const ratios = sides.map((s) => helpers.contrast.contrastRatio(painted, s));
    return { ratios, color: helpers.contrast.rgbToHex(painted) };
  }

  function parseShadows(value) {
    if (!value || value === 'none') return [];
    return splitTop(value, ',').map((layer) => {
      const toks = splitTop(layer, ' ');
      let inset = false;
      const lengths = [];
      let color = 'currentcolor';
      for (const tok of toks) {
        const t = lower(tok);
        if (t === 'inset') inset = true;
        else if (lengthPx(t) != null) lengths.push(lengthPx(t));
        else color = t;
      }
      const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
      return { inset, x, y, blur, spread, color };
    });
  }

  const getFocusableInfo =
    typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const isDomVisibleEligible =
    typeof helpers.isDomVisibleEligible === 'function' ? helpers.isDomVisibleEligible : null;

  function isTabbable(el) {
    if (!getFocusableInfo) return false;
    try {
      const info = getFocusableInfo(el, ctx);
      return !!(info && info.tabbable);
    } catch {
      return false;
    }
  }
  function isRendered(el) {
    if (!isDomVisibleEligible) return true;
    try {
      const vis = isDomVisibleEligible(el, ctx, {
        visibilityMode: 'styleOnly',
        disableGeometry: true
      });
      return !(vis && vis.eligible === false);
    } catch {
      return true;
    }
  }

  // Evaluates one element: null (not in scope), or { verdict, reasonCode,
  // details }. A verdict that rests on a rule whose @media or other
  // condition cannot be evaluated here becomes a question.
  function evaluate(el) {
    const own = decls.filter((d) => matchesSafe(el, d.base));
    const res = evaluateWith(el, own);
    if (res && res.verdict !== 'cantTell' && own.some((d) => d.conditional)) {
      return { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: 'condition' } };
    }
    return res;
  }

  function evaluateWith(el, own) {
    const inline = inlineDecl(el);
    if (inline) own.push(inline);

    const outlineStyle = resolve(own, 'outline-style');
    const outlineWidth = resolve(own, 'outline-width');
    const outlineColor = resolve(own, 'outline-color');
    if (!outlineStyle && !outlineWidth) return null; // native outline kept
    if ([outlineStyle, outlineWidth, outlineColor].some((r) => r && r.unsettled)) {
      return { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: 'cascade' } };
    }
    if (outlineStyle && outlineStyle.value === 'auto') return null;
    if (!outlineStyle) {
      const w = lengthPx(outlineWidth.value);
      if (w == null || w > 0) return null; // a width change alone keeps the native ring
    }

    const focusColor = resolve(own, 'color');
    const cs = computedStyleOf(el);
    const currentColor =
      focusColor && !focusColor.unsettled && focusColor.fromFocus
        ? toRgba(focusColor.value, null)
        : helpers.contrast.parseCssColorToRgba(cs && cs.color);

    const outer = backgroundAt(parentOf(el));
    const inner = backgroundAt(el);

    const indicators = []; // { property, m, blurred }
    let unmeasured = null; // 'color' or 'background'
    let unsettled = false;

    function add(property, rgba, over, sides, blurred) {
      const m = measure(rgba, over, sides);
      if (m) indicators.push({ property, m, blurred });
      else if (!unmeasured) unmeasured = rgba ? 'background' : 'color';
    }

    // Outline from a focus rule.
    if (outlineStyle && outlineStyle.fromFocus) {
      const style = outlineStyle.value;
      const width = outlineWidth ? lengthPx(outlineWidth.value) : WIDTH_KEYWORDS.medium;
      const colorValue = outlineColor ? outlineColor.value : 'currentcolor';
      const visible =
        !['none', 'hidden'].includes(style) && width !== 0 && colorValue !== 'transparent';
      if (visible) {
        add('outline', toRgba(colorValue, currentColor), outer, [outer, inner], false);
      }
    }

    // Borders from a focus rule, side by side.
    for (const side of SIDES) {
      const bs = resolve(own, `border-${side}-style`);
      const bw = resolve(own, `border-${side}-width`);
      const bc = resolve(own, `border-${side}-color`);
      if ([bs, bw, bc].some((r) => r && r.unsettled)) {
        unsettled = true;
        continue;
      }
      if (![bs, bw, bc].some((r) => r && r.fromFocus)) continue;
      const style = bs ? bs.value : lower(cs && cs.getPropertyValue(`border-${side}-style`));
      const width = bw
        ? lengthPx(bw.value)
        : lengthPx(cs && cs.getPropertyValue(`border-${side}-width`));
      const colorValue = bc
        ? bc.value
        : lower(cs && cs.getPropertyValue(`border-${side}-color`)) || 'currentcolor';
      if (['none', 'hidden', ''].includes(style) || width === 0 || colorValue === 'transparent') {
        continue;
      }
      add(`border-${side}`, toRgba(colorValue, currentColor), inner, [outer, inner], false);
    }

    // Box shadows from a focus rule.
    const shadow = resolve(own, 'box-shadow');
    if (shadow && shadow.unsettled) unsettled = true;
    else if (shadow && shadow.fromFocus) {
      for (const layer of parseShadows(shadow.value)) {
        if (layer.color === 'transparent') continue;
        if (!layer.spread && !dom.get(layer, 'blur') && !layer.x && !layer.y) continue;
        if (layer.spread < 0 && !dom.get(layer, 'blur')) continue;
        const rgba = toRgba(layer.color, currentColor);
        const blurred = dom.get(layer, 'blur') > 0 && layer.spread <= 0;
        if (layer.inset) add('box-shadow (inset)', rgba, inner, [inner], blurred);
        else add('box-shadow', rgba, outer, [outer, inner], blurred);
      }
    }

    // A focus style this rule does not measure: other properties, a rule
    // that styles a pseudo-element or another element, or an inline focus
    // handler that may paint one from script.
    const otherStyle =
      own.some((d) => dom.get(d, 'focus') && d.other) ||
      indirect.some((p) => (p.subject ? matchesSafe(el, p.base) : closestSafe(el, p.base))) ||
      dom.hasAttribute(el, 'onfocus') ||
      dom.hasAttribute(el, 'onfocusin');

    return decide(indicators, unmeasured, unsettled, otherStyle);
  }

  // The verdict from the measured indicators: null when there is nothing to
  // judge (the outline is removed with nothing in its place, which is
  // css-focus-indicator-suppressed's case).
  function decide(indicators, unmeasured, unsettled, otherStyle) {
    if (!indicators.length && !unmeasured && !unsettled && !otherStyle) return null;

    const details = (ind) => ({
      property: ind.property,
      color: ind.m.color,
      // Two decimals, except that a ratio below 3 never reads 3.00.
      ratios: ind.m.ratios.map((r) => {
        const rounded = Number(helpers.contrast.round2(r));
        return r < MIN_RATIO && rounded >= MIN_RATIO ? 2.99 : rounded;
      })
    });

    const full = indicators.find((i) => !i.blurred && i.m.ratios.every((r) => r >= MIN_RATIO));
    if (full) {
      // The lowest of its ratios, unrounded, for the result's margin.
      return { verdict: 'pass', details: details(full), ratio: Math.min(...full.m.ratios) };
    }

    if (unsettled) {
      return { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: 'cascade' } };
    }
    if (unmeasured) {
      return { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: unmeasured } };
    }
    const oneSide = indicators.find((i) => i.m.ratios.some((r) => r >= MIN_RATIO));
    if (oneSide) {
      return {
        verdict: 'cantTell',
        reasonCode: oneSide.blurred ? 'notComputable' : 'oneSide',
        details: { ...details(oneSide), ...(oneSide.blurred ? { cause: 'blur' } : {}) }
      };
    }
    if (otherStyle) {
      return {
        verdict: 'cantTell',
        reasonCode: 'notMeasured',
        details: indicators.length ? details(indicators[0]) : {}
      };
    }
    const worst = indicators
      .slice()
      .sort((a, b) => Math.max(...b.m.ratios) - Math.max(...a.m.ratios))[0];
    return { verdict: 'fail', reasonCode: 'lowContrast', details: details(worst) };
  }

  // Where the page has a layout (a browser), the element is focused and what
  // the browser draws is measured: the computed style settles variables,
  // @media and the cascade, and the colors next to the indicator are read
  // from what is painted there. jsdom has no layout and keeps the stylesheet
  // reading above.
  function hasLayout() {
    const probe = dom.documentElement(document) || null;
    if (!probe || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    if (typeof dom.get(document, 'elementsFromPoint') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }
  const layout = hasLayout();

  const RING_PROPS = ['outline-style', 'outline-width', 'outline-color', 'outline-offset'];
  const BORDER_PROPS = (side) => [
    `border-${side}-style`,
    `border-${side}-width`,
    `border-${side}-color`
  ];
  const RENDERED_OTHER = [
    'background-color',
    'background-image',
    'color',
    'filter',
    'font-weight',
    'opacity',
    'text-decoration-line',
    'text-decoration-color',
    'text-shadow',
    'transform'
  ];
  const PSEUDO_PROPS = [
    'content',
    'display',
    'background-color',
    'background-image',
    'border-top-color',
    'border-top-width',
    'box-shadow',
    'color',
    'opacity',
    'outline-style',
    'transform'
  ];

  function snapshot(el) {
    const out = {};
    const cs = view.getComputedStyle(el);
    for (const p of [
      ...RING_PROPS,
      ...SIDES.flatMap(BORDER_PROPS),
      'box-shadow',
      ...RENDERED_OTHER
    ]) {
      out[p] = cs.getPropertyValue(p);
    }
    for (const pseudo of ['::before', '::after']) {
      const ps = view.getComputedStyle(el, pseudo);
      out[pseudo] = PSEUDO_PROPS.map((p) => ps.getPropertyValue(p)).join('|');
    }
    return out;
  }

  // The elements a focus style may be drawn on instead of the element: its
  // ancestors, up to the first one clearly larger than it and at most four
  // levels, and its labels. Their transitions are not held off, so a
  // change that starts on focus is found at once, and then asked about.
  function relatedOf(el) {
    const out = [];
    let rect = null;
    try {
      rect = dom.getBoundingClientRect(el);
    } catch {}
    for (let a = parentOf(el), n = 0; a && n < 4; a = parentOf(a), n += 1) {
      if (a === dom.body(document) || a === dom.documentElement(document)) break;
      out.push(a);
      let r = null;
      try {
        r = dom.getBoundingClientRect(a);
      } catch {}
      if (rect && r && (r.width > rect.width + 16 || r.height > rect.height + 16)) break;
    }
    try {
      for (const l of helpers.getAssociatedLabelElements
        ? helpers.getAssociatedLabelElements(el) || []
        : []) {
        if (!out.includes(l)) out.push(l);
      }
    } catch {}
    return out;
  }
  const RELATED_PROPS = [
    'outline-style',
    'outline-width',
    'outline-color',
    'box-shadow',
    'background-color',
    'background-image',
    'color',
    'text-decoration-line',
    ...SIDES.flatMap(BORDER_PROPS)
  ];
  function relatedSnapshot(node) {
    try {
      const cs = view.getComputedStyle(node);
      return RELATED_PROPS.map((p) => cs.getPropertyValue(p)).join('|');
    } catch {
      return '';
    }
  }

  function deepActiveElement() {
    let cur = dom.activeElement(document) || null;
    let guard = 0;
    while (cur && dom.shadowRoot(cur) && dom.activeElement(dom.shadowRoot(cur)) && guard++ < 20) {
      cur = dom.activeElement(dom.shadowRoot(cur));
    }
    return cur;
  }

  // Runs fn(before, after) with the element focused as by the keyboard,
  // transitions switched off so the focused values are read at once, then
  // puts focus and the style attribute back. undefined when the element
  // could not be focused.
  function whileFocused(el, fn) {
    const previous = deepActiveElement();
    const hadStyle = dom.hasAttribute(el, 'style');
    const styleAttr = dom.getAttribute(el, 'style');
    const related = relatedOf(el);
    try {
      el.style.setProperty('transition', 'none', 'important');
      if (previous === el) dom.blur(el);
      const before = snapshot(el);
      const relatedBefore = related.map(relatedSnapshot);
      dom.focus(el, { preventScroll: true, focusVisible: true });
      if (deepActiveElement() !== el) return undefined;
      const relatedChanged = related.some((r, i) => relatedSnapshot(r) !== relatedBefore[i]);
      return fn(before, snapshot(el), relatedChanged);
    } catch {
      return undefined;
    } finally {
      try {
        if (
          previous &&
          previous !== dom.body(document) &&
          typeof dom.get(previous, 'focus') === 'function'
        ) {
          if (deepActiveElement() !== previous) dom.focus(previous, { preventScroll: true });
        } else if (deepActiveElement() === el) {
          dom.blur(el);
        }
      } catch {}
      // Reading the attribute first makes Chromium write the inline style
      // back to it; removed before that, it comes back as style="".
      dom.getAttribute(el, 'style');
      if (hadStyle) dom.setAttribute(el, 'style', styleAttr);
      else dom.removeAttribute(el, 'style');
    }
  }

  function px(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  // The elements painted at a point, topmost first, as the tree holding
  // the element sees them. The document's list stops at the shadow host
  // around an element in a shadow tree, so it would read the host's colors
  // and take the element as covered by its own host. A shadow root's list
  // holds the elements of its tree and of every tree around it, and an
  // element of another tree (one inside this tree, or beside it) as the
  // host in this tree or around it that holds it: so something painted
  // over the element in any of the trees around it still comes first.
  function elementsAt(el, x, y) {
    let scope = document;
    try {
      const root = dom.getRootNode(el);
      if (
        root &&
        root !== document &&
        dom.nodeType(root) === 11 &&
        typeof dom.get(root, 'elementsFromPoint') === 'function'
      ) {
        scope = root;
      }
    } catch {}
    return dom.elementsFromPoint(scope, x, y) || [];
  }

  // The color painted at a point outside the element: the background of the
  // topmost other element there. undefined when the point is outside the
  // viewport, null when an image or gradient makes it unknown.
  function paintedAt(el, x, y) {
    const w = view.innerWidth;
    const h = view.innerHeight;
    if (!(x >= 0 && y >= 0 && x < w && y < h)) return undefined;
    let stack;
    try {
      stack = elementsAt(el, x, y);
    } catch {
      return undefined;
    }
    const top = stack.find((n) => n !== el && !dom.contains(el, n));
    return top && top !== dom.documentElement(document) ? backgroundAt(top) : canvasColor();
  }

  // The canvas: the root's background, or the body's when the root has none,
  // which is what the browser paints there.
  function canvasColor() {
    const root = dom.documentElement(document);
    const cs = root ? computedStyleOf(root) : null;
    const bg = helpers.contrast.parseCssColorToRgba(cs && cs.backgroundColor);
    const rootPainted =
      (bg && bg.a > 0) || (cs && helpers.contrast.hasBackgroundImageOrGradient(cs));
    return backgroundAt(!rootPainted && dom.body(document) ? dom.body(document) : root);
  }

  // What is around an element whose surroundings are outside the viewport:
  // the background of the first ancestor larger than the element. A parent
  // with the element's own box (a button filling its <li>) has the color
  // under the element, not around it. null when there is none.
  function backgroundBeyond(el, rect) {
    for (let a = parentOf(el), guard = 0; a && guard < 50; a = parentOf(a), guard++) {
      if (a === dom.documentElement(document)) return canvasColor();
      let r = null;
      try {
        r = dom.getBoundingClientRect(a);
      } catch {}
      if (r && (r.width > rect.width + 1 || r.height > rect.height + 1)) return backgroundAt(a);
    }
    return null;
  }

  // The colors next to the element on the given sides, `dist` pixels
  // outside its border box. A side outside the viewport falls back to the
  // background of the first ancestor larger than the element.
  function colorsAround(el, rect, dist, sides) {
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;
    const points = {
      top: [midX, rect.top - dist],
      right: [rect.right + dist, midY],
      bottom: [midX, rect.bottom + dist],
      left: [rect.left - dist, midY]
    };
    let fallback;
    const colors = [];
    for (const side of sides) {
      let c = paintedAt(el, points[side][0], points[side][1]);
      if (c === undefined) {
        if (fallback === undefined) fallback = backgroundBeyond(el, rect);
        c = fallback;
      }
      if (!c) return null;
      if (!colors.some((k) => k.r === c.r && k.g === c.g && k.b === c.b)) colors.push(c);
    }
    return colors;
  }

  // A ::before or ::after positioned over most of the element with a fill of
  // its own (a color other than the element's, an image): what it paints
  // may be the element's visible background, so the inner color is unknown.
  function pseudoFill(el, rect, bg) {
    for (const pseudo of ['::before', '::after']) {
      let ps;
      try {
        ps = view.getComputedStyle(el, pseudo);
      } catch {
        continue;
      }
      const content = ps.getPropertyValue('content');
      if (!content || content === 'none' || content === 'normal') continue;
      if (!['absolute', 'fixed'].includes(ps.getPropertyValue('position'))) continue;
      if (px(ps.width) < rect.width * 0.9 || px(ps.height) < rect.height * 0.9) continue;
      if (helpers.contrast.hasBackgroundImageOrGradient(ps)) return true;
      const fill = helpers.contrast.parseCssColorToRgba(ps.backgroundColor);
      if (!fill || !fill.a) continue;
      if (!bg || fill.r !== bg.r || fill.g !== bg.g || fill.b !== bg.b || fill.a !== bg.a) {
        return true;
      }
    }
    return false;
  }

  // The element's own background while focused, over what is behind it.
  // What is behind it is read at its center, like the colors around it.
  function focusedBackground(el, rect) {
    const cs = view.getComputedStyle(el);
    if (helpers.contrast.hasBackgroundImageOrGradient(cs)) return null;
    const bg = helpers.contrast.parseCssColorToRgba(cs.backgroundColor);
    if (pseudoFill(el, rect, bg)) return null;
    if (bg && bg.a >= 1) return { r: bg.r, g: bg.g, b: bg.b, a: 1 };
    let behind = paintedAt(el, rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (behind === undefined) behind = backgroundAt(parentOf(el));
    if (!behind) return null;
    if (!bg || !bg.a) return behind;
    const c = helpers.contrast.compositeRgba(bg, behind);
    return { r: c.r, g: c.g, b: c.b, a: 1 };
  }

  // One indicator against the colors outside it and the element's own
  // background. A translucent indicator is composited over each outside
  // color in turn (over the element's background for a border).
  function measureAround(rgba, outside, inner, overInner) {
    if (!rgba || !outside || !inner) return null;
    const ratios = [];
    let painted = null;
    for (const out of overInner ? [inner] : outside) {
      painted =
        rgba.a != null && rgba.a < 1
          ? helpers.contrast.compositeRgba(rgba, out)
          : { r: rgba.r, g: rgba.g, b: rgba.b, a: 1 };
      for (const side of overInner ? outside : [out]) {
        ratios.push(helpers.contrast.contrastRatio(painted, side));
      }
      ratios.push(helpers.contrast.contrastRatio(painted, inner));
    }
    return { ratios, color: helpers.contrast.rgbToHex(painted) };
  }

  // Whether something else is painted over the element's center, such as a
  // cookie consent overlay: the colors read around it would be the
  // overlay's. Not known for a center outside the viewport, or an element
  // hit testing skips (pointer-events: none).
  function covered(el, rect) {
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    if (!(x >= 0 && y >= 0 && x < view.innerWidth && y < view.innerHeight)) return false;
    if (view.getComputedStyle(el).pointerEvents === 'none') return false;
    let stack;
    try {
      stack = elementsAt(el, x, y);
    } catch {
      return false;
    }
    const top = stack[0];
    return !!top && top !== el && !dom.contains(el, top);
  }

  function evaluateRendered(el) {
    return whileFocused(el, (before, after, relatedChanged) => {
      if (after['outline-style'] === 'auto') return null; // the browser's outline
      const changed = (props) => props.some((p) => before[p] !== after[p]);
      const visibleColor = (value) => {
        const c = helpers.contrast.parseCssColorToRgba(value);
        return c && c.a > 0 ? c : null;
      };

      if (typeof dom.get(el, 'getAnimations') === 'function' && dom.getAnimations(el).length) {
        return {
          verdict: 'cantTell',
          reasonCode: 'notComputable',
          details: { cause: 'animation' }
        };
      }

      const rect = dom.getBoundingClientRect(el);
      if (covered(el, rect)) {
        return { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: 'covered' } };
      }
      const inner = focusedBackground(el, rect);
      const indicators = [];
      let unmeasured = null;
      function add(property, rgba, outside, overInner, blurred) {
        const m = measureAround(rgba, outside, inner, overInner);
        if (m) indicators.push({ property, m, blurred });
        else if (!unmeasured) unmeasured = 'background';
      }

      // Outline drawn on focus, measured halfway across its width.
      const ow = px(after['outline-width']);
      const outlineColor = visibleColor(after['outline-color']);
      if (
        changed(RING_PROPS) &&
        !['none', 'hidden'].includes(after['outline-style']) &&
        ow > 0 &&
        outlineColor
      ) {
        const dist = Math.max(1, px(after['outline-offset']) + ow / 2);
        add('outline', outlineColor, colorsAround(el, rect, dist, SIDES), false, false);
      }

      // Borders that change on focus, side by side.
      for (const side of SIDES) {
        const props = BORDER_PROPS(side);
        if (!changed(props)) continue;
        const color = visibleColor(after[props[2]]);
        if (['none', 'hidden'].includes(after[props[0]]) || px(after[props[1]]) <= 0 || !color) {
          continue;
        }
        add(`border-${side}`, color, colorsAround(el, rect, 1, [side]), true, false);
      }

      // Box shadows that change on focus.
      if (changed(['box-shadow'])) {
        for (const layer of parseShadows(after['box-shadow'])) {
          const color = visibleColor(layer.color);
          if (!color) continue;
          if (!layer.spread && !dom.get(layer, 'blur') && !layer.x && !layer.y) continue;
          if (layer.spread < 0 && !dom.get(layer, 'blur')) continue;
          const blurred = dom.get(layer, 'blur') > 0 && layer.spread <= 0;
          if (layer.inset) {
            const m = inner ? measure(color, inner, [inner]) : null;
            if (m) indicators.push({ property: 'box-shadow (inset)', m, blurred });
            else if (!unmeasured) unmeasured = 'background';
          } else {
            const dist = Math.max(1, Math.max(layer.spread, dom.get(layer, 'blur')) / 2);
            add('box-shadow', color, colorsAround(el, rect, dist, SIDES), false, blurred);
          }
        }
      }

      // A ring drawn on a wrapper (:focus-within) or a label shows focus as
      // well as the element's own style: it is not measured here.
      const otherStyle =
        changed(RENDERED_OTHER) ||
        changed(['::before', '::after']) ||
        relatedChanged ||
        indirect.some((p) => (p.subject ? matchesSafe(el, p.base) : closestSafe(el, p.base))) ||
        dom.hasAttribute(el, 'onfocus') ||
        dom.hasAttribute(el, 'onfocusin');

      return decide(indicators, unmeasured, false, otherStyle);
    });
  }

  const MESSAGES = {
    lowContrast: {
      summary: (p) =>
        `The ${p.property} this element shows on focus (${p.color}) has a contrast ratio of ${p.ratio}:1 with the colors next to it, below 3:1.`,
      hint: 'Give the focus indicator a color with a contrast ratio of at least 3:1 against the background behind the element and against the element itself (RGAA 10.7.1).'
    },
    oneSide: {
      summary: (p) =>
        `The ${p.property} this element shows on focus (${p.color}) reaches 3:1 against only one of the colors next to it (${p.ratio}:1 against the other).`,
      hint: 'Check on the page that the focus indicator is clearly visible, with a contrast ratio of at least 3:1 (RGAA 10.7.1).'
    },
    notComputable: {
      summary: () =>
        "The contrast of this element's focus indicator could not be computed (a background image, a gradient, a blurred shadow, an animation, a CSS variable, a condition such as @media, or rules the engine cannot order).",
      hint: 'Measure the contrast of the focus indicator on the page: it needs a ratio of at least 3:1 with the colors next to it (RGAA 10.7.1).'
    },
    notMeasured: {
      summary: () =>
        "This element's focus style changes something the engine does not measure (background, text color, underline, or another element).",
      hint: 'Check on the page that the focus style is visible, with a contrast ratio of at least 3:1 (RGAA 10.7.1).'
    }
  };

  const CANDIDATES =
    'a[href],area[href],button,input,select,textarea,summary,iframe,frame,audio[controls],video[controls],[tabindex],[contenteditable]';
  const candidates = helpers.queryAllSmart
    ? helpers.queryAllSmart(CANDIDATES)
    : helpers.queryAll(CANDIDATES);

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let passCount = 0;
  // Indicators that reach 3:1, for the result's margin (src/core/margin.js),
  // and how many elements' focus styles were judged.
  const marginCandidates = [];
  let judgedCount = 0;

  // Focus makes the browser's focus ring appear, and an outline that
  // appears costs Chromium a layout of the whole page, for each element
  // focused. While the elements are focused, the candidates are given the
  // ring's style (outline-style: auto) at rest, in a cascade layer declared
  // before any other: below every author rule, as the browser's own ring
  // is, so an author outline overrides both alike, and the browser's focus
  // rule still gives the ring its width and color. Focus then draws no new
  // outline. An element whose focused outline-style is auto is the
  // browser's outline either way, and one an author rule sets otherwise
  // differs from its resting style either way, so the verdicts are the
  // same. Ancestors of candidates and labels, read as related elements to
  // find a ring drawn around the element, are left out, and so is an
  // element in a shadow tree that holds a <slot>, which may be the
  // ancestor of a candidate slotted into it.
  // A shadow tree's own rules (:host, ::slotted) lose to the tree around
  // it, whatever their layer, so an element that hosts an open shadow root
  // or is the child of one is marked and left out too; so are the hosts
  // around a candidate in a shadow tree, whose ancestors are then left out
  // as the candidate's are.
  // A document's style sheet does not reach into a shadow tree, so each
  // open shadow root holding a candidate adopts the same rule, first in
  // its adoptedStyleSheets, and gets its own list back afterwards. A root
  // whose own sheets declare a cascade layer, or cannot be read, is left
  // out: an adopted sheet comes after them, and its layer would not be the
  // lowest. So is a root whose adoptedStyleSheets cannot be set.
  const NO_RING_ATTR = 'data-surea11y-no-ring';
  const RING_CSS = `@layer surea11y-focus-ring{:is(${CANDIDATES}):not(label, [${NO_RING_ATTR}], :has(:is(${CANDIDATES}, slot, [${NO_RING_ATTR}]))){outline-style:auto}}`;

  // Whether the root's own style sheets declare a cascade layer (or may:
  // one cannot be read).
  function declaresLayer(root) {
    const walk = (rules, depth) => {
      for (const r of rules || []) {
        const name = r && r.constructor && r.constructor.name;
        if (name === 'CSSLayerBlockRule' || name === 'CSSLayerStatementRule') return true;
        if (name === 'CSSImportRule') {
          if (r.layerName != null) return true;
          let nested = null;
          try {
            nested = r.styleSheet && r.styleSheet.cssRules;
          } catch {
            return true;
          }
          if (nested && depth < MAX_DEPTH && walk(nested, depth + 1)) return true;
        } else if (r && r.cssRules && depth < MAX_DEPTH && walk(r.cssRules, depth + 1)) {
          return true;
        }
      }
      return false;
    };
    try {
      for (const sheet of dom.get(root, 'styleSheets') || []) {
        if (walk(sheet.cssRules, 0)) return true;
      }
      return false;
    } catch {
      return true;
    }
  }

  // Puts the sheet first in each open shadow root holding one of the
  // elements; returns what puts each root's list back. A list changed
  // since (a script on the page) keeps its change, without the sheet.
  function adoptInShadowRoots(elements, css) {
    const Sheet = view && view.CSSStyleSheet;
    if (typeof Sheet !== 'function') return () => {};
    const roots = new Set();
    for (const el of elements) {
      try {
        const root = dom.getRootNode(el);
        if (root && root !== document && dom.nodeType(root) === 11 && dom.host(root)) {
          roots.add(root);
        }
      } catch {}
    }
    const adopted = [];
    if (!roots.size) return () => {};
    let sheet;
    try {
      sheet = new Sheet();
      sheet.replaceSync(css);
    } catch {
      return () => {};
    }
    for (const root of roots) {
      try {
        if (declaresLayer(root)) continue;
        const own = dom.get(root, 'adoptedStyleSheets');
        if (!own || typeof own.length !== 'number') continue;
        const before = [...own];
        root.adoptedStyleSheets = [sheet, ...before];
        const now = dom.get(root, 'adoptedStyleSheets');
        if (!now || now[0] !== sheet || now.length !== before.length + 1) {
          if (now && [...now].includes(sheet)) {
            root.adoptedStyleSheets = [...now].filter((x) => x !== sheet);
          }
          continue;
        }
        adopted.push([root, before]);
      } catch {}
    }
    return () => {
      for (const [root, before] of adopted) {
        try {
          const now = [...dom.get(root, 'adoptedStyleSheets')];
          const untouched =
            now.length === before.length + 1 &&
            now[0] === sheet &&
            before.every((x, i) => now[i + 1] === x);
          if (untouched) root.adoptedStyleSheets = before;
          else if (now.includes(sheet)) root.adoptedStyleSheets = now.filter((x) => x !== sheet);
        } catch {}
      }
    };
  }

  // A tree (the document or a shadow root) whose styles make focus draw no
  // outline gains nothing from the ring at rest and pays for it, so each
  // tree is probed first: one of its candidates in the tab order is
  // focused, without the ring, and the tree gets the ring only if an
  // outline appears that was not there at rest. Shadow roots whose style
  // sheets are the same (the copies of one component) share one probe,
  // since one link per root is the common case. The ring changes only
  // what focus costs, not what it shows, so a probe that guesses wrong for
  // another element of the tree changes the time taken, not the verdicts.
  // A tree whose probe cannot focus its element keeps the ring.
  const adoptedIds = new Map();
  function treeKey(root) {
    if (root === document) return root;
    const parts = [];
    try {
      for (const s of dom.get(root, 'styleSheets') || []) {
        const node = s.ownerNode;
        let media = '';
        try {
          media = s.media ? s.media.mediaText : '';
        } catch {}
        parts.push(
          `${s.disabled ? 'd' : ''}${media}|${node && dom.localName(node) === 'style' ? dom.textContent(node) : s.href}`
        );
      }
      for (const s of dom.get(root, 'adoptedStyleSheets') || []) {
        if (!adoptedIds.has(s)) adoptedIds.set(s, adoptedIds.size);
        parts.push(`a${adoptedIds.get(s)}`);
      }
    } catch {
      return root;
    }
    return parts.join('\u0000');
  }

  // The roots whose probe found an outline drawn on focus, or could not
  // focus its element.
  function treesWithRing() {
    const keyOf = new Map(); // root -> tree key
    const outline = new Map(); // tree key -> whether focus draws one
    for (const el of candidates) {
      try {
        if (!el || dom.nodeType(el) !== 1 || dom.hasAttribute(el, NO_RING_ATTR)) continue;
        const root = dom.getRootNode(el);
        if (!root) continue;
        if (!keyOf.has(root)) keyOf.set(root, treeKey(root));
        const key = keyOf.get(root);
        if (outline.has(key) || !isTabbable(el) || !isRendered(el)) continue;
        const appears = whileFocused(
          el,
          (before, after) => before['outline-style'] === 'none' && after['outline-style'] !== 'none'
        );
        outline.set(key, appears !== false);
      } catch {}
    }
    const ringed = new Set();
    for (const [root, key] of keyOf) if (outline.get(key)) ringed.add(root);
    return ringed;
  }

  function drawRings() {
    if (!layout) return () => {};
    const marked = [];
    const hostsSeen = new Set();
    const mark = (el) => {
      if (dom.hasAttribute(el, NO_RING_ATTR)) return false;
      dom.setAttribute(el, NO_RING_ATTR, '');
      marked.push(el);
      return true;
    };
    for (const el of candidates) {
      try {
        if (!el || dom.nodeType(el) !== 1) continue;
        const parent = dom.parentElement(el);
        if (dom.shadowRoot(el) || (parent && dom.shadowRoot(parent))) mark(el);
        // The hosts around a candidate in a shadow tree, so that their
        // ancestors are left out as the candidate's own would be; only a
        // host with a candidate or label above it needs the mark.
        let root = dom.getRootNode(el);
        for (let guard = 0; root && root !== document && guard < 50; guard += 1) {
          const host = dom.nodeType(root) === 11 ? dom.host(root) : null;
          if (!host || hostsSeen.has(host)) break;
          hostsSeen.add(host);
          const above = dom.parentElement(host);
          if (above && dom.closest(above, `${CANDIDATES}, label`)) mark(host);
          root = dom.getRootNode(host);
        }
      } catch {}
    }
    const ringed = treesWithRing();
    let sheet = null;
    try {
      if (ringed.has(document)) {
        const host = dom.head(document) || dom.documentElement(document);
        sheet = dom.createElement(document, 'style');
        sheet.textContent = RING_CSS;
        dom.insertBefore(host, sheet, dom.firstChild(host));
      }
    } catch {
      sheet = null;
    }
    const unadopt = adoptInShadowRoots(
      [...candidates].filter((el) => {
        try {
          return ringed.has(dom.getRootNode(el));
        } catch {
          return false;
        }
      }),
      RING_CSS
    );
    return () => {
      unadopt();
      try {
        if (sheet && dom.parentNode(sheet)) dom.removeChild(dom.parentNode(sheet), sheet);
      } catch {}
      for (const el of marked) {
        try {
          dom.removeAttribute(el, NO_RING_ATTR);
        } catch {}
      }
    };
  }
  const removeRings = drawRings();
  try {
    for (const el of candidates) {
      if (!el || dom.nodeType(el) !== 1) continue;
      if (!isTabbable(el) || !isRendered(el)) continue;
      let res;
      try {
        res = layout ? evaluateRendered(el) : undefined;
        if (res === undefined) res = evaluate(el);
      } catch {
        res = { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: 'error' } };
      }
      if (!res) continue;
      judgedCount += 1;
      if (res.verdict === 'pass') {
        passCount += 1;
        if (Number.isFinite(res.ratio)) {
          marginCandidates.push({
            el,
            value: res.ratio,
            threshold: MIN_RATIO,
            context: { property: (res.details && res.details.property) || '' }
          });
        }
        continue;
      }
      const d = res.details || {};
      const ratios = Array.isArray(d.ratios) ? d.ratios : [];
      const ratio = ratios.length
        ? String(res.reasonCode === 'oneSide' ? Math.min(...ratios) : Math.max(...ratios))
        : '';
      const params = { property: d.property || '', color: d.color || '', ratio };
      const msg = MESSAGES[res.reasonCode];
      const uncertainty =
        res.verdict !== 'cantTell'
          ? null
          : res.reasonCode === 'notComputable'
            ? {
                code: 'not-computable',
                needed: 'The rendered color of the focus indicator and of the colors next to it.',
                evidence: { reasonCode: res.reasonCode, cause: d.cause || null }
              }
            : {
                code: 'judgement-required',
                needed: 'Whether the focus style is visible with a contrast ratio of at least 3:1.',
                evidence: { reasonCode: res.reasonCode }
              };
      const occ = helpers.reportOccurrence(el, {
        summary: msg.summary(params),
        hint: msg.hint,
        i18n: {
          summaryKey: `focusIndicatorContrast_summary_${res.verdict}_${res.reasonCode}`,
          hintKey: `focusIndicatorContrast_hint_${res.verdict}_${res.reasonCode}`,
          params
        },
        ...(uncertainty ? { uncertainty } : {}),
        data: {
          details: { reasonCode: res.reasonCode, ...d },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      });
      (res.verdict === 'fail' ? failOccurrences : cantTellOccurrences).push(occ);
    }
  } finally {
    removeRings();
  }

  if (!failOccurrences.length && !cantTellOccurrences.length && !passCount) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(
      failOccurrences,
      cantTellOccurrences,
      rule.defaultSeverity || 'serious'
    ),
    marginCandidates,
    measuredCount: judgedCount
  };
}

module.exports = { id, meta, runInPage };
