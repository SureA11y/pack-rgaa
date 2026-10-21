/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-valid-lang
 * @atomic true
 * @summary The language code of a change of language must be a valid ISO 639 code
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   The same elements as valid-lang: an element other than <html> with a
 *   non-empty lang attribute and text (or an alt) whose language it sets.
 * @expectation
 *   The language code, which the RGAA glossary "Code de langue" defines as
 *   the part before the first hyphen, is an ISO 639-1, ISO 639-2 or later
 *   ISO 639 code (8.8.1 step 2, « conforme à la norme ISO 639-1 ou ISO
 *   639-2 et suivantes »). The only difference from valid-lang: the
 *   three-letter ISO 639-2 and 639-3 codes of languages that have a
 *   two-letter one (fra, fre, eng, ger…), which the IANA registry leaves
 *   out, and the qaa to qtz range ISO 639-2 reserves for local use, pass
 *   here and fail there. Whether the code names the right language
 *   (« pertinent ») is for a person.
 * @implementation-notes
 * - A variant of valid-lang (core's docs/RULE_AUTHORING.md, "Rule
 *   variants"): its code, with codes: 'iso639'.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-valid-lang';

const meta = {
  title: 'Language code of a change of language is valid',
  description:
    'Checks that the language code of lang on elements other than <html> is a valid ISO 639 code (RGAA 8.8).',
  i18n: {
    titleKey: 'validLangRgaa_title',
    descriptionKey: 'validLangRgaa_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'language', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

// RGAA's "Code de langue": any ISO 639 code, not only the registry's.
const config = { codes: 'iso639' };

module.exports = { id, from: 'valid-lang', config, meta };
