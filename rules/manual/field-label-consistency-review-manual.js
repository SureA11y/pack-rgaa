/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-field-label-consistency-review
 * @atomic true
 * @summary Fields asking for the same information in one page have coherent labels
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible form fields (input other than hidden, the button
 *   types, checkbox and radio; select; textarea) that have a visible label
 *   (a <label>, or an aria-labelledby passage) and an autocomplete value
 *   naming a field (email, tel, postal-code…; not on or off). Fields with
 *   the same autocomplete value, section and shipping/billing/home/work
 *   tokens included, ask for the same information. A page where no two
 *   such fields have different labels is notApplicable.
 * @expectation
 *   RGAA 11.3.1: « Chaque étiquette associée à un champ de formulaire ayant
 *   la même fonction et répétée plusieurs fois dans une même page est-elle
 *   cohérente ? ». The glossary « Étiquettes cohérentes » asks that labels
 *   « réclamant la saisie d’une même information » be « formulées sans
 *   ambiguïté pour que l’utilisateur sache que l’information qu’il doit
 *   communiquer est la même ». Two different wordings can still be
 *   unambiguous, so a set whose labels differ once case, accents,
 *   punctuation, text in parentheses and the words for required or
 *   optional are ignored is asked about (inconsistentLabels), once, on its
 *   first field.
 * @implementation-notes
 * - Manual (cantTell).
 * - Fields with no autocomplete value are not compared: nothing else says
 *   for sure that two fields ask for the same information.
 * - 11.3.2 (a set of pages) needs more than one page and is not covered.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-field-label-consistency-review';

const meta = {
  title: 'Fields asking for the same information have coherent labels',
  description:
    'Flags fields of a page with the same autocomplete value but different visible labels, for a person to check that the labels say without ambiguity that the same information is asked for.',
  i18n: {
    titleKey: 'fieldLabelConsistencyReview_title',
    descriptionKey: 'fieldLabelConsistencyReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  reasonCodes: ['inconsistentLabels'],
  review: {
    inconsistentLabels: {
      steps: [
        'Find the field the report names, and the other fields of this page it lists, which ask for the same information.',
        'Read their labels side by side.',
        'Decide whether someone reading them would know that the same kind of information is asked for.'
      ],
      passWhen:
        'The labels differ in wording but leave no doubt that the same kind of information is asked for.',
      failWhen:
        'The labels could make someone think that different information is asked for, which fails RGAA 11.3.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }
  const query = (sel) =>
    helpers.queryAllSmart ? helpers.queryAllSmart(sel) : helpers.queryAll(sel);

  // The text of a label, without what the fields inside it hold.
  const SKIP = ['input', 'select', 'textarea', 'datalist', 'script', 'style', 'template'];
  function ownText(node) {
    let out = '';
    for (const child of Array.from(dom.childNodes(node) || [])) {
      const type = dom.nodeType(child);
      if (type === 3) out += dom.textContent(child) || '';
      else if (type === 1 && !SKIP.includes(tagOf(child))) out += ' ' + ownText(child) + ' ';
    }
    return out;
  }
  function labelsOf(el) {
    try {
      return helpers.getAssociatedLabelElements ? helpers.getAssociatedLabelElements(el) || [] : [];
    } catch {
      return [];
    }
  }
  function refsOf(el) {
    const v = norm(dom.getAttribute(el, 'aria-labelledby'));
    if (!v) return [];
    return v
      .split(' ')
      .map((ref) => {
        try {
          return helpers.getElementByIdInTree
            ? helpers.getElementByIdInTree(el, ref)
            : dom.getElementById(dom.getRootNode(el), ref);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }
  // The visible label: the <label> elements, else the aria-labelledby passages.
  function visibleLabel(el) {
    const labels = labelsOf(el)
      .filter((l) => visible(l))
      .map((l) => norm(ownText(l)))
      .filter(Boolean);
    if (labels.length) return labels.join(' ');
    return norm(
      refsOf(el)
        .filter((r) => r !== el && visible(r))
        .map((r) => norm(dom.textContent(r)))
        .join(' ')
    );
  }
  // Case, accents, punctuation, text in parentheses and required/optional
  // words do not make two labels different.
  const FILLER =
    /\b(?:obligatoire|requis|facultatif|optionnel|required|optional|obligatorio|opcional|pflichtfeld)\b/g;
  function key(label) {
    return String(label)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
      .replace(FILLER, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // The autocomplete value without webauthn, lower-cased; '' for none, on,
  // off or a value that names no field.
  function purpose(el) {
    const tokens = norm(dom.getAttribute(el, 'autocomplete'))
      .toLowerCase()
      .split(' ')
      .filter((t) => t && t !== 'webauthn');
    if (!tokens.length) return '';
    const last = tokens[tokens.length - 1];
    if (last === 'on' || last === 'off' || !/^[a-z][a-z0-9-]*$/.test(last)) return '';
    return tokens.join(' ');
  }

  const SELECTOR =
    'input[autocomplete]:not([type="hidden" i]):not([type="submit" i]):not([type="reset" i]):not([type="button" i]):not([type="image" i]):not([type="checkbox" i]):not([type="radio" i]), select[autocomplete], textarea[autocomplete]';

  const sets = new Map();
  for (const el of query(SELECTOR)) {
    if (!el || !dom.get(el, 'getAttribute') || !visible(el)) continue;
    const p = purpose(el);
    if (!p) continue;
    const label = visibleLabel(el);
    const k = key(label);
    if (!k) continue;
    if (!sets.has(p)) sets.set(p, []);
    sets.get(p).push({ el, label, k });
  }

  const occurrences = [];
  for (const [token, fields] of sets) {
    const distinct = [];
    for (const f of fields) {
      if (!distinct.some((d) => d.k === f.k)) distinct.push(f);
    }
    if (distinct.length < 2) continue;
    const labels = distinct
      .slice(0, 5)
      .map((d) => `"${d.label.slice(0, 60)}"`)
      .join(', ');
    const params = { token, labels };
    occurrences.push(
      helpers.reportOccurrence(fields[0].el, {
        summary: `The ${fields.length} fields with autocomplete="${token}" have different labels: ${labels}.`,
        hint: 'Check that these labels make it clear that the same information is asked for, for instance by using the same wording (RGAA 11.3.1).',
        i18n: {
          summaryKey: 'fieldLabelConsistencyReview_summary_cantTell',
          hintKey: 'fieldLabelConsistencyReview_hint_cantTell',
          params: { ...params, count: String(fields.length) }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether the different labels leave no doubt that the same information is asked for.'
        },
        data: {
          details: {
            reasonCode: 'inconsistentLabels',
            token,
            labels: distinct.map((d) => d.label),
            count: fields.length
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
