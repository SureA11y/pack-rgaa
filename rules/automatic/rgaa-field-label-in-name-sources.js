/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-field-label-in-name-sources
 * @atomic true
 * @summary Each label source of a form field contains its visible label
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the form fields of RGAA's glossary entry "Champ de saisie de
 *   formulaire" (native <input> other than the button types and hidden,
 *   <select>, <textarea>, <output>, <progress>, <meter>, and the textbox,
 *   searchbox, combobox, spinbutton, slider, listbox, checkbox, radio,
 *   switch and progressbar roles) that have a visible label and at least
 *   one label source other than the one the visible label is read from.
 *   The visible label is the visible text of the field's <label>, else of
 *   the elements its aria-labelledby points to, else, for the checkbox,
 *   radio and switch roles, the field's own text. A field whose visible
 *   label is not tied to it in the markup is not found. A page with no such
 *   field is notApplicable.
 * @expectation
 *   RGAA 11.2.5: when present, the aria-label, the text aria-labelledby
 *   points to, the title and the content of the <label> each contain the
 *   visible label. Punctuation and capital letters are ignored (the
 *   particular cases of 11.2); accents are not folded. Only the source
 *   that gives the accessible name is judged, and it fails when it does not
 *   contain the visible label: the test's conditions name every source
 *   present, but its methodology and the glossary « Étiquette de champ de
 *   formulaire » judge the one that is the étiquette (aria-labelledby, else
 *   aria-label, else <label>, else title), as 11.9.2 does for buttons. A
 *   field whose other sources lack the label (a title holding a format hint
 *   beside a <label>) passes. « Contient » is read as words: each word of
 *   the visible label must appear, in order, as a word of that source, so a
 *   word with another ending ("Rechercher" for "Recherche"), an
 *   abbreviation written out or text in parentheses left out fails.
 * @implementation-notes
 * - The visible label is the text as the browser renders it: text nodes
 *   split across inline elements join with no space (Télé<b>charger</b>
 *   reads "Télécharger"), and a space separates them only where the source
 *   has whitespace, a line break, a form control or a block boundary.
 * - The content of a switch, checkbox or radio that is only a state word
 *   ("Activé", "On") is its state, not its étiquette: such a field has no
 *   visible label, and 11.2.5 does not apply to it.
 * - Screen-reader-only text inside the element or its label (clipped
 *   away, 1x1 px with its overflow hidden, transparent:
 *   helpers.isVisuallyHidden) is not part of the visible label.
 * - Its runInPage is the one of rgaa-link-label-in-name-sources, apart from the
 *   `family` constant and the messages; the four label-in-name files are
 *   changed together. That file documents the comparison and the case
 *   asked about instead of failed (a visible label that may be a symbol).
 * - Opt-in (tag `rgaa`): WCAG 2.5.3 compares only the accessible name,
 *   which label-in-name checks; this rule runs only under the rgaa-4.1.2
 *   profile, the `rgaa` tag or its own id.
 */

const id = 'rgaa-field-label-in-name-sources';

const meta = {
  title: 'Every label source of a form field contains its visible label',
  description:
    'Checks that the source that gives the accessible name of a form field with a visible label (aria-labelledby, aria-label, <label> or title) contains that label, as RGAA 11.2.5 requires.',
  i18n: {
    titleKey: 'fieldLabelInNameSources_title',
    descriptionKey: 'fieldLabelInNameSources_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'name', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['NAME_LACKS_VISIBLE_LABEL', 'POSSIBLE_SYMBOL'],
  review: {
    POSSIBLE_SYMBOL: {
      steps: [
        'Find the form field the report names, and read its visible label on screen.',
        "Read its accessible name in the browser's accessibility tree, and note which source gives it (aria-labelledby, else aria-label, else <label>, else title).",
        'Decide whether the visible label is a symbol (an icon glyph, "X" for close, ">" for next), a mathematical expression, or text to read as is.'
      ],
      passWhen:
        'The visible label is a symbol and the source that gives the accessible name says what it means, or it is a mathematical expression that source repeats as is, both of which the particular cases of RGAA 11.2 accept.',
      failWhen:
        'The visible label is text to read as is, and the source that gives the accessible name does not contain it, which fails RGAA 11.2.5.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  // Which of the four label-in-name tests this file checks. The four rule
  // files carry the same runInPage, apart from this constant and MESSAGES.
  const family = 'field';

  const FIELD_ROLES = new Set([
    'textbox',
    'searchbox',
    'combobox',
    'spinbutton',
    'slider',
    'listbox',
    'checkbox',
    'radio',
    'switch',
    'progressbar'
  ]);
  // Field roles whose content is their label, not their value.
  const FIELD_ROLES_NAMED_BY_CONTENT = new Set(['checkbox', 'radio', 'switch']);
  const WIDGET_ROLES = new Set([
    'tab',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'treeitem',
    'gridcell',
    'option'
  ]);
  const BUTTON_INPUT_TYPES = new Set(['submit', 'reset', 'button', 'image']);
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const SELECTORS = {
    link: 'a[href], [role~="link" i]',
    field:
      'input, select, textarea, output, progress, meter, [role~="textbox" i], [role~="searchbox" i], [role~="combobox" i], [role~="spinbutton" i], [role~="slider" i], [role~="listbox" i], [role~="checkbox" i], [role~="radio" i], [role~="switch" i], [role~="progressbar" i]',
    button: 'button, input, [role~="button" i]',
    widget:
      '[role~="tab" i], [role~="menuitem" i], [role~="menuitemcheckbox" i], [role~="menuitemradio" i], [role~="treeitem" i], [role~="gridcell" i], [role~="option" i], button, input, [role~="button" i]'
  };

  function tagOf(el) {
    return String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  }

  // The role the attribute resolves to: its first known, non-abstract token,
  // in any case (role="foo BUTTON" is a button).
  function explicitRole(el) {
    try {
      return helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  function inputType(el) {
    return String(dom.getAttribute(el, 'type') || '')
      .trim()
      .toLowerCase();
  }

  // The RGAA test an element belongs to: its explicit role decides first,
  // then its tag. '' for anything none of the four tests covers.
  function classify(el) {
    if (dom.namespaceURI(el) === SVG_NS) return '';
    const role = explicitRole(el);
    if (role) {
      if (role === 'link') return 'link';
      if (role === 'button') return 'button';
      if (FIELD_ROLES.has(role)) return 'field';
      if (WIDGET_ROLES.has(role)) return 'widget';
      return '';
    }
    const tag = tagOf(el);
    if (tag === 'a') return dom.hasAttribute(el, 'href') ? 'link' : '';
    if (tag === 'button') return 'button';
    if (tag === 'input') {
      const type = inputType(el);
      if (type === 'hidden') return '';
      return BUTTON_INPUT_TYPES.has(type) ? 'button' : 'field';
    }
    if (['select', 'textarea', 'output', 'progress', 'meter'].includes(tag)) return 'field';
    return '';
  }

  function parentOf(node) {
    if (helpers.composedParent) return helpers.composedParent(node);
    return dom.parentNode(node) && dom.host(dom.parentNode(node))
      ? dom.host(dom.parentNode(node))
      : dom.parentNode(node);
  }

  // RGAA 11.9 covers the buttons « présents au sein d'un formulaire »: a
  // <form> or role="form" ancestor (glossary "Formulaire").
  function insideForm(el) {
    for (let p = parentOf(el); p && dom.nodeType(p) === 1; p = parentOf(p)) {
      if (tagOf(p) === 'form') return true;
      if (explicitRole(p) === 'form') return true;
    }
    return false;
  }

  function isDomVisible(el) {
    if (!el) return false;
    if (helpers.isDomVisibleEligible)
      return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
    if (helpers.getEligibilityInfo)
      return !!helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' }).eligible;
    return true;
  }

  // Visible and not inside an aria-hidden subtree: an aria-hidden icon glyph
  // is not read as words.
  function isAccEligible(el) {
    const fn =
      helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
    if (!fn) return isDomVisible(el);
    try {
      const r = fn(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return isDomVisible(el);
    }
  }

  function isNonRenderedTag(tag) {
    return ['script', 'style', 'template', 'noscript', 'meta', 'link'].includes(tag);
  }

  // Text of form controls nested in a label is their value, not the label.
  function isControlTag(tag) {
    return ['input', 'select', 'textarea', 'button', 'option', 'optgroup', 'datalist'].includes(
      tag
    );
  }

  // Screen-reader-only text (clipped away, 1x1 px with its overflow hidden,
  // transparent) is in the accessibility tree but not on screen, so it is
  // no part of the visible label: on unistra.fr, "Page" in
  // <span class="sr-only">Page</span>2 made "Page2" the visible label.
  const hiddenCache = new Map();
  function srOnly(el, container) {
    if (typeof helpers.isVisuallyHidden !== 'function') return false;
    // The container itself is left alone: a skip link is screen-reader-only
    // until it is focused, and its text is its visible label then.
    for (let a = el; a && a !== container; a = dom.parentElement(a)) {
      if (!hiddenCache.has(a)) {
        let hidden = false;
        try {
          hidden = !!helpers.isVisuallyHidden(a);
        } catch {}
        hiddenCache.set(a, hidden);
      }
      if (hiddenCache.get(a)) return true;
    }
    return false;
  }

  const SHOW_ELEMENT = 1;
  const SHOW_TEXT = 4;

  // Rendered and in the accessibility tree but drawn so that nothing can be
  // seen: the screen-reader-only patterns (clipped, 1px with overflow
  // hidden, transparent), which are not part of a visible label.
  function isVisuallyHidden(el) {
    if (!el || !helpers || typeof helpers.isVisuallyHidden !== 'function') return false;
    try {
      return !!helpers.isVisuallyHidden(el);
    } catch {
      return false;
    }
  }

  // Whether an element separates the text before it from the text after it,
  // as the browser lays the text out: a block box (block, list item, table
  // cell, flex or grid container), a line break or a form control does; an
  // inline element does not, so Télé<b>charger</b> reads "Télécharger".
  const breakCache = new Map();
  function breaksText(el) {
    if (breakCache.has(el)) return breakCache.get(el);
    const tag = tagOf(el);
    let breaks = tag === 'br' || isControlTag(tag);
    if (!breaks) {
      let display = '';
      try {
        const view = dom.ownerDocument(el) && dom.defaultView(dom.ownerDocument(el));
        if (view && typeof view.getComputedStyle === 'function') {
          display = String(view.getComputedStyle(el).display || '');
        }
      } catch {
        display = '';
      }
      breaks = /^(block|list-item|flex|grid|flow-root|table)/.test(display);
    }
    breakCache.set(el, breaks);
    return breaks;
  }

  // The text a person sees in `container`, in document order. With
  // `visibleOnly` false, hidden text counts too (the content of a source).
  // Text nodes are joined as the browser renders them: with a space where the
  // source has whitespace or a block boundary, line break or control comes
  // between them, and with none between inline siblings.
  // Each container is read once per mode: a label or aria-labelledby target
  // that many fields share is walked once, not once per field.
  const textCache = { true: new Map(), false: new Map() };
  function textUnder(container, visibleOnly) {
    if (!container) return { text: '', elements: [] };
    const cache = textCache[!!visibleOnly];
    if (!cache.has(container)) cache.set(container, readTextUnder(container, visibleOnly));
    return cache.get(container);
  }

  function readTextUnder(container, visibleOnly) {
    if (visibleOnly && (!isDomVisible(container) || isVisuallyHidden(container))) {
      return { text: '', elements: [] };
    }
    let walker;
    try {
      walker = dom.createTreeWalker(document, container, SHOW_ELEMENT | SHOW_TEXT, null);
    } catch {
      walker = null;
    }
    if (!walker) return { text: '', elements: [] };
    let text = '';
    const elements = [];
    // A space is due before the next text.
    let gap = false;
    let last = null;
    let n;
    while ((n = walker.nextNode())) {
      if (dom.nodeType(n) === 1) {
        if (breaksText(n)) gap = true;
        continue;
      }
      const raw = String(dom.nodeValue(n) || '').replace(/\s+/g, ' ');
      if (!raw) continue;
      const p = dom.parentElement(n);
      if (!p) continue;
      const t = raw.trim();
      if (!t) {
        // Whitespace between two runs of text, unless a control or a
        // non-rendered element holds it.
        const tag = tagOf(p);
        if (!isNonRenderedTag(tag) && !isControlTag(tag)) gap = true;
        continue;
      }
      let skip = false;
      for (let a = p; a && a !== container; a = dom.parentElement(a)) {
        const tag = tagOf(a);
        if (isNonRenderedTag(tag) || isControlTag(tag) || (visibleOnly && isVisuallyHidden(a))) {
          skip = true;
          break;
        }
      }
      if (skip || isNonRenderedTag(tagOf(p))) continue;
      if (visibleOnly && (!isAccEligible(p) || srOnly(p, container))) continue;
      // A block that closed after the last text separates it from this one.
      if (last && !gap) {
        for (let a = dom.parentElement(last); a && a !== container; a = dom.parentElement(a)) {
          if (dom.contains(a, n)) break;
          if (breaksText(a)) {
            gap = true;
            break;
          }
        }
      }
      if (text && (gap || raw[0] === ' ')) text += ' ';
      text += t;
      gap = raw[raw.length - 1] === ' ';
      last = n;
      if (!elements.includes(p)) elements.push(p);
    }
    return { text, elements };
  }

  function labelsOf(el) {
    if (!helpers.getAssociatedLabelElements) return [];
    try {
      return helpers.getAssociatedLabelElements(el) || [];
    } catch {
      return [];
    }
  }

  function labelledbyRefs(el) {
    const idrefs = dom.getAttribute(el, 'aria-labelledby');
    if (!idrefs || !idrefs.trim() || !helpers.resolveIdRefs) return [];
    try {
      const r = helpers.resolveIdRefs(idrefs, ctx, { maxRefs: 8 }, el);
      return r && Array.isArray(r.refs) ? r.refs : [];
    } catch {
      return [];
    }
  }

  function joinVisible(nodes) {
    const texts = [];
    const elements = [];
    for (const node of nodes) {
      const t = textUnder(node, true);
      if (t.text) {
        texts.push(t.text);
        for (const e of t.elements) elements.push(e);
      }
    }
    return { text: texts.join(' ').replace(/\s+/g, ' ').trim(), elements };
  }

  // The visible label (glossary "Intitulé visible") and where it comes from.
  // Links, buttons and components show it as their content; a field shows it
  // in its <label>, or in the text its aria-labelledby points to.
  // The whole text is a state, in the shipped locales.
  const STATE_WORDS =
    /^\s*(on|off|yes|no|enabled|disabled|activ[ée]e?|d[ée]sactiv[ée]e?|actif|inactif|oui|non|an|aus|ein|ja|nein|aktiv|inaktiv|s[ií]|activado|desactivado|オン|オフ|有効|無効)\s*$/i;

  function visibleLabelOf(el) {
    const tag = tagOf(el);
    const role = explicitRole(el);
    if (tag === 'input' && classify(el) === 'button') {
      if (inputType(el) === 'image') return { text: '', origin: '', elements: [] };
      const value = String(dom.getAttribute(el, 'value') || '')
        .replace(/\s+/g, ' ')
        .trim();
      return { text: value, origin: 'value', elements: [el] };
    }
    if (family === 'field') {
      const labels = labelsOf(el).filter((l) => isDomVisible(l));
      const fromLabel = joinVisible(labels);
      if (fromLabel.text) return { ...fromLabel, origin: 'label' };
      const fromRefs = joinVisible(labelledbyRefs(el));
      if (fromRefs.text) return { ...fromRefs, origin: 'aria-labelledby' };
      if (FIELD_ROLES_NAMED_BY_CONTENT.has(role)) {
        const own = textUnder(el, true);
        // A state word ("Activé", "On") is the field's state, not its
        // étiquette (glossary « Intitulé visible »).
        if (own.text && !STATE_WORDS.test(own.text)) return { ...own, origin: 'content' };
      }
      return { text: '', origin: '', elements: [] };
    }
    const own = textUnder(el, true);
    return { ...own, origin: 'content' };
  }

  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function labelSourceText(el) {
    const texts = [];
    for (const l of labelsOf(el)) {
      const t = textUnder(l, false).text;
      if (t) texts.push(t);
    }
    return clean(texts.join(' '));
  }

  // The name sources present on the element, in the order the glossary gives
  // for the accessible name. `wins` marks the one that gives the name.
  function sourcesOf(el) {
    const out = [];
    let byRef = '';
    if (helpers.getAriaLabelledByInfo) {
      try {
        const info = helpers.getAriaLabelledByInfo(el, ctx, { maxRefs: 8 });
        byRef = clean(info && info.present ? info.value : '');
      } catch {
        byRef = '';
      }
    }
    if (byRef) out.push({ source: 'aria-labelledby', text: byRef });
    const ariaLabel = clean(dom.getAttribute(el, 'aria-label'));
    if (ariaLabel) out.push({ source: 'aria-label', text: ariaLabel });
    if (family === 'field') {
      const labelText = labelSourceText(el);
      if (labelText) out.push({ source: '<label>', text: labelText });
    }
    const title = clean(dom.getAttribute(el, 'title'));
    if (title) out.push({ source: 'title', text: title });
    return out;
  }

  // ---- Comparison (RGAA particular cases: punctuation and capitals) ----

  function tokenize(s, joinPunctuation) {
    let v = String(s == null ? '' : s).toLowerCase();
    try {
      v = v.normalize('NFKC');
    } catch {
      // Realm without String#normalize: the word comparison still holds.
    }
    if (joinPunctuation) v = v.replace(/[\p{P}\p{S}]+/gu, '');
    return v
      .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
      .split(' ')
      .filter(Boolean);
  }

  function containsWordRun(needle, hay) {
    if (!needle.length) return true;
    for (let i = 0; i + needle.length <= hay.length; i++) {
      if (needle.every((w, j) => w === hay[i + j])) return true;
    }
    return false;
  }

  const ICON_FONT_FAMILIES = new Set([
    'material icons',
    'material icons outlined',
    'material icons round',
    'material icons sharp',
    'material icons two tone',
    'material symbols outlined',
    'material symbols rounded',
    'material symbols sharp',
    'font awesome 5 free',
    'font awesome 5 brands',
    'font awesome 5 pro',
    'font awesome 6 free',
    'font awesome 6 brands',
    'font awesome 6 pro',
    'fontawesome',
    'glyphicons halflings',
    'ionicons',
    'icomoon',
    'bootstrap-icons',
    'bootstrap icons',
    'feather'
  ]);

  function isIconFontElement(node) {
    let cs = null;
    try {
      const view = dom.ownerDocument(node) && dom.defaultView(dom.ownerDocument(node));
      if (view && typeof view.getComputedStyle === 'function') cs = view.getComputedStyle(node);
    } catch {
      cs = null;
    }
    if (!cs) return false;
    let fontFamily;
    try {
      fontFamily = cs.fontFamily || cs.getPropertyValue('font-family') || '';
    } catch {
      fontFamily = '';
    }
    return String(fontFamily)
      .split(',')
      .map((s) =>
        s
          .trim()
          .replace(/^['"]|['"]$/g, '')
          .toLowerCase()
      )
      .some((n) => ICON_FONT_FAMILIES.has(n));
  }

  // 'yes' when the source contains the words of the visible label, in order,
  // punctuation and capital letters aside; 'symbol' when the visible label
  // may be a symbol, which the name may express by its function; else 'no'.
  // An abbreviation written out ("Avenue" for "Av."), a word with another
  // ending ("Rechercher" for "Recherche") or text in parentheses left out is
  // 'no': the particular cases excuse only punctuation, capital letters and
  // symbols.
  function compare(label, sourceText) {
    if (containsWordRun(tokenize(label.text, false), tokenize(sourceText, false))) return 'yes';
    if (containsWordRun(tokenize(label.text, true), tokenize(sourceText, true))) return 'yes';
    if (label.elements.some(isIconFontElement)) return 'symbol';
    const whole = label.text.toLowerCase();
    if ([...whole].length === 1 && sourceText.toLowerCase().indexOf(whole) === -1) {
      return 'symbol';
    }
    return 'no';
  }

  function describe(el) {
    const tag = tagOf(el) || 'element';
    const role = explicitRole(el);
    // eslint-disable-next-line safe-dom/no-raw-role -- descriptor text for messages, not a selector
    if (role) return `${tag}[role="${role}"]`;
    if (tag === 'input') return `input[type="${inputType(el) || 'text'}"]`;
    return tag;
  }

  function clip(s) {
    const v = clean(s);
    return v.length <= 80 ? v : v.slice(0, 77) + '...';
  }

  const MESSAGES = {
    NAME_LACKS_VISIBLE_LABEL: {
      reasonCode: 'NAME_LACKS_VISIBLE_LABEL',
      outcome: 'fail',
      summaryKey: 'fieldLabelInNameSources_summary_fail_name',
      hintKey: 'fieldLabelInNameSources_hint_fail_name',
      summary: (p) =>
        `The accessible name of this form field (from ${p.sources}) does not contain its visible label "${p.visibleLabel}".`,
      hint: 'Make the attribute that names the element contain the visible label, ideally at its start, or remove it so the visible text names the element.'
    },
    POSSIBLE_SYMBOL: {
      reasonCode: 'POSSIBLE_SYMBOL',
      outcome: 'cantTell',
      summaryKey: 'fieldLabelInNameSources_summary_cantTell_symbol',
      hintKey: 'fieldLabelInNameSources_hint_cantTell_symbol',
      summary: (p) =>
        `The visible label "${p.visibleLabel}" of this form field may be a symbol, and the ${p.sources} does not contain it.`,
      hint: 'If the visible text is a symbol (an icon glyph, "X" for close, ">" for next), check that the name says what the symbol means. If it is literal text, the name must contain it.',
      needed: 'Whether the visible text is a symbol whose function the name expresses.'
    }
  };

  let nodes;
  try {
    nodes = helpers.queryAllSmart
      ? helpers.queryAllSmart(SELECTORS[family])
      : helpers.queryAll(SELECTORS[family]);
  } catch {
    nodes = [];
  }

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const kind = classify(el);
    // A button outside a form is a component a script drives: 7.1.3 covers
    // it, and 11.9.2 only the buttons inside a form.
    const asComponent = family === 'widget' && kind === 'button' && !insideForm(el);
    if (kind !== family && !asComponent) continue;
    if (family === 'button' && !insideForm(el)) continue;
    if (!isDomVisible(el)) continue;

    const label = visibleLabelOf(el);
    if (!label.text || !tokenize(label.text, false).length) continue;

    const all = sourcesOf(el);
    // The first present ARIA source names the element; without one, a
    // field's <label>, or the content or value of anything else, does.
    const winning =
      all.find((s) => s.source === 'aria-labelledby' || s.source === 'aria-label') ||
      (family === 'field' ? all.find((s) => s.source === '<label>') : null) ||
      (label.origin === 'content' || label.origin === 'value' ? null : all[0]) ||
      null;

    // The source the visible label is read from contains it already.
    let checked = all.filter((s) => s.source !== label.origin);
    if (family === 'field' && label.origin === 'label') {
      checked = checked.filter((s) => s.source !== '<label>');
    }
    // 7.1.3 checks the accessible name only.
    if (family === 'widget') checked = checked.filter((s) => s === winning);
    if (!checked.length) continue;

    applicableCount += 1;
    // 11.2.5 and 11.9.2 judge only the source that gives the accessible name
    // (glossary « Étiquette de champ de formulaire », 11.9.2 methodology);
    // 6.1.5 checks each source present.
    if (family === 'field' || family === 'button') {
      checked = checked.filter((s) => s === winning);
    }

    const failing = [];
    for (const s of checked) {
      const verdict = compare(label, s.text);
      if (verdict !== 'yes') failing.push({ ...s, verdict, wins: s === winning });
    }
    if (!failing.length) continue;

    const definite = failing.filter((s) => s.verdict === 'no');
    let reasonCode;
    let reported;
    const nameDefinite = definite.find((s) => s.wins);
    if (nameDefinite) {
      reasonCode = 'NAME_LACKS_VISIBLE_LABEL';
      reported = [nameDefinite];
    } else if (definite.length) {
      reasonCode = 'SOURCE_LACKS_VISIBLE_LABEL';
      reported = definite;
    } else {
      reasonCode = 'POSSIBLE_SYMBOL';
      reported = failing;
    }
    const msg = MESSAGES[reasonCode] || MESSAGES.NAME_LACKS_VISIBLE_LABEL;
    const sources = reported.map((s) => s.source).join(', ');

    const params = { element: describe(el), visibleLabel: clip(label.text), sources };
    const occurrence = helpers.reportOccurrence(el, {
      summary: msg.summary(params),
      hint: msg.hint,
      i18n: {
        summaryKey: msg.summaryKey,
        hintKey: msg.hintKey,
        params
      },
      ...(msg.outcome === 'cantTell' && msg.needed
        ? {
            uncertainty: {
              code: 'equivalence-unknown',
              needed: msg.needed,
              evidence: { visibleLabel: label.text, sources }
            }
          }
        : {}),
      ...(msg.outcome === 'cantTell' && !msg.needed
        ? {
            uncertainty: {
              code: 'judgement-required',
              needed: 'Whether the accessible name contains the visible label.',
              evidence: { visibleLabel: label.text, sources }
            }
          }
        : {}),
      data: {
        details: {
          reasonCode,
          visibleLabel: label.text,
          visibleLabelSource: label.origin,
          accessibleNameSource: winning ? winning.source : label.origin,
          sources: failing.map((s) => ({ source: s.source, text: s.text, verdict: s.verdict }))
        }
      }
    });
    if (msg.outcome === 'fail') failOccurrences.push(occurrence);
    else cantTellOccurrences.push(occurrence);
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
