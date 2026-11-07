/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-navigation-systems-review
 * @atomic true
 * @summary A page that shows fewer than two navigation systems is reviewed
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Looks on the page for three of the « systèmes de navigation » of RGAA
 *   12.1.1:
 *   - a navigation menu (glossary « Menu et barre de navigation »: « liste
 *     de liens permettant une navigation spécifique dans le site »): a
 *     <nav> or role="navigation" holding 3 links or more, or a list of 3
 *     links or more in the page header. A breadcrumb or a pagination
 *     (named so by aria-label, aria-labelledby, class or id), links that
 *     all point inside the page (skip links) and a menu in the page footer
 *     (« les liens de pied de page […] ne sont pas considérés comme un menu
 *     de navigation principal ») do not count;
 *   - a site map (glossary « Page plan du site »): a link whose text, label
 *     or address says « plan du site », « sitemap » or « site map »;
 *   - a search engine (glossary « Moteur de recherche (interne à un site
 *     web) »: « zone donnant accès directement (formulaire) ou
 *     indirectement (élément d’interface donnant accès au formulaire) »):
 *     a form or role="search" with a search field, or a link or button
 *     « Rechercher » / to a search page.
 *   Elements count whether or not they are shown, since a menu or search
 *   form is often hidden at one screen width and opened by a button.
 *   A page that is a step of a process (a form with payment card fields,
 *   or a title that says « étape ») is notApplicable (particular case: « le
 *   critère est également non applicable pour les pages […] qui sont le
 *   résultat ou une partie d’un processus »). A page with two or more of
 *   these is notApplicable too: one page cannot pass 12.1, which is about a
 *   whole « ensemble de pages ».
 * @expectation
 *   RGAA 12.1.1: « chaque ensemble de pages vérifie-t-il une de ces
 *   conditions » : a menu and a site map, a menu and a search engine, or a
 *   search engine and a site map. A page that shows fewer than two may
 *   still belong to a set that offers them, or to a site of « un nombre
 *   très limité de pages », where the criterion does not apply: it is
 *   asked about once (fewerThanTwoSystems, with what was found).
 * @implementation-notes
 * - Manual (cantTell): one page cannot decide for a set of pages.
 * - A table of contents for a set of pages, or a menu not built as links
 *   in a <nav>, a navigation role or a header list, is not found.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-navigation-systems-review';

const meta = {
  title: 'A page that shows fewer than two navigation systems is reviewed',
  description:
    'Flags a page that shows fewer than two of a navigation menu, a site map link and a search engine, for a person to check that its set of pages offers two of them, unless the site has very few pages or the page is a step of a process.',
  i18n: {
    titleKey: 'navigationSystemsReview_title',
    descriptionKey: 'navigationSystemsReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'navigation', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['fewerThanTwoSystems'],
  review: {
    fewerThanTwoSystems: {
      steps: [
        'This finding is about the page: the report lists the navigation systems found on it.',
        'Work out which set of pages it belongs to, and go through a few other pages of that set.',
        'Look for a navigation menu, a site map and a search engine: on these pages, at every screen width. Footer links do not count as a navigation menu; the search engine must search the whole site, not one catalogue; from the site map, every page must be reachable.',
        'Decide whether the site is so small that this does not apply: very few pages, all reachable from the home page. A step of a process, such as a payment, does not need them either.'
      ],
      passWhen:
        'The set of pages offers two of the three, or the site has very few pages, or the page is a step of a process.',
      failWhen:
        'The set of pages offers fewer than two of a navigation menu, a site map and a search engine, which fails RGAA 12.1.1.'
    }
  }
};

// A document shown in a frame is no web page of its own (RGAA's « page web »).
function applicability(ctx) {
  if (ctx.helpers.isTopLevelDocument && !ctx.helpers.isTopLevelDocument()) return false;
  return true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const na = { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };

  const norm = (v) =>
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
  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };
  const all = (root, sel) => {
    try {
      return [...dom.querySelectorAll(root, sel)];
    } catch {
      return [];
    }
  };
  const byId = (el, idref) => {
    try {
      return helpers.getElementByIdInTree(el, idref);
    } catch {
      return null;
    }
  };
  // Inside <template> or <noscript>, nothing is part of the page.
  const inert = (el) => {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (['template', 'noscript'].includes(tagOf(a))) return true;
    }
    return false;
  };
  const ancestorIs = (el, test) => {
    for (let a = dom.parentElement(el); a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (test(a)) return true;
    }
    return false;
  };

  const body = dom.body(document);
  if (!body) return na;

  // Particular case: a step of a process (payment, order).
  const PAYMENT_AUTOCOMPLETE = /\bcc-(?:number|exp|exp-month|exp-year|csc|name)\b/i;
  const PAYMENT_NAME =
    /(?:^|[-_\s])(?:cc-?num(?:ber)?|card-?number|cardnumber|numero-?(?:de-?)?carte|cvv|cvc|cryptogramme)(?:$|[-_\s])/i;
  const paymentField = all(body, 'form input, form select').some((el) => {
    if (PAYMENT_AUTOCOMPLETE.test(String(attr(el, 'autocomplete') || ''))) return true;
    return [attr(el, 'name'), attr(el, 'id')].some((v) => PAYMENT_NAME.test(String(v || '')));
  });
  const titleEl = all(document, 'title')[0];
  const title = titleEl ? norm(dom.textContent(titleEl)) : '';
  if (paymentField || /(?:^|[^\p{L}])étape(?:$|[^\p{L}])/iu.test(title)) return na;

  const linkText = (a) =>
    norm(
      [dom.textContent(a), attr(a, 'aria-label'), attr(a, 'title')]
        .concat(all(a, 'img[alt]').map((img) => attr(img, 'alt')))
        .join(' ')
    );
  const links = (root) => all(root, 'a[href], area[href]').filter((a) => !inert(a));
  const isInPage = (a) => /^#/.test(String(attr(a, 'href') || '').trim());

  // Page header and footer: <header>/<footer> not inside sectioning content, or
  // role banner/contentinfo.
  const SECTIONING = new Set(['article', 'aside', 'main', 'nav', 'section']);
  const pageRegion = (el, tag, role) => {
    if (roleOf(el) === role) return true;
    return (
      tagOf(el) === tag &&
      !roleOf(el) &&
      !ancestorIs(el, (a) => SECTIONING.has(tagOf(a)) || roleOf(a) === 'main')
    );
  };
  const inFooter = (el) => ancestorIs(el, (a) => pageRegion(a, 'footer', 'contentinfo'));

  // 1. Navigation menu.
  const NOT_MENU = /fil[\s_-]*d[’'\s_-]*ariane|breadcrumb|pagination|pager/i;
  const named = (el) => {
    const labelledby = norm(attr(el, 'aria-labelledby'))
      .split(' ')
      .filter(Boolean)
      .map((ref) => {
        const t = byId(el, ref);
        return t ? dom.textContent(t) : '';
      });
    return [attr(el, 'aria-label'), attr(el, 'class'), attr(el, 'id')].concat(labelledby).join(' ');
  };
  const navCandidates = all(body, 'nav, [role~="navigation" i]').filter((el) => {
    const role = roleOf(el);
    return !inert(el) && (role === 'navigation' || (tagOf(el) === 'nav' && !role));
  });
  let menu = navCandidates.some((el) => {
    if (NOT_MENU.test(named(el)) || inFooter(el)) return false;
    const ls = links(el);
    return ls.length >= 3 && !ls.every(isInPage);
  });
  if (!menu) {
    const headers = all(body, 'header, [role~="banner" i]').filter(
      (el) => !inert(el) && pageRegion(el, 'header', 'banner')
    );
    menu = headers.some((h) =>
      all(h, 'ul, ol').some((list) => {
        if (NOT_MENU.test(named(list))) return false;
        const ls = all(list, 'li')
          .map((li) => links(li)[0])
          .filter(Boolean);
        return ls.length >= 3 && !ls.every(isInPage);
      })
    );
  }

  // 2. Site map.
  const SITEMAP_TEXT = /plan\s+du\s+site|site\s*-?\s*map/i;
  const SITEMAP_HREF = /plan[-_]?du[-_]?site|site[-_]?map/i;
  const siteMap = links(body).some((a) => {
    const href = String(attr(a, 'href') || '');
    if (/\.xml(?:[?#]|$)/i.test(href)) return false;
    return SITEMAP_TEXT.test(linkText(a)) || SITEMAP_HREF.test(href);
  });

  // 3. Search engine.
  const SEARCH_NAME = /^(?:q|s|query|search|recherche|rechercher|keywords?|mots?-?cl[ée]s?)$/i;
  const SEARCH_WORD = /\b(?:search|recherche|rechercher)\b/i;
  const TEXTUAL = new Set(['', 'text', 'search']);
  const fieldLabel = (el) => {
    const parts = [attr(el, 'aria-label'), attr(el, 'placeholder'), attr(el, 'title')];
    const fid = attr(el, 'id');
    if (fid) {
      for (const l of all(document, 'label')) {
        if (attr(l, 'for') === fid) parts.push(dom.textContent(l));
      }
    }
    for (let a = dom.parentElement(el); a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (tagOf(a) === 'label') parts.push(dom.textContent(a));
    }
    return norm(parts.join(' '));
  };
  const searchField = (el) => {
    if (tagOf(el) !== 'input') return false;
    const type = String(attr(el, 'type') || '')
      .trim()
      .toLowerCase();
    if (type === 'search') return true;
    if (!TEXTUAL.has(type)) return false;
    if ([attr(el, 'name'), attr(el, 'id')].some((v) => SEARCH_NAME.test(norm(v)))) return true;
    return SEARCH_WORD.test(fieldLabel(el));
  };
  const searchAreas = all(body, 'form, [role~="search" i]').filter((el) => !inert(el));
  let search = searchAreas.some((area) => {
    const fields = all(area, 'input');
    if (roleOf(area) === 'search') {
      return fields.some((f) =>
        TEXTUAL.has(
          String(attr(f, 'type') || '')
            .trim()
            .toLowerCase()
        )
      );
    }
    return fields.some(searchField);
  });
  if (!search) {
    // Indirect access: a link to a search page, or a button that opens the form.
    const SEARCH_LABEL = /^(?:rechercher|recherche|search)\b/i;
    const SEARCH_HREF = /\/(?:recherche|rechercher|search)(?:[/?#.]|$)/i;
    search =
      links(body).some(
        (a) => SEARCH_LABEL.test(linkText(a)) || SEARCH_HREF.test(String(attr(a, 'href') || ''))
      ) ||
      all(body, 'button, [role~="button" i]').some(
        (b) =>
          !inert(b) &&
          SEARCH_LABEL.test(norm([attr(b, 'aria-label'), dom.textContent(b)].join(' ')))
      );
  }

  const found = [menu && 'menu', siteMap && 'siteMap', search && 'search'].filter(Boolean);
  if (found.length >= 2) return na;
  const kind = found[0] || 'none';
  const SUMMARY = {
    none: 'This page shows no navigation menu, site map link or search engine.',
    menu: 'This page shows a navigation menu, but no site map link or search engine.',
    siteMap: 'This page shows a site map link, but no navigation menu or search engine.',
    search: 'This page shows a search engine, but no navigation menu or site map link.'
  };

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [
      helpers.reportOccurrence(body, {
        summary: SUMMARY[kind],
        hint: 'Check that the set of pages this page belongs to offers two of a navigation menu, a site map and a search engine (RGAA 12.1). The criterion does not apply to a site of very few pages, all reachable from the home page, nor to a step of a process such as a payment.',
        i18n: {
          summaryKey: `navigationSystemsReview_summary_cantTell_${kind}`,
          hintKey: 'navigationSystemsReview_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether the set of pages offers two navigation systems, and whether the site has very few pages.'
        },
        data: {
          details: { reasonCode: 'fewerThanTwoSystems', found: found.join(',') },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    ]
  };
}

module.exports = { id, meta, runInPage, applicability };
