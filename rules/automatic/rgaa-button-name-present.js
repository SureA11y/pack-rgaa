/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-button-name-present
 * @atomic true
 * @summary Each button outside a form has an accessible name
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to buttons (<button>, <input> of type submit, reset, button or
 *   image, and role="button") that sit outside any form: not inside a <form>
 *   or an element with role="form", and not joined to one through a form
 *   attribute. Buttons in a form are rgaa-form-button-name-present's
 *   (11.9.1). A button hidden from assistive technologies, or whose explicit
 *   role is another one, is out of scope. A page with no such button is
 *   notApplicable.
 * @expectation
 *   The button has an accessible name: an aria-labelledby passage, an
 *   aria-label, the alt of an image button, the value of an <input> button,
 *   its content (an image's alt, an <svg>'s <title> and the like count), or
 *   a title. A button outside a form does something only through script, so
 *   it is an interface component that RGAA 7.1.1 covers, whose name must
 *   reach assistive technologies (step 2); one with no name fails.
 * @implementation-notes
 * - Runs the code of rgaa-form-button-name-present, which picks the buttons
 *   outside forms when it runs under this id (ctx.rule.ruleId).
 * - Asks (cantTell) about an <input type="image"> with no alt, aria-label,
 *   aria-labelledby or title, which the browser names with a generic
 *   "Submit".
 * - 7.1.1 passes when an accessible component offers the same function
 *   elsewhere on the page, which a rule cannot find; a page that has one
 *   should record it and set these failures aside.
 * - Opt-in (tag `rgaa`): WCAG 4.1.2 requires a name on every button, which
 *   button-name-present checks; this rule reports the buttons 7.1.1 covers,
 *   so it runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own
 *   id.
 */

const { runInPage } = require('./rgaa-form-button-name-present');

const id = 'rgaa-button-name-present';

const meta = {
  title: 'Buttons outside a form have an accessible name',
  description:
    'Checks that each button outside a form has an accessible name, which RGAA 7.1.1 requires of a scripted interface component.',
  i18n: {
    titleKey: 'buttonNamePresentRgaa_title',
    descriptionKey: 'buttonNamePresentRgaa_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'buttons', 'name', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['nameMissing', 'imageButtonNoAlt'],
  review: {
    imageButtonNoAlt: {
      steps: [
        'Find the image button (<input type="image">) the report names.',
        'Look at the image and decide what the button does.',
        'Listen to it with a screen reader, or read its accessible name in the browser\'s accessibility tree: the browser names it with a generic word such as "Submit".'
      ],
      passWhen:
        'The generic name the browser gives says what the button does, which is rare; an alt describing the action settles it.',
      failWhen:
        "The generic name does not tell what the button does, so this scripted control has no relevant name for assistive technologies, which fails RGAA 7.1.1 (and the image button's alternative, 1.1.3)."
    }
  }
};

module.exports = { id, meta, runInPage };
