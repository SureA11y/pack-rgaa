/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Which RGAA tests each rule checks, per RGAA version.
 *
 * PURPOSE
 * -------
 * RGAA does not restate WCAG criterion by criterion (WCAG 1.1.1 alone relates
 * to 19 RGAA criteria), so a rule's RGAA tests cannot be derived from its WCAG
 * mapping the way an EN 301 549 clause is. They are stated here, rule by rule.
 *
 * THE MAPPING RULE
 * ----------------
 * A rule maps to a test when a failure of the rule (or, for a manual rule, the
 * question it raises) is direct evidence about what the test's official
 * methodology checks, on the same kind of element. Covering one step of a
 * multi-step test is enough; sharing a WCAG criterion, or a theme, is not.
 * A rule that checks presence maps to the presence test, a manual "quality"
 * rule to the relevance test. `note` says which step and why, for review.
 *
 * A rule that fails is linked to a test only when its usual failures really
 * fail that test. Where that is uncertain, the test is left off (when the
 * problem is already reported under a test it certainly fails) or the rule
 * asks (cantTell) instead of failing. A question is never a false failure, so
 * a manual rule may link to any test its question bears on.
 *
 * ONE FINDING, ONE TEST
 * ---------------------
 * A rule's findings count toward every test in `tests`. When different
 * findings of one rule fail different tests, the row says which go where,
 * so each criterion's result names only the tests its findings fail:
 * - `findings: [{ when, tests, outcome }]` sends a finding whose
 *   data.details fields equal those `when` gives (by dotted path, such as
 *   { 'typography.isBold': true }) to `tests` ([] for none). Match only
 *   fields core keeps stable (its API_STABILITY.md) or that the rule names.
 * - `reasonCodes: { [code]: { tests, outcome } }` does the same by reason
 *   code.
 * - `asks: [...]` are tests where the row's own findings are questions
 *   (cantTell) rather than failures: the rule's failure bears on them, but
 *   whether it fails them takes a person.
 * A finding goes by the first `findings` entry it matches, else by its
 * reason code, else by the row; `outcome: 'cantTell'` makes a failing one a
 * question there, and `outcome: 'fail'` makes a question a failure there,
 * for what RGAA's text makes certain where WCAG leaves it to a person (the
 * structure of a list, say). The criterion rollups judge such a rule by its
 * findings (core's meta.contributions, built in mappings.js).
 *
 * The build rejects an unknown rule id or test id, a field other than tests,
 * asks, reasonCodes, findings, note and outsideCorrespondence, a malformed
 * route, and a rule mapped to WCAG criteria none of
 * which RGAA relates to the test's criterion, unless outsideCorrespondence
 * says why (mappings.js). A rule with no WCAG mapping may
 * map to any test: RGAA checks some things WCAG leaves to best practice, such
 * as heading hierarchy and landmarks.
 *
 * REVIEW STATUS: drafted from the RGAA 4.1.2 tests and methodology (data/),
 * then checked row by row against them. Not yet reviewed by an RGAA auditor.
 */

const RGAA_RULE_TESTS = {
  '4.1.2': {
    accesskeys: {
      tests: [],
      note: 'Asks for review of duplicate accesskey values across elements. 12.10.1 concerns single-key shortcuts without modifiers, and accesskey always uses a modifier. The Nu checker (8.2.1) does not treat the same accesskey on different elements as an error. No RGAA test checks this.'
    },
    'area-alt-present': {
      tests: ['1.1.2'],
      note: 'Fails an <area href> in a used image map that has no non-empty alt/aria-label/aria-labelledby/title, which is the presence check of 1.1.2 step 3 (a linked area is always informative). Partial: the rule also accepts title and aria-labelledby, which 1.1.2 does not list, so a pass is weaker evidence than a fail; rgaa-area-alt-source fails an area named only that way.'
    },
    'area-alt-quality': {
      tests: ['1.3.2'],
      note: "Asks a human to judge the text alternative of a linked <area> named by a non-empty alt, aria-label, aria-labelledby or title, listing each source present, which is exactly 1.3.2 step 2 (relevance of the area's text alternative)."
    },
    'rgaa-area-alt-source': {
      tests: ['1.1.2'],
      note: "Fails a linked <area> of a used image map whose only non-empty name sources are title or aria-labelledby: 1.1.2 step 3 lists only aria-label and alt. A linked area always carries information. An area with no source at all is left to area-alt-present. The glossary's clause on the value assistive technologies really render leaves some room for aria-labelledby, which the rule does not take."
    },
    'aria-allowed-attr': {
      tests: [],
      note: "Fails when an aria-* attribute is neither global nor supported by the element's role (WCAG 4.1.2). Not linked to 8.2.1, where the W3C validator decides: the rule fails <h2 aria-expanded>, which the validator accepts, judges elements whose role depends on their attributes or their table by that role, where the validator applies its own table of allowed attributes, and skips hidden content, which 8.2.1 judges. rgaa-aria-attribute-conformance reports 8.2.1. Not mapped to 7.1.1: the rule also fires on static markup, which is not a scripted component."
    },
    'aria-allowed-role': {
      tests: [],
      note: 'Asks about explicit roles that ARIA in HTML does not permit on the host element (for example role=tab on nav); it never fails. Not linked to 8.2.1: the W3C validator reports these as errors, so a question is too weak there, and the rule misses main and table cells. rgaa-aria-role-conformance reports 8.2.1. Whether the role is appropriate for the component (7.1.3) is a separate judgment that the rule does not make.'
    },
    'rgaa-aria-attribute-conformance': {
      tests: ['8.2.1'],
      note: "Fails, hidden content included, what the W3C validator (version 26.9.27) reports about aria-* attributes: an unknown name, an invalid value (empty, misspelt or out of range, an ID reference of whitespace only, an aria-activedescendant pointing to nothing), an attribute the role or element does not support (aria-pressed on a link, aria-sort on a native td, aria-expanded on a details summary), a name on an element that cannot be named (aria-label on a div, span, p or caption), aria-checked on a native checkbox or radio, a state that contradicts a native attribute, and a missing required attribute even where ARIA gives a default (role=heading without aria-level). That is 8.2.1, whose test asks whether the generated source is valid for its document type, judged by the W3C validator (step 1): the pack counts every error the validator reports as an 8.2.1 failure, though the glossary « Règles d’écriture » names only syntax. It passes what the validator accepts: aria-expanded on a heading, an aria-describedby that points to nothing. Markup inside an open shadow root fails like the rest: a shadow root is part of the page's generated source (« code source généré »), which 8.2.1 judges. Asks (idReferenceOtherTree) about an aria-activedescendant whose id names no element in its own tree but one across a shadow boundary: ID references do not cross it, yet the validator asks only for an element of the same document, so whether the id is meant for that element is for a person; an id found nowhere in the page fails. Asks (emptyIdReference) about an empty ID-reference attribute (aria-labelledby, aria-describedby, aria-controls, aria-activedescendant…): ARIA element reflection, which Chromium implements, writes exactly an empty attribute and keeps the reference in the DOM property, so whether the relation is exposed is read in the accessibility tree; it fails 8.2.1 when it is not."
    },
    'aria-braille-equivalent': {
      tests: [],
      note: 'Fails when aria-braillelabel is used without a regular accessible name, or aria-brailleroledescription without aria-roledescription, on any element. No RGAA test targets these ARIA 1.3 attributes. The missing-name case would only be evidence for 7.1.1 (explicit name) on a scripted component, which the rule does not identify. Reviewer may consider 8.2.1 if the validator flags it.'
    },
    'aria-checked-state-mismatch': {
      tests: [],
      note: 'Asks about native checkbox/radio inputs whose explicit aria-checked disagrees with their real state (WCAG 4.1.2). Not linked to 8.2.1: the W3C validator reports any aria-checked on these inputs, whatever its value, and the rule says nothing when the value agrees. rgaa-aria-attribute-conformance reports 8.2.1. Not mapped to 7.1.1: a native input is not a scripted component.'
    },
    'aria-conditional-attr': {
      tests: [],
      note: 'Flags aria-errormessage without a non-false aria-invalid (reported as cantTell). A field can legitimately carry an inert aria-errormessage while no error is shown. 11.10.3/11.10.6 accept a visible message naming the field instead of aria-invalid, so this is not direct evidence for any RGAA test.'
    },
    'aria-deprecated-role': {
      tests: [],
      note: "Flags roles that WAI-ARIA deprecates or reserves for user agents (e.g. generic). The spec only advises against these ('SHOULD NOT'); it does not make them invalid, so this is not a failed 8.2.1 validity condition. No other RGAA test covers the choice of role outside scripted components (7.1.3)."
    },
    'aria-expanded-state-mismatch': {
      tests: ['7.1.1'],
      note: 'Asks about an element whose aria-expanded says the opposite of what the page shows of the elements its aria-controls names: false while they are all shown, true while they are all hidden. A disclosure or accordion that sets aria-expanded is an interface component a script controls, and 7.1.1 condition 1 asks that its changes of state reach assistive technologies; a state that contradicts the page does not. A question, as in core: a panel may be caught mid-transition, or collapsed in a way the rule does not see.'
    },
    'aria-hidden-body': {
      tests: ['10.8.1'],
      note: 'Fails aria-hidden="true" on <body>, which hides the whole page from AT. 10.8.1 step 1 lists aria-hidden elements as hidden content, and step 2 requires hidden content to be meant to be ignored, which the whole page never is.'
    },
    'aria-hidden-focus': {
      tests: ['10.8.1'],
      note: 'Fails when an aria-hidden=true element is focusable or contains focusable descendants. That is direct evidence for 10.8.1 step 2 on aria-hidden content: keyboard users can reach content hidden from assistive technology, so it is not content meant to be ignored, yet it is not made available to AT. Other candidates (images, frames, scripts) are not about this element-level condition.'
    },
    'rgaa-aria-hidden-text-review': {
      tests: ['10.8.1'],
      note: 'Asks about each outermost element with aria-hidden="true" (not <html> or <body>) that holds visible text of two words or more: the 10.8.1 technical note says such content « ne sera donc plus vocalisable, mais restera visible », and the test passes it only when it is meant to be ignored, which only a person can tell (the text may repeat a screen-reader-only copy, or be the only place the information is). Focusable content under aria-hidden is failed by aria-hidden-focus.'
    },
    'rgaa-aria-list-item-roles': {
      tests: ['9.3.1', '9.3.2'],
      reasonCodes: {
        liWithoutListitemRole: { tests: ['9.3.1'] },
        childWithoutListitemRole: { tests: ['9.3.1'] },
        liWithoutListitemRoleOrdered: { tests: ['9.3.2'] },
        childWithoutListitemRoleOrdered: { tests: ['9.3.2'] }
      },
      note: 'Asks about an element with role="list" (not <ul> or <ol>) whose children do not all have role="listitem", <li> elements without that role included: 9.3.1 and 9.3.2 step 2 accept only <ul>/<ol> with <li>, or role="list" with role="listitem". It asks rather than fails, because whether the content is visually a list only a person can tell. Each finding counts toward one test: a list whose items are numbered (a numeric list-style-type, a CSS counter, or a leading number in every item) toward 9.3.2 (the …Ordered codes), any other toward 9.3.1.'
    },
    'aria-owns-valid': {
      tests: [],
      note: 'Fails an element named in the aria-owns of two or more elements, and an aria-owns that names its own element or an ancestor. Not linked to 8.2.1: the W3C validator reports neither, as both are valid markup. Not mapped to 7.1.1: aria-owns rebuilds the accessibility tree whether or not a script drives the element, and a lost ownership is a structure problem that the other ARIA rules, and the auditor, weigh under the criterion of the widget concerned.'
    },
    'aria-prohibited-attr': {
      tests: [],
      note: 'Fails when aria-label/aria-labelledby is set on roles where ARIA prohibits naming (generic, paragraph, strong...), and asks when the element has text (WCAG 4.1.2). Not linked to 8.2.1: the W3C validator reports every such attribute as an error, including the cases this rule asks about and the ones it exempts inside a widget, and on a native <caption>. rgaa-aria-attribute-conformance reports 8.2.1. Not mapped to 7.1.1: the rule fires on plain div, span and p elements, which are not scripted components.'
    },
    'aria-prohibited-children': {
      tests: [],
      note: 'Fails a container role that owns a child with a disallowed role. Not mapped to 9.3.1/9.3.2: most findings are on widget containers (listbox, menu, tablist, tree, radiogroup), which the 9.3 technical note says are not equivalent to an HTML list. For role="list", rgaa-aria-list-item-roles asks about items without role="listitem". Not mapped to 7.1.1: the widget-role link is indirect.'
    },
    'aria-required-attr': {
      tests: [],
      note: 'Fails when an explicit role lacks a required state/property (e.g. role=checkbox without aria-checked), and asks where WAI-ARIA gives a default value (WCAG 4.1.2). Not linked to 8.2.1: the W3C validator reports those defaulted cases as errors too (role=heading without aria-level). rgaa-aria-attribute-conformance reports 8.2.1. Not mapped to 7.1.1: its methodology steps (role, name, name consistent with state) do not check state attributes, and the rule also fires on elements no script drives.'
    },
    'aria-required-children': {
      tests: [],
      note: 'Asks (cantTell) whether a container role owns none of its required child roles. Not mapped to 9.3.1/9.3.2: most findings are on widget containers (tablist, menu, listbox, tree), which the 9.3 technical note says are not equivalent to an HTML list. For role="list", rgaa-aria-list-item-roles asks about items without role="listitem". Not mapped to 7.1.1: the widget-role link is indirect.'
    },
    'aria-required-parent': {
      tests: [],
      note: 'Fails roles such as listitem, option, tab, menuitem, treeitem or row with no valid context parent. Not mapped to 9.3.1/9.3.2: most findings are on widget items (option, tab, menuitem, treeitem), and the 9.3 technical note says those widgets are not equivalent to an HTML list. An orphan role="listitem" is left to the list rules (listitem-parent-valid, rgaa-fake-list). The table roles (row/cell) are not mapped, because 5.6 only checks header declaration. Not mapped to 7.1.1: the widget-role link is indirect.'
    },
    'rgaa-aria-role-conformance': {
      tests: ['8.2.1'],
      note: 'Fails, hidden content included, what the W3C validator (version 26.9.27) reports about role attributes: an empty value, a token that is not a role it accepts (misspelt, abstract, written with capitals, alone or in a list), a role not allowed on the element (tab on nav, navigation on main, any role on a native td), and an img with a role other than presentation or none and an empty or missing alt. That is 8.2.1, whose test asks whether the generated source is valid for its document type, judged by the W3C validator (step 1): the pack counts every error the validator reports as an 8.2.1 failure, though the glossary « Règles d’écriture » names only syntax. An img with role="presentation" (or none, its synonym) and alt="" passes, though the validator reports it: RGAA 1.2.1 names that markup for decorative images, and ARIA in HTML allows it; with no alt it fails (imgPresentationRole), as HTML requires alt on an <img> and the role does not replace it. Markup inside an open shadow root fails like the rest: a shadow root is part of the page\'s generated source (« code source généré »), which 8.2.1 judges, and these checks read only the element\'s own tree.'
    },
    'aria-role-name-present': {
      tests: ['7.1.1', '11.6.1'],
      findings: [
        {
          when: {
            role: 'grid'
          },
          tests: ['7.1.1']
        },
        {
          when: {
            role: 'tree'
          },
          tests: ['7.1.1']
        },
        {
          when: {
            role: 'radiogroup'
          },
          tests: ['11.6.1']
        },
        {
          when: {
            role: 'meter'
          },
          tests: []
        },
        {
          when: {
            role: 'progressbar'
          },
          tests: []
        }
      ],
      note: "Fails when role grid, meter, progressbar, radiogroup or tree has no aria-label, aria-labelledby or title, and no name from its host element (the legend of a fieldset, the caption of a table, the label of a <progress> or <meter>). For radiogroup, this is 11.6.1 step 2 (group has aria-label or aria-labelledby); for grid and tree widgets, 7.1.1 step 2 (component has an explicit name), which no other test covers. 11.6.1 can still pass through per-field labels (step 3). Not mapped to 11.1.1: an unnamed meter or progressbar is a form field without a label, which rgaa-field-label-listed-source reports under 11.1.1 for every field, so a link here would count the same field twice. Each finding counts toward the test of its role: grid and tree 7.1.1, radiogroup 11.6.1, and an unnamed meter or progressbar toward neither, since it is not an interface component (7.1.1) or a group of fields (11.6.1). A question since core 1.15, and left one here: 7.1.1 passes through another accessible component or alternative (steps 3 and 4), and 11.6.1 through each field's own label (step 3).",
      outsideCorrespondence: {
        '11.6.1':
          'For role="radiogroup" only: 11.6.1 step 2 requires a radiogroup to have aria-label or aria-labelledby. RGAA relates 11.6 to WCAG 1.3.1 and 3.3.2, while the engine files naming under 4.1.2.'
      }
    },
    'aria-roles-valid': {
      tests: [],
      note: 'Fails when no token of an explicit role is a real, non-abstract WAI-ARIA role, and asks on a native element whose role is unknown (WCAG 4.1.2). Not linked to 8.2.1: the W3C validator reports every unknown token, one in a list (role="bogus button") or written with capitals (role="BUTTON"), which this rule passes. rgaa-aria-role-conformance reports 8.2.1. Not mapped to 7.1.1: the rule also fires on static markup, which is not a scripted component.'
    },
    'aria-text': {
      tests: [],
      note: 'Checks that role="text" containers have no focusable descendants. role="text" is a non-standard ARIA value and no RGAA test examines it or the focusability of its content; 7.1.1 concerns roles of scripted components, not this pattern.'
    },
    'aria-valid-attr': {
      tests: [],
      note: 'Asks about aria-* attribute names not defined by WAI-ARIA (WCAG 4.1.2). Not linked to 8.2.1: the W3C validator reports these as errors, so a question is too weak there, and the rule skips hidden content. rgaa-aria-attribute-conformance reports 8.2.1. Not mapped to 7.1.1: the rule also fires on static markup, which is not a scripted component.'
    },
    'aria-valid-attr-value': {
      tests: [],
      note: 'Flags recognized aria-* attributes whose value does not match the declared type (WCAG 4.1.2), and the constraints WAI-ARIA sets between attributes (aria-valuemin above aria-valuemax, an aria-valuenow outside its range, aria-posinset above aria-setsize), and asks about an idref list that resolves to nothing, an aria-haspopup that names another role than the popup, and an aria-activedescendant outside the widget. Not linked to 8.2.1: it passes values the W3C validator rejects (aria-expanded="", a token with surrounding spaces) and skips hidden content. rgaa-aria-attribute-conformance reports 8.2.1. Not mapped to 7.1.1: the rule also fires on static markup, which is not a scripted component.'
    },
    'rgaa-autocomplete-user-field': {
      tests: ['11.13.1'],
      note: 'Checks the fields that may concern the user (11.13.1 applies only to those): fails an autocomplete value that names a field of the glossary list (email, tel, postal-code...) but is not well formed, since the author says the field is about the user; asks about a field that looks like personal data (type email, tel or password, or a label, name, id or placeholder naming a name, an address, a telephone, an email, a birth date, an identifier or a password) with no autocomplete, on, off, or a value naming no listed field, since only a person can say whether the information concerns the user; passes a well-formed value, whose relevance is for a person, except one naming a field its input type cannot hold (email on type="tel", tel on type="email", a password field on another type…), which is asked about, since one of the two is wrong. Search fields and fields that take no value are left out.'
    },
    'autocomplete-valid': {
      tests: [],
      note: "Not linked to 11.13.1, which applies only to fields « dont l'objet se rapporte à une information concernant l'utilisateur »: this rule fails an invalid value on any field, a search field or a filter included, where 11.13 does not apply. rgaa-autocomplete-user-field takes 11.13.1. Fails a non-empty autocomplete value that is not on/off or a well-formed autofill token list. A field name that does not suit its control (street-address on a single-line input) passes, as browsers still derive the purpose from it and ACT 73f2c2 leaves that out; rgaa-html-elements-attributes-valid reports it under 8.2.1, where the W3C validator does. That covers the 11.13.1 step-2 condition that the value is in the list of allowed values; it does not check that the attribute is present or relevant. Not linked to 8.2.1: the rule exempts disabled fields and fixed-value input types, which the W3C validator still checks; rgaa-html-elements-attributes-valid reports invalid autocomplete values under 8.2.1."
    },
    'avoid-inline-spacing': {
      tests: ['10.12.1'],
      note: 'Fails text whose inline style forces line-height, letter-spacing or word-spacing with !important below the WCAG 1.4.12 values. That setting defeats the style override in 10.12.1 step 1, so the text cannot receive the required spacing. Text that may never wrap (a single word, text not allowed to wrap, or text short enough to fit on one line at 320 CSS pixels) is asked about instead of failed. The rule does not check the readability or loss of content of step 2.'
    },
    'binary-control-name-present': {
      tests: [],
      note: 'Checks that elements with explicit role checkbox, radio or switch have a name from aria-labelledby, aria-label, title, an associated label or their content. It accepts a wrapping <label> and a name from content, which 11.1.1 does not list, so a pass is not an 11.1.1 pass. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only. Not mapped to 7.1.1: it passes when an accessible alternative exists.'
    },
    'button-name-present': {
      tests: [],
      note: 'Flags button, input button/submit/reset and role=button with an empty accessible name. Not mapped to 11.9.1: that test covers only the buttons inside a form (a <form> or role="form"), and most unnamed buttons are outside one; rgaa-form-button-name-present reports the buttons in a form there. Not mapped to 7.1.1 either: it passes when an accessible alternative exists, so a failure under it is not certain. rgaa-script-button-name-present reports the buttons outside a form under 7.1.3, which offers no alternative.'
    },
    'bypass-blocks-present': {
      tests: [],
      note: 'Raises a review question only when the page has no exposed <main>/role=main, no working same-page anchor link and no visible heading. WCAG 2.4.1 is met by one bypass mechanism for the page, while 12.6.1 asks for one in each area (header, main navigation, main content, footer, search), so a page this rule leaves alone can still miss 12.6.1. rgaa-page-zones-reachable reports 12.6.1 area by area.'
    },
    'rgaa-canvas-decorative-aria-hidden': {
      tests: ['1.2.5'],
      note: 'Checks each <canvas> marked decorative, without a caption. Fails aria-hidden="true" with aria-labelledby, aria-label, title, a child alternative or text inside the canvas (1.2.5 conditions 2 and 3; if the canvas carries information, hiding it fails 1.1.8 instead), and role="none"/"presentation" without aria-hidden="true" and with no content (condition 1). Asks when such a canvas has fallback content, which makes it an informative canvas that passes 1.1.8 if the content is its alternative.'
    },
    'rgaa-canvas-role-img': {
      tests: ['1.1.8'],
      reasonCodes: {
        adjacentLinkOrButton: { tests: ['1.1.8', '1.2.5'] },
        noAlternativeMayBeDecorative: {
          tests: ['1.1.8', '1.2.5'],
          outcome: 'cantTell'
        }
      },
      note: 'Checks each <canvas> not marked decorative. Passes role="img" with aria-labelledby or aria-label (steps 3 and 4), or, without role="img", fallback content (step 6). Fails a <canvas role="img"> with no ARIA name, since the note of the methodology limits its alternative to step 4, a canvas with no role, no fallback content and no link or button after it that aria-label or title names, and one with nothing at all that certainly carries information (captioned, or focusable). Asks about any other canvas with nothing at all, which may be decorative and then fails 1.2.5 instead, and when a link or button follows the canvas. A replacement mechanism cannot be detected. One that is the only content of a link or a button is left out: the glossary « Image porteuse d\'information » (notes 1 and 2) judges its alternative as the control\'s label, under 6.1, 11.9 or 7.1. A canvas that may be decorative, or is followed by a link or button, is asked about under 1.1.8 and 1.2.5.'
    },
    'canvas-text-alternative-present': {
      tests: [],
      note: 'Fails a <canvas> with neither fallback content nor an accessible name, and a <canvas role="img"> with no aria-label, aria-labelledby or title. Not mapped to 1.1.8: RGAA passes a canvas followed by a link or button to an alternative content, which this rule fails, and it accepts an aria-label or title without role="img", which 1.1.8 does not. rgaa-canvas-role-img checks 1.1.8 as RGAA words it, and rgaa-canvas-decorative-aria-hidden checks 1.2.5 for a canvas marked decorative.'
    },
    'canvas-text-alternative-quality': {
      tests: ['1.3.7', '1.3.8'],
      note: "Asks a human to judge a canvas's existing name or fallback content. That is 1.3.7 step 2 (the alternative is relevant) and, for fallback content between <canvas> and </canvas>, 1.3.8 step 2 (that content is correctly rendered by assistive technologies), which only a test with them can tell."
    },
    'rgaa-captcha-review': {
      tests: ['1.4.1', '1.4.2', '1.4.3', '1.4.4', '1.4.5', '1.4.6', '1.4.7', '1.5.1', '1.5.2'],
      note: 'Asks about visible CAPTCHAs: an image (img, area, input type=image, svg, canvas, image object or embed, role=img) whose alternative, file name, id, class or name says captcha, and a reCAPTCHA or hCaptcha widget. 1.4 asks that the alternative of an image used as a CAPTCHA « permet d’identifier la nature et la fonction de l’image », and 1.5 that « il existe une autre forme de CAPTCHA non graphique, au moins » or « une autre solution d’accès à la fonctionnalité »: both are for a person. A widget, whose images come from another site, is asked about under 1.5 only in its message; the map links every finding to both criteria. A CAPTCHA that names itself nowhere is not found.',
      reasonCodes: {
        captchaWidget: {
          tests: ['1.5.1', '1.5.2']
        }
      }
    },
    'click-handler-keyboard-operable': {
      tests: [],
      asks: ['7.3.1'],
      note: 'Checks that an element with an inline onclick that is not a native control can take keyboard focus and has a key handler, and fails one that says it is a control (role button, link, checkbox or switch) that Tab never reaches. That is 7.3.1 condition 1 (« l’élément est accessible par le clavier et tout dispositif de pointage ») for a script event handler. Linked as a question: condition 2 also passes an element whose action another keyboard-operable control of the page offers, which the rule cannot see. It only sees inline handlers.'
    },
    'rgaa-color-reference-review': {
      tests: ['3.1.2'],
      note: 'Asks about visible text that indicates something by a colour, outside code, scripts and form controls: a colour after a verb such as indiquer, signaler, marquer, surligner or afficher (« indiqués en rouge », « shown in red »), or with a word for a part of the page (« les champs en rouge », « the green items »), in French, English, Spanish or German whatever the page’s language. 3.1.2 asks, « pour chaque indication de couleur donnée par un texte », that the information is not given by colour alone; whether it is also given another way is for a person. A colour name alone (« un t-shirt rouge ») is not an indication.'
    },
    'combobox-name-present': {
      tests: [],
      note: 'Checks that role=combobox has a name from aria-label, aria-labelledby, title or an associated label. It accepts a wrapping <label> and a placeholder on a text-like <input>, which 11.1.1 does not list, so a placeholder-only field passes here while it fails 11.1.1. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only. Not mapped to 7.1.1: it passes when an accessible alternative exists.'
    },
    'rgaa-complex-table-summary': {
      tests: ['5.1.1'],
      note: 'Asks whether a summary is available for a <table> or role="table" the rule takes as complex: a header cell outside both the first row and the first column, a cell with a headers attribute, a header with scope="rowgroup" or "colgroup", or first-row (or first-column) headers that each span a group of columns (or rows), as in RGAA\'s definition of a complex data table. A table with an aria-describedby that points to some text is not asked about (one pointing to a missing or empty element marks no summary), nor one with a summary attribute in a document whose doctype is not HTML5 (5.1.1 step 2 accepts summary only before HTML5). Whether the <caption> explains the nature and structure of the table, or the table is in fact not complex, only a person can judge; a passage next to the table counts only when aria-describedby ties it to the table.'
    },
    'rgaa-complex-table-summary-quality': {
      tests: ['5.2.1'],
      note: "Asks whether the summary of a complex data table is relevant, which is 5.2.1 step 2. Complex tables are found as rgaa-complex-table-summary finds them for 5.1.1. The summary is a <caption> with text, an aria-describedby that points to text, or, before HTML5 only, a summary attribute (5.1.1 step 2). A table with no summary is 5.1.1's matter."
    },
    'rgaa-consequential-form-review': {
      tests: ['11.12.1', '11.12.2'],
      note: "Asks about visible forms that certainly have the consequences 11.12 names, found by narrow signals only: card fields (autocomplete cc-*), a current and a new password field together, or a submit button whose whole label, amounts and arrows aside, is a French or English phrase apps use for paying or ordering (« Payer », « Valider ma commande », « Place order »), deleting or closing an account (« Supprimer mon compte »), cancelling a subscription, an order or a booking (« Résilier mon abonnement »), signing (« Signer »), changing a password or sending a test's answers. 11.12.1 asks that such a form « qui modifie ou supprime des données … ou dont la validation a des conséquences financières ou juridiques » lets the user change or cancel the data afterwards, check them before a multi-step form is submitted, or confirm explicitly; 11.12.2 that changed or deleted financial, legal or personal data can be recovered or that the change is confirmed. What happens after submitting is not in the page, so a person checks. Generic labels (« Valider », « Envoyer », « Confirmer », « Enregistrer », « Supprimer », « Annuler », Submit, Save) and search forms are left out, to keep the question to forms whose consequence is certain."
    },
    'rgaa-context-change-review': {
      tests: ['7.4.1'],
      note: 'Asks about each <select>, <input> or <textarea> whose inline onchange, oninput or onblur handler submits a form, uses location, sets an href or opens a window: 7.4.1 passes a change of context only when a text warns of it before it happens or when an explicit button or link starts it, and a field is neither, so a person checks for the warning. Handlers attached from script files are not seen.'
    },
    'contrast-computable': {
      tests: ['3.2.1', '3.2.2', '3.2.3', '3.2.4'],
      note: 'Returns cantTell for visible text whose contrast cannot be computed (background image or gradient, blend mode, filter, text-shadow, opacity). This marks the text that 3.2.1 to 3.2.4 step 1 must find and measure by hand; it never gives a verdict. It does not check the paired CSS color declarations of 10.5, so 10.5 is not mapped.'
    },
    'contrast-enhanced': {
      tests: [],
      note: 'AAA check (7:1 / 4.5:1). RGAA has no enhanced-contrast test, and failing 7:1 says nothing about the 4.5:1 / 3:1 thresholds of 3.2.x (contrast-minimum covers those).'
    },
    'contrast-minimum': {
      tests: [],
      note: "Fails computable text below 4.5:1 (normal) or 3:1 (large) under WCAG 1.4.3, where bold text is large from 14pt (about 18.67px). Not linked to 3.2.1 to 3.2.4: RGAA makes bold text large from 18.5px, so this rule fails bold text from 18.5 to 18.67px with a ratio between 3:1 and 4.5:1, which 3.2.4 passes. rgaa-contrast-minimum reports 3.2.1 to 3.2.4 with RGAA's threshold."
    },
    'rgaa-contrast-minimum': {
      tests: ['3.2.1', '3.2.2', '3.2.3', '3.2.4'],
      findings: [
        {
          when: {
            'typography.isLargeText': false,
            'typography.isBold': false
          },
          tests: ['3.2.1']
        },
        {
          when: {
            'typography.isLargeText': false,
            'typography.isBold': true
          },
          tests: ['3.2.2']
        },
        {
          when: {
            'typography.isLargeText': true,
            'typography.isBold': false
          },
          tests: ['3.2.3']
        },
        {
          when: {
            'typography.isLargeText': true,
            'typography.isBold': true
          },
          tests: ['3.2.4']
        }
      ],
      note: "Fails computable text below 4.5:1, or below 3:1 for text of 24px or more and bold text of 18.5px or more, which is step 2 of 3.2.1 to 3.2.4 with RGAA's own sizes. Same code as contrast-minimum apart from the bold threshold, and three cases it asks about instead of failing: weights 600 to 699 that are large only if bold, since RGAA says « effet de graisse » without a weight; a page with a control that switches to higher contrast, which may be the mechanism of each test's second condition; and text that looks like part of a logo, which the particular case for logos and brand names makes not applicable. Decorative text is not told apart. Every failure names the four tests, though it falls under one: the tests share a reason code, so the map cannot split them. Each failure counts toward the one test its text selects: regular text under 24px 3.2.1, bold text under 18.5px 3.2.2, regular text from 24px 3.2.3, bold text from 18.5px 3.2.4 (typography fields, stable in core)."
    },
    'control-name-title-only': {
      tests: [],
      note: 'Asks about a button or link whose only name is its title, shown only on mouse hover (best practice). RGAA accepts a title as a name: 6.1 and 11.9 judge whether the name is relevant, not where it comes from. A link with no content but a title fails 6.2.1 under rgaa-link-content-label-present, and an image link named only by its title is 6.1.2, which link-name-quality asks about.'
    },
    'rgaa-cryptic-content-review': {
      tests: ['13.5.1'],
      note: 'Asks about text emoticons (« :-) », « ;) », « <3 »…), emoji and ASCII art (a <pre> of three lines or more mostly made of signs) with no title on themselves or their parent, outside code and not named by role="img" or hidden: 13.5.1 asks each « contenu cryptique (art ASCII, émoticône, syntaxe cryptique) » for a title or « une définition donnée par le contexte adjacent », and whether the context defines it is for a person.'
    },
    'rgaa-css-colors-paired': {
      tests: ['10.5.1', '10.5.2', '10.5.3'],
      reasonCodes: {
        COLOR_WITHOUT_BACKGROUND: {
          tests: ['10.5.1']
        },
        BACKGROUND_WITHOUT_COLOR: {
          tests: ['10.5.2'],
          outcome: 'cantTell'
        },
        BACKGROUND_IMAGE_WITHOUT_COLOR: {
          tests: ['10.5.3']
        }
      },
      note: 'Fails an element whose CSS text color reaches rendered text with no background color declared on it or any ancestor (10.5.1), or whose background image reaches text with no background color (10.5.3), and asks about a background color that reaches text with no text color (10.5.2). Declarations are read from the style sheets, style and presentational attributes, so a browser default never counts as declared. Each finding counts toward the test of its reason code. It asks instead when a style sheet cannot be read, since the missing half may be there. Text inside a shadow root is not judged. Not mapped to WCAG: F24 describes the same pattern, but as an informative failure technique whose premise, a browser that overrides only some of the colors, WCAG states in no success criterion.'
    },
    'css-focus-indicator-suppressed': {
      tests: ['10.7.1'],
      note: "Flags tab-order elements whose outline is removed, by a :focus/:focus-visible rule or by a rule with no state such as a { outline: none }, with no border, box-shadow or background replacement in any matching focus rule. That is 10.7.1 condition 1 (native focus style removed) and step 2 (visual focus indicator present). The 3:1 contrast part of step 2 is rgaa-focus-indicator-contrast's."
    },
    'css-hidden-focus': {
      tests: ['10.7.1'],
      note: 'Asks about keyboard-focusable elements that are visually hidden (opacity 0, clipped, off-screen, zero-size with overflow hidden), so taking focus on them gives no visible indication. An element that a :focus/:focus-visible rule brings back into view, such as an off-screen skip link, is not flagged. This is 10.7.1 step 2 on focusable elements: the focus is taken with no visible indication. Not linked to 12.8.1: whether the tab order is coherent is a separate question, which manual-review asks under 12.8.1. It is not 10.8.1, because the content stays exposed to AT and the problem is purely visual.'
    },
    'css-orientation-lock': {
      tests: ['13.9.1'],
      note: 'Fails an @media (orientation) block that rotates the page by about 90 degrees, a known way to force one orientation. That is direct evidence that viewing is not possible in both portrait and landscape (13.9.1 step 2). An orientation block that hides the main content (a "rotate your device" message) is asked about. The essential-orientation exception still needs a human.'
    },
    'rgaa-current-item-review': {
      tests: ['10.9.1'],
      note: 'Asks about each link inside <nav>, role="navigation" or role="menubar" marked as the current one by a class (active, current, selected, is-active…, on the link or its list item) with no aria-current and no text that says so: 10.9.1 forbids information given « uniquement par la forme, taille ou position », and the glossary « Indication donnée par la forme, la taille ou la position » gives the visual marker of the active page in a navigation menu as its first example. The class may change nothing on screen, so a person checks.'
    },
    'rgaa-data-table-headers-review': {
      tests: ['5.3.1', '5.6.1', '5.6.2'],
      note: 'Asks about a table of at least two rows and two columns that has no header cell at all (no <th>, no columnheader or rowheader role), and is not role="presentation" or "none". If it is a data table, its headers over a whole column or row fail 5.6.1 or 5.6.2 unless marked with <th> or those roles; only a person can say whether it is a data table and which cells are headers. If it is a layout table, 5.3.1 asks it for role="presentation", which it lacks; the question covers that test too. In a table with headers and no spans, a first row or first column (two cells or more) of bold data cells is asked about too: headers marked up as <td> fail 5.6.1 or 5.6.2.',
      reasonCodes: {
        BOLD_CELLS_MAY_BE_HEADERS: {
          tests: ['5.6.1', '5.6.2']
        }
      }
    },
    'rgaa-default-language-review': {
      tests: ['8.4.1'],
      note: 'Asks, on <html>, about a default language whose code is und or mul (undeterminedLang), valid ISO 639-2 codes that name no language, and about a page whose own visible text (50 words or more, outside elements with their own lang, code and form controls) is, by the share of frequent function words of French, English, Spanish, Portuguese, Italian, German and Dutch, clearly in another language than the code says (langMismatch). 8.4.1 asks that the code be « pertinent », which the methodology reads as « qui indique la langue principale du document »; a guess from words is for a person to confirm. A missing or invalid default language is notApplicable here: rgaa-page-language-present and rgaa-html-lang-code-valid judge it.'
    },
    'definition-list-children-valid': {
      tests: ['9.3.3'],
      note: 'Asks about a <dl> whose children are not dt/dd groups (one wrapping div allowed), that has text directly inside it, or whose dt/dd set is unbalanced or out of order (a dd before the first dt, a dt after the last dd): if the page presents the stray content as a term or a description of the list, the description list is not built from <dl>/<dt>/<dd>, which is step 2 of 9.3.3. It asks rather than fails because the stray content may be a heading, a separator or a wrapper not presented as part of the list, which 9.3.3 does not judge; its invalid nesting still fails 8.2.1 through rgaa-html-nesting-valid, which reports the dl content model there, so the defect is not lost. Not linked to 8.2.1: the rule accepts some content the HTML content model rejects (such as a <style> child) and skips hidden lists.',
      reasonCodes: {
        DL_INVALID_CHILD: {
          outcome: 'cantTell'
        },
        DL_NO_DT_DD: {
          outcome: 'cantTell'
        },
        DL_DT_DD_ORDER: {
          outcome: 'cantTell'
        }
      }
    },
    'deprecated-elements-not-used': {
      tests: [],
      note: 'Asks about each <marquee>, the only element it reports (<blink> is left out, since no browser makes it blink). Not mapped to 10.1.1, where rgaa-presentational-elements-absent already reports <marquee> and <blink>: linking both would count the same element twice. Not mapped to 8.2.1: rgaa-html-elements-attributes-valid fails every obsolete element there, hidden ones included, and a question on the same <marquee> would count it twice. Not mapped to 13.8.1/13.8.2: even a <marquee> that can be paused passes 13.8.1, so moving content is left to the auditor.'
    },
    'dialog-name-present': {
      tests: ['7.1.1'],
      note: 'Checks that role=dialog/alertdialog (the first concrete token of the role attribute) and an open native <dialog> have a name from aria-label, aria-labelledby or title. A dialog is a script-driven interface component, and 7.1.1 step 2 requires it to have an explicit name. No other RGAA test covers dialog naming. Medium because 7.1.1 can still pass through an accessible alternative. A question since core 1.15, and left one here: 7.1.1 passes through another accessible component or alternative (steps 3 and 4).'
    },
    'rgaa-dir-attribute-valid': {
      tests: ['8.10.2'],
      note: 'Fails a dir attribute whose value is not rtl or ltr, which is the first condition of 8.10.2 ("La valeur de l’attribut dir est conforme (rtl ou ltr)"). dir="auto", valid HTML, fails too on text that reads in the reverse direction of its context, since RGAA names only the two values; on other text it is not applicable, as 8.10.2 step 1 covers only the passages of 8.10.1. A value with surrounding spaces fails: browsers ignore it. The second condition, relevance, fails a dir that changes the direction on text whose letters all read in the old one (dir="rtl" on French text): such a value cannot be « pertinente ». Other questions of relevance need a human.'
    },
    'dlitem-parent-valid': {
      tests: ['9.3.3'],
      note: 'Fails a <dt>/<dd> that is not inside a <dl> (directly or via one div), so a description list is not structured with <dl>, <dt> and <dd> (9.3.3 step 2). Not linked to 8.2.1: rgaa-html-nesting-valid reports an orphan dt or dd there, hidden content included, so a link here would count it twice. Core asks, as only HTML breaks; 9.3.3 names <dl>, <dt> and <dd>, so it fails here.',
      reasonCodes: {
        DLITEM_INVALID_PARENT: {
          outcome: 'fail'
        }
      }
    },
    'rgaa-doctype-position': {
      tests: ['8.1.3'],
      note: "Passes a doctype in the DOM, since the HTML parser keeps one only when it comes before <html>. With no doctype in the DOM, reads the start of the response body from the page.source probe and fails a doctype that comes after the <html> tag, comments skipped, which is exactly 8.1.3. A source with no doctype is notApplicable (8.1.1's). It asks when the probe is missing or its start shows neither tag."
    },
    'rgaa-doctype-present': {
      tests: ['8.1.1'],
      note: 'Fails a page with no doctype (8.1.1). A doctype written after <html> is dropped by the HTML parser, so without the page source it fails as missing; with the page.source probe, a doctype the source shows after <html> is present and passes here, and rgaa-doctype-position fails its place under 8.1.3. Not linked to 8.1.2: rgaa-doctype-valid judges the validity of a declared doctype.'
    },
    'rgaa-doctype-valid': {
      tests: ['8.1.2'],
      note: "Passes the HTML5 doctype and the published HTML and XHTML doctypes it knows (HTML 2.0 to 4.01, ISO/IEC 15445 HTML, XHTML 1.0 and 1.1, XHTML Basic, XHTML Mobile Profile, XHTML plus MathML/SVG, the RDFa doctypes). RGAA 8.1.2 asks that the doctype be « valide » and names no list; the glossary « Type de document » is the reference data that tells user agents the page's languages. So it fails with certainty only a doctype that cannot be valid: a name other than html, which does not describe an HTML page, or the HTML5 form with a system identifier other than about:legacy-compat; and it asks (unknownPublicId) about any other public identifier, for a person to look up. A page with no doctype is not applicable here; rgaa-doctype-present fails it under 8.1.1."
    },
    'duplicate-id': {
      tests: ['8.2.1'],
      reasonCodes: {
        DUPLICATE_ID_IN_SHADOW_TREE: {
          outcome: 'fail'
        }
      },
      note: 'Fails on non-empty id values that are not unique in their document or shadow tree, compared as written (id="a " and id="a" differ). That is the 8.2.1 condition \'Les valeurs d\'attribut id sont uniques dans la page\'. Core asks rather than fails under WCAG 2.1, whose 2023 errata count 4.1.1 as satisfied; the rgaa-4.1.2 profile keeps 4.1.1 (keepsParsing), as RGAA 8.2 still requires valid code, so it fails there. A duplicate inside one shadow tree (DUPLICATE_ID_IN_SHADOW_TREE) fails 8.2.1 too: a shadow root is part of the page\'s generated source (« code source généré »), and core compares each shadow tree only with itself, so the same id in two different shadow roots, which is correct markup, is never reported.'
    },
    'duplicate-id-aria': {
      tests: [],
      note: 'Flags duplicate id values that ARIA ID-reference attributes point to (WCAG 4.1.2). Not linked to 8.2.1: duplicate-id already fails every duplicate id under 8.2.1, these included, so linking this rule too would count the same ids twice.'
    },
    'rgaa-embed-image-role-img': {
      tests: ['1.1.7'],
      reasonCodes: {
        alternativeWithoutRoleImg: { tests: ['1.1.7', '1.2.6'] },
        adjacentLinkOrButton: { tests: ['1.1.7', '1.2.6'] },
        noAlternativeMayBeDecorative: { tests: ['1.1.7', '1.2.6'], outcome: 'cantTell' }
      },
      note: 'Checks each <embed type="image/..."> not marked decorative. Passes role="img" with aria-labelledby, aria-label or title. Fails an embed with no text alternative and no link or button right after it, which meets none of the conditions of 1.1.7 short of a replacement mechanism the page would have to offer, when it has role="img" or certainly carries information (captioned, or focusable); asks about any other, which may be decorative and then fails 1.2.6 instead. Asks when there is a text alternative without role="img" (the first condition and step 2 of the methodology ask for both, so only a link or button after it or a replacement mechanism lets an informative one pass) and when a link or button follows (does it lead to an alternative content?). One that is the only content of a link or a button is left out: the glossary « Image porteuse d\'information » (notes 1 and 2) judges its alternative as the control\'s label, under 6.1, 11.9 or 7.1. Each question also covers 1.2.6, which a decorative embed without aria-hidden="true" fails.'
    },
    'embed-text-alternative-present': {
      tests: [],
      note: 'Fails an <embed> with no aria-label, aria-labelledby or title. Not mapped to 1.1.7: that test covers only type="image/...", while the rule fails every <embed>, and RGAA passes an embed followed by a link or button to an alternative content, which this rule fails. rgaa-embed-image-role-img checks 1.1.7 as RGAA words it.'
    },
    'embed-text-alternative-quality': {
      tests: ['1.3.5'],
      note: 'Asks a human to judge the relevance of an <embed>\'s existing name, which is 1.3.5 step 2. Scope mismatch: 1.3.5 only covers image embeds (type="image/..."), and the rule reviews all embeds, so the steps first ask whether the embed shows an image.'
    },
    'rgaa-embedded-player-review': {
      tests: [
        '4.1.1',
        '4.1.2',
        '4.1.3',
        '4.3.1',
        '4.5.1',
        '4.5.2',
        '4.7.1',
        '4.11.1',
        '4.11.2',
        '4.11.3',
        '4.13.1'
      ],
      note: 'Asks about visible frames of known media players (YouTube, Vimeo, Dailymotion, PeerTube, SoundCloud): each shows « un média temporel », which theme 4 asks to have, if needed, a transcript (4.1), synchronised captions (4.3), an audio description (4.5), adjacent text that identifies it (4.7), keyboard and pointer control (4.11) and compatibility with assistive technologies (4.13). What the media holds and what the player offers is for a person. A player that starts by itself (autoplay=1, auto_play=true) also counts toward 4.10.1, whose « code JavaScript » covers it (reason code embeddedPlayerAutoplay). Other players are not found.',
      reasonCodes: {
        embeddedPlayerAutoplay: {
          tests: [
            '4.1.1',
            '4.1.2',
            '4.1.3',
            '4.3.1',
            '4.5.1',
            '4.5.2',
            '4.7.1',
            '4.10.1',
            '4.11.1',
            '4.11.2',
            '4.11.3',
            '4.13.1'
          ]
        }
      }
    },
    'rgaa-embedded-refresh-review': {
      tests: ['13.1.1'],
      note: 'Asks about every <object>, <embed> and <canvas>, and every <svg> that holds a <script>: 13.1.1 step 1 lists them as refresh methods along with <meta>. An <object> or <embed> that shows a still image is left out, and so is an <svg> with no script, which cannot reload anything. Whether the element refreshes, and whether the user can control it (step 2), needs a person.'
    },
    'empty-heading': {
      tests: [],
      note: 'Asks about <h1>-<h6>/role="heading" elements with an empty accessible name. Not mapped to 9.1.2: RGAA fails an empty heading outright, which rgaa-heading-content-present reports, and this rule accepts a title or aria-label name that 9.1.2 does not count as content.'
    },
    'empty-table-header': {
      tests: [],
      note: 'Flags th/columnheader/rowheader cells with no visible text. RGAA 5.6 checks that headers are declared with th or a header role, and 5.7 checks how cells are associated with them. No RGAA test covers the content or relevance of a header cell.'
    },
    'rgaa-fake-list': {
      tests: ['9.3.1', '9.3.2'],
      note: 'Asks whether lines or consecutive paragraphs that start with the same bullet (9.3.1) or with consecutive numbers (9.3.2) are a list, which those tests want marked up with <ul>/<ol> and <li>, or role="list" and role="listitem". Lists drawn with images or CSS alone are not found.',
      reasonCodes: {
        unorderedListAsText: {
          tests: ['9.3.1']
        },
        orderedListAsText: {
          tests: ['9.3.2']
        }
      }
    },
    'rgaa-field-group-legend': {
      tests: ['11.6.1'],
      note: 'Asks about a <fieldset> holding form fields with no <legend>, or a role="group" or role="radiogroup" holding form fields with no aria-label or aria-labelledby: the only legends 11.6.1 step 2 accepts (aria-label on a plain fieldset and title on a group do not count). 11.6.1 requires a legend on each grouping of fields of the same kind; whether this group is one, and whether each field instead names the group (step 3), is left to a person.'
    },
    'rgaa-field-hidden-label-review': {
      tests: ['11.1.3'],
      note: "Asks about a visible form field whose <label> elements hold text but are all visually hidden, with no aria-labelledby to visible text: 11.1.3 covers a field « ayant une étiquette dont le contenu n'est pas visible », and asks for a title, or a passage next to the field that is or becomes visible, that makes the expected input understandable, which only a person can judge. Fields named only by aria-label, title or a placeholder are asked about by form-control-programmatic-label-quality."
    },
    'rgaa-field-label-consistency-review': {
      tests: ['11.3.1'],
      note: 'Asks about visible fields of a page that share an autocomplete value naming a field (email, tel, postal-code…, section and shipping/billing/home/work tokens included; not on or off) but whose visible labels (<label>, else aria-labelledby passages) differ once case, accents, punctuation, text in parentheses and words for required or optional are ignored. 11.3.1 asks that each « étiquette associée à un champ de formulaire ayant la même fonction et répétée plusieurs fois dans une même page » be « cohérente », which the glossary « Étiquettes cohérentes » defines as « formulées sans ambiguïté pour que l’utilisateur sache que l’information qu’il doit communiquer est la même »: different wordings can meet that, so a person decides. Fields with no autocomplete value are not compared. 11.3.2 (a set of pages) is not covered.'
    },
    'rgaa-field-label-in-name-sources': {
      tests: ['11.2.5'],
      note: 'Fails a form field (glossary "Champ de saisie de formulaire", native and ARIA) with a visible label when the source that gives its accessible name (aria-labelledby, aria-label, <label> or title, in the glossary\'s order) does not contain that label. Another source that does not contain it is not judged: 11.2.5\'s conditions name each source, but its methodology and the glossary « Étiquette de champ de formulaire » judge the étiquette, the source that gives the name, so such a field passes. Punctuation and capital letters are ignored (particular cases of 11.2), which excuse nothing else: « contient » is read as words, so an abbreviation written out, a word with another ending ("Rechercher" for "Recherche") or text in parentheses left out fails. Asks only when the visible label may be a symbol. The visible label is read from the <label>, else from aria-labelledby, else from the field\'s own text for the checkbox, radio and switch roles.'
    },
    'rgaa-field-label-listed-source': {
      tests: ['11.1.1'],
      note: 'Fails a form field (those of the glossary entry "Champ de saisie de formulaire", native and ARIA, without option, optgroup and datalist) that has none of the sources 11.1.1 lists: an aria-labelledby pointing to text, an aria-label, a <label for> or a title. A placeholder, the field\'s own content and an <output>\'s value do not count. A field whose only label is a <label> wrapping it without for fails too, as 11.1.1 names « une balise <label> ayant un attribut for » (the glossary "Étiquette de champ de formulaire" defines a label, the test the sources it accepts); it is asked about when a button sits next to the field or its label, since the fifth condition (an adjacent button with a visually hidden <label>) does not name for. A <label for> pointing at an element a label cannot name fails, as it gives the field no label, except on a custom element, which is asked about since a form-associated one is labelable. An <output> that belongs to no form (no <form> or role="form" ancestor, no form owner) is left out: the glossary makes a field an « objet d\'un formulaire », and its message is judged under 7.5. A field whose sources are all empty (an empty aria-label or title, a <label for> or aria-labelledby passage with no text) fails too: the glossary « Étiquette de champ de formulaire » makes the label a « texte », so an empty source is no label, and 11.2\'s tests on each source\'s relevance apply only to a label that is there. It takes over 11.1.1 from the WCAG field-name rules, which accept a wrapping label, a placeholder or a name from content.'
    },
    'rgaa-figure-caption-structure': {
      tests: ['1.9.1', '1.9.2', '1.9.3', '1.9.4', '1.9.5'],
      findings: [
        {
          when: {
            imageKind: 'img'
          },
          tests: ['1.9.1']
        },
        {
          when: {
            imageKind: 'object'
          },
          tests: ['1.9.2']
        },
        {
          when: {
            imageKind: 'embed'
          },
          tests: ['1.9.3']
        },
        {
          when: {
            imageKind: 'svg'
          },
          tests: ['1.9.4']
        },
        {
          when: {
            imageKind: 'canvas'
          },
          tests: ['1.9.5']
        }
      ],
      note: 'For a <figure> holding an image and a <figcaption> with text, fails when the figure has no role="figure" or role="group", or no aria-label identical to the caption: conditions 2 and 3 of 1.9.1 to 1.9.5. A finding counts toward the test of the figure\'s first image, by the kind it records: <img>, <input type="image"> or role="img" 1.9.1, <object type="image/..."> 1.9.2, <embed> 1.9.3, <svg> 1.9.4, <canvas> 1.9.5. Conditions 1 and 4 (figure and figcaption) are what make the rule apply, so a caption given another way is not found.'
    },
    'rgaa-focus-indicator-contrast': {
      tests: ['10.7.1'],
      note: "Fails an element in the tab order whose native outline a focus rule replaces or removes, when every outline, border and box-shadow of its focus style is below 3:1 against both the background behind it and the element's own background, and nothing else changes on focus. That is the contrast part of 10.7.1 step 2 (« suffisamment contrastée (ratio de contraste égal ou supérieur à 3:1) »). It asks when a color, a background or the cascade cannot be worked out, when the indicator reaches 3:1 on one side only, or when the focus style is something else (background, text color, another element). An element that keeps the browser's outline meets condition 1 and is not checked. In a browser the element is focused and the rendered indicator is measured against what is painted on each side, so variables, @media and the cascade are settled there. A style drawn on an ancestor or a label on focus (:focus-within, :has(:focus), or any change there in a browser) is not measured, so the element is asked about rather than failed on its own outline."
    },
    'focus-not-removed-by-script': {
      tests: ['7.3.2'],
      note: 'Fails an element in the tab order whose inline onfocus handler does nothing but blur() it (WCAG F55), so focus is removed as soon as the element receives it: 7.3.2, « un script ne doit pas supprimer le focus d’un élément qui le reçoit ». It asks about a handler that calls blur() among other code, or focus() on another element, and about an element out of the tab order whose handler only blurs it: there, only tabbing to the element shows whether focus is lost.'
    },
    'focus-order-semantics': {
      tests: [],
      note: 'Flags elements with tabindex>=0 and a non-interactive explicit role (heading, list, region...). When such an element is a scripted control, 7.1.1 step 2 (role consistent with its use) directly applies. Legitimately focusable elements such as scrollable regions make this only partial evidence. Not mapped to 7.1.1: only evidence when the element is a scripted component. Not mapped to 12.8.1: 12.8.1 checks that the tab order is coherent, not the role of what receives focus.'
    },
    'rgaa-form-button-label-in-name-sources': {
      tests: ['11.9.2'],
      note: 'Fails a button inside a <form> or role="form" whose accessible name does not contain its visible label (its text, or the value of an <input> button), which is 11.9.2 methodology step 2. A title, or an aria-label that loses to aria-labelledby, that does not contain it is not judged: the test\'s conditions check every source, but its methodology and the glossary « Bouton (formulaire) » judge the accessible name alone, so such a button passes. Buttons outside a form are out of scope (step 1 covers « les boutons présents au sein d\'un formulaire »), and an image button shows its label inside the image. Punctuation and capital letters are ignored (particular cases of 11.2), and nothing else: an abbreviation written out, a word with another ending or text in parentheses left out fails. Asks only when the visible label may be a symbol.'
    },
    'rgaa-form-button-name-present': {
      tests: ['11.9.1'],
      note: 'Fails a button (<button>, input submit/reset/button/image, role=button) inside a <form> or role="form" that has no label from the sources the glossary "Bouton (formulaire)" lists: it has nothing whose relevance 11.9.1 step 2 could judge. Buttons outside a form are out of scope, since 11.9.1 step 1 covers only « les boutons présents au sein d\'un formulaire ». A nameless button that joins a form through its form attribute from outside it fails too, as that attribute makes it a button of the form (glossary « Bouton (formulaire) »). Asks about an image button with no alt, in a form or joined to one, which the browser names with a generic "Submit". A pass says only that a label exists; its relevance is left to a person.'
    },
    'form-control-label-quality': {
      tests: ['11.2.1', '11.2.4'],
      note: 'Takes the visible label text of a field, from a native <label> or from aria-labelledby references, and flags placeholder labels or duplicate labels with no visible context telling the fields apart. That covers 11.2.1 (the <label> content is relevant) and 11.2.4 (aria-labelledby text is relevant). aria-label and title are not used, so 11.2.2 and 11.2.3 are not covered. A label partly hidden (PARTIALLY_HIDDEN_LABEL) is asked about under 11.1.3, which covers a label whose content is not visible: whether its visible part, a title or a visible text next to the field makes the expected input understandable. Its whole content, hidden part included, is what 11.2.1 and 11.2.4 judge.',
      reasonCodes: {
        PARTIALLY_HIDDEN_LABEL: {
          tests: ['11.1.3']
        }
      }
    },
    'form-control-programmatic-label-present': {
      tests: [],
      note: 'Fails input/select/textarea controls (not hidden/submit/reset/button/image) that have no associated <label>, aria-labelledby, aria-label, title or placeholder. It accepts a wrapping <label> and a placeholder, which 11.1.1 does not list, so a placeholder-only field passes here while it fails 11.1.1. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only.'
    },
    'form-control-programmatic-label-quality': {
      tests: ['11.1.3', '11.2.2', '11.2.3', '11.2.4'],
      note: "Asks about native input/select/textarea controls whose only name is a placeholder, a title, an aria-label, or aria-labelledby pointing only at hidden text; a control not drawn on screen (transparent or clipped away) is left out. Those are the labels 11.1.3 covers, a label that is not visible (masqué, aria-label): its step asks whether a title, or text next to the field, makes the expected input understandable, which only a person can tell. 11.2.2 asks whether a title is relevant. A field named only by its placeholder counts toward no test: a placeholder is no étiquette (glossary « Étiquette de champ de formulaire »), so the field has none and 11.1.3, which judges a label that is there, does not apply; it meets none of the 11.1.1 conditions, and rgaa-field-label-listed-source fails it there. The rule is filed under WCAG 3.3.2, which RGAA relates to 11.2. Also linked to 11.2.3 and 11.2.4, which ask whether a label given by aria-label, or by a passage linked with aria-labelledby, tells the field's exact function: the rule asks that about fields named only by aria-label or by aria-labelledby, and a question is never a false failure.",
      reasonCodes: {
        label_from_title_primary: {
          tests: ['11.2.2']
        },
        label_from_aria_label_only: {
          tests: ['11.1.3', '11.2.3']
        },
        label_from_hidden_labelledby: {
          tests: ['11.1.3', '11.2.4']
        },
        label_from_placeholder_primary: {
          tests: []
        }
      }
    },
    'form-control-single-label': {
      tests: [],
      note: "Asks about a control named by two or more <label> elements with text, which browsers join into one name. No RGAA test forbids multiple labels. 11.1.1 (a label exists) and 11.1.2 (for/id match) are met in that case, and 11.2.1 judges each label's wording, not how many labels there are; multiple labels are also valid HTML, so 8.2.1 does not apply."
    },
    'rgaa-format-hint-review': {
      tests: ['11.11.1', '11.11.2'],
      note: 'Asks about a visible, enabled, editable text-like field with an input control (glossary « Contrôle de saisie »: a pattern, a minlength, a min or max on a number, date or time field, or an inputmode of numeric, decimal, tel, email or url) whose label, title, aria-labelledby or aria-describedby passages and placeholder show no digit and no word such as « ex. », « format » or « jj/mm/aaaa ». 11.11.1 and 11.11.2 ask that « pour chaque erreur de saisie », « les types et les formats de données » and « des exemples de valeurs attendues » be suggested « si nécessaire »; the error message shows only once a value is rejected, so a person checks it. A pattern with a title is left out: the technical note of 11.11 says this « valide également le critère ». maxlength alone is left out, since the browser stops the typing at the limit and no input error arises.'
    },
    'rgaa-frame-title-attribute-present': {
      tests: ['2.1.1'],
      note: 'Fails an <iframe> or <frame> with no title attribute, which is 2.1.1 step 2 as written, or with an empty or blank one: criterion 2.1 asks for a « titre de cadre », which the glossary defines as the content of the title attribute, so an empty attribute gives the frame no title. Auditors report an empty title under 2.1, and 2.2.1 applies only to frames that have a title, which rgaa-frame-title-relevant asks about. Test 2.1.1 as written asks only for the attribute, so this follows the criterion and the glossary rather than the letter of the test. aria-label or aria-labelledby does not replace it, and a frame with tabindex="-1" is still checked. A frame with aria-hidden="true" on itself or an ancestor is left out, since the glossary "Titre de cadre" (note 2) makes 2.1 not applicable to it.'
    },
    'rgaa-frame-title-relevant': {
      tests: ['2.2.1'],
      note: 'Asks, quoting it, whether the title of each frame that has a non-empty one says what the frame contains, which is 2.2.1 step 2. Frames with aria-hidden="true" are left out (glossary "Titre de cadre", note 2). A frame with no title or an empty one fails 2.1.1 (rgaa-frame-title-attribute-present) and is left out here.'
    },
    'rgaa-heading-content-present': {
      tests: ['9.1.2'],
      note: 'Fails an RGAA heading (<hx>, or role=heading with aria-level) whose content holds no text and no image with a text alternative: 9.1.2 step 1 judges the content of each heading, and an empty one has none. Asks when the only name comes from title or aria-label, or when the content is hidden text, an image with no alternative, CSS-generated text or an embedded element.'
    },
    'heading-order': {
      tests: ['9.1.1'],
      note: 'Flags heading levels that jump by more than one (hx, with its aria-level when valid, and role=heading/aria-level). This is direct input to 9.1.1 step 2, whether the heading hierarchy is relevant. RGAA does not treat every skipped level as a failure automatically, hence manual review.'
    },
    'heading-quality': {
      tests: ['9.1.2'],
      note: "Flags headings (hx or role=heading) whose accessible name is a placeholder, template slot, filename or URL. That is 9.1.2 step 1: is each heading's content relevant."
    },
    'rgaa-heading-role-level-present': {
      tests: ['9.1.3'],
      note: 'Fails an element with role=heading and no numeric aria-level. 9.1.3 step 1 accepts only an <hx> element or role=heading with aria-level=x, and the glossary "Titre" defines a heading the same way; the WAI-ARIA default level of 2 does not count.'
    },
    'rgaa-headings-absent-review': {
      tests: ['9.1.3'],
      note: 'Asks about a page with 30 words or more of visible text and no heading at all (no <hx>, no role="heading", hidden ones included). 9.1.3 asks that « chaque passage de texte constituant un titre » be marked as one; a page of some length with no heading usually has such passages, but a short page may have none, so a person decides.'
    },
    'rgaa-html-elements-attributes-valid': {
      tests: ['8.2.1'],
      note: "Fails, hidden content included, obsolete or unknown elements and attribute values the W3C validator rejects: dir, id (empty or with whitespace), lang (not a well-formed language tag), xml:lang without a matching lang, scope (an invalid value on th, or scope on any other element, td included: scope on td is obsolete in HTML, so not conforming, although the validator only warns), headers naming no th of the table, optgroup without label, image buttons with no alt or an empty one, and autocomplete values and placements. Each is 8.2.1's condition that tags, attributes and attribute values respect the writing rules. Asks instead on a page whose doctype is neither HTML5 nor missing, since 8.2.1 judges the source against the declared doctype. Where the validator is stricter than the HTML standard (on/off in capitals, unregistered subtags), the rule does not report. Markup inside an open shadow root fails like the rest: a shadow root is part of the page's generated source (« code source généré »), which 8.2.1 judges, and these checks read only the element's own tree."
    },
    'html-lang-attr-present': {
      tests: [],
      note: 'Fails when lang on <html> is missing or empty, or its primary subtag is not a registered language subtag (WCAG 3.1.1). Not linked to 8.3.1 or 8.4.1: 8.3.1 also accepts xml:lang (the attribute XHTML 1.1 asks for) and a language on every text or one of its parents, such as <body lang>, which this rule fails; and the registry it checks against leaves out ISO 639-2 codes such as fra, which 8.4.1 accepts. rgaa-page-language-present reports 8.3.1 and rgaa-html-lang-code-valid 8.4.1. Also fails a type on <input> or <button> that is not one of its keywords (type="bouton"), as the validator does.'
    },
    'rgaa-html-lang-code-valid': {
      tests: ['8.4.1'],
      note: "Fails when the language code of lang or xml:lang on <html>, the part before the first hyphen (glossary \"Code de langue\"), is not an ISO 639-1, 639-2 or later ISO 639 code: the 'valide' condition of 8.4.1 step 2. ISO 639-2 codes such as fra or ger count as valid. Not applicable without a default language on <html>. Relevance (the 'pertinent' condition) is not judged."
    },
    'rgaa-html-nesting-valid': {
      tests: ['8.2.1'],
      note: "Fails, hidden content included, the nesting errors the W3C validator reports on lists (a ul, ol or menu child other than li, an li outside them), description lists (the dl content model, a dt or dd outside a dl), interactive content or tabindex inside a link or button, img ismap outside a link, and more than one main without the hidden attribute. That is 8.2.1's condition that tag nesting conforms. Nesting that uses only ARIA roles is a validator warning and is not reported. Asks instead on a page whose doctype is neither HTML5 nor missing, since the nesting rules of older doctypes differ. Markup inside an open shadow root fails like the rest: a shadow root is part of the page's generated source (« code source généré »), which 8.2.1 judges, and these checks read only the element's own tree."
    },
    'html-xml-lang-mismatch': {
      tests: ['8.4.1'],
      note: "Fails when lang and xml:lang on <html> declare different primary languages, so at least one of them does not give the document's main language (8.4.1 'pertinent'). Not mapped to 8.3.1: the rule only applies when both attributes are present, so a language is always indicated. Not linked to 8.2.1: the validator compares the full values, so fr-FR against fr is a validity error this rule passes; rgaa-html-elements-attributes-valid reports it under 8.2.1."
    },
    'identical-iframes-same-purpose': {
      tests: [],
      note: 'Flags iframe/frame elements that share an accessible name but embed different resources (WCAG 4.1.2). Not linked to 2.2.1, which judges only the title attribute: this rule groups frames by accessible name, which may come from aria-label. rgaa-frame-title-attribute-present fails an empty title under 2.1.1, and rgaa-frame-title-relevant asks whether a non-empty one is relevant. Also fails flow content (div, p, a list, a table, a heading…) inside an element whose content model is phrasing only (button, label, span, a heading, p…), through a transparent <a>, as the validator does.'
    },
    'identical-links-same-purpose': {
      tests: ['6.1.1', '6.1.2', '6.1.3', '6.1.4'],
      note: 'Asks whether links with the same name but different destinations serve the same purpose. That is note 3 of the glossary entry « Intitulé de lien »: « plusieurs liens ayant une destination différente dont le "nom accessible" est identique. L\'intitulé de lien seul sera considéré comme non-explicite si le contexte de lien ne permet pas de les différencier » — the question 6.1.1 to 6.1.4 ask of text, image, composite and SVG links. It only asks, since the context may tell the links apart, and which of the four tests applies depends on the kind of link.',
      outsideCorrespondence: {
        '6.1.1':
          'Glossary « Intitulé de lien », note 3: same-named links to different destinations are not explicit unless their context tells them apart. RGAA relates 6.1 to WCAG 1.1.1, 2.4.4 and 2.5.3; the engine files this check under 2.4.9.',
        '6.1.2': 'As for 6.1.1, for image links.',
        '6.1.3': 'As for 6.1.1, for composite links.',
        '6.1.4': 'As for 6.1.1, for SVG links.'
      }
    },
    'iframe-focusable-content': {
      tests: [],
      note: "Fails same-origin iframes with tabindex=-1 that contain focusable content (inconsistent keyboard reachability). No candidate fits: 7.3 is about elements with script handlers, 4.11/4.12 about media, 10.14/12.11 about extra content shown on hover or focus, and 12.9 about keyboard traps. RGAA has no general 'reachable by Tab' test for frame content."
    },
    'iframe-name-present': {
      tests: [],
      note: 'Flags iframe/frame elements with no name from aria-labelledby, aria-label or title (WCAG 4.1.2). Not linked to 2.1.1, which asks for the title attribute on every frame: this rule passes a frame named by aria-label alone and skips frames with tabindex="-1", both of which 2.1.1 fails. rgaa-frame-title-attribute-present reports 2.1.1.'
    },
    'iframe-title-unique': {
      tests: [],
      note: 'Deprecated in favour of identical-iframes-same-purpose and reports notApplicable on every page, so it is linked to no test. It used to ask, under 2.2.1, about frames sharing a title but loading different resources.'
    },
    'rgaa-image-alt-long': {
      tests: ['1.3.9'],
      note: 'Asks about an image (<img>, <area>, <input type="image">, <svg>, <canvas>, <object>, <embed> or role="img") whose text alternative (alt, aria-label, aria-labelledby, title, or an svg\'s <title>) is longer than 80 characters, for 1.3.9 (short and concise, particular cases aside). 80 characters is the maximum the RGAA glossary entry « Alternative courte et concise » strongly recommends; a longer one is asked about. A long description belongs in a detailed description (1.6, 1.7).'
    },
    'image-of-text': {
      tests: ['1.8.2'],
      reasonCodes: {
        SVG_IMAGE_TEXT_REVIEW: {
          tests: ['1.8.1']
        }
      },
      note: 'Asks whether an image button (<input type="image">) draws text that could be real text, the question of 1.8.2, and whether an <img> showing an SVG data URL whose markup holds <text> does, the question of 1.8.1 (an <img> image texte). A question, as in core: whether an image holds text, and whether it falls under the logo or essential-presentation particular cases, is for a person. An inline <svg> with <text> is real text, which the 1.8 technical note leaves out, and so does the rule.'
    },
    'image-redundant-alt': {
      tests: ['1.3.1', '1.2.1'],
      note: 'Asks about an <img> whose non-empty alt equals the visible text in its parent. RGAA does not fail an alternative for repeating text: the question is whether the image brings information of its own, and then whether its alternative is relevant (1.3.1 step 2), or whether it brings nothing beyond that text, which makes it an image de décoration (glossary: « ne véhiculant aucune information particulière par rapport au contenu auquel elle est associée ») that 1.2.1 asks to have alt="". Both tests cover the same <img> element, and the rule only asks.'
    },
    'img-alt-decorative': {
      tests: ['1.1.1', '1.1.5', '1.1.8'],
      note: "Asks whether an <img>, <svg> or <canvas> left out of the accessibility tree (alt=\"\", aria-hidden, role none/presentation, unlabeled svg/canvas) is really decorative. That is step 2 (does the image carry information?) of 1.1.1, 1.1.5 and 1.1.8, and a 'no' means an informative image with no alternative. It does not check the 1.2.x conditions for correctly ignoring decorative images. An image that is a link's or button's only content (IMAGE_ONLY_CONTROL_CONTENT) counts toward no test: the glossary « Image porteuse d'information », notes 1 and 2, judges its alternative as the control's label, which the link and button rules check under 6.1, 6.2, 11.9 and 7.1.",
      reasonCodes: {
        IMAGE_ONLY_CONTROL_CONTENT: {
          tests: []
        }
      }
    },
    'img-alt-present': {
      tests: [],
      note: 'Fails an exposed <img> (not hidden, not a non-focusable role none/presentation) that has no alt, no ARIA name and no title (WCAG 1.1.1). Not linked to RGAA: WCAG 1.1.1 covers decorative images too, so it fails a spacer, which RGAA files under 1.2.1 alone (rgaa-img-no-alt-decorative). rgaa-img-alt-present takes 1.1.1 with the spacers left out, so no image with no alt fails both 1.1 and 1.2.'
    },
    'rgaa-img-alt-present': {
      tests: ['1.1.1'],
      note: "Fails an exposed <img> with no alt, no ARIA name and no title, as img-alt-present does, except a spacer (2 px wide or high, or less, not captioned), which is decorative and fails 1.2.1 through rgaa-img-no-alt-decorative instead. An image that is not a spacer still fails 1.1.1 step 1 here: whether it is decorative, so that it fails 1.2.1 instead, is for a person, and rgaa-img-no-alt-decorative asks it under 1.2.1. Not linked to 1.2.1: a mapping applies to every finding, and such an image fails one of the two criteria, not both. An image that is the only content of a link or a button is left out: the glossary « Image porteuse d'information » (notes 1 and 2) judges its alternative as the control's label, under 6.1, 11.9 or 7.1."
    },
    'img-alt-quality': {
      tests: ['1.3.1'],
      note: "Asks a human to judge the relevance of a non-empty <img> alt, which is 1.3.1 step 2. An image that is a link's or button's only content (IMAGE_ONLY_CONTROL_CONTENT) counts toward no test: the glossary « Image porteuse d'information », notes 1 and 2, judges its alternative as the control's label, which the link and button rules check under 6.1, 6.2, 11.9 and 7.1.",
      reasonCodes: {
        IMAGE_ONLY_CONTROL_CONTENT: {
          tests: []
        }
      }
    },
    'rgaa-img-decorative-no-alternative': {
      tests: ['1.2.1'],
      reasonCodes: {
        decorativeImgHasAlternative: { tests: ['1.2.1', '1.1.1', '1.3.1'] }
      },
      note: 'Checks each <img> marked decorative (alt="", aria-hidden="true" or role none/presentation), without a caption, for aria-labelledby, aria-label or title, which 1.2.1 step 2 forbids. Fails when the image also has aria-hidden="true": it is decorative for assistive technologies, and if it carries information, hiding it fails 1.1.1 instead. Asks otherwise, since an image with alt="" and a title may be informative: then 1.2.1 does not apply, and the alternative assistive technologies read must be there (1.1.1) and relevant (1.3.1), so the question covers those tests too.'
    },
    'rgaa-img-describedby-target': {
      tests: ['1.6.9'],
      note: "Fails an exposed, non-decorative image (img, input image, area, object, embed, svg, canvas, role=img) whose aria-describedby lists only ids that do not exist in its tree: 1.6.9 asks whether « l'attribut WAI-ARIA aria-describedby associe-t-il la description détaillée », and it associates nothing. Asks when some ids are missing or the passages hold no text. Whether the passage is the detailed description is for a person."
    },
    'rgaa-img-no-alt-decorative': {
      tests: ['1.2.1'],
      note: 'Fails an <img> with no alt and no alternative that is 2 px wide or high, or less (a spacer, so decorative): 1.2.1 step 2 asks a decorative <img> for alt="". Asks about the other <img> with no alt and no alternative, which fail 1.2.1 if decorative and 1.1.1 (rgaa-img-alt-present) if not. rgaa-img-alt-present leaves spacers out, so a spacer fails 1.2 alone. An image that is the only content of a link or button is left out: it carries the control\'s information. An image with a caption is left out, as 1.2 does not apply to it.'
    },
    'input-image-alt-decorative': {
      tests: ['1.3.3'],
      note: 'Flags an <input type="image"> whose alt is empty but which is named by aria-label, aria-labelledby or title. RGAA has no decorative image button: 1.1.3 requires every one to have a text alternative, and here one exists, so the question left is whether that name is relevant, which is 1.3.3 ("S’il est présent, le contenu de l’attribut WAI-ARIA aria-label est pertinent", and the same for title and aria-labelledby).'
    },
    'input-image-alt-present': {
      tests: ['1.1.3'],
      note: 'Fails an image button with no ARIA name, no non-empty alt and no title, which is the presence check of 1.1.3 step 3. An author name equal to the browser\'s default ("Submit", "Submit Query") is a text alternative, so 1.1.3 is met; the rule only asks about it, since its relevance is 1.3.3\'s question.',
      reasonCodes: {
        default_name: {
          tests: ['1.3.3']
        }
      }
    },
    'input-image-alt-quality': {
      tests: ['1.3.3'],
      note: "Asks a human to judge the relevance of an image button's text alternative (a non-empty alt, aria-label, aria-labelledby or title, each source listed), which is 1.3.3 step 2. An empty alt with another name is input-image-alt-decorative's question."
    },
    'invalid-field-error-message': {
      tests: [],
      asks: ['11.10.4', '11.10.7'],
      note: 'Asks about a field marked aria-invalid whose error message is hidden, empty, out of reach of assistive technology, missing or not tied to it. 11.10.4 (a required field) and 11.10.7 (a field with a required format) ask that the field with aria-invalid="true" have its error visible in its label or in the text passage aria-labelledby or aria-describedby associates with it. The rule cannot tell which of the two applies, and passes a message tied by aria-errormessage, which is not one of those associations, so it is linked as a question to both.'
    },
    'rgaa-keyboard-only-event-handlers': {
      tests: ['7.3.1'],
      note: 'Asks about each element that is not interactive natively and has an inline key handler (onkeydown, onkeyup, onkeypress) but no inline click or pointer handler. 7.3.1 steps 4 and 5 require the action to work with any pointing device too, or an equivalent element that does, which WCAG 2.1.1 does not ask. It only sees inline attributes, so it never fails.'
    },
    'rgaa-label-for-target-valid': {
      tests: ['11.1.2'],
      note: "Fails a <label for> whose value is empty, matches no id in the label's tree, or matches an element that cannot be labelled and has no form-field role: then the field it names has no id equal to the for value, the condition 11.1.2 step 2 checks. A for matching an ARIA field (role=textbox and the other roles the glossary counts) meets 11.1.2; its missing name is 11.1.1."
    },
    'label-for-valid': {
      tests: [],
      note: 'Asks about a <label for> that names no element, or an element that cannot be labelled. rgaa-label-for-target-valid fails the same labels under 11.1.2, whose condition (the for value equals the field’s id) they do not meet, so this rule is left off to count each label once.'
    },
    'label-in-name': {
      tests: [],
      note: 'Checks WCAG 2.5.3: for controls with aria-label or aria-labelledby and a visible label, the accessible name contains the visible text. Not mapped to RGAA: 6.1.5 and 11.2.5 check every name source present, the title included, not only the accessible name, and each finding belongs to one test by element type, while this rule would put all four tests on every finding. rgaa-link-label-in-name-sources (6.1.5), rgaa-field-label-in-name-sources (11.2.5), rgaa-form-button-label-in-name-sources (11.9.2, buttons inside a form only) and rgaa-widget-label-in-name (7.1.3) report them instead.'
    },
    'rgaa-label-placement-review': {
      tests: ['11.4.1', '11.4.2', '11.4.3'],
      note: 'Needs a layout, so it only asks in a browser. RGAA 11.4.1 asks whether « chaque étiquette de champ et son champ associé sont-ils accolés », accolés meaning « visuellement proches de manière à ce que la relation entre les deux ne puisse pas prêter à confusion »: a visible label (a <label> or an aria-labelledby passage, not aria-label, title or placeholder) more than 100 px, or 3 lines, from its field is asked about (reason code labelFarFromField). 11.4.2 wants the label « immédiatement au-dessus ou à gauche du champ » (à droite in a right-to-left language) and 11.4.3, for a check box, radio button or role checkbox, radio or switch, « immédiatement au-dessous ou à droite » (à gauche in a right-to-left language): a label on another side is asked about (labelNotAboveOrLeft under 11.4.2, labelNotBelowOrRight under 11.4.3). Following the particular cases, labels mixing both directions, and forms with labels in both directions, are left out of 11.4.2 and 11.4.3. Whether a different placement is « légitime, du point de vue de l’expérience utilisateur » is for a person, so the rule never fails.',
      reasonCodes: {
        labelFarFromField: {
          tests: ['11.4.1'],
          outcome: 'cantTell'
        },
        labelNotAboveOrLeft: {
          tests: ['11.4.2'],
          outcome: 'cantTell'
        },
        labelNotBelowOrRight: {
          tests: ['11.4.3'],
          outcome: 'cantTell'
        }
      }
    },
    'label-title-only': {
      tests: [],
      note: 'Deprecated in 1.10.0 and reports notApplicable on every page: every field it flagged, a control labelled only by its title, form-control-programmatic-label-quality also reports, and that rule carries the tests this one was linked to (11.1.3, 11.2.2).'
    },
    'landmark-banner-is-top-level': {
      tests: [],
      note: 'Checks that the banner landmark is not nested inside another landmark. Neither 9.2.1 (header structured with <header>) nor 12.6.1 (the zone has a matching landmark or another way to reach or skip it) checks landmark nesting.'
    },
    'landmark-complementary-is-top-level': {
      tests: [],
      note: 'Checks that complementary/<aside> is not nested inside another landmark. RGAA has no requirement about complementary landmarks or their nesting (9.2.1 and 12.6.1 do not cover aside).'
    },
    'landmark-contentinfo-is-top-level': {
      tests: [],
      note: 'Checks that contentinfo is not nested inside another landmark. 9.2.1 only requires the footer zone to use <footer>, and 12.6.1 only requires a matching landmark or an alternative. Neither checks nesting.'
    },
    'landmark-main-is-top-level': {
      tests: [],
      note: 'Checks that main is not nested inside another landmark. 9.2.1 requires the main zone to use a single visible <main> but says nothing about where it sits; no RGAA test checks nesting.'
    },
    'landmark-no-duplicate-banner': {
      tests: [],
      note: 'Checks for more than one banner landmark. 9.2.1 requires the header zone to use <header> but does not require it to be unique (uniqueness is only required for <main>).'
    },
    'landmark-no-duplicate-contentinfo': {
      tests: [],
      note: 'Checks for more than one contentinfo landmark. 9.2.1 requires the footer zone to use <footer> but does not require it to be unique (uniqueness is only required for <main>).'
    },
    'landmark-no-duplicate-main': {
      tests: [],
      note: 'Flags more than one main landmark exposed to assistive technology (hidden ones are filtered out). Not linked to 9.2.1: step 5 requires every other <main> to carry the hidden attribute, so a second <main> hidden by CSS or aria-hidden alone fails it but not this rule; the rule also counts role="main", and it applies whatever the doctype, while 9.2 does not apply outside HTML5. rgaa-main-element-structure reports 9.2.1.'
    },
    'landmark-one-main': {
      tests: [],
      note: 'Flags pages with no main landmark. Not linked to 9.2.1: step 4 requires a <main> element, and this rule accepts role="main" without one; it also applies whatever the doctype, while 9.2 does not apply outside HTML5. rgaa-main-element-structure reports 9.2.1.'
    },
    'landmark-role-name-present': {
      tests: [],
      note: 'Asks about an element given role="region" or role="form" with no accessible name, which WAI-ARIA requires and without which it is not exposed as a landmark. No RGAA test covers it: 12.6.1 asks for a landmark on the header, main navigation, main content, footer and search zones only, and 9.2.1 for their HTML elements, neither for region or form.'
    },
    'landmark-unique': {
      tests: [],
      note: "Checks that landmarks sharing a role have distinct accessible names. No RGAA test requires landmarks to have names or unique names; 12.6.1 only requires a landmark role matching the zone's nature."
    },
    'rgaa-language-change-review': {
      tests: ['8.7.1'],
      note: 'Asks about each visible block of text (paragraph, list item, cell, heading, quotation, label, div…) whose own text, without inner blocks and elements with their own lang, holds 8 words or more and is, by the share of frequent function words of French, English, Spanish, Portuguese, Italian, German and Dutch, clearly in another language than the nearest lang or xml:lang on it or a parent. 8.7.1 asks that « chaque texte écrit dans une langue différente de la langue par défaut » carry lang on it or a parent, « hors cas particuliers »: proper nouns and foreign words in the dictionary are not applicable, so names and nouns do not count in the guess, passages under 8 words are not looked at, and a passage whose other words all start with a capital (a name, a title) is skipped. Code, preformatted text and form controls are left out. A page whose whole text is in another language than <html lang> is left to rgaa-default-language-review (8.4.1).'
    },
    'rgaa-layout-table-no-data-markup': {
      tests: ['5.8.1'],
      reasonCodes: {
        dataLikeTableMarkedLayout: { tests: ['5.8.1', '5.6.1', '5.6.2'] }
      },
      note: 'Fails a table with role="presentation" or role="none" that has a non-empty summary, a <caption>, <th>, <thead>, <tfoot>, a rowheader or columnheader role, or cells with scope, headers or axis. Those are the two conditions of 5.8.1, applied to tables marked as layout. A <colgroup> passes: the RGAA 4.1.2 revision notes took it out of the list of 5.8.1. Such a table that looks like a data table (a full header row or column over data) is asked about instead, since role="presentation" on a data table is not a 5.8.1 matter: it takes its headers away from assistive technologies, which the pack reads as headers not declared as such, under 5.6.1 or 5.6.2, so the question covers those tests too. A layout table with no role is not found; deciding which tables are layout tables is 5.3.'
    },
    'rgaa-legend-relevance-review': {
      tests: ['11.7.1'],
      note: 'Asks about each visible <fieldset> with a <legend> holding text, and each visible role="group" or role="radiogroup" named by aria-labelledby or aria-label, that holds a form field: the legends the glossary « Légende » names. 11.7.1 asks « Chaque légende associée à un regroupement de champs de même nature est-elle pertinente ? », which only a person can judge, so each legend is quoted. Groups with no legend are rgaa-field-group-legend’s (11.6.1).'
    },
    'rgaa-letters-spaced-with-spaces': {
      tests: ['10.1.3'],
      note: 'Asks about four or more single letters in a row separated by spaces (three capitals when they are the whole text), read across inline elements, the first condition of 10.1.3 ("Les espaces ne sont pas utilisées pour séparer les lettres d’un mot"). Also asks about words lined up with runs of spaces, the other two conditions (« pour simuler des tableaux », « des colonnes de texte »): a <pre> (not of code) with two lines or more holding runs of three spaces between words, or a text with two runs or more of three non-breaking spaces.'
    },
    'rgaa-link-content-label-present': {
      tests: ['6.2.1'],
      note: 'Fails a[href] and role=link elements whose content has no text and no image with a text alternative, even when aria-label, aria-labelledby or title names them: 6.2.1 step 2 checks that the content of the link contains a label (text or alternative), and the glossary "Intitulé de lien", Note 4, fails a link with no content under 6.2. A <canvas>, or an <object> or <embed> of an image type, with no aria-label, aria-labelledby, title or fallback text counts as an image with no alternative. A link whose only content is text generated by CSS (::before, ::after) fails too (generatedTextOnly, in a browser): the glossary "Intitulé de lien", note 5, does not count such text as content between <a> and </a>. Asks when the content is another embedded element, an element named by its own aria-label, or hidden text beside a name from an attribute. <area> is left to 1.1.2.'
    },
    'rgaa-link-context-review': {
      tests: ['6.1.1', '6.1.2', '6.1.3', '6.1.4'],
      note: "Asks about a link named by a generic phrase or a bare file format whose only context is an aria-describedby text or the text of an enclosing <dd>, <dt>, <blockquote> or <figcaption>. The glossary \"Contexte du lien\" lists only the sentence, the <p>, the <li>, the preceding heading, the associated <th> and the <td>, so the context link-name-quality accepts for WCAG 2.4.4 may not count for 6.1.1 to 6.1.4 step 2. A question, since the link's sentence or a preceding heading may still make it explicit. Its phrase lists add French phrases to link-name-quality's (« Découvrir », « Plus d'info », « Voir tout »…), and all lists apply on a page with no language."
    },
    'link-in-text-block': {
      tests: ['10.6.1'],
      note: 'Fails inline links in running text (a[href] and role=link) that have no underline, no weight or style difference and no other mark (border, shadow, background, icon, generated content), and whose color contrast with the surrounding text is below 3:1. That is 10.6.1 step 2 (3:1 between link and surrounding text for links shown only by color). A link shown only by a color at 3:1 or more is asked about, since step 2 also needs a non-color cue on hover and focus. It checks only the default state; rgaa-link-state-colors-review asks about the visited, active, hover and focus colors of step 3.',
      reasonCodes: {
        SELECT_OPTION_COLOR: {
          tests: []
        }
      }
    },
    'rgaa-link-label-in-name-sources': {
      tests: ['6.1.5'],
      note: 'Fails a link (a[href] or role="link", not an SVG link) with visible text when its title, its aria-label or the text its aria-labelledby points to does not contain that text. That is 6.1.5 steps 1 and 2, which check the content of each of these sources; the glossary "Intitulé (ou nom accessible) de lien", note 2, says the same of the title. Punctuation and capital letters are ignored (particular cases of 6.1.5), and nothing else: a source that writes out an abbreviation, gives a word another ending or leaves out text in parentheses fails. Asks only when the visible label may be a symbol.'
    },
    'link-name-present': {
      tests: [],
      note: 'Fails a[href], area[href] and role=link elements with no accessible name at all. Not mapped to 6.2.1: that test asks for a label in the link content, so a link named only by aria-label, aria-labelledby or title passes here but fails 6.2.1, and an <area> belongs to 1.1.2 (area-alt-present). rgaa-link-content-label-present checks 6.2.1.'
    },
    'link-name-quality': {
      tests: ['6.1.1', '6.1.2', '6.1.3', '6.1.4'],
      note: 'Flags a[href], area[href] and role=link elements whose full accessible name, whatever its source (text, img alt, SVG), is a generic phrase or a bare file format with no adjacent context. That is the question 6.1.1 to 6.1.4 step 2 asks per link type: does the name alone or with its context give the link\'s purpose and destination. Unnamed links are explicitly left out, so 6.2.1 is not covered. It accepts an aria-describedby text or a <dd>, <dt>, <blockquote> or <figcaption> as context, which the glossary "Contexte du lien" does not list; rgaa-link-context-review asks about those links. It also accepts the text of a <th> that contains the link, where the glossary names only the <th> associated with the link\'s <td>, and counts it: a header cell is context for what it contains as much as for its column.'
    },
    'rgaa-link-state-colors-review': {
      tests: ['10.6.1'],
      note: "In a browser, puts a link in a run of text, shown only by color at rest, in its visited, hover, active and focus states and fails a state shown by another color, with no other mark, whose contrast with the surrounding text is below 3:1. That is 10.6.1 step 3, the 3:1 check « pour les différents états du lien s'ils sont présentés au moyen d'une couleur différente ». It asks when the browser's own visited color applies or a style sheet cannot be read (with a sheet from another origin, a computed color other than the browser's own link color shows the author set it), and in jsdom, where the states cannot be put on the link, it asks whenever a state rule changes only the color. link-in-text-block judges the resting state."
    },
    'rgaa-link-title-content-name': {
      tests: ['6.1.2', '6.1.3'],
      note: 'Fails an image link (6.1.2) whose title does not contain the text alternative of its images, and a composite link (6.1.3) whose title contains its text but not the alternative of each of its images, as whole words in any order. Asks when every alternative the title leaves out is one character, which may be a symbol (symbolAlternative for an image link, compositeSymbolAlternative for a composite link). Glossary « Intitulé (ou nom accessible) de lien », note 2: a link is « non-explicite » when it « possède un attribut title dont la valeur ne reprendrait pas au moins le "nom accessible" issu du contenu du lien », since assistive technologies can be set to read the title. Punctuation and capital letters are ignored, as 6.1.5\'s particular cases allow. Text links are left to rgaa-link-label-in-name-sources (6.1.5), and links whose content holds hidden, generated or embedded content are left out.',
      reasonCodes: {
        compositeLinkTitle: {
          tests: ['6.1.3']
        },
        compositeSymbolAlternative: {
          tests: ['6.1.3']
        },
        symbolAlternative: {
          tests: ['6.1.2']
        }
      }
    },
    'list-children-valid': {
      tests: ['9.3.1', '9.3.2'],
      findings: [
        {
          when: {
            reasonCode: 'LIST_ITEM_ROLE_OVERRIDDEN',
            element: 'ol'
          },
          tests: ['9.3.2'],
          outcome: 'cantTell'
        },
        {
          when: {
            reasonCode: 'LIST_ITEM_ROLE_OVERRIDDEN'
          },
          tests: ['9.3.1'],
          outcome: 'cantTell'
        },
        {
          when: {
            element: 'ul'
          },
          tests: ['9.3.1'],
          outcome: 'cantTell'
        },
        {
          when: {
            element: 'menu'
          },
          tests: ['9.3.1'],
          outcome: 'cantTell'
        },
        {
          when: {
            element: 'ol'
          },
          tests: ['9.3.2'],
          outcome: 'cantTell'
        }
      ],
      note: 'Fails a <ul>/<ol> (with no role other than list) with a direct child that is not an <li>/role=listitem (or script/template), so the list is not structured with ul/li (9.3.1) or ol/li (9.3.2), step 2. A finding counts toward the test of its list, by the element it names: <ul> and <menu> 9.3.1, <ol> 9.3.2. Not linked to 8.2.1: the rule accepts a child with role=listitem and skips hidden lists, while HTML accepts only li; rgaa-html-nesting-valid reports list nesting under 8.2.1. A list whose only stray children are <li> elements given another role (LIST_ITEM_ROLE_OVERRIDDEN: role="presentation" in pagers, role="group" in carousels) is asked about instead, under the test of its list: the items are written as a list, and whether the role makes them something else is for a person. Core asks about the rest, as only HTML breaks and WCAG may hold; RGAA 9.3.1 and 9.3.2 name the elements a list is structured with, so they fail here.'
    },
    'listbox-name-present': {
      tests: [],
      note: 'Checks that role=listbox has a name from aria-label, aria-labelledby, title or an associated label. It accepts a wrapping <label>, which 11.1.1 does not list. It also fails a <label for> pointing at a role=listbox element that a label cannot name, which meets 11.1.1 condition 3 to the letter. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only. Not mapped to 7.1.1: it passes when an accessible alternative exists.'
    },
    'rgaa-listbox-option-groups-absent': {
      tests: ['11.8.1'],
      note: 'Fails an element with role="listbox" (not <select>) that contains role="group". The 11.8 technical note says options cannot be grouped with ARIA, and a list that needs grouping built with role="listbox" does not conform to 11.8; a role="group" shows the options were grouped. The note names the criterion, not a test: 11.8.1 is the test on grouping options.'
    },
    'listitem-parent-valid': {
      tests: ['9.3.1'],
      findings: [
        {
          when: {
            reasonCode: 'LIST_ROLE_OVERRIDDEN',
            parentElement: 'ol'
          },
          tests: ['9.3.2'],
          outcome: 'cantTell'
        },
        {
          when: {
            reasonCode: 'LIST_ROLE_OVERRIDDEN'
          },
          tests: ['9.3.1'],
          outcome: 'cantTell'
        },
        {
          when: {
            parentElement: 'ol'
          },
          tests: ['9.3.2'],
          outcome: 'fail'
        }
      ],
      note: 'Fails an <li> whose parent is not <ul>/<ol>/<menu> or role=list/none/presentation, so items grouped as a list are not structured with a ul/ol container. That is step 2 of 9.3.1 or 9.3.2. An <li> under an <ol> whose role replaces list counts toward 9.3.2; any other, toward 9.3.1: an <li> outside any list says nothing of an order, and unordered lists are far the more common. Not linked to 8.2.1: HTML does not accept an li in a role=list container, which this rule passes; rgaa-html-nesting-valid reports it under 8.2.1. An <li> whose <ul> or <ol> has a widget role (LIST_ROLE_OVERRIDDEN: role="tablist", "menu"…) is asked about instead, under the test of its list: 9.3\'s technical note says such roles are not lists, so whether the content is a list is for a person. Core asks about a loose <li>, as only HTML breaks; RGAA 9.3 names the elements a list is structured with, so it fails here.',
      reasonCodes: {
        LISTITEM_INVALID_PARENT: {
          outcome: 'fail'
        }
      }
    },
    'live-region-announcements': {
      tests: ['7.5.1', '7.5.2', '7.5.3'],
      note: 'Asks about a live region assistive technologies cannot reach (aria-hidden, inert, behind an open modal dialog) or that is aria-busy, and, with the live-region hook, about one inserted with its text or shown and filled at once. 7.5 asks that status messages be rendered by assistive technologies, through role status (7.5.1), alert (7.5.2), or log, progressbar or status (7.5.3): a status message in such a region is not rendered, whatever its role. The rule cannot tell which kind of message the region holds, so a finding is a question about each of the three tests.'
    },
    'rgaa-main-element-structure': {
      tests: ['9.2.1'],
      note: 'Steps 4 and 5 of 9.2.1 on HTML5 pages: fails role="main" with no <main> element (step 4), and a second <main> that has no hidden attribute, even if CSS or aria-hidden hides it (step 5 and the 9.2 technical note). Fails a page with text and neither <main> nor role="main": every page has a main content zone (glossary « Zone de contenu principal »), so step 4 is not met. Fails a second <main> without its own hidden attribute that is hidden only inside a closed <details> or under an ancestor\'s hidden="until-found" (revealableMain): the user opens the details, or find-in-page reveals it, with no script, and two <main> are then visible at once, which « une balise <main> visible unique » and the technical note\'s « en permanence » rule out; one in the same exclusive <details> group as the shown <main> is asked about instead, as opening it closes the other. Asks when such a page has no text of its own (only frames, a canvas or shadow DOM content), or has text but shows a visible <iframe> of 100 by 100 pixels or more, which may hold the main content while the page holds the header, navigation and footer (mainMayBeInFrame: a person checks whether the frame is the main content zone and whether the document it shows uses <main>; a hidden or tiny frame does not count), or when a <main> is hidden by an ancestor\'s plain hidden attribute or a closed <dialog> (hiddenByAncestor): only a script shows it. It passes 9.2.1 when, in normal use, it is never displayed with the shown <main> (the script that reveals it hides the other), and fails when both can be visible together; the missing hidden attribute still fails 8.2.1 through rgaa-html-nesting-valid (extraMain). Not applicable when the doctype is not HTML5 (9.2 particular case). Steps 1, 2 and 6 name the element as step 4 does: a zone marked with role="banner", "navigation" or "contentinfo" on another element than <header>, <nav> or <footer> fails, unless such an element wraps it or sits inside it. Whether the page marks its header, navigation and footer zones at all, and step 3, are not checked.'
    },
    'manual-review': {
      tests: ['12.8.1', '12.9.1', '10.7.1'],
      note: 'Always-on page-level prompt to review by keyboard whether focus can leave every component (12.9.1 step 2), whether tab order is coherent (12.8.1 step 2) and whether the focus indicator is visible (10.7.1). It is a reminder only and gives no finding on any element.'
    },
    'rgaa-markup-for-presentation': {
      tests: ['8.9.1'],
      note: 'Fails a heading with role="presentation" or "none", which the 8.9.1 methodology calls « non-conforme sur un titre », and a paragraph of only non-breaking spaces or <br>, an empty paragraph the methodology names among « des paragraphes vides ou encore des espaces utilisés pour créer des effets de marges ». Asks about a paragraph with no content at all, an empty <blockquote>, an empty element a script may fill (role, aria-live), two or more <br> in a row, and text indented with non-breaking spaces. A paragraph or <blockquote> with role="presentation" is accepted, as the methodology allows.'
    },
    'rgaa-markup-validation-review': {
      tests: ['8.2.1'],
      note: "Reads the W3C validator report on the generated source, given as the validator.report probe, which is 8.2.1 step 1 (« activer l'option W3C Nu markup checker » on « le code source généré »), and fails each error it lists, CSS messages and warnings aside; a clean report passes. Without a report, with one on the original source (whose errors the parser may repair, and which scripts may change), or with one cut at the engine's 200-item limit, it asks, since the DOM does not show what the parser repaired and the other 8.2.1 rules cover only part of the test. With a report, the defects the DOM rules also fail under 8.2.1 (duplicate ids, obsolete elements, ARIA and nesting errors) are counted by both: the criterion fails either way."
    },
    'media-alternative-transcript-evidence': {
      tests: [],
      note: 'Flags <audio>/<video> with no transcript found nearby or through aria-describedby (WCAG 1.2.1). Not linked to 4.1.1 to 4.1.3: those tests accept only a transcript, or a link or button to one, right before or after the media (glossary "Lien ou bouton adjacent"), and this rule stays silent on a transcript referenced by aria-describedby elsewhere in the page. rgaa-media-transcript-adjacent reports 4.1.1 to 4.1.3.'
    },
    'rgaa-media-transcript-adjacent': {
      tests: ['4.1.1', '4.1.2', '4.1.3'],
      note: 'Passes an <audio>/<video> whose neighbour just before or after it in the code is a link or button naming a transcript, or a block that holds such a link or the transcript itself (30 words or more), which is the presence step (step 2) of 4.1.1 to 4.1.3 as the glossary "Lien ou bouton adjacent" defines adjacency. A short text that only mentions a transcript (« Transcription à venir ») is asked about. Otherwise it asks: the media may not need a transcript, or a video may meet 4.1.2/4.1.3 through audio description. It cannot tell audio-only, video-only and synchronised media apart, so each finding carries the three tests.'
    },
    'menuitem-name-present': {
      tests: ['7.1.1'],
      note: 'Checks that menuitem, menuitemcheckbox and menuitemradio elements have a non-empty name. These are parts of a script-driven menu component, and 7.1.1 step 2 requires an explicit name. Not a form field, so 11.1 does not apply. Not mapped to 11.9.1: 11.9.1 covers buttons in a form, not menu items.'
    },
    'rgaa-meta-redirect-immediate': {
      tests: ['13.1.2'],
      note: 'Asks about the first meta refresh when it sends the visitor to another address after a delay: 13.1.2 requires the redirect to be immediate, with no 20-hour exception, but a redirect from an obsolete address to the new page is essential and makes 13.1 not applicable, which only a person can tell. A delay of 0 passes.'
    },
    'meta-refresh-no-exceptions': {
      tests: [],
      note: 'AAA rule that fails any meta refresh with a positive delay. Not linked to 13.1: a refresh of 20 hours or more without a URL passes 13.1.1 and is no redirect for 13.1.2, yet this rule fails it, and a delayed redirect from an obsolete address is essential, so 13.1 does not apply to it. rgaa-meta-refresh-no-url-timing reports 13.1.1 and rgaa-meta-redirect-immediate 13.1.2.'
    },
    'rgaa-meta-refresh-no-url-timing': {
      tests: ['13.1.1'],
      note: "Fails the first meta refresh when it reloads the page itself (no URL, or the page's own address) with a delay under 20 hours, 0 included: a meta refresh cannot be stopped, relaunched or lengthened, so only the last condition of 13.1.1 step 2, a limit of twenty hours at least, can hold. A delay of 72000 seconds or more passes. rgaa-embedded-refresh-review asks about refreshes from object, embed, svg and canvas."
    },
    'meta-refresh-timing-absent': {
      tests: [],
      note: 'Fails the first meta http-equiv=refresh with a delay between 1 second and 20 hours (WCAG 2.2.1). Not linked to 13.1: RGAA splits refreshes (13.1.1, where a limit of exactly 20 hours passes) from redirects (13.1.2, which must be immediate, with no 20-hour exception, unless they leave an obsolete address), and this rule treats both alike. rgaa-meta-refresh-no-url-timing reports 13.1.1 and rgaa-meta-redirect-immediate 13.1.2.'
    },
    'meta-viewport-large': {
      tests: [],
      note: 'Flags viewport meta tags with user-scalable=no or maximum-scale<5. user-scalable=no, or maximum-scale below 2, blocks graphic zoom to 200%, which 10.4.2 step 1 checks. Values from 2 up to 5 are only a best practice and do not fail RGAA, so the auditor must check the actual value. Not mapped to 10.4.2: the rule flags anything below 500% zoom; RGAA requires 200%, which meta-viewport-zoom-enabled checks.'
    },
    'meta-viewport-zoom-enabled': {
      tests: [],
      note: 'Fails a viewport meta that sets user-scalable=no or maximum-scale below 2, which blocks pinch zoom to 200% (WCAG 1.4.4). Not linked to 10.4.2: that test passes when any one of the browser text zoom, the browser graphic zoom or a zoom control of the site reaches 200%, and a viewport meta tag does not stop all of them in every audit environment. rgaa-viewport-zoom-review asks the 10.4.2 question on the same tags.'
    },
    'meter-name-present': {
      tests: [],
      note: 'Fails an element with explicit role="meter" that has no name from aria-label, aria-labelledby or title. It also fails a <label for> pointing at it, which meets 11.1.1 condition 3. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only. Not mapped to 7.1.1: it passes when an accessible alternative exists, and a meter is not necessarily script-driven.'
    },
    'rgaa-modal-tab-order': {
      tests: ['12.8.1'],
      note: 'Asks about each open dialog marked aria-modal="true", not opened with showModal(), while elements outside it can still take focus: the 12.8.1 methodology says « l\'ordre de tabulation dans une fenêtre modale ne doit considérer que les éléments … au sein de cette fenêtre », and aria-modal does not stop the Tab key. Whether a script keeps focus inside is for a person.'
    },
    'mouse-only-event-handlers': {
      tests: ['7.3.1'],
      note: 'Flags elements with inline pointer-only handlers (onmouseover, onmousedown, ondblclick, and so on) and no keyboard or focus handler that can run, and asks whether they work by keyboard. A focus handler counts only on an element that can take focus, and a key handler only when the element or a descendant can. That is 7.3.1 steps 2-3 (an element with a JS event handler must be keyboard-accessible, or have an equivalent). It only sees inline attributes.'
    },
    'moving-content-pausable': {
      tests: [],
      note: 'Asks about content an animation moves by itself for more than five seconds or without end (WCAG 2.2.2). Not mapped to 13.8.1 and 13.8.2: rgaa-moving-content-review asks about the same animations, read the same way (helpers.animationsAtScanStart), and tells moving content (13.8.1) from blinking content (13.8.2) by the properties it animates, which this rule does not; mapping both would ask twice about each element.'
    },
    'rgaa-moving-content-review': {
      tests: ['13.8.1', '13.8.2'],
      note: 'Asks about content that moves or blinks by itself for more than 5 seconds: a <marquee>, a <video> with autoplay and no controls, an SVG animation repeated indefinitely, and, where the page has a layout, an animation running when the scan starts (CSS animation, CSS transition or one a script started) that never ends or lasts more than 5 seconds, read from helpers.animationsAtScanStart since the engine settles finite animations while rules run (blinking when it animates only opacity, visibility or colours). 13.8.1 and 13.8.2 accept it when the user can stop and restart it, hide it, or see all its information without the movement, which a script may give and only a person can try. Animated images are not found. A video with information is a temporal medium, which the glossary « Contrôle (contenu en mouvement ou clignotant) » leaves to the multimedia theme, so autoplayVideo is asked about under 4.11.1, and under 13.8.1 only for a video with no information of its own.',
      reasonCodes: {
        marquee: {
          tests: ['13.8.1']
        },
        autoplayVideo: {
          tests: ['4.11.1', '13.8.1']
        },
        svgAnimation: {
          tests: ['13.8.1']
        },
        movingAnimation: {
          tests: ['13.8.1']
        },
        blinkingAnimation: {
          tests: ['13.8.2']
        }
      }
    },
    'rgaa-navigation-systems-review': {
      tests: ['12.1.1'],
      note: 'Asks about a page that shows fewer than two of the « systèmes de navigation » of 12.1.1 (« un menu de navigation et un plan du site », « un menu de navigation et un moteur de recherche » or « un moteur de recherche et un plan du site »): a navigation menu (a <nav> or role navigation with 3 links or more, or a list of 3 links or more in the page header, not a breadcrumb, a pagination, skip links or footer links, which « ne sont pas considérés comme un menu de navigation principal »), a site map link (« plan du site », « sitemap ») and a search engine (a search form, role search, or a link or button « Rechercher »). The criterion is about each « ensemble de pages », so one page can neither pass nor fail it: a page with two or more is not applicable, and one with fewer is asked about once (reason code fewerThanTwoSystems, with what was found). A step of a process (a form with payment card fields, or a title that says « étape ») is not applicable, as the particular case says; a site of « un nombre très limité de pages » is exempt too, which only a person can tell. A table of contents for a set of pages is not found.'
    },
    'nested-interactive-controls-absent': {
      tests: [],
      note: 'Flags interactive controls that contain another operable control (for example a button inside a[href]). Not linked to 8.2.1: the rule fails nesting that uses only ARIA roles, which the W3C validator only warns about (since Nu 26.8.6), and it misses disabled or tabindex descendants the validator rejects; rgaa-html-nesting-valid reports the HTML nesting errors under 8.2.1. Not mapped to 7.1.1: native nested controls are not scripted components.'
    },
    'no-autoplay-audio': {
      tests: ['4.10.1'],
      note: 'Flags unmuted autoplaying <audio>/<video> with no native controls, and every <bgsound> and every <embed> or <object> that loads sound, video or a plugin, and asks about the 3-second rule and a stop or volume mechanism. Those are the elements the wording of 4.10.1 and the note of its methodology list. Sound started by a script is not detected.'
    },
    'rgaa-noscript-alternative-review': {
      tests: ['7.2.1'],
      note: "Asks about each <noscript> in the body whose content holds text (tags stripped, since browsers with scripting on keep it as raw text): 7.2.1 passes a script whose « alternative entre <noscript> et </noscript> permet d'accéder à des contenus et des fonctionnalités similaires », which only a person can compare. A <noscript> holding only a tracking image or frame is left out."
    },
    'rgaa-object-embed-decorative-aria-hidden': {
      tests: ['1.2.3', '1.2.6'],
      reasonCodes: {
        presentationWithContent: { tests: ['1.2.3', '1.1.6'] }
      },
      note: 'Checks each <object> or <embed> of an image type marked decorative, without a caption. Fails aria-hidden="true" with aria-labelledby, aria-label, title, a child alternative or text inside an <object> (1.2.3 and 1.2.6 condition 2 and, for <object>, 3; if the image carries information, hiding it fails 1.1.6 or 1.1.7 instead), and role="none"/"presentation" without aria-hidden="true" and with no content (condition 1). Asks when such an <object> has content: if it is decorative it fails 1.2.3, and if it carries information that content is no alternative 1.1.6 accepts, so the question also covers 1.1.6. The same checks as rgaa-canvas-decorative-aria-hidden for <canvas> (1.2.5).'
    },
    'rgaa-object-image-role-img': {
      tests: ['1.1.6'],
      reasonCodes: {
        alternativeWithoutRoleImg: { tests: ['1.1.6', '1.2.3'] },
        adjacentLinkOrButton: { tests: ['1.1.6', '1.2.3'] },
        fallbackOnly: { tests: ['1.1.6', '1.2.3'] },
        noAlternativeMayBeDecorative: { tests: ['1.1.6', '1.2.3'], outcome: 'cantTell' }
      },
      note: 'Checks each <object type="image/..."> not marked decorative. Passes role="img" with aria-labelledby, aria-label or title. Fails an object with no text alternative, no fallback content and no link or button right after it, which meets none of the conditions of 1.1.6 short of a replacement mechanism the page would have to offer, when it has role="img" or certainly carries information (captioned, or focusable); asks about any other, which may be decorative and then fails 1.2.3 instead. Asks when there is a text alternative without role="img" (the first condition and step 3 of the methodology ask for both, so only a link or button after it or a replacement mechanism lets an informative one pass), when a link or button follows (does it lead to an alternative content?), and when there is only content between <object> and </object>, which 1.1.6 does not list among its conditions. One that is the only content of a link or a button is left out: the glossary « Image porteuse d\'information » (notes 1 and 2) judges its alternative as the control\'s label, under 6.1, 11.9 or 7.1. Each question also covers 1.2.3, which a decorative object without aria-hidden="true" fails.'
    },
    'object-text-alternative-present': {
      tests: [],
      note: 'Fails an <object> with no fallback text, no ARIA name and no title. Not mapped to 1.1.6: that test covers only type="image/...", while the rule fails every <object>, and RGAA passes an object followed by a link or button to an alternative content, which this rule fails. rgaa-object-image-role-img checks 1.1.6 as RGAA words it.'
    },
    'object-text-alternative-quality': {
      tests: ['1.3.4'],
      note: "Asks a human to judge the relevance of an <object>'s title, ARIA name or fallback content, which is 1.3.4 step 2; fallback content is one of the conditions of the test (« S’il est présent le contenu alternatif est pertinent »). Scope mismatch: 1.3.4 only covers image objects, so the steps first ask whether the object shows an image."
    },
    'rgaa-office-document-link': {
      tests: ['13.3.1'],
      note: 'Lists each link, form or submit button that downloads an office document for a person to check one of the conditions of 13.3.1: the document is accessible, or an accessible version is offered. The document is found by the download filename, the address path, a query-string value or the form action, with the Office, OpenDocument, PDF, EPUB and RTF extensions. Downloads started by script or without such an extension are not found.'
    },
    'rgaa-optgroup-label-not-empty': {
      tests: ['11.8.3'],
      note: "Fails an <optgroup> inside a <select> whose label attribute is empty or only spaces: 11.8.3 step 2 asks whether the label's content is relevant, and an empty one cannot be. Whether a non-empty label is relevant is not judged, so a pass covers only that case."
    },
    'rgaa-optgroup-label-present': {
      tests: ['11.8.2'],
      note: 'Fails an <optgroup> inside a <select> with no label attribute, which is 11.8.2 step 2. An empty label passes, since RGAA only asks for the attribute; rgaa-optgroup-label-not-empty reports it under 11.8.3.'
    },
    'option-name-present': {
      tests: ['11.1.1'],
      note: 'Checks that role=option has a non-empty name. The RGAA glossary lists option as a form-field role, so an unnamed option fails 11.1.1. Not mapped to 7.1.1: it passes when an accessible alternative exists, and the problem is already reported under 11.1.1.'
    },
    'rgaa-orientation-content-parity': {
      tests: ['13.9.1'],
      note: "In a browser, lays the page out as portrait and as landscape by rewriting its orientation media conditions, and fails content shown in one orientation that the other hides with its text shown nowhere else, when it is content in its own right (2 words of 4 characters or more), no menu button or disclosure is shown in that orientation, and no more than a fifth of its words are shown there. That is 13.9.1's second condition, « le contenu proposé reste le même quel que soit le mode d’orientation ». The text of buttons and disclosure triggers is left out, and any other difference is asked about, since the test lets « sa présentation et le moyen d’y accéder » differ: a menu behind a button, a table shown as cards, another image alternative. It also asks when what is hidden holds the main content (a lock, where the essential-orientation exception needs a person; css-orientation-lock asks too), when a hidden element has no text to compare, and in jsdom about each element an orientation rule hides. Width breakpoints are not flipped. It asks when what is hidden holds the main content (a lock, where the essential-orientation exception needs a person; css-orientation-lock asks too), and when a control shown in that orientation opens what is hidden (CONTENT_BEHIND_CONTROL): 13.9.1 lets the means of reaching content differ."
    },
    'p-as-heading': {
      tests: ['9.1.3'],
      note: "Flags short <p> text, and short <div> text with only inline markup inside, that is entirely bold (however the bold is applied) and at least 18px, asking whether it is a visual heading without <hx>/role=heading markup. That is the 9.1.3 question: is each passage that acts as a heading structured with <hx> or role=heading plus aria-level? Text that is only a number (HEADING_LIKE_NUMBER: a key figure, a price, a counter) counts toward no test: it is nearly always emphasis, not a heading, and a year that titles a section is found when the page's headings are reviewed. Text that is one link (HEADING_LIKE_LINK) is still asked about: a card title is a common unmarked heading.",
      reasonCodes: {
        HEADING_LIKE_NUMBER: {
          tests: []
        }
      }
    },
    'page-has-heading-one': {
      tests: [],
      note: 'Flags pages with no h1 or role=heading aria-level=1. RGAA does not explicitly require an h1, but a missing top level is evidence the auditor weighs in 9.1.1 step 2 (whether the heading hierarchy is relevant). Not mapped to 9.1.1: RGAA does not require an h1.'
    },
    'rgaa-page-language-present': {
      tests: ['8.3.1'],
      note: 'Checks the two conditions of 8.3.1: a language on <html> (lang, or xml:lang on XHTML 1.1 or a page parsed as XML), or on every text of <body> or one of its parents. Fails when some rendered text has no language at all. Asks when the language is given by xml:lang alone on a version where the glossary "Langue par défaut" asks for lang, since the test\'s wording accepts either attribute.'
    },
    'page-title-patterns': {
      tests: ['8.6.1'],
      note: "Asks about every page's <title>, and says why when it is generic ('Home', 'Untitled'), very short, or duplicated or templated across crawled pages. That is exactly 8.6.1 step 2: is the title relevant enough to find the page in history or tabs, which only a person can judge (G88)."
    },
    'page-title-present': {
      tests: ['8.5.1'],
      note: 'Fails when the <title> element is missing or its text is empty, which is 8.5.1 step 1 (a <title> exists). An empty title is treated as an absent title rather than as a relevance (8.6.1) problem.'
    },
    'rgaa-page-title-unique': {
      tests: ['8.6.1'],
      note: 'Fails a page whose <title> another page of the site, at another path, shares, compared through the crawl.pageTitles probe with case and spacing ignored. 8.6.1 asks for a relevant title, and the glossary defines it as one that identifies the page « de manière claire, concise et unique ». It asks when the other page differs only by its query string, or by its scheme, a leading www. or a trailing index file (it may be the same page), and when no other page is given.'
    },
    'rgaa-page-zones-reachable': {
      tests: ['12.6.1'],
      note: "Finds the header, main navigation, main content, footer and search areas from their landmarks, or from an id, class or search field that names them, and passes when each has a landmark matching its nature (condition 1). It never fails, since which blocks are areas is a person's call: it asks about an area without a landmark that relies on a heading (condition 2, whether the heading says what the area holds), a button just before it (condition 3), a skip link just before it (condition 4) or a quick-access link to it (condition 5, whether it is visible), about one with none of these, about a page with no main landmark, and about each block outside every area it found that holds links to other places, so a header, navigation or footer it cannot name is not passed unseen."
    },
    'password-paste-enabled': {
      tests: [],
      note: 'Concerns WCAG 3.3.8 Accessible Authentication (WCAG 2.2), which RGAA 4.1.2 does not include. No RGAA test covers paste blocking on authentication fields. Asks too about a block of three links or more outside the main content with no landmark around it and no name that says what it is, likely a header, navigation or footer the rule could not identify (a page with only <main> recognised used to pass).'
    },
    'presentation-role-conflict': {
      tests: [],
      note: 'Asks about role="presentation"/"none", or <img alt="">, combined with a global ARIA attribute such as aria-label, or with focusability. Not mapped to 1.2.1: most of its findings are on elements other than <img>, or on attributes 1.2.1 does not name (aria-describedby, focusability), and it does not look at title. rgaa-img-decorative-no-alternative checks 1.2.1 step 2 on decorative images.'
    },
    'rgaa-presentational-attributes-absent': {
      tests: ['10.1.2'],
      note: "Fails on each HTML element carrying an attribute 10.1.2 step 1 lists, with its exceptions: size allowed on <select>, width and height on <img>, <object>, <embed>, <canvas> and <svg>. SVG and MathML content is not checked, where those attributes are geometry rather than presentation, and neither are custom elements, whose attributes are the component's own, nor color on <link rel=\"mask-icon\">, the colour of the site's pinned-tab icon. Width and height on a <source> in a <picture> are allowed like those on <img>: they give that image candidate's dimensions, which HTML added in 2021, after the list was written, and the pack reads the list, which predates them, as covering them; on any other <source> they fail. Hidden content is checked too, since 10.1.2 judges the generated source. Metadata and script elements (<link>, <meta>, <script>…) are not checked either."
    },
    'presentational-children-focusable-absent': {
      tests: [],
      note: 'Flags tab stops inside roles with presentational children (button, tab, option...). For native button the Nu checker reports interactive content or a tabindex descendant as a nesting error (8.2.1 step 2). Explicit-role cases are mostly not validator errors, and the effect on AT output (7.1.2) is not directly what the rule tests. Not mapped to 8.2.1: the validator 8.2.1 relies on reports only the native-button case.'
    },
    'rgaa-presentational-elements-absent': {
      tests: ['10.1.1'],
      note: 'Fails on each element 10.1.1 step 1 lists (basefont, big, blink, center, font, marquee, s, strike, tt), and on <u> when the doctype is not HTML5 (step 2). Written for RGAA, so it checks exactly that list. Hidden content is checked too, since 10.1.1 judges the generated source.'
    },
    'progressbar-name-present': {
      tests: [],
      note: 'Fails an element with explicit role="progressbar" that has no author-supplied name and, on a labelable <progress> or <meter>, no associated label. It accepts a wrapping <label>, which 11.1.1 does not list. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only. Not mapped to 7.1.1: it passes when an accessible alternative exists, and a progressbar is not necessarily script-driven.'
    },
    'rgaa-quotation-review': {
      tests: ['9.4.1', '9.4.2'],
      note: 'Asks about visible text that looks like an unmarked quotation, outside <q>, <blockquote>, <cite>, links, headings, code and form controls: a paragraph or other block whose whole text is in quotation marks (« … », “…”, "…", „…“), as a possible « bloc de citation » that 9.4.2 asks to use « une balise <blockquote> » (reason code quotedBlock), and a passage of running text in « … » or “…”, as a possible « citation courte » that 9.4.1 asks to use « une balise <q> » (reason code quotedPassage), each of 8 words or more. Whether the text quotes someone is for a person; the map links every finding to both tests and the message names the one it concerns. French uses « » for titles, terms and names too, so shorter passages are not asked about, and a quotation without quotation marks is not found.',
      reasonCodes: {
        quotedBlock: {
          tests: ['9.4.2']
        },
        quotedPassage: {
          tests: ['9.4.1']
        }
      }
    },
    'rgaa-radio-group-present': {
      tests: ['11.5.1'],
      note: 'Asks about two or more radio buttons with the same name, in the same form, that are not all inside one <fieldset>, role="group" or role="radiogroup" (an outer one holding the whole set counts), the three ways 11.5.1 accepts. 11.5.1 applies "si nécessaire", so a person decides. Custom role="radio" widgets, and same-name checkboxes, are asked about by rgaa-same-name-checkboxes-review.'
    },
    region: {
      tests: [],
      note: 'Flags content under <body> that is outside any landmark. RGAA does not require all content to be inside landmarks: 12.6.1 accepts alternatives to landmarks for specific zones only, and 9.2.1 covers header/nav/main/footer structure, not leftover content.'
    },
    'rgaa-required-field-indication': {
      tests: ['11.10.1', '11.10.2'],
      note: 'Checks the required fields of each form with two or more fields that does not mark its optional ones (the 11.10 particular case). A field\'s own label (its <label> or aria-labelledby passage) counts as a place to mark it optional. Fails a field with required or aria-required="true" whose visible label and linked passages show no indication (11.10.2), with none next to it and no image, icon or generated content that could be one; asks in those cases. A « tous les champs sont obligatoires » sentence not linked to the field fails too, as the particular case keeps 11.10 applicable when all the fields are required (linked by aria-describedby or aria-labelledby, it is an indication in a linked passage and passes); one with an exception (« sauf mention contraire ») is asked about, since the form may mark its optional fields in words the rule does not read. Fails a field whose « * » the page explains only after its first use, or never when the field has required or aria-required (glossary « Indication de champ obligatoire »: the explanation comes « avant la première utilisation »); asks when such a field has neither, since the sign may mean something else.',
      reasonCodes: {
        indicationInLegend: {
          tests: ['11.10.2']
        },
        indicationOutsideLabel: {
          tests: ['11.10.2']
        },
        noVisibleLabel: {
          tests: ['11.10.2']
        },
        indicationMayBeImage: {
          tests: ['11.10.2']
        },
        allFieldsRequiredSentence: {
          tests: ['11.10.2']
        },
        allFieldsRequiredWithException: {
          tests: ['11.10.2']
        },
        stylesNotRead: {
          tests: ['11.10.2']
        },
        signMayMeanOther: {
          tests: ['11.10.1']
        }
      }
    },
    'rgaa-role-img-aria-name': {
      tests: ['1.1.1'],
      note: 'Fails an exposed element with role="img" (not <img>, not an outer <svg>) whose text alternative does not come from aria-labelledby or aria-label, the two sources 1.1.1 step 4 lists for role="img": a title-only name fails, as does no name at all. An element in the SVG namespace named by a <title> child passes: since RGAA 4.1.2 the glossary counts the <title> of an SVG as its alternative. An element with aria-hidden="true" is left out, as the glossary allows only that for a decorative role="img". An element that is the only content of a link or a button is left out too: the glossary « Image porteuse d\'information » (notes 1 and 2) judges its alternative as the control\'s label.'
    },
    'role-img-text-alternative-present': {
      tests: [],
      note: 'Fails an exposed element other than <img> and <svg> with role="img", "graphics-symbol" or "graphics-document" that has no name. Not mapped to 1.1.1: the rule accepts a title attribute or an SVG <title> as the name, which 1.1.1 step 4 does not list for role="img", and its graphics-* findings belong to no RGAA test. rgaa-role-img-aria-name checks 1.1.1 for role="img".'
    },
    'rgaa-same-name-checkboxes-review': {
      tests: ['11.5.1'],
      note: 'Asks about three or more visible checkboxes with the same name in the same form, and two or more visible role="radio" elements (native radio buttons left out) in one parent, that are not all inside one <fieldset> or role="group" (or, for radios, role="radiogroup"), the ways 11.5.1 accepts. The glossary « Champs de même nature » names « un ensemble de boutons radio ou de cases à cocher qui se rapportent à une question », to be grouped « lorsque les intitulés de label ne sont pas suffisants », so a person decides (« si nécessaire »). Two checkboxes sharing a name are not asked about. Native radio buttons are rgaa-radio-group-present’s.'
    },
    'scope-attr-valid': {
      tests: [],
      note: 'Flags scope values other than row/col/rowgroup/colgroup. Not linked to 5.7.2: it accepts rowgroup and colgroup, which RGAA does not, and rgaa-th-scope-row-col fails every scope other than row or col. Not linked to 8.2.1: the rule trims values and skips empty ones, which the validator rejects; rgaa-html-elements-attributes-valid reports scope values under 8.2.1.'
    },
    'rgaa-script-button-name-present': {
      tests: ['7.1.3'],
      note: 'Fails a button (<button>, input button/submit/reset/image, role=button) outside any form, with no form attribute naming one, that has no name from aria-labelledby, aria-label, its content, value, alt or title. A button outside a form does nothing unless a script drives it, so it is a component 7.1 covers, and 7.1.3 asks « Le composant possède un nom pertinent » with no alternative, unlike 7.1.1. Asks about an image button the browser names with a generic "Submit". The buttons of a form are left to rgaa-form-button-name-present (11.9.1).'
    },
    'rgaa-script-redirect-review': {
      tests: ['13.1.3'],
      note: 'Asks about each inline <script> whose code loads another address from a timer (setTimeout or setInterval, then an assignment to location or location.href, or location.assign or replace): 13.1.3 asks that the user can stop or restart such a redirection, extend its delay ten times, or be warned with twenty seconds to extend it, unless the limit is twenty hours or more, which only a person can try. Script files are not read.'
    },
    'rgaa-scripted-components-review': {
      tests: ['7.1.1', '7.1.2', '7.1.3'],
      note: 'Asks on every page with script (an executable <script>, an inline event handler, a javascript: URL or a custom element) for a person to check each scripted component against 7.1.1 to 7.1.3. It always asks, because the engine cannot see behaviour attached from script files. It lists candidate elements from the markup (widget roles, tabindex, inline handlers, links whose href is "#" or javascript:, which usually act as buttons whose role 7.1.3 asks to be relevant, contenteditable, aria-expanded and similar states) as a starting point, not a complete list. A page with no script is notApplicable, since 7.1 applies to scripts.',
      reasonCodes: {
        focusableNonNative: {
          tests: ['7.1.1', '7.1.3']
        },
        inlineHandler: {
          tests: ['7.1.1', '7.1.3']
        },
        stateAttribute: {
          tests: ['7.1.1']
        },
        linkWithoutDestination: {
          tests: ['7.1.3']
        }
      }
    },
    'scrollable-region-focusable': {
      tests: [],
      note: 'Flags containers with overflow auto/scroll that have no focusable descendant and are not focusable themselves (keyboard scrolling). No RGAA test covers keyboard scrolling of a plain CSS scroll region: 7.3 needs a script handler, 10.14/12.11 cover extra content shown on hover, focus or activation, and 12.9 covers keyboard traps.'
    },
    'searchbox-name-present': {
      tests: [],
      note: 'Checks that role=searchbox has a name from aria-label, aria-labelledby, title or an associated label. It accepts a wrapping <label> and a placeholder on a text-like <input>, which 11.1.1 does not list, so a placeholder-only field passes here while it fails 11.1.1. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only. Not mapped to 7.1.1: it passes when an accessible alternative exists.'
    },
    'rgaa-select-fake-groups-review': {
      tests: ['11.8.1'],
      note: "Asks about a <select> with no <optgroup> that holds options used as group headings: two disabled options or more after the first (a single one is often an item out of stock), or an option framed by dashes or similar signs. 11.8.1 asks whether « les items de même nature d'une liste de choix sont regroupés avec une balise <optgroup>, si nécessaire », and such headings show the author grouped them visually, while assistive technologies read them as more choices. Whether grouping is needed is for a person."
    },
    'server-side-image-map-absent': {
      tests: ['1.1.4'],
      note: 'Asks about each <img ismap> inside a link, which is step 1 of 1.1.4 (find <img> with ismap). 1.1.4 passes if the page also has links giving the same destinations (step 2), which this rule cannot check, so it asks rather than fails. An <img ismap> outside a link does nothing, and the rule leaves it to the validator. 1.1 is outside the WCAG-derived candidates, but the element and attribute match exactly.',
      outsideCorrespondence: {
        '1.1.4':
          'RGAA files 1.1.4 under WCAG 1.1.1 and the engine files server-side image maps under 2.1.1 (Keyboard), but the rule and the test look for the same thing: 1.1.4 step 1 finds each <img> with ismap.'
      }
    },
    'skip-link': {
      tests: ['12.7.1', '12.7.2'],
      note: "Flags skip links whose #fragment does not resolve to a usable target. A skip link is recognised by its wording in the shipped locales ('skip', 'aller au contenu', 'accès direct', 'zum Inhalt springen', 'saltar al contenido', '本文へ') or as the first link of the page placed before main. A dead skip link means the main zone cannot be skipped, which bears on 12.7.1, and it bears on the condition of 12.7.2 that the link works (« Le lien est fonctionnel »); the rule asks, it never fails. The rule does not check the link's visibility or its place across pages, which rgaa-skip-link-placement checks, and a skip link can target zones other than main."
    },
    'rgaa-skip-link-placement': {
      tests: ['12.7.2'],
      note: "Fails a skip link (a same-page link outside the main zone that leads to it, as rgaa-skip-link-present finds one) that is not visible even when it takes focus, measured in a browser: no size, outside the page, clipped, transparent or visibility: hidden. That is 12.7.2 condition 3 (« visible ou, à défaut, visible à la prise de focus »). With the crawl.skipLinks probe, it fails a link more than 24px to the side on another page measured at the same window width (condition 1, « situé à la même place dans la présentation »), asks when it is only higher or lower there, since content above it such as a cookie banner pushes it down without moving it in the layout, and asks when its focus order differs (condition 2, relative order is a person's call). It asks when only one page is available, when something may cover the link, and in jsdom. Condition 4 (the link works) is skip-link's."
    },
    'rgaa-skip-link-present': {
      tests: ['12.7.1'],
      note: 'Fails a page whose navigation block comes before the visible <main> when no same-page link leads to the main content zone (to <main>, or to an element just before or at the start of it), and a skip link to the content (by its name or fragment) whose target does not exist; a broken first link that names something else, such as cookie settings, is no skip link. That is 12.7.1 step 2: the zone can be skipped or reached by a link. Asks when no navigation comes before the zone (the one-page particular case), and on a skip link whose target is hidden or not at the start of the zone, and on a working skip link inside aria-hidden="true", which keyboard users can use but screen reader users cannot find. While a modal dialog is open, such as a cookie banner, the rest of the page is inert, so only a skip link to the content whose target does not exist is judged. Whether the link is visible on focus is left to 12.7.2.'
    },
    'slider-name-present': {
      tests: [],
      note: "Checks that explicit role=slider has a name from aria-label, aria-labelledby, title or an associated label. Native input[type=range] without the role is out of the rule's scope. It accepts a wrapping <label> and a placeholder on a text-like <input>, which 11.1.1 does not list, so a placeholder-only field passes here while it fails 11.1.1. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only. Not mapped to 7.1.1: it passes when an accessible alternative exists."
    },
    'spinbutton-name-present': {
      tests: [],
      note: 'Checks that role=spinbutton has a name from aria-label, aria-labelledby, title or an associated label. It accepts a wrapping <label> and a placeholder on a text-like <input>, which 11.1.1 does not list, so a placeholder-only field passes here while it fails 11.1.1. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only. Not mapped to 7.1.1: it passes when an accessible alternative exists.'
    },
    'rgaa-status-message-review': {
      tests: ['7.5.1', '7.5.2', '7.5.3'],
      note: 'Asks about visible elements that look like status messages with none of the roles 7.5 names (status, alert, log, progressbar): one with aria-live, and one whose class or id names a message (alert, message, notification, notice, toast, flash, success, error, warning, feedback) holding 40 words or less. 7.5.1 to 7.5.3 name the role attribute, and their methodology also accepts aria-live with aria-atomic="true" for some kinds of message; whether the element is a status message (glossary « Message de statut », a change of content without a change of context) is for a person.'
    },
    'summary-name-present': {
      tests: [],
      note: 'Flags <summary> elements with an empty name. A native details/summary disclosure is not script-generated, so 7.1.1 does not strictly apply. 11.9.1 covers only buttons inside a form, and no other candidate test concerns disclosure widgets. The auditor may still choose to treat a scripted summary under 7.1.1.'
    },
    'rgaa-svg-decorative-aria-hidden': {
      tests: ['1.2.4'],
      note: 'Checks each <svg> exposed to assistive technologies that may be decorative (not the only content of a link or button, not focusable, not captioned, not a sprite sheet, no role="img"): fails one with role="presentation" or "none" and no aria-hidden="true", since 1.2.4 condition 1 accepts only aria-hidden="true" for a decorative SVG, and asks about the others, which fail 1.2.4 if decorative and fall under 1.1.5 if they carry information.'
    },
    'rgaa-svg-hidden-no-alternative': {
      tests: ['1.2.4'],
      asks: ['1.1.5'],
      note: 'Fails an <svg aria-hidden="true"> that carries a text alternative: aria-label, aria-labelledby, a title attribute, or a non-empty <title> or <desc>, in its own content or in a <symbol>/<svg> it draws through a same-document <use> (as the note of criterion 1.2 asks). As a decorative image it breaks conditions 2 to 4 of 1.2.4. If the alternative means the image carries information, it is hidden from assistive technology and has no role="img", failing 1.1.5. Which of the two applies needs a human, so a finding fails 1.2.4, where the aria-hidden of the author puts it (and where sprite icons that keep a <title> belong), and asks under 1.1.5. A sprite sheet, an SVG that draws nothing of its own (only <defs>, <symbol> and the like), is left out.'
    },
    'svg-image-text-alternative-present': {
      tests: [],
      note: 'Targets SVG <image> child elements. RGAA 1.1.5 covers the <svg> root, and 1.1.1 covers <img> and role="img", so no RGAA test is about naming an inner SVG <image>. It would only matter if that element were given role="img", and role-img-text-alternative-present already covers that case.'
    },
    'rgaa-svg-role-img': {
      tests: ['1.1.5'],
      note: 'Fails an exposed outer <svg> named by aria-labelledby, aria-label or a <title> child but without role="img": 1.1.5 step 4 says the test is failed without the role. An <svg role="img"> named only by <title> passes: RGAA 4.1.2 added the content of <title> to the sources of 1.1.5 step 5. An unnamed <svg role="img"> is left to svg-text-alternative-present. An SVG with an alternative and no role="img" fails only when it certainly carries information (captioned, or focusable); otherwise it is asked about, since it fails 1.2.4 instead if it is decorative. An SVG that is the only content of a link or a button is left out: the glossary judges it as the control\'s label.'
    },
    'svg-text-alternative-present': {
      tests: ['1.1.5'],
      note: 'Fails an <svg> root that seems meant to convey information but has no <title> text and no aria-label/aria-labelledby, which is 1.1.5 step 5. It does not enforce the role="img" requirement of step 3, which rgaa-svg-role-img checks.'
    },
    'svg-text-alternative-quality': {
      tests: ['1.3.6'],
      note: "Asks a human to judge the relevance of an <svg>'s existing title/ARIA name, which is 1.3.6 step 2. It also includes desc-only cases, though 1.3.6 does not list desc. The question also covers 1.2.4: an <svg> that turns out to be decorative and keeps its alternative fails it. An image that is a link's or button's only content (IMAGE_ONLY_CONTROL_CONTENT) counts toward no test: the glossary « Image porteuse d'information », notes 1 and 2, judges its alternative as the control's label, which the link and button rules check under 6.1, 6.2, 11.9 and 7.1.",
      reasonCodes: {
        IMAGE_ONLY_CONTROL_CONTENT: {
          tests: []
        },
        TEXT_ALTERNATIVE_REVIEW: {
          tests: ['1.3.6', '1.2.4']
        }
      }
    },
    'tab-name-present': {
      tests: ['7.1.1'],
      note: 'Checks that role=tab has a non-empty name. A tab is part of a script-driven tab panel component, and 7.1.1 step 2 requires an explicit name. Not a form field.'
    },
    tabindex: {
      tests: ['12.8.1'],
      note: 'Flags positive tabindex values, which override the natural focus order. This is direct evidence for 12.8.1 step 2, whether the tab order stays coherent, though a positive tabindex is not a failure by itself.'
    },
    'table-duplicate-name': {
      tests: [],
      note: 'Asks (cantTell) about tables whose summary attribute repeats the caption. Not mapped to 5.2.1: in HTML5 the summary attribute is not a summary (5.1.1 step 2, glossary "Résumé (de tableau)"), and 5.2 concerns only complex data tables, while this rule asks about any table. rgaa-complex-table-summary-quality asks 5.2.1\'s question on complex tables.'
    },
    'table-fake-caption': {
      tests: ['5.4.1'],
      note: "Flags tables with no <caption> whose first row is a single cell above multi-cell rows, asking whether that cell is a visual title not tied to the table. That is 5.4.1 step 2: is the data table's title given by caption, title, aria-label or aria-labelledby? A table already named by title, aria-label or aria-labelledby is not asked about, nor one whose role is not table, grid or treegrid (a layout table is 5.8's matter)."
    },
    'table-headers-attr-valid': {
      tests: ['5.7.4'],
      note: 'Fails a td/th whose headers attribute references an id that is missing, points to a non-cell, points to the cell itself, or sits in another table, so headers does not list the ids of the associated headers (5.7.4 step 2, second condition). Not linked to 8.2.1: the rule accepts headers that name a td, which the validator rejects (it wants a th of the same table); rgaa-html-elements-attributes-valid reports headers under 8.2.1.'
    },
    'table-th-has-data-cells': {
      tests: [],
      note: 'Fails a table (not role=presentation) that has <th> but no <td> at all, and asks about a header no data cell is assigned to (ACT d0f69e). If the auditor judges the first a layout table, the <th> use fails 5.8.1 step 2. If it is a data table whose cells are all marked <th>, no RGAA test forbids that (5.6.4 allows th), so the auditor must decide which applies. Not mapped to 5.8.1: only a failure if the auditor judges the table a layout table. Not mapped to 5.7.1: a table with no <td>, or a header with no cell under it, says nothing about the id, scope or role that 5.7.1 checks.'
    },
    'rgaa-table-title-adjacent': {
      tests: ['5.4.1'],
      note: "Asks about a data table (with a <th>, not a presentation table) that has no <caption>, title, aria-label or aria-labelledby and comes right after a heading: the heading may be the table's title given as plain text, which 5.4.1 wants « correctement associé au tableau », or the title of its section. table-fake-caption asks about the other plain-text title, a first row of one cell."
    },
    'target-size-minimum': {
      tests: [],
      note: 'Checks the 24x24 CSS px target size and spacing exception of WCAG 2.5.8, a WCAG 2.2 criterion RGAA 4.1.2 does not include. No RGAA test measures pointer target size.'
    },
    'td-has-header': {
      tests: [],
      note: 'In large tables (4x4 or more, no colspan/rowspan, and no role other than table, grid or treegrid) that have header cells, fails a non-empty <td> with no headers attribute and no header cell (<th>, or role columnheader or rowheader) above it in its column or before it in its row; a large table with no header cell at all is asked about once (TD_TABLE_NO_HEADERS), as it may be a layout table (F46). Not mapped to 5.7.4: that test covers cells "associée à un ou plusieurs en-têtes possédant un attribut id", and a cell with no header at all is not one. Not mapped to 5.6.1/5.6.2: a cell without associated headers does not show that the headers were not declared with <th>; rgaa-data-table-headers-review asks the 5.6 question about a table with no header cell.'
    },
    'rgaa-text-direction-marked': {
      tests: ['8.10.1'],
      note: 'Fails text whose letters read in the direction opposite to its context (the nearest dir="ltr" or dir="rtl", or left to right with none, as the glossary « Sens de lecture » says) with no dir between them. 8.10.1: « chaque texte dont le sens de lecture est différent du sens de lecture par défaut est contenu dans une balise possédant un attribut dir »; it has no exception for short text, and its methodology names « une langue qui se lit dans le sens inverse (comme l’arabe ou l’hébreu pour le français) ». So a run of right-to-left script (Hebrew, Arabic…) with two letters or more in a left-to-right context fails whatever its length (« العربية » in a language menu): those scripts write only languages read right to left. Left-to-right text in a right-to-left context fails from three words. Text in a <bdi> with no dir fails the same way (bdiWithoutDir): a <bdi> does not replace the dir attribute the test asks for. Asks where the characters may not be words: a single right-to-left letter, Arabic-Indic digits or signs with fewer than two letters, Arabic mathematical symbols, and left-to-right runs of one or two words in a right-to-left context (a brand name, an acronym). Text under dir="auto" is left to rgaa-dir-attribute-valid; code is left out.'
    },
    'rgaa-text-image-review': {
      tests: ['1.8.1', '1.8.2'],
      note: 'Asks about visible informative images likely to show text (glossary « Image texte »): an image button (input type=image, 1.8.2), an image inside a heading, and an <img> or role="img" whose file name, class or id names text, a title, a banner or a button (1.8.1). 1.8.1 and 1.8.2 ask that each informative image of text, « en l’absence d’un mécanisme de remplacement, doit si possible être remplacée par du texte stylé »; whether the image holds text, a replacement mechanism exists or its rendering is essential is for a person. Logos and brand names, which 1.8\'s particular case exempts, are left out: an image whose alternative, file name, class or id, or an ancestor\'s, says logo, marque or brand. Images of <object>, <embed>, <canvas> and <svg> (1.8.3 to 1.8.6) are not looked at.',
      reasonCodes: {
        imageButton: {
          tests: ['1.8.2']
        },
        imageInHeading: {
          tests: ['1.8.1']
        },
        textImageName: {
          tests: ['1.8.1']
        }
      }
    },
    'text-spacing-content-loss': {
      tests: ['10.12.1'],
      note: "In a browser, applies the four spacings of 10.12.1 step 1 (line-height 1.5, 2em after paragraphs, letter-spacing 0.12em, word-spacing 0.16em) as a style sheet that wins over the page's own, and fails text that an ancestor with overflow hidden or clip then cuts off by at least half a line. That is the criterion's question, « le texte reste-t-il lisible ». It asks about text pushed out by less, text that comes to overlap other text, and a style sheet rule that forces spacing below those values with !important."
    },
    'textbox-name-present': {
      tests: [],
      note: 'Checks that role=textbox has a name from aria-label, aria-labelledby, title or an associated label. It accepts a wrapping <label> and a placeholder on a text-like <input>, which 11.1.1 does not list, so a placeholder-only field passes here while it fails 11.1.1. Not mapped to 11.1.1: rgaa-field-label-listed-source reports 11.1.1 for every form field, from the sources 11.1.1 lists only. Not mapped to 7.1.1: it passes when an accessible alternative exists.'
    },
    'rgaa-th-association-present': {
      tests: ['5.7.1'],
      note: 'Fails a <th> with text and no unique id, scope or role="rowheader"/"columnheader" in a table with headers on both axes (a first row of <th>, and rows starting with a <th> followed by <td>) and no rowspan or colspan: 5.7.1 asks one of the three of each <th> « s\'appliquant à la totalité de la ligne ou de la colonne », and that shape leaves no doubt the header covers a whole row or column. Passes a table whose headers all sit in a single row or a single column, which the particular case of 5.7 lets be <th> without scope. Asks once about any other table whose headers lack all three: with spans, or headers off the first row and column, a header may cover only part of a row or column, which 5.7.1 leaves to 5.7.3.'
    },
    'rgaa-th-scope-row-col': {
      tests: ['5.7.2', '5.7.3'],
      note: 'Fails a <th> (not in a presentation table) whose scope is not row or col (rowgroup, colgroup, a misspelt or empty value): 5.7.2 wants scope="row" or "col" on a header over a whole row or column, and 5.7.3 wants no scope and a unique id on one over part of it (glossary "En-tête de colonne ou de ligne"), so such a header fails one of the two tests, and criterion 5.7 either way. Also fails a scope pointing the wrong way where the table\'s shape makes it certain (no rowspan or colspan): scope="col" on the first cell of a body row of <td> under a first row of <th>, and scope="row" on a cell of that first row above rows starting with a <td>.'
    },
    'rgaa-title-placeholder-identical': {
      tests: ['11.2.2'],
      note: 'Asks about an <input> or <textarea> whose non-empty title and placeholder differ. The glossary "Étiquette de champ de formulaire" says the placeholder may be read in place of the title, so « lorsque ces deux attributs title et placeholder sont présents, ils doivent être identiques ». No test names this requirement; 11.2.2, which judges whether a title gives the field\'s exact function, is the closest, so the rule asks rather than fails.'
    },
    'tooltip-name-present': {
      tests: [],
      note: 'Flags role=tooltip with an empty name, which in practice means an empty tooltip. A tooltip is supplementary content, not an operable component whose name 7.1.1 step 2 evaluates. None of the candidate tests checks tooltip content, so a fit to 7.1.1 would be weak.'
    },
    'rgaa-tooltip-review': {
      tests: ['10.13.1', '10.13.2', '10.13.3'],
      reasonCodes: {
        tooltipRoleDismiss: { tests: ['10.13.1'] },
        tooltipRoleHover: { tests: ['10.13.2'] },
        tooltipRolePersist: { tests: ['10.13.3'] },
        tooltipAttributeDismiss: { tests: ['10.13.1'] },
        tooltipAttributeHover: { tests: ['10.13.2'] },
        tooltipAttributePersist: { tests: ['10.13.3'] }
      },
      note: 'Asks about author tooltips and popovers: an element with role="tooltip" (on the element that references it by aria-describedby or aria-labelledby, if any), and a visible element with a tooltip library attribute (data-tooltip, data-tippy-content, data-balloon, data-toggle or data-bs-toggle set to tooltip, or to popover with a hover or focus trigger). 10.13.1 to 10.13.3 ask that such content can be hidden without moving the pointer or focus, can be hovered, and stays visible; that is behaviour a script decides, for a person to test. Each tooltip is asked about once per test, by a reason code routed to that test, so each answer counts toward its own test. The title attribute is left out: 10.13\'s particular case makes content « contrôlé par l’agent utilisateur (par exemple, attribut title) » not applicable.'
    },
    'treeitem-name-present': {
      tests: ['7.1.1'],
      note: 'Checks that role=treeitem has a non-empty name. A tree item is part of a script-driven tree component, and 7.1.1 step 2 requires an explicit name.'
    },
    'valid-lang': {
      tests: [],
      note: 'Fails lang on elements other than <html> whose primary subtag is not in the IANA language subtag registry (WCAG 3.1.2, ACT de46e4). Not linked to 8.8.1: the registry leaves out the three-letter ISO 639-2 codes of languages with a two-letter one (fra, fre, eng, ger), which the glossary "Code de langue" accepts, so this rule fails lang="fra", which 8.8.1 passes. rgaa-valid-lang reports 8.8.1.'
    },
    'rgaa-valid-lang': {
      tests: ['8.8.1'],
      reasonCodes: {
        DEFAULT_LANG_INVALID: {
          tests: ['8.4.1']
        }
      },
      note: "Fails lang on elements other than <html> whose language code, the part before the first hyphen (glossary \"Code de langue\"), is not an ISO 639-1, 639-2 or later ISO 639 code: the 'valide' condition of 8.8.1 step 2. It runs the code of valid-lang, with ISO 639-2 codes such as fra or ger and the qaa to qtz local-use range accepted. A lang with no lang above it, such as <body lang> on a page whose <html> has none, sets the page's default language rather than changing it (DEFAULT_LANG_INVALID): that finding counts toward 8.4.1, the validity of the default language's code. Relevance (the 'pertinent' condition) is not judged."
    },
    'video-caption': {
      tests: ['4.3.1'],
      reasonCodes: {
        CAPTIONS_REVIEW: {
          tests: ['4.4.1']
        }
      },
      note: 'Asks about a <video> without a <track kind="captions"> (with a src), the question of 4.3.1 step 2 (are synchronised captions present?). A video with only kind="subtitles" tracks is asked about too, since the glossary "Sous-titres synchronisés" (note 2) does not count translation subtitles as captions. A video with a captions track is asked whether its captions are complete (CAPTIONS_REVIEW, F8), which is 4.4.1: are the captions relevant?'
    },
    'rgaa-video-captions-track-kind': {
      tests: ['4.3.2'],
      note: 'Fails a <video> whose subtitle tracks (with a src) are all kind="subtitles" (or have no kind, which means subtitles), with none kind="captions", when one is in the video\'s language as the <video>\'s own lang gives it, or has a label naming captions (« sourds et malentendants », SME, SDH, CC), and a track whose kind HTML does not know (kind="caption", read as metadata and never shown). That is 4.3.2 as written. Otherwise it asks, since the page\'s language says nothing of the audio\'s and a translation track is not a caption track (glossary "Sous-titres synchronisés", note 2), and then 4.3.2 does not apply. Whether the video is pre-recorded synchronised media, and whether a track carries captions at all, needs a human.'
    },
    'video-poster-text-alternative-present': {
      tests: [],
      note: 'Checks that a <video poster> has an accessible name. No RGAA 4.1.2 test targets poster images: the theme-1 tests list img/area/input/svg/object/embed/canvas, and the theme-4 tests are about transcripts, captions and AT compatibility of the media player, not naming a <video>.'
    },
    'rgaa-viewport-zoom-review': {
      tests: ['10.4.2'],
      note: 'Asks about each viewport meta tag that disables zoom or caps it below 2, the tags meta-viewport-zoom-enabled fails. 10.4.2 is met when text reaches 200% by any one of its three conditions (browser text zoom, browser graphic zoom, a zoom control of the site), and the tag acts only on pinch zoom, so whether it blocks all three depends on the audit environment. It never fails.'
    },
    'widget-keyboard-focusable': {
      tests: ['7.3.1'],
      note: 'Asks about an element with a widget role that Tab never reaches: a single widget that cannot take focus or takes it only from script (tabindex=-1), a composite widget with no tab stop, and an aria-activedescendant host that cannot take focus. A widget role means a script handles the element, so 7.3.1 condition 1 applies: the element is accessible by the keyboard. A question, as in core: a script may move focus there, and condition 2 passes the element when another keyboard-operable control does the same.'
    },
    'rgaa-widget-label-in-name': {
      tests: ['7.1.3'],
      note: "Fails an element with an ARIA widget role other than link, button or form field (tab, menuitem, menuitemcheckbox, menuitemradio, treeitem, gridcell, option), or a button outside a form, whose accessible name, from aria-labelledby or aria-label, does not contain its visible text. That is 7.1.3 step 2: the component's name contains at least the visible label. An explicit widget role marks a component built with a script, and a button outside a form does nothing unless a script drives it; 11.9.2 takes the buttons inside a form. Punctuation and capital letters are ignored (particular cases of 7.1.3), and nothing else: an abbreviation written out, a word with another ending or text in parentheses left out fails. Asks only when the visible label may be a symbol. A title is not checked, since 7.1.3 judges only the accessible name."
    }
  }
};

module.exports = { RGAA_RULE_TESTS };
