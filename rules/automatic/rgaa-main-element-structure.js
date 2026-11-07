/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-main-element-structure
 * @atomic true
 * @summary The main content must be a <main> element, and only one <main> may be visible
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document that declares the HTML5
 *   doctype (helpers.getDoctypeInfo). RGAA 9.2 is not applicable when the
 *   declared doctype is not the HTML5 one, and a page with no doctype
 *   declares none. A run narrowed by contextSelector or
 *   engineOptions.fragment is notApplicable.
 * @expectation
 *   Steps 4 and 5 of RGAA 9.2.1:
 *   - the main content zone is structured with a <main> element. Every
 *     page has a main content zone (glossary « Zone de contenu
 *     principal »), so a page with text and no <main> element fails,
 *     whether or not it has role="main". A page with neither and no text
 *     of its own (only frames, a canvas or shadow DOM content) is asked
 *     about (cantTell), since only a person can say where its main
 *     content is. So is a page with text of its own that shows a visible
 *     <iframe> of 100 by 100 pixels or more (mainMayBeInFrame): its
 *     header, navigation and footer may sit around a frame that holds the
 *     main content, and the document the frame shows may structure it
 *     with <main>. A hidden frame, or a tracker of a few pixels, does not
 *     count, and such a page fails;
 *   - when there are several <main> elements, all but one carry the hidden
 *     attribute. Every <main> is counted, hidden or not: CSS or
 *     aria-hidden alone does not do (« l'utilisation d'un style seul
 *     restera insuffisante », 9.2 technical note). A second <main> without
 *     its own hidden attribute, hidden only inside a closed <details> or
 *     under an ancestor's hidden="until-found", fails too
 *     (revealableMain): the user opens the details, or the browser's
 *     find-in-page reveals the content, with no script, and two <main>
 *     elements are then visible at once, which the test's « une balise
 *     <main> visible unique » and the technical note's « il ne peut y
 *     avoir en permanence qu'une seule balise visible » rule out. One
 *     hidden by an ancestor's plain hidden attribute or a closed <dialog>
 *     is asked about (hiddenByAncestor): only a script shows it, and
 *     whether it ever shows beside the other <main> is for a person. It
 *     passes 9.2.1 when the script that reveals it hides the other; the
 *     missing hidden attribute still fails 8.2.1 (rgaa-html-nesting-valid,
 *     extraMain). A
 *     page whose every <main> carries hidden is asked about too.
 *   Steps 1, 2 and 6 also name the element: a zone marked with
 *   role="banner", "navigation" or "contentinfo" on another element than
 *   <header>, <nav> or <footer> fails (roleZoneOnly), unless such an
 *   element wraps it or sits inside it. Whether a page's header,
 *   navigation and footer zones are marked at all, and step 3 (<nav> kept
 *   for navigation zones), are left to a person.
 * @implementation-notes
 * - landmark-one-main and landmark-no-duplicate-main count the main
 *   landmarks exposed to assistive technologies: they accept role="main"
 *   and a second <main> hidden by CSS, and apply whatever the doctype.
 *   RGAA 9.2.1 judges the <main> element and its hidden attribute.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-main-element-structure';

const meta = {
  title: 'Main content uses one visible <main> element',
  description:
    'Checks that the main content is a <main> element and that every other <main> carries the hidden attribute, on HTML5 pages.',
  i18n: {
    titleKey: 'mainElementStructure_title',
    descriptionKey: 'mainElementStructure_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'landmarks', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  // The reason codes the rule gives, so definePack can check that `review`
  // names only these.
  reasonCodes: [
    'roleMainOnly',
    'noMain',
    'mainMayBeInFrame',
    'extraMain',
    'hiddenByAncestor',
    'revealableMain',
    'allHidden',
    'roleZoneOnly'
  ],
  // How a person answers each question the rule asks, per reason code: a few
  // steps from the element the finding names, then what they see if it
  // passes and if it fails. In English; reports show it as "How to check".
  review: {
    noMain: {
      steps: [
        'Look at the page and find its main content zone: where its main information and features are, outside menus, search and secondary zones such as ads or related news. On this page it may be a frame, a canvas or a component.',
        'Inspect the code around it for a <main> element.'
      ],
      passWhen: 'The main content zone is inside a <main> element.',
      failWhen:
        'The main content zone is not structured with a <main> element, which fails RGAA 9.2.1.'
    },
    mainMayBeInFrame: {
      steps: [
        'Find the frame the report names, and look at what it shows beside the rest of the page.',
        'Decide whether the frame holds the main content zone of the page: its main information and features, outside menus, search and secondary zones such as ads or related news.',
        'If it does, open the document the frame shows and inspect the code around that content for a <main> element.'
      ],
      passWhen:
        'The frame holds the main content zone, and the document it shows structures that zone with a <main> element.',
      failWhen:
        'The main content zone is outside the frame and not in a <main> element, or it is in the frame and the document the frame shows has no <main> around it, which fails RGAA 9.2.1.'
    },
    hiddenByAncestor: {
      steps: [
        'Find the <main> element the report names; it has no hidden attribute of its own, but is hidden by an ancestor with the hidden attribute or by a closed <dialog>, which only a script shows.',
        'Use the page as a user does, and trigger what shows this <main> (the button, tab or link that reveals its ancestor or opens its dialog).',
        'Watch the <main> that was shown before: check whether it is hidden when this one appears.'
      ],
      passWhen:
        'In normal use this <main> is never displayed at the same time as the shown one: the script that reveals it hides the other, so the page keeps a single visible <main> and passes RGAA 9.2.1. The markup still lacks the hidden attribute HTML asks for, which fails RGAA 8.2.1 through rgaa-html-nesting-valid.',
      failWhen:
        'This <main> and the shown one can be visible together, which fails RGAA 9.2.1: the test asks for « une balise <main> visible unique ».'
    },
    allHidden: {
      steps: [
        'Find the <main> elements of the page; each carries the hidden attribute.',
        'Load the page as a user does, and check whether a script shows one of them, removing its hidden attribute.'
      ],
      passWhen:
        'Once the page is shown, one <main> holds the main content and has no hidden attribute.',
      failWhen: 'The main content stays outside any shown <main> element, which fails RGAA 9.2.1.'
    }
  }
};

// A document shown in a frame is no web page of its own (RGAA's « page web »).
function applicability(ctx) {
  if (ctx.helpers.isTopLevelDocument && !ctx.helpers.isTopLevelDocument()) return false;
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const doctype = helpers.getDoctypeInfo ? helpers.getDoctypeInfo() : { kind: 'none' };
  if (doctype.kind !== 'html5') {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const query = (sel) =>
    helpers.queryAllSource ? helpers.queryAllSource(sel) : helpers.queryAll(sel);
  const mains = query('main');

  const parentOf = (n) => (helpers.composedParent ? helpers.composedParent(n) : dom.parentNode(n));
  const tagOf = (n) => String(dom.localName(n) || '').toLowerCase();

  // The ancestors that hide `el`: an ancestor with hidden, a closed
  // <details> or a closed <dialog>. `byUser` is true when each of them is
  // one the user can open without a script: a closed <details> (its
  // summary), or hidden="until-found" (the browser's find-in-page).
  function hidersOf(el) {
    const hiders = [];
    let byUser = true;
    for (let n = parentOf(el); n && dom.nodeType(n) === 1; n = parentOf(n)) {
      const tag = tagOf(n);
      if (dom.hasAttribute(n, 'hidden')) {
        hiders.push(n);
        const value = String(dom.getAttribute(n, 'hidden') || '').toLowerCase();
        if (value !== 'until-found') byUser = false;
      } else if (tag === 'details' && !dom.hasAttribute(n, 'open')) {
        hiders.push(n);
      } else if (tag === 'dialog' && !dom.hasAttribute(n, 'open')) {
        hiders.push(n);
        byUser = false;
      }
    }
    return { hidden: hiders.length > 0, byUser: hiders.length > 0 && byUser, hiders };
  }
  const hiddenByAncestor = (el) => hidersOf(el).hidden;

  // The names of the exclusive <details> groups `el` sits in: opening another
  // <details> of the group closes the one around it.
  function detailsGroups(el) {
    const names = new Set();
    for (let n = parentOf(el); n && dom.nodeType(n) === 1; n = parentOf(n)) {
      if (tagOf(n) === 'details' && dom.getAttribute(n, 'name')) {
        names.add(dom.getAttribute(n, 'name'));
      }
    }
    return names;
  }

  // Whether the page has text of its own, outside scripts, styles and
  // templates: then it has a main content zone in the light DOM.
  function hasOwnText(root) {
    if (!root) return false;
    const SKIP = ['script', 'style', 'template', 'noscript'];
    let walker;
    try {
      walker = dom.createTreeWalker(document, root, 4, null);
    } catch {
      return false;
    }
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!/\S/.test(String(dom.nodeValue(n) || ''))) continue;
      let skipped = false;
      for (let a = dom.parentNode(n); a && a !== root; a = dom.parentNode(a)) {
        if (SKIP.includes(String(dom.localName(a) || '').toLowerCase())) {
          skipped = true;
          break;
        }
      }
      if (!skipped) return true;
    }
    return false;
  }

  // The largest visible <iframe> big enough to hold a page's main content,
  // or null: a hidden frame, or a tracker or widget frame of a few pixels,
  // is not one. Without layout (no box has a size), a frame counts unless
  // its width or height attribute makes it smaller than that.
  const FRAME_MIN_PX = 100;
  function hasLayout() {
    try {
      const r = dom.getBoundingClientRect(dom.documentElement(document));
      return r.width > 0 || r.height > 0;
    } catch {
      return false;
    }
  }
  function contentFrame() {
    const layout = hasLayout();
    let best = null;
    let bestArea = -1;
    for (const el of query('iframe')) {
      if (dom.hasAttribute(el, 'hidden') || hiddenByAncestor(el)) continue;
      try {
        if (
          helpers.isDomVisibleEligible &&
          !helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible
        ) {
          continue;
        }
      } catch {}
      let width;
      let height;
      if (layout) {
        try {
          const r = dom.getBoundingClientRect(el);
          width = r.width;
          height = r.height;
        } catch {
          continue;
        }
      } else {
        const size = (name, fallback) => {
          const v = parseFloat(String(dom.getAttribute(el, name) || ''));
          return Number.isFinite(v) && !/%\s*$/.test(String(dom.getAttribute(el, name)))
            ? v
            : fallback;
        };
        width = size('width', 300);
        height = size('height', 150);
      }
      if (!(width >= FRAME_MIN_PX && height >= FRAME_MIN_PX)) continue;
      if (width * height > bestArea) {
        best = el;
        bestArea = width * height;
      }
    }
    return best;
  }

  function occurrence(el, reasonCode, outcome) {
    const texts = {
      extraMain: [
        'This <main> element is not the first one on the page and has no hidden attribute.',
        'Keep one visible <main> element. Give every other <main> the hidden attribute: CSS or aria-hidden alone is not enough.'
      ],
      roleMainOnly: [
        'The main content is marked with role="main" but the page has no <main> element.',
        'Use a <main> element for the main content.'
      ],
      noMain: [
        'The page has no <main> element and no role="main".',
        outcome === 'fail'
          ? 'Wrap the main content of the page in a <main> element.'
          : 'Check where the main content is, and wrap it in a <main> element.'
      ],
      hiddenByAncestor: [
        'This <main> element is hidden by an ancestor but has no hidden attribute of its own.',
        'Check that only one <main> can ever be visible, and give the others the hidden attribute.'
      ],
      revealableMain: [
        'This <main> element has no hidden attribute of its own, and the user can show it beside the other <main>: it is only inside a closed <details> or under hidden="until-found".',
        'Give this <main> the hidden attribute, or keep a single <main> and show other content in another element.'
      ],
      mainMayBeInFrame: [
        'The page has no <main> element, and this frame may hold its main content.',
        'Check whether the frame holds the main content zone of the page. If it does, the document it shows must structure that zone with a <main> element; if it does not, wrap the main content of the page in a <main> element.'
      ],
      allHidden: [
        'Every <main> element on the page has the hidden attribute.',
        'Check that one <main> element is shown when the page is used.'
      ]
    };
    const key = outcome === 'fail' ? 'fail' : 'cantTell';
    return helpers.reportOccurrence(el, {
      summary: texts[reasonCode][0],
      hint: texts[reasonCode][1],
      i18n: {
        summaryKey: `mainElementStructure_summary_${key}_${reasonCode}`,
        hintKey: `mainElementStructure_hint_${key}_${reasonCode}`,
        params: {}
      },
      uncertainty:
        outcome === 'cantTell'
          ? {
              code: 'judgement-required',
              needed:
                reasonCode === 'noMain' || reasonCode === 'mainMayBeInFrame'
                  ? 'Where the main content zone of the page is.'
                  : 'Whether only one <main> element is ever visible.'
            }
          : undefined,
      data: {
        details: { reasonCode },
        visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
      }
    });
  }

  // Steps 1, 2 and 6 name the elements too: a header, navigation or footer
  // zone marked with role="banner", "navigation" or "contentinfo" on
  // another element is not structured « via une balise » <header>, <nav>
  // or <footer>, unless that element wraps it or sits inside it.
  const ZONES = { banner: 'header', navigation: 'nav', contentinfo: 'footer' };
  const zoneFails = query('[role]')
    .filter((el) => {
      const role = helpers.aria.getExplicitRole(el);
      const tag = ZONES[role];
      if (!tag) return false;
      if (String(dom.localName(el) || '').toLowerCase() === tag) return false;
      return !dom.closest(el, tag) && !dom.querySelector(el, tag);
    })
    .map((el) => {
      const role = helpers.aria.getExplicitRole(el);
      const element = ZONES[role];
      const tag = String(dom.localName(el) || '').toLowerCase();
      return helpers.reportOccurrence(el, {
        summary: `This <${tag}> has role="${role}", but the zone is not structured with a <${element}> element.`,
        hint: `Structure the zone with a <${element}> element (RGAA 9.2.1): the role alone does not do.`,
        i18n: {
          summaryKey: 'mainElementStructure_summary_fail_roleZoneOnly',
          hintKey: 'mainElementStructure_hint_fail_roleZoneOnly',
          params: { tag, role, element }
        },
        data: {
          details: { reasonCode: 'roleZoneOnly', role, element },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      });
    });

  function result(outcome, occurrences) {
    if (zoneFails.length) {
      return {
        ruleId: rule.ruleId,
        ...helpers.resolveTieredOutcome(
          (outcome === 'fail' ? occurrences || [] : []).concat(zoneFails),
          outcome === 'cantTell' ? occurrences || [] : [],
          rule.defaultSeverity || 'moderate'
        )
      };
    }
    return {
      ruleId: rule.ruleId,
      outcome,
      severity: outcome === 'pass' ? 'minor' : rule.defaultSeverity || 'moderate',
      occurrences: occurrences || []
    };
  }

  if (!mains.length) {
    const roleMain = query('[role]').find((el) => helpers.aria.getExplicitRole(el) === 'main');
    if (roleMain) return result('fail', [occurrence(roleMain, 'roleMainOnly', 'fail')]);
    const body = dom.body(document) || dom.documentElement(document);
    if (!hasOwnText(body)) return result('cantTell', [occurrence(body, 'noMain', 'cantTell')]);
    // Header, navigation and footer in the page and the main content in a
    // frame: the page's text is not its main content, so ask.
    const frame = contentFrame();
    if (frame) return result('cantTell', [occurrence(frame, 'mainMayBeInFrame', 'cantTell')]);
    return result('fail', [occurrence(body, 'noMain', 'fail')]);
  }

  const withoutOwnHidden = mains.filter((el) => !dom.hasAttribute(el, 'hidden'));
  const shown = withoutOwnHidden.filter((el) => !hiddenByAncestor(el));

  if (shown.length > 1) {
    return result(
      'fail',
      shown.slice(1).map((el) => occurrence(el, 'extraMain', 'fail'))
    );
  }
  if (withoutOwnHidden.length > 1) {
    const hiddenOnes = withoutOwnHidden.filter((el) => hiddenByAncestor(el));
    // With one <main> shown, a <main> the user can reveal without a script
    // is a second visible one, unless opening its <details> closes the one
    // around the shown <main> (an exclusive group).
    const shownGroups = shown.length === 1 ? detailsGroups(shown[0]) : null;
    const revealable = (el) => {
      if (!shownGroups) return false;
      const h = hidersOf(el);
      if (!h.byUser) return false;
      return !h.hiders.some(
        (n) => tagOf(n) === 'details' && shownGroups.has(dom.getAttribute(n, 'name'))
      );
    };
    const fails = hiddenOnes.filter(revealable);
    const asks = hiddenOnes.filter((el) => !revealable(el));
    if (fails.length) {
      const failOccs = fails.map((el) => occurrence(el, 'revealableMain', 'fail'));
      const askOccs = asks.map((el) => occurrence(el, 'hiddenByAncestor', 'cantTell'));
      return {
        ruleId: rule.ruleId,
        ...helpers.resolveTieredOutcome(
          failOccs.concat(zoneFails),
          askOccs,
          rule.defaultSeverity || 'moderate'
        )
      };
    }
    return result(
      'cantTell',
      asks.map((el) => occurrence(el, 'hiddenByAncestor', 'cantTell'))
    );
  }
  if (!withoutOwnHidden.length) {
    return result('cantTell', [occurrence(mains[0], 'allHidden', 'cantTell')]);
  }
  return result('pass');
}

module.exports = { id, meta, runInPage, applicability };
