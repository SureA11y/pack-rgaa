/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-color-declarations-paired
 * @atomic true
 * @summary A text colour comes with a background colour, and a background colour or image with a text colour
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible text in the page (text nodes with something other
 *   than white space), outside form controls drawn by the browser, replaced
 *   and embedded content (svg, canvas, video, iframe…), and code that is not
 *   shown (script, style, template, noscript). Text pushed out of view
 *   (text-indent of -100px or less, font-size 0, a transparent colour, a
 *   clip or a 1px box) is left out. A page with no such text, or where the
 *   styles cannot all be computed, is notApplicable.
 * @expectation
 *   RGAA 10.5, « les déclarations CSS de couleurs de fond d'élément et de
 *   police sont-elles correctement utilisées ? ». The colours are read from
 *   the computed style, walking up the flat tree to <html>.
 *   - 10.5.1: « chaque déclaration CSS de couleurs de police (color), d'un
 *     élément susceptible de contenir du texte, est-elle accompagnée d'une
 *     déclaration de couleur de fond (background, background-color), au
 *     moins, héritée d'un parent ? ». Text whose colour was set by the
 *     author (it differs from its parent's, or from the default black on
 *     <html>), with no non-transparent background colour on its element or
 *     any ancestor up to <html>, fails (colorWithoutBackground). It is
 *     reported once, on the element that sets the colour: the topmost one
 *     whose colour differs from its parent's. A background image or a
 *     gradient on an ancestor does not satisfy it: the test asks for a
 *     background colour declaration.
 *   - 10.5.3: « chaque utilisation d'une image pour créer une couleur de
 *     fond d'un élément susceptible de contenir du texte, via CSS
 *     (background, background-image), est-elle accompagnée d'une déclaration
 *     de couleur de fond (background, background-color), au moins, héritée
 *     d'un parent ? ». An element with a background image (url or gradient)
 *     that has visible text painted over it, with no non-transparent
 *     background colour on itself or any ancestor, fails
 *     (imageWithoutBackground).
 *   - 10.5.2: « chaque déclaration de couleur de fond (background,
 *     background-color), d'un élément susceptible de contenir du texte,
 *     est-elle accompagnée d'une déclaration de couleur de police (color) au
 *     moins, héritée d'un parent ? ». An element with a non-transparent
 *     background colour, over text whose colour is black all the way up to
 *     <html>, is asked about (backgroundWithoutColor): a declared black
 *     cannot be told from the browser's default.
 *   Colours the browser sets itself are not author declarations: the link
 *   colour of an <a href>, and the paired colours of <mark>, <dialog> and
 *   [popover]. A page with a dark colour-scheme takes both colours from the
 *   system and is left out. A background on a positioned sibling or on a
 *   ::before or ::after is not inherited and does not count.
 * @implementation-notes
 * - Without a layout (jsdom), the computed style is trusted only when the
 *   cascade is fully known: every style sheet is loaded and readable, it has
 *   no @media, @supports, @layer, @container, @import or nested rule, no
 *   selector the DOM cannot match, no presentational colour attribute
 *   (bgcolor, background, text, font color), and no colour or background
 *   left as a var(). Otherwise the rule is notApplicable there.
 * - In a browser, text whose rendered boxes are empty or entirely off the
 *   page is left out.
 * - Text inside shadow trees is not walked; slotted text follows its slot.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-color-declarations-paired';

const meta = {
  title: 'Text and background colours are declared together',
  description:
    'Fails text whose author colour has no background colour on its element or any parent, and a background image over text with no background colour, and asks about a background colour over text left in the default colour (RGAA 10.5).',
  i18n: {
    titleKey: 'colorDeclarationsPaired_title',
    descriptionKey: 'colorDeclarationsPaired_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'color', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const DEFAULT_COLOR = 'rgb(0, 0, 0)';
  const LINK_COLORS = new Set(['rgb(0, 0, 238)', 'rgb(85, 26, 139)']);
  const MAX_TEXT_NODES = 20000;
  const SAFE_RULE_TYPES = new Set([1, 5, 6, 7, 8, 10]); // style, font-face, page, keyframes, keyframe, namespace
  const SKIP = new Set([
    'script',
    'style',
    'template',
    'noscript',
    'title',
    'head',
    'svg',
    'math',
    'canvas',
    'video',
    'audio',
    'iframe',
    'object',
    'embed',
    'picture',
    'img',
    'input',
    'select',
    'textarea',
    'button',
    'option',
    'optgroup',
    'datalist',
    'meter',
    'progress'
  ]);
  const PSEUDO_ELEMENT =
    /::?(?:before|after|first-line|first-letter|marker|placeholder|selection|backdrop)\b/gi;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const view = dom.defaultView(document);

  const styleCache = new Map();
  function cs(el) {
    if (styleCache.has(el)) return styleCache.get(el);
    let s = null;
    try {
      if (view && typeof view.getComputedStyle === 'function') s = view.getComputedStyle(el);
    } catch {
      s = null;
    }
    styleCache.set(el, s);
    return s;
  }
  const prop = (s, name) =>
    String((s && s.getPropertyValue(name)) || '')
      .trim()
      .toLowerCase();

  // The parent in the flat tree: a slotted node's slot, a shadow root's host.
  function flatParent(el) {
    let slot = null;
    try {
      slot = dom.get(el, 'assignedSlot');
    } catch {
      slot = null;
    }
    if (slot) return slot;
    const p = dom.parentElement(el);
    if (p) return p;
    const pn = dom.parentNode(el);
    if (pn && dom.nodeType(pn) === 11) {
      try {
        return dom.host(pn) || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  function alphaZero(v) {
    const s = String(v || '')
      .trim()
      .toLowerCase();
    if (!s || s === 'transparent') return true;
    // rgba(r, g, b, 0) or any colour function with "/ 0" as its alpha.
    return /^rgba?\([^,]*,[^,]*,[^,]*,\s*0(?:\.0+)?%?\s*\)$|\/\s*0(?:\.0+)?%?\s*\)$/.test(s);
  }

  function hasLayout() {
    const probe = dom.documentElement(document) || dom.body(document) || null;
    if (!probe || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }
  const layout = hasLayout();

  // Without a layout, is everything the cascade needs known to the DOM?
  function cascadeKnown() {
    const root = dom.documentElement(document);
    try {
      for (const link of dom.querySelectorAll(document, 'link[rel~="stylesheet" i]')) {
        if (!dom.get(link, 'sheet')) return false;
      }
      if (
        dom.querySelectorAll(
          document,
          '[bgcolor], body[background], table[background], td[background], th[background], tr[background], body[text], font[color]'
        ).length
      ) {
        return false;
      }
    } catch {
      return false;
    }
    function walk(rules, depth) {
      for (const r of rules || []) {
        if (!r) continue;
        if (!SAFE_RULE_TYPES.has(r.type)) return false;
        if (r.type === 1) {
          let nested = null;
          try {
            nested = r.cssRules;
          } catch {
            nested = null;
          }
          if (nested && nested.length) return false;
          try {
            dom.matches(root, String(r.selectorText || '').replace(PSEUDO_ELEMENT, ''));
          } catch {
            return false;
          }
        }
        if (depth > 4) return false;
      }
      return true;
    }
    try {
      for (const sheet of dom.styleSheets(document) || []) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch {
          return false;
        }
        if (!walk(rules, 0)) return false;
      }
    } catch {
      return false;
    }
    return true;
  }

  function notApplicable() {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const rootEl = dom.documentElement(document);
  const body = dom.body(document);
  if (!rootEl || !body) return notApplicable();
  if (!layout && !cascadeKnown()) return notApplicable();
  // A dark colour-scheme takes both colours from the system.
  if (/\bdark\b/.test(prop(cs(rootEl), 'color-scheme'))) return notApplicable();

  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }

  function skipped(el) {
    for (let a = el; a; a = flatParent(a)) {
      if (SKIP.has(tagOf(a))) return true;
      if (
        String(dom.getAttribute(a, 'aria-hidden') || '')
          .trim()
          .toLowerCase() === 'true'
      ) {
        return true;
      }
    }
    return false;
  }

  // Text that is pushed or clipped out of view, read from the style.
  function styleHidesText(el) {
    const s = cs(el);
    if (!s) return true;
    if (alphaZero(prop(s, 'color'))) return true;
    if (parseFloat(prop(s, 'font-size')) === 0) return true;
    const indent = prop(s, 'text-indent');
    if (/px$/.test(indent) && parseFloat(indent) <= -100) return true;
    for (let a = el, i = 0; a && i < 4; a = flatParent(a), i += 1) {
      const as = cs(a);
      if (!as) continue;
      const clip = prop(as, 'clip');
      if (/^rect\(\s*0(px)?[\s,]+0(px)?[\s,]+0(px)?[\s,]+0(px)?\s*\)$/.test(clip)) return true;
      if (/inset\(\s*50%/.test(prop(as, 'clip-path'))) return true;
      const pos = prop(as, 'position');
      if (
        (pos === 'absolute' || pos === 'fixed') &&
        parseFloat(prop(as, 'width')) <= 1 &&
        parseFloat(prop(as, 'height')) <= 1 &&
        prop(as, 'overflow').startsWith('hidden')
      ) {
        return true;
      }
    }
    return false;
  }

  // In a browser, text whose boxes are empty or off the page.
  function renderedOffPage(textNode) {
    if (!layout) return false;
    let rects = null;
    try {
      const range = dom.createRange(document);
      range.selectNodeContents(textNode);
      rects = dom.call(range, 'getClientRects');
    } catch {
      return false;
    }
    if (!rects || !rects.length) return true;
    const sx = (view && view.scrollX) || 0;
    const sy = (view && view.scrollY) || 0;
    for (const r of rects) {
      if (r.width > 0 && r.height > 0 && r.right + sx > 0 && r.bottom + sy > 0) return false;
    }
    return true;
  }

  function uaColorOwner(el, color) {
    const tag = tagOf(el);
    if ((tag === 'a' || tag === 'area') && dom.hasAttribute(el, 'href') && LINK_COLORS.has(color)) {
      return true;
    }
    return uaPaired(el);
  }
  function uaPaired(el) {
    const tag = tagOf(el);
    const s = cs(el);
    const bg = prop(s, 'background-color');
    if (tag === 'mark' && bg === 'rgb(255, 255, 0)') return true;
    if ((tag === 'dialog' || dom.hasAttribute(el, 'popover')) && bg === 'rgb(255, 255, 255)') {
      return true;
    }
    return false;
  }

  function hasImage(s) {
    const v = prop(s, 'background-image');
    return /url\(|gradient\(/.test(v);
  }

  const colorFails = new Map(); // setter element -> color
  const imageFails = new Set();
  const backgroundAsks = new Set();
  const order = [];
  let unknown = false;

  let walker = null;
  try {
    walker = dom.createTreeWalker(document, body, 4, null);
  } catch {
    walker = null;
  }
  const seenParents = new Set();
  let count = 0;
  for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
    if (count++ > MAX_TEXT_NODES) break;
    if (!String(dom.nodeValue(n) || '').trim()) continue;
    const el = dom.parentElement(n);
    if (!el || seenParents.has(el)) continue;
    if (skipped(el) || !visible(el) || styleHidesText(el) || renderedOffPage(n)) continue;
    seenParents.add(el);

    const s = cs(el);
    const color = prop(s, 'color');
    if (!color || color.includes('var(')) {
      unknown = true;
      continue;
    }

    // Up the flat tree: the first background colour, and the background
    // images met before it.
    let bgOwner = null;
    const images = [];
    for (let a = el; a; a = flatParent(a)) {
      const as = cs(a);
      const bg = prop(as, 'background-color');
      if (bg.includes('var(')) {
        unknown = true;
        break;
      }
      if (!alphaZero(bg)) {
        bgOwner = a;
        break;
      }
      if (hasImage(as)) images.push(a);
    }
    if (unknown) continue;

    if (!bgOwner) {
      for (const img of images) {
        if (!imageFails.has(img)) {
          imageFails.add(img);
          order.push(['image', img]);
        }
      }
      // The element that sets the colour: the topmost one with this colour.
      let setter = el;
      for (let p = flatParent(setter); p && prop(cs(p), 'color') === color; p = flatParent(p)) {
        setter = p;
      }
      const isRoot = !flatParent(setter);
      if (isRoot && color === DEFAULT_COLOR) continue;
      if (uaColorOwner(setter, color)) continue;
      if (!colorFails.has(setter)) {
        colorFails.set(setter, color);
        order.push(['color', setter]);
      }
      continue;
    }

    // 10.5.2: a background over text left black all the way up.
    if (uaPaired(bgOwner)) continue;
    let allDefault = true;
    for (let a = el; a; a = flatParent(a)) {
      if (prop(cs(a), 'color') !== DEFAULT_COLOR) {
        allDefault = false;
        break;
      }
    }
    if (allDefault && !backgroundAsks.has(bgOwner)) {
      backgroundAsks.add(bgOwner);
      order.push(['background', bgOwner]);
    }
  }

  if (unknown && !layout) return notApplicable();

  const fails = [];
  const cantTells = [];
  for (const [kind, el] of order) {
    if (kind === 'color') {
      const params = { color: colorFails.get(el) };
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This element sets the text colour (${params.color}), but neither it nor any parent declares a background colour.`,
          hint: 'Declare a background colour (background or background-color) on this element or a parent, such as <body>, so the text keeps its contrast whatever the user’s default background (RGAA 10.5.1).',
          i18n: {
            summaryKey: 'colorDeclarationsPaired_summary_colorWithoutBackground',
            hintKey: 'colorDeclarationsPaired_hint_colorWithoutBackground',
            params
          },
          data: {
            details: { reasonCode: 'colorWithoutBackground', ...params },
            visibilityFilter: VF
          }
        })
      );
    } else if (kind === 'image') {
      const params = { image: prop(cs(el), 'background-image').slice(0, 80) };
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This element has text over a background image (${params.image}), but neither it nor any parent declares a background colour.`,
          hint: 'Declare a background colour (background or background-color) close to the image’s, on this element or a parent, so the text stays readable when the image does not load (RGAA 10.5.3).',
          i18n: {
            summaryKey: 'colorDeclarationsPaired_summary_imageWithoutBackground',
            hintKey: 'colorDeclarationsPaired_hint_imageWithoutBackground',
            params
          },
          data: {
            details: { reasonCode: 'imageWithoutBackground', ...params },
            visibilityFilter: VF
          }
        })
      );
    } else {
      const params = { background: prop(cs(el), 'background-color') };
      cantTells.push(
        helpers.reportOccurrence(el, {
          summary: `This element declares a background colour (${params.background}) over text left in the default black.`,
          hint: 'Check that a text colour (color) is declared on this element or a parent: a declared black cannot be told from the browser’s default (RGAA 10.5.2).',
          i18n: {
            summaryKey: 'colorDeclarationsPaired_summary_backgroundWithoutColor',
            hintKey: 'colorDeclarationsPaired_hint_backgroundWithoutColor',
            params
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the style sheets declare a text colour for this text.'
          },
          data: {
            details: { reasonCode: 'backgroundWithoutColor', ...params },
            visibilityFilter: VF
          }
        })
      );
    }
  }

  if (!fails.length && !cantTells.length) return notApplicable();
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'moderate');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
