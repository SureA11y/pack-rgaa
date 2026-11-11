/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-form-button-name-present
 * @atomic true
 * @summary Each button in a form has a label
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the buttons of RGAA's glossary entry "Bouton (formulaire)"
 *   (<button>, <input> of type submit, reset, button or image, and
 *   role="button") that sit inside a form: a <form> element or an element
 *   with role="form" (glossary "Formulaire"). RGAA 11.9.1 step 1 covers
 *   « les boutons présents au sein d'un formulaire », so a button outside
 *   any form is out of scope. A button hidden from assistive technologies,
 *   or whose explicit role is another one (role="tab", role="none"), is out
 *   of scope too. A page with no such button is notApplicable.
 * @expectation
 *   The button has a label: an aria-labelledby passage, an aria-label, the
 *   alt of an image button, the value of an <input> button, the content of
 *   a <button> or role="button" element (an image's alt, an <svg>'s
 *   <title> and the like count), or a title. A button with none of them
 *   has no label to be relevant, and fails 11.9.1 step 2. A button outside
 *   the form element that joins a form through its form attribute is a
 *   button of that form (glossary « Bouton (formulaire) »), and fails the
 *   same way with no label (formAttributeOnly). A submit or
 *   reset <input> with no value shows the browser's own label ("Submit",
 *   "Reset") and passes; whether the label is relevant is left to a
 *   person, as the rest of 11.9.1 is.
 * @implementation-notes
 * - Asks (cantTell) about an <input type="image"> with no alt,
 *   aria-label, aria-labelledby or title: the browser names it with a
 *   generic "Submit", which is not one of the label sources the glossary
 *   lists. The missing alt itself fails 1.1.3 through input-image-alt-present.
 * - rgaa-button-name-present runs this same code for the buttons outside
 *   any form (7.1.1), choosing which by ctx.rule.ruleId.
 * - Opt-in (tag `rgaa`): WCAG 4.1.2 requires a name on every button, which
 *   button-name-present checks; this rule reports only the buttons 11.9.1
 *   covers, so it runs only under the rgaa-4.1.2 profile, the `rgaa` tag or
 *   its own id.
 */

const id = 'rgaa-form-button-name-present';

const meta = {
  title: 'Buttons in a form have a label',
  description:
    'Checks that each button inside a form (a <form> or role="form") has a label that RGAA 11.9.1 can judge.',
  i18n: {
    titleKey: 'formButtonNamePresent_title',
    descriptionKey: 'formButtonNamePresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'buttons', 'name', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['nameMissing', 'imageButtonNoAlt', 'formAttributeOnly'],
  review: {
    imageButtonNoAlt: {
      steps: [
        'Find the image button (<input type="image">) the report names, in its form.',
        'Look at the image and decide what the button does.',
        'Listen to it with a screen reader, or read its accessible name in the browser\'s accessibility tree: the browser names it with a generic word such as "Submit".'
      ],
      passWhen: 'The generic name the browser gives says what the button does.',
      failWhen:
        'The generic name does not say what the button does, so the button has no relevant label, which fails RGAA 11.9.1.'
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
      for (const target of ['aria-labelledby', 'aria-label', 'title']) {
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
          if (d < best && d <= (ref.length > 5 ? 2 : 1)) {
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
        return `Its aria-labelledby points to a <${p.element}> with id "${p.id}" that holds no text, so it gives no name. Put the button's text in that element, or name the button with aria-label.`;
      case 'ariaLabelBlank':
        return 'Its aria-label is empty, so it gives no name. Write in aria-label what the button does, or give the button visible text.';
      case 'inputNoValue':
        return 'This <input type="button"> has no value, which is where its text goes. Give it a value that says what the button does.';
      case 'hiddenText':
        return `Its text "${p.text}" is in a <${p.element}> with ${p.hiddenAttribute ? 'the hidden attribute' : p.property}, which hides it from screen readers as well as from view, so it gives no name. Let screen readers read it (a visually-hidden class keeps it off screen but read), or name the button with aria-label.`;
      case 'ariaHiddenText':
        return `Its text "${p.text}" is in a <${p.element}> with aria-hidden="true", which hides it from screen readers, so it gives no name. Remove aria-hidden from that element, or name the button with aria-label.`;
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

  // The same code runs as rgaa-button-name-present, for the buttons outside
  // any form, which RGAA 7.1.1 covers as scripted interface components.
  const outsideForms = rule.ruleId === 'rgaa-button-name-present';
  const KEY = outsideForms ? 'buttonNamePresentRgaa' : 'formButtonNamePresent';

  const MESSAGES_OUTSIDE = {
    nameMissing: {
      outcome: 'fail',
      summary: 'This button has no accessible name.',
      hint: 'Give the button visible text that describes its action, or an aria-label, aria-labelledby or title; for an image button, an alt.'
    },
    imageButtonNoAlt: {
      outcome: 'cantTell',
      summary:
        'This image button has no alt, aria-label, aria-labelledby or title; the browser names it with a generic "Submit".',
      hint: 'Give the image button an alt that describes its action, then check that its name is relevant.',
      needed: "Whether the browser's generic name describes what the image button does."
    }
  };

  const MESSAGES_IN_FORMS = {
    nameMissing: {
      outcome: 'fail',
      summary: 'This button in a form has no label.',
      hint: 'Give the button visible text that describes its action, or an aria-label, aria-labelledby or title; for an image button, an alt.'
    },
    imageButtonNoAlt: {
      outcome: 'cantTell',
      summary:
        'This image button in a form has no alt, aria-label, aria-labelledby or title; the browser names it with a generic "Submit".',
      hint: 'Give the image button an alt that describes its action, then check that the label is relevant.',
      needed: "Whether the browser's generic name describes what the image button does."
    },
    formAttributeOnly: {
      outcome: 'fail',
      summary:
        'This button has no label and sits outside the form it submits, which it joins through its form attribute.',
      hint: 'Its form attribute makes it a button of that form: give it visible text that describes its action, or an aria-label, aria-labelledby or title.'
    }
  };
  const MESSAGES = outsideForms ? MESSAGES_OUTSIDE : MESSAGES_IN_FORMS;

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
    const inside = formAncestor(el);
    const joined = inside ? null : formByAttribute(el);
    if (outsideForms ? inside || joined : !inside && !joined) continue;
    if (!inAccTree(el)) continue;
    applicableCount += 1;

    const { label, defaulted } = labelOf(el);
    if (label) continue;

    const reasonCode = defaulted
      ? 'imageButtonNoAlt'
      : !outsideForms && !inside
        ? 'formAttributeOnly'
        : 'nameMissing';
    const msg = MESSAGES[reasonCode];
    // A cause the markup shows replaces the generic hint.
    const cause = reasonCode === 'imageButtonNoAlt' ? null : nameCause(el);
    const occurrence = helpers.reportOccurrence(el, {
      summary: msg.summary,
      hint: cause ? causeHint(cause) : msg.hint,
      i18n: {
        summaryKey: `${KEY}_summary_${msg.outcome}_${reasonCode}`,
        hintKey: cause
          ? `buttonNameCause_hint_${cause.cause}`
          : `${KEY}_hint_${msg.outcome}_${reasonCode}`,
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
