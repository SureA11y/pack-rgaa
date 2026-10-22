/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-css-colors-paired
 * @atomic true
 * @summary A text color declared in CSS must come with a background color, and the reverse
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document with rendered text that an author
 *   text color, background color or background image applies to: declared
 *   on the text's element or one of its ancestors, in a readable style sheet,
 *   a style attribute or a presentational attribute (bgcolor, background,
 *   <font color>, <body text>). A page whose text no author color reaches is
 *   notApplicable.
 * @expectation
 *   RGAA 10.5: each declaration of a text color (color) on an element that
 *   can hold text comes with a background color (background,
 *   background-color), at least on an ancestor (10.5.1); each background
 *   color comes with a text color the same way (10.5.2); and each
 *   background image comes with a background color (10.5.3).
 *   - For each rendered text, the nearest element declaring a text color, a
 *     background color and a background image are looked for, from the
 *     text's element up to <html>. A text color with no background color
 *     fails COLOR_WITHOUT_BACKGROUND, a background color with no text color
 *     BACKGROUND_WITHOUT_COLOR, and a background image with no background
 *     color BACKGROUND_IMAGE_WITHOUT_COLOR. One occurrence per element that
 *     declares the unpaired color, however much text it reaches.
 *   - Without a browser's cascade layers (jsdom), a style sheet that cannot
 *     be read (another origin's, with no text given in
 *     engineOptions.styleSheetTexts) may declare the missing half: the same
 *     findings are asked about instead of failed. In a browser the cascade
 *     applies such a sheet, so it counts like any other.
 *   - It passes when every color that reaches text is paired.
 * @implementation-notes
 * - What an author declared is told apart from the browser's defaults
 *   (black text, blue links, form controls' colors), which a computed style
 *   alone cannot do. In a browser, a style sheet in the lowest-priority
 *   cascade layer sets a sentinel color, background color and background
 *   image on every element for the time of one read: an element whose
 *   computed value is not the sentinel has an author declaration that wins.
 *   Transitions are held off by a second layer while the sentinel is in
 *   place, the page's styles are put back and laid out, and only then is
 *   the second layer removed, so no color moves. The styles are read with
 *   getComputedStyle, not helpers.computedStyle, which would keep the
 *   sentinel's values for the rules that follow. One read of every
 *   element's style, against one query per CSS rule, keeps a page with
 *   thousands of rules fast.
 * - Without cascade layers (jsdom), or when a page's own rule sets a color
 *   on every element, each rule's selectors are matched instead, without
 *   their state pseudo-classes (:hover, :visited...) and pseudo-elements,
 *   so a:hover{color} counts for the link's text. Rules for print only are
 *   left out, and keyword values that declare no color of their own
 *   (inherit, initial, unset, currentcolor, transparent) do not count.
 * - Text inside a shadow root is not judged: its style sheets are not the
 *   document's, so half a pair could be missed and the other half reported.
 * - Only text nodes are judged, not the values of form fields.
 * - WCAG lists the same pattern as failure F24, but no other engine fails it
 *   and its premise is debated, so the rule is RGAA's only.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-css-colors-paired';

const meta = {
  title: 'CSS text and background colors are declared together',
  description:
    'Checks that a CSS text color reaching text comes with a background color, a background color with a text color, and a background image with a background color, at least on an ancestor (RGAA 10.5).',
  i18n: {
    titleKey: 'cssColorsPaired_title',
    descriptionKey: 'cssColorsPaired_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'color', 'css', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const CSS_STYLE_RULE = 1;
  const CSS_IMPORT_RULE = 3;
  const MAX_DEPTH = 10;
  const MAX_OCCURRENCES = 50;
  const NO_COLOR = /^(|inherit|initial|unset|revert|revert-layer|currentcolor)$/i;
  const NO_BACKGROUND =
    /^(|inherit|initial|unset|revert|revert-layer|transparent|rgba\(0,\s*0,\s*0,\s*0\)|#0000|#00000000)$/i;
  const NO_IMAGE = /^(|none|inherit|initial|unset|revert|revert-layer)$/i;
  const STATES =
    /:(hover|focus|focus-visible|focus-within|active|visited|link|any-link|target)\b(\([^)]*\))?/gi;
  const PSEUDO_ELEMENTS =
    /::?(before|after|first-line|first-letter|marker|placeholder|selection)\b/gi;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function prop(style, name) {
    try {
      return trim(style && style.getPropertyValue(name));
    } catch {
      return '';
    }
  }
  function mediaTextOf(list) {
    try {
      return trim(list && list.mediaText).toLowerCase();
    } catch {
      return '';
    }
  }
  const printOnly = (m) => /^print$/.test(m);

  // What a declaration block says: a text color, a background color, a
  // background image.
  function declares(style) {
    const bgColor = prop(style, 'background-color');
    const shorthand = prop(style, 'background');
    return {
      fg: !NO_COLOR.test(prop(style, 'color')),
      // A shorthand holding a custom property leaves its longhands empty.
      bg: !NO_BACKGROUND.test(bgColor) || (!bgColor && /var\(/i.test(shorthand)),
      img: !NO_IMAGE.test(prop(style, 'background-image'))
    };
  }

  const marks = { fg: new Set(), bg: new Set(), img: new Set() };
  function mark(els, d) {
    for (const el of els) {
      if (d.fg) marks.fg.add(el);
      if (d.bg) marks.bg.add(el);
      if (d.img) marks.img.add(el);
    }
  }

  // The selectors of the rules declaring each, matched at the end in a few
  // selector lists rather than one query per rule: on a page with thousands
  // of rules, one query each walks the document thousands of times.
  const selectors = { fg: new Set(), bg: new Set(), img: new Set() };
  const CHUNK = 400;
  const probe = dom.documentElement(document);
  function isValid(selector) {
    try {
      dom.matches(probe, selector);
      return true;
    } catch {
      return false; // a selector the engine cannot parse is skipped, not guessed at
    }
  }
  function matchAll(list, key) {
    const valid = Array.from(list).filter(isValid);
    for (let i = 0; i < valid.length; i += CHUNK) {
      let matched = [];
      try {
        matched = Array.from(dom.querySelectorAll(document, valid.slice(i, i + CHUNK).join(', ')));
      } catch {
        matched = [];
      }
      for (const el of matched) marks[key].add(el);
    }
  }

  let unreadable = 0;
  function walk(rules, depth) {
    if (!rules || depth > MAX_DEPTH) return;
    for (const cssRule of Array.from(rules)) {
      if (!cssRule) continue;
      if (cssRule.type === CSS_STYLE_RULE) {
        const d = declares(cssRule.style);
        if (!d.fg && !d.bg && !d.img) continue;
        const selector =
          trim(cssRule.selectorText).replace(STATES, '').replace(PSEUDO_ELEMENTS, '') || '*';
        for (const k of ['fg', 'bg', 'img']) if (d[k]) selectors[k].add(selector);
        continue;
      }
      if (printOnly(mediaTextOf(cssRule.media))) continue;
      if (cssRule.type === CSS_IMPORT_RULE) {
        let imported = null;
        try {
          imported = cssRule.styleSheet ? helpers.cssRulesOf(cssRule.styleSheet) : null;
        } catch {
          imported = null;
        }
        if (!imported) unreadable += 1;
        walk(imported, depth + 1);
        continue;
      }
      // @media, @supports, @layer, @container: recurse into grouping rules.
      let nested = null;
      try {
        nested = cssRule.cssRules || null;
      } catch {
        nested = null;
      }
      if (nested) walk(nested, depth + 1);
    }
  }

  function walkSheets() {
    try {
      for (const sheet of dom.styleSheets(document) || []) {
        if (!sheet || printOnly(mediaTextOf(sheet.media))) continue;
        const rules = helpers.cssRulesOf ? helpers.cssRulesOf(sheet) : sheet.cssRules;
        if (!rules) {
          unreadable += 1;
          continue;
        }
        walk(rules, 0);
      }
    } catch {
      // no-throw: what was read stands
    }
  }

  // In a browser, the cascade says which elements an author rule sets each
  // on: a sentinel in the lowest-priority cascade layer shows wherever no
  // author rule wins, so the browser's own colors (links, form controls)
  // show it too. Transitions are held off while it is in place, and it goes
  // before they come back, so no color moves. Without cascade layers
  // (jsdom), each rule's selectors are matched instead.
  const SENTINEL = {
    color: 'rgb(1, 2, 3)',
    background: 'rgb(1, 2, 4)',
    image: 'linear-gradient(rgb(1, 2, 5), rgb(1, 2, 5))'
  };
  function cascadeMarks() {
    const view = dom.defaultView(document);
    const host = dom.head(document) || probe;
    if (!view || typeof view.CSSLayerBlockRule !== 'function' || !host) return false;
    const sentinel = dom.createElement(document, 'style');
    const freeze = dom.createElement(document, 'style');
    sentinel.textContent = `@layer surea11y-sentinel{*{color:${SENTINEL.color};background-color:${SENTINEL.background};background-image:${SENTINEL.image}}}`;
    freeze.textContent =
      '@layer surea11y-no-transitions{*,*::before,*::after{transition:none!important}}';
    const remove = (el) => {
      try {
        if (dom.parentNode(el)) dom.removeChild(dom.parentNode(el), el);
      } catch {}
    };
    try {
      // The sentinel's layer comes first, so it is the weakest.
      dom.insertBefore(host, freeze, dom.firstChild(host));
      dom.insertBefore(host, sentinel, freeze);
      // A DOM without cascade layers (jsdom) ignores the sentinel, and so
      // does a page whose own rule sets a color on every element.
      if (prop(view.getComputedStyle(sentinel), 'color') !== SENTINEL.color) return false;
      for (const el of Array.from(dom.querySelectorAll(document, '*'))) {
        // Not helpers.computedStyle: it keeps what it reads for the rest of
        // the scan, and these are the sentinel's values.
        const cs = view.getComputedStyle(el);
        if (!cs || typeof cs.getPropertyValue !== 'function') continue;
        const color = prop(cs, 'color');
        const bg = prop(cs, 'background-color');
        const image = prop(cs, 'background-image');
        if (color && color !== SENTINEL.color) marks.fg.add(el);
        if (bg && bg !== SENTINEL.background && !NO_BACKGROUND.test(bg)) marks.bg.add(el);
        if (image && !NO_IMAGE.test(image) && !image.includes('rgb(1, 2, 5)')) marks.img.add(el);
      }
      return true;
    } catch {
      return false;
    } finally {
      remove(sentinel);
      try {
        // A style read: the page's colors back while transitions are held.
        prop(view.getComputedStyle(probe), 'color');
      } catch {}
      remove(freeze);
    }
  }
  const byCascade = !!probe && cascadeMarks();
  if (probe && !byCascade) {
    walkSheets();
    for (const k of ['fg', 'bg', 'img']) matchAll(selectors[k], k);
  }

  // Style attributes and presentational attributes.
  for (const el of Array.from(
    dom.querySelectorAll(document, '[style], [bgcolor], [background], font[color], body[text]')
  )) {
    const d = el.style ? declares(el.style) : { fg: false, bg: false, img: false };
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (trim(dom.getAttribute(el, 'bgcolor'))) d.bg = true;
    if (trim(dom.getAttribute(el, 'background'))) d.img = true;
    if (tag === 'font' && trim(dom.getAttribute(el, 'color'))) d.fg = true;
    if (tag === 'body' && trim(dom.getAttribute(el, 'text'))) d.fg = true;
    mark([el], d);
  }

  // The nearest element declaring each, from el up to <html>.
  const chains = new Map();
  function chainOf(el) {
    if (!el || dom.nodeType(el) !== 1) return { fg: null, bg: null, img: null };
    if (chains.has(el)) return chains.get(el);
    const up = chainOf(dom.parentElement(el));
    const own = {
      fg: marks.fg.has(el) ? el : up.fg,
      bg: marks.bg.has(el) ? el : up.bg,
      img: marks.img.has(el) ? el : up.img
    };
    chains.set(el, own);
    return own;
  }

  function isShown(el) {
    if (helpers.isDomVisibleEligible) {
      return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
    }
    if (helpers.getEligibilityInfo) {
      return !!helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' }).eligible;
    }
    return true;
  }

  const SKIP = new Set(['script', 'style', 'noscript', 'template', 'textarea', 'title']);
  const findings = new Map(); // `${code} ${index}` -> { code, el }
  const indexOf = new Map(); // origin element -> its index
  let reached = false;
  const body = dom.body(document);
  if (body) {
    const walker = dom.createTreeWalker(document, body, 4);
    // Whether an element's text is judged: rendered, and not script, SVG or
    // MathML. Asked only of text that would decide something, which on most
    // pages is the first and the unpaired.
    const judged = new Map();
    const judge = (el) => {
      if (!judged.has(el)) {
        const tag = String(dom.localName(el) || '').toLowerCase();
        judged.set(el, !SKIP.has(tag) && !dom.closest(el, 'svg, math') && isShown(el));
      }
      return judged.get(el);
    };
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!/\S/.test(dom.nodeValue(n) || '')) continue;
      const el = dom.parentElement(n);
      if (!el) continue;
      const c = chainOf(el);
      const unpaired = [];
      if (c.fg && !c.bg) unpaired.push(['COLOR_WITHOUT_BACKGROUND', c.fg]);
      if (c.bg && !c.fg) unpaired.push(['BACKGROUND_WITHOUT_COLOR', c.bg]);
      if (c.img && !c.bg) unpaired.push(['BACKGROUND_IMAGE_WITHOUT_COLOR', c.img]);
      const fresh = unpaired.filter(
        ([code, origin]) => !findings.has(`${code} ${indexOf.get(origin)}`)
      );
      if (!fresh.length && (reached || !(c.fg || c.bg || c.img))) continue;
      if (!judge(el)) continue;
      reached = true;
      for (const [code, origin] of fresh) {
        if (!indexOf.has(origin)) indexOf.set(origin, indexOf.size);
        findings.set(`${code} ${indexOf.get(origin)}`, { code, el: origin });
      }
    }
  }

  if (!reached) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const MESSAGES = {
    COLOR_WITHOUT_BACKGROUND: {
      key: 'colorWithoutBackground',
      summary: (e) =>
        `This <${e}> declares a text color, but neither it nor any ancestor declares a background color.`,
      hint: 'Declare a background color with the text color, on this element or an ancestor such as <body> (RGAA 10.5.1).'
    },
    BACKGROUND_WITHOUT_COLOR: {
      key: 'backgroundWithoutColor',
      summary: (e) =>
        `This <${e}> declares a background color, but neither it nor any ancestor declares a text color.`,
      hint: 'Declare a text color with the background color, on this element or an ancestor such as <body> (RGAA 10.5.2).'
    },
    BACKGROUND_IMAGE_WITHOUT_COLOR: {
      key: 'imageWithoutColor',
      summary: (e) =>
        `This <${e}> has a background image, but neither it nor any ancestor declares a background color.`,
      hint: 'Declare a background color with the background image, close to the image’s colors, so the text stays readable when the image does not show (RGAA 10.5.3).'
    }
  };

  // Matched by selectors, a style sheet that could not be read may declare
  // the missing half. The cascade applies it all the same.
  const asking = unreadable > 0 && !byCascade;
  const fails = [];
  const questions = [];
  for (const { code, el } of Array.from(findings.values()).slice(0, MAX_OCCURRENCES)) {
    const msg = MESSAGES[code];
    const element = String(dom.localName(el) || '').toLowerCase();
    const occ = helpers.reportOccurrence(el, {
      summary: asking
        ? `${msg.summary(element)} A style sheet could not be read and may declare it.`
        : msg.summary(element),
      hint: msg.hint,
      i18n: {
        summaryKey: `cssColorsPaired_summary_${asking ? 'cantTell' : 'fail'}_${msg.key}`,
        hintKey: `cssColorsPaired_hint_${msg.key}`,
        params: { element }
      },
      ...(asking
        ? {
            uncertainty: {
              code: 'not-computable',
              needed: 'Whether a style sheet the scan could not read declares the missing color.',
              evidence: { reasonCode: code, unreadableStyleSheets: unreadable }
            }
          }
        : {}),
      data: {
        details: { reasonCode: code, element },
        visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
      }
    });
    (asking ? questions : fails).push(occ);
  }

  if (!fails.length && !questions.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'moderate')
  };
}

module.exports = { id, meta, runInPage, applicability };
