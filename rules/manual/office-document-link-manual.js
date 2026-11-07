/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-office-document-link
 * @atomic true
 * @summary A downloadable office document should be accessible or have an accessible version
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to links (<a href>, <area href>), forms and submit buttons that
 *   download an office document. A link qualifies when its `download`
 *   filename, the path of its address, or a value in its query string
 *   (`/get?file=report.pdf`) ends with an office document extension, when
 *   its type attribute names an office MIME type, or when its text, title
 *   or aria-label announces a format as a download is announced: in
 *   brackets ("Rapport annuel (PDF, 2 Mo)"), next to a file size, or after
 *   a separator at its end ("Rapport annuel - PDF"). A form
 *   qualifies by its `action`, and a submit button by its `formaction`, read
 *   the same way. The extensions are those of the formats RGAA's glossary
 *   entry "Version accessible" names: Microsoft Office (.doc, .docx, .docm,
 *   .dot, .dotx, .dotm, .xls, .xlsx, .xlsm, .xlsb, .xlt, .xltx, .xltm, .ppt,
 *   .pptx, .pptm, .pps, .ppsx, .ppsm, .pot, .potx, .potm), OpenDocument
 *   (.odt, .ott, .ods, .ots, .odp, .otp, .odg, .otg), PDF and EPUB, plus
 *   .rtf. A page with none is notApplicable.
 * @expectation
 *   Each such link or form is flagged for a person to check one of the
 *   conditions of RGAA 13.3.1: the document is accessible, or an accessible
 *   version is offered for download or in HTML.
 * @implementation-notes
 * - Manual (cantTell): the engine cannot open the document.
 * - One occurrence per link or form, naming the extension. The `download`
 *   filename is read first, since it names the saved file; then the path;
 *   then the query string.
 * - A download started by script, or served from an address that names no
 *   extension, is not found. Data formats such as .csv are not in the
 *   glossary's list and are not flagged.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-office-document-link';

const meta = {
  title: 'Downloadable office documents are accessible or have an accessible version',
  description:
    'Flags each link or form that downloads an office document (PDF, Word, OpenDocument, spreadsheet, presentation, EPUB, RTF) for a person to check the document or its accessible version.',
  i18n: {
    titleKey: 'officeDocumentLink_title',
    descriptionKey: 'officeDocumentLink_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'links', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['officeDocument'],
  review: {
    officeDocument: {
      steps: [
        'Find the link, form or button the report names, and download the document it gives.',
        'Open the document and check that it is accessible: structured headings, text alternatives for images, a reading order, a language.',
        'If it is not, look next to the link for an accessible version of it, to download or as an HTML page.'
      ],
      passWhen:
        'The document is accessible, or an accessible version of it is offered for download or in HTML.',
      failWhen:
        'The document is not accessible and no accessible version is offered, which fails RGAA 13.3.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const EXTENSIONS =
    /\.(pdf|epub|rtf|docx?|docm|dotx?|dotm|xlsx?|xlsm|xlsb|xltx?|xltm|pptx?|pptm|ppsx?|ppsm|potx?|potm|odt|ott|ods|ots|odp|otp|odg|otg)$/i;

  function extensionOfName(name) {
    const m = String(name || '')
      .trim()
      .match(EXTENSIONS);
    return m ? m[1].toLowerCase() : null;
  }

  function decode(v) {
    try {
      return decodeURIComponent(v.replace(/\+/g, ' '));
    } catch {
      return v;
    }
  }

  // The path of the address, then each query value (`?file=report.pdf`,
  // `?url=/docs/report.pdf`), without their own query or fragment.
  function extensionOfUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return null;
    const hashAt = raw.indexOf('#');
    const noHash = hashAt === -1 ? raw : raw.slice(0, hashAt);
    const queryAt = noHash.indexOf('?');
    const fromPath = extensionOfName(queryAt === -1 ? noHash : noHash.slice(0, queryAt));
    if (fromPath) return fromPath;
    if (queryAt === -1) return null;
    for (const pair of noHash.slice(queryAt + 1).split('&')) {
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const value = decode(pair.slice(eq + 1)).split(/[?#]/)[0];
      const ext = extensionOfName(value);
      if (ext) return ext;
    }
    return null;
  }

  // The format a link's type attribute names, as a MIME type.
  const MIME = {
    'application/pdf': 'pdf',
    'application/epub+zip': 'epub',
    'application/rtf': 'rtf',
    'application/msword': 'doc',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.oasis.opendocument.text': 'odt',
    'application/vnd.oasis.opendocument.spreadsheet': 'ods',
    'application/vnd.oasis.opendocument.presentation': 'odp'
  };
  function extensionOfType(type) {
    const t = String(type || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    return MIME[t] || null;
  }

  // A format named in the link's wording the way a download is announced:
  // in brackets ("(PDF, 2 Mo)"), next to a file size, or after a separator
  // at the end ("Rapport annuel - PDF"). A format named in passing
  // ("Comment ouvrir un PDF") is not taken for a download.
  const FORMAT = '(PDF|EPUB|RTF|DOCX?|XLSX?|PPTX?|ODT|ODS|ODP)';
  const SIZE = '\\d+(?:[.,]\\d+)?\\s?(?:[kKmMgG]i?[oOB]|octets|bytes)\\b';
  const ANNOUNCED = [
    new RegExp(`[([][^)\\]]*\\b${FORMAT}\\b[^)\\]]*[)\\]]`, 'i'),
    new RegExp(`\\b${FORMAT}\\b[^A-Za-z]{0,6}${SIZE}`, 'i'),
    new RegExp(`${SIZE}[^A-Za-z]{0,6}\\b${FORMAT}\\b`, 'i'),
    new RegExp(`[-–—|:,]\\s*${FORMAT}\\s*$`, 'i')
  ];
  function extensionOfWording(text) {
    const t = String(text || '')
      .replace(/\s+/g, ' ')
      .trim();
    for (const re of ANNOUNCED) {
      const m = re.exec(t);
      if (m) return m[1].toLowerCase();
    }
    return null;
  }

  const occurrences = [];

  function flag(el, extension, kind) {
    const isForm = kind === 'form';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: isForm
          ? `This form downloads a .${extension} document.`
          : `This link downloads a .${extension} document.`,
        hint: 'Check that the document is accessible, or offer an accessible version, as a download or as an HTML page.',
        i18n: {
          summaryKey: isForm
            ? 'officeDocumentLink_summary_cantTell_form'
            : 'officeDocumentLink_summary_cantTell',
          hintKey: 'officeDocumentLink_hint_cantTell',
          params: { extension }
        },
        data: {
          details: { reasonCode: 'officeDocument', extension },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  const links = helpers.queryAllSmart
    ? helpers.queryAllSmart('a[href], area[href]')
    : helpers.queryAll('a[href], area[href]');

  for (const link of links) {
    if (!link || !dom.get(link, 'getAttribute')) continue;
    const extension =
      extensionOfName(dom.getAttribute(link, 'download')) ||
      extensionOfUrl(dom.getAttribute(link, 'href')) ||
      extensionOfType(dom.getAttribute(link, 'type')) ||
      extensionOfWording(
        [
          dom.textContent(link),
          dom.getAttribute(link, 'title'),
          dom.getAttribute(link, 'aria-label')
        ]
          .filter(Boolean)
          .join(' ')
      );
    if (extension) flag(link, extension, 'link');
  }

  const SUBMITTERS = 'button[formaction], input[formaction]';
  const forms = helpers.queryAllSmart
    ? helpers.queryAllSmart('form[action], ' + SUBMITTERS)
    : helpers.queryAll('form[action], ' + SUBMITTERS);

  for (const el of forms) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (tag !== 'form') {
      // formaction only applies to a submit button.
      const type = String(dom.getAttribute(el, 'type') || '')
        .trim()
        .toLowerCase();
      const isSubmit =
        tag === 'button' ? type === '' || type === 'submit' : type === 'submit' || type === 'image';
      if (!isSubmit) continue;
    }
    const extension = extensionOfUrl(
      dom.getAttribute(el, tag === 'form' ? 'action' : 'formaction')
    );
    if (extension) flag(el, extension, 'form');
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
