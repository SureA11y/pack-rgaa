/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-doctype-valid
 * @atomic true
 * @summary A declared doctype must name a published HTML or XHTML document type
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document that declares a doctype. A page
 *   with no doctype is notApplicable here: rgaa-doctype-present fails it under
 *   RGAA 8.1.1. A run narrowed by contextSelector, or by
 *   engineOptions.fragment, is notApplicable: a subtree has no doctype of
 *   its own.
 * @expectation
 *   The doctype is valid (RGAA 8.1.2: « le type de document (balise
 *   doctype) est-il valide ? »). RGAA names no list of valid doctypes; its
 *   glossary « Type de document » is the reference data that tells user
 *   agents the page's languages, and RGAA itself treats HTML 4, XHTML 1.0,
 *   XHTML 1.1 and HTML5 as document types. The pack reads a doctype as
 *   valid when it is a well-formed declaration of a published document
 *   type that describes the page's language:
 *   - it passes the HTML5 doctype (name html, no public identifier, and no
 *     system identifier or about:legacy-compat), and the public
 *     identifiers it knows: HTML 2.0, 3.2, 4.0 and 4.01 (Strict,
 *     Transitional, Frameset), ISO/IEC 15445:2000 HTML, XHTML 1.0 and 1.1,
 *     XHTML Basic 1.0 and 1.1, XHTML Mobile Profile 1.0 to 1.2, XHTML 1.1
 *     plus MathML 2.0 (plus SVG 1.1), XHTML+RDFa 1.0 and 1.1, and HTML
 *     4.01+RDFa 1.1, compared without regard to case;
 *   - it fails (invalidDoctype) a doctype whose name is not html, which
 *     does not describe an HTML page (an svg or math doctype), and the
 *     HTML5 form with a system identifier other than about:legacy-compat;
 *   - it asks (unknownPublicId) about any other public identifier, which
 *     may name an industry or later specification, or none.
 * @implementation-notes
 * - RGAA 8.1.3 (the doctype comes before <html>) cannot be judged from the
 *   DOM: the parser drops a doctype written after <html>, so the page
 *   reads as having none, which rgaa-doctype-present reports.
 * - Opt-in (tag `rgaa`): WCAG does not require a doctype, so the rule runs
 *   only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'rgaa-doctype-valid';

const meta = {
  title: 'Declared doctype is valid',
  description:
    'Checks that a declared doctype names a published HTML or XHTML document type: passes those it knows, fails one that cannot be valid, and asks about other public identifiers.',
  i18n: {
    titleKey: 'doctypeValid_title',
    descriptionKey: 'doctypeValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['invalidDoctype', 'unknownPublicId'],
  review: {
    unknownPublicId: {
      steps: [
        'Read the doctype at the top of the page source.',
        'Find the specification or DTD its public identifier names: the W3C list of recommended doctypes, the HTML Standard’s obsolete permitted doctypes, or an ISO or industry specification.',
        'Check that the page is written in that language.'
      ],
      passWhen:
        'The identifier names a published HTML or XHTML document type, and the page is written in that language.',
      failWhen:
        'The identifier names no published document type (misspelled or invented), or one that does not describe the page’s language, which fails RGAA 8.1.2.'
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

  // Published HTML and XHTML document types, by public identifier.
  const KNOWN_PUBLIC_IDS = [
    '-//IETF//DTD HTML 2.0//EN',
    '-//W3C//DTD HTML 3.2 FINAL//EN',
    '-//W3C//DTD HTML 4.0//EN',
    '-//W3C//DTD HTML 4.0 TRANSITIONAL//EN',
    '-//W3C//DTD HTML 4.0 FRAMESET//EN',
    '-//W3C//DTD HTML 4.01//EN',
    '-//W3C//DTD HTML 4.01 TRANSITIONAL//EN',
    '-//W3C//DTD HTML 4.01 FRAMESET//EN',
    '-//W3C//DTD XHTML 1.0 STRICT//EN',
    '-//W3C//DTD XHTML 1.0 TRANSITIONAL//EN',
    '-//W3C//DTD XHTML 1.0 FRAMESET//EN',
    '-//W3C//DTD XHTML 1.1//EN',
    '-//W3C//DTD XHTML BASIC 1.0//EN',
    '-//W3C//DTD XHTML BASIC 1.1//EN',
    '-//W3C//DTD XHTML 1.1 PLUS MATHML 2.0//EN',
    '-//W3C//DTD XHTML 1.1 PLUS MATHML 2.0 PLUS SVG 1.1//EN',
    '-//W3C//DTD XHTML+RDFA 1.0//EN',
    '-//W3C//DTD XHTML+RDFA 1.1//EN',
    '-//W3C//DTD HTML 4.01+RDFA 1.1//EN',
    'ISO/IEC 15445:2000//DTD HTML//EN',
    'ISO/IEC 15445:2000//DTD HYPERTEXT MARKUP LANGUAGE//EN',
    '-//WAPFORUM//DTD XHTML MOBILE 1.0//EN',
    '-//WAPFORUM//DTD XHTML MOBILE 1.1//EN',
    '-//WAPFORUM//DTD XHTML MOBILE 1.2//EN'
  ];

  const doctype = dom.doctype(document);
  if (!doctype) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const name = String(doctype.name || '');
  const publicId = String(doctype.publicId || '');
  const systemId = String(doctype.systemId || '');
  const isHtml = name.toLowerCase() === 'html';
  const isHtml5 = !publicId && (!systemId || systemId === 'about:legacy-compat');
  const isKnown = KNOWN_PUBLIC_IDS.includes(publicId.trim().toUpperCase());
  if (isHtml && (isHtml5 || isKnown)) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  // Another public identifier on an html doctype may name a document type
  // this list leaves out: a person looks it up.
  const asked = isHtml && !!publicId;

  const declared =
    '<!DOCTYPE ' +
    name +
    (publicId ? ' PUBLIC "' + publicId + '"' : systemId ? ' SYSTEM' : '') +
    (systemId ? ' "' + systemId + '"' : '') +
    '>';

  // A doctype is not an element, so the finding is reported on <html>, with
  // the declared doctype as its snippet.
  const occurrence = helpers.reportOccurrence(dom.documentElement(document), {
    selector: 'html',
    html: declared,
    summary: asked
      ? `The page declares a doctype whose public identifier, "${publicId}", is not one this check knows.`
      : 'The page declares a doctype that names no HTML document type: its name is not html, or it has the HTML5 form with a system identifier other than about:legacy-compat.',
    hint: asked
      ? 'Check that the identifier names a published HTML or XHTML document type, and that the page is written in that language.'
      : 'Start the page with <!DOCTYPE html>, or with the doctype of the published HTML or XHTML specification the page is written in.',
    i18n: {
      summaryKey: asked ? 'doctypeValid_summary_cantTell' : 'doctypeValid_summary_fail',
      hintKey: asked ? 'doctypeValid_hint_cantTell' : 'doctypeValid_hint_fail',
      params: asked ? { publicId } : {}
    },
    ...(asked
      ? {
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the public identifier names a published HTML or XHTML document type.'
          }
        }
      : {}),
    data: {
      details: { reasonCode: asked ? 'unknownPublicId' : 'invalidDoctype', doctype: declared },
      visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
    }
  });

  return {
    ruleId: rule.ruleId,
    outcome: asked ? 'cantTell' : 'fail',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [occurrence]
  };
}

module.exports = { id, meta, runInPage, applicability };
