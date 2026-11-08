/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-link-state-colors-review
 * @atomic true
 * @summary A text link shown only by color must keep 3:1 with the surrounding text in each state shown by another color
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to links (<a href> and role="link") inside a run of text (their
 *   parent has text of its own, as for link-in-text-block) that carry no
 *   mark other than color at rest: no underline, no weight or style
 *   difference from the surrounding text, no border, outline, box-shadow,
 *   background image, background color of its own (a highlight, as
 *   link-in-text-block reads it), image or generated content (glossary
 *   "Lien dont la nature n'est pas évidente").
 * @expectation
 *   RGAA 10.6.1 step 3: the 3:1 contrast between the link color and the
 *   surrounding text must be checked « pour les différents états du lien
 *   s'ils sont présentés au moyen d'une couleur différente : l'état non
 *   visité, l'état visité, l'état activé, l'état au survol et l'état à la
 *   prise de focus ».
 *   Where the page has a layout (a browser), each state is put on the link
 *   and its colors are read. A state whose color differs from the resting
 *   one and that adds no other mark fails below 3:1 against the surrounding
 *   text (STATE_CONTRAST_LOW). The link passes when every such state
 *   reaches 3:1. It is asked about when the browser's own visited color
 *   applies (BROWSER_STATE_COLORS) or a style sheet cannot be read
 *   (STYLESHEET_UNREADABLE).
 *   Without a layout (jsdom), the states cannot be put on the link, so it
 *   is asked about when an author rule for :visited, :active, :hover,
 *   :focus or :focus-visible changes only its color (STATE_COLOR_CHANGE),
 *   when the browser's visited color applies, or when a style sheet cannot
 *   be read. A link whose states raise no question is left out there.
 *   A page with no link in scope is notApplicable.
 *   Margin (`contrast-ratio`): of the link states shown by another color
 *   that reach 3:1 with the surrounding text, the one closest to it,
 *   unrounded; `context.state` names it (hover, focus, visited, active).
 *   `measuredCount` counts the links whose states were read in a browser.
 * @implementation-notes
 * - Transitions are held off while the states are read: a style sheet in
 *   a cascade layer declared before any other sets `transition: none
 *   !important` on everything, so a state's colors are read at once, not at
 *   the start of the page's own transition toward them. The selectors are
 *   put back first, then the sheet is removed, so nothing animates on the
 *   way back.
 * - States in a browser: every readable author rule that names a link state
 *   gets its selector rewritten for the time of the check, `:hover` to
 *   `:is(:hover, [data-surea11y-link-state~="hover"])` and so on, and
 *   `:link` to `:link:where(:not([...~="visited"]))`. Specificity, source
 *   order and @media conditions stay as they were. The attribute is set on
 *   the link for :visited, and on the link and its ancestors for :hover and
 *   :active, which match ancestors too. Focus is real focus (`focusVisible`)
 *   so the browser's own focus ring counts as a mark. For the time of the
 *   focus pass every link is given that ring's style (outline-style: auto)
 *   at rest, in a cascade layer below every author rule, as the browser's
 *   own ring is: an outline appearing on focus costs the browser a layout
 *   of the page per link, and the outline read in focus is the same. A
 *   tree (the document, or open shadow roots with the same style sheets)
 *   whose first link shows no outline on focus is left without the ring,
 *   which there would cost time and save none. Each
 *   open shadow root holding a link adopts the same rule first in its
 *   adoptedStyleSheets, unless its own sheets declare a cascade layer or
 *   cannot be read; a link that hosts a shadow root or is the child of one
 *   is left out, since its shadow tree's :host and ::slotted rules lose to
 *   the tree around it. The selectors, the attributes, focus and each
 *   root's adoptedStyleSheets are put back afterwards. Browsers
 *   hide the visited color from scripts, which is why it is emulated rather
 *   than read, and why the browser's own visited color stays a question.
 * - A state adds a mark when it brings an underline, a border, an outline,
 *   a box-shadow, a background image or color, or a weight or style that
 *   differs from the surrounding text.
 * - The resting-state cues are read as link-in-text-block reads them,
 *   including its CSSOM fallback for `text-decoration` under a DOM
 *   emulator. A link whose underline cannot be resolved is treated as
 *   possibly shown by color only.
 * - Without a layout, a state rule is matched by removing the state
 *   pseudo-classes from its selector and matching the rest against the
 *   link. A state rule that also sets a text decoration, border, outline,
 *   box-shadow, font weight or style, or background image marks that state
 *   by more than color and is not flagged.
 * - The browser's own visited color applies when no author rule sets the
 *   link's color at rest. When a style sheet cannot be read (another
 *   origin's), that is told from the computed color in a browser: one
 *   other than the browser's own link color (LinkText, in the link's color
 *   scheme) is an author's, and the link is asked about for the unread
 *   sheet (STYLESHEET_UNREADABLE). Without a layout it is asked about for
 *   the sheet too.
 * - link-in-text-block judges the resting state.
 * - Opt-in (tag `rgaa`): WCAG 1.4.1 does not single out these states.
 */

const id = 'rgaa-link-state-colors-review';

const meta = {
  title: 'Link states shown by color alone contrast 3:1 with the surrounding text',
  description:
    'Checks that a link in a run of text, shown only by color, keeps a contrast of 3:1 with the surrounding text in each visited, active, hover or focus state shown by another color, and asks when the states cannot be put on the link (RGAA 10.6.1).',
  i18n: {
    titleKey: 'linkStateColorsReview_title',
    descriptionKey: 'linkStateColorsReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'links', 'color', 'contrast', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {},
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min' },
  // The reason codes the rule gives, so definePack can check that `review`
  // names only these.
  reasonCodes: [
    'STATE_CONTRAST_LOW',
    'STATE_COLOR_CHANGE',
    'BROWSER_STATE_COLORS',
    'STYLESHEET_UNREADABLE'
  ],
  // How a person answers each question the rule asks, per reason code: a few
  // steps from the element the finding names, then what they see if it
  // passes and if it fails. In English; reports show it as "How to check".
  review: {
    STATE_COLOR_CHANGE: {
      steps: [
        'Find the link the report names, in a run of text and shown only by its color.',
        'Put it in each state the report lists: hover it with the mouse, tab to it, press it, and follow it so it shows as visited.',
        'In each state, measure the contrast between the link color and the surrounding text with a contrast checker, and, on hover and on focus, check for a mark other than color.'
      ],
      passWhen:
        'The link has a mark other than color in its normal state, so RGAA 10.6.1 does not apply; or, in each state where it is shown in a different color (unvisited, visited, active, hover, focus), its color contrasts at least 3:1 with the surrounding text, and hovering it and focusing it each add a visual mark other than a color change (an underline, a border, a weight).',
      failWhen:
        "In a state, the link's color contrasts below 3:1 with the surrounding text, or hover or focus changes only its color, which fails RGAA 10.6.1."
    },
    BROWSER_STATE_COLORS: {
      steps: [
        'Find the link the report names, in a run of text and shown only by its color, which no style rule sets.',
        'Follow the link so it shows as visited, and come back to the page.',
        'Measure the contrast between the visited color and the surrounding text with a contrast checker.'
      ],
      passWhen:
        'The visited link contrasts at least 3:1 with the surrounding text, or has a mark other than color.',
      failWhen:
        'The visited link is shown only by a color that contrasts below 3:1 with the surrounding text, which fails RGAA 10.6.1.'
    },
    STYLESHEET_UNREADABLE: {
      steps: [
        'Find the link the report names, in a run of text and shown only by its color.',
        'Put it in each state: visited, hovered, focused with the keyboard and pressed.',
        'In each state where its color changes and no other mark appears, measure the contrast between the link color and the surrounding text, and, on hover and on focus, check for a mark other than color.'
      ],
      passWhen:
        'The link has a mark other than color in its normal state, so RGAA 10.6.1 does not apply; or, in each state where it is shown in a different color (unvisited, visited, active, hover, focus), its color contrasts at least 3:1 with the surrounding text, and hovering it and focusing it each add a visual mark other than a color change (an underline, a border, a weight).',
      failWhen:
        "In a state, the link's color contrasts below 3:1 with the surrounding text, or hover or focus changes only its color, which fails RGAA 10.6.1."
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const CSS_STYLE_RULE = 1;
  const MAX_NESTED_DEPTH = 8;
  const STATE_RE = /:(visited|active|hover|focus-visible|focus)(?![\w-])/gi;
  const ALL_STATES_RE =
    /:(link|visited|active|hover|focus-visible|focus|focus-within|target)(?![\w-])/i;

  function safeComputedStyle(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return null;
      const view = dom.ownerDocument(el) && dom.defaultView(dom.ownerDocument(el));
      if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
    } catch {
      // no computed style available
    }
    return null;
  }

  function splitSelectorList(selectorText) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of String(selectorText || '')) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    parts.push(current);
    return parts.map((p) => p.trim()).filter(Boolean);
  }

  function specificityOf(selector) {
    const s = String(selector || '');
    const ids = (s.match(/#[\w-]+/g) || []).length;
    const classesEtc = (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length;
    const types = (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length;
    return ids * 10000 + classesEtc * 100 + types;
  }

  // Every author style rule, in order, and whether a sheet was unreadable.
  let styleRules = null;
  let unreadableSheet = false;
  function getStyleRules(doc) {
    if (styleRules) return styleRules;
    styleRules = [];
    function walk(rules, depth) {
      if (!rules || depth > MAX_NESTED_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
          styleRules.push(cssRule);
          continue;
        }
        let nested;
        try {
          nested = cssRule.cssRules || null;
        } catch {
          nested = null;
        }
        if (nested) walk(nested, depth + 1);
      }
    }
    try {
      for (const sheet of (doc && dom.styleSheets(doc)) || []) {
        let rules = null;
        try {
          rules = sheet && sheet.cssRules ? sheet.cssRules : null;
        } catch {
          unreadableSheet = true; // cross-origin, not inspectable
          continue;
        }
        if (rules) walk(rules, 0);
      }
    } catch {
      unreadableSheet = true;
    }
    return styleRules;
  }

  // What the resting-state checks read of each author rule, read once
  // rather than for every link: the declarations they look at and the
  // selector's parts. Read before any selector is rewritten for the states,
  // so the parts are the page's own. Rules that set none of those
  // declarations are left out.
  let ruleInfoList = null;
  function ruleInfos(doc) {
    if (ruleInfoList) return ruleInfoList;
    ruleInfoList = [];
    for (const cssRule of getStyleRules(doc)) {
      const style = cssRule.style;
      let decoration = '';
      let decorationImportant = false;
      for (const prop of ['text-decoration-line', 'text-decoration']) {
        decoration = declared(style, prop);
        if (decoration) {
          decorationImportant = String(style.getPropertyPriority(prop) || '') === 'important';
          break;
        }
      }
      const color = !!declared(style, 'color');
      const content = declared(style, 'content');
      const generates = !!content && !['none', 'normal', '""', "''"].includes(content);
      if (!decoration && !color && !generates) continue;
      ruleInfoList.push({
        decoration,
        decorationImportant,
        color,
        colorOnly: color && !addsNonColorMark(style),
        generates,
        parts: splitSelectorList(cssRule.selectorText).map((text) => ({
          text,
          pseudoElement: /::[a-z-]+/i.test(text),
          anyState: ALL_STATES_RE.test(text),
          beforeAfter: /::?(before|after)\s*$/i.test(text)
        }))
      });
    }
    return ruleInfoList;
  }

  function matches(el, selector) {
    try {
      return dom.matches(el, selector);
    } catch {
      return false;
    }
  }

  function declared(style, prop) {
    if (!style || typeof style.getPropertyValue !== 'function') return '';
    return String(style.getPropertyValue(prop) || '')
      .trim()
      .toLowerCase();
  }

  // ---- Resting state: is the link marked by anything but color? ----

  function uaUnderlines(el) {
    return (
      String(dom.localName(el) || '').toLowerCase() === 'a' &&
      typeof dom.get(el, 'hasAttribute') === 'function' &&
      dom.hasAttribute(el, 'href')
    );
  }

  function decorationInfo(cs) {
    if (!cs) return { underlined: false, trustworthy: false };
    const lineTokens = String(cs.textDecorationLine || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const shortTokens = String(cs.textDecoration || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!lineTokens.length) {
      return { underlined: shortTokens.includes('underline'), trustworthy: shortTokens.length > 0 };
    }
    if (!shortTokens.length) {
      return { underlined: lineTokens.includes('underline'), trustworthy: true };
    }
    const byLine = lineTokens.includes('underline');
    return { underlined: byLine, trustworthy: byLine === shortTokens.includes('underline') };
  }

  // The resting underline from the CSSOM, when the computed style cannot be
  // trusted (a DOM emulator does not cascade text-decoration). Returns
  // true, false, or null when it cannot be resolved.
  function underlineFromCssom(el) {
    const doc = dom.ownerDocument(el);
    let best = null;
    for (const info of ruleInfos(doc)) {
      const value = info.decoration;
      if (!value) continue;
      for (const part of info.parts) {
        if (part.pseudoElement || part.anyState) continue;
        if (!matches(el, part.text)) continue;
        const rank = (info.decorationImportant ? 1e9 : 0) + specificityOf(part.text);
        if (!best || rank >= best.rank) best = { rank, underlined: /\bunderline\b/.test(value) };
      }
    }
    const inline =
      declared(el.style, 'text-decoration-line') || declared(el.style, 'text-decoration');
    if (inline) return /\bunderline\b/.test(inline);
    if (best) return best.underlined;
    if (unreadableSheet) return null;
    return uaUnderlines(el);
  }

  function isZeroWidth(v) {
    return /^0(\.0+)?[a-z%]*$/i.test(String(v || '').trim());
  }

  function hasBorder(cs) {
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const style = String(cs['border' + side + 'Style'] || '')
        .trim()
        .toLowerCase();
      if (!style || style === 'none' || style === 'hidden') continue;
      if (!isZeroWidth(cs['border' + side + 'Width'])) return true;
    }
    return false;
  }

  function hasOutline(cs) {
    const style = String(cs.outlineStyle || '')
      .trim()
      .toLowerCase();
    return !!style && style !== 'none' && style !== 'hidden' && !isZeroWidth(cs.outlineWidth);
  }

  function hasValue(v) {
    const s = String(v || '')
      .trim()
      .toLowerCase();
    return !!s && s !== 'none';
  }

  function hasImageChild(el) {
    try {
      if (dom.querySelector(el, 'img, svg, picture, canvas')) return true;
      return [...dom.querySelectorAll(el, '[role~="img" i]')].some(
        (n) => helpers.aria.getExplicitRole(n) === 'img'
      );
    } catch {
      return false;
    }
  }

  function hasPseudoContent(el) {
    for (const info of ruleInfos(dom.ownerDocument(el))) {
      if (!info.generates) continue;
      for (const part of info.parts) {
        if (!part.beforeAfter || part.anyState) continue;
        if (matches(el, part.text.replace(/::?(before|after)\s*$/i, '').trim() || '*')) return true;
      }
    }
    return false;
  }

  // Whether the parent has text of its own: a text node child that is not
  // only whitespace. The link is an element, so it never is one. Read once
  // per parent, as links often share one.
  const parentHasText = new Map();
  function hasSurroundingText(el, parent) {
    if (!parent) return false;
    if (parentHasText.has(parent)) return parentHasText.get(parent);
    let found = false;
    const children = dom.childNodes(parent);
    const count = children ? children.length : 0;
    for (let i = 0; i < count && !found; i++) {
      const n = children[i];
      if (n === el) continue;
      if (dom.nodeType(n) === 3 && dom.nodeValue(n) && dom.nodeValue(n).trim().length > 0) {
        found = true;
      }
    }
    parentHasText.set(parent, found);
    return found;
  }

  // A background color of the link's own, different from the one behind
  // the surrounding text, marks it like a highlight, as in link-in-text-block.
  function highlighted(el, parent, cs) {
    const c = helpers.contrast || null;
    if (!c) return false;
    const own = c.parseCssColorToRgba(cs.backgroundColor);
    if (!own || !own.a) return false;
    try {
      const opts = { contrast: { mode: 'auditorAssist', rootCanvasFallback: '#ffffff' } };
      const behindLink = c.computeEffectiveBackground(el, opts);
      const behindText = c.computeEffectiveBackground(parent, opts);
      if (!behindLink || !behindLink.ok || !behindText || !behindText.ok) return false;
      return c.rgbToHex(behindLink.rgba) !== c.rgbToHex(behindText.rgba);
    } catch {
      return false;
    }
  }

  function markedByMoreThanColor(el, parent) {
    const cs = safeComputedStyle(el);
    const parentCs = safeComputedStyle(parent);
    const c = helpers.contrast || null;
    if (cs && parentCs) {
      const weight = c ? c.normalizeFontWeight(cs.fontWeight) : cs.fontWeight;
      const parentWeight = c ? c.normalizeFontWeight(parentCs.fontWeight) : parentCs.fontWeight;
      if (String(weight) !== String(parentWeight)) return true;
      if ((cs.fontStyle || 'normal') !== (parentCs.fontStyle || 'normal')) return true;
    }
    if (
      cs &&
      (hasBorder(cs) || hasOutline(cs) || hasValue(cs.boxShadow) || hasValue(cs.backgroundImage))
    ) {
      return true;
    }
    if (hasImageChild(el) || hasPseudoContent(el)) return true;
    if (cs && highlighted(el, parent, cs)) return true;
    const decoration = decorationInfo(cs);
    const underlined = decoration.trustworthy ? decoration.underlined : underlineFromCssom(el);
    return underlined === true;
  }

  // ---- States ----

  const NON_COLOR_MARKS = [
    'text-decoration',
    'text-decoration-line',
    'border',
    'border-bottom',
    'border-top',
    'border-left',
    'border-right',
    'border-width',
    'border-style',
    'border-bottom-style',
    'outline',
    'outline-style',
    'box-shadow',
    'font-weight',
    'font-style',
    'background-image'
  ];

  function addsNonColorMark(style) {
    return NON_COLOR_MARKS.some((prop) => {
      const v = declared(style, prop);
      return !!v && v !== 'none' && !/^0(\.0+)?[a-z%]*$/.test(v) && v !== 'normal';
    });
  }

  // States whose author rule changes only the link's color.
  function colorOnlyStates(el) {
    const states = [];
    for (const info of ruleInfos(dom.ownerDocument(el))) {
      if (!info.colorOnly) continue;
      for (const { text: part, pseudoElement } of info.parts) {
        if (pseudoElement) continue;
        const found = part.match(STATE_RE);
        if (!found) continue;
        const base = part.replace(STATE_RE, '').trim() || '*';
        if (!matches(el, base)) continue;
        for (const s of found) {
          const name = s.slice(1).toLowerCase();
          if (!states.includes(name)) states.push(name);
        }
      }
    }
    return states;
  }

  // The color the browser gives a link no author style reaches, in the
  // link's color scheme: the LinkText system color, read from a hidden
  // probe whose inline !important declarations no style sheet overrides.
  // null when it cannot be read.
  const uaLinkColors = new Map();
  function uaLinkColor(doc, scheme) {
    if (uaLinkColors.has(scheme)) return uaLinkColors.get(scheme);
    let color = null;
    let probe = null;
    try {
      probe = dom.createElement(doc, 'span');
      dom.setAttribute(
        probe,
        'style',
        `display:none!important;color:LinkText!important;color-scheme:${scheme}!important`
      );
      dom.insertBefore(dom.documentElement(doc), probe, null);
      const cs = safeComputedStyle(probe);
      color = (cs && cs.color) || null;
    } catch {
      color = null;
    } finally {
      try {
        if (probe && dom.parentNode(probe)) dom.removeChild(dom.parentNode(probe), probe);
      } catch {}
    }
    uaLinkColors.set(scheme, color);
    return color;
  }

  // Whether an author declaration sets the link's color at rest, which then
  // applies to its visited state too: true, false, or null when a style
  // sheet could not be read and the browser cannot tell. With an unreadable
  // sheet, where the page has a layout, a computed color other than the
  // browser's own link color is an author's; the browser's own one is taken
  // as the browser's.
  function authorSetsRestingColor(el) {
    if (declared(el.style, 'color')) return true;
    for (const info of ruleInfos(dom.ownerDocument(el))) {
      if (!info.color) continue;
      for (const part of info.parts) {
        if (part.pseudoElement || part.anyState) continue;
        if (matches(el, part.text)) return true;
      }
    }
    if (!unreadableSheet) return false;
    const doc = dom.ownerDocument(el);
    const cs = hasLayout(doc) ? safeComputedStyle(el) : null;
    const ua = cs && cs.color ? uaLinkColor(doc, String(cs.colorScheme || 'normal')) : null;
    if (!ua) return null;
    return cs.color !== ua;
  }

  const CANTTELL_HINT =
    'Put the link in each state (visited, active, hovered, focused) and check that its color contrasts at least 3:1 with the surrounding text, or give the link a mark other than color, such as an underline.';

  const MESSAGES = {
    STATE_CONTRAST_LOW: {
      reasonCode: 'STATE_CONTRAST_LOW',
      summaryKey: 'linkStateColorsReview_summary_fail_lowContrast',
      hintKey: 'linkStateColorsReview_hint_fail_lowContrast',
      summary: (p) =>
        `This link in a run of text is shown only by its color, and in these states that color contrasts below 3:1 with the surrounding text: ${p.states} (lowest ${p.ratio}:1, ${p.color} against ${p.textColor}).`,
      hint: 'Give the link a color with a contrast ratio of at least 3:1 with the surrounding text in each state, or mark it in those states by more than color, such as an underline (RGAA 10.6.1).'
    },
    STATE_COLOR_CHANGE: {
      reasonCode: 'STATE_COLOR_CHANGE',
      summaryKey: 'linkStateColorsReview_summary_cantTell_stateColor',
      summary:
        'This link in a run of text is shown only by its color, and a style rule changes that color in some of its states.',
      needed: 'Whether the link color in each listed state contrasts 3:1 with the surrounding text.'
    },
    BROWSER_STATE_COLORS: {
      reasonCode: 'BROWSER_STATE_COLORS',
      summaryKey: 'linkStateColorsReview_summary_cantTell_browserColors',
      summary:
        "This link in a run of text is shown only by its color, and no style rule sets that color, so the browser's own visited color, a different one, applies.",
      needed: 'Whether the visited link color contrasts 3:1 with the surrounding text.'
    },
    STYLESHEET_UNREADABLE: {
      reasonCode: 'STYLESHEET_UNREADABLE',
      summaryKey: 'linkStateColorsReview_summary_cantTell_unreadable',
      summary:
        'This link in a run of text is shown only by its color, and a style sheet that could not be read may change that color in some of its states.',
      needed:
        'Whether the link color changes in its visited, active, hover or focus state, and if so contrasts 3:1 with the surrounding text.'
    }
  };

  // ---- States put on the link, where the page has a layout ----

  function hasLayout(doc) {
    const probe = doc && dom.documentElement(doc);
    if (!probe || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }

  const STATE_ATTR = 'data-surea11y-link-state';
  const STATE_NAME_RE = /:(visited|active|hover|focus-visible|focus)(?![\w-])/gi;
  const LINK_RE = /:link(?![\w-])/gi;

  // Rewrites every readable author rule that names a link state so the
  // state also matches STATE_ATTR, keeping its specificity, order and
  // conditions. Returns a function that puts the selectors back, or null
  // when a selector could not be rewritten.
  function emulateStates(doc) {
    const changed = [];
    function restore() {
      for (let i = changed.length - 1; i >= 0; i--) {
        try {
          changed[i][0].selectorText = changed[i][1];
        } catch {
          // left as rewritten; the attribute it needs is never set
        }
      }
    }
    for (const cssRule of getStyleRules(doc)) {
      const before = cssRule.selectorText;
      STATE_NAME_RE.lastIndex = 0;
      LINK_RE.lastIndex = 0;
      if (!STATE_NAME_RE.test(before) && !LINK_RE.test(before)) continue;
      const after = splitSelectorList(before)
        .map((part) =>
          part
            .replace(STATE_NAME_RE, (m, name) => {
              const state = name.toLowerCase() === 'focus-visible' ? 'focus' : name.toLowerCase();
              return `:is(${m}, [${STATE_ATTR}~="${state}"])`;
            })
            .replace(LINK_RE, `:link:where(:not([${STATE_ATTR}~="visited"]))`)
        )
        .join(', ');
      try {
        cssRule.selectorText = after;
      } catch {
        // checked below
      }
      if (cssRule.selectorText === before) {
        restore();
        return null;
      }
      changed.push([cssRule, before]);
    }
    return restore;
  }

  function deepActiveElement(doc) {
    let cur = dom.activeElement(doc) || null;
    let guard = 0;
    while (cur && dom.shadowRoot(cur) && dom.activeElement(dom.shadowRoot(cur)) && guard++ < 20) {
      cur = dom.activeElement(dom.shadowRoot(cur));
    }
    return cur;
  }

  // Runs fn with the link in one state, then takes the state off.
  function inState(el, state, fn) {
    const doc = dom.ownerDocument(el);
    if (state === 'focus') {
      if (typeof dom.get(el, 'focus') !== 'function') return null;
      const previous = deepActiveElement(doc);
      try {
        dom.focus(el, { preventScroll: true, focusVisible: true });
        if (deepActiveElement(doc) !== el) return null;
        return fn();
      } catch {
        return null;
      } finally {
        try {
          if (
            previous &&
            previous !== dom.body(doc) &&
            typeof dom.get(previous, 'focus') === 'function'
          ) {
            if (deepActiveElement(doc) !== previous) dom.focus(previous, { preventScroll: true });
          } else if (deepActiveElement(doc) === el) {
            dom.blur(el);
          }
        } catch {}
      }
    }
    const targets = [el];
    if (state === 'hover' || state === 'active') {
      for (let n = dom.parentElement(el); n; n = dom.parentElement(n)) targets.push(n);
    }
    const saved = targets.map((t) =>
      dom.hasAttribute(t, STATE_ATTR) ? dom.getAttribute(t, STATE_ATTR) : null
    );
    try {
      targets.forEach((t, i) =>
        dom.setAttribute(t, STATE_ATTR, ((saved[i] || '') + ' ' + state).trim())
      );
      return fn();
    } catch {
      return null;
    } finally {
      targets.forEach((t, i) => {
        if (saved[i] == null) dom.removeAttribute(t, STATE_ATTR);
        else dom.setAttribute(t, STATE_ATTR, saved[i]);
      });
    }
  }

  // What the link looks like now: its color, the color of the surrounding
  // text, and whether anything but color marks it.
  function lookOf(el, parent, rest) {
    const cs = safeComputedStyle(el);
    const parentCs = safeComputedStyle(parent);
    if (!cs || !parentCs) return null;
    const c = helpers.contrast;
    const marked =
      decorationInfo(cs).underlined ||
      hasBorder(cs) ||
      hasOutline(cs) ||
      hasValue(cs.boxShadow) ||
      hasValue(cs.backgroundImage) ||
      String(c.normalizeFontWeight(cs.fontWeight)) !==
        String(c.normalizeFontWeight(parentCs.fontWeight)) ||
      (cs.fontStyle || 'normal') !== (parentCs.fontStyle || 'normal') ||
      (rest ? cs.backgroundColor !== rest.backgroundColor : false);
    return {
      color: cs.color,
      parentColor: parentCs.color,
      backgroundColor: cs.backgroundColor,
      marked
    };
  }

  // Contrast between the link color and the surrounding text, both over the
  // background behind the link. null when it cannot be computed.
  function ratioOf(el, look, bgOpts) {
    const c = helpers.contrast;
    try {
      const bg = c.computeEffectiveBackground(el, bgOpts);
      if (!bg || !bg.ok || !bg.rgba) return null;
      const opaque = (value) => {
        const rgba = c.parseCssColorToRgba(value);
        if (!rgba) return null;
        return rgba.a < 1
          ? c.compositeRgba(rgba, bg.rgba)
          : { r: rgba.r, g: rgba.g, b: rgba.b, a: 1 };
      };
      const link = opaque(look.color);
      const text = opaque(look.parentColor);
      if (!link || !text) return null;
      return {
        ratio: c.contrastRatio(link, text),
        color: c.rgbToHex(link),
        textColor: c.rgbToHex(text)
      };
    } catch {
      return null;
    }
  }

  const STATES = ['visited', 'hover', 'active', 'focus'];

  // Rounded to two decimals, except that a ratio below 3 never reads 3.00.
  function shownRatio(r) {
    const rounded = Number(helpers.contrast.round2(r));
    return r < 3 && rounded >= 3 ? 2.99 : rounded;
  }

  // What every link looks like in focus: real focus, link by link, so a
  // script reacting to focus, :focus-within and shadow styles all show.
  // Focus makes the browser's focus ring appear, and an outline that
  // appears costs the browser a layout of the whole page (each link's first
  // time at least). So, for the time of the pass, every link is given the
  // style of the ring the browser draws on focus (outline-style: auto) at
  // rest, from the freeze sheet's cascade layer: below every author rule,
  // as the browser's own ring is, so an author outline overrides both
  // alike. Focus then leaves an outline in place, the browser's focus rule
  // still gives its width and color, and the look read in focus has the
  // outline it would have had. A shadow tree's own rules (:host, ::slotted)
  // lose to the tree around it whatever their layer, so a link that hosts
  // an open shadow root or is the child of one is left without it. The
  // freeze sheet does not reach into shadow trees: each open shadow root
  // holding a link adopts the ring's rule (adoptInShadowRoots).
  function looksInFocus(list) {
    const looks = new Map();
    const saved = new Map();
    let unadopt = () => {};
    try {
      const ringed = treesWithRing(list);
      for (const [el] of list) {
        const parent = dom.parentElement(el);
        if (dom.shadowRoot(el) || (parent && dom.shadowRoot(parent))) continue;
        if (!ringed.has(dom.getRootNode(el))) continue;
        const before = dom.hasAttribute(el, STATE_ATTR) ? dom.getAttribute(el, STATE_ATTR) : null;
        saved.set(el, before);
        dom.setAttribute(el, STATE_ATTR, ((before || '') + ' ring').trim());
      }
      unadopt = adoptInShadowRoots(
        [...saved.keys()],
        `@layer surea11y-link-ring{[${STATE_ATTR}~="ring"]{outline-style:auto}}`
      );
      for (const [el, parent, rest] of list) {
        looks.set(
          el,
          inState(el, 'focus', () => lookOf(el, parent, rest))
        );
      }
    } catch {
      // the states left unread are not judged
    } finally {
      unadopt();
      for (const [el, before] of saved) {
        if (before == null) dom.removeAttribute(el, STATE_ATTR);
        else dom.setAttribute(el, STATE_ATTR, before);
      }
    }
    return looks;
  }

  // A tree (the document or a shadow root) whose styles make focus draw no
  // outline on its links gains nothing from the ring at rest and pays for
  // it, so each tree is probed first: one of its links is focused, without
  // the ring, and the tree's links get the ring only if an outline appears
  // that was not there at rest. Shadow roots whose style sheets are the
  // same (the copies of one component) share one probe, since one link per
  // root is the common case. The ring changes only what focus costs, not
  // what it shows, so a probe that guesses wrong for another link of the
  // tree changes the time taken, not the verdicts. A tree whose probe
  // cannot focus its link keeps the ring.
  const adoptedIds = new Map();
  function treeKey(root) {
    if (dom.nodeType(root) !== 11) return root;
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
  // focus its link.
  function treesWithRing(list) {
    const keyOf = new Map(); // root -> tree key
    const outline = new Map(); // tree key -> whether focus draws one
    for (const [el] of list) {
      try {
        const parent = dom.parentElement(el);
        if (dom.shadowRoot(el) || (parent && dom.shadowRoot(parent))) continue;
        const root = dom.getRootNode(el);
        if (!root) continue;
        if (!keyOf.has(root)) keyOf.set(root, treeKey(root));
        const key = keyOf.get(root);
        if (outline.has(key)) continue;
        const rest = safeComputedStyle(el);
        const atRest = rest ? rest.outlineStyle : '';
        const appears = inState(el, 'focus', () => {
          const cs = safeComputedStyle(el);
          return atRest === 'none' && !!cs && cs.outlineStyle !== 'none';
        });
        outline.set(key, appears !== false);
      } catch {}
    }
    const ringed = new Set();
    for (const [root, key] of keyOf) if (outline.get(key)) ringed.add(root);
    return ringed;
  }

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
          if (nested && depth < 10 && walk(nested, depth + 1)) return true;
        } else if (r && r.cssRules && depth < 10 && walk(r.cssRules, depth + 1)) {
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

  // Puts a sheet with the css first in the adoptedStyleSheets of each open
  // shadow root holding one of the elements, so that its cascade layer is
  // the lowest there; returns what puts each root's list back. A root
  // whose own sheets declare a layer, or cannot be read, is left out (an
  // adopted sheet comes after them, and its layer would not be the
  // lowest), and so is one whose list cannot be set. A list a script on
  // the page changed in the meantime keeps its change, without the sheet.
  function adoptInShadowRoots(elements, css) {
    const doc = elements.length ? dom.ownerDocument(elements[0]) : null;
    const view = doc && dom.defaultView(doc);
    const Sheet = view && view.CSSStyleSheet;
    if (typeof Sheet !== 'function') return () => {};
    const roots = new Set();
    for (const el of elements) {
      try {
        const root = dom.getRootNode(el);
        if (root && root !== doc && dom.nodeType(root) === 11 && dom.host(root)) roots.add(root);
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

  // What every link looks like in one state. Visited, hover and active are
  // put on all the links at once, so the page's styles are worked out once
  // per state rather than once per link; focus is read link by link
  // (looksInFocus).
  function looksInState(list, state) {
    if (state === 'focus') return looksInFocus(list);
    const looks = new Map();
    const targets = new Set();
    for (const [el] of list) {
      targets.add(el);
      if (state === 'hover' || state === 'active') {
        for (let n = dom.parentElement(el); n; n = dom.parentElement(n)) targets.add(n);
      }
    }
    const saved = new Map();
    try {
      for (const t of targets) {
        const before = dom.hasAttribute(t, STATE_ATTR) ? dom.getAttribute(t, STATE_ATTR) : null;
        saved.set(t, before);
        dom.setAttribute(t, STATE_ATTR, ((before || '') + ' ' + state).trim());
      }
      for (const [el, parent, rest] of list) looks.set(el, lookOf(el, parent, rest));
    } catch {
      // the states left unread are not judged
    } finally {
      for (const [t, before] of saved) {
        if (before == null) dom.removeAttribute(t, STATE_ATTR);
        else dom.setAttribute(t, STATE_ATTR, before);
      }
    }
    return looks;
  }

  // For each link: { failing: [{ state, ratio, color, textColor }],
  // passing: [{ state, ratio }], visitedUnknown, uncomputable }.
  function judgeAll(pairs, bgOpts) {
    const list = [];
    for (const [el, parent] of pairs) {
      const rest = lookOf(el, parent, null);
      if (rest) list.push([el, parent, rest]);
    }
    const verdicts = new Map(
      list.map(([el]) => [el, { failing: [], passing: [], uncomputable: [], visitedSame: false }])
    );
    for (const state of STATES) {
      const looks = looksInState(list, state);
      for (const [el, , rest] of list) {
        const look = looks.get(el);
        const v = verdicts.get(el);
        if (!look) continue; // a link that cannot take focus has no focus state
        if (look.color === rest.color && look.parentColor === rest.parentColor) {
          if (state === 'visited') v.visitedSame = true;
          continue;
        }
        if (look.marked) continue;
        const m = ratioOf(el, look, bgOpts);
        if (!m) v.uncomputable.push(state);
        else if (m.ratio < 3) v.failing.push({ state, ...m });
        else v.passing.push({ state, ratio: m.ratio });
      }
    }
    for (const [el, v] of verdicts) {
      v.visitedUnknown = v.visitedSame && uaUnderlines(el) && authorSetsRestingColor(el) === false;
    }
    return verdicts;
  }

  // role is a fallback list matched in any case: select by token, then keep
  // only elements whose resolved role is link (role="button link" is a button).
  const selector = 'a[href], [role~="link" i]';
  const nodes = (
    helpers.queryAllSmart ? helpers.queryAllSmart(selector) : helpers.queryAll(selector)
  ).filter(
    (el) =>
      (String(dom.localName(el) || '').toLowerCase() === 'a' && dom.hasAttribute(el, 'href')) ||
      helpers.aria.getExplicitRole(el) === 'link'
  );

  const failOccurrences = [];
  const occurrences = [];
  let passCount = 0;

  const doc = ctx.document || (nodes[0] && dom.ownerDocument(nodes[0])) || null;
  const contrastOpts =
    ctx.engineOptions &&
    typeof ctx.engineOptions.contrast === 'object' &&
    ctx.engineOptions.contrast
      ? ctx.engineOptions.contrast
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

  const inScope = [];
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const parent = dom.parentElement(el);
    if (!hasSurroundingText(el, parent)) continue;
    if (markedByMoreThanColor(el, parent)) continue;
    inScope.push([el, parent]);
  }

  // Transitions held off for the time of the check, so a state put on the
  // page is read at once rather than at the start of its transition; and
  // the focus ring drawn at rest on the links marked "ring" (looksInFocus).
  // The sheet is a cascade layer declared before any other, which wins over
  // the page's own !important as a user style sheet would, and whose normal
  // declarations lose to every author rule. The page's state is put back
  // before the sheet goes, so nothing animates on the way back.
  function freezeTransitions(doc) {
    let sheet = null;
    try {
      sheet = dom.createElement(doc, 'style');
      sheet.textContent = `@layer surea11y-no-transitions{*,*::before,*::after{transition:none!important}[${STATE_ATTR}~="ring"]{outline-style:auto}}`;
      const host = dom.head(doc) || dom.documentElement(doc);
      dom.insertBefore(host, sheet, dom.firstChild(host));
    } catch {
      sheet = null;
    }
    return () => {
      try {
        if (sheet && dom.parentNode(sheet)) dom.removeChild(dom.parentNode(sheet), sheet);
      } catch {}
    };
  }

  // Each link's states, read in one pass while the selectors are rewritten.
  const judged = new Map();
  if (inScope.length && doc && hasLayout(doc)) {
    ruleInfos(doc);
    const restore = unreadableSheet ? null : emulateStates(doc);
    if (restore) {
      const unfreeze = freezeTransitions(doc);
      try {
        for (const [el, verdict] of judgeAll(inScope, bgOpts)) judged.set(el, verdict);
      } finally {
        restore();
        unfreeze();
      }
    }
  }

  function report(el, reasonCode, params, extra) {
    const msg = MESSAGES[reasonCode];
    return helpers.reportOccurrence(el, {
      summary: typeof msg.summary === 'function' ? msg.summary(params) : msg.summary,
      hint: msg.hint || CANTTELL_HINT,
      i18n: {
        summaryKey: msg.summaryKey,
        hintKey: msg.hintKey || 'linkStateColorsReview_hint_cantTell',
        params
      },
      ...(msg.needed
        ? {
            uncertainty: {
              code: 'runtime-dependent',
              needed: msg.needed,
              evidence: { reasonCode, states: extra.states }
            }
          }
        : {}),
      data: { details: { reasonCode, ...extra } }
    });
  }

  for (const [el] of inScope) {
    const verdict = judged.get(el);
    if (verdict) {
      if (verdict.failing.length) {
        const worst = verdict.failing.slice().sort((a, b) => a.ratio - b.ratio)[0];
        const states = verdict.failing.map((f) => f.state);
        failOccurrences.push(
          report(
            el,
            'STATE_CONTRAST_LOW',
            {
              states: states.join(', '),
              color: worst.color,
              textColor: worst.textColor,
              ratio: String(shownRatio(worst.ratio))
            },
            {
              states,
              ratios: verdict.failing.map((f) => ({
                state: f.state,
                color: f.color,
                textColor: f.textColor,
                ratio: shownRatio(f.ratio)
              }))
            }
          )
        );
      } else if (verdict.visitedUnknown) {
        occurrences.push(report(el, 'BROWSER_STATE_COLORS', { states: '' }, { states: [] }));
      } else if (verdict.uncomputable.length) {
        const states = verdict.uncomputable;
        occurrences.push(
          report(el, 'STATE_COLOR_CHANGE', { states: states.join(', ') }, { states })
        );
      } else {
        passCount += 1;
      }
      continue;
    }

    const states = colorOnlyStates(el);
    let reasonCode = '';
    if (states.length) reasonCode = 'STATE_COLOR_CHANGE';
    else if (uaUnderlines(el) && authorSetsRestingColor(el) === false) {
      reasonCode = 'BROWSER_STATE_COLORS';
    } else if (unreadableSheet) reasonCode = 'STYLESHEET_UNREADABLE';
    if (!reasonCode) continue;
    occurrences.push(report(el, reasonCode, { states: states.join(', ') }, { states }));
  }

  // Each link's lowest state color that still reaches 3:1, for the result's
  // margin (src/core/margin.js); measuredCount counts the links whose states
  // were read.
  const marginCandidates = [];
  for (const [el, verdict] of judged) {
    if (!verdict.passing.length) continue;
    const closest = verdict.passing.slice().sort((a, b) => a.ratio - b.ratio)[0];
    marginCandidates.push({
      el,
      value: closest.ratio,
      threshold: 3,
      context: { state: closest.state }
    });
  }
  const margin = { marginCandidates, measuredCount: judged.size };

  if (!failOccurrences.length && !occurrences.length) {
    return passCount
      ? { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [], ...margin }
      : { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(
      failOccurrences,
      occurrences,
      rule.defaultSeverity || 'moderate'
    ),
    ...margin
  };
}

module.exports = { id, meta, runInPage };
