/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-field-label-listed-source
 * @atomic true
 * @summary Each form field has a label from a source RGAA 11.1.1 lists
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the form fields of RGAA's glossary entry "Champ de saisie de
 *   formulaire": <input> of any type except submit, reset, button, image and
 *   hidden; <select>; <textarea>; <output>; <progress>; <meter>; and
 *   elements with role progressbar, meter, slider, spinbutton, textbox,
 *   listbox, searchbox, combobox, checkbox, radio or switch. option,
 *   optgroup and datalist are left out: a literal reading would ask for a
 *   label on every option. An element with role="button", and a field
 *   hidden from assistive technologies (aria-hidden, hidden content) are
 *   out of scope. An <output> that belongs to no form (no <form> or
 *   role="form" ancestor, no form owner through its form attribute) is out
 *   of scope too: the glossary makes a field an « objet d'un formulaire »,
 *   and such an output's message is judged under 7.5. A page with no such
 *   field is notApplicable.
 * @expectation
 *   The field meets one of the conditions of RGAA 11.1.1: an aria-labelledby
 *   that points to a passage of text, an aria-label, a <label for> pointing
 *   at it, or a title. The fifth condition (an adjacent button) also needs
 *   one of these as the field's name. A field with none of them fails:
 *   a placeholder, the field's own content (a role="checkbox" named by its
 *   text) and an <output>'s value do not count. A field whose sources are
 *   all empty (an empty aria-label or title, a <label for> with no text, an
 *   aria-labelledby whose passage has no text) fails too (emptySource): the
 *   glossary entry « Étiquette de champ de formulaire » makes the label a
 *   « texte », and an empty source gives none, so the field has no label,
 *   the fifth condition included, which also needs a name.
 *   A field whose only label is a <label> wrapping it, without for, fails
 *   (wrappingLabel): 11.1.1 names « une balise <label> ayant un attribut
 *   for ». A <label for> pointing at an element a label cannot name (a
 *   role="textbox" <div>) fails too (labelForNotLabelable): the label is
 *   not associated with it and gives it no name.
 * @implementation-notes
 * - Asks (cantTell) instead of failing when:
 *   - the only label is a <label> wrapping the field, without for, and a
 *     button sits next to the field or its label
 *     (wrappingLabelAdjacentButton): 11.1.1's fifth condition, an adjacent
 *     button with a visually hidden <label>, does not name for;
 *   - a <label for> points at a custom element (a tag with a hyphen) that
 *     is not a native field (labelForCustomElement): a form-associated
 *     custom element is labelable, so the label may name it;
 * - An aria-labelledby that points to no element in the page counts as
 *   absent.
 * - A field whose id an earlier element also has fails with its own reason
 *   (duplicateId) when a <label for> names that id: the label goes to the
 *   first element.
 * - Opt-in (tag `rgaa`): WCAG accepts a wrapping label, a placeholder and a
 *   name from content, so the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-field-label-listed-source';

const meta = {
  title: 'Form fields have a label from a source RGAA lists',
  description:
    'Checks that each form field has an aria-labelledby, an aria-label, a <label for> or a title, the label sources RGAA 11.1.1 lists.',
  i18n: {
    titleKey: 'fieldLabelListedSource_title',
    descriptionKey: 'fieldLabelListedSource_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'labels', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: [
    'noLabel',
    'placeholderOnly',
    'contentOnly',
    'wrappingLabel',
    'wrappingLabelAdjacentButton',
    'labelForNotLabelable',
    'labelForCustomElement',
    'emptySource',
    'duplicateId'
  ],
  review: {
    wrappingLabelAdjacentButton: {
      steps: [
        'Find the form field the report names: a <label> without a for attribute wraps it, and a button sits next to it.',
        'Look at the button on screen: check whether its visible text says what to enter in the field.',
        'Check whether the text of the <label> is visually hidden, while the field and the button stay visible.'
      ],
      passWhen:
        'The adjacent button gives the field a visible label and the visually hidden <label> gives it its accessible name, which meets the fifth condition of RGAA 11.1.1.',
      failWhen:
        "The <label>'s text is visible, or the button does not label the field: the field's only label is a <label> without for, and RGAA 11.1.1 names « une balise <label> ayant un attribut for », so it fails RGAA 11.1.1."
    },
    labelForCustomElement: {
      steps: [
        'Find the form field the report names: a <label for> points at it, and it is a custom element (its tag has a hyphen).',
        "Read its accessible name in the browser's accessibility tree, or listen to it with a screen reader.",
        'Check that the field has no aria-labelledby, aria-label or title with text.'
      ],
      passWhen:
        'The custom element is form-associated, so the <label for> is associated with it and gives it its accessible name.',
      failWhen:
        'The <label for> gives the field no accessible name, since a <label> cannot name such an element, and the field has no other source RGAA 11.1.1 lists, so it fails RGAA 11.1.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const FIELD_ROLES = [
    'progressbar',
    'meter',
    'slider',
    'spinbutton',
    'textbox',
    'listbox',
    'searchbox',
    'combobox',
    'checkbox',
    'radio',
    'switch'
  ];
  const NOT_FIELD_INPUT_TYPES = ['submit', 'reset', 'button', 'image', 'hidden'];
  const NATIVE_FIELDS = ['select', 'textarea', 'output', 'progress', 'meter'];
  const LABELABLE = ['input', 'select', 'textarea', 'button', 'meter', 'output', 'progress'];

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tagOf(el) {
    return String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  }

  // The role the attribute resolves to: its first known token, in any case.
  function firstRoleToken(el) {
    return helpers.aria.getExplicitRole(el);
  }

  // The field kind, or '' when the element is not an RGAA form field.
  function fieldKind(el) {
    const tag = tagOf(el);
    const role = firstRoleToken(el);
    if (role === 'button') return '';
    if (tag === 'input') {
      const type = norm(dom.getAttribute(el, 'type')).toLowerCase();
      if (NOT_FIELD_INPUT_TYPES.includes(type)) return '';
      return 'input';
    }
    if (NATIVE_FIELDS.includes(tag)) return tag;
    if (FIELD_ROLES.includes(role)) return role;
    return '';
  }

  function isLabelable(el) {
    const tag = tagOf(el);
    if (!LABELABLE.includes(tag)) return false;
    if (tag === 'input') {
      return norm(dom.getAttribute(el, 'type')).toLowerCase() !== 'hidden';
    }
    return true;
  }

  function inAccTree(el) {
    const r = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible
        ? helpers.isAccTreeEligible(el, ctx)
        : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  // The field's <label> elements, as core's rules find them
  // (helpers.getAssociatedLabelElements: a for that names it, or a wrapping
  // label it is the first labelable element of), for a field a label can
  // name.
  function associatedLabels(el) {
    if (!isLabelable(el) || typeof helpers.getAssociatedLabelElements !== 'function') return null;
    try {
      return [...(helpers.getAssociatedLabelElements(el) || [])];
    } catch {
      return null;
    }
  }

  // <label> elements in the field's own tree whose for equals its id. A
  // field a label cannot name is still looked up, so that case is reported
  // apart.
  function labelsFor(el) {
    const shared = associatedLabels(el);
    if (shared) return shared.filter((label) => dom.hasAttribute(label, 'for'));
    const idValue = dom.getAttribute(el, 'id');
    if (!idValue) return [];
    const root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
    if (!root || !dom.get(root, 'querySelectorAll')) return [];
    const target = dom.get(root, 'getElementById')
      ? dom.getElementById(root, idValue)
      : dom.querySelector(root, '[id="' + idValue.replace(/["\\]/g, '\\$&') + '"]');
    if (target !== el) return [];
    const out = [];
    for (const label of dom.querySelectorAll(root, 'label[for]')) {
      if (dom.getAttribute(label, 'for') === idValue) out.push(label);
    }
    return out;
  }

  // A <label> ancestor without for that labels this field (the first
  // labelable element inside it).
  function wrappingLabel(el) {
    if (!isLabelable(el)) return null;
    const shared = associatedLabels(el);
    if (shared) return shared.find((label) => !dom.hasAttribute(label, 'for')) || null;
    const wrap = dom.get(el, 'closest') ? dom.closest(el, 'label') : null;
    if (!wrap || dom.hasAttribute(wrap, 'for')) return null;
    for (const candidate of dom.querySelectorAll(wrap, LABELABLE.join(', '))) {
      if (isLabelable(candidate)) return candidate === el ? wrap : null;
    }
    return null;
  }

  function labelHasText(label) {
    if (helpers.labelContributesAccessibleName) {
      return !!helpers.labelContributesAccessibleName(label);
    }
    return !!norm(dom.textContent(label));
  }

  // Which 11.1.1 sources the field has: 'met', 'empty' (present, no text)
  // or absent, per source.
  function sources(el) {
    const found = { met: [], empty: [] };

    const labelledby = norm(dom.getAttribute(el, 'aria-labelledby'));
    if (labelledby) {
      const info = helpers.getAriaLabelledByInfo
        ? helpers.getAriaLabelledByInfo(el, ctx)
        : { present: false, value: '', refsCount: 0 };
      if (info && info.present && norm(info.value)) found.met.push('aria-labelledby');
      else if (info && info.refsCount > 0) found.empty.push('aria-labelledby');
    }

    if (dom.hasAttribute(el, 'aria-label')) {
      if (norm(dom.getAttribute(el, 'aria-label'))) found.met.push('aria-label');
      else found.empty.push('aria-label');
    }

    // A <label for> on an element a label cannot name is reported apart.
    const forLabels = labelsFor(el);
    if (forLabels.length && isLabelable(el)) {
      if (forLabels.some(labelHasText)) found.met.push('label-for');
      else found.empty.push('label-for');
    }

    if (dom.hasAttribute(el, 'title')) {
      if (norm(dom.getAttribute(el, 'title'))) found.met.push('title');
      else found.empty.push('title');
    }

    return { found, forLabels };
  }

  // Only checkbox, radio and switch take a name from their content; the
  // text of a textbox or an <output> is its value.
  function hasOwnContent(el, kind) {
    if (kind !== 'checkbox' && kind !== 'radio' && kind !== 'switch') return false;
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(el, ctx);
      return !!(info && info.present && norm(info.value));
    }
    return !!norm(dom.textContent(el));
  }

  const MESSAGES = {
    noLabel: {
      outcome: 'fail',
      summary: 'This form field has no aria-labelledby, aria-label, <label for> or title.',
      hint: 'Give the field a <label for> that matches its id, or an aria-labelledby, aria-label or title attribute.'
    },
    placeholderOnly: {
      outcome: 'fail',
      summary:
        'This form field is labelled only by its placeholder, which RGAA does not accept as a label.',
      hint: 'Give the field a <label for> that matches its id, or an aria-labelledby, aria-label or title attribute. A placeholder disappears as soon as the user types.'
    },
    contentOnly: {
      outcome: 'fail',
      summary:
        'This form field is named only by its own content, which RGAA does not accept as a label.',
      hint: 'Give the field an aria-labelledby that points to the visible text, or an aria-label or title attribute.'
    },
    wrappingLabel: {
      outcome: 'fail',
      summary:
        'This form field is labelled only by a <label> that wraps it, without a for attribute, which RGAA 11.1.1 does not list.',
      hint: 'RGAA 11.1.1 names a <label> with a for attribute: add for and a matching id, or give the field another source 11.1.1 lists.'
    },
    wrappingLabelAdjacentButton: {
      outcome: 'cantTell',
      summary:
        'This form field is labelled only by a <label> that wraps it, without a for attribute, and a button sits next to it.',
      hint: 'RGAA 11.1.1 names a <label> with a for attribute: add for and a matching id. If the button labels the field, its <label> must be visually hidden (fifth condition of 11.1.1).',
      needed:
        'Whether the adjacent button labels the field visibly and its <label> is visually hidden (fifth condition of RGAA 11.1.1).'
    },
    labelForNotLabelable: {
      outcome: 'fail',
      summary:
        'A <label for> points at this field, but this element cannot be labelled by a <label>, so it has no label.',
      hint: 'The label gives the field no accessible name. Use aria-labelledby pointing to the label text, or a native form field.'
    },
    labelForCustomElement: {
      outcome: 'cantTell',
      summary:
        'A <label for> points at this custom element, which a <label> names only if it is form-associated.',
      hint: 'Check that the <label> gives the field its accessible name; otherwise use aria-labelledby pointing to the label text.',
      needed:
        'Whether the custom element is form-associated, so that the <label for> gives it its name.'
    },
    duplicateId: {
      outcome: 'fail',
      summary:
        "A <label for> names this field's id, but an element earlier in the page has the same id, so the label goes to that element.",
      hint: 'Give this field an id of its own, and point the <label for> at it.'
    },
    emptySource: {
      outcome: 'fail',
      summary:
        'This form field has a {{source}} label source, but it is empty, so it has no label.',
      hint: 'Put the text that says what to enter in that source, or give the field a <label for>.'
    }
  };

  // A <label for> naming this field's id goes to an earlier element with the
  // same id.
  function labelGoesElsewhere(el) {
    const idValue = dom.getAttribute(el, 'id');
    if (!idValue) return false;
    const root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
    if (!root || !dom.get(root, 'getElementById') || !dom.get(root, 'querySelectorAll')) {
      return false;
    }
    const first = dom.getElementById(root, idValue);
    if (!first || first === el) return false;
    return [...dom.querySelectorAll(root, 'label[for]')].some(
      (label) => dom.getAttribute(label, 'for') === idValue
    );
  }

  function parentOf(node) {
    if (helpers.composedParent) return helpers.composedParent(node);
    const p = dom.parentNode(node);
    return p && dom.host(p) ? dom.host(p) : p;
  }

  // An element that belongs to a form: a <form> or role="form" ancestor,
  // across shadow roots, or a form owner through its form attribute.
  function belongsToForm(el) {
    if (dom.get(el, 'form')) return true;
    for (let p = parentOf(el); p && dom.nodeType(p) === 1; p = parentOf(p)) {
      if (tagOf(p) === 'form' || firstRoleToken(p) === 'form') return true;
    }
    return false;
  }

  function isButtonEl(el) {
    if (!el || dom.nodeType(el) !== 1) return false;
    const role = firstRoleToken(el);
    if (role === 'button') return true;
    if (role) return false;
    const tag = tagOf(el);
    if (tag === 'button') return true;
    return (
      tag === 'input' &&
      ['submit', 'button', 'image', 'reset'].includes(
        norm(dom.getAttribute(el, 'type')).toLowerCase()
      )
    );
  }

  const BUTTONS =
    'button, input[type="submit" i], input[type="button" i], input[type="image" i], [role~="button" i]';
  const FIELDS =
    'input:not([type="hidden" i]):not([type="submit" i]):not([type="button" i]):not([type="image" i]):not([type="reset" i]), select, textarea';

  // A button next to the field or its wrapping label: a sibling that is a
  // button, or holds one and no field, at the label's level or that of an
  // ancestor holding no other field (11.1.1, fifth condition).
  function adjacentButton(el, label) {
    const holdsButton = (n) =>
      isButtonEl(n) ||
      (dom.querySelectorAll(n, BUTTONS).length > 0 && !dom.querySelectorAll(n, FIELDS).length);
    const near = (n) =>
      [dom.previousElementSibling(n), dom.nextElementSibling(n)].some((s) => s && holdsButton(s));
    if (near(el)) return true;
    let box = label;
    for (let i = 0; box && i < 4; i += 1) {
      if (near(box)) return true;
      const up = dom.parentElement(box);
      if (!up || tagOf(up) === 'form' || tagOf(up) === 'body') break;
      if ([...dom.querySelectorAll(up, FIELDS)].some((f) => f !== el)) break;
      box = up;
    }
    return false;
  }

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  const SELECTOR =
    'input, select, textarea, output, progress, meter, ' +
    FIELD_ROLES.map((r) => `[role~="${r}" i]`).join(', ');
  // In document order: jsdom returns an element's querySelectorAll in
  // selector-list order when the list has a case-insensitive attribute
  // selector. Each element is sorted by its path of child indexes from its
  // root, each parent's children being counted once, since comparing
  // document positions costs as much as the siblings between two elements
  // and grew with the square of the fields of one form. Elements of different
  // trees (a shadow root) keep the order in which their trees first come.
  const childIndex = new Map();
  function indexOf(node, parent) {
    if (!childIndex.has(node)) {
      let i = 0;
      for (let c = dom.firstChild(parent); c; c = dom.nextSibling(c)) childIndex.set(c, i++);
    }
    return childIndex.has(node) ? childIndex.get(node) : 0;
  }
  function pathOf(el) {
    const path = [];
    for (let n = el, parent = dom.parentNode(n); parent; n = parent, parent = dom.parentNode(n)) {
      path.push(indexOf(n, parent));
    }
    return path.reverse();
  }
  function rootOf(el) {
    try {
      return dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
    } catch {
      return null;
    }
  }
  const queried = [
    ...((helpers.queryAllSmart ? helpers.queryAllSmart(SELECTOR) : helpers.queryAll(SELECTOR)) ||
      [])
  ];
  const rootRank = new Map();
  const keyed = queried.map((el) => {
    const root = rootOf(el);
    if (!rootRank.has(root)) rootRank.set(root, rootRank.size);
    return { el, rank: rootRank.get(root), path: pathOf(el) };
  });
  keyed.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const n = Math.min(a.path.length, b.path.length);
    for (let i = 0; i < n; i++) if (a.path[i] !== b.path[i]) return a.path[i] - b.path[i];
    return a.path.length - b.path.length;
  });
  const nodes = keyed.map((k) => k.el);

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const kind = fieldKind(el);
    if (!kind) continue;
    if (kind === 'output' && !belongsToForm(el)) continue;
    if (!inAccTree(el)) continue;
    applicableCount += 1;

    const { found, forLabels } = sources(el);
    if (found.met.length) continue;

    let reasonCode;
    let source = '';
    let wrap = null;
    if (forLabels.length && !isLabelable(el)) {
      reasonCode = tagOf(el).includes('-') ? 'labelForCustomElement' : 'labelForNotLabelable';
    } else if (labelGoesElsewhere(el)) {
      reasonCode = 'duplicateId';
    } else if (found.empty.length) {
      reasonCode = 'emptySource';
      source = found.empty[0];
    } else if ((wrap = wrappingLabel(el))) {
      reasonCode = adjacentButton(el, wrap) ? 'wrappingLabelAdjacentButton' : 'wrappingLabel';
    } else if (norm(dom.getAttribute(el, 'placeholder'))) {
      reasonCode = 'placeholderOnly';
    } else if (hasOwnContent(el, kind)) {
      reasonCode = 'contentOnly';
    } else {
      reasonCode = 'noLabel';
    }

    const msg = MESSAGES[reasonCode];
    const summary = msg.summary.replace('{{source}}', source);
    const occurrence = helpers.reportOccurrence(el, {
      summary,
      hint: msg.hint,
      i18n: {
        summaryKey: `fieldLabelListedSource_summary_${msg.outcome}_${reasonCode}`,
        hintKey: `fieldLabelListedSource_hint_${msg.outcome}_${reasonCode}`,
        params: source ? { source } : {}
      },
      ...(msg.outcome === 'cantTell'
        ? {
            uncertainty: {
              code: 'judgement-required',
              needed: msg.needed,
              evidence: { field: kind, ...(source ? { source } : {}) }
            }
          }
        : {}),
      data: {
        details: { reasonCode, field: kind, ...(source ? { source } : {}) },
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
