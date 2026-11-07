/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-markup-for-presentation
 * @atomic true
 * @summary Elements are not used only for presentation
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible headings with role="presentation" or role="none",
 *   paragraphs and <blockquote> elements with no content, runs of two or
 *   more <br>, and text indented with non-breaking spaces. A page with
 *   none is notApplicable.
 * @expectation
 *   RGAA 8.9.1: tags other than <div>, <span> and <table> « ne doivent pas
 *   être utilisées uniquement à des fins de présentation ». The
 *   methodology lists « un titre utilisé comme légende, un élément
 *   <blockquote> ou des paragraphes vides ou encore des espaces utilisés
 *   pour créer des effets de marges », and accepts role="presentation" on
 *   an empty paragraph or a <blockquote> but not on a heading.
 *   - Fails a heading (<h1>-<h6>) with role="presentation" or "none"
 *     (headingPresentation): « non-conforme sur un titre ».
 *   - Fails a paragraph that holds only non-breaking spaces or <br>,
 *     without role="presentation" (spacerParagraph): it renders a blank
 *     line and nothing else.
 *   - Asks about (cantTell) a paragraph with no content at all, which may
 *     render nothing; a <blockquote> with no text and no image
 *     (emptyBlockquote), which renders little more; an empty paragraph
 *     or <blockquote> with a role or aria-live, which a script may fill
 *     (placeholder); two or more <br> in a row, which may separate
 *     paragraphs or lines of an address or a poem; and text that starts
 *     with three non-breaking spaces or more, which may be a margin made of
 *     spaces. Runs of spaces between words, which may simulate a table or
 *     columns, are 10.1.3's matter (rgaa-letters-spaced-with-spaces).
 * @implementation-notes
 * - <address>, <pre>, <code>, <textarea> and editable regions are left
 *   out of the <br> and space checks.
 * - One occurrence per element.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-markup-for-presentation';

const meta = {
  title: 'Elements are not used only for presentation',
  description:
    'Fails headings with role="presentation" and paragraphs of only spaces or line breaks; asks about empty paragraphs and <blockquote> elements, runs of <br> and indents made of spaces.',
  i18n: {
    titleKey: 'markupForPresentation_title',
    descriptionKey: 'markupForPresentation_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: [
    'headingPresentation',
    'spacerParagraph',
    'emptyBlockquote',
    'emptyParagraph',
    'placeholder',
    'consecutiveBr',
    'spacesForMargin'
  ],
  review: {
    emptyBlockquote: {
      steps: [
        'Find the <blockquote> the report names: it holds no text and no image.',
        'Look at the page where it sits, and check whether it makes a gap or an indent.',
        'Use the page, and check whether a script fills it with a quotation.'
      ],
      passWhen: 'A script fills the element with a quotation, or it shows nothing on screen.',
      failWhen: 'The <blockquote> is there only for its margins, which fails RGAA 8.9.1.'
    },
    emptyParagraph: {
      steps: [
        'Find the paragraph the report names: it has no content.',
        'Look at the page where it sits, and check whether it makes a gap.',
        'Use the page, and check whether a script fills it.'
      ],
      passWhen: 'The paragraph shows nothing on screen, or a script fills it.',
      failWhen: 'The paragraph is there only to make space, which fails RGAA 8.9.1.'
    },
    placeholder: {
      steps: [
        'Find the empty element the report names: it has a role or aria-live, so it may be waiting for content.',
        'Use the page, and watch for the moment a script fills it, such as after a search or a form error.',
        'Look at the page where it sits, and check whether it makes a gap while it is empty.'
      ],
      passWhen:
        'A script fills the element with content, or the element shows nothing on screen while it is empty.',
      failWhen: 'The element stays empty and is there only to make space, which fails RGAA 8.9.1.'
    },
    consecutiveBr: {
      steps: [
        'Find the element the report names: it holds two or more <br> in a row.',
        'Read its text on screen.',
        'Decide whether the line breaks separate paragraphs, or lines that belong together, such as an address or a poem.'
      ],
      passWhen: 'The line breaks separate lines of one block of text.',
      failWhen: 'The line breaks only make space between paragraphs, which fails RGAA 8.9.1.'
    },
    spacesForMargin: {
      steps: [
        'Find the text the report names: it starts with three non-breaking spaces or more.',
        'Look at it on screen, and check whether the spaces push it to the right.',
        'Decide whether they make a margin or an indent.'
      ],
      passWhen: 'The spaces make no margin or indent on screen.',
      failWhen: 'The spaces are there to make a margin, which fails RGAA 8.9.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const attr = (el, name) => {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  };
  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };
  const presentational = (el) => ['presentation', 'none'].includes(roleOf(el));

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

  const NBSP = ' ';
  const SKIP = new Set(['address', 'pre', 'code', 'textarea', 'script', 'style', 'template']);
  const skipped = (el) => {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (SKIP.has(tagOf(a))) return true;
      const ce = String(attr(a, 'contenteditable') || '').toLowerCase();
      if (dom.hasAttribute(a, 'contenteditable') && ce !== 'false') return true;
    }
    return false;
  };

  // A live region or an element with a role: a script may fill it.
  const placeholder = (el) => !!(roleOf(el) || dom.hasAttribute(el, 'aria-live'));

  // Children, other than whitespace text: kinds 'br', 'nbsp' (text of
  // non-breaking spaces only), 'content'.
  function contentOf(el) {
    const kinds = new Set();
    for (const n of [...(dom.childNodes(el) || [])]) {
      const type = dom.nodeType(n);
      if (type === 3) {
        const v = String(dom.nodeValue(n) || '');
        if (!v.trim() && !v.includes(NBSP)) continue;
        kinds.add(v.replace(/[\s ]/g, '') ? 'content' : 'nbsp');
      } else if (type === 1) {
        const tag = tagOf(n);
        if (tag === 'br') kinds.add('br');
        else if (tag === 'wbr') continue;
        else if (['span', 'b', 'i', 'em', 'strong', 'font', 'small'].includes(tag)) {
          for (const k of contentOf(n)) kinds.add(k);
        } else kinds.add('content');
      } else if (type !== 8) kinds.add('content');
    }
    return kinds;
  }

  const fails = [];
  const cantTells = [];
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };
  const seen = new Set();

  function report(list, el, kind, params = {}) {
    if (seen.has(el)) return;
    seen.add(el);
    const ask = list === cantTells;
    list.push(
      helpers.reportOccurrence(el, {
        summary: SUMMARY[kind],
        hint: HINT[kind],
        i18n: {
          summaryKey: `markupForPresentation_summary_${kind}`,
          hintKey: `markupForPresentation_hint_${kind}`,
          params
        },
        ...(ask
          ? {
              uncertainty: {
                code: 'judgement-required',
                needed: 'Whether the element is used only for presentation.'
              }
            }
          : {}),
        data: { details: { reasonCode: kind, ...params }, visibilityFilter: VF }
      })
    );
  }

  const SUMMARY = {
    headingPresentation:
      'This heading has role="presentation", which RGAA does not accept on a heading.',
    spacerParagraph: 'This paragraph holds only spaces or line breaks: it is used to make space.',
    emptyBlockquote: 'This <blockquote> holds no text; check whether it is used for its margins.',
    emptyParagraph: 'This paragraph has no content; check whether it is used to make space.',
    placeholder:
      'This element is empty but has a role or aria-live; check whether a script fills it or it is used to make space.',
    consecutiveBr:
      'This element uses two or more <br> in a row; check whether they make paragraphs.',
    spacesForMargin:
      'This text is indented with non-breaking spaces; check whether they make a margin.'
  };
  const HINT = {
    headingPresentation:
      'If the text is a heading, remove the role; if it is not, use an element that is not a heading, styled with CSS (RGAA 8.9.1).',
    spacerParagraph:
      'Remove the paragraph and make the space with CSS margins or padding (RGAA 8.9.1).',
    emptyBlockquote:
      'Remove the <blockquote>, or keep it for quotations only, and indent with CSS (RGAA 8.9.1).',
    emptyParagraph:
      'If the paragraph only makes space, remove it and use CSS margins instead (RGAA 8.9.1).',
    placeholder:
      'If the element only makes space, remove it and use CSS margins instead (RGAA 8.9.1).',
    consecutiveBr:
      'If the line breaks separate paragraphs, mark each paragraph with <p> and space them with CSS (RGAA 8.9.1).',
    spacesForMargin: 'Make margins and alignment with CSS, not with spaces (RGAA 8.9.1).'
  };

  let applicable = 0;

  for (const h of query('h1, h2, h3, h4, h5, h6')) {
    if (!presentational(h) || !visible(h)) continue;
    applicable += 1;
    report(fails, h, 'headingPresentation', { role: roleOf(h) });
  }

  for (const el of query('p, blockquote')) {
    if (presentational(el) || !visible(el) || skipped(el)) continue;
    const kinds = contentOf(el);
    if (kinds.has('content')) continue;
    applicable += 1;
    const isQuote = tagOf(el) === 'blockquote';
    if (placeholder(el)) report(cantTells, el, 'placeholder');
    else if (isQuote) report(cantTells, el, 'emptyBlockquote');
    else if (kinds.size) report(fails, el, 'spacerParagraph');
    else report(cantTells, el, 'emptyParagraph');
  }

  for (const br of query('br')) {
    const p = dom.parentElement(br);
    if (!p || seen.has(p) || skipped(br) || !visible(p)) continue;
    let next = dom.nextSibling(br);
    while (next && dom.nodeType(next) === 3 && !String(dom.nodeValue(next) || '').trim()) {
      next = dom.nextSibling(next);
    }
    if (!next || dom.nodeType(next) !== 1 || tagOf(next) !== 'br') continue;
    applicable += 1;
    report(cantTells, p, 'consecutiveBr');
  }

  const body = dom.body(document);
  let walker = null;
  try {
    walker = body ? dom.createTreeWalker(document, body, 4, null) : null;
  } catch {}
  for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
    const v = String(dom.nodeValue(n) || '');
    if (!v.includes(NBSP + NBSP + NBSP)) continue;
    if (!v.replace(/[\s ]/g, '')) continue;
    const lead = /^[\s]* {3,}/.test(v);
    if (!lead) continue;
    const p = dom.parentElement(n);
    if (!p || seen.has(p) || skipped(p) || !visible(p)) continue;
    applicable += 1;
    report(cantTells, p, 'spacesForMargin');
  }

  if (applicable === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'moderate');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
