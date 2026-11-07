/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-html-lang-code-valid
 * @atomic true
 * @summary The code of the page's default language must be a valid ISO 639 code
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document whose <html> element has a
 *   non-empty lang or xml:lang attribute: RGAA 8.4.1 covers only pages
 *   « ayant une langue par défaut ». Each of the two attributes is judged
 *   when present. A page with neither is notApplicable here; the missing
 *   language is rgaa-page-language-present's matter (8.3.1). A run narrowed by
 *   contextSelector or engineOptions.fragment is notApplicable.
 * @expectation
 *   The language code, which the RGAA glossary "Code de langue" defines as
 *   the part before the first hyphen, is two or three letters and is an
 *   ISO 639-1, ISO 639-2 or later ISO 639 code (8.4.1 step 2, « conforme à
 *   la norme ISO 639-1 ou ISO 639-2 et suivantes »). What follows the
 *   hyphen is left to the author: lang="fr-FR-!!" passes here, and its
 *   malformed region is a markup validity question. Whether the code names
 *   the page's main language (« pertinent ») is for a person.
 * @implementation-notes
 * - The IANA language subtag registry lists ISO 639-1 codes, and ISO
 *   639-2, 639-3 and 639-5 codes that have no two-letter equivalent. RGAA
 *   also accepts the three-letter ISO 639-2 codes of languages that do have
 *   one (eng, fra, fre, deu, ger…), which the registry leaves out, and the
 *   qaa to qtz range that ISO 639-2 reserves for local use: core's
 *   helpers.isIso639LanguageCode accepts them all, as rgaa-valid-lang does
 *   for 8.8.1.
 * - html-lang-attr-present (WCAG 3.1.1) judges lang on <html> against the
 *   registry alone, so it fails lang="fra", and it ignores xml:lang.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-html-lang-code-valid';

const meta = {
  title: 'Default language code is valid',
  description:
    'Checks that the language code of lang and xml:lang on <html> is a valid ISO 639 code.',
  i18n: {
    titleKey: 'htmlLangCodeValid_title',
    descriptionKey: 'htmlLangCodeValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'language', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  // The reason codes the rule gives, so definePack can check that `review`
  // names only these.
  reasonCodes: ['invalidLanguageCode']
};

// A document shown in a frame is no web page of its own (RGAA's « page web »).
function applicability(ctx) {
  if (ctx.helpers.isTopLevelDocument && !ctx.helpers.isTopLevelDocument()) return false;
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const XML_NS = 'http://www.w3.org/XML/1998/namespace';

  const html = document && dom.documentElement(document);
  if (!html || String(dom.tagName(html) || '').toLowerCase() !== 'html') {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const xmlLang =
    html.getAttributeNS && html.getAttributeNS(XML_NS, 'lang') != null
      ? html.getAttributeNS(XML_NS, 'lang')
      : dom.getAttribute(html, 'xml:lang');
  const declared = [
    ['lang', dom.getAttribute(html, 'lang')],
    ['xml:lang', xmlLang]
  ]
    .map(([attribute, value]) => [attribute, String(value == null ? '' : value).trim()])
    .filter(([, value]) => value);

  if (!declared.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const [attribute, value] of declared) {
    const code = value.split('-')[0];
    // Any ISO 639 code: the registry's, plus the three-letter ISO 639-2 and
    // 639-3 codes it leaves out and the qaa to qtz local-use range.
    if (helpers.isIso639LanguageCode(code)) continue;
    occurrences.push(
      helpers.reportOccurrence(html, {
        summary: `The page's default language is given as ${attribute}="${value}", and "${code}" is not an ISO 639 language code.`,
        hint: 'Start the value with the two- or three-letter ISO 639 code of the page\'s main language, for example "fr" or "fr-FR".',
        i18n: {
          summaryKey: 'htmlLangCodeValid_summary_fail',
          hintKey: 'htmlLangCodeValid_hint_fail',
          params: { attribute, value, code }
        },
        data: {
          details: { reasonCode: 'invalidLanguageCode', attribute, value, code },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
