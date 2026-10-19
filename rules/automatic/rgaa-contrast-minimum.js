/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-contrast-minimum
 * @atomic true
 * @summary Text must meet RGAA's contrast ratio for its size, with bold text large from 18.5px
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   The same text as contrast-minimum: visible text that contrast-computable
 *   applies to, narrowed to text whose background and foreground are
 *   computable. Eligible text that is not computable leaves this rule
 *   notApplicable; contrast-computable asks about it.
 * @expectation
 *   Every computable text node reaches the ratio RGAA 3.2 requires for its
 *   size: 3:1 for text of 24px or more (3.2.3), and for bold text (computed
 *   weight 700 or more) of 18.5px or more (3.2.4); 4.5:1 for everything
 *   else (3.2.1, 3.2.2). The only difference from contrast-minimum is the
 *   bold threshold, WCAG's 14pt being about 18.67px, and the three cases
 *   below, which it asks about.
 * @implementation-notes
 * - A variant of contrast-minimum (docs/RULE_AUTHORING.md, "Rule
 *   variants"): its code, with bold text large from 18.5px. The other
 *   thresholds are WCAG's and RGAA's alike. Its verdicts are cached apart
 *   from contrast-minimum's, since the thresholds differ.
 * - It asks (cantTell) instead of failing three cases RGAA leaves to a
 *   person: text of weight 600 to 699 that is large only if it counts as
 *   bold (SEMIBOLD_BELOW_THRESHOLD), since RGAA says « effet de graisse »
 *   without a weight; text on a page with a control that switches to
 *   higher contrast (CONTRAST_SWITCH_OFFERED), which may be the mechanism
 *   of each test's second condition; and text that looks like part of a
 *   logo (LOGO_TEXT_BELOW_THRESHOLD), which the particular case for logos
 *   and brand names makes not applicable. Decorative text is not told
 *   apart, beyond the disabled controls the shared text scan leaves out.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-contrast-minimum';

const meta = {
  title: 'Text meets RGAA minimum color contrast',
  description:
    'Checks that visible text has a contrast ratio of at least 4.5:1, or 3:1 for text of 24px or more and bold text of 18.5px or more (RGAA 3.2), when contrast is computable from CSS; asks about semi-bold text, text on a page with a contrast switch, and logo text.',
  i18n: {
    titleKey: 'contrastMinimumRgaa_title',
    descriptionKey: 'contrastMinimumRgaa_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'contrast', 'color', 'atomic', 'automatic', 'dom'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  // Its base's code reports the closest passing text as a margin.
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min' }
};

// RGAA 3.2.2/3.2.4: bold text is large from 18.5px. RGAA says « effet de
// graisse » without a weight, so 600 to 699 is asked about; a page's
// contrast switch may be the mechanism each test's second condition
// accepts; and text that looks like a logo may fall under the particular
// case for logos and brand names. Each is a question, not a verdict.
const config = {
  boldLargeMinPx: 18.5,
  semiBold: 'ask',
  contrastSwitch: 'ask',
  logoText: 'ask'
};

module.exports = { id, from: 'contrast-minimum', config, meta };
