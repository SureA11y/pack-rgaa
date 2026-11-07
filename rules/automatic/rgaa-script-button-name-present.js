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
        'Activate the button, and see what it does.'
      ],
      passWhen: 'The generic name says what the button does.',
      failWhen: 'The generic name does not say what the button does, which fails RGAA 7.1.3.'
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
    const occurrence = helpers.reportOccurrence(el, {
      summary: msg.summary,
      hint: msg.hint,
      i18n: {
        summaryKey: `scriptButtonNamePresent_summary_${msg.outcome}_${reasonCode}`,
        hintKey: `scriptButtonNamePresent_hint_${msg.outcome}_${reasonCode}`,
        params: {}
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
        details: { reasonCode, element: tagOf(el) },
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
