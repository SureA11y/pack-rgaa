/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-svg-role-img
 * @atomic true
 * @summary An SVG with a text alternative must have role="img"
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to outer <svg> elements that carry a text alternative: text
 *   referenced by aria-labelledby, a non-empty aria-label, or a non-empty
 *   <title> child. An <svg> with aria-hidden="true", on itself or an
 *   ancestor, is left out (rgaa-svg-hidden-no-alternative checks it), and so is
 *   content hidden with CSS or the hidden attribute. An <svg role="img">
 *   with no alternative at all is left to svg-text-alternative-present. An
 *   <svg> that is the only content of a link or a button is left out: its
 *   alternative is the control's name, which the glossary « Image porteuse
 *   d'information » (notes 1 and 2) sends to Links (6.1), Forms (11.9) or
 *   Scripts (7.1). A page with none is notApplicable.
 * @expectation
 *   The <svg> has role="img" (RGAA 1.1.5 step 3; step 4: "Si ce n'est pas
 *   le cas, le test est invalidé"), and has an alternative from one of the
 *   sources step 5 lists: the content of its <title>, aria-labelledby or
 *   aria-label.
 *   An alternative without role="img" fails when the SVG certainly carries
 *   information: it has a caption (a <figure> with a <figcaption>), or it
 *   takes focus itself (tabindex 0 or more). Otherwise it is asked about
 *   (cantTell): an icon beside a button's text is decorative, and then it
 *   fails 1.2.4 instead, which requires aria-hidden="true" and no
 *   alternative; the 1.1.5 methodology leaves that call to a person
 *   (« déterminer si l'image est porteuse d'information »).
 *   An <svg role="img"> named by its <title> alone passes: RGAA 4.1.2
 *   added "Contenu de l'élément <title>" to step 5 (notes de révision 4.1
 *   vers 4.1.2).
 * @implementation-notes
 * - The role is read from the first token of the role attribute.
 * - aria-labelledby counts when it resolves to text.
 * - Opt-in (tag `rgaa`): WCAG does not require role="img" on a named SVG,
 *   so the rule runs only under the rgaa-4.1.2 profile, the `rgaa` tag or
 *   its own id.
 */

const id = 'rgaa-svg-role-img';

const meta = {
  title: 'SVGs with a text alternative have role="img"',
  description:
    'Checks that an <svg> named by aria-labelledby, aria-label or <title> has role="img".',
  i18n: {
    titleKey: 'svgRoleImg_title',
    descriptionKey: 'svgRoleImg_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'svg', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['missingRoleImg']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

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
  const parentOf = (el) =>
    helpers.composedParent ? helpers.composedParent(el) : dom.parentElement(el) || null;

  function insideAriaHidden(el) {
    for (let n = el; n && dom.nodeType(n) === 1; n = parentOf(n)) {
      if (trim(attr(n, 'aria-hidden')).toLowerCase() === 'true') return true;
    }
    return false;
  }

  function ariaName(el) {
    if (helpers.getAriaNameInfo) {
      try {
        const info = helpers.getAriaNameInfo(el, ctx);
        return info && info.present && trim(info.value) ? info.mechanism : '';
      } catch {}
    }
    return trim(attr(el, 'aria-label')) ? 'aria-label' : '';
  }

  // An SVG that takes focus itself, or one with a caption (criterion 1.2
  // does not apply to it): it carries information, whatever it shows.
  function certainlyInformative(svg) {
    if (/^\d+$/.test(trim(attr(svg, 'tabindex')))) return true;
    const figure = dom.closest(svg, 'figure');
    return !!(
      figure &&
      Array.from(dom.querySelectorAll(figure, ':scope > figcaption')).some((c) =>
        trim(dom.textContent(c))
      )
    );
  }

  // The only content of a link or a button: its alternative is the
  // control's name, which the glossary « Image porteuse d'information »
  // (notes 1 and 2) sends to Links (6.1), Forms (11.9) or Scripts (7.1).
  function onlyContentOfControl(svg) {
    let control = null;
    for (let a = parentOf(svg); a && dom.nodeType(a) === 1 && !control; a = parentOf(a)) {
      const tag = tagOf(a);
      const role = helpers.aria.getExplicitRole(a);
      if (role === 'link' || role === 'button') control = a;
      else if (!role && ((tag === 'a' && dom.hasAttribute(a, 'href')) || tag === 'button')) {
        control = a;
      }
    }
    if (!control) return false;
    const others = Array.from(dom.querySelectorAll(control, 'img, svg')).filter(
      (n) => n !== svg && !dom.contains(svg, n)
    );
    if (others.length) return false;
    // Text of its own, outside the SVG.
    let walker = null;
    try {
      walker = dom.createTreeWalker(dom.ownerDocument(control), control, 4, null);
    } catch {}
    if (!walker) return false;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!trim(dom.nodeValue(n))) continue;
      const p = dom.parentElement(n);
      if (!p || !dom.closest(p, 'svg')) return false;
    }
    return true;
  }

  function titleChildText(el) {
    for (const child of Array.from(dom.querySelectorAll(el, ':scope > *'))) {
      if (tagOf(child) === 'title') return trim(dom.textContent(child));
    }
    return '';
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('svg') : helpers.queryAll('svg');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;

  for (const svg of nodes) {
    if (!svg || !dom.get(svg, 'getAttribute')) continue;
    const p = dom.parentElement(svg);
    if (p && dom.get(p, 'closest') && dom.closest(p, 'svg')) continue;
    if (insideAriaHidden(svg)) continue;
    if (onlyContentOfControl(svg)) continue;

    const mechanism = ariaName(svg);
    const title = titleChildText(svg);
    if (!mechanism && !title) continue;
    applicableCount += 1;

    const isRoleImg = trim(attr(svg, 'role')).toLowerCase().split(' ')[0] === 'img';
    if (isRoleImg) continue;

    const found = [];
    if (mechanism) found.push(mechanism);
    if (title) found.push('<title>');
    const alternatives = found.join(', ');
    // An alternative does not prove the image carries information: an icon
    // beside a button's text is decorative, and then fails 1.2.4 instead
    // (aria-hidden="true", no <title>). RGAA leaves that call to a person
    // (1.1.5 methodology: « déterminer si l'image est porteuse
    // d'information »), unless the SVG has a caption or takes focus itself.
    if (!certainlyInformative(svg)) {
      cantTells.push(
        helpers.reportOccurrence(svg, {
          summary: `This <svg> has a text alternative (${alternatives}) but no role="img". If it carries information, it fails 1.1.5; if it is decorative, 1.2.4.`,
          hint: 'If the image carries information, add role="img" and name it with aria-label or aria-labelledby. If it is decorative, remove the alternative and add aria-hidden="true".',
          i18n: {
            summaryKey: 'svgRoleImg_summary_cantTell_missingRole',
            hintKey: 'svgRoleImg_hint_fail_missingRole',
            params: { alternatives }
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the image carries information or is decorative.'
          },
          data: {
            details: { reasonCode: 'missingRoleMayBeDecorative', alternatives: found },
            visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
          }
        })
      );
      continue;
    }
    fails.push(
      helpers.reportOccurrence(svg, {
        summary: `This <svg> has a text alternative (${alternatives}) but no role="img".`,
        hint: 'Add role="img" to the <svg>, and name it with aria-label or aria-labelledby. If the image is decorative, remove the alternative and add aria-hidden="true".',
        i18n: {
          summaryKey: 'svgRoleImg_summary_fail_missingRole',
          hintKey: 'svgRoleImg_hint_fail_missingRole',
          params: { alternatives }
        },
        data: {
          details: { reasonCode: 'missingRoleImg', alternatives: found },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
