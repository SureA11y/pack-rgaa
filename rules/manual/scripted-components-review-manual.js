/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-scripted-components-review
 * @atomic true
 * @summary Scripted components should be compatible with assistive technologies
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every page that contains script, in the scanned document or
 *   any open shadow root inside it: an executable <script> element, an
 *   inline event handler attribute (onclick and the like) on any element, a
 *   href, src, action or formaction starting with "javascript:", or a custom
 *   element (a tag name with a hyphen, which only works through script). A
 *   page with none of these is notApplicable: RGAA 7.1 asks about scripts,
 *   and with no script nothing can create or drive a custom component.
 * @expectation
 *   Always cantTell on a page with script, never pass or fail. One
 *   occurrence at the scan root asks a person to check that every scripted
 *   component exposes its name, role, value, settings and state changes to
 *   assistive technologies (RGAA 7.1.1), is rendered correctly by them
 *   (7.1.2) and has a relevant name and role, with a name that contains its
 *   visible label (7.1.3), or that an accessible alternative exists. Behaviour
 *   attached from script files (addEventListener) cannot be seen in the
 *   markup, so this question stands even when nothing else is listed. After
 *   it, one occurrence per candidate element found in the markup, as a
 *   starting list for the auditor, never a complete one.
 * @implementation-notes
 * - Manual (cantTell): whether a component works with assistive
 *   technologies can only be tested with them.
 * - Candidates, each reported once, under the first reason that matches:
 *   `widgetRole` (an explicit ARIA widget or composite role the element does
 *   not have natively, so <button role="button"> is not listed),
 *   `focusableNonNative` (tabindex >= 0 on an element that is not focusable
 *   natively), `inlineHandler` (an inline pointer, keyboard, focus, input or
 *   drag handler on an element that is not a native control), `contentEditable`
 *   (contenteditable on an element that is not a form field) and
 *   `linkWithoutDestination` (a link whose href is "#", "#!" or a
 *   javascript: URL, which leads nowhere and so usually acts as a button
 *   whose role 7.1.3 asks to be relevant) and `stateAttribute`
 *   (aria-expanded, aria-pressed, aria-haspopup or aria-controls, native
 *   elements included: a <button aria-expanded> is a scripted disclosure).
 * - The page occurrence names the first sign of script found in
 *   `scriptEvidence`: scriptElement, inlineHandler, javascriptUrl or
 *   customElement.
 * - Candidates skip hidden content like the other rules (queryAllSmart), so
 *   a closed menu is usually found through the visible button that opens
 *   it. The script check does not: a <script> is never rendered, and a
 *   script in a hidden or excluded part of the page still runs.
 * - The script check covers the whole document even when the scan is scoped
 *   with contextSelector, since a script anywhere can drive the scoped part.
 * - The engine's own files are not counted as script: a <script> whose src
 *   ends in surea11y.browser.js or surea11y.i18n.<locale>.js, or whose inline
 *   text starts with the banner of those files or with the in-page runner of
 *   src/core.js (how script injection adds them). The Node bindings run the
 *   engine through page.evaluate and add no element. A script written into
 *   the page to call the engine is page script like any other and makes the
 *   rule ask.
 * - A <script> is executable unless its type is a data block: present, not
 *   empty, and neither "module" nor a JavaScript MIME type (parameters
 *   ignored, so "text/javascript; charset=utf-8" counts). application/ld+json,
 *   text/template, importmap and speculationrules are data. With no type, a
 *   language attribute is read as HTML does ("text/" + language).
 * - Opt-in (tag `rgaa`): the question belongs to RGAA's criterion 7.1.
 */

const id = 'rgaa-scripted-components-review';

const meta = {
  title: 'Scripted components are compatible with assistive technologies',
  description:
    'On a page with script, asks a person to check every scripted component against RGAA 7.1 (name, role, value, settings and state changes exposed and rendered by assistive technologies, a name that contains the visible label), and lists the elements in the markup that look like scripted components as a starting point.',
  i18n: {
    titleKey: 'scriptedComponentsReview_title',
    descriptionKey: 'scriptedComponentsReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'aria', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  reasonCodes: [
    'pageReview',
    'widgetRole',
    'focusableNonNative',
    'inlineHandler',
    'contentEditable',
    'stateAttribute',
    'linkWithoutDestination'
  ],
  review: {
    pageReview: {
      steps: [
        'List the components the page builds or controls with script: menus, tabs, carousels, dialogs, accordions, custom form fields.',
        'For each, check with a screen reader that its name, role, value and state are announced, and that a change of state is announced when it happens.',
        'Check that its name is relevant and contains its visible label, and that its role matches what it does.',
        'Where a component falls short, look for an accessible alternative on the page giving the same function.'
      ],
      passWhen:
        'Every scripted component exposes its name, role, value and state changes, is rendered correctly by assistive technologies and has a relevant name and role, or has an accessible alternative.',
      failWhen:
        'A scripted component is not rendered correctly by assistive technologies, with no accessible alternative, which fails RGAA 7.1.1, 7.1.2 or 7.1.3.'
    },
    widgetRole: {
      steps: [
        'Find the element the report names, which has an ARIA widget role.',
        'Use it with the keyboard and a screen reader: listen to its name, role and state, and operate it.',
        'Check that the role matches what it does, and that changes of its state are announced.'
      ],
      passWhen:
        'The component announces a relevant name, the right role and its state, and works with the screen reader.',
      failWhen:
        'The role, name or state is wrong or missing, or the screen reader cannot operate it, which fails RGAA 7.1.1, 7.1.2 or 7.1.3.'
    },
    focusableNonNative: {
      steps: [
        'Find the element the report names, which takes keyboard focus although it is not a link or a form control.',
        'Press Tab to reach it and listen with a screen reader to what is announced.',
        'Check what it does, and that its name and role say so.'
      ],
      passWhen:
        'The element is a component with a relevant name and role, or is only a focus target such as a scrolling region with a name.',
      failWhen:
        'The element acts as a component but announces no role or name, or the wrong ones, which fails RGAA 7.1.1 or 7.1.3.'
    },
    inlineHandler: {
      steps: [
        'Find the element the report names, which has an event handler although it is not a link or a form control.',
        'Use it with the mouse and note what it does.',
        'With a screen reader, check that what it does is announced: a name, a role such as button, and any state.'
      ],
      passWhen:
        'The handler adds no function of its own (tracking, delegation to a native control), or the element announces a relevant name, role and state.',
      failWhen:
        'The element acts as a control but assistive technologies are not told what it is, which fails RGAA 7.1.1 or 7.1.3.'
    },
    contentEditable: {
      steps: [
        'Find the editable element the report names.',
        'Reach it with Tab and listen with a screen reader to what is announced.',
        'Check that it is announced as an editable field with a name that says what to type, and that typed text is read back.'
      ],
      passWhen:
        'The editable area announces its role and a relevant name, and works with the screen reader.',
      failWhen:
        'The editable area has no name or is not rendered as an editable field, which fails RGAA 7.1.1, 7.1.2 or 7.1.3.'
    },
    stateAttribute: {
      steps: [
        'Find the element the report names, which says it controls content (aria-expanded, aria-pressed, aria-haspopup or aria-controls).',
        'Operate it with the keyboard and a screen reader.',
        'Check that its state is announced, and that the state it announces changes to match what the page shows.'
      ],
      passWhen:
        'The announced state follows what happens on the page (expanded when the content shows, pressed when on).',
      failWhen:
        'The state is not announced, or contradicts what the page shows, which fails RGAA 7.1.1.'
    },
    linkWithoutDestination: {
      steps: [
        'Find the link the report names: its href is "#", "#!" or a javascript: address, which leads nowhere.',
        'Activate it, and see what it does.',
        'Listen to it with a screen reader, and note the role it is announced with.'
      ],
      passWhen:
        'It takes you to another page or place and is announced as a link, or it acts on the page and is announced as a button.',
      failWhen:
        'It acts as a button but is announced as a link, so its role is not relevant, which fails RGAA 7.1.3.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const JS_TYPES = new Set([
    'module',
    'application/ecmascript',
    'application/javascript',
    'application/x-ecmascript',
    'application/x-javascript',
    'text/ecmascript',
    'text/javascript',
    'text/javascript1.0',
    'text/javascript1.1',
    'text/javascript1.2',
    'text/javascript1.3',
    'text/javascript1.4',
    'text/javascript1.5',
    'text/jscript',
    'text/livescript',
    'text/x-ecmascript',
    'text/x-javascript'
  ]);

  // Event handler content attributes. An attribute also counts when the
  // element has the matching IDL property, which covers handlers this list
  // does not name.
  const HANDLER_NAMES =
    /^on(abort|afterprint|animation(start|end|iteration|cancel)|auxclick|before(input|print|toggle|unload|matched)|blur|cancel|can(play|playthrough)|change|click|close|contextmenu|contextlost|contextrestored|copy|cuechange|cut|dblclick|drag|dragend|dragenter|dragleave|dragover|dragstart|drop|durationchange|emptied|ended|error|focus|focusin|focusout|formdata|fullscreen(change|error)|gotpointercapture|hashchange|input|invalid|keydown|keypress|keyup|languagechange|load|loadeddata|loadedmetadata|loadstart|lostpointercapture|message|messageerror|mousedown|mouseenter|mouseleave|mousemove|mouseout|mouseover|mouseup|mousewheel|offline|online|page(hide|show|reveal|swap)|paste|pause|play|playing|pointer(cancel|down|enter|leave|move|out|over|rawupdate|up)|popstate|progress|ratechange|rejectionhandled|reset|resize|scroll|scrollend|securitypolicyviolation|seeked|seeking|select|selectionchange|selectstart|slotchange|stalled|storage|submit|suspend|timeupdate|toggle|touch(start|end|move|cancel)|transition(start|end|run|cancel)|unhandledrejection|unload|volumechange|waiting|webkit\w+|wheel)$/;

  // Handlers that make an element respond to a person, which is what a
  // candidate component needs; onload or onerror on an image does not.
  const INTERACTION_HANDLERS = [
    'onclick',
    'ondblclick',
    'onauxclick',
    'oncontextmenu',
    'onmousedown',
    'onmouseup',
    'onmouseover',
    'onmouseout',
    'onmouseenter',
    'onmouseleave',
    'onpointerdown',
    'onpointerup',
    'onpointerover',
    'onpointerout',
    'onpointerenter',
    'onpointerleave',
    'ontouchstart',
    'ontouchend',
    'onkeydown',
    'onkeyup',
    'onkeypress',
    'onfocus',
    'onblur',
    'onfocusin',
    'onfocusout',
    'onchange',
    'oninput',
    'onbeforeinput',
    'onwheel',
    'ondragstart',
    'ondrop'
  ];

  const WIDGET_ROLES = new Set([
    'button',
    'checkbox',
    'combobox',
    'grid',
    'gridcell',
    'link',
    'listbox',
    'menu',
    'menubar',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'progressbar',
    'radio',
    'radiogroup',
    'scrollbar',
    'searchbox',
    'slider',
    'spinbutton',
    'switch',
    'tab',
    'tablist',
    'tabpanel',
    'textbox',
    'tree',
    'treegrid',
    'treeitem',
    'dialog',
    'alertdialog'
  ]);

  const STATE_ATTRIBUTES = ['aria-expanded', 'aria-pressed', 'aria-haspopup', 'aria-controls'];
  const URL_ATTRIBUTES = new Set(['href', 'xlink:href', 'src', 'action', 'formaction']);

  function lower(v) {
    return String(v == null ? '' : v)
      .trim()
      .toLowerCase();
  }

  function localNameOf(el) {
    return lower(dom.localName(el) || dom.tagName(el) || '');
  }

  function attr(el, name) {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------
  // 1. Is there any script at all?
  // ---------------------------------------------------------------------

  function isEngineScript(el) {
    const src = attr(el, 'src');
    if (src != null && String(src).trim() !== '') {
      const path = String(src).trim().split(/[?#]/)[0];
      return /(^|\/)surea11y\.(browser|i18n\.[a-z0-9_-]+)\.js$/i.test(path);
    }
    let head;
    try {
      const first = dom.firstChild(el);
      head =
        first && dom.nodeType(first) === 3 && typeof first.data === 'string'
          ? first.data.slice(0, 600)
          : String(dom.textContent(el) || '').slice(0, 600);
    } catch {
      head = '';
    }
    return (
      /@surea11y\/core -- (standalone browser bundle|[a-z0-9_-]+ messages for the standalone browser bundle)/i.test(
        head
      ) || /^\s*\/\/ SELF-CONTAINED in-page runner/.test(head)
    );
  }

  function isExecutableScript(el) {
    const typeAttr = attr(el, 'type');
    let type;
    if (typeAttr == null) {
      const language = attr(el, 'language');
      if (language == null || String(language).trim() === '') return true;
      type = 'text/' + lower(language);
    } else {
      if (String(typeAttr).trim() === '') return true;
      type = lower(typeAttr);
    }
    const essence = type.split(';')[0].trim();
    return JS_TYPES.has(essence);
  }

  function isEventHandlerAttr(el, name) {
    if (name.length < 3 || name.indexOf('on') !== 0) return false;
    if (HANDLER_NAMES.test(name)) return true;
    try {
      return name in el && (el[name] === null || typeof el[name] === 'function');
    } catch {
      return false;
    }
  }

  function isJavascriptUrl(value) {
    // The URL parser drops leading C0 controls and spaces, and every tab and
    // newline, so " java\nscript:" runs too.
    const v = String(value || '').replace(/[\t\n\r]/g, '');
    let i = 0;
    while (i < v.length && v.charCodeAt(i) <= 0x20) i++;
    return /^javascript:/i.test(v.slice(i));
  }

  // Every element of the document and of each open shadow root inside it.
  function scriptEvidence() {
    const scopes = [document];
    for (let i = 0; i < scopes.length; i++) {
      let els;
      try {
        els = dom.querySelectorAll(scopes[i], '*');
      } catch {
        els = [];
      }
      for (const el of els) {
        if (!el || dom.nodeType(el) !== 1) continue;
        try {
          if (dom.shadowRoot(el)) scopes.push(dom.shadowRoot(el));
        } catch {}

        const name = localNameOf(el);
        if (name === 'script') {
          if (isExecutableScript(el) && !isEngineScript(el)) return 'scriptElement';
          continue;
        }
        if (name.indexOf('-') !== -1) return 'customElement';

        const attrs = dom.attributes(el) || [];
        for (let a = 0; a < attrs.length; a++) {
          const attrName = lower(attrs[a].name);
          if (isEventHandlerAttr(el, attrName)) return 'inlineHandler';
          if (URL_ATTRIBUTES.has(attrName) && isJavascriptUrl(attrs[a].value)) {
            return 'javascriptUrl';
          }
        }
      }
    }
    return '';
  }

  const evidence = scriptEvidence();
  if (!evidence) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // ---------------------------------------------------------------------
  // 2. The question for the whole page.
  // ---------------------------------------------------------------------

  const roots = Array.isArray(ctx.root) ? ctx.root : ctx.root ? [ctx.root] : [];
  const scanRoot = roots.find((r) => r && dom.nodeType(r) === 1) || dom.documentElement(document);

  const visibilityFilter = { targetSet: 'dom', accEligible: null, reasons: [] };

  const occurrences = [
    helpers.reportOccurrence(scanRoot, {
      summary:
        'Check every scripted component: the engine cannot see behaviour attached from script files, so this check is needed even when no candidate is listed.',
      hint: 'Check that each scripted component exposes its name, role, value, settings and state changes to assistive technologies (RGAA 7.1.1), is correctly rendered by them (7.1.2) and has a relevant name and role, with a name that contains its visible label (7.1.3), or that an accessible alternative exists. The candidates listed with this check come from the markup and are a starting point, not a complete list.',
      i18n: {
        summaryKey: 'scriptedComponentsReview_summary_cantTell_page',
        hintKey: 'scriptedComponentsReview_hint_cantTell_page',
        params: {}
      },
      data: {
        details: { reasonCode: 'pageReview', scriptEvidence: evidence },
        visibilityFilter
      }
    })
  ];

  // ---------------------------------------------------------------------
  // 3. Candidates found in the markup.
  // ---------------------------------------------------------------------

  function tokens(value) {
    return lower(value).split(/\s+/).filter(Boolean);
  }

  function inputType(el) {
    return lower(attr(el, 'type')) || 'text';
  }

  // Roles an element has natively, so restating one is not a sign of script.
  function nativeRoles(el) {
    const name = localNameOf(el);
    switch (name) {
      case 'a':
      case 'area':
        return attr(el, 'href') != null ? ['link'] : [];
      case 'button':
        return ['button'];
      case 'summary':
        return ['button'];
      case 'input': {
        const t = inputType(el);
        if (t === 'button' || t === 'submit' || t === 'reset' || t === 'image') return ['button'];
        if (t === 'checkbox') return ['checkbox'];
        if (t === 'radio') return ['radio'];
        if (t === 'range') return ['slider'];
        if (t === 'number') return ['spinbutton'];
        if (t === 'search') return ['searchbox', 'combobox'];
        if (t === 'hidden' || t === 'color' || t === 'file') return [];
        return ['textbox', 'combobox'];
      }
      case 'textarea':
        return ['textbox'];
      case 'select':
        return ['combobox', 'listbox'];
      case 'datalist':
        return ['listbox'];
      case 'option':
        return ['option'];
      case 'progress':
        return ['progressbar'];
      case 'dialog':
        return ['dialog', 'alertdialog'];
      case 'td':
      case 'th':
        return ['gridcell'];
      default:
        return [];
    }
  }

  function isNativelyFocusable(el) {
    const name = localNameOf(el);
    if (name === 'a' || name === 'area') return attr(el, 'href') != null;
    if (name === 'input') return inputType(el) !== 'hidden';
    if (
      name === 'button' ||
      name === 'select' ||
      name === 'textarea' ||
      name === 'iframe' ||
      name === 'object' ||
      name === 'embed' ||
      name === 'summary'
    ) {
      return true;
    }
    if ((name === 'audio' || name === 'video') && attr(el, 'controls') != null) return true;
    return isEditable(el);
  }

  function isNativeControl(el) {
    const name = localNameOf(el);
    if (name === 'a' || name === 'area') return attr(el, 'href') != null;
    if (name === 'input') return inputType(el) !== 'hidden';
    return (
      name === 'button' ||
      name === 'select' ||
      name === 'textarea' ||
      name === 'option' ||
      name === 'summary'
    );
  }

  function isEditable(el) {
    const v = attr(el, 'contenteditable');
    if (v == null) return false;
    const t = lower(v);
    return t === '' || t === 'true' || t === 'plaintext-only';
  }

  function isInHeadOrPageRoot(el) {
    const name = localNameOf(el);
    if (name === 'html' || name === 'body' || name === 'head') return true;
    try {
      return !!(dom.get(el, 'closest') && dom.closest(el, 'head'));
    } catch {
      return false;
    }
  }

  function widgetRoleOf(el) {
    const own = tokens(attr(el, 'role')).find((r) => WIDGET_ROLES.has(r));
    if (!own) return '';
    return nativeRoles(el).indexOf(own) === -1 ? own : '';
  }

  function tabindexOf(el) {
    const raw = attr(el, 'tabindex');
    if (raw == null || !/^\s*[+-]?\d+\s*$/.test(raw)) return null;
    return parseInt(raw, 10);
  }

  function linkWithoutDestination(element, href) {
    return {
      reasonCode: 'linkWithoutDestination',
      params: { element, href },
      summary: `This link's href is "${href}": it leads to no other page or place, so a script likely makes it act as a button.`
    };
  }

  function candidate(el) {
    const element = localNameOf(el);

    const role = widgetRoleOf(el);
    if (role) {
      return {
        reasonCode: 'widgetRole',
        params: { element, role },
        summary: `This <${element}> has role="${role}", a widget role it does not have natively.`
      };
    }

    const tabindex = tabindexOf(el);
    if (tabindex != null && tabindex >= 0 && !isNativelyFocusable(el)) {
      return {
        reasonCode: 'focusableNonNative',
        params: { element, tabindex: String(tabindex) },
        summary: `This <${element}> is made focusable with tabindex="${tabindex}" although it is not focusable natively.`
      };
    }

    if (!isNativeControl(el) && !isInHeadOrPageRoot(el)) {
      const handler = INTERACTION_HANDLERS.find((h) => attr(el, h) != null);
      if (handler) {
        return {
          reasonCode: 'inlineHandler',
          params: { element, attribute: handler },
          summary: `This <${element}> has an inline ${handler} event handler.`
        };
      }
    }

    // A link that leads nowhere is usually a button driven by a script,
    // whose role 7.1.3 asks to be relevant.
    if (element === 'a' && isJavascriptUrl(attr(el, 'href'))) {
      return linkWithoutDestination(element, 'javascript:');
    }
    if (element === 'a' && ['#', '#!'].includes(String(attr(el, 'href') || '').trim())) {
      return linkWithoutDestination(element, String(attr(el, 'href')).trim());
    }

    if (isEditable(el) && element !== 'input' && element !== 'textarea' && element !== 'select') {
      return {
        reasonCode: 'contentEditable',
        params: { element },
        summary: `This <${element}> can be edited (contenteditable).`
      };
    }

    const state = STATE_ATTRIBUTES.find((a) => attr(el, a) != null);
    if (state) {
      return {
        reasonCode: 'stateAttribute',
        params: { element, attribute: state },
        summary: `This <${element}> has ${state}, which a script usually updates.`
      };
    }

    return null;
  }

  const HINTS = {
    widgetRole:
      'Check with assistive technologies that this component exposes its name, role, value, settings and state changes, and that its name contains its visible label (RGAA 7.1).',
    focusableNonNative:
      'Check whether this element is a scripted component; if it is, check with assistive technologies that it exposes a relevant role, name, value and state (RGAA 7.1).',
    inlineHandler:
      'Check whether this element is a scripted component; if it is, check with assistive technologies that it exposes a relevant role, name, value and state (RGAA 7.1).',
    contentEditable:
      'Check with assistive technologies that this editing area exposes a relevant role, name and state, and that its changes are rendered (RGAA 7.1).',
    stateAttribute:
      'Check with assistive technologies that the state this attribute describes is updated and rendered when the component changes (RGAA 7.1).',
    linkWithoutDestination:
      'If the link acts as a button (it opens, closes or changes something on the page), use a <button> or give it role="button", so that its role is relevant (RGAA 7.1.3).'
  };

  const selector = [
    'a[href]',
    '[role]',
    '[tabindex]',
    '[contenteditable]',
    ...STATE_ATTRIBUTES.map((a) => `[${a}]`),
    ...INTERACTION_HANDLERS.map((h) => `[${h}]`)
  ].join(', ');

  const elements = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const seen = new Set();
  for (const el of elements) {
    if (!el || dom.nodeType(el) !== 1 || seen.has(el)) continue;
    seen.add(el);
    const c = candidate(el);
    if (!c) continue;
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: c.summary,
        hint: HINTS[c.reasonCode],
        i18n: {
          summaryKey: `scriptedComponentsReview_summary_cantTell_${c.reasonCode}`,
          hintKey: `scriptedComponentsReview_hint_cantTell_${c.reasonCode}`,
          params: c.params
        },
        data: {
          details: { reasonCode: c.reasonCode, ...c.params },
          visibilityFilter
        }
      })
    );
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
