/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-label-placement-review
 * @atomic true
 * @summary Each field's visible label sits right next to it, on the side RGAA asks for
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies, where the page has a layout (in a browser), to visible form
 *   fields (<input> other than hidden and the button types, <select>,
 *   <textarea>, and role checkbox, radio, switch, textbox, searchbox,
 *   combobox, spinbutton, listbox or slider) with a visible label: a
 *   <label> (for or wrapping) or an aria-labelledby passage holding
 *   visible text. A name from aria-label, title or a placeholder alone is
 *   not a visible label. Native check boxes and radio buttons that are
 *   themselves invisible (opacity 0, clipped, tiny: drawn by CSS
 *   elsewhere) are left out. Without a layout (jsdom), notApplicable.
 * @expectation
 *   RGAA 11.4.1: « Chaque étiquette de champ et son champ associé
 *   sont-ils accolés ? », accolés being « visuellement proches de manière à
 *   ce que la relation entre les deux ne puisse pas prêter à confusion ».
 *   A label more than 100 px (or 3 of its lines, if more) from its field is
 *   asked about (labelFarFromField). A wrapping label is taken as next to
 *   the field it holds.
 *   RGAA 11.4.2: a label of a field other than a check box, radio button or
 *   switch is « visuellement accolée immédiatement au-dessus ou à gauche du
 *   champ » (« à droite » for a right-to-left language). One that is
 *   neither is asked about (labelNotAboveOrLeft).
 *   RGAA 11.4.3: for a check box, a radio button or role checkbox, radio or
 *   switch, the label is « immédiatement au-dessous ou à droite du champ »
 *   (« à gauche » for a right-to-left language). One that is neither is
 *   asked about (labelNotBelowOrRight).
 *   The particular cases make 11.4.2 and 11.4.3 not applicable when the
 *   label « mélange une portion de texte qui se lit de droite à gauche avec
 *   une portion de texte qui se lit de gauche à droite », or when a form
 *   « contient des labels de plusieurs langues qui se liraient de droite à
 *   gauche et inversement »: those labels are only checked for distance.
 *   Fields « utilisés dans un contexte où il pourrait être légitime […] de
 *   placer les étiquettes de manière différente » are for a person, which
 *   is why the rule only asks.
 * @implementation-notes
 * - Manual (cantTell).
 * - The label's box is the box of its text (without the field or other
 *   controls it holds); a label with no text box is skipped.
 * - A field passes a check when any of its visible labels passes it.
 * - Tolerances are generous (8 px, or half a line of the label's text):
 *   a label that overlaps its field (a floating label) is not asked about.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-label-placement-review';

const meta = {
  title: "Each field's label sits right next to it, on the expected side",
  description:
    'In a browser, flags form fields whose visible label is far from them, or is not above or before them (below or after them for a check box, radio button or switch), for a person to check that label and field are next to each other as RGAA asks.',
  i18n: {
    titleKey: 'labelPlacementReview_title',
    descriptionKey: 'labelPlacementReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  reasonCodes: ['labelFarFromField', 'labelNotAboveOrLeft', 'labelNotBelowOrRight'],
  review: {
    labelFarFromField: {
      steps: [
        'Find the field the report names, and its label, on screen; the report gives the distance between them.',
        'Decide whether you can tell at a glance that this label belongs to this field, even with other fields or texts nearby.'
      ],
      passWhen: 'The label and the field are close enough for their link to be clear.',
      failWhen:
        'The distance leaves room for doubt about which field the label belongs to, which fails RGAA 11.4.1.'
    },
    labelNotAboveOrLeft: {
      steps: [
        'Find the field the report names, and its label, on screen.',
        'Check where the label sits: for text that reads left to right, it should be immediately above the field or on its left; for text that reads right to left, above or on its right.',
        "Decide whether a particular case applies: the label mixes text read left to right with text read right to left, or the form's labels are in languages read in both directions, or the field is used in a context where placing the label differently makes sense for users."
      ],
      passWhen: 'The label sits where the test asks, or a particular case of RGAA 11.4 applies.',
      failWhen: 'The label sits elsewhere and no particular case applies, which fails RGAA 11.4.2.'
    },
    labelNotBelowOrRight: {
      steps: [
        'Find the check box, radio button or switch the report names, and its label, on screen.',
        'Check where the label sits: for text that reads left to right, it should be immediately below the field or on its right; for text that reads right to left, below or on its left.',
        "Decide whether a particular case applies: the label mixes text read left to right with text read right to left, or the form's labels are in languages read in both directions, or the field is not shown as a check box or a radio button, or the context makes another place sensible for users."
      ],
      passWhen: 'The label sits where the test asks, or a particular case applies.',
      failWhen: 'The label sits elsewhere with no particular case, which fails RGAA 11.4.3.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const view = dom.defaultView(document) || null;

  const FAR_PX = 100; // A gap over this (and over 3 lines of text) is far.
  const FAR_LINES = 3;
  const TOL_PX = 8;
  const NOT_APPLICABLE = {
    ruleId: rule.ruleId,
    outcome: 'notApplicable',
    severity: 'minor',
    occurrences: []
  };

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
      return String(helpers.aria.getExplicitRole(el) || '').toLowerCase();
    } catch {
      return '';
    }
  };
  function styleOf(el) {
    try {
      return view.getComputedStyle(el);
    } catch {
      return null;
    }
  }

  function hasLayout() {
    const probe = dom.documentElement(document) || null;
    if (!probe || !view || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      if (!rects || !rects.length) return false;
      const r = dom.getBoundingClientRect(probe);
      return r.width > 0 || r.height > 0;
    } catch {
      return false;
    }
  }
  if (!hasLayout()) return NOT_APPLICABLE;

  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }
  // Clipped, transparent or off-screen: not seen though it takes space. An
  // element is unseen when it or an ancestor is; each element's answer is
  // kept, so many fields sharing one large label climb its ancestors once.
  const unseenCache = new Map();
  function unseen(el) {
    if (!el || dom.nodeType(el) !== 1) return false;
    if (unseenCache.has(el)) return unseenCache.get(el);
    let hidden = false;
    try {
      hidden = typeof helpers.isVisuallyHidden === 'function' && !!helpers.isVisuallyHidden(el);
    } catch {}
    if (!hidden) {
      const s = styleOf(el);
      hidden = !!(s && parseFloat(s.opacity) === 0);
    }
    if (!hidden) hidden = unseen(dom.parentElement(el));
    unseenCache.set(el, hidden);
    return hidden;
  }
  const seenCache = new Map();
  function seen(el) {
    if (!seenCache.has(el)) seenCache.set(el, visible(el) && !unseen(el));
    return seenCache.get(el);
  }

  function boxOf(el) {
    try {
      const r = dom.getBoundingClientRect(el);
      if (!(r.width >= 4 && r.height >= 4)) return null;
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    } catch {
      return null;
    }
  }

  const CONTROL = 'input, select, textarea, button';
  // The box of the label's own text: text nodes not inside the field or
  // another control, not inside a hidden element.
  function textBox(label, field) {
    let box = null;
    let text = '';
    const walk = (node) => {
      for (const c of [...(dom.childNodes(node) || [])]) {
        const type = dom.nodeType(c);
        if (type === 3) {
          const value = String(dom.nodeValue(c) || '');
          if (!value.trim()) continue;
          let rects = [];
          try {
            const range = dom.createRange(document);
            range.selectNodeContents(c);
            rects = [...(dom.getClientRects(range) || [])];
          } catch {
            rects = [];
          }
          for (const r of rects) {
            if (!(r.width > 0 && r.height > 0)) continue;
            box = box
              ? {
                  left: Math.min(box.left, r.left),
                  top: Math.min(box.top, r.top),
                  right: Math.max(box.right, r.right),
                  bottom: Math.max(box.bottom, r.bottom)
                }
              : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
            text += ' ' + value;
          }
        } else if (type === 1) {
          if (c === field) continue;
          let control = false;
          try {
            control = !!dom.matches(c, CONTROL);
          } catch {}
          if (control || !seen(c)) continue;
          walk(c);
        }
      }
    };
    walk(label);
    return box ? { box, text: norm(text) } : null;
  }

  function contains(a, b) {
    try {
      return !!dom.contains(a, b);
    } catch {
      return false;
    }
  }

  function labelsOf(el) {
    const out = [];
    try {
      if (helpers.getAssociatedLabelElements) {
        for (const l of helpers.getAssociatedLabelElements(el) || []) out.push(l);
      }
    } catch {}
    const refs = norm(attr(el, 'aria-labelledby'));
    if (refs) {
      for (const ref of refs.split(' ')) {
        let target = null;
        try {
          target = helpers.getElementByIdInTree
            ? helpers.getElementByIdInTree(el, ref)
            : dom.getElementById(dom.getRootNode(el), ref);
        } catch {
          target = null;
        }
        if (target && target !== el && !out.includes(target)) out.push(target);
      }
    }
    return out;
  }

  const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
  const LETTER = /\p{L}/u;
  // 'ltr', 'rtl' or 'mixed' (11.4.2 and 11.4.3 do not apply).
  function directionOf(label, text) {
    let rtl = false;
    let ltr = false;
    for (const ch of text) {
      if (RTL.test(ch)) rtl = true;
      else if (LETTER.test(ch)) ltr = true;
    }
    if (rtl && ltr) return 'mixed';
    if (rtl) return 'rtl';
    if (ltr) return 'ltr';
    const s = styleOf(label);
    return s && s.direction === 'rtl' ? 'rtl' : 'ltr';
  }

  function lineHeightOf(label) {
    const s = styleOf(label);
    const size = s ? parseFloat(s.fontSize) || 16 : 16;
    const lh = s ? parseFloat(s.lineHeight) : NaN;
    return Number.isFinite(lh) && lh > 0 ? lh : size * 1.2;
  }

  const overlapX = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const overlapY = (a, b) => Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  function gapOf(a, b) {
    const dx = Math.max(0, b.left - a.right, a.left - b.right);
    const dy = Math.max(0, b.top - a.bottom, a.top - b.bottom);
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  }
  // Where the label L sits around the field F.
  function sides(L, F, tol) {
    const sameColumn = overlapX(L, F) > -tol;
    const sameRow = overlapY(L, F) > -tol;
    return {
      above: sameColumn && L.bottom <= F.top + tol,
      below: sameColumn && L.top >= F.bottom - tol,
      left: sameRow && L.right <= F.left + tol,
      right: sameRow && L.left >= F.right - tol,
      // A label drawn over its field (a floating label) is not asked about.
      over: overlapX(L, F) > 0 && overlapY(L, F) > 0
    };
  }

  // What a label shows: its text, the box of that text, its direction and
  // line height; null when it shows no text.
  function labelInfo(label, field) {
    const t = textBox(label, field);
    if (!t || !t.text) return null;
    return {
      el: label,
      box: t.box,
      text: t.text,
      dir: directionOf(label, t.text),
      line: lineHeightOf(label)
    };
  }
  // A label outside its field reads the same for every field it names, so
  // one that many fields share (aria-labelledby) is measured once.
  const sharedLabels = new Map();
  function sharedLabelInfo(label) {
    if (!sharedLabels.has(label)) sharedLabels.set(label, labelInfo(label, null));
    return sharedLabels.get(label);
  }

  const CHOICE_ROLES = new Set(['checkbox', 'radio', 'switch']);
  const FIELD_ROLES = new Set([
    'textbox',
    'searchbox',
    'combobox',
    'spinbutton',
    'listbox',
    'slider'
  ]);
  const NOT_FIELDS = new Set(['hidden', 'submit', 'reset', 'button', 'image']);
  function kindOf(el) {
    const tag = tagOf(el);
    const role = roleOf(el);
    if (tag === 'input') {
      const type = String(attr(el, 'type') || 'text').toLowerCase();
      if (NOT_FIELDS.has(type)) return null;
      if (type === 'checkbox' || type === 'radio' || CHOICE_ROLES.has(role)) return 'choice';
      return 'text';
    }
    if (tag === 'select' || tag === 'textarea') return 'text';
    if (CHOICE_ROLES.has(role)) return 'choice';
    if (FIELD_ROLES.has(role)) return 'text';
    return null;
  }

  const SELECTOR =
    'input, select, textarea, [role~="checkbox" i], [role~="radio" i], [role~="switch" i], [role~="textbox" i], [role~="searchbox" i], [role~="combobox" i], [role~="spinbutton" i], [role~="listbox" i], [role~="slider" i]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(SELECTOR)
    : helpers.queryAll(SELECTOR);

  const items = [];
  const done = new Set();
  for (const el of nodes) {
    if (!el || done.has(el) || !dom.get(el, 'getAttribute')) continue;
    done.add(el);
    const kind = kindOf(el);
    if (!kind || !seen(el)) continue;
    const F = boxOf(el);
    if (!F) continue;
    const labels = [];
    for (const l of labelsOf(el)) {
      if (!seen(l)) continue;
      const wraps = contains(l, el);
      const t = wraps ? labelInfo(l, el) : sharedLabelInfo(l);
      if (!t) continue;
      labels.push({ ...t, wraps });
    }
    if (!labels.length) continue;
    let form = null;
    try {
      form = dom.closest(el, 'form');
    } catch {
      form = null;
    }
    items.push({ el, kind, F, labels, form });
  }

  // A form whose labels read in both directions: 11.4.2 and 11.4.3 do not apply.
  const dirsByForm = new Map();
  for (const it of items) {
    const dirs = dirsByForm.get(it.form) || new Set();
    for (const l of it.labels) dirs.add(l.dir);
    dirsByForm.set(it.form, dirs);
  }

  // The side of the field the label is on, by the axis with the larger
  // gap: 'above', 'below', 'left' or 'right'; '' when the boxes overlap.
  function sideOf(L, F) {
    const vertical =
      L.bottom <= F.top ? F.top - L.bottom : L.top >= F.bottom ? L.top - F.bottom : -1;
    const horizontal =
      L.right <= F.left ? F.left - L.right : L.left >= F.right ? L.left - F.right : -1;
    if (vertical < 0 && horizontal < 0) {
      // Overlapping boxes: the side of the label's center.
      const cx = (L.left + L.right) / 2 - (F.left + F.right) / 2;
      const cy = (L.top + L.bottom) / 2 - (F.top + F.bottom) / 2;
      if (Math.abs(cx) >= Math.abs(cy)) return cx < 0 ? 'left' : cx > 0 ? 'right' : '';
      return cy < 0 ? 'above' : 'below';
    }
    if (vertical >= horizontal) return L.bottom <= F.top ? 'above' : 'below';
    return L.right <= F.left ? 'left' : 'right';
  }

  const occurrences = [];
  function report(it, code, label, extra) {
    const params = { label: label.text.slice(0, 80), ...extra };
    // Where the label is, for the questions about its side.
    const side = code === 'labelFarFromField' ? '' : sideOf(label.box, it.F);
    if (side) {
      params.distance = gapOf(label.box, it.F);
      params[side] = true;
    }
    const SIDE_TEXT = {
      above: 'above this field',
      below: 'below this field',
      left: 'to the left of this field',
      right: 'to the right of this field'
    };
    const SIDE_CHOICE_TEXT = {
      above: 'above this check box, radio button or switch',
      below: 'below this check box, radio button or switch',
      left: 'to the left of this check box, radio button or switch',
      right: 'to the right of this check box, radio button or switch'
    };
    const MESSAGES = {
      labelFarFromField: [
        `The label "${params.label}" is ${params.distance} px away from this field.`,
        'Check that the label and its field are close enough for their relation to be clear (RGAA 11.4.1).'
      ],
      labelNotAboveOrLeft: [
        side
          ? `The label "${params.label}" is ${SIDE_TEXT[side]}, ${params.distance} px away, not just above it or before it on the same line.`
          : `The label "${params.label}" is neither just above this field nor just before it on the same line.`,
        'Check that the label sits immediately above the field or on its left (on its right for a right-to-left language), unless a particular case applies (RGAA 11.4.2).'
      ],
      labelNotBelowOrRight: [
        side
          ? `The label "${params.label}" is ${SIDE_CHOICE_TEXT[side]}, ${params.distance} px away, not just below it or after it on the same line.`
          : `The label "${params.label}" is neither just below this check box, radio button or switch nor just after it on the same line.`,
        'Check that the label sits immediately below the field or on its right (on its left for a right-to-left language), unless a particular case applies, such as a field not shown as a check box or radio button (RGAA 11.4.3).'
      ]
    };
    occurrences.push(
      helpers.reportOccurrence(it.el, {
        summary: MESSAGES[code][0],
        hint: MESSAGES[code][1],
        i18n: {
          summaryKey: `labelPlacementReview_summary_cantTell_${code}${side ? '_side' : ''}`,
          hintKey: `labelPlacementReview_hint_cantTell_${code}`,
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the label and its field are next to each other as RGAA 11.4 asks.'
        },
        data: {
          details: {
            reasonCode: code,
            label: params.label,
            ...(params.distance != null ? { distance: params.distance } : {}),
            ...(side ? { side } : {}),
            kind: it.kind,
            direction: label.dir
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  for (const it of items) {
    const { F, labels } = it;
    // 11.4.1: far from every label.
    const far = labels.map((l) => {
      const gap = gapOf(l.box, F);
      return { l, gap, far: !l.wraps && gap > Math.max(FAR_PX, FAR_LINES * l.line) };
    });
    if (far.every((x) => x.far)) {
      report(it, 'labelFarFromField', far[0].l, { distance: far[0].gap });
    }

    // 11.4.2 and 11.4.3: on the wrong side of every label they apply to.
    if (dirsByForm.get(it.form).has('ltr') && dirsByForm.get(it.form).has('rtl')) continue;
    const judged = labels.filter((l) => l.dir !== 'mixed');
    if (!judged.length || judged.length < labels.length) continue;
    const wrong = judged.filter((l) => {
      const tol = Math.max(TOL_PX, l.line / 2);
      const s = sides(l.box, F, tol);
      if (s.over) return false;
      const before = l.dir === 'rtl' ? s.right : s.left;
      const after = l.dir === 'rtl' ? s.left : s.right;
      return it.kind === 'choice' ? !(s.below || after) : !(s.above || before);
    });
    if (wrong.length === judged.length) {
      report(it, it.kind === 'choice' ? 'labelNotBelowOrRight' : 'labelNotAboveOrLeft', wrong[0]);
    }
  }

  if (!occurrences.length) return NOT_APPLICABLE;
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
