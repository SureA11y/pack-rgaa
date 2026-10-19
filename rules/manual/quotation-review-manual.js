/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-quotation-review
 * @atomic true
 * @summary Quotations use <q> or <blockquote>
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible text that looks like a quotation not marked up as
 *   one: a paragraph or other block whose whole text is in quotation marks
 *   (« … », “…”, "…", „…“), or a passage of running text in « … » or “…”,
 *   of 8 words or more and outside <q>, <blockquote> and <cite>. French
 *   uses « » for titles, terms and names too, so shorter passages are left
 *   out, as are link text, headings, code, scripts, styles and form
 *   controls. A page with none is notApplicable.
 * @expectation
 *   RGAA 9.4: « Dans chaque page web, chaque citation est-elle correctement
 *   indiquée ? ». 9.4.1: « chaque citation courte utilise-t-elle une balise
 *   <q> ? »; 9.4.2: « chaque bloc de citation utilise-t-il une balise
 *   <blockquote> ? ». A block in quotation marks is asked about as a
 *   possible block quotation (quotedBlock, 9.4.2), a passage in running
 *   text as a possible short quotation (quotedPassage, 9.4.1), one
 *   occurrence per element: whether the text quotes someone is for a
 *   person.
 * @implementation-notes
 * - Manual (cantTell).
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-quotation-review';

const meta = {
  title: 'Quotations use <q> or <blockquote>',
  description:
    'Flags paragraphs and passages of 8 words or more in quotation marks outside <q> and <blockquote>, for a person to check whether they are quotations and, if so, mark them up with <q> or <blockquote>.',
  i18n: {
    titleKey: 'quotationReview_title',
    descriptionKey: 'quotationReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const MIN_WORDS = 8;
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
  const words = (s) => s.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

  // Units whose own text is read on its own.
  const BLOCKS = new Set([
    'p',
    'div',
    'li',
    'dd',
    'dt',
    'td',
    'th',
    'caption',
    'figcaption',
    'address',
    'article',
    'section',
    'aside',
    'header',
    'footer',
    'main',
    'nav',
    'body',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'dl',
    'table',
    'tr',
    'tbody',
    'thead',
    'tfoot',
    'figure',
    'form',
    'fieldset',
    'legend',
    'details',
    'summary',
    'hr',
    'br'
  ]);
  // Blocks never reported: a heading in quotation marks is usually a title.
  const NO_REPORT = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'legend', 'summary']);
  // Subtrees whose text is left out: already marked up, code, controls,
  // and link text (often the title of a page or an article).
  const SKIP = new Set([
    'script',
    'style',
    'template',
    'noscript',
    'code',
    'kbd',
    'samp',
    'pre',
    'textarea',
    'select',
    'option',
    'button',
    'input',
    'q',
    'blockquote',
    'cite',
    'a',
    'svg',
    'math',
    'iframe',
    'object'
  ]);
  const hidden = (el) => norm(dom.getAttribute(el, 'aria-hidden')).toLowerCase() === 'true';
  function excluded(el) {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (SKIP.has(tagOf(a)) || hidden(a)) return true;
    }
    return false;
  }

  // Text of the element, nested blocks and skipped subtrees left out.
  function ownText(el) {
    let out = '';
    const walk = (node) => {
      for (let c = dom.firstChild(node); c; c = dom.nextSibling(c)) {
        const type = dom.nodeType(c);
        if (type === 3) out += dom.nodeValue(c) || '';
        else if (type === 1) {
          const t = tagOf(c);
          if (BLOCKS.has(t) || SKIP.has(t) || hidden(c)) out += ' ';
          else walk(c);
        }
      }
    };
    walk(el);
    return norm(out);
  }

  // A whole block in quotation marks, trailing punctuation allowed.
  const BLOCK_RE = /^(?:«\s*([^«»]+?)\s*»|“([^“”]+)”|"([^"]+)"|„([^„“”]+)[“”])\s*[.!?…,;:]*$/u;
  // A passage in running text.
  const PASSAGE_RE = /«\s*([^«»]+?)\s*»|“([^“”]+)”/gu;

  const occurrences = [];
  const body = dom.body(document);
  const candidates = body ? [body, ...dom.querySelectorAll(body, '*')] : [];
  for (const el of candidates) {
    const tag = tagOf(el);
    if (!BLOCKS.has(tag) || NO_REPORT.has(tag)) continue;
    const text = ownText(el);
    if (text.length < 20) continue;
    let reasonCode = null;
    let sample = '';
    const whole = BLOCK_RE.exec(text);
    if (whole) {
      const inner = norm(whole[1] || whole[2] || whole[3] || whole[4]);
      if (words(inner) >= MIN_WORDS) {
        reasonCode = 'quotedBlock';
        sample = inner;
      }
    }
    if (!reasonCode) {
      PASSAGE_RE.lastIndex = 0;
      for (let m = PASSAGE_RE.exec(text); m; m = PASSAGE_RE.exec(text)) {
        const inner = norm(m[1] || m[2]);
        if (words(inner) >= MIN_WORDS) {
          reasonCode = 'quotedPassage';
          sample = inner;
          break;
        }
      }
    }
    if (!reasonCode || excluded(el) || !visible(el)) continue;
    if (sample.length > 100) sample = `${sample.slice(0, 97).trimEnd()}…`;
    const block = reasonCode === 'quotedBlock';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: block
          ? `This block is in quotation marks ("${sample}"); check whether it is a quotation.`
          : `This text has a passage in quotation marks ("${sample}"); check whether it is a quotation.`,
        hint: block
          ? 'If it quotes someone or a text, mark it up with a <blockquote> element (RGAA 9.4.2).'
          : 'If it quotes someone or a text, mark it up with a <q> element (RGAA 9.4.1).',
        i18n: {
          summaryKey: `quotationReview_summary_cantTell_${reasonCode}`,
          hintKey: `quotationReview_hint_cantTell_${reasonCode}`,
          params: { sample }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the text in quotation marks is a quotation.'
        },
        data: {
          details: { reasonCode, sample },
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
