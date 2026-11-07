/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-link-title-content-name
 * @atomic true
 * @summary A link's title contains the name its content gives it
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to image links and composite links (glossary « Lien image »,
 *   « Lien composite »: links whose content holds an image with a text
 *   alternative, with or without text) that have a non-empty title
 *   attribute and are included in the accessibility tree. Text links are
 *   left out: rgaa-link-label-in-name-sources already checks their title
 *   against their visible label (6.1.5). A link whose content holds hidden,
 *   CSS-generated or embedded content is left out too, since its name from
 *   content can't be read for certain. A page with none is notApplicable.
 * @expectation
 *   Glossary « Intitulé (ou nom accessible) de lien », note 2: « Un
 *   intitulé de lien sera considéré comme non-explicite dans le cas où le
 *   lien possède un attribut title dont la valeur ne reprendrait pas au
 *   moins le "nom accessible" issu du contenu du lien », since assistive
 *   technologies can be set to read the title instead of the content.
 *   Punctuation and capital letters are ignored, as 6.1.5's particular
 *   cases allow; accents are not folded.
 *   - Fails an image link (6.1.2) whose title does not contain the text
 *     alternative of its images (imageLinkTitle).
 *   - Asks about a composite link (6.1.3) whose title contains its text but
 *     not the whole name in the content's order (compositeLinkTitle): the
 *     title may still hold the text alternative of its images elsewhere,
 *     which the pack reads as repeating the name. Note 2 makes no exception
 *     for an icon. A title that drops the text fails 6.1.5 already.
 *   - Asks, rather than failing, when the alternative is a single
 *     character, which may be a symbol the title names by its function.
 * @implementation-notes
 * - The content is walked as rendered (the flat tree), as in
 *   rgaa-link-content-label-present.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-link-title-content-name';

const meta = {
  title: "A link's title contains the name its content gives it",
  description:
    'Fails an image link whose title does not repeat the text alternative of its image, and asks about a composite link whose title drops it, as the RGAA glossary « Intitulé de lien », note 2, requires.',
  i18n: {
    titleKey: 'linkTitleContentName_title',
    descriptionKey: 'linkTitleContentName_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'links', 'name', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['imageLinkTitle', 'compositeLinkTitle', 'symbolAlternative'],
  review: {
    compositeLinkTitle: {
      steps: [
        'Find the link the report names: it holds text and an image, and has a title attribute.',
        "Read the title, the link's text and the text alternative of its image.",
        'Check whether the title also contains the text alternative of the image, wherever it is placed.'
      ],
      passWhen:
        "The title contains both the link's text and the text alternative of its image, in any order, punctuation and capital letters aside: the pack reads note 2's « reprendre au moins » as holding each part of the name, not their order.",
      failWhen:
        "The title leaves out the text alternative of the image, so it does not repeat at least the name the link's content gives it (glossary « Intitulé de lien », note 2) and the link is not explicit, which fails RGAA 6.1.3."
    },
    symbolAlternative: {
      steps: [
        'Find the image link the report names: the text alternative of its image is one character.',
        'Look at the image, and decide whether the character is a symbol, such as ">" for next, or literal text.',
        "Read the link's title."
      ],
      passWhen:
        "The character is a symbol and the title says what it means: the pack applies 6.1.5's particular case for symbols to the title, which then gives the name from the content by its function.",
      failWhen:
        "The title does not say what the symbol means, or does not repeat a character that is literal text, so the link's name is not explicit, which fails RGAA 6.1.2."
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, window, helpers, rule } = ctx;
  const win = window || (document && dom.defaultView(document)) || null;

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Punctuation and capital letters are ignored (6.1.5's particular cases).
  function fold(s) {
    return norm(
      String(s == null ? '' : s)
        .toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, ' ')
    );
  }
  function attr(el, name) {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  }
  function tagOf(el) {
    return String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  }
  function roleOf(el) {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  }
  function styleOf(el, pseudo) {
    if (!win || typeof win.getComputedStyle !== 'function') return null;
    try {
      return win.getComputedStyle(el, pseudo || null);
    } catch {
      return null;
    }
  }
  function isNotRendered(el) {
    if (dom.hasAttribute(el, 'hidden')) return true;
    const cs = styleOf(el);
    return !!(cs && cs.display === 'none');
  }
  function isVisibilityHidden(el) {
    const cs = el ? styleOf(el) : null;
    return !!(cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse'));
  }
  function hasLayout() {
    const probe = dom.documentElement(document) || dom.body(document) || null;
    if (!probe || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }
  const pseudoSupported = hasLayout();
  function hasGeneratedContent(el) {
    if (!pseudoSupported) return false;
    for (const pseudo of ['::before', '::after']) {
      const cs = styleOf(el, pseudo);
      const c = cs ? String(cs.content || '').trim() : '';
      if (!c || c === 'none' || c === 'normal' || c === '""' || c === "''") continue;
      return true;
    }
    return false;
  }
  function idRefText(el, value) {
    const parts = [];
    for (const ref of String(value || '')
      .split(/\s+/)
      .filter(Boolean)) {
      let target = null;
      try {
        target = helpers.getElementByIdInTree(el, ref);
      } catch {}
      if (target) parts.push(norm(dom.textContent(target)));
    }
    return norm(parts.join(' '));
  }
  function isImage(el) {
    const tag = tagOf(el);
    return tag === 'img' || tag === 'svg' || roleOf(el) === 'img';
  }
  // The image's text alternative (glossary « Alternative textuelle
  // (image) »); for <svg>, its <title> child and <text> content.
  function imageAlternative(el) {
    const tag = tagOf(el);
    const aria = idRefText(el, attr(el, 'aria-labelledby')) || norm(attr(el, 'aria-label'));
    if (aria) return aria;
    if (tag === 'img') return norm(attr(el, 'alt')) || norm(attr(el, 'title'));
    if (tag === 'svg') {
      const parts = [];
      for (const child of [...dom.querySelectorAll(el, ':scope > *')]) {
        if (tagOf(child) === 'title') parts.push(norm(dom.textContent(child)));
      }
      for (const t of [...dom.querySelectorAll(el, 'text')]) {
        parts.push(norm(dom.textContent(t)));
      }
      return norm(parts.join(' '));
    }
    return '';
  }
  function renderedChildren(node) {
    try {
      const shadow = dom.nodeType(node) === 1 ? dom.shadowRoot(node) : null;
      if (shadow) return [...(dom.childNodes(shadow) || [])];
      if (dom.nodeType(node) === 1 && tagOf(node) === 'slot') {
        const assigned = [...(dom.assignedNodes(node, { flatten: true }) || [])];
        if (assigned.length) return assigned;
      }
    } catch {}
    return [...(dom.childNodes(node) || [])];
  }

  const EMBEDDED = new Set([
    'iframe',
    'frame',
    'video',
    'audio',
    'input',
    'select',
    'textarea',
    'meter',
    'progress',
    'object',
    'embed',
    'canvas'
  ]);

  // The link's name from content, in order, with its text and its image
  // alternatives apart; unclear when the content can't be read for certain.
  function contentName(root) {
    const out = { parts: [], text: [], alts: [], unclear: hasGeneratedContent(root) };
    function walk(node, depth) {
      if (depth > 200 || out.unclear) return;
      for (const child of renderedChildren(node)) {
        if (dom.nodeType(child) === 3) {
          const t = norm(dom.nodeValue(child));
          if (!t || isVisibilityHidden(dom.parentElement(child))) continue;
          out.parts.push(t);
          out.text.push(t);
          continue;
        }
        if (dom.nodeType(child) !== 1) continue;
        const tag = tagOf(child);
        if (['script', 'style', 'template', 'title', 'desc'].includes(tag)) continue;
        if (isNotRendered(child)) continue;
        if (String(attr(child, 'aria-hidden') || '').trim() === 'true') {
          // Hidden text that is seen leaves the name unclear.
          if (norm(dom.textContent(child))) out.unclear = true;
          continue;
        }
        if (hasGeneratedContent(child)) out.unclear = true;
        if (isImage(child)) {
          const alt = imageAlternative(child);
          if (alt) {
            out.parts.push(alt);
            out.alts.push(alt);
          }
          continue;
        }
        if (EMBEDDED.has(tag)) {
          out.unclear = true;
          continue;
        }
        if (norm(attr(child, 'aria-label')) || norm(attr(child, 'aria-labelledby'))) {
          out.unclear = true;
        }
        walk(child, depth + 1);
      }
    }
    walk(root, 0);
    return out;
  }

  function isLink(el) {
    const tag = tagOf(el);
    const role = roleOf(el);
    if (tag === 'a' && dom.hasAttribute(el, 'href')) {
      return !role || role === 'link' || role === 'none' || role === 'presentation';
    }
    return role === 'link';
  }
  function isIncluded(el) {
    const r = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible
        ? helpers.isAccTreeEligible(el, ctx)
        : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  const SUMMARY = {
    imageLinkTitle:
      'The title of this image link ("{{title}}") does not contain the text alternative of its image ("{{name}}").',
    compositeLinkTitle:
      'The title of this link ("{{title}}") contains its text but not the text alternative of its image ("{{name}}").',
    symbolAlternative:
      'The title of this image link ("{{title}}") does not contain its image\'s one-character alternative ("{{name}}"), which may be a symbol.'
  };
  const HINT = {
    imageLinkTitle:
      "Make the title repeat at least the image's text alternative, or remove the title: assistive technologies can be set to read the title instead of the content (RGAA 6.1, glossary « Intitulé de lien », note 2).",
    compositeLinkTitle:
      "Make the title repeat the image's text alternative too, or remove the title: the title must repeat at least the name the link's content gives it (RGAA 6.1, glossary « Intitulé de lien », note 2).",
    symbolAlternative:
      "Check that the title says what the symbol means; otherwise make it repeat the image's text alternative (RGAA 6.1, glossary « Intitulé de lien », note 2)."
  };
  const fill = (s, p) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => p[k]);

  const fails = [];
  const cantTells = [];
  let applicable = 0;
  const seen = new Set();
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('a, [role]')
    : helpers.queryAll('a, [role]');

  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isLink(el)) continue;
    const title = norm(attr(el, 'title'));
    if (!title || !isIncluded(el)) continue;
    const c = contentName(el);
    if (c.unclear || !c.alts.length) continue;
    const t = fold(title);
    const composite = c.text.length > 0;
    // A title that drops the text of a composite link fails 6.1.5 already.
    if (composite && !` ${t} `.includes(` ${fold(c.text.join(' '))} `)) continue;
    applicable += 1;
    const name = norm(c.parts.join(' '));
    if (` ${t} `.includes(` ${fold(name)} `)) continue;

    let kind = 'imageLinkTitle';
    if (composite) {
      kind = 'compositeLinkTitle';
    } else if (fold(name).replace(/\s/g, '').length <= 1) {
      kind = 'symbolAlternative';
    }
    const params = { title, name: composite ? norm(c.alts.join(' ')) : name };
    const list = kind === 'imageLinkTitle' ? fails : cantTells;
    list.push(
      helpers.reportOccurrence(el, {
        summary: fill(SUMMARY[kind], params),
        hint: HINT[kind],
        i18n: {
          summaryKey: `linkTitleContentName_summary_${kind}`,
          hintKey: `linkTitleContentName_hint_${kind}`,
          params
        },
        ...(list === cantTells
          ? {
              uncertainty: {
                code: 'judgement-required',
                needed: "Whether the title must repeat the image's text alternative."
              }
            }
          : {}),
        data: {
          details: { reasonCode: kind, ...params, test: composite ? '6.1.3' : '6.1.2' },
          visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicable === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious')
  };
}

module.exports = { id, meta, runInPage };
