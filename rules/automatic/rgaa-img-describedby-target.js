/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-img-describedby-target
 * @atomic true
 * @summary An image's aria-describedby points to its detailed description
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to images exposed to assistive technologies (<img>, <input
 *   type="image">, <area href>, <object>, <embed>, outer <svg>, <canvas>,
 *   role="img") that carry a non-empty aria-describedby. Decorative images
 *   (alt="", role="presentation" or "none", or inside aria-hidden="true")
 *   are left out. A page with none is notApplicable.
 * @expectation
 *   RGAA 1.6.9: for each image « qui utilise un attribut WAI-ARIA
 *   aria-describedby, l'attribut WAI-ARIA aria-describedby associe-t-il
 *   la description détaillée ? »
 *   - It fails when none of the ids it lists exists in the page
 *     (targetMissing): it associates nothing.
 *   - It asks (cantTell) when some ids exist and others do not
 *     (someTargetsMissing), and when the passages it points to hold no
 *     text (emptyDescription).
 *   - Whether the passage it points to is the detailed description is left
 *     to a person, as 1.6 is.
 * @implementation-notes
 * - Ids are looked up in the image's own tree (document or shadow root).
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-img-describedby-target';

const meta = {
  title: "An image's aria-describedby points to its description",
  description:
    'Fails an image whose aria-describedby lists only ids that do not exist; asks when some are missing or the passages are empty.',
  i18n: {
    titleKey: 'imgDescribedbyTarget_title',
    descriptionKey: 'imgDescribedbyTarget_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'aria', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['targetMissing', 'someTargetsMissing', 'emptyDescription'],
  review: {
    someTargetsMissing: {
      steps: [
        'Find the image the report names, and read the ids in its aria-describedby; the report says which ones point to nothing.',
        'Decide whether the image carries information and has a detailed description on the page.',
        'If it does, check that the ids that exist point to that description, and listen to the image with a screen reader.'
      ],
      passWhen:
        'The image has no detailed description, so RGAA 1.6.9 does not apply; or aria-describedby points to its detailed description and a screen reader reads it.',
      failWhen:
        'The image has a detailed description, and aria-describedby does not point to it or a screen reader does not read it, which fails RGAA 1.6.9.'
    },
    emptyDescription: {
      steps: [
        'Find the image the report names, and the passage its aria-describedby points to: it holds no text.',
        'Use the page as a visitor would, and check whether a script fills the passage, for instance when a panel opens.',
        'Listen to the image with a screen reader.'
      ],
      passWhen:
        'The passage holds the image’s detailed description once the page is in use and a screen reader reads it; or the image has no detailed description, so RGAA 1.6.9 does not apply.',
      failWhen:
        'The image has a detailed description, but the passage aria-describedby points to stays empty, so aria-describedby does not associate it, which fails RGAA 1.6.9.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const attr = (el, name) => {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  };

  function insideAriaHidden(el) {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (
        String(attr(a, 'aria-hidden') || '')
          .trim()
          .toLowerCase() === 'true'
      )
        return true;
    }
    return false;
  }

  function isImage(el) {
    const tag = tagOf(el);
    if (roleOf(el) === 'img') return true;
    if (tag === 'input') return String(attr(el, 'type') || '').toLowerCase() === 'image';
    if (tag === 'area') return dom.hasAttribute(el, 'href');
    if (tag === 'svg') {
      const p = dom.parentElement(el);
      return !(p && dom.closest(p, 'svg'));
    }
    return ['img', 'object', 'embed', 'canvas'].includes(tag);
  }

  function decorative(el) {
    if (['presentation', 'none'].includes(roleOf(el))) return true;
    if (tagOf(el) === 'img' && attr(el, 'alt') === '' && !roleOf(el)) return true;
    return insideAriaHidden(el);
  }

  function lookup(el, ref) {
    try {
      if (helpers.getElementByIdInTree) return helpers.getElementByIdInTree(el, ref);
    } catch {}
    try {
      const root = dom.getRootNode(el);
      return root && dom.get(root, 'getElementById') ? dom.getElementById(root, ref) : null;
    } catch {
      return null;
    }
  }

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

  // An id of the page close to `ref`: the same once case or a leading # is
  // set aside, or within two edits (one for a short id, none for one of one
  // or two characters). '' when there is none.
  function nearId(el, ref) {
    let root = null;
    try {
      root = dom.getRootNode(el);
    } catch {}
    const written = ref.replace(/^#/, '');
    let best = '';
    let bestDistance = Infinity;
    const withId =
      root && dom.get(root, 'querySelectorAll') ? [...dom.querySelectorAll(root, '[id]')] : [];
    for (const n of withId) {
      const candidate = String(attr(n, 'id') || '');
      if (!candidate) continue;
      const d =
        candidate.toLowerCase() === written.toLowerCase() ? 0 : distance(candidate, written);
      const limit = written.length > 5 ? 2 : written.length > 2 ? 1 : 0;
      if (d < bestDistance && d <= limit) {
        best = candidate;
        bestDistance = d;
      }
    }
    return best;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[aria-describedby]')
    : helpers.queryAll('[aria-describedby]');

  const fails = [];
  const cantTells = [];
  let applicable = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute') || !isImage(el) || decorative(el)) continue;
    const refs = String(attr(el, 'aria-describedby') || '')
      .split(/\s+/)
      .filter(Boolean);
    if (!refs.length) continue;
    applicable += 1;
    const found = refs.map((r) => lookup(el, r));
    const missing = refs.filter((r, i) => !found[i]);
    const value = refs.join(' ');
    const params = { value, missing: missing.join(' ') };
    if (missing.length === refs.length) {
      // The id the image likely means, when one of the page is close.
      const suggestion = nearId(el, refs[0]);
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This image's aria-describedby="${value}" points to no element of the page: it associates no description.`,
          hint: suggestion
            ? `Did you mean "${suggestion}"? An element of the page has that id. Point aria-describedby at it, exactly as written, case included (RGAA 1.6.9).`
            : 'Point aria-describedby at the id of the passage that holds the detailed description, or remove it (RGAA 1.6.9).',
          i18n: {
            summaryKey: 'imgDescribedbyTarget_summary_fail',
            hintKey: suggestion
              ? 'imgDescribedbyTarget_hint_fail_suggest'
              : 'imgDescribedbyTarget_hint_fail',
            params: suggestion ? { ...params, suggestion } : params
          },
          data: {
            details: {
              reasonCode: 'targetMissing',
              ...params,
              ...(suggestion ? { suggestion } : {})
            },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }
    const empty = found.filter(Boolean).every((t) => !String(dom.textContent(t) || '').trim());
    if (!missing.length && !empty) continue;
    const kind = missing.length ? 'someTargetsMissing' : 'emptyDescription';
    cantTells.push(
      helpers.reportOccurrence(el, {
        summary: missing.length
          ? `This image's aria-describedby lists ids that do not exist: "${params.missing}".`
          : "The passages this image's aria-describedby points to hold no text.",
        hint: 'Check that aria-describedby associates the detailed description of the image (RGAA 1.6.9).',
        i18n: {
          summaryKey: `imgDescribedbyTarget_summary_cantTell_${kind}`,
          hintKey: 'imgDescribedbyTarget_hint_cantTell',
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether aria-describedby associates the detailed description.'
        },
        data: { details: { reasonCode: kind, ...params }, visibilityFilter: VF }
      })
    );
  }

  if (applicable === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
