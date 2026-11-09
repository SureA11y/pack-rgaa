/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-cryptic-content-review
 * @atomic true
 * @summary Cryptic content (ASCII art, emoticons) has a title or is defined by its context
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible cryptic content, as RGAA 13.5 lists it: text
 *   emoticons (« :-) », « ;) », « :D », « <3 »), emoji, and ASCII art (a
 *   <pre> of three lines or more mostly made of signs). Content inside
 *   code (<code>, <kbd>, <samp>), hidden with aria-hidden="true", or given
 *   a name by role="img" with aria-label or aria-labelledby is left out. A
 *   page with none is notApplicable.
 * @expectation
 *   RGAA 13.5.1: each cryptic content has « un attribut title » or « une
 *   définition est donnée par le contexte adjacent ». Any without a title
 *   is asked about, one occurrence per element (emoticon, emoji, asciiArt):
 *   whether the text next to it defines it is for a person. One with a title
 *   on itself or its parent is reported apart (titleOnly), which RGAA's map
 *   counts toward no test (its title's relevance is 13.6.1's): a standard
 *   that doesn't accept a title, such as RAWeb 1.1, asks about it. Screen readers
 *   read an emoji by its Unicode name, which may not say what is meant.
 * @implementation-notes
 * - Manual (cantTell).
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-cryptic-content-review';

const meta = {
  title: 'Cryptic content has a title or is defined by its context',
  description:
    'Flags text emoticons, emoji and ASCII art with no title, for a person to check that the text next to them says what they mean, and, apart, those whose meaning only a title may give.',
  i18n: {
    titleKey: 'crypticContentReview_title',
    descriptionKey: 'crypticContentReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'content', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['emoticon', 'emoji', 'asciiArt', 'titleOnly'],
  review: {
    emoticon: {
      steps: [
        'Find the emoticon the report names, on screen.',
        'Read the text immediately before and after it.',
        'Decide whether that text says what it means.'
      ],
      passWhen: 'The text immediately before or after it says what it means.',
      failWhen:
        'Nothing next to it says what it means, and it has no title, which fails RGAA 13.5.1.'
    },
    emoji: {
      steps: [
        'Find the emoji the report names, on screen.',
        'Read the text immediately before and after it.',
        'Decide whether that text says what it means.'
      ],
      passWhen: 'The text immediately before or after it says what it means.',
      failWhen:
        'Nothing next to it says what it means, and it has no title, which fails RGAA 13.5.1.'
    },
    titleOnly: {
      steps: [
        'Find the cryptic content the report names, on screen, and the title it has.',
        'Read the text immediately before and after it, leaving the title aside.',
        'Decide whether that text says what it means, or whether its meaning is given another way assistive technologies render, such as an accessible name.'
      ],
      passWhen: 'The text next to it, or a way assistive technologies render, says what it means.',
      failWhen:
        'Only its title says what it means, which a standard that does not accept a title for cryptic content, such as RAWeb 1.1 (13.5.1), fails.'
    },
    asciiArt: {
      steps: [
        'Find the ASCII art the report names, on screen.',
        'Read the text immediately before and after it.',
        'Decide whether that text says what it means.'
      ],
      passWhen: 'The text immediately before or after it says what it means.',
      failWhen:
        'Nothing next to it says what it means, and it has no title, which fails RGAA 13.5.1.'
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
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };
  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }

  const EMOTICON =
    /(?:^|[\s(])(?:[:;=8][-'^o]?[)(DPpOo3\]\[/\\|*]+|\^\^|x[Dd]|<3|:'\()(?=$|[\s.,!?)])/;
  // Characters shown as emoji, not text signs such as © or ™.
  const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;
  const SKIP = new Set([
    'script',
    'style',
    'template',
    'noscript',
    'code',
    'kbd',
    'samp',
    'textarea'
  ]);

  function excluded(el) {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (SKIP.has(tagOf(a))) return true;
      if (norm(dom.getAttribute(a, 'aria-hidden')).toLowerCase() === 'true') return true;
      if (
        roleOf(a) === 'img' &&
        (norm(dom.getAttribute(a, 'aria-label')) || norm(dom.getAttribute(a, 'aria-labelledby')))
      ) {
        return true;
      }
    }
    return false;
  }
  const titled = (el) =>
    !!norm(dom.getAttribute(el, 'title')) ||
    !!(dom.parentElement(el) && norm(dom.getAttribute(dom.parentElement(el), 'title')));

  const occurrences = [];
  const seen = new Set();
  function ask(el, kind, sample) {
    if (seen.has(el)) return;
    seen.add(el);
    // Content with a title: reported apart, for the standards that don't
    // accept one.
    if (titled(el)) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This content holds cryptic content ("${sample}") whose meaning only its title may give.`,
          hint: 'A title is not read by every assistive technology: say what it means in the text next to it, or give it an accessible name.',
          i18n: {
            summaryKey: 'crypticContentReview_summary_cantTell_titleOnly',
            hintKey: 'crypticContentReview_hint_cantTell_titleOnly',
            params: { sample }
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the meaning is given other than by the title.'
          },
          data: {
            details: { reasonCode: 'titleOnly', kind, sample },
            visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
          }
        })
      );
      return;
    }
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This content holds ${kind === 'asciiArt' ? 'ASCII art' : kind === 'emoji' ? 'an emoji' : 'an emoticon'} ("${sample}") with no title.`,
        hint: 'Check that the text next to it says what it means, or give it a title; for an emoji, role="img" with an aria-label names it (RGAA 13.5.1).',
        i18n: {
          summaryKey: `crypticContentReview_summary_cantTell_${kind}`,
          hintKey: 'crypticContentReview_hint_cantTell',
          params: { sample }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the adjacent text defines the cryptic content.'
        },
        data: {
          details: { reasonCode: kind, sample },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  // ASCII art: a <pre> of three lines or more, mostly signs.
  for (const pre of [...dom.querySelectorAll(document, 'pre')]) {
    if (excluded(pre) || !visible(pre)) continue;
    if (dom.querySelectorAll(pre, 'code, kbd, samp').length) continue;
    const raw = String(dom.textContent(pre) || '');
    const lines = raw.split('\n').filter((l) => l.trim());
    const chars = raw.replace(/\s/g, '');
    const signs = chars.replace(/[\p{L}\p{N}]/gu, '');
    if (lines.length >= 3 && chars.length && signs.length / chars.length >= 0.6) {
      ask(pre, 'asciiArt', norm(lines[0]).slice(0, 30));
    }
  }

  const body = dom.body(document);
  let walker = null;
  try {
    walker = body ? dom.createTreeWalker(document, body, 4, null) : null;
  } catch {}
  for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
    const t = String(dom.nodeValue(n) || '');
    if (!t.trim()) continue;
    const p = dom.parentElement(n);
    if (!p || tagOf(p) === 'pre' || seen.has(p)) continue;
    const emoticon = EMOTICON.exec(t);
    const emoji = !emoticon && EMOJI.exec(t);
    if (!emoticon && !emoji) continue;
    if (excluded(p) || !visible(p)) continue;
    ask(p, emoticon ? 'emoticon' : 'emoji', norm(emoticon ? emoticon[0] : emoji[0]));
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
