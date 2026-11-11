/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-script-button-name-present
 * @atomic true
 * @summary Each button outside a form has a name
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to buttons (<button>, <input> of type submit, reset, button or
 *   image, and role="button") outside any form: no <form> or role="form"
 *   ancestor, and no form attribute naming one. Such a button does nothing
 *   unless a script drives it, so it is a component a script controls
 *   (glossary « Composant d'interface », RGAA 7.1). Buttons in a form are
 *   left to rgaa-form-button-name-present (11.9.1). A button hidden from
 *   assistive technologies, or whose explicit role is another one, is out of
 *   scope. A page with no such button is notApplicable.
 * @expectation
 *   RGAA 7.1.3: « Le composant possède un nom pertinent ». Unlike 7.1.1,
 *   the test offers no alternative. A button with no name at all (no
 *   aria-labelledby, aria-label, content, value, alt or title) has none to
 *   be relevant and fails (nameMissing). An <input type="image"> with no
 *   alt, aria-label, aria-labelledby or title, which the browser names with
 *   a generic "Submit", is asked about (imageButtonNoAlt). Whether a name
 *   is relevant is left to a person.
 * @implementation-notes
 * - Its runInPage is the one of rgaa-form-button-name-present, apart from
 *   the scope (outside a form, not inside) and the messages.
 * - Opt-in (tag `rgaa`): WCAG 4.1.2 requires a name on every button, which
 *   button-name-present checks; this rule reports the buttons 7.1.3 covers
 *   and 11.9.1 does not.
 */

const id = 'rgaa-script-button-name-present';

const meta = {
  title: 'Buttons outside a form have a name',
  description:
    'Checks that each button outside a form, a component only a script can drive, has a name that RGAA 7.1.3 can judge.',
  i18n: {
    titleKey: 'scriptButtonNamePresent_title',
    descriptionKey: 'scriptButtonNamePresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'buttons', 'name', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['nameMissing', 'imageButtonNoAlt'],
  review: {
    imageButtonNoAlt: {
      steps: [
        'Find the image button the report names: it has no alt, aria-label, aria-labelledby or title.',
        'Listen to it with a screen reader, or read its name in the browser’s accessibility tree: the browser gives it a generic name such as "Submit".',
        'Activate the button, and see what it does.',
        'Look at the image: note any text it shows.'
      ],
      passWhen:
        'The generic name says what the button does and contains any text the image shows, punctuation and capital letters aside.',
      failWhen:
        'The generic name does not say what the button does, or does not contain the text the image shows, which fails RGAA 7.1.3.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tagOf(el) {
    return String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  }

  function inAccTree(el) {
    const r = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible
        ? helpers.isAccTreeEligible(el, ctx)
        : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  function parentOf(node) {
    if (helpers.composedParent) return helpers.composedParent(node);
    return dom.parentNode(node) && dom.host(dom.parentNode(node))
      ? dom.host(dom.parentNode(node))
      : dom.parentNode(node);
  }

  // The nearest <form> or role="form" ancestor, across shadow roots.
  function formAncestor(el) {
    for (let p = parentOf(el); p && dom.nodeType(p) === 1; p = parentOf(p)) {
      if (tagOf(p) === 'form') return p;
      if (helpers.aria.getExplicitRole(p) === 'form') return p;
    }
    return null;
  }

  // A form the button joins through its form attribute.
  function formByAttribute(el) {
    const formId = dom.getAttribute(el, 'form');
    if (!formId) return null;
    const root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
    const target =
      root && dom.get(root, 'getElementById') ? dom.getElementById(root, formId) : null;
    return target && tagOf(target) === 'form' ? target : null;
  }

  function inputType(el) {
    return norm(dom.getAttribute(el, 'type')).toLowerCase();
  }

  function isButton(el) {
    const tag = tagOf(el);
    const role = helpers.aria.getExplicitRole(el);
    if (role === 'button') return true;
    if (role) return false;
    if (tag === 'button') return true;
    if (tag === 'input') return ['submit', 'reset', 'button', 'image'].includes(inputType(el));
    return false;
  }

  // The button's label, from the sources the glossary lists, or '' when it
  // has none. `defaulted` is set when only the browser supplies one.
  function labelOf(el) {
    const tag = tagOf(el);
    const info = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const programmatic = norm(info && info.present ? info.value : '');
    if (programmatic) return { label: programmatic, source: info.mechanism || 'programmatic' };

    if (tag === 'input') {
      const type = inputType(el);
      if (type === 'image') {
        const alt = norm(dom.getAttribute(el, 'alt'));
        if (alt) return { label: alt, source: 'alt' };
        return { label: '', source: '', defaulted: true };
      }
      const value = norm(dom.getAttribute(el, 'value'));
      if (value) return { label: value, source: 'value' };
      if (type === 'submit') return { label: 'Submit', source: 'default' };
      if (type === 'reset') return { label: 'Reset', source: 'default' };
      return { label: '', source: '' };
    }

    if (helpers.getContentNameInfo) {
      const content = helpers.getContentNameInfo(el, ctx);
      const text = norm(content && content.present ? content.value : '');
      if (text) return { label: text, source: 'content' };
    } else if (norm(dom.textContent(el))) {
      return { label: norm(dom.textContent(el)), source: 'content' };
    }
    return { label: '', source: '' };
  }

  // Why a button with no name has none, when its markup holds something a
  // reader could take for a name: a misspelled naming attribute, an
  // aria-labelledby that finds no text, a blank aria-label, text hidden from
  // screen readers, an image with no text alternative, or an empty icon
  // element. Returns { cause, params } or null; it changes no outcome.
  function nameCause(el) {
    const win = ctx.window || (ctx.document && dom.defaultView(ctx.document)) || null;
    const attrOf = (n, name) => {
      try {
        return dom.getAttribute(n, name);
      } catch {
        return null;
      }
    };
    const clip = (s, max) => {
      const t = norm(s);
      return t.length > max ? `${t.slice(0, max - 1)}…` : t;
    };
    const styleOf = (n) => {
      if (!win || typeof win.getComputedStyle !== 'function') return null;
      try {
        return win.getComputedStyle(n);
      } catch {
        return null;
      }
    };
    // Optimal string alignment distance: a transposition counts as one edit.
    const distance = (a, b) => {
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
    };
    const near = (a, b) =>
      a.replace(/[-_:]/g, '') === b.replace(/[-_:]/g, '') ||
      distance(a, b) <= (b.length > 5 ? 2 : 1);

    // An attribute that is not a known one, written close to a naming
    // attribute: arialabel, aria-lable, aria-labeledby, tittle.
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
      if (!name || KNOWN.has(name) || name.slice(0, 5) === 'data-') continue;
      const value = clip(attrs[i].value, 60);
      if (!value) continue;
      // An image button takes its name from alt, too (atl, al).
      const targets =
        tagOf(el) === 'input' && norm(attrOf(el, 'type')).toLowerCase() === 'image'
          ? ['alt', 'aria-labelledby', 'aria-label', 'title']
          : ['aria-labelledby', 'aria-label', 'title'];
      for (const target of targets) {
        if (near(name, target)) {
          return {
            cause: 'misspelledAttribute',
            params: { attribute: name, value, suggestion: target }
          };
        }
      }
    }

    const labelledby = norm(attrOf(el, 'aria-labelledby'));
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
        for (const n of root && dom.get(root, 'querySelectorAll')
          ? [...dom.querySelectorAll(root, '[id]')]
          : []) {
          const candidate = String(attrOf(n, 'id') || '');
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
      if (found.every((t) => !norm(dom.textContent(t)))) {
        return {
          cause: 'labelledbyEmpty',
          params: { id: String(attrOf(found[0], 'id') || ''), element: tagOf(found[0]) }
        };
      }
    }

    const ariaLabel = attrOf(el, 'aria-label');
    if (ariaLabel != null && !norm(ariaLabel)) return { cause: 'ariaLabelBlank', params: {} };

    if (tagOf(el) === 'input') {
      if (inputType(el) === 'button') return { cause: 'inputNoValue', params: {} };
      return null;
    }

    // The content: text the CSS or aria-hidden hides, an image with no
    // text alternative, or an empty element that only shows an icon.
    const seen = {};
    function walk(node, depth) {
      if (depth > 50) return;
      for (const child of [...(dom.childNodes(node) || [])]) {
        if (dom.nodeType(child) !== 1) continue;
        const tag = tagOf(child);
        if (tag === 'script' || tag === 'style' || tag === 'template') continue;
        const text = norm(dom.textContent(child));
        if (text) {
          const cs = styleOf(child);
          const hiddenAttribute = dom.hasAttribute(child, 'hidden');
          let property = '';
          if (hiddenAttribute || (cs && cs.display === 'none')) property = 'display: none';
          else if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
            property = 'visibility: hidden';
          }
          if (property) {
            if (!seen.hiddenText) {
              seen.hiddenText = { text: clip(text, 60), element: tag, property, hiddenAttribute };
            }
            continue;
          }
          if (norm(attrOf(child, 'aria-hidden')).toLowerCase() === 'true') {
            if (!seen.ariaHiddenText) seen.ariaHiddenText = { text: clip(text, 60), element: tag };
            continue;
          }
        }
        if (norm(attrOf(child, 'aria-hidden')).toLowerCase() === 'true') continue;
        if (tag === 'img') {
          if (!seen.imageNoAlt) seen.imageNoAlt = { emptyAlt: attrOf(child, 'alt') != null };
          continue;
        }
        if (tag === 'svg') {
          if (!seen.svgNoName) seen.svgNoName = {};
          continue;
        }
        const className = clip(attrOf(child, 'class'), 40);
        if (!text && className && !dom.firstElementChild(child) && !seen.emptyIcon) {
          seen.emptyIcon = { element: tag, className };
        }
        walk(child, depth + 1);
      }
    }
    walk(el, 0);
    for (const cause of ['hiddenText', 'ariaHiddenText', 'imageNoAlt', 'svgNoName', 'emptyIcon']) {
      if (seen[cause]) return { cause, params: seen[cause] };
    }
    return null;
  }

  // The hint for each cause, in English; i18n/*.json has buttonNameCause_hint_<cause>.
  function causeHint(c) {
    const p = c.params;
    switch (c.cause) {
      case 'misspelledAttribute':
        return `It has ${p.attribute}="${p.value}", but browsers do not read ${p.attribute}: did you mean ${p.suggestion}? Rename the attribute so that it names the button.`;
      case 'labelledbyMissing':
        return `Its aria-labelledby names "${p.ids}", but no element of the page has that id${p.suggestion ? ` (did you mean "${p.suggestion}"?)` : ''}, so it gives no name. Point aria-labelledby at the id of the element that holds the button's text, or name the button with aria-label.`;
      case 'labelledbyEmpty':
        return `Its aria-labelledby points to the <${p.element}> element with id "${p.id}" that holds no text, so it gives no name. Put the button's text in that element, or name the button with aria-label.`;
      case 'ariaLabelBlank':
        return 'Its aria-label is empty, so it gives no name. Write in aria-label what the button does, or give the button visible text.';
      case 'inputNoValue':
        return 'This <input type="button"> has no value, which is where its text goes. Give it a value that says what the button does.';
      case 'hiddenText':
        return `Its text "${p.text}" is in the <${p.element}> element with ${p.hiddenAttribute ? 'the hidden attribute' : p.property}, which hides it from screen readers as well as from view, so it gives no name. Let screen readers read it (a visually-hidden class keeps it off screen but read), or name the button with aria-label.`;
      case 'ariaHiddenText':
        return `Its text "${p.text}" is in the <${p.element}> element with aria-hidden="true", which hides it from screen readers, so it gives no name. Remove aria-hidden from that element, or name the button with aria-label.`;
      case 'imageNoAlt':
        return `Its content is an <img> with ${p.emptyAlt ? 'an empty alt, which marks it as decorative' : 'no alt'}, so it gives no name. Give the image an alt that says what the button does, or name the button with aria-label.`;
      case 'svgNoName':
        return 'Its content is an <svg> with no <title>, aria-label or aria-labelledby, so it gives no name. Name the button with aria-label, or give the <svg> role="img" and an aria-label that says what the button does.';
      case 'emptyIcon':
        return `Its content is an empty <${p.element} class="${p.className}">, probably an icon drawn by CSS, which gives no text, so the button has no name. Name the button with aria-label, or add text, visually hidden if need be, that says what it does.`;
      default:
        return '';
    }
  }

  const MESSAGES = {
    nameMissing: {
      outcome: 'fail',
      summary: 'This button has no name.',
      hint: 'Give the button visible text that describes its action, or an aria-label, aria-labelledby or title; for an image button, an alt (RGAA 7.1.3).'
    },
    imageButtonNoAlt: {
      outcome: 'cantTell',
      summary:
        'This image button has no alt, aria-label, aria-labelledby or title; the browser names it with a generic "Submit".',
      hint: 'Give the image button an alt that describes its action, then check that the name is relevant (RGAA 7.1.3).',
      needed: "Whether the browser's generic name describes what the image button does."
    }
  };

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  const SELECTOR =
    'button, input[type="submit" i], input[type="reset" i], input[type="button" i], input[type="image" i], [role~="button" i]';
  let nodes;
  try {
    nodes = helpers.queryAllSmart ? helpers.queryAllSmart(SELECTOR) : helpers.queryAll(SELECTOR);
  } catch {
    const plain =
      'button, input[type="submit"], input[type="reset"], input[type="button"], input[type="image"], [role~="button"]';
    nodes = helpers.queryAllSmart ? helpers.queryAllSmart(plain) : helpers.queryAll(plain);
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!isButton(el)) continue;
    // Buttons of a form are 11.9.1's.
    if (formAncestor(el) || formByAttribute(el)) continue;
    if (!inAccTree(el)) continue;
    applicableCount += 1;

    const { label, defaulted } = labelOf(el);
    if (label) continue;

    const reasonCode = defaulted ? 'imageButtonNoAlt' : 'nameMissing';
    const msg = MESSAGES[reasonCode];
    // A cause the markup shows replaces the generic hint.
    let cause = nameCause(el);
    // An image button with no alt keeps its own hint, unless it has a
    // misspelled alt or naming attribute.
    if (cause && reasonCode === 'imageButtonNoAlt' && cause.cause !== 'misspelledAttribute') {
      cause = null;
    }
    const occurrence = helpers.reportOccurrence(el, {
      summary: msg.summary,
      hint: cause ? causeHint(cause) : msg.hint,
      i18n: {
        summaryKey: `scriptButtonNamePresent_summary_${msg.outcome}_${reasonCode}`,
        hintKey: cause
          ? `buttonNameCause_hint_${cause.cause}`
          : `scriptButtonNamePresent_hint_${msg.outcome}_${reasonCode}`,
        params: cause ? cause.params : {}
      },
      ...(msg.outcome === 'cantTell'
        ? {
            uncertainty: {
              code: 'judgement-required',
              needed: msg.needed,
              evidence: { element: tagOf(el) }
            }
          }
        : {}),
      data: {
        details: {
          reasonCode,
          element: tagOf(el),
          ...(cause ? { nameCause: cause.cause } : {})
        },
        visibilityFilter: { targetSet: 'acc', accEligible: true, reasons: [] }
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
