/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-img-alt-present
 * @atomic true
 * @summary An <img> that certainly carries information must have an alt attribute
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <img> elements included in the accessibility tree, as
 *   img-alt-present does: role="presentation" or role="none" leaves an image
 *   out only when it is not focusable, and hidden images are left out. A
 *   spacer with no alt, or an alt of only spaces, is left out too: an image
 *   2 px wide or high, or less, as rendered
 *   or, with no layout, by its width or height attribute, unless it is in a
 *   <figure> with a <figcaption>. An image that is the only content of a
 *   link or a button is left out: its alternative is the control's name,
 *   which the glossary « Image porteuse d'information » (notes 1 and 2)
 *   sends to Links (6.1), Forms (11.9) or Scripts (7.1). A page with none
 *   is notApplicable.
 * @expectation
 *   Each applicable <img> has an alt attribute (alt="" included), a
 *   non-empty aria-label or aria-labelledby, or a non-empty title. RGAA
 *   1.1.1 asks each image carrying information for a text alternative, and
 *   1.2.1 asks each decorative one for alt="", so an image with none of
 *   these fails one of the two, depending on what it is:
 *   - it fails 1.1.1 when it certainly carries information: it has a
 *     caption (a <figure> with a <figcaption>), it is an image map (usemap
 *     or ismap), or it takes focus (tabindex 0 or more);
 *   - otherwise it is asked about (cantTell), since it may be decorative
 *     (glossary « Image de décoration »: « Une image précédant chaque item
 *     d'une liste »), and the 1.1.x methodology leaves that call to a
 *     person; rgaa-img-no-alt-decorative asks the 1.2.1 side.
 *   A spacer carries no information, so it is decorative, and the alt=""
 *   it lacks is 1.2.1's matter, which rgaa-img-no-alt-decorative fails.
 * @implementation-notes
 * - img-alt-present, the WCAG rule, fails every such image, spacers
 *   included, as WCAG 1.1.1 covers decorative images too. RGAA splits them:
 *   1.1 for images carrying information, 1.2 for decorative ones. Linked to
 *   1.1.1, img-alt-present failed a spacer under 1.1 as well as
 *   rgaa-img-no-alt-decorative under 1.2. This rule takes 1.1.1 instead.
 * - The spacer test is rgaa-img-no-alt-decorative's: a rendered size of 0
 *   by 0 (an image not loaded yet) says nothing, so it is not a spacer.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-img-alt-present';

const meta = {
  title: 'Images that are not spacers have an alt attribute',
  description:
    'Checks that each exposed <img> has an alt attribute or another text alternative, except a spacer image, which is decorative.',
  i18n: {
    titleKey: 'imgAltPresent_title',
    descriptionKey: 'imgAltPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['missingAlt', 'blankAlt', 'noAltMayBeDecorative', 'blankAltMayBeDecorative'],
  review: {
    noAltMayBeDecorative: {
      steps: [
        'Find the image the report names: it has no alt attribute and no other text alternative.',
        'Look at it on screen, with the text around it.',
        'Decide whether it carries information, or only decorates: would a person miss anything if it were gone?'
      ],
      passWhen:
        'The image only decorates, so RGAA 1.1.1 does not apply to it; RGAA 1.2.1 then asks it for alt="".',
      failWhen: 'The image carries information and has no text alternative, which fails RGAA 1.1.1.'
    },
    blankAltMayBeDecorative: {
      steps: [
        'Find the image the report names: its alt holds only spaces, and it has no other text alternative.',
        'Look at it on screen, with the text around it.',
        'Decide whether it carries information, or only decorates: would a person miss anything if it were gone?'
      ],
      passWhen:
        'The image only decorates, so RGAA 1.1.1 does not apply to it; RGAA 1.2.1 then asks it for an alt with nothing in it, alt="".',
      failWhen: 'The image carries information and its alt says nothing, which fails RGAA 1.1.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  // An image this many px wide or high, or less, is a spacer.
  const SPACER = 2;

  const trim = (v) =>
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

  function inAccTree(el) {
    const check =
      typeof helpers.isIncludedInAccessibilityTree === 'function'
        ? helpers.isIncludedInAccessibilityTree
        : typeof helpers.isAccTreeEligible === 'function'
          ? helpers.isAccTreeEligible
          : null;
    if (!check) return true;
    let r;
    try {
      r = check(el, ctx);
    } catch {
      return true;
    }
    if (r === false) return false;
    return !(r && r.eligible === false);
  }

  function focusable(el) {
    if (typeof helpers.getFocusableInfo !== 'function') return false;
    try {
      const fi = helpers.getFocusableInfo(el, ctx);
      return !!(fi && (fi.focusable || fi.tabbable));
    } catch {
      return false;
    }
  }

  function ariaNamed(el) {
    if (typeof helpers.getAriaNameInfo === 'function') {
      try {
        const info = helpers.getAriaNameInfo(el, ctx);
        if (info && info.present) return true;
      } catch {}
    }
    return false;
  }

  function hasLayout() {
    const probe = dom.documentElement(document) || null;
    if (!probe || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }

  function hasCaption(el) {
    const figure = dom.get(el, 'closest') ? dom.closest(el, 'figure') : null;
    if (!figure) return false;
    return [...dom.querySelectorAll(figure, ':scope > *')].some((c) => tagOf(c) === 'figcaption');
  }

  // Whether the image is the only content of a link or button.
  function onlyContentOfControl(el) {
    let control = null;
    for (let a = dom.parentElement(el); a && !control; a = dom.parentElement(a)) {
      const tag = tagOf(a);
      const role = helpers.aria.getExplicitRole(a);
      if (role === 'link' || role === 'button') control = a;
      else if (!role && ((tag === 'a' && dom.hasAttribute(a, 'href')) || tag === 'button')) {
        control = a;
      }
    }
    if (!control) return false;
    if (trim(dom.textContent(control))) return false;
    return ![...dom.querySelectorAll(control, 'img, svg, [role~="img" i]')].some(
      (n) =>
        n !== el && (['img', 'svg'].includes(tagOf(n)) || helpers.aria.getExplicitRole(n) === 'img')
    );
  }

  // The image's size as rendered, or by its attributes with no layout.
  function size(el, layout) {
    if (layout) {
      try {
        const r = dom.getBoundingClientRect(el);
        return { width: r.width, height: r.height };
      } catch {
        return null;
      }
    }
    const n = (name) => {
      const v = /^\s*(\d+(?:\.\d+)?)\s*(px)?\s*$/i.exec(String(attr(el, name) || ''));
      return v ? Number(v[1]) : null;
    };
    return { width: n('width'), height: n('height') };
  }

  const isSpacer = (s) =>
    !!s &&
    [s.width, s.height].some((d) => d != null && d <= SPACER) &&
    // Rendered at 0 by 0, an image says nothing about its size.
    !(s.width === 0 && s.height === 0);

  // Optimal string alignment distance: a transposition counts as one edit.
  function distance(a, b) {
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
  }

  // An attribute written close to alt (atl, al, alt-text), which browsers
  // do not read: the image reads as having no alt, and the hint names it.
  const IMG_ATTRS = new Set(
    (
      'src srcset sizes width height class id style title usemap ismap loading decoding ' +
      'role lang dir crossorigin referrerpolicy fetchpriority name align border hspace ' +
      'vspace longdesc tabindex hidden draggable alt'
    ).split(' ')
  );
  function misspelledAlt(el) {
    const attrs = dom.attributes(el) || [];
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (!name || IMG_ATTRS.has(name) || /^(aria|data)-/.test(name)) continue;
      const bare = name.replace(/[-_:]/g, '');
      if (distance(name, 'alt') <= 1 || /^alt(text|ernative|e)?$/.test(bare)) {
        const value = trim(attrs[i].value);
        return { attribute: name, value: value.length > 60 ? `${value.slice(0, 59)}…` : value };
      }
    }
    return null;
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('img') : helpers.queryAll('img');
  const layout = hasLayout();

  const occurrences = [];
  const questions = [];
  let applicableCount = 0;

  // An image that carries information whatever it shows: a captioned image
  // (criterion 1.2 does not apply to it), an image map, or an image that
  // takes focus itself.
  function certainlyInformative(el) {
    if (hasCaption(el)) return true;
    if (dom.hasAttribute(el, 'usemap') || dom.hasAttribute(el, 'ismap')) return true;
    const tabindex = trim(attr(el, 'tabindex'));
    return /^\d+$/.test(tabindex);
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!inAccTree(el)) continue;
    const role = helpers.aria.getExplicitRole(el);
    if ((role === 'presentation' || role === 'none') && !focusable(el)) continue;
    // The only content of a link or a button: its alternative is the
    // control's name, which the glossary « Image porteuse d'information »
    // (notes 1 and 2) sends to Links (6.1), Forms (11.9) or Scripts (7.1).
    if (onlyContentOfControl(el)) continue;
    // alt="" marks a decorative image; an alt of only spaces names nothing.
    const alt = attr(el, 'alt');
    const blank = alt != null && alt !== '' && !trim(alt);
    // A spacer is decorative: rgaa-img-no-alt-decorative fails it under 1.2.1,
    // with no alt or an alt of only spaces.
    if ((alt == null || blank) && !hasCaption(el) && isSpacer(size(el, layout))) {
      continue;
    }
    applicableCount += 1;

    if (alt === '' || (alt != null && trim(alt))) continue;
    if (ariaNamed(el)) continue;
    if (trim(attr(el, 'title'))) continue;
    const misspelled = blank ? null : misspelledAlt(el);
    const misspelledHint = misspelled
      ? `It has ${misspelled.attribute}="${misspelled.value}", but browsers do not read ${misspelled.attribute}: did you mean alt? Rename the attribute.`
      : '';

    // Only an image that certainly carries information fails 1.1.1: one
    // that may be decorative (glossary « Image de décoration »: « Une image
    // précédant chaque item d'une liste ») fails 1.2.1 instead, and RGAA
    // leaves that call to a person (« déterminer si l'image est porteuse
    // d'information »).
    if (!certainlyInformative(el)) {
      questions.push(
        helpers.reportOccurrence(el, {
          summary: blank
            ? 'This <img> has an alt of only spaces. If it carries information, it fails 1.1.1; if it is decorative, 1.2.1.'
            : 'This <img> has no alt attribute. If it carries information, it fails 1.1.1; if it is decorative, 1.2.1.',
          hint:
            misspelledHint ||
            'If the image carries information, give it an alt that says what it shows. If it is decorative, give it an empty alt (alt="").',
          i18n: {
            summaryKey: blank
              ? 'imgAltPresent_summary_cantTell_blank'
              : 'imgAltPresent_summary_cantTell',
            hintKey: misspelled ? 'imgAltPresent_hint_misspelled' : 'imgAltPresent_hint_cantTell',
            params: misspelled || {}
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the image carries information or is decorative.'
          },
          data: {
            details: {
              reasonCode: blank ? 'blankAltMayBeDecorative' : 'noAltMayBeDecorative',
              ...(misspelled ? { misspelledAttribute: misspelled.attribute } : {})
            },
            visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
          }
        })
      );
      continue;
    }

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: blank
          ? 'This <img> has an alt of only spaces.'
          : 'This <img> has no alt attribute.',
        hint:
          misspelledHint ||
          'Add an alt attribute that says what the image shows, or alt="" if the image is decorative.',
        i18n: {
          summaryKey: blank ? 'imgAltPresent_summary_blank' : 'imgAltPresent_summary_fail',
          hintKey: misspelled ? 'imgAltPresent_hint_misspelled' : 'imgAltPresent_hint_fail',
          params: misspelled || {}
        },
        data: {
          details: {
            reasonCode: blank ? 'blankAlt' : 'missingAlt',
            ...(misspelled ? { misspelledAttribute: misspelled.attribute } : {})
          },
          visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length || questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(occurrences, questions, rule.defaultSeverity || 'serious')
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
