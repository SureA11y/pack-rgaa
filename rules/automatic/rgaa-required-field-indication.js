/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-required-field-indication
 * @atomic true
 * @summary A required field shows that it is required, in its label or a linked passage of text
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the fields of each form (a <form> or role="form", glossary
 *   « Formulaire ») that has at least two fields and does not mark its
 *   optional fields as such in their labels or legends (« facultatif »,
 *   « optionnel »): the 11.10 particular case makes 11.10.1 and 11.10.2 not
 *   applicable then. Radio buttons of one name count as one field. Fields
 *   hidden from view are left out. A page with none is notApplicable.
 * @expectation
 *   - 11.10.2: a field with `required` or aria-required="true" shows a
 *     required indication (glossary « Indication de champ obligatoire »:
 *     text such as « obligatoire », or a sign such as « * ») visibly in its
 *     label or in a passage of text linked by aria-labelledby or
 *     aria-describedby. With a visible label, no indication in it or in
 *     those passages, none next to the field, no image, icon or generated
 *     content that could be one, and no sentence such as « tous les champs
 *     sont obligatoires », it fails (requiredNotIndicated). An indication
 *     found only next to the field, in a placeholder or a legend, an image
 *     or an icon, a global sentence, or a label hidden from view, is asked
 *     about (cantTell).
 *   - Glossary note: a sign such as « * » must be explained « visuellement
 *     et dans l'ordre du code source, avant la première utilisation ». When
 *     the page explains it only after the first field that uses it, that
 *     field fails (markerExplainedAfter). When the page never explains it,
 *     a field with `required` or aria-required="true" fails
 *     (markerNotExplained) and any other is asked about, since the sign may
 *     not mean "required" there.
 * @implementation-notes
 * - Indication words are read in French, English, Spanish, German and
 *   Japanese.
 * - Generated content (::before, ::after) and background images are read
 *   only where the page has a layout; elsewhere, a page with style sheets
 *   is asked about instead of failed, since CSS may add the indication.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-required-field-indication';

const meta = {
  title: 'Required fields show a required indication in their label',
  description:
    'Checks each required field of a form with two or more fields: fails one whose visible label and linked passages show no required indication, or whose « * » is explained only after its first use or never; asks where an icon, a legend or styles may carry it.',
  i18n: {
    titleKey: 'requiredFieldIndication_title',
    descriptionKey: 'requiredFieldIndication_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: [
    'requiredNotIndicated',
    'markerExplainedAfter',
    'markerNotExplained',
    'indicationInLegend',
    'indicationOutsideLabel',
    'noVisibleLabel',
    'indicationMayBeImage',
    'allFieldsRequiredSentence',
    'stylesNotRead',
    'signMayMeanOther'
  ],
  review: {
    indicationInLegend: {
      steps: [
        'Find the field the report names, and read its label on screen: it does not say the field is required.',
        'Read the legend of its group, which holds a required indication.',
        'Decide whether the legend makes it clear that this field is required, and whether the audit accepts a legend as the text linked to the field.'
      ],
      passWhen:
        'The legend leaves no doubt that this field is required, and the audit accepts it; an indication in the label settles it.',
      failWhen:
        "The indication does not identify this field, or the audit holds to the field's label and linked passages, which fails RGAA 11.10.2."
    },
    indicationOutsideLabel: {
      steps: [
        'Find the field the report names, and read its label on screen: it does not say the field is required.',
        'Find the indication next to the field or in its placeholder.',
        'Inspect the field: check whether that text is linked to it by aria-labelledby or aria-describedby, and whether it stays visible once you type.'
      ],
      passWhen:
        'The indication is visible before the form is sent, and sits in a passage linked to the field.',
      failWhen:
        'The indication is only next to the field, or only in a placeholder, which fails RGAA 11.10.2.'
    },
    noVisibleLabel: {
      steps: [
        'Find the field the report names: it has required or aria-required="true", but no visible label was found.',
        'Look at the field on screen, and at the text around it.',
        'Inspect the field: check whether a visible text that says it is required is its label, or is linked to it by aria-labelledby or aria-describedby.'
      ],
      passWhen:
        'A visible text says the field is required, and is its label or a passage linked to it.',
      failWhen:
        'No visible label or linked passage says the field is required, which fails RGAA 11.10.2.'
    },
    indicationMayBeImage: {
      steps: [
        'Find the field the report names, and look at its label on screen.',
        'Look for an image, an icon or a sign in the label or right next to it, and for text around the field that may say it is required.',
        'Check that what you found says the field is required, and that it sits in the label or in a passage linked to the field.'
      ],
      passWhen:
        'An image, icon or text in the label or a linked passage visibly shows the field is required.',
      failWhen:
        'Nothing in the label or a linked passage shows the field is required, which fails RGAA 11.10.2.'
    },
    allFieldsRequiredSentence: {
      steps: [
        'Find the field the report names, and read its label on screen: it does not say the field is required.',
        'Find the sentence that says all the fields of the form are required, and check that it comes before the fields.',
        "Inspect the field: check whether the sentence is linked to it by aria-describedby or aria-labelledby, and whether the audit accepts it as the field's indication."
      ],
      passWhen:
        'The sentence is linked to the field, or the audit accepts it; an indication in the label settles it.',
      failWhen:
        "The field's label and linked passages show no indication, and the audit does not accept the sentence, which fails RGAA 11.10.2."
    },
    stylesNotRead: {
      steps: [
        'Open the page in a browser, and find the field the report names.',
        'Look at its label on screen: the style sheets may add a sign, such as an asterisk, that the code does not show.',
        'If a sign appears, check that the page explains it before this field.'
      ],
      passWhen: 'The label visibly shows the field is required.',
      failWhen: 'The label and its linked passages show no indication, which fails RGAA 11.10.2.'
    },
    signMayMeanOther: {
      steps: [
        'Find the field the report names, and the sign in its label, such as an asterisk.',
        'Read the page before this field: nothing there explains the sign.',
        'Send the form with the field empty, and check whether the field is required.'
      ],
      passWhen: 'The sign means something else, or the field is not required.',
      failWhen:
        'The sign marks a required field, and the page does not explain it before its first use, which fails RGAA 11.10.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const norm = (v) =>
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
  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };

  const WORD =
    /(?:^|[^\p{L}])(obligatoires?|requise?s?|required|mandatory|obligatori[oa]s?|erforderlich|pflichtfeld(?:er)?|pflicht)(?![\p{L}])|必須/iu;
  const SIGN = /[*＊✱]/;
  const SIGN_NAME = /ast[ée]risque|asterisk|asterisco|sternchen/i;
  const OPTIONAL =
    /(?:^|[^\p{L}])(facultati(?:f|ve)s?|optionnel(?:le)?s?|optional|opcional|freiwillig)(?![\p{L}])|任意/iu;
  const ALL_REQUIRED =
    /tous les champs[^.]{0,40}(obligatoires|requis)|all (?:the )?fields[^.]{0,30}(required|mandatory)|todos los campos[^.]{0,30}obligatorios|alle felder[^.]{0,30}(pflicht|erforderlich)/i;

  const FIELD =
    'input:not([type="hidden" i]):not([type="submit" i]):not([type="reset" i]):not([type="button" i]):not([type="image" i]), select, textarea, [role~="textbox" i], [role~="combobox" i], [role~="listbox" i], [role~="checkbox" i], [role~="radio" i], [role~="radiogroup" i], [role~="switch" i], [role~="spinbutton" i], [role~="slider" i], [role~="searchbox" i]';

  const FIELD_ROLES = new Set([
    'textbox',
    'combobox',
    'listbox',
    'checkbox',
    'radio',
    'radiogroup',
    'switch',
    'spinbutton',
    'slider',
    'searchbox'
  ]);
  const NATIVE = new Set(['input', 'select', 'textarea']);
  const fieldsIn = (root) =>
    Array.from(dom.querySelectorAll(root, FIELD)).filter(
      (el) => NATIVE.has(tagOf(el)) || FIELD_ROLES.has(roleOf(el))
    );

  function view() {
    try {
      return dom.defaultView(document) || null;
    } catch {
      return null;
    }
  }
  function styleOf(el, pseudo) {
    const v = view();
    try {
      return v && typeof v.getComputedStyle === 'function'
        ? pseudo
          ? v.getComputedStyle(el, pseudo)
          : v.getComputedStyle(el)
        : null;
    } catch {
      return null;
    }
  }
  function layout() {
    const html = dom.documentElement(document);
    try {
      return !!(html && (dom.getClientRects(html) || []).length);
    } catch {
      return false;
    }
  }
  const hasLayout = layout();

  // Without a layout, CSS cannot be read: a page with style sheets may add
  // the indication with ::after or a background image.
  const stylesUnread =
    !hasLayout &&
    (dom.querySelectorAll(document, 'link[rel~="stylesheet" i]').length > 0 ||
      Array.from(dom.querySelectorAll(document, 'style')).some((s) =>
        /content\s*:|background(-image)?\s*:[^;]*url\(/i.test(dom.textContent(s))
      ));

  function visible(el) {
    if (!el) return false;
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
      if (helpers.getEligibilityInfo) {
        return !!helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }

  // Screen-reader-only text is not visible; aria-hidden text, such as a
  // decorative « * », is.
  const hiddenCache = new Map();
  function offScreen(el, stop) {
    if (typeof helpers.isVisuallyHidden !== 'function') return false;
    for (let a = el; a && a !== stop && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (!hiddenCache.has(a)) {
        let h = false;
        try {
          h = !!helpers.isVisuallyHidden(a);
        } catch {}
        hiddenCache.set(a, h);
      }
      if (hiddenCache.get(a)) return true;
    }
    return false;
  }

  const CONTROL_TAGS = new Set(['input', 'select', 'textarea', 'button', 'option', 'optgroup']);
  const SKIP_TAGS = new Set(['script', 'style', 'template', 'noscript']);

  // The visible text under `root` (not that of controls inside it), the
  // images and icons there, and the generated content that is not text.
  function look(root) {
    const out = { text: '', firstSign: null, icon: false, generated: false };
    if (!root || !visible(root) || offScreen(root, null)) return out;
    const parts = [];
    const visit = (el) => {
      const tag = tagOf(el);
      if (SKIP_TAGS.has(tag) || (el !== root && CONTROL_TAGS.has(tag))) return;
      if (el !== root && (!visible(el) || offScreen(el, root))) return;
      if (tag === 'img' || tag === 'svg' || tag === 'i' || roleOf(el) === 'img') {
        const alt = norm(attr(el, 'alt') || attr(el, 'aria-label') || attr(el, 'title'));
        if (alt) parts.push(alt);
        if (!alt || !(WORD.test(alt) || SIGN.test(alt))) out.icon = true;
        if (tag === 'svg' || tag === 'img') return;
      }
      if (hasLayout) {
        for (const pseudo of ['::before', '::after']) {
          const cs = styleOf(el, pseudo);
          const c = cs ? String(cs.content || '').trim() : '';
          if (!c || c === 'none' || c === 'normal' || c === '""' || c === "''") continue;
          const t = c.replace(/^["']|["']$/g, '');
          if (WORD.test(t) || SIGN.test(t)) parts.push(t);
          else out.generated = true;
        }
        const cs = styleOf(el);
        if (cs && cs.backgroundImage && cs.backgroundImage !== 'none') out.icon = true;
      }
      for (const n of Array.from(dom.childNodes(el) || [])) {
        const type = dom.nodeType(n);
        if (type === 3) {
          const t = norm(dom.nodeValue(n));
          if (!t) continue;
          parts.push(t);
          if (!out.firstSign && SIGN.test(t)) out.firstSign = n;
        } else if (type === 1) visit(n);
      }
    };
    visit(root);
    out.text = norm(parts.join(' '));
    return out;
  }

  function merge(looks) {
    return {
      text: norm(looks.map((l) => l.text).join(' ')),
      firstSign: looks.map((l) => l.firstSign).find(Boolean) || null,
      icon: looks.some((l) => l.icon),
      generated: looks.some((l) => l.generated)
    };
  }

  function refs(el, name) {
    const v = attr(el, name);
    if (!v || !norm(v) || !helpers.resolveIdRefs) return [];
    try {
      const r = helpers.resolveIdRefs(v, ctx, { maxRefs: 8 }, el);
      return r && Array.isArray(r.refs) ? r.refs : [];
    } catch {
      return [];
    }
  }
  function labelsOf(el) {
    if (!helpers.getAssociatedLabelElements) return [];
    try {
      return helpers.getAssociatedLabelElements(el) || [];
    } catch {
      return [];
    }
  }

  function isRequired(el) {
    if (norm(attr(el, 'aria-required')).toLowerCase() === 'true') return true;
    const tag = tagOf(el);
    return ['input', 'select', 'textarea'].includes(tag) && dom.hasAttribute(el, 'required');
  }
  const isChoice = (el) => {
    const type = norm(attr(el, 'type')).toLowerCase();
    const role = roleOf(el);
    return (
      (tagOf(el) === 'input' && (type === 'radio' || type === 'checkbox')) ||
      ['radio', 'radiogroup', 'checkbox', 'switch'].includes(role)
    );
  };

  function closestUp(el, test) {
    for (let a = dom.parentElement(el); a; a = dom.parentElement(a)) if (test(a)) return a;
    return null;
  }
  const isForm = (el) => tagOf(el) === 'form' || roleOf(el) === 'form';

  // One field per radio group.
  function fieldKey(el, form) {
    const type = norm(attr(el, 'type')).toLowerCase();
    if (tagOf(el) === 'input' && type === 'radio' && norm(attr(el, 'name'))) {
      return 'radio:' + norm(attr(el, 'name'));
    }
    if (roleOf(el) === 'radio') {
      const group = closestUp(el, (a) => roleOf(a) === 'radiogroup' || a === form);
      if (group && group !== form) return group;
    }
    return el;
  }

  function precedes(a, b) {
    try {
      return !!(dom.compareDocumentPosition(a, b) & 4);
    } catch {
      return false;
    }
  }

  const NEEDED = 'Whether the field shows a required indication, in its label or a linked passage.';

  const SUMMARY = {
    requiredNotIndicated: (p) =>
      `This field is required, but its visible label ("${p.label}") and linked passages show no required indication.`,
    markerExplainedAfter: (p) =>
      `This field's label ("${p.label}") uses a sign as its required indication, but the page explains the sign only after its first use.`,
    markerNotExplained: (p) =>
      `This field's label ("${p.label}") uses a sign as its required indication, and the page does not explain it.`,
    signMayMeanOther: (p) =>
      `This field's label ("${p.label}") uses a sign the page does not explain before its first use; check whether it means the field is required.`,
    indicationInLegend: (p) =>
      `This required field ("${p.label}") shows no indication in its label; one is in the legend of its group.`,
    indicationOutsideLabel: (p) =>
      `This required field ("${p.label}") shows no indication in its label; one appears next to the field or in its placeholder.`,
    noVisibleLabel: (p) =>
      `This required field ("${p.label}") has no visible label in which a required indication could be shown.`,
    indicationMayBeImage: (p) =>
      `This required field ("${p.label}") shows no required indication in text; an image, icon or the text around it may give one.`,
    allFieldsRequiredSentence: (p) =>
      `This required field ("${p.label}") shows no indication in its label; the form says all its fields are required.`,
    stylesNotRead: (p) =>
      `This required field ("${p.label}") shows no required indication in its text; the page's styles, which could add one, were not read.`
  };

  const HINT = {
    requiredNotIndicated:
      "Show a required indication, such as « (obligatoire) » or an explained « * », in the field's <label> or in a passage linked by aria-describedby (RGAA 11.10.2).",
    markerExplainedAfter:
      "Explain the sign, such as « Les champs marqués d'un * sont obligatoires », before the first field that uses it, on screen and in the source order (RGAA glossary, required field indication).",
    markerNotExplained:
      "Explain the sign, such as « Les champs marqués d'un * sont obligatoires », before the first field that uses it, or write the indication in words (RGAA glossary, required field indication).",
    signMayMeanOther:
      'If the sign means the field is required, explain it before the first field that uses it, on screen and in the source order.',
    indicationInLegend:
      "Check that the indication in the legend identifies this field; RGAA 11.10.2 expects it in the field's label or a passage linked by aria-describedby.",
    indicationOutsideLabel:
      "Check the indication; RGAA 11.10.2 expects it, visible, in the field's <label> or in a passage linked by aria-describedby or aria-labelledby.",
    noVisibleLabel:
      "Check that the field's visible label shows that it is required, and associate that label with the field (RGAA 11.10.2).",
    indicationMayBeImage:
      'Check that an image or icon in the label, or the text the field belongs to, shows that it is required; otherwise add an indication to the label (RGAA 11.10.2).',
    allFieldsRequiredSentence:
      'RGAA 11.10.2 still asks each field with required or aria-required for a visible indication in its label or a linked passage; check that it has one.',
    stylesNotRead:
      "Check that the field's label shows a required indication, such as one added by CSS (RGAA 11.10.2)."
  };

  const forms = Array.from(dom.querySelectorAll(document, 'form, [role~="form" i]')).filter(isForm);
  const fails = [];
  const cantTells = [];
  let applicable = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };
  const signUses = [];

  function report(list, el, kind, params, needed) {
    list.push(
      helpers.reportOccurrence(el, {
        summary: SUMMARY[kind](params),
        hint: HINT[kind],
        i18n: {
          summaryKey: `requiredFieldIndication_summary_${kind}`,
          hintKey: `requiredFieldIndication_hint_${kind}`,
          params
        },
        ...(needed ? { uncertainty: { code: 'judgement-required', needed } } : {}),
        data: { details: { reasonCode: kind, ...params }, visibilityFilter: VF }
      })
    );
  }

  for (const form of forms) {
    if (!visible(form)) continue;
    const all = fieldsIn(form).filter(
      (el) => closestUp(el, isForm) === form && visible(el) && !offScreen(el, null)
    );
    const groups = new Map();
    for (const el of all) {
      // A radio of a radiogroup: the group is the field.
      if (roleOf(el) === 'radio' && fieldKey(el, form) !== el) continue;
      const key = fieldKey(el, form);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(el);
    }
    if (groups.size < 2) continue;

    const markOptional = Array.from(dom.querySelectorAll(form, 'label, legend')).some((n) =>
      OPTIONAL.test(look(n).text)
    );
    if (markOptional) continue;

    const before = dom.previousElementSibling ? dom.previousElementSibling(form) : null;
    const globalSentence =
      ALL_REQUIRED.test(norm(dom.textContent(form))) ||
      (before && ALL_REQUIRED.test(norm(dom.textContent(before))));

    for (const members of groups.values()) {
      const field = members[0];
      const required = members.some(isRequired);
      const legend = (() => {
        const fs = closestUp(field, (a) => tagOf(a) === 'fieldset' || a === form);
        if (!fs || fs === form) return null;
        return Array.from(dom.querySelectorAll(fs, ':scope > legend'))[0] || null;
      })();
      const own = merge(
        members.flatMap((m) =>
          labelsOf(m)
            .concat(refs(m, 'aria-labelledby'))
            .concat(refs(m, 'aria-describedby'))
            .map(look)
        )
      );
      const labelText = norm(
        members
          .flatMap((m) => labelsOf(m).concat(refs(m, 'aria-labelledby')))
          .map((n) => look(n).text)
          .join(' ')
      );

      if (SIGN.test(own.text) && !WORD.test(own.text) && own.firstSign) {
        signUses.push({ field, sign: own.firstSign, required });
      }
      if (!required) continue;
      applicable += 1;
      if (WORD.test(own.text) || SIGN.test(own.text)) continue;

      const legendLook = legend ? look(legend) : null;
      const near = nearby(field, form);
      const placeholder = norm(attr(field, 'placeholder'));
      const name = labelText || norm(attr(field, 'aria-label')) || norm(attr(field, 'name'));
      const params = { label: name.slice(0, 80) };

      if (legendLook && (WORD.test(legendLook.text) || SIGN.test(legendLook.text))) {
        if (isChoice(field)) continue;
        report(cantTells, field, 'indicationInLegend', params, NEEDED);
      } else if (WORD.test(near.text) || SIGN.test(near.text) || WORD.test(placeholder)) {
        report(cantTells, field, 'indicationOutsideLabel', params, NEEDED);
      } else if (SIGN.test(placeholder)) {
        report(cantTells, field, 'indicationOutsideLabel', params, NEEDED);
      } else if (!labelText) {
        report(cantTells, field, 'noVisibleLabel', params, NEEDED);
      } else if (isChoice(field) && !legend) {
        // A single checkbox ("I accept the terms") or a group whose
        // question is plain text: its étiquette may be outside the label.
        report(cantTells, field, 'indicationMayBeImage', params, NEEDED);
      } else if (own.icon || own.generated || near.icon) {
        report(cantTells, field, 'indicationMayBeImage', params, NEEDED);
      } else if (globalSentence) {
        report(cantTells, field, 'allFieldsRequiredSentence', params, NEEDED);
      } else if (stylesUnread) {
        report(cantTells, field, 'stylesNotRead', params, NEEDED);
      } else {
        report(fails, field, 'requiredNotIndicated', params);
      }
    }
  }

  // The text and icons next to the field: the largest ancestor that holds
  // this field alone, or else the field's adjacent siblings.
  function nearby(field, form) {
    let box = field;
    for (let a = dom.parentElement(field); a && a !== form; a = dom.parentElement(a)) {
      const fields = fieldsIn(a);
      if (fields.some((f) => f !== field)) break;
      box = a;
    }
    if (box !== field) return look(box);
    const sibs = [dom.previousSibling(field), dom.nextSibling(field)].filter(Boolean);
    const looks = sibs.map((s) => {
      if (dom.nodeType(s) === 3) return { text: norm(dom.nodeValue(s)), icon: false };
      if (dom.nodeType(s) === 1 && !fieldsIn(s).length) return look(s);
      return { text: '', icon: false };
    });
    return { text: norm(looks.map((l) => l.text).join(' ')), icon: looks.some((l) => l.icon) };
  }

  // The glossary note: a sign is explained before its first use. An
  // explanation is visible text outside any field's label that names the
  // sign (« * », « astérisque ») and the word.
  if (signUses.length) {
    signUses.sort((a, b) => (precedes(b.sign, a.sign) ? 1 : -1));
    const first = signUses[0];
    applicable += 1;
    const labelNodes = new Set();
    for (const f of fieldsIn(document)) {
      for (const n of labelsOf(f).concat(refs(f, 'aria-labelledby'))) labelNodes.add(n);
    }
    const inLabel = (n) => {
      for (let a = dom.parentElement(n); a; a = dom.parentElement(a)) {
        if (labelNodes.has(a)) return true;
      }
      return false;
    };
    const explanations = [];
    let otherSigns = false;
    let walker = null;
    try {
      walker = dom.createTreeWalker(document, dom.body(document) || document, 4, null);
    } catch {}
    for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
      const t = norm(dom.nodeValue(n));
      if (!t || !(SIGN.test(t) || SIGN_NAME.test(t)) || inLabel(n)) continue;
      const p = dom.parentElement(n);
      if (!p || SKIP_TAGS.has(tagOf(p)) || !visible(p) || offScreen(p, null)) continue;
      let block = p;
      let text = norm(dom.textContent(p));
      for (let i = 0; i < 2 && !WORD.test(text); i += 1) {
        const up = dom.parentElement(block);
        if (!up || fieldsIn(up).length) break;
        block = up;
        text = norm(dom.textContent(up));
      }
      if (WORD.test(text)) explanations.push(n);
      else otherSigns = true;
    }
    const signEl = dom.parentElement(first.sign);
    const titled = signEl && WORD.test(norm(attr(signEl, 'title') || attr(signEl, 'aria-label')));
    const params = { label: norm(dom.textContent(signEl)).slice(0, 80) };
    if (explanations.some((n) => precedes(n, first.sign))) {
      // explained before its first use
    } else if (explanations.length) {
      report(fails, first.field, 'markerExplainedAfter', params);
    } else if (first.required && !otherSigns && !titled && !stylesUnread) {
      report(fails, first.field, 'markerNotExplained', params);
    } else {
      report(cantTells, first.field, 'signMayMeanOther', params, NEEDED);
    }
  }

  if (applicable === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
