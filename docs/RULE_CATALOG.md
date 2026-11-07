# Rule catalog: RGAA

The rules of RGAA (`@surea11y/pack-rgaa`), a pack for `@surea11y/core`, which a scan given the pack runs as their tags and the pack's profiles say. Core's rules, and the WCAG rollups, are in core's [`RULE_CATALOG.md`](https://github.com/SureA11y/core/blob/main/docs/RULE_CATALOG.md).

Generated from the compiled engine's own catalog (`getChecksCatalog()`/`getRulesCatalog()`) and each rule's source header. Run `npx surea11y-pack docs` to regenerate this file whenever rules change. Do not hand-edit.

**111 rules total: 68 automatic (decide deterministically; can return `fail`), 43 manual (a person judges what they find; never `fail`, and `pass` only when nothing needs judging). 0 carry at least one formal WCAG Success Criterion mapping.**

The tables below are an index; [rule reference](#rule-reference) carries each rule's description, what it applies to and what it expects.

A rule with a **Margin** line measures a value against a threshold, and its check result's `margin` says how close the closest element came while still meeting it (see [`OUTPUT_SCHEMA.md`](https://github.com/SureA11y/core/blob/main/docs/OUTPUT_SCHEMA.md#a-check-result-checksresultsi)). Unlike the fields below, it is a stable contract.

Under **What a finding reports**, a rule lists the fields its findings carry in `data.details` besides `reasonCode`, and what each one means. They help to read and reproduce a finding, but apart from `reasonCode` (and the few fields [`API_STABILITY.md`](https://github.com/SureA11y/core/blob/main/docs/API_STABILITY.md) names, such as the contrast size fields) they are not a stable contract (see [`OUTPUT_SCHEMA.md`](https://github.com/SureA11y/core/blob/main/docs/OUTPUT_SCHEMA.md#an-occurrence-occurrencesi)): a field may be renamed or dropped in a minor release, so do not build on them.

See [`OUTPUT_SCHEMA.md`](https://github.com/SureA11y/core/blob/main/docs/OUTPUT_SCHEMA.md) for what `type`/`confidence`/`severity` mean on a scan result, and [`WCAG_CONFORMANCE.md`](https://github.com/SureA11y/core/blob/main/docs/WCAG_CONFORMANCE.md) for how these roll up to an SC-level conformance claim.

## Automatic rules (68), can return `fail`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`rgaa-area-alt-source`](#rgaa-area-alt-source) | Linked image-map areas are named by alt or aria-label | — | — | medium | moderate |
| [`rgaa-aria-attribute-conformance`](#rgaa-aria-attribute-conformance) | aria-* attributes are valid for the W3C validator | — | — | high | moderate |
| [`rgaa-aria-list-item-roles`](#rgaa-aria-list-item-roles) | ARIA lists use role="listitem" for their items | — | — | medium | moderate |
| [`rgaa-aria-role-conformance`](#rgaa-aria-role-conformance) | Role attributes are valid for the W3C validator | — | — | high | moderate |
| [`rgaa-autocomplete-user-field`](#rgaa-autocomplete-user-field) | Fields about the user have a valid autocomplete value | — | — | high | moderate |
| [`rgaa-canvas-decorative-aria-hidden`](#rgaa-canvas-decorative-aria-hidden) | Decorative &lt;canvas&gt; images have aria-hidden="true" and no alternative | — | — | medium | minor |
| [`rgaa-canvas-role-img`](#rgaa-canvas-role-img) | &lt;canvas&gt; images have role="img" with an ARIA name, or fallback content | — | — | medium | serious |
| [`rgaa-contrast-minimum`](#rgaa-contrast-minimum) | Text meets RGAA minimum color contrast | — | — | high | serious |
| [`rgaa-css-colors-paired`](#rgaa-css-colors-paired) | CSS text and background colors are declared together | — | — | medium | moderate |
| [`rgaa-dir-attribute-valid`](#rgaa-dir-attribute-valid) | dir attributes are ltr or rtl | — | — | high | minor |
| [`rgaa-doctype-position`](#rgaa-doctype-position) | The doctype comes before the &lt;html&gt; tag | — | — | high | moderate |
| [`rgaa-doctype-present`](#rgaa-doctype-present) | Page declares a doctype | — | — | high | moderate |
| [`rgaa-doctype-valid`](#rgaa-doctype-valid) | Declared doctype is valid | — | — | high | moderate |
| [`rgaa-embed-image-role-img`](#rgaa-embed-image-role-img) | Embedded images have role="img" and a text alternative | — | — | medium | serious |
| [`rgaa-field-label-in-name-sources`](#rgaa-field-label-in-name-sources) | Every label source of a form field contains its visible label | — | — | high | serious |
| [`rgaa-field-label-listed-source`](#rgaa-field-label-listed-source) | Form fields have a label from a source RGAA lists | — | — | high | serious |
| [`rgaa-figure-caption-structure`](#rgaa-figure-caption-structure) | Images with a caption use the figure structure RGAA describes | — | — | high | minor |
| [`rgaa-focus-indicator-contrast`](#rgaa-focus-indicator-contrast) | Author focus indicators have a contrast ratio of at least 3:1 | — | — | medium | serious |
| [`rgaa-form-button-label-in-name-sources`](#rgaa-form-button-label-in-name-sources) | The accessible name of a button in a form contains its visible label | — | — | high | serious |
| [`rgaa-form-button-name-present`](#rgaa-form-button-name-present) | Buttons in a form have a label | — | — | high | serious |
| [`rgaa-frame-title-attribute-present`](#rgaa-frame-title-attribute-present) | Frames have a title attribute | — | — | high | serious |
| [`rgaa-heading-content-present`](#rgaa-heading-content-present) | Headings have content | — | — | high | moderate |
| [`rgaa-heading-role-level-present`](#rgaa-heading-role-level-present) | ARIA headings have an aria-level attribute | — | — | high | moderate |
| [`rgaa-html-elements-attributes-valid`](#rgaa-html-elements-attributes-valid) | HTML elements and attribute values are valid | — | — | high | moderate |
| [`rgaa-html-lang-code-valid`](#rgaa-html-lang-code-valid) | Default language code is valid | — | — | high | serious |
| [`rgaa-html-nesting-valid`](#rgaa-html-nesting-valid) | HTML elements are nested as HTML allows | — | — | high | moderate |
| [`rgaa-img-alt-present`](#rgaa-img-alt-present) | Images that are not spacers have an alt attribute | — | — | high | serious |
| [`rgaa-img-decorative-no-alternative`](#rgaa-img-decorative-no-alternative) | Decorative images have no aria-labelledby, aria-label or title | — | — | high | minor |
| [`rgaa-img-describedby-target`](#rgaa-img-describedby-target) | An image's aria-describedby points to its description | — | — | high | serious |
| [`rgaa-img-no-alt-decorative`](#rgaa-img-no-alt-decorative) | Decorative images with no alt attribute | — | — | high | minor |
| [`rgaa-label-for-target-valid`](#rgaa-label-for-target-valid) | Labels point to a form field | — | — | high | serious |
| [`rgaa-layout-table-no-data-markup`](#rgaa-layout-table-no-data-markup) | Layout tables use no data table markup | — | — | high | moderate |
| [`rgaa-link-content-label-present`](#rgaa-link-content-label-present) | Links have a label in their content | — | — | high | serious |
| [`rgaa-link-label-in-name-sources`](#rgaa-link-label-in-name-sources) | Every name source of a link contains its visible label | — | — | high | serious |
| [`rgaa-link-state-colors-review`](#rgaa-link-state-colors-review) | Link states shown by color alone contrast 3:1 with the surrounding text | — | — | medium | moderate |
| [`rgaa-link-title-content-name`](#rgaa-link-title-content-name) | A link's title contains the name its content gives it | — | — | high | serious |
| [`rgaa-listbox-option-groups-absent`](#rgaa-listbox-option-groups-absent) | ARIA listboxes do not group options | — | — | high | moderate |
| [`rgaa-main-element-structure`](#rgaa-main-element-structure) | Main content uses one visible &lt;main&gt; element | — | — | high | moderate |
| [`rgaa-markup-for-presentation`](#rgaa-markup-for-presentation) | Elements are not used only for presentation | — | — | high | moderate |
| [`rgaa-markup-validation-review`](#rgaa-markup-validation-review) | The generated source code passes the W3C validator | — | — | medium | moderate |
| [`rgaa-media-transcript-adjacent`](#rgaa-media-transcript-adjacent) | Audio and video have an adjacent transcript or a link to one | — | — | medium | moderate |
| [`rgaa-meta-redirect-immediate`](#rgaa-meta-redirect-immediate) | Meta redirects are immediate | — | — | medium | serious |
| [`rgaa-meta-refresh-no-url-timing`](#rgaa-meta-refresh-no-url-timing) | Meta refresh waits 20 hours or more | — | — | high | serious |
| [`rgaa-object-embed-decorative-aria-hidden`](#rgaa-object-embed-decorative-aria-hidden) | Decorative image objects and embeds have aria-hidden="true" and no alternative | — | — | high | minor |
| [`rgaa-object-image-role-img`](#rgaa-object-image-role-img) | Image objects have role="img" and a text alternative | — | — | medium | serious |
| [`rgaa-optgroup-label-not-empty`](#rgaa-optgroup-label-not-empty) | Option group labels are not empty | — | — | high | moderate |
| [`rgaa-optgroup-label-present`](#rgaa-optgroup-label-present) | Option groups have a label | — | — | high | moderate |
| [`rgaa-orientation-content-parity`](#rgaa-orientation-content-parity) | Content stays the same in portrait and landscape | — | — | medium | moderate |
| [`rgaa-page-language-present`](#rgaa-page-language-present) | Page gives a default language | — | — | high | serious |
| [`rgaa-page-title-unique`](#rgaa-page-title-unique) | Page titles are unique across the site | — | — | high | moderate |
| [`rgaa-page-zones-reachable`](#rgaa-page-zones-reachable) | Each area of the page can be reached or skipped | — | — | medium | moderate |
| [`rgaa-presentational-attributes-absent`](#rgaa-presentational-attributes-absent) | Page uses no presentational attributes | — | — | high | minor |
| [`rgaa-presentational-elements-absent`](#rgaa-presentational-elements-absent) | Page uses no presentational elements | — | — | high | minor |
| [`rgaa-required-field-indication`](#rgaa-required-field-indication) | Required fields show a required indication in their label | — | — | high | serious |
| [`rgaa-role-img-aria-name`](#rgaa-role-img-aria-name) | Elements with role="img" are named with aria-labelledby or aria-label | — | — | high | serious |
| [`rgaa-script-button-name-present`](#rgaa-script-button-name-present) | Buttons outside a form have a name | — | — | high | serious |
| [`rgaa-skip-link-placement`](#rgaa-skip-link-placement) | Skip links are visible and at the same place on every page | — | — | medium | moderate |
| [`rgaa-skip-link-present`](#rgaa-skip-link-present) | Pages have a skip link to the main content | — | — | high | moderate |
| [`rgaa-svg-decorative-aria-hidden`](#rgaa-svg-decorative-aria-hidden) | Decorative SVGs are hidden with aria-hidden="true" | — | — | high | minor |
| [`rgaa-svg-hidden-no-alternative`](#rgaa-svg-hidden-no-alternative) | Hidden decorative SVGs carry no text alternative | — | — | high | minor |
| [`rgaa-svg-role-img`](#rgaa-svg-role-img) | SVGs with a text alternative have role="img" | — | — | high | serious |
| [`rgaa-text-direction-marked`](#rgaa-text-direction-marked) | Text in the other reading direction is marked with dir | — | — | high | moderate |
| [`rgaa-th-association-present`](#rgaa-th-association-present) | Table headers have an id, a scope or a header role | — | — | high | serious |
| [`rgaa-th-scope-row-col`](#rgaa-th-scope-row-col) | Table headers use scope="row" or scope="col", the right one | — | — | high | moderate |
| [`rgaa-title-placeholder-identical`](#rgaa-title-placeholder-identical) | A form field's title and placeholder are identical | — | — | medium | moderate |
| [`rgaa-valid-lang`](#rgaa-valid-lang) | Language code of a change of language is valid | — | — | high | moderate |
| [`rgaa-video-captions-track-kind`](#rgaa-video-captions-track-kind) | Video caption tracks use kind="captions" | — | — | high | moderate |
| [`rgaa-widget-label-in-name`](#rgaa-widget-label-in-name) | The accessible name of a scripted component contains its visible label | — | — | high | serious |

## Manual rules (43), never `fail`

| Rule ID | Title | WCAG SC | Level | Confidence | Default severity |
|---|---|---|---|---|---|
| [`rgaa-aria-hidden-text-review`](#rgaa-aria-hidden-text-review) | Visible text hidden from assistive technologies is meant to be ignored | — | — | high | moderate |
| [`rgaa-captcha-review`](#rgaa-captcha-review) | CAPTCHA images have a relevant alternative and a non-graphic way in | — | — | high | serious |
| [`rgaa-color-reference-review`](#rgaa-color-reference-review) | Text that refers to a colour does not give the information by colour alone | — | — | high | minor |
| [`rgaa-complex-table-summary`](#rgaa-complex-table-summary) | Complex data tables have a summary | — | — | medium | moderate |
| [`rgaa-complex-table-summary-quality`](#rgaa-complex-table-summary-quality) | Complex data table summaries are relevant | — | — | medium | moderate |
| [`rgaa-consequential-form-review`](#rgaa-consequential-form-review) | Forms with financial, legal or data consequences can be checked, confirmed or undone | — | — | high | serious |
| [`rgaa-context-change-review`](#rgaa-context-change-review) | A change of context from a field is announced first | — | — | high | moderate |
| [`rgaa-cryptic-content-review`](#rgaa-cryptic-content-review) | Cryptic content has a title or is defined by its context | — | — | high | minor |
| [`rgaa-current-item-review`](#rgaa-current-item-review) | The active item of a menu is not shown by its look alone | — | — | high | moderate |
| [`rgaa-data-table-headers-review`](#rgaa-data-table-headers-review) | Tables with no header cells are checked for unmarked headers | — | — | medium | moderate |
| [`rgaa-default-language-review`](#rgaa-default-language-review) | The page's default language code names its main language | — | — | high | serious |
| [`rgaa-embedded-player-review`](#rgaa-embedded-player-review) | Media in embedded players has its alternatives and controls | — | — | high | serious |
| [`rgaa-embedded-refresh-review`](#rgaa-embedded-refresh-review) | Embedded content that may refresh itself lets the user control the refresh | — | — | low | moderate |
| [`rgaa-fake-list`](#rgaa-fake-list) | Text laid out as a list uses list markup | — | — | low | moderate |
| [`rgaa-field-group-legend`](#rgaa-field-group-legend) | Groups of form fields have a legend | — | — | medium | moderate |
| [`rgaa-field-hidden-label-review`](#rgaa-field-hidden-label-review) | A field with a visually hidden label is understandable from the screen | — | — | high | moderate |
| [`rgaa-field-label-consistency-review`](#rgaa-field-label-consistency-review) | Fields asking for the same information have coherent labels | — | — | medium | minor |
| [`rgaa-format-hint-review`](#rgaa-format-hint-review) | Fields with a format constraint suggest the format or an example | — | — | medium | moderate |
| [`rgaa-frame-title-relevant`](#rgaa-frame-title-relevant) | Frame titles are relevant | — | — | high | moderate |
| [`rgaa-headings-absent-review`](#rgaa-headings-absent-review) | A page with text but no heading is reviewed | — | — | high | moderate |
| [`rgaa-image-alt-long`](#rgaa-image-alt-long) | Text alternatives of images are short | — | — | medium | minor |
| [`rgaa-keyboard-only-event-handlers`](#rgaa-keyboard-only-event-handlers) | Keyboard-only inline event handlers should have a pointer equivalent | — | — | low | moderate |
| [`rgaa-label-placement-review`](#rgaa-label-placement-review) | Each field's label sits right next to it, on the expected side | — | — | medium | moderate |
| [`rgaa-language-change-review`](#rgaa-language-change-review) | A passage in another language has its language given | — | — | high | moderate |
| [`rgaa-legend-relevance-review`](#rgaa-legend-relevance-review) | Legends of groups of form fields are relevant | — | — | medium | moderate |
| [`rgaa-letters-spaced-with-spaces`](#rgaa-letters-spaced-with-spaces) | Letters of a word are not spaced out with spaces | — | — | medium | minor |
| [`rgaa-link-context-review`](#rgaa-link-context-review) | Generic links whose only context is outside RGAA's list are reviewed | — | — | medium | minor |
| [`rgaa-modal-tab-order`](#rgaa-modal-tab-order) | Focus stays inside an open modal dialog | — | — | high | moderate |
| [`rgaa-moving-content-review`](#rgaa-moving-content-review) | Moving or blinking content can be controlled | — | — | high | moderate |
| [`rgaa-navigation-systems-review`](#rgaa-navigation-systems-review) | A page that shows fewer than two navigation systems is reviewed | — | — | high | moderate |
| [`rgaa-noscript-alternative-review`](#rgaa-noscript-alternative-review) | A &lt;noscript&gt; alternative gives similar content and features | — | — | high | moderate |
| [`rgaa-office-document-link`](#rgaa-office-document-link) | Downloadable office documents are accessible or have an accessible version | — | — | high | moderate |
| [`rgaa-quotation-review`](#rgaa-quotation-review) | Quotations use &lt;q&gt; or &lt;blockquote&gt; | — | — | high | minor |
| [`rgaa-radio-group-present`](#rgaa-radio-group-present) | Radio buttons sharing a name are grouped | — | — | medium | moderate |
| [`rgaa-same-name-checkboxes-review`](#rgaa-same-name-checkboxes-review) | Sets of checkboxes and custom radio buttons are grouped if needed | — | — | medium | moderate |
| [`rgaa-script-redirect-review`](#rgaa-script-redirect-review) | A timed redirection done by a script can be controlled | — | — | high | moderate |
| [`rgaa-scripted-components-review`](#rgaa-scripted-components-review) | Scripted components are compatible with assistive technologies | — | — | medium | moderate |
| [`rgaa-select-fake-groups-review`](#rgaa-select-fake-groups-review) | Options are grouped with &lt;optgroup&gt;, not with fake heading options | — | — | high | moderate |
| [`rgaa-status-message-review`](#rgaa-status-message-review) | Status messages use role="status", "alert", "log" or "progressbar" | — | — | high | moderate |
| [`rgaa-table-title-adjacent`](#rgaa-table-title-adjacent) | A heading just before a data table is tied to it if it is its title | — | — | high | moderate |
| [`rgaa-text-image-review`](#rgaa-text-image-review) | Images of text that carry information are replaced by styled text where possible | — | — | high | minor |
| [`rgaa-tooltip-review`](#rgaa-tooltip-review) | Content shown on hover or focus can be dismissed, hovered and stays visible | — | — | high | minor |
| [`rgaa-viewport-zoom-review`](#rgaa-viewport-zoom-review) | Text can reach 200% zoom despite a viewport meta tag that limits zoom | — | — | medium | serious |

## Profiles (1)

What a scan runs under each profile (`engineOptions.profile`): the rules its tags select, those its standard maps for its version, and those it names, less those it leaves out. A severity column gives a rule another severity under the profile. The WCAG version is the one its scans are judged by, where the profile names it; others take it from their tags.

| Profile | Tags | Mapped rules | Rules by id | Leaves out | Severity | WCAG version |
|---|---|---|---|---|---|---|
| `rgaa-4.1.2` | `rgaa` | version 4.1.2 | — | — | — | 2.1 |

## Rollups (80)

Each groups rules into one result, as a WCAG rollup does; the standard's own report sections show them.

| Rollup ID | Title | Rules |
|---|---|---|
| `rgaa-4.1.2-1.1` | Chaque image porteuse d’information a-t-elle une alternative textuelle ? | `area-alt-present`, `img-alt-decorative`, `input-image-alt-present`, `rgaa-area-alt-source`, `rgaa-canvas-role-img`, `rgaa-embed-image-role-img`, `rgaa-img-alt-present`, `rgaa-img-decorative-no-alternative`, `rgaa-object-embed-decorative-aria-hidden`, `rgaa-object-image-role-img`, `rgaa-role-img-aria-name`, `rgaa-svg-hidden-no-alternative`, `rgaa-svg-role-img`, `server-side-image-map-absent`, `svg-text-alternative-present` |
| `rgaa-4.1.2-1.2` | Chaque image de décoration est-elle correctement ignorée par les technologies d’assistance ? | `image-redundant-alt`, `rgaa-canvas-decorative-aria-hidden`, `rgaa-canvas-role-img`, `rgaa-embed-image-role-img`, `rgaa-img-decorative-no-alternative`, `rgaa-img-no-alt-decorative`, `rgaa-object-embed-decorative-aria-hidden`, `rgaa-object-image-role-img`, `rgaa-svg-decorative-aria-hidden`, `rgaa-svg-hidden-no-alternative`, `svg-text-alternative-quality` |
| `rgaa-4.1.2-1.3` | Pour chaque image porteuse d’information ayant une alternative textuelle, cette alternative est-elle pertinente (hors cas particuliers) ? | `area-alt-quality`, `canvas-text-alternative-quality`, `embed-text-alternative-quality`, `image-redundant-alt`, `img-alt-quality`, `input-image-alt-decorative`, `input-image-alt-present`, `input-image-alt-quality`, `object-text-alternative-quality`, `rgaa-image-alt-long`, `rgaa-img-decorative-no-alternative`, `svg-text-alternative-quality` |
| `rgaa-4.1.2-1.4` | Pour chaque image utilisée comme CAPTCHA ou comme image-test, ayant une alternative textuelle, cette alternative permet-elle d’identifier la nature et la fonction de l’image ? | `rgaa-captcha-review` |
| `rgaa-4.1.2-1.5` | Pour chaque image utilisée comme CAPTCHA, une solution d’accès alternatif au contenu ou à la fonction du CAPTCHA est-elle présente ? | `rgaa-captcha-review` |
| `rgaa-4.1.2-1.6` | Chaque image porteuse d’information a-t-elle, si nécessaire, une description détaillée ? | `rgaa-img-describedby-target` |
| `rgaa-4.1.2-1.8` | Chaque image texte porteuse d’information, en l’absence d’un mécanisme de remplacement, doit si possible être remplacée par du texte stylé. Cette règle est-elle respectée (hors cas particuliers) ? | `image-of-text`, `rgaa-text-image-review` |
| `rgaa-4.1.2-1.9` | Chaque légende d’image est-elle, si nécessaire, correctement reliée à l’image correspondante ? | `rgaa-figure-caption-structure` |
| `rgaa-4.1.2-10.1` | Dans le site web, des feuilles de styles sont-elles utilisées pour contrôler la présentation de l’information ? | `rgaa-letters-spaced-with-spaces`, `rgaa-presentational-attributes-absent`, `rgaa-presentational-elements-absent` |
| `rgaa-4.1.2-10.12` | Dans chaque page web, les propriétés d’espacement du texte peuvent-elles être redéfinies par l’utilisateur sans perte de contenu ou de fonctionnalité (hors cas particuliers) ? | `avoid-inline-spacing`, `text-spacing-content-loss` |
| `rgaa-4.1.2-10.13` | Dans chaque page web, les contenus additionnels apparaissant à la prise de focus ou au survol d’un composant d’interface sont-ils contrôlables par l’utilisateur (hors cas particuliers) ? | `rgaa-tooltip-review` |
| `rgaa-4.1.2-10.4` | Dans chaque page web, le texte reste-t-il lisible lorsque la taille des caractères est augmentée jusqu’à 200 %, au moins (hors cas particuliers) ? | `rgaa-viewport-zoom-review` |
| `rgaa-4.1.2-10.5` | Dans chaque page web, les déclarations CSS de couleurs de fond d’élément et de police sont-elles correctement utilisées ? | `rgaa-css-colors-paired` |
| `rgaa-4.1.2-10.6` | Dans chaque page web, chaque lien dont la nature n’est pas évidente est-il visible par rapport au texte environnant ? | `link-in-text-block`, `rgaa-link-state-colors-review` |
| `rgaa-4.1.2-10.7` | Dans chaque page web, pour chaque élément recevant le focus, la prise de focus est-elle visible ? | `css-focus-indicator-suppressed`, `css-hidden-focus`, `manual-review`, `rgaa-focus-indicator-contrast` |
| `rgaa-4.1.2-10.8` | Pour chaque page web, les contenus cachés ont-ils vocation à être ignorés par les technologies d’assistance ? | `aria-hidden-body`, `aria-hidden-focus`, `rgaa-aria-hidden-text-review` |
| `rgaa-4.1.2-10.9` | Dans chaque page web, l’information ne doit pas être donnée uniquement par la forme, taille ou position. Cette règle est-elle respectée ? | `rgaa-current-item-review` |
| `rgaa-4.1.2-11.1` | Chaque champ de formulaire a-t-il une étiquette ? | `form-control-label-quality`, `form-control-programmatic-label-quality`, `option-name-present`, `rgaa-field-hidden-label-review`, `rgaa-field-label-listed-source`, `rgaa-label-for-target-valid` |
| `rgaa-4.1.2-11.10` | Dans chaque formulaire, le contrôle de saisie est-il utilisé de manière pertinente (hors cas particuliers) ? | `invalid-field-error-message`, `rgaa-required-field-indication` |
| `rgaa-4.1.2-11.11` | Dans chaque formulaire, le contrôle de saisie est-il accompagné, si nécessaire, de suggestions facilitant la correction des erreurs de saisie ? | `rgaa-format-hint-review` |
| `rgaa-4.1.2-11.12` | Pour chaque formulaire qui modifie ou supprime des données, ou qui transmet des réponses à un test ou à un examen, ou dont la validation a des conséquences financières ou juridiques, les données saisies peuvent-elles être modifiées, mises à jour ou récupérées par l’utilisateur ? | `rgaa-consequential-form-review` |
| `rgaa-4.1.2-11.13` | La finalité d’un champ de saisie peut-elle être déduite pour faciliter le remplissage automatique des champs avec les données de l’utilisateur ? | `rgaa-autocomplete-user-field` |
| `rgaa-4.1.2-11.2` | Chaque étiquette associée à un champ de formulaire est-elle pertinente (hors cas particuliers) ? | `form-control-label-quality`, `form-control-programmatic-label-quality`, `rgaa-field-label-in-name-sources`, `rgaa-title-placeholder-identical` |
| `rgaa-4.1.2-11.3` | Dans chaque formulaire, chaque étiquette associée à un champ de formulaire ayant la même fonction et répétée plusieurs fois dans une même page ou dans un ensemble de pages est-elle cohérente ? | `rgaa-field-label-consistency-review` |
| `rgaa-4.1.2-11.4` | Dans chaque formulaire, chaque étiquette de champ et son champ associé sont-ils accolés (hors cas particuliers) ? | `rgaa-label-placement-review` |
| `rgaa-4.1.2-11.5` | Dans chaque formulaire, les champs de même nature sont-ils regroupés, si nécessaire ? | `rgaa-radio-group-present`, `rgaa-same-name-checkboxes-review` |
| `rgaa-4.1.2-11.6` | Dans chaque formulaire, chaque regroupement de champs de même nature a-t-il une légende ? | `aria-role-name-present`, `rgaa-field-group-legend` |
| `rgaa-4.1.2-11.7` | Dans chaque formulaire, chaque légende associée à un regroupement de champs de même nature est-elle pertinente ? | `rgaa-legend-relevance-review` |
| `rgaa-4.1.2-11.8` | Dans chaque formulaire, les items de même nature d’une liste de choix sont-ils regroupés de manière pertinente ? | `rgaa-listbox-option-groups-absent`, `rgaa-optgroup-label-not-empty`, `rgaa-optgroup-label-present`, `rgaa-select-fake-groups-review` |
| `rgaa-4.1.2-11.9` | Dans chaque formulaire, l’intitulé de chaque bouton est-il pertinent (hors cas particuliers) ? | `rgaa-form-button-label-in-name-sources`, `rgaa-form-button-name-present` |
| `rgaa-4.1.2-12.1` | Chaque ensemble de pages dispose-t-il de deux systèmes de navigation différents, au moins (hors cas particuliers) ? | `rgaa-navigation-systems-review` |
| `rgaa-4.1.2-12.6` | Les zones de regroupement de contenus présentes dans plusieurs pages web (zones d’en-tête, de navigation principale, de contenu principal, de pied de page et de moteur de recherche) peuvent-elles être atteintes ou évitées ? | `rgaa-page-zones-reachable` |
| `rgaa-4.1.2-12.7` | Dans chaque page web, un lien d’évitement ou d’accès rapide à la zone de contenu principal est-il présent (hors cas particuliers) ? | `rgaa-skip-link-placement`, `rgaa-skip-link-present`, `skip-link` |
| `rgaa-4.1.2-12.8` | Dans chaque page web, l’ordre de tabulation est-il cohérent ? | `manual-review`, `rgaa-modal-tab-order`, `tabindex` |
| `rgaa-4.1.2-12.9` | Dans chaque page web, la navigation ne doit pas contenir de piège au clavier. Cette règle est-elle respectée ? | `manual-review` |
| `rgaa-4.1.2-13.1` | Pour chaque page web, l’utilisateur a-t-il le contrôle de chaque limite de temps modifiant le contenu (hors cas particuliers) ? | `rgaa-embedded-refresh-review`, `rgaa-meta-redirect-immediate`, `rgaa-meta-refresh-no-url-timing`, `rgaa-script-redirect-review` |
| `rgaa-4.1.2-13.3` | Dans chaque page web, chaque document bureautique en téléchargement possède-t-il, si nécessaire, une version accessible (hors cas particuliers) ? | `rgaa-office-document-link` |
| `rgaa-4.1.2-13.5` | Dans chaque page web, chaque contenu cryptique (art ASCII, émoticône, syntaxe cryptique) a-t-il une alternative ? | `rgaa-cryptic-content-review` |
| `rgaa-4.1.2-13.8` | Dans chaque page web, chaque contenu en mouvement ou clignotant est-il contrôlable par l’utilisateur ? | `rgaa-moving-content-review` |
| `rgaa-4.1.2-13.9` | Dans chaque page web, le contenu proposé est-il consultable quelle que soit l’orientation de l’écran (portrait ou paysage) (hors cas particuliers) ? | `css-orientation-lock`, `rgaa-orientation-content-parity` |
| `rgaa-4.1.2-2.1` | Chaque cadre a-t-il un titre de cadre ? | `rgaa-frame-title-attribute-present` |
| `rgaa-4.1.2-2.2` | Pour chaque cadre ayant un titre de cadre, ce titre de cadre est-il pertinent ? | `rgaa-frame-title-relevant` |
| `rgaa-4.1.2-3.1` | Dans chaque page web, l’information ne doit pas être donnée uniquement par la couleur. Cette règle est-elle respectée ? | `rgaa-color-reference-review` |
| `rgaa-4.1.2-3.2` | Dans chaque page web, le contraste entre la couleur du texte et la couleur de son arrière-plan est-il suffisamment élevé (hors cas particuliers) ? | `contrast-computable`, `rgaa-contrast-minimum` |
| `rgaa-4.1.2-4.1` | Chaque média temporel pré-enregistré a-t-il, si nécessaire, une transcription textuelle ou une audiodescription (hors cas particuliers) ? | `rgaa-embedded-player-review`, `rgaa-media-transcript-adjacent` |
| `rgaa-4.1.2-4.10` | Chaque son déclenché automatiquement est-il contrôlable par l’utilisateur ? | `no-autoplay-audio`, `rgaa-embedded-player-review` |
| `rgaa-4.1.2-4.11` | La consultation de chaque média temporel est-elle, si nécessaire, contrôlable par le clavier et tout dispositif de pointage ? | `rgaa-embedded-player-review`, `rgaa-moving-content-review` |
| `rgaa-4.1.2-4.13` | Chaque média temporel et non temporel est-il compatible avec les technologies d’assistance (hors cas particuliers) ? | `rgaa-embedded-player-review` |
| `rgaa-4.1.2-4.3` | Chaque média temporel synchronisé pré-enregistré a-t-il, si nécessaire, des sous-titres synchronisés (hors cas particuliers) ? | `rgaa-embedded-player-review`, `rgaa-video-captions-track-kind`, `video-caption` |
| `rgaa-4.1.2-4.4` | Pour chaque média temporel synchronisé pré-enregistré ayant des sous-titres synchronisés, ces sous-titres sont-ils pertinents ? | `video-caption` |
| `rgaa-4.1.2-4.5` | Chaque média temporel pré-enregistré a-t-il, si nécessaire, une audiodescription synchronisée (hors cas particuliers) ? | `rgaa-embedded-player-review` |
| `rgaa-4.1.2-4.7` | Chaque média temporel est-il clairement identifiable (hors cas particuliers) ? | `rgaa-embedded-player-review` |
| `rgaa-4.1.2-5.1` | Chaque tableau de données complexe a-t-il un résumé ? | `rgaa-complex-table-summary` |
| `rgaa-4.1.2-5.2` | Pour chaque tableau de données complexe ayant un résumé, celui-ci est-il pertinent ? | `rgaa-complex-table-summary-quality` |
| `rgaa-4.1.2-5.3` | Pour chaque tableau de mise en forme, le contenu linéarisé reste-t-il compréhensible ? | `rgaa-data-table-headers-review` |
| `rgaa-4.1.2-5.4` | Pour chaque tableau de données ayant un titre, le titre est-il correctement associé au tableau de données ? | `rgaa-table-title-adjacent`, `table-fake-caption` |
| `rgaa-4.1.2-5.6` | Pour chaque tableau de données, chaque en-tête de colonne et chaque en-tête de ligne sont-ils correctement déclarés ? | `rgaa-data-table-headers-review`, `rgaa-layout-table-no-data-markup` |
| `rgaa-4.1.2-5.7` | Pour chaque tableau de données, la technique appropriée permettant d’associer chaque cellule avec ses en-têtes est-elle utilisée (hors cas particuliers) ? | `rgaa-th-association-present`, `rgaa-th-scope-row-col`, `table-headers-attr-valid` |
| `rgaa-4.1.2-5.8` | Chaque tableau de mise en forme ne doit pas utiliser d’éléments propres aux tableaux de données. Cette règle est-elle respectée ? | `rgaa-layout-table-no-data-markup` |
| `rgaa-4.1.2-6.1` | Chaque lien est-il explicite (hors cas particuliers) ? | `identical-links-same-purpose`, `link-name-quality`, `rgaa-link-context-review`, `rgaa-link-label-in-name-sources`, `rgaa-link-title-content-name` |
| `rgaa-4.1.2-6.2` | Dans chaque page web, chaque lien a-t-il un intitulé ? | `rgaa-link-content-label-present` |
| `rgaa-4.1.2-7.1` | Chaque script est-il, si nécessaire, compatible avec les technologies d’assistance ? | `aria-expanded-state-mismatch`, `aria-role-name-present`, `dialog-name-present`, `menuitem-name-present`, `rgaa-script-button-name-present`, `rgaa-scripted-components-review`, `rgaa-widget-label-in-name`, `tab-name-present`, `treeitem-name-present` |
| `rgaa-4.1.2-7.2` | Pour chaque script ayant une alternative, cette alternative est-elle pertinente ? | `rgaa-noscript-alternative-review` |
| `rgaa-4.1.2-7.3` | Chaque script est-il contrôlable par le clavier et par tout dispositif de pointage (hors cas particuliers) ? | `click-handler-keyboard-operable`, `focus-not-removed-by-script`, `mouse-only-event-handlers`, `rgaa-keyboard-only-event-handlers`, `widget-keyboard-focusable` |
| `rgaa-4.1.2-7.4` | Pour chaque script qui initie un changement de contexte, l’utilisateur est-il averti ou en a-t-il le contrôle ? | `rgaa-context-change-review` |
| `rgaa-4.1.2-7.5` | Dans chaque page web, les messages de statut sont-ils correctement restitués par les technologies d’assistance ? | `live-region-announcements`, `rgaa-status-message-review` |
| `rgaa-4.1.2-8.1` | Chaque page web est-elle définie par un type de document ? | `rgaa-doctype-position`, `rgaa-doctype-present`, `rgaa-doctype-valid` |
| `rgaa-4.1.2-8.10` | Dans chaque page web, les changements du sens de lecture sont-ils signalés ? | `rgaa-dir-attribute-valid`, `rgaa-text-direction-marked` |
| `rgaa-4.1.2-8.2` | Pour chaque page web, le code source généré est-il valide selon le type de document spécifié ? | `duplicate-id`, `rgaa-aria-attribute-conformance`, `rgaa-aria-role-conformance`, `rgaa-html-elements-attributes-valid`, `rgaa-html-nesting-valid`, `rgaa-markup-validation-review` |
| `rgaa-4.1.2-8.3` | Dans chaque page web, la langue par défaut est-elle présente ? | `rgaa-page-language-present` |
| `rgaa-4.1.2-8.4` | Pour chaque page web ayant une langue par défaut, le code de langue est-il pertinent ? | `html-xml-lang-mismatch`, `rgaa-default-language-review`, `rgaa-html-lang-code-valid`, `rgaa-valid-lang` |
| `rgaa-4.1.2-8.5` | Chaque page web a-t-elle un titre de page ? | `page-title-present` |
| `rgaa-4.1.2-8.6` | Pour chaque page web ayant un titre de page, ce titre est-il pertinent ? | `page-title-patterns`, `rgaa-page-title-unique` |
| `rgaa-4.1.2-8.7` | Dans chaque page web, chaque changement de langue est-il indiqué dans le code source (hors cas particuliers) ? | `rgaa-language-change-review` |
| `rgaa-4.1.2-8.8` | Dans chaque page web, le code de langue de chaque changement de langue est-il valide et pertinent ? | `rgaa-valid-lang` |
| `rgaa-4.1.2-8.9` | Dans chaque page web, les balises ne doivent pas être utilisées uniquement à des fins de présentation. Cette règle est-elle respectée ? | `rgaa-markup-for-presentation` |
| `rgaa-4.1.2-9.1` | Dans chaque page web, l’information est-elle structurée par l’utilisation appropriée de titres ? | `heading-order`, `heading-quality`, `p-as-heading`, `rgaa-heading-content-present`, `rgaa-heading-role-level-present`, `rgaa-headings-absent-review` |
| `rgaa-4.1.2-9.2` | Dans chaque page web, la structure du document est-elle cohérente (hors cas particuliers) ? | `rgaa-main-element-structure` |
| `rgaa-4.1.2-9.3` | Dans chaque page web, chaque liste est-elle correctement structurée ? | `definition-list-children-valid`, `dlitem-parent-valid`, `list-children-valid`, `listitem-parent-valid`, `rgaa-aria-list-item-roles`, `rgaa-fake-list` |
| `rgaa-4.1.2-9.4` | Dans chaque page web, chaque citation est-elle correctement indiquée ? | `rgaa-quotation-review` |

## Rule reference

Every atomic rule, alphabetically. "Applies to" is the rule's precondition (when it returns `notApplicable`), and "Expectation" is the condition it decides once it does apply.

### `rgaa-area-alt-source`

**Linked image-map areas are named by alt or aria-label**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that each linked &lt;area&gt; of a used image map takes its text alternative from alt or aria-label, the two sources RGAA accepts, not only from title or aria-labelledby.

**Applies to.** Applies to &lt;area href&gt; elements in a &lt;map&gt; that an &lt;img usemap&gt; references, when the &lt;img&gt; is rendered, and that carry at least one non-empty name source: alt, aria-label, aria-labelledby or title. An &lt;area&gt; with none is left to area-alt-present. An &lt;area&gt; hidden from assistive technologies (aria-hidden="true") is left out. A page with none is notApplicable.

**Expectation.** The &lt;area&gt; has a non-empty alt or aria-label, the two sources RGAA 1.1.2 step 3 lists (the glossary entry "Alternative textuelle (image)" gives no aria-labelledby or title source for &lt;area&gt;). An &lt;area&gt; named only by title or aria-labelledby fails. A linked &lt;area&gt; always carries information: a decorative one has no href (1.2.2).

### `rgaa-aria-attribute-conformance`

**aria-* attributes are valid for the W3C validator**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks, hidden content included, that every aria-* attribute is one the W3C validator knows, has a valid value, is allowed on its element and role, and does not contradict a native attribute, and that roles carry the attributes the validator requires.

**Applies to.** Applies to every element in the scan scope that has an aria-* attribute, or a role whose required state or property the validator checks, hidden content included: RGAA 8.2.1 judges the generated source code (« le code source généré de la page »), and the W3C validator named by its methodology checks hidden markup as well. A page with neither is notApplicable.

**Expectation.**

Each aria-* attribute passes the W3C validator (Nu HTML Checker), which RGAA 8.2.1 step 1 names: attributes and their values respect the writing rules (« Les balises, attributs et valeurs d'attributs respectent les règles d'écriture »). The rule fails where the validator reports an error:

- `unknownAttribute`: an aria-* name the validator does not know (aria-labeledby, aria-foo);
- `invalidValue`: a value that does not fit the attribute: an empty or misspelt token (aria-expanded="", aria-hidden="TRUE"), an integer out of range (aria-level="0", aria-setsize="-2"), an ID reference made only of whitespace, or an aria-activedescendant that points to no element of the page;
- `attributeNotAllowed`: an attribute the element's role does not support: aria-pressed on a link, aria-sort on a &lt;td&gt;, aria-expanded on the &lt;summary&gt; of a &lt;details&gt;, any aria-* on &lt;input type="hidden"&gt;;
- `namingProhibited`: aria-label, aria-labelledby or aria-braillelabel on an element whose role cannot be named (a &lt;div&gt;, &lt;span&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;code&gt; or &lt;caption&gt; with no role, even inside a button);
- `nativeCheckedConflict`: aria-checked on &lt;input type="checkbox"&gt; or &lt;input type="radio"&gt;, whatever its value;
- `nativeAttributeConflict`: an ARIA state that contradicts a native attribute (aria-disabled other than "true" with disabled, likewise aria-required with required, aria-readonly with readonly, aria-hidden with hidden), aria-placeholder with placeholder, aria-hidden on &lt;html&gt;, aria-hidden="true" on &lt;body&gt;;
- `missingRequired`: a role without the state or property the validator requires for it, even where WAI-ARIA gives a default value: role="heading" without aria-level, role="combobox" without aria-expanded, role="checkbox", "radio", "switch", "menuitemcheckbox" or "menuitemradio" without aria-checked, role="slider", "scrollbar" or "meter" without aria-valuenow.

It asks (cantTell) in two cases:

- `emptyIdReference`: an ID-reference attribute (aria-labelledby, aria-describedby, aria-controls, aria-owns, aria-flowto, aria-details, aria-errormessage, aria-activedescendant) whose value is the empty string. The validator reports it, but ARIA element reflection (el.ariaLabelledByElements = [...] and the like) writes exactly that: an empty attribute, with the reference kept in the DOM property, which can point across a shadow boundary. Chromium does so. Whether the relation is exposed is read in the accessibility tree;
- `idReferenceOtherTree`: an

aria-activedescendant whose id names no element in its own tree (the document, or the shadow root the element sits in) but names one in another tree of the page: the document from inside a shadow root, or a shadow root from the document. ID references do not cross a shadow boundary, yet the validator asks only that the attribute « refer to an element in the same document », which that element is; whether the id is meant for it is for a person. An id found in no tree of the page fails (invalidValue).

### `rgaa-aria-hidden-text-review`

**Visible text hidden from assistive technologies is meant to be ignored**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each element with aria-hidden="true" that holds visible text of two words or more, for a person to check that the text is given to assistive technologies otherwise or is meant to be ignored.

**Applies to.** Applies to each outermost element with aria-hidden="true" that holds visible text of two words or more (letters, not only signs or icon glyphs). The whole page hidden (on &lt;html&gt; or &lt;body&gt;) is left to aria-hidden-body. A page with none is notApplicable.

**Expectation.** RGAA 10.8.1: each hidden content « a vocation à être ignoré par les technologies d'assistance », or is made available to them by a user action. Its technical note: a content with aria-hidden="true" « ne sera donc plus vocalisable, mais restera visible ». Visible text a sighted user reads but a screen reader user never hears is fine when it repeats text given to them otherwise (a screen-reader-only copy, a label), and fails 10.8.1 when it is the only place the information is. Only a person can tell, so each such element is asked about (visibleTextHidden).

### `rgaa-aria-list-item-roles`

**ARIA lists use role="listitem" for their items**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that the children of an element with role="list" have role="listitem", which RGAA requires of a list built with ARIA.

**Applies to.** Applies to every element other than &lt;ul&gt; and &lt;ol&gt; whose role attribute makes it a list (first token "list") and that has at least one child element other than &lt;script&gt; and &lt;template&gt;. Lists hidden by the default hidden-content policy are not checked. A page with none is notApplicable.

**Expectation.** Every child element has role="listitem". RGAA 9.3.1 and 9.3.2 accept a list built with &lt;ul&gt; or &lt;ol&gt; and &lt;li&gt;, or with role="list" and role="listitem" (step 2). A role="list" whose items are &lt;li&gt; elements without role="listitem", or other elements, is neither. Such a list is asked about (cantTell), never failed: 9.3.1 and 9.3.2 judge information "regroupées visuellement sous forme de liste", which is visual. A list whose children all have role="listitem" passes. Each finding is filed under one test: a list whose items are numbered (a numeric list-style-type, a CSS counter, or a text starting with a number) reads as an ordered list, under 9.3.2 (the `…Ordered` codes); any other under 9.3.1.

### `rgaa-aria-role-conformance`

**Role attributes are valid for the W3C validator**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks, hidden content included, that every role attribute holds roles the W3C validator accepts, that the role is allowed on its element, and that an &lt;img&gt; with a role has a non-empty alt or an ARIA name.

**Applies to.** Applies to every element with a role attribute in the scan scope, hidden content included: RGAA 8.2.1 judges the generated source code (« le code source généré de la page »), and the W3C validator named by its methodology checks hidden markup as well. A page with no role attribute is notApplicable.

**Expectation.**

Each role attribute passes the W3C validator (Nu HTML Checker), which RGAA 8.2.1 step 1 names: its value respects the writing rules (« Les balises, attributs et valeurs d'attributs respectent les règles d'écriture »). The rule fails where the validator reports an error:

- `emptyRole`: the attribute holds no token;
- `unknownRoleToken`: a token that is not a role the validator accepts, alone or in a list: a misspelling, an abstract role (widget, landmark), a token written with capitals (BUTTON), or a role the validator rejects (generic, mark, comment, suggestion, doc-pageheader, doc-pagefooter);
- `roleNotAllowed`: the first recognised token is a role ARIA in HTML does not allow on this element (a tab on &lt;nav&gt;, a navigation on &lt;main&gt;, any role on a &lt;td&gt; in a native table, on the &lt;summary&gt; of a &lt;details&gt;, on &lt;caption&gt;, on &lt;input type="hidden"&gt;, or a role other than listitem on an &lt;li&gt; in a list);
- `imgRoleEmptyAlt`: an &lt;img&gt; with a role other than presentation or none and alt="";
- `imgRoleNoName`: an &lt;img&gt; with a role other than presentation or none and no alt, aria-label or aria-labelledby attribute;
- `imgPresentationRole`: an &lt;img&gt; with role="presentation" or role="none" and no alt, aria-label or aria-labelledby attribute: HTML requires alt on an &lt;img&gt;, and the role does not replace it.

An &lt;img&gt; with role="presentation" or role="none" and alt="" passes, though the validator reports an error there: RGAA 1.2.1 names role="presentation" on an &lt;img&gt; as a way to mark a decorative image, and ARIA in HTML allows both roles with alt="". The pack judges role="none", its synonym, the same way.

### `rgaa-autocomplete-user-field`

**Fields about the user have a valid autocomplete value**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks the autocomplete value of each field that may concern the user: fails a malformed value naming a user field, and asks about personal-data fields without a valid one.

**Applies to.** Applies to the &lt;input&gt;, &lt;select&gt; and &lt;textarea&gt; fields that take a value (not disabled, not of type hidden, button, checkbox, file, image, radio, reset or submit), outside search forms, that may concern the user: the author gave them an autocomplete value, or they look like personal data (type email, tel or password, or a label, name, id or placeholder naming a name, an address, a telephone, an email, a birth date, an identifier or a password). Content hidden with CSS or the hidden attribute is left out. A page with none is notApplicable.

**Expectation.**

RGAA 11.13.1 applies to each field « dont l'objet se rapporte à une information concernant l'utilisateur », and asks for an autocomplete attribute whose value is in the list of the glossary « Liste des valeurs de l'attribut autocomplete » (on and off are not in it):

- fails a value that names a field of that list (email, tel, postal-code…) but is not well formed (« email home », « work photo »): the author says the field is about the user, and the browser cannot use the value;
- asks (cantTell) about a field that looks like personal data with no autocomplete, on, off, or a value naming no field of the list: only a person can say whether the information concerns the user (an email to send a page to a friend does not);
- passes a well-formed value. Whether it suits the field is the relevance condition of 11.13.1, which a person judges.

A field with an invalid value that does not look like personal data (autocomplete="nope" on a filter) is not about the user, so 11.13 does not apply to it.

### `rgaa-canvas-decorative-aria-hidden`

**Decorative &lt;canvas&gt; images have aria-hidden="true" and no alternative**

automatic · no formal WCAG SC mapping · confidence medium · default severity minor

Checks that a &lt;canvas&gt; marked decorative has aria-hidden="true", no aria-labelledby, aria-label or title, and no alternative content inside it.

**Applies to.** Applies to &lt;canvas&gt; elements marked decorative: with aria-hidden="true" on the element, or with role="none"/"presentation". A &lt;canvas&gt; inside a &lt;figure&gt; that has a &lt;figcaption&gt; is left out: criterion 1.2 does not apply to an image with a caption (légende). Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

RGAA 1.2.5: a decorative &lt;canvas&gt; has aria-hidden="true", no aria-labelledby, aria-label or title, no text alternative on its children, and no text between &lt;canvas&gt; and &lt;/canvas&gt;. Fails:

- aria-hidden="true" with any of those alternatives. If the canvas is decorative, it breaks 1.2.5; if it carries information, hiding it breaks 1.1.8. Either way the page fails;
- role="none"/"presentation" without aria-hidden="true", and no fallback content. The role shows the author meant the image as decorative, and RGAA asks for aria-hidden="true" there; if it carries information after all, it has no alternative and fails 1.1.8.

Asks (cantTell): role="none"/"presentation" without aria-hidden="true" but with fallback content. If the canvas carries information, that content is its alternative and 1.1.8 passes; if it is decorative, it breaks 1.2.5.

### `rgaa-canvas-role-img`

**&lt;canvas&gt; images have role="img" with an ARIA name, or fallback content**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks each &lt;canvas&gt; against RGAA 1.1.8: role="img" named by aria-labelledby or aria-label, or fallback content, or a link or button to an alternative content right after it.

**Applies to.** Applies to &lt;canvas&gt; elements. One with aria-hidden="true", on itself or an ancestor, or with role="none"/"presentation", is left out: it is marked decorative, which rgaa-canvas-decorative-aria-hidden checks (1.2.5). A canvas 0 px wide or high, rendered or by its width or height attribute, draws nothing and is no image, so it is left out too. One that is the only content of a link or a button is left out: its alternative is the control's name, which the glossary « Image porteuse d'information » (notes 1 and 2) sends to Links (6.1), Forms (11.9) or Scripts (7.1). Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

RGAA 1.1.8 passes when one of these holds:

- the &lt;canvas&gt; has role="img" and a text alternative from aria-labelledby or aria-label (steps 3 and 4);
- otherwise, alternative content sits between &lt;canvas&gt; and &lt;/canvas&gt;, or a link or button right after it gives access to an alternative content, or a mechanism replaces it (step 6).

Passes: role="img" with aria-labelledby or aria-label; or, without role="img", fallback content (text, or an element with alt or aria-label text). Fails:

- role="img" with no aria-labelledby or aria-label. The methodology's note is explicit: "si l'élément &lt;canvas&gt; dispose d'un rôle img, son alternative ne peut être fournie que par les techniques listées à l'étape 4", so fallback content, title and an adjacent link do not count;
- no role="img", an aria-label, aria-labelledby or title, but no fallback content and no link or button after it (the name alone is not one of the step 6 options);
- nothing at all, on a canvas that certainly carries information: a captioned canvas, or one that takes focus.

Asks (cantTell) about any other canvas with nothing at all (noAlternativeMayBeDecorative): it may be decorative, and then it fails 1.2.5 instead, which asks for aria-hidden="true". Asks (cantTell): no role="img" and no fallback content, but a link or button right after the &lt;canvas&gt; (does it lead to an alternative content?).

### `rgaa-captcha-review`

**CAPTCHA images have a relevant alternative and a non-graphic way in**

manual · no formal WCAG SC mapping · confidence high · default severity serious

Flags CAPTCHA images and reCAPTCHA or hCaptcha widgets, for a person to check that the alternative says what the CAPTCHA is and does, and that a non-graphic CAPTCHA or another way to the function is offered.

**Applies to.** Applies to visible CAPTCHAs (glossary « CAPTCHA »): an image (&lt;img&gt;, &lt;area&gt;, &lt;input type="image"&gt;, &lt;svg&gt;, &lt;canvas&gt;, an image &lt;object&gt; or &lt;embed&gt;, role="img") whose alternative, file name, id, class or name says captcha; and a reCAPTCHA or hCaptcha widget (its frame, or the element the service fills). A page with none is notApplicable.

**Expectation.** RGAA 1.4: the alternative of an image used as a CAPTCHA « permet d’identifier la nature et la fonction de l’image ». RGAA 1.5: for each image used as a CAPTCHA, « il existe une autre forme de CAPTCHA non graphique, au moins » or « une autre solution d’accès à la fonctionnalité ». Both are for a person, so each CAPTCHA is asked about (imageCaptcha, under 1.4 and 1.5; captchaWidget, whose images come from another site, under 1.5), one occurrence per element.

### `rgaa-color-reference-review`

**Text that refers to a colour does not give the information by colour alone**

manual · no formal WCAG SC mapping · confidence high · default severity minor

Flags text that indicates something by a colour (« indiqués en rouge », « shown in green »), for a person to check that the information is also given another way.

**Applies to.** Applies to visible text that indicates something by a colour: « les champs indiqués en rouge », « les cases en vert », « shown in red », « the green items ». A colour name alone (« un t-shirt rouge ») does not count: the colour must follow a verb such as indiquer, signaler, marquer, surligner, afficher, or come with a word for a part of the page (champ, case, ligne, élément, texte, field, item, row, text…). Text in code, scripts, styles and form controls is left out. A page with none is notApplicable.

**Expectation.** RGAA 3.1.2: « Pour chaque indication de couleur donnée par un texte, l’information ne doit pas être donnée uniquement par la couleur ». Each such text is asked about (colorReference), one occurrence per element: whether the same information is also given another way (a word, a sign, a shape) is for a person.

### `rgaa-complex-table-summary`

**Complex data tables have a summary**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a data table whose headers are not all in the first row or column, or head only a group of rows or columns, and that has no aria-describedby (nor, before HTML5, a summary attribute), for a person to check that a summary is available.

**Applies to.**

Applies to complex data tables, in RGAA's sense: tables whose header cells are not all in the first row or the first column, or whose headers do not apply to a whole row or column. A &lt;table&gt;, or an element with role="table" (5.1.1 step 1), counts as complex when:

- a header cell (&lt;th&gt;, role="columnheader" or role="rowheader") sits outside both the first row and the first column;
- a cell uses the headers attribute;
- a header has scope="rowgroup" or scope="colgroup"; or
- two or more first-row headers each span several columns (as in "2025" and "2026" over their quarters), or two or more first-column headers each span several rows, so each heads a group of columns or rows rather than whole ones.

Tables with role="presentation" or "none" are left out. A page with none is notApplicable. When every complex table has its summary marked (aria-describedby, or a summary attribute where it counts), the rule passes: whether that summary is good is rgaa-complex-table-summary-quality's question.

**Expectation.** A complex table without an aria-describedby that points to text (an id that names nothing, or an empty element, is no summary), and without a summary attribute where one still counts, is flagged for a person to check that a summary is available, as RGAA 5.1.1 asks: in the &lt;caption&gt;, or in a passage near the table. The summary attribute counts only on a &lt;table&gt; in a document whose doctype is not HTML5: 5.1.1 step 2 accepts it only "dans les versions de HTML et de XHTML antérieures à HTML 5". A document with no doctype is not HTML5. An ARIA table's summary comes only through aria-describedby.

### `rgaa-complex-table-summary-quality`

**Complex data table summaries are relevant**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a complex data table that has a summary (caption, aria-describedby, or before HTML5 a summary attribute), for a person to check that it explains the nature and structure of the table.

**Applies to.**

Applies to complex data tables that have a summary. Complex is decided as rgaa-complex-table-summary does for 5.1.1: a &lt;table&gt;, or an element with role="table", where

- a header cell (&lt;th&gt;, role="columnheader" or role="rowheader") sits outside both the first row and the first column;
- a cell uses the headers attribute;
- a header has scope="rowgroup" or scope="colgroup"; or
- two or more first-row headers each span several columns, or two or more first-column headers each span several rows.

Tables with role="presentation" or "none" are left out. The summary is what 5.1.1 step 2 accepts (5.2.1 step 1 refers to it):

- a &lt;caption&gt; with text, on a &lt;table&gt;;
- an aria-describedby that points to an element with text;
- a summary attribute with text on a &lt;table&gt;, only in a document whose doctype is not HTML5 (« dans les versions de HTML et de XHTML antérieures à HTML 5 »; glossary "Résumé (de tableau)"). A document with no doctype is not HTML5.

A page with no such table is notApplicable, including a simple table and an HTML5 table whose only summary is the summary attribute.

**Expectation.** Each complex table with a summary is asked about (cantTell): RGAA 5.2.1 asks whether the summary is relevant, that is whether it explains the nature and structure of the table. Only a person can tell, and a caption may hold only the table's title.

### `rgaa-consequential-form-review`

**Forms with financial, legal or data consequences can be checked, confirmed or undone**

manual · no formal WCAG SC mapping · confidence high · default severity serious

Flags payment, account deletion, cancellation, signature, password change and test forms, found by card fields or by their submit button, for a person to check that the data can be reviewed, confirmed or recovered.

**Applies to.**

Applies to visible forms that certainly have the consequences 11.12 names, found by narrow signals only:

- card fields (autocomplete cc-number, cc-csc, cc-exp…), a payment;
- a current-password and a new-password field together, a password change (a sign-up form has only the new one);
- a submit button whose whole label, amounts and arrows aside, is one of the French or English phrases apps use for paying or ordering, deleting or closing an account, cancelling a subscription, an order or a booking, signing, changing a password, or sending the answers of a test (« Payer », « Valider ma commande », « Supprimer mon compte », « Résilier mon abonnement », « Signer », « Place order », « Delete account »…).

Generic labels (« Valider », « Envoyer », « Confirmer », « Continuer », « Enregistrer », « Supprimer », « Annuler », Submit, Save, OK) and search forms are left out: they say nothing of the consequences. A page with none is notApplicable.

**Expectation.** RGAA 11.12.1: a form « qui modifie ou supprime des données, ou qui transmet des réponses à un test ou un examen, ou dont la validation a des conséquences financières ou juridiques » lets the user change or cancel the data afterwards, check and correct them before a multi-step form is submitted, or confirm explicitly (a checkbox or an extra step). 11.12.2: a form that changes or deletes financial, legal or personal data offers a way to get them back or an explicit confirmation. What happens after submitting is not in the page, so each such form is asked about once (payment, accountDeletion, cancellation, signature, passwordChange, testAnswers).

### `rgaa-context-change-review`

**A change of context from a field is announced first**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each form field whose inline handler submits a form or loads another page when its value changes, for a person to check that a text warns the user first.

**Applies to.** Applies to form fields (&lt;select&gt;, &lt;input&gt;, &lt;textarea&gt;) whose inline onchange, oninput or onblur handler submits a form, loads another address or opens a window (submit(), location, window.open). A page with none is notApplicable.

**Expectation.** RGAA 7.4.1: a script that starts a change of context passes when the user is warned by a text of what it does before it happens, or when a button or a link starts it. A field that navigates or submits as soon as its value changes is neither a button nor a link, so it passes only with that warning, which a person checks (fieldChangesContext).

### `rgaa-contrast-minimum`

**Text meets RGAA minimum color contrast**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that visible text has a contrast ratio of at least 4.5:1, or 3:1 for text of 24px or more and bold text of 18.5px or more (RGAA 3.2), when contrast is computable from CSS; asks about semi-bold text, text on a page with a contrast switch, and logo text.

**Applies to.** The same text as contrast-minimum: visible text that contrast-computable applies to, narrowed to text whose background and foreground are computable. Eligible text that is not computable leaves this rule notApplicable; contrast-computable asks about it.

**Expectation.** Every computable text node reaches the ratio RGAA 3.2 requires for its size: 3:1 for text of 24px or more (3.2.3), and for bold text (computed weight 700 or more) of 18.5px or more (3.2.4); 4.5:1 for everything else (3.2.1, 3.2.2). The only difference from contrast-minimum is the bold threshold, WCAG's 14pt being about 18.67px, and the three cases below, which it asks about.

**Margin.** `contrast-ratio`, in a ratio: the value must reach the threshold, and the result's `margin` names the element that came closest while meeting it.

### `rgaa-cryptic-content-review`

**Cryptic content has a title or is defined by its context**

manual · no formal WCAG SC mapping · confidence high · default severity minor

Flags text emoticons, emoji and ASCII art with no title, for a person to check that the text next to them says what they mean.

**Applies to.** Applies to visible cryptic content, as RGAA 13.5 lists it: text emoticons (« :-) », « ;) », « :D », « &lt;3 »), emoji, and ASCII art (a &lt;pre&gt; of three lines or more mostly made of signs). Content inside code (&lt;code&gt;, &lt;kbd&gt;, &lt;samp&gt;), hidden with aria-hidden="true", or given a name by role="img" with aria-label or aria-labelledby is left out. A page with none is notApplicable.

**Expectation.** RGAA 13.5.1: each cryptic content has « un attribut title » or « une définition est donnée par le contexte adjacent ». One with a title on itself or its parent passes (its relevance is 13.6.1's). Any other is asked about, one occurrence per element (emoticon, emoji, asciiArt): whether the text next to it defines it is for a person. Screen readers read an emoji by its Unicode name, which may not say what is meant.

### `rgaa-css-colors-paired`

**CSS text and background colors are declared together**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that a CSS text color reaching text comes with a background color, a background color with a text color, and a background image with a background color, at least on an ancestor (RGAA 10.5).

**Applies to.** Applies to a run over a whole document with rendered text that an author text color, background color or background image applies to: declared on the text's element or one of its ancestors, in a readable style sheet, a style attribute or a presentational attribute (bgcolor, background, &lt;font color&gt;, &lt;body text&gt;). A page whose text no author color reaches is notApplicable.

**Expectation.**

RGAA 10.5: each declaration of a text color (color) on an element that can hold text comes with a background color (background, background-color), at least on an ancestor (10.5.1); each background color comes with a text color the same way (10.5.2); and each background image comes with a background color (10.5.3).

- For each rendered text, the nearest element declaring a text color, a background color and a background image are looked for, from the text's element up to &lt;html&gt;. A text color with no background color fails COLOR_WITHOUT_BACKGROUND, and a background image with no background color BACKGROUND_IMAGE_WITHOUT_COLOR. A background color with no text color is asked about (BACKGROUND_WITHOUT_COLOR): 10.5.2's test asks for the color property, but its methodology only for « une valeur calculée pour la propriété color », which the browser's default gives. One occurrence per element that declares the unpaired color, however much text it reaches.
- Without a browser's cascade layers (jsdom), a style sheet that cannot be read (another origin's, with no text given in engineOptions.styleSheetTexts) may declare the missing half: the same findings are asked about instead of failed. In a browser the cascade applies such a sheet, so it counts like any other.
- It passes when every color that reaches text is paired.

### `rgaa-current-item-review`

**The active item of a menu is not shown by its look alone**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each navigation link marked current by a class only, with no aria-current and no text that says so, for a person to check how the active page is told.

**Applies to.** Applies to links inside a navigation (&lt;nav&gt;, role="navigation" or role="menubar") that are marked as the current one by a class (active, current, selected, is-active…, on the link or its list item), with no aria-current on them and no text inside that says so. A page with none is notApplicable.

**Expectation.** RGAA 10.9.1: information is not given « uniquement par la forme, taille ou position », and the glossary « Indication donnée par la forme, la taille ou la position » gives as its first example « la présence d'un marqueur visuel, pour indiquer la page active dans un menu de navigation ». Such a link is asked about (currentByLookOnly): if the class shows the active page, it needs aria-current="page" or a text that says so.

### `rgaa-data-table-headers-review`

**Tables with no header cells are checked for unmarked headers**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a table of at least two rows and two columns with no &lt;th&gt; and no columnheader or rowheader role, or a table whose first row or column holds bold data cells, for a person to check whether headers should be marked up.

**Applies to.** Applies to a &lt;table&gt;, or an element with role="table", that has at least two rows and two columns and no header cell at all: no &lt;th&gt; (without another role) and no cell with role="columnheader" or role="rowheader". Tables with role="presentation" or "none" are left out, and so is a table with no text in its cells. A table that has headers, no spans, and a first row or first column (of two cells or more) whose cells are all bold data cells applies too.

**Expectation.** Each such table is asked about (cantTell). RGAA 5.6.1 and 5.6.2 want each header that applies to a whole column or row marked with &lt;th&gt; or a columnheader or rowheader role. A data table usually has headers in its first row or column, but only a person can tell whether this one does, or whether it is a layout table, which 5.3 and 5.8 cover. In a table with headers, a first row or column of bold data cells (&lt;strong&gt;, &lt;b&gt;, or a font weight of 600 or more) is asked about (BOLD_CELLS_MAY_BE_HEADERS): headers marked up as &lt;td&gt; fail 5.6.1 or 5.6.2.

### `rgaa-default-language-review`

**The page's default language code names its main language**

manual · no formal WCAG SC mapping · confidence high · default severity serious

Flags a page whose lang on &lt;html&gt; is und or mul, or whose text, guessed from its frequent words, is clearly in another language than lang says, for a person to check that the code gives the page's main language.

**Applies to.** Applies to a run over a whole document whose &lt;html&gt; element has a lang (or, failing that, xml:lang) whose language code is und or mul, or is one of the languages the rule can recognise (fr, en, es, pt, it, de, nl). A page with no default language, or an invalid one, is notApplicable here: rgaa-page-language-present (8.3.1) and rgaa-html-lang-code-valid (8.4.1, « valide ») judge it. So is a page in another language, and a run narrowed by contextSelector or engineOptions.fragment.

**Expectation.**

RGAA 8.4.1: « Pour chaque page web ayant une langue par défaut, le code de langue vérifie-t-il ces conditions ? Le code de langue est valide ; Le code de langue est pertinent », and the methodology reads pertinent as « qui indique la langue principale du document ». Two cases are asked about, on &lt;html&gt;:

- undeterminedLang: the code is und (undetermined) or mul (multiple languages). Both are valid ISO 639-2 codes, but neither names the page's main language, which may still be known.
- langMismatch: the page's own visible text (outside elements that carry their own lang, code, scripts and form controls) holds 50 words or more, and, by the share of frequent function words of each language, is clearly written in another language than the code says (lang="en" on a page of French text). A guess from words is not proof, so a person confirms.

### `rgaa-dir-attribute-valid`

**dir attributes are ltr or rtl**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that every dir attribute is ltr or rtl, the two values RGAA accepts, and fails one that turns text the wrong way.

**Applies to.** Applies to elements carrying a dir attribute. An element with dir="auto" applies only when its text (content, or the value of a text field) contains a strong character of the direction opposite to the one it inherits: RGAA 8.10.2 step 1 covers only the passages of 8.10.1, text that reads in the reverse direction of the document. A page with no applicable element is notApplicable.

**Expectation.** The value is ltr or rtl, in any case (RGAA 8.10.2: « La valeur de l'attribut dir est conforme (rtl ou ltr) »). Surrounding spaces are not ignored: HTML matches the keyword exactly, apart from case, so a browser ignores dir=" rtl ". dir="auto", which HTML allows, fails with its own reasonCode on reverse-direction text, since RGAA names only those two values. The relevance condition of the same test fails a dir that changes the direction on text whose letters all read in the old one (directionNotRelevant): dir="rtl" on French text. Other questions of relevance are left to a person.

### `rgaa-doctype-position`

**The doctype comes before the &lt;html&gt; tag**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a declared doctype comes before the &lt;html&gt; tag in the source, reading the page source given as the page.source probe when the parser has dropped it (RGAA 8.1.3).

**Applies to.** Applies to a run over a whole document that declares a doctype (RGAA 8.1.3: « possédant une déclaration de type de document »). A page whose source has none is notApplicable: rgaa-doctype-present fails it under 8.1.1. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable.

**Expectation.**

RGAA 8.1.3: the doctype comes before the &lt;html&gt; tag in the source.

- A doctype in the DOM passes: the HTML parser keeps one only when it comes before &lt;html&gt;, so the DOM settles it with no other input.
- With no doctype in the DOM, the source as the server sent it is needed, through the `page.source` probe: `{ url, start }`, start being the first 2,000 characters of the response body (the engine cuts longer probe strings). Comments are skipped. A doctype that comes after &lt;html&gt; fails (DOCTYPE_AFTER_HTML); a source with &lt;html&gt; and no doctype is notApplicable; a start that shows neither is asked about (SOURCE_TOO_SHORT).
- With no doctype in the DOM and no probe, the rule asks (SOURCE_MISSING): the doctype may be missing or misplaced.

### `rgaa-doctype-present`

**Page declares a doctype**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that the document has a doctype, written before the &lt;html&gt; element.

**Applies to.** Applies to a run over a whole document. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable: a subtree has no doctype of its own.

**Expectation.** The document has a doctype (RGAA 8.1.1). A doctype written after &lt;html&gt; is dropped by the HTML parser, so without the page's source it reads as missing here. With the `page.source` probe (the start of the response body, see rgaa-doctype-position), a doctype the source shows after &lt;html&gt; is present and passes: its place is 8.1.3's question, which rgaa-doctype-position fails.

### `rgaa-doctype-valid`

**Declared doctype is valid**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a declared doctype names a published HTML or XHTML document type: passes those it knows, fails one that cannot be valid, and asks about other public identifiers.

**Applies to.** Applies to a run over a whole document that declares a doctype. A page with no doctype is notApplicable here: rgaa-doctype-present fails it under RGAA 8.1.1. A run narrowed by contextSelector, or by engineOptions.fragment, is notApplicable: a subtree has no doctype of its own.

**Expectation.**

The doctype is valid (RGAA 8.1.2: « le type de document (balise doctype) est-il valide ? »). RGAA names no list of valid doctypes; its glossary « Type de document » is the reference data that tells user agents the page's languages, and RGAA itself treats HTML 4, XHTML 1.0, XHTML 1.1 and HTML5 as document types. The pack reads a doctype as valid when it is a well-formed declaration of a published document type that describes the page's language:

- it passes the HTML5 doctype (name html, no public identifier, and no system identifier or about:legacy-compat), and the public identifiers it knows: HTML 2.0, 3.2, 4.0 and 4.01 (Strict, Transitional, Frameset), ISO/IEC 15445:2000 HTML, XHTML 1.0 and 1.1, XHTML Basic 1.0 and 1.1, XHTML Mobile Profile 1.0 to 1.2, XHTML 1.1 plus MathML 2.0 (plus SVG 1.1), XHTML+RDFa 1.0 and 1.1, and HTML 4.01+RDFa 1.1, compared without regard to case;
- it fails (invalidDoctype) a doctype whose name is not html, which does not describe an HTML page (an svg or math doctype), and the HTML5 form with a system identifier other than about:legacy-compat;
- it asks (unknownPublicId) about any other public identifier, which may name an industry or later specification, or none.

### `rgaa-embed-image-role-img`

**Embedded images have role="img" and a text alternative**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks that each &lt;embed type="image/…"&gt; has role="img" and a text alternative (aria-labelledby, aria-label or title), or is followed by a link or button to an alternative content.

**Applies to.** Applies to &lt;embed&gt; elements whose type attribute starts with image/ (RGAA 1.1.7 covers "balise &lt;embed&gt; avec l'attribut type="image/…"" only; an &lt;embed&gt; with another type, or none, is out of scope). An &lt;embed&gt; with aria-hidden="true", on itself or an ancestor, or with role="none"/"presentation", is left out: it is marked decorative, which 1.2.6 covers. One that is the only content of a link or a button is left out: its alternative is the control's name, which the glossary « Image porteuse d'information » (notes 1 and 2) sends to Links (6.1), Forms (11.9) or Scripts (7.1). Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

RGAA 1.1.7 passes when one of these holds:

- the &lt;embed&gt; has a text alternative (aria-labelledby, aria-label or title) and role="img";
- it is immediately followed by a link or button that gives access to an alternative content;
- a mechanism lets the user replace it with an alternative content.

Passes: role="img" and a text alternative. Fails: no text alternative and no link or button right after it, when the embed has role="img" or certainly carries information (a captioned image, or one that takes focus). Without either, it is asked about (noAlternativeMayBeDecorative): it may be decorative, and then it fails 1.2.6 instead. Asks (cantTell):

- a text alternative without role="img". The test's first condition and step 2 of its methodology ask for both, so the alternative alone does not meet it: an informative image passes only through a link or button right after it or a replacement mechanism, and a decorative one fails 1.2.6, as it keeps an alternative;
- no text alternative, but a link or button right after the &lt;embed&gt; (does it lead to an alternative content?).

### `rgaa-embedded-player-review`

**Media in embedded players has its alternatives and controls**

manual · no formal WCAG SC mapping · confidence high · default severity serious

Flags YouTube, Vimeo, Dailymotion, PeerTube and SoundCloud players, for a person to check the transcript, captions, audio description, identification and controls theme 4 asks for, and the sound of a player that starts by itself.

**Applies to.** Applies to visible frames of known media players (YouTube, Vimeo, Dailymotion, PeerTube, SoundCloud), found by their src or a lazy loader's data-src. A page with none is notApplicable.

**Expectation.** A player shows « un média temporel », which theme 4 asks to have, if needed, a transcript (4.1), synchronised captions (4.3) and an audio description (4.5), to be identified by the text next to it (4.7), to be controllable by keyboard and any pointing device (4.11) and compatible with assistive technologies (4.13). What the media holds and what the player offers can't be read from the page, so each player is asked about (embeddedPlayer). One that starts by itself (autoplay=1 in its URL, auto_play=true for SoundCloud) is asked about under 4.10 too (embeddedPlayerAutoplay): sound that starts on its own must stop within 3 seconds or be controllable.

### `rgaa-embedded-refresh-review`

**Embedded content that may refresh itself lets the user control the refresh**

manual · no formal WCAG SC mapping · confidence low · default severity moderate

Flags &lt;object&gt;, &lt;embed&gt;, &lt;canvas&gt; and scripted &lt;svg&gt; elements, for a person to check whether they refresh their content on their own and, if so, whether the user can stop, slow down or be warned of the refresh.

**Applies to.**

Applies to the elements RGAA 13.1.1 lists as refresh methods, other than &lt;meta&gt;:

- every &lt;object&gt; and &lt;embed&gt;, except one that shows a still image (a `type` of image/* other than image/svg+xml, or with no `type`, a `data` or `src` ending in a raster image extension);
- every &lt;canvas&gt;, since a script draws it and may redraw it;
- every &lt;svg&gt; that contains a &lt;script&gt;.

Hidden elements count, as they can still reload content. An element inside an &lt;object&gt; already asked about is its fallback and is left out.

**Expectation.** Each element found is asked about (cantTell). If it refreshes its content on its own, RGAA 13.1.1 wants the user to be able to stop or restart the refresh, lengthen the delay tenfold, be warned in time to lengthen it, or the delay to be twenty hours at least. The markup does not show whether any refresh happens.

### `rgaa-fake-list`

**Text laid out as a list uses list markup**

manual · no formal WCAG SC mapping · confidence low · default severity moderate

Flags consecutive lines or paragraphs that start with bullets or consecutive numbers but are not marked up as a list, for a person to decide whether they are one.

**Applies to.** Applies to text outside any list that looks like one: two or more lines of one element, split by &lt;br&gt;, or two or more consecutive sibling paragraphs, each starting with the same bullet character (•, -, *, …) or with consecutive numbers ("1.", "2." or "1)", "2)"). A page with none is notApplicable.

**Expectation.** Such text is flagged for a person to decide whether it is a list, which RGAA 9.3.1 (bullets) and 9.3.2 (numbers) want marked up with &lt;ul&gt;/&lt;ol&gt; and &lt;li&gt;, or role="list" and role="listitem".

### `rgaa-field-group-legend`

**Groups of form fields have a legend**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a &lt;fieldset&gt; without a legend, or a role="group" or role="radiogroup" without aria-label or aria-labelledby, holding form fields, for a person to decide whether it groups fields of the same kind.

**Applies to.** Applies to &lt;fieldset&gt; elements and elements with role="group" or role="radiogroup" that contain at least one form field (input other than hidden, select, textarea, or an element with a form field role). A page with none is notApplicable. When every group has a legend (or, for an ARIA group, an aria-label or aria-labelledby), the rule passes: 11.6.1 asks that one exists, and whether it is relevant is 11.7's question.

**Expectation.** RGAA 11.6.1 step 2: a &lt;fieldset&gt; has a &lt;legend&gt; child with text; an element with role="group" or role="radiogroup" has an aria-label or an aria-labelledby that resolves to text. A fieldset that itself carries role="group" or role="radiogroup" may use either. aria-label on a plain fieldset, and title on a group, do not count: step 2 names only those mechanisms. A group without one is flagged for a person to decide whether it groups fields of the same kind, which is when RGAA 11.6.1 requires a legend, and, if so, whether every field instead carries a title, aria-label, aria-labelledby or aria-describedby that names the group (step 3).

### `rgaa-field-hidden-label-review`

**A field with a visually hidden label is understandable from the screen**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each form field whose &lt;label&gt; is visually hidden, for a person to check that a title or visible text next to it makes the expected input understandable.

**Applies to.** Applies to visible form fields (&lt;input&gt; other than hidden and the button types, &lt;select&gt;, &lt;textarea&gt;) whose &lt;label&gt; elements all hold text but are visually hidden (clipped away, 1 by 1 px with their overflow hidden, and the like), and that have no aria-labelledby pointing to visible text. A page with none is notApplicable.

**Expectation.** RGAA 11.1.3 covers a field « ayant une étiquette dont le contenu n'est pas visible » and asks for one of: a title that makes the expected input understandable, a passage next to the field that becomes visible on focus, or a visible passage next to it. Whether the text on screen (a button beside a search field, a placeholder, an icon) does that is for a person: the field is asked about (hiddenLabel), naming whether it has a title.

### `rgaa-field-label-consistency-review`

**Fields asking for the same information have coherent labels**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags fields of a page with the same autocomplete value but different visible labels, for a person to check that the labels say without ambiguity that the same information is asked for.

**Applies to.** Applies to visible form fields (input other than hidden, the button types, checkbox and radio; select; textarea) that have a visible label (a &lt;label&gt;, or an aria-labelledby passage) and an autocomplete value naming a field (email, tel, postal-code…; not on or off). Fields with the same autocomplete value, section and shipping/billing/home/work tokens included, ask for the same information. A page where no two such fields have different labels is notApplicable.

**Expectation.** RGAA 11.3.1: « Chaque étiquette associée à un champ de formulaire ayant la même fonction et répétée plusieurs fois dans une même page est-elle cohérente ? ». The glossary « Étiquettes cohérentes » asks that labels « réclamant la saisie d’une même information » be « formulées sans ambiguïté pour que l’utilisateur sache que l’information qu’il doit communiquer est la même ». Two different wordings can still be unambiguous, so a set whose labels differ once case, accents, punctuation, text in parentheses and the words for required or optional are ignored is asked about (inconsistentLabels), once, on its first field.

### `rgaa-field-label-in-name-sources`

**Every label source of a form field contains its visible label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the source that gives the accessible name of a form field with a visible label (aria-labelledby, aria-label, &lt;label&gt; or title) contains that label, as RGAA 11.2.5 requires.

**Applies to.** Applies to the form fields of RGAA's glossary entry "Champ de saisie de formulaire" (native &lt;input&gt; other than the button types and hidden, &lt;select&gt;, &lt;textarea&gt;, &lt;output&gt;, &lt;progress&gt;, &lt;meter&gt;, and the textbox, searchbox, combobox, spinbutton, slider, listbox, checkbox, radio, switch and progressbar roles) that have a visible label and at least one label source other than the one the visible label is read from. The visible label is the visible text of the field's &lt;label&gt;, else of the elements its aria-labelledby points to, else, for the checkbox, radio and switch roles, the field's own text. A field whose visible label is not tied to it in the markup is not found. A page with no such field is notApplicable.

**Expectation.** RGAA 11.2.5: when present, the aria-label, the text aria-labelledby points to, the title and the content of the &lt;label&gt; each contain the visible label. Punctuation and capital letters are ignored (the particular cases of 11.2); accents are not folded. Only the source that gives the accessible name is judged, and it fails when it does not contain the visible label: the test's conditions name every source present, but its methodology and the glossary « Étiquette de champ de formulaire » judge the one that is the étiquette (aria-labelledby, else aria-label, else &lt;label&gt;, else title), as 11.9.2 does for buttons. A field whose other sources lack the label (a title holding a format hint beside a &lt;label&gt;) passes. « Contient » is read as words: each word of the visible label must appear, in order, as a word of that source, so a word with another ending ("Rechercher" for "Recherche"), an abbreviation written out or text in parentheses left out fails.

### `rgaa-field-label-listed-source`

**Form fields have a label from a source RGAA lists**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each form field has an aria-labelledby, an aria-label, a &lt;label for&gt; or a title, the label sources RGAA 11.1.1 lists.

**Applies to.** Applies to the form fields of RGAA's glossary entry "Champ de saisie de formulaire": &lt;input&gt; of any type except submit, reset, button, image and hidden; &lt;select&gt;; &lt;textarea&gt;; &lt;output&gt;; &lt;progress&gt;; &lt;meter&gt;; and elements with role progressbar, meter, slider, spinbutton, textbox, listbox, searchbox, combobox, checkbox, radio or switch. option, optgroup and datalist are left out: a literal reading would ask for a label on every option. An element with role="button", and a field hidden from assistive technologies (aria-hidden, hidden content) are out of scope. An &lt;output&gt; that belongs to no form (no &lt;form&gt; or role="form" ancestor, no form owner through its form attribute) is out of scope too: the glossary makes a field an « objet d'un formulaire », and such an output's message is judged under 7.5. A page with no such field is notApplicable.

**Expectation.** The field meets one of the conditions of RGAA 11.1.1: an aria-labelledby that points to a passage of text, an aria-label, a &lt;label for&gt; pointing at it, or a title. The fifth condition (an adjacent button) also needs one of these as the field's name. A field with none of them fails: a placeholder, the field's own content (a role="checkbox" named by its text) and an &lt;output&gt;'s value do not count. A field whose sources are all empty (an empty aria-label or title, a &lt;label for&gt; with no text, an aria-labelledby whose passage has no text) fails too (emptySource): the glossary entry « Étiquette de champ de formulaire » makes the label a « texte », and an empty source gives none, so the field has no label, the fifth condition included, which also needs a name. A field whose only label is a &lt;label&gt; wrapping it, without for, fails (wrappingLabel): 11.1.1 names « une balise &lt;label&gt; ayant un attribut for ». A &lt;label for&gt; pointing at an element a label cannot name (a role="textbox" &lt;div&gt;) fails too (labelForNotLabelable): the label is not associated with it and gives it no name.

### `rgaa-figure-caption-structure`

**Images with a caption use the figure structure RGAA describes**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that a &lt;figure&gt; holding an image and a &lt;figcaption&gt; has role="figure" or "group" and an aria-label matching the caption.

**Applies to.** Applies to &lt;figure&gt; elements that contain an image and a &lt;figcaption&gt; with text. The images are those of RGAA 1.9's five tests: an &lt;img&gt;, &lt;input type="image"&gt; or element with role="img" (1.9.1), an &lt;object type="image/…"&gt; (1.9.2), an &lt;embed&gt; (1.9.3), an &lt;svg&gt; (1.9.4) and a &lt;canvas&gt; (1.9.5). An &lt;embed&gt; whose type is not an image type is not an image. The caption and the image must both be rendered: one hidden with CSS or the hidden attribute is none to a user (glossary « Contenu caché »). A page with none is notApplicable.

**Expectation.** The &lt;figure&gt; has role="figure" or role="group", and an aria-label whose text is the same as the caption's, whitespace collapsed (conditions 2 and 3 of each 1.9 test). The caption being inside a &lt;figcaption&gt; is what makes the figure applicable.

**What a finding reports.**

- `reasonCode`: the first condition that fails, `missingRole`, `missingAriaLabel` or `ariaLabelMismatch`; `reasons` lists all.
- `imageKind`: the figure's first image, in tree order, by the 1.9 test it belongs to: `img` (1.9.1), `object` (1.9.2), `embed` (1.9.3), `svg` (1.9.4) or `canvas` (1.9.5). An &lt;svg&gt; or &lt;canvas&gt; with role="img" counts by its element.
- `caption`: the caption's text, whitespace collapsed.

### `rgaa-focus-indicator-contrast`

**Author focus indicators have a contrast ratio of at least 3:1**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks that an outline, border or box-shadow drawn by a :focus or :focus-visible rule in place of the browser outline has a contrast ratio of at least 3:1 with the colors next to it, and asks when it cannot be computed.

**Applies to.** Applies to elements in the tab order that are rendered, whose native focus outline an author rule replaces or removes: a `:focus` or `:focus-visible` rule on the element (or a rule with no state, or its style attribute) sets `outline-style` or `outline-width`, through the `outline` shorthand or the longhands, and the rule that wins the cascade is not `outline: auto`. The element must also have an author indicator to measure: a visible outline, border or box-shadow from a focus rule, or another focus style. An element that keeps the browser's outline meets RGAA 10.7.1's first condition and is not checked. An element whose outline is removed with no replacement at all is left to css-focus-indicator-suppressed. A page with none is notApplicable.

**Expectation.** RGAA 10.7.1, step 2: the indicator is « suffisamment contrastée (ratio de contraste égal ou supérieur à 3.0) ». Each outline, border or box-shadow of the focus style is measured against the two colors it touches: the background behind the element and the element's own background (only the latter for an inset shadow). The element passes when one indicator reaches 3:1 against both. It fails when every indicator is below 3:1 against both and nothing else changes on focus. It is asked about (cantTell) otherwise: a color or background the engine cannot compute (background image, gradient, `var()`, a translucent page root in strict contrast mode), a blurred shadow, an indicator that reaches 3:1 against one side only, a focus style made of other changes (background, text color, underline, a pseudo-element, a rule that styles another element), or a cascade the engine cannot settle. Margin (`contrast-ratio`): of the focus indicators that reach 3:1 against every color next to them, the one closest to it, with its lowest ratio unrounded; `context.property` names the outline, border or box-shadow. `measuredCount` counts the elements whose focus style was judged.

**Margin.** `contrast-ratio`, in a ratio: the value must reach the threshold, and the result's `margin` names the element that came closest while meeting it.

### `rgaa-form-button-label-in-name-sources`

**The accessible name of a button in a form contains its visible label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each button inside a form (a &lt;form&gt; or role="form") has an accessible name that contains its visible label, as RGAA 11.9.2 requires.

**Applies to.** Applies to the buttons of RGAA's glossary entry "Bouton (formulaire)" (&lt;button&gt;, &lt;input&gt; of type submit, reset or button, and role="button") inside a &lt;form&gt; or an element with role="form", that show a visible label (their text, or the value of an &lt;input&gt; button) and carry an aria-label, aria-labelledby or title. An image button shows its label inside the image, which this engine cannot read, and a button that joins a form only through its form attribute is not « au sein » of it: both are left out. A page with no such button is notApplicable.

**Expectation.** RGAA 11.9.2 methodology step 2: the button's accessible name contains its visible label. Punctuation and capital letters are ignored (the particular cases of 11.2, which 11.9.2 refers to); accents are not folded. « Contient » is read as words: an accessible name that lacks a word of the visible label, holds it with another ending, spells out an abbreviation or leaves out text in parentheses fails.

### `rgaa-form-button-name-present`

**Buttons in a form have a label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each button inside a form (a &lt;form&gt; or role="form") has a label that RGAA 11.9.1 can judge.

**Applies to.** Applies to the buttons of RGAA's glossary entry "Bouton (formulaire)" (&lt;button&gt;, &lt;input&gt; of type submit, reset, button or image, and role="button") that sit inside a form: a &lt;form&gt; element or an element with role="form" (glossary "Formulaire"). RGAA 11.9.1 step 1 covers « les boutons présents au sein d'un formulaire », so a button outside any form is out of scope. A button hidden from assistive technologies, or whose explicit role is another one (role="tab", role="none"), is out of scope too. A page with no such button is notApplicable.

**Expectation.** The button has a label: an aria-labelledby passage, an aria-label, the alt of an image button, the value of an &lt;input&gt; button, the content of a &lt;button&gt; or role="button" element (an image's alt, an &lt;svg&gt;'s &lt;title&gt; and the like count), or a title. A button with none of them has no label to be relevant, and fails 11.9.1 step 2. A button outside the form element that joins a form through its form attribute is a button of that form (glossary « Bouton (formulaire) »), and fails the same way with no label (formAttributeOnly). A submit or reset &lt;input&gt; with no value shows the browser's own label ("Submit", "Reset") and passes; whether the label is relevant is left to a person, as the rest of 11.9.1 is.

### `rgaa-format-hint-review`

**Fields with a format constraint suggest the format or an example**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a field with a pattern, minlength, min/max or inputmode whose label, description and placeholder give no format or example, for a person to check that an input error suggests the expected format and an example.

**Applies to.** Applies to visible, enabled, editable text-like fields (&lt;textarea&gt;, and &lt;input&gt; of type text, search, tel, url, email, password, number, date, time, datetime-local, month or week) that carry an input control (glossary « Contrôle de saisie »): a pattern, a minlength, a min or max on a number, date or time field, or an inputmode of numeric, decimal, tel, email or url. Fields whose label, title, aria-labelledby or aria-describedby passages or placeholder show a digit or a word such as « ex. », « format » or « jj/mm/aaaa » are left out, as are fields with a pattern and a title (technical note of 11.11). A page with none left is notApplicable.

**Expectation.** RGAA 11.11.1: « Pour chaque erreur de saisie, les types et les formats de données sont-ils suggérés, si nécessaire ? »; 11.11.2: « des exemples de valeurs attendues sont-ils suggérés, si nécessaire ? ». The error message itself only shows once a value is rejected, and it may be the one the browser writes, so a field whose constraint is stated nowhere around it is asked about (formatWithoutHint).

### `rgaa-frame-title-attribute-present`

**Frames have a title attribute**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that every &lt;iframe&gt; and &lt;frame&gt; has a title attribute that is not empty, unless it is hidden with aria-hidden="true".

**Applies to.** Applies to every &lt;iframe&gt; and &lt;frame&gt; in the scan scope that is not hidden from assistive technologies by aria-hidden="true", on itself or on an ancestor. The RGAA glossary "Titre de cadre", note 2, makes criteria 2.1 and 2.2 not applicable to such a frame. A frame removed from the tab order (tabindex="-1") is still in scope. Frames hidden by the default hidden-content policy (display:none, hidden) are not checked. A page with no applicable frame is notApplicable.

**Expectation.** The frame has a title attribute (RGAA 2.1.1: « Chaque cadre (balise &lt;iframe&gt; ou &lt;frame&gt;) a-t-il un attribut title ? »), and it is not empty. Criterion 2.1 asks for a « titre de cadre », which the glossary defines as the content of that attribute, so an empty or blank title gives the frame no title: it fails here, as auditors report it, and 2.2.1 (the title's relevance, for frames that have one, which rgaa-frame-title-relevant asks about) does not apply to it. Test 2.1.1 and its methodology ask only that the attribute be there, so this follows the criterion and the glossary rather than the test's letter. An accessible name from aria-label or aria-labelledby does not replace the title.

### `rgaa-frame-title-relevant`

**Frame titles are relevant**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each &lt;iframe&gt; and &lt;frame&gt; with a title for a person to check that the title says what the frame contains.

**Applies to.** Applies to every &lt;iframe&gt; and &lt;frame&gt; in the scan scope whose title attribute is not empty or blank, and that is not hidden from assistive technologies by aria-hidden="true", on itself or on an ancestor (RGAA glossary "Titre de cadre", note 2, makes 2.2 not applicable to it). Frames hidden by the default hidden-content policy are not checked. A frame with no title, or an empty one, has no « titre de cadre »: rgaa-frame-title-attribute-present fails it under 2.1.1. A page with no applicable frame is notApplicable.

**Expectation.** Each such frame is flagged, quoting its title and its address, for a person to check RGAA 2.2.1: the content of the title attribute is relevant, that is, it says what the frame contains. The glossary accepts a generic mention for a frame used only for technical purposes, such as title="contenus techniques Facebook".

### `rgaa-heading-content-present`

**Headings have content**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that each heading holds text or an image with a text alternative, rather than being empty or named only by attributes.

**Applies to.** Applies to the headings RGAA defines (glossary "Titre"), included in the accessibility tree: &lt;h1&gt;-&lt;h6&gt; without a role other than heading, and elements with role="heading" and an aria-level attribute. An element with role="heading" but no aria-level is not an RGAA heading; rgaa-heading-role-level-present reports it. A heading hidden only visually (a screen-reader-only class) is still a heading, as the glossary says. A page with none is notApplicable.

**Expectation.**

The heading's content holds text, or an image with a text alternative (alt, aria-label, aria-labelledby, title, or the &lt;title&gt; of an &lt;svg&gt;). RGAA 9.1.2 asks whether the content of each heading is relevant; a heading with no content has nothing to judge, so it fails. When the content gives no text but the heading is not empty, the rule asks instead:

- the heading is named only by its own title, aria-label or aria-labelledby, or by an aria-label on an element inside it: 9.1.2 judges the content, and whether such a name makes it relevant is left to a person;
- the content is text hidden from assistive technologies (aria-hidden="true"), an image with no text alternative, text added by CSS (::before, ::after), or an embedded element such as a form field or a frame.

### `rgaa-heading-role-level-present`

**ARIA headings have an aria-level attribute**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that each element with role="heading" also has an aria-level attribute.

**Applies to.** Applies to elements other than &lt;h1&gt;-&lt;h6&gt; whose role is heading, that are included in the accessibility tree. A native &lt;hx&gt; is a heading by its tag, whatever its attributes, so it is not matched. A page with no such element is notApplicable.

**Expectation.** The element has an aria-level attribute whose value is a number. RGAA defines a heading as an &lt;hx&gt; element or an element with both role="heading" and aria-level (glossary "Titre"), and 9.1.3 step 1 accepts only these two structures ("un attribut WAI-ARIA aria-level=x", "x" being a number). WAI-ARIA gives role="heading" a default level of 2, which WCAG accepts, but RGAA does not.

### `rgaa-headings-absent-review`

**A page with text but no heading is reviewed**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags a page with 30 words or more of text and no heading at all, for a person to check whether some passages act as headings and need &lt;hx&gt; markup.

**Applies to.** Applies to a page with no heading at all (no &lt;h1&gt;-&lt;h6&gt; and no role="heading", hidden ones included) whose visible text holds 30 words or more. A page with a heading, or with less text, is notApplicable, and so is a scan of part of a page (a contextSelector or a fragment), which cannot see the whole page.

**Expectation.** RGAA 9.1.3: « chaque passage de texte constituant un titre est-il structuré à l'aide d'une balise &lt;hx&gt; » or role="heading" with aria-level. A page of some length with no heading at all usually has passages that act as headings, but a short page may have none: the page is asked about (noHeading), for a person to look for them.

### `rgaa-html-elements-attributes-valid`

**HTML elements and attribute values are valid**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks, hidden content included, for obsolete or unknown elements and for invalid dir, id, lang, xml:lang, scope, headers, optgroup label, image button alt and autocomplete values, as the W3C validator reports them.

**Applies to.** Applies to every HTML element in the scan scope, hidden or not: RGAA 8.2.1 judges the generated source, which the W3C validator reads whole (helpers.queryAllSource). Elements in SVG or MathML are left out. The checks follow HTML5; a page whose doctype is neither HTML5 nor missing is asked about instead (see below).

**Expectation.**

« Les balises, attributs et valeurs d'attributs respectent les règles d'écriture » (RGAA 8.2.1). Each case below is an error of the W3C validator (Nu checker 26.9.27, the version the expected outcomes were checked against), and fails:

- obsoleteElement: an element HTML makes obsolete (blink, marquee, center, font, big, tt, strike, acronym, applet, dir, frame, and so on);
- unknownElement: an element HTML does not define whose name is not a valid custom element name (foo, font-face);
- dirValue: dir other than ltr, rtl or auto (case aside), spaces included; auto on bdo;
- idValue: an empty id, or one with whitespace;
- langValue: a lang value that is not a well-formed BCP 47 language tag (en_US, en-US-US, fr-FR-!!, " en"). An empty lang is allowed; whether the language subtag is registered is left to rgaa-html-lang-code-valid (8.4.1) and valid-lang (8.8.1);
- xmlLangMismatch: xml:lang without lang, or with a different value (case aside);
- scopeValue: a scope on th other than row, col, rowgroup or colgroup (case aside), spaces or empty value included;
- scopeElement: scope on an element other than th, td included: scope on td is obsolete in HTML, so not conforming, although the validator only warns about it;
- headersTarget / headersEmpty: a headers token that names no th of the same table (a td, a caption, an element outside the table or in a nested table), or an empty headers attribute;
- optgroupLabel: an optgroup with no label attribute and no legend child;
- typeValue: a type on input or button that is not one of its keywords (case aside), spaces included (type="bouton");
- inputImageAlt: input type=image with no alt, or an empty one;
- autocompleteValue: an empty autocomplete, a token list that is not a valid autofill detail list, on or off on input type=hidden, or a form autocomplete other than on or off. Disabled fields are included;
- autocompleteControl: a field name whose control group the input type does not accept (street-address on a text input, email on a number input);
- autocompleteType: autocomplete on an input type that does not take it (checkbox, radio, file, submit, image, reset, button).

### `rgaa-html-lang-code-valid`

**Default language code is valid**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the language code of lang and xml:lang on &lt;html&gt; is a valid ISO 639 code.

**Applies to.** Applies to a run over a whole document whose &lt;html&gt; element has a non-empty lang or xml:lang attribute: RGAA 8.4.1 covers only pages « ayant une langue par défaut ». Each of the two attributes is judged when present. A page with neither is notApplicable here; the missing language is rgaa-page-language-present's matter (8.3.1). A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.** The language code, which the RGAA glossary "Code de langue" defines as the part before the first hyphen, is two or three letters and is an ISO 639-1, ISO 639-2 or later ISO 639 code (8.4.1 step 2, « conforme à la norme ISO 639-1 ou ISO 639-2 et suivantes »). What follows the hyphen is left to the author: lang="fr-FR-!!" passes here, and its malformed region is a markup validity question. Whether the code names the page's main language (« pertinent ») is for a person.

### `rgaa-html-nesting-valid`

**HTML elements are nested as HTML allows**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks, hidden content included, that lists, description lists, links, buttons, server-side image maps and &lt;main&gt; elements are nested as the HTML standard and the W3C validator require.

**Applies to.** Applies to every ul, ol, menu, li, dl, dt, dd, a, button, img[ismap] and main element in the scan scope, hidden or not: RGAA 8.2.1 judges the generated source, which the W3C validator reads whole (helpers.queryAllSource). Elements in SVG or MathML are not HTML elements and are left out. A page with none of them is notApplicable. The checks follow the HTML nesting rules; a page whose doctype is neither HTML5 nor missing is asked about instead (see below).

**Expectation.**

« L'imbrication des balises est conforme » (RGAA 8.2.1). Each case below is an error of the W3C validator (Nu checker 26.9.27, the version the expected outcomes were checked against), and fails:

- listChild / listText: a child element of ul, ol or menu other than li, script or template, or text directly inside the list;
- listItemParent: an li whose parent is not ul, ol or menu, whatever role the parent has;
- dlChild / dlText / dlGroupOrder / dlMixedGroups / dlItemParent: the dl content model. A dl holds groups of one or more dt followed by one or more dd, or div elements that each hold one such group (script and template are allowed anywhere); no other element and no text. A dt or dd must sit in a dl, or in a div child of a dl;
- interactiveDescendant / tabindexDescendant: interactive content (a, button, details, embed, iframe, label, select, textarea, input other than type=hidden, img[usemap], audio or video with controls) or an element with a tabindex attribute inside an a or a button. The rule applies to every a, with or without href, and counts a disabled control or a hidden descendant too, as the validator does;
- flowInPhrasing: flow content (div, p, a list, a table, a heading, a sectioning element…) inside an element whose content model is phrasing only (button, label, span, b, i, em, strong, a heading, p…), through transparent a, ins, del or map;
- ismapOutsideLink: an img with ismap and no a[href] ancestor;
- extraMain: more than one main element in the document without its own hidden attribute. A main hidden by CSS, aria-hidden or a hidden ancestor still counts.

### `rgaa-image-alt-long`

**Text alternatives of images are short**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags an image whose text alternative is longer than 80 characters, for a person to decide whether it is short and concise enough.

**Applies to.** Applies to images that carry a text alternative: &lt;img&gt;, &lt;area&gt;, &lt;input type="image"&gt;, &lt;svg&gt;, &lt;canvas&gt;, &lt;object&gt;, &lt;embed&gt;, and any element whose role (first token) is img. The alternative can come from alt (on &lt;img&gt;, &lt;area&gt; and &lt;input type="image"&gt;), aria-label, aria-labelledby (the text it resolves to), title, or an &lt;svg&gt;'s own &lt;title&gt; child, the sources RGAA's image tests list. A page with none is notApplicable. When every alternative is 80 characters or fewer, the rule passes.

**Expectation.** A text alternative longer than 80 characters (spaces collapsed), from any of those sources, is flagged for a person to decide whether it is short and concise, as RGAA 1.3.9 asks, or one of the particular cases it allows. RGAA's test gives no number: 80 characters is a threshold for asking, not a limit. The occurrence lists each source over the threshold. Fallback content of &lt;canvas&gt; and &lt;object&gt; is not measured.

### `rgaa-img-alt-present`

**Images that are not spacers have an alt attribute**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each exposed &lt;img&gt; has an alt attribute or another text alternative, except a spacer image, which is decorative.

**Applies to.** Applies to &lt;img&gt; elements included in the accessibility tree, as img-alt-present does: role="presentation" or role="none" leaves an image out only when it is not focusable, and hidden images are left out. A spacer with no alt, or an alt of only spaces, is left out too: an image 2 px wide or high, or less, as rendered or, with no layout, by its width or height attribute, unless it is in a &lt;figure&gt; with a &lt;figcaption&gt;. An image that is the only content of a link or a button is left out: its alternative is the control's name, which the glossary « Image porteuse d'information » (notes 1 and 2) sends to Links (6.1), Forms (11.9) or Scripts (7.1). A page with none is notApplicable.

**Expectation.**

Each applicable &lt;img&gt; has an alt attribute (alt="" included), a non-empty aria-label or aria-labelledby, or a non-empty title. RGAA 1.1.1 asks each image carrying information for a text alternative, and 1.2.1 asks each decorative one for alt="", so an image with none of these fails one of the two, depending on what it is:

- it fails 1.1.1 when it certainly carries information: it has a caption (a &lt;figure&gt; with a &lt;figcaption&gt;), it is an image map (usemap or ismap), or it takes focus (tabindex 0 or more);
- otherwise it is asked about (cantTell), since it may be decorative (glossary « Image de décoration »: « Une image précédant chaque item d'une liste »), and the 1.1.x methodology leaves that call to a person; rgaa-img-no-alt-decorative asks the 1.2.1 side.

A spacer carries no information, so it is decorative, and the alt="" it lacks is 1.2.1's matter, which rgaa-img-no-alt-decorative fails.

### `rgaa-img-decorative-no-alternative`

**Decorative images have no aria-labelledby, aria-label or title**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that an &lt;img&gt; marked decorative (alt="", aria-hidden="true" or role="presentation") has no aria-labelledby, aria-label or title attribute.

**Applies to.** Applies to &lt;img&gt; elements marked decorative: alt="", aria-hidden="true" on the element, or role="presentation"/"none". An &lt;img&gt; inside a &lt;figure&gt; that has a &lt;figcaption&gt; is left out: criterion 1.2 does not apply to an image with a caption (légende). Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.** RGAA 1.2.1 step 2: "vérifier que l'image ne possède pas d'attributs aria-labelledby, aria-label ou title". An image marked decorative that has none of them, with a non-empty value, passes. Fails: aria-hidden="true" together with one of them. The image is hidden from assistive technologies, so it is decorative for them; if it carries information after all, hiding it fails 1.1.1 instead. Either way the page fails. Asks (cantTell): alt="" or role="presentation"/"none", without aria-hidden="true", together with one of them. The image may be informative, and then 1.2.1 does not apply and 1.1.1 accepts aria-label, aria-labelledby or title as its alternative. A person decides which.

### `rgaa-img-describedby-target`

**An image's aria-describedby points to its description**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Fails an image whose aria-describedby lists only ids that do not exist; asks when some are missing or the passages are empty.

**Applies to.** Applies to images exposed to assistive technologies (&lt;img&gt;, &lt;input type="image"&gt;, &lt;area href&gt;, &lt;object&gt;, &lt;embed&gt;, outer &lt;svg&gt;, &lt;canvas&gt;, role="img") that carry a non-empty aria-describedby. Decorative images (alt="", role="presentation" or "none", or inside aria-hidden="true") are left out. A page with none is notApplicable.

**Expectation.**

RGAA 1.6.9: for each image « qui utilise un attribut WAI-ARIA aria-describedby, l'attribut WAI-ARIA aria-describedby associe-t-il la description détaillée ? »

- It fails when none of the ids it lists exists in the page (targetMissing): it associates nothing.
- It asks (cantTell) when some ids exist and others do not (someTargetsMissing), and when the passages it points to hold no text (emptyDescription).
- Whether the passage it points to is the detailed description is left to a person, as 1.6 is.

### `rgaa-img-no-alt-decorative`

**Decorative images with no alt attribute**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks each &lt;img&gt; with no alt attribute and no alternative: fails a spacer image, and asks whether the others are decorative.

**Applies to.** Applies to &lt;img&gt; elements with no alt attribute, or an alt of only spaces, which is not the empty alt 1.2.1 asks for, and no alternative (no non-empty aria-label, aria-labelledby or title), not marked decorative (role="presentation"/"none"), not hidden with aria-hidden="true" on itself or an ancestor (assistive technologies then ignore it, which is what criterion 1.2 asks), and not in a &lt;figure&gt; with a &lt;figcaption&gt; (criterion 1.2 does not apply to an image with a caption). An image that is the only content of a link or a button is left out: it carries the control's information, so it is not decorative, and rgaa-img-alt-present fails it under 1.1.1. Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

Such an image fails one criterion, and which one depends on what it is: 1.1.1 if it carries information (rgaa-img-alt-present fails it there), 1.2.1 if it is decorative, since 1.2.1 step 2 asks a decorative &lt;img&gt; for alt="" (or aria-hidden="true", or role="presentation"). This rule reports the 1.2.1 side:

- Fails a spacer: an image 2 px wide or high, or less, as rendered or, with no layout, by its width or height attribute. A line or a pixel carries no information.
- Asks (cantTell) about the others: if the image is decorative, it fails 1.2.1; if it carries information, 1.1.1 only. A person decides.

### `rgaa-keyboard-only-event-handlers`

**Keyboard-only inline event handlers should have a pointer equivalent**

manual · no formal WCAG SC mapping · confidence low · default severity moderate

Flags elements that are not interactive natively and have an inline key handler (onkeydown, onkeyup, onkeypress) but no click or pointer handler, for a person to check that the action also works with a mouse, touch or stylus.

**Applies to.** Applies to elements that carry a non-empty inline key handler (`onkeydown`, `onkeyup` or `onkeypress`) and are not interactive natively: not a link or area with href, button, input other than hidden, select, textarea, option, summary, details, label, iframe, embed, audio or video with controls, img with usemap, or an element made editable with contenteditable. Hidden content is skipped, as in the other rules. A page with no such element is notApplicable.

**Expectation.** Each such element with no inline click or pointer handler (`onclick`, `ondblclick`, `onmousedown`, `onmouseup`, `onpointerdown`, `onpointerup`, `ontouchstart`, `ontouchend`) is flagged (cantTell) for a person to check RGAA 7.3.1 steps 4 and 5: the action is also available with any pointing device (mouse, touch, stylus), on this element or on another element of the page that does the same thing. Never pass or fail.

### `rgaa-label-for-target-valid`

**Labels point to a form field**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the for attribute of each &lt;label&gt; matches the id of a form field it can label.

**Applies to.** Applies to &lt;label&gt; elements carrying a for attribute. A page with none is notApplicable.

**Expectation.** The first element in the label's own tree whose id equals the for value exists and is labelable: &lt;button&gt;, &lt;input&gt; other than type="hidden", &lt;meter&gt;, &lt;output&gt;, &lt;progress&gt;, &lt;select&gt;, &lt;textarea&gt;, or a form-associated custom element (RGAA 11.1.2). A for attribute that matches nothing means the label labels nothing, not even a field nested inside it, since the HTML association falls back to the label's content only when for is absent. A target that is not labelable but has a form-field ARIA role (textbox, combobox, listbox, searchbox, spinbutton, slider, progressbar, checkbox, radio, switch, option: the roles the RGAA glossary "Champ de saisie de formulaire" counts as fields) passes: 11.1.2 asks only that the field has an id equal to the for value. HTML does not let such a label name the field, and that missing name belongs to 11.1.1, not here.

### `rgaa-label-placement-review`

**Each field's label sits right next to it, on the expected side**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

In a browser, flags form fields whose visible label is far from them, or is not above or before them (below or after them for a check box, radio button or switch), for a person to check that label and field are next to each other as RGAA asks.

**Applies to.** Applies, where the page has a layout (in a browser), to visible form fields (&lt;input&gt; other than hidden and the button types, &lt;select&gt;, &lt;textarea&gt;, and role checkbox, radio, switch, textbox, searchbox, combobox, spinbutton, listbox or slider) with a visible label: a &lt;label&gt; (for or wrapping) or an aria-labelledby passage holding visible text. A name from aria-label, title or a placeholder alone is not a visible label. Native check boxes and radio buttons that are themselves invisible (opacity 0, clipped, tiny: drawn by CSS elsewhere) are left out. Without a layout (jsdom), notApplicable.

**Expectation.** RGAA 11.4.1: « Chaque étiquette de champ et son champ associé sont-ils accolés ? », accolés being « visuellement proches de manière à ce que la relation entre les deux ne puisse pas prêter à confusion ». A label more than 100 px (or 3 of its lines, if more) from its field is asked about (labelFarFromField). A wrapping label is taken as next to the field it holds. RGAA 11.4.2: a label of a field other than a check box, radio button or switch is « visuellement accolée immédiatement au-dessus ou à gauche du champ » (« à droite » for a right-to-left language). One that is neither is asked about (labelNotAboveOrLeft). RGAA 11.4.3: for a check box, a radio button or role checkbox, radio or switch, the label is « immédiatement au-dessous ou à droite du champ » (« à gauche » for a right-to-left language). One that is neither is asked about (labelNotBelowOrRight). The particular cases make 11.4.2 and 11.4.3 not applicable when the label « mélange une portion de texte qui se lit de droite à gauche avec une portion de texte qui se lit de gauche à droite », or when a form « contient des labels de plusieurs langues qui se liraient de droite à gauche et inversement »: those labels are only checked for distance. Fields « utilisés dans un contexte où il pourrait être légitime […] de placer les étiquettes de manière différente » are for a person, which is why the rule only asks.

### `rgaa-language-change-review`

**A passage in another language has its language given**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags a block of 8 words or more whose text, guessed from its frequent words, is clearly in another language than the lang in effect, for a person to check that the change of language is given with lang.

**Applies to.** Applies to visible blocks of text (a paragraph, list item, cell, heading, quotation, label, caption, div…) whose own text, without the blocks inside them and the elements inside them that carry their own lang, holds 8 words or more, and whose language in effect (the nearest lang or xml:lang on the block or a parent) is one the rule can recognise: fr, en, es, pt, it, de, nl. Code, preformatted text, scripts, styles, form controls, buttons and aria-hidden content are left out. A page with no such passage is notApplicable.

**Expectation.** RGAA 8.7.1: « Dans chaque page web, chaque texte écrit dans une langue différente de la langue par défaut vérifie-t-il une de ces conditions (hors cas particuliers) ? L’indication de langue est donnée sur l’élément contenant le texte (attribut lang et/ou xml:lang) ; […] sur un des éléments parents ». A block whose text is clearly in another language, by the share of frequent function words of each language, is asked about (undeclaredLanguageChange), one occurrence per element. The particular cases make proper nouns and foreign common nouns of the dictionary not applicable: words of that kind do not count in the guess, passages under 8 words are not looked at, and a passage whose words other than function words all start with a capital (a name, the title of a work) is skipped. A guess is not proof, so a person confirms.

### `rgaa-layout-table-no-data-markup`

**Layout tables use no data table markup**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a table marked as layout (role="presentation" or "none") has no caption, header cells, summary, or scope, headers or axis attributes, and asks when such a table looks like a data table.

**Applies to.** Applies to &lt;table&gt; elements whose role is presentation or none, the only way markup says a table is for layout. A page with none is notApplicable.

**Expectation.** The table has no non-empty summary attribute and contains no &lt;caption&gt;, &lt;th&gt;, &lt;thead&gt;, &lt;tfoot&gt; or element with role="rowheader" or role="columnheader", and none of its &lt;td&gt; cells carries scope, headers or axis (RGAA 5.8.1). A &lt;colgroup&gt; is allowed: RGAA 4.1.2 took it out of 5.8.1's list (notes de révision 4.1 vers 4.1.2), since it sets column widths as often as it groups headers. Only the table's own cells count, not those of a table nested inside it. A table that has such markup and also looks like a data table is reported as cantTell instead of fail: 5.8.1 applies to layout tables, and role="presentation" on a real data table is a different defect (its headers are no longer exposed). It looks like a data table when it has at least two rows and two columns, a data cell, and a full header row (every cell of the first row a header) or a full header column (the first cell of every row a header), headers being &lt;th&gt;, role="columnheader" or role="rowheader".

### `rgaa-legend-relevance-review`

**Legends of groups of form fields are relevant**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags each &lt;legend&gt; of a fieldset, and each aria-label or aria-labelledby of a role="group" or role="radiogroup", holding form fields, for a person to check that it says what the fields have in common.

**Applies to.** Applies to visible &lt;fieldset&gt; elements with a &lt;legend&gt; child holding text, and to visible elements with role="group" or role="radiogroup" named by aria-label or by aria-labelledby passages holding text, that contain at least one form field (input other than hidden, select, textarea, or an element with a form field role). A page with none is notApplicable.

**Expectation.** RGAA 11.7.1: « Chaque légende associée à un regroupement de champs de même nature est-elle pertinente ? ». The glossary « Légende » names the &lt;legend&gt; of a &lt;fieldset&gt;, and the passage linked by aria-labelledby or the aria-label of a role="group". Relevance is for a person, so each legend is asked about (legendRelevance), quoted.

### `rgaa-letters-spaced-with-spaces`

**Letters of a word are not spaced out with spaces**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags text where four or more single letters in a row (three capitals when they are the whole text) are separated by spaces, for a person to confirm whether a word is spaced out that way.

**Applies to.** Applies to text with four or more single letters in a row separated by spaces ("S O L D E S"), or three capital letters in a row when they are the whole text of the element ("T O P"). The text is the element's inline text: its own text nodes joined with the text of its inline children (span, b, a, ...), so letters split across spans ("&lt;span&gt;S&lt;/span&gt; &lt;span&gt;O&lt;/span&gt; ...") are read as one run. It is read outside &lt;pre&gt;, &lt;code&gt;, &lt;textarea&gt;, &lt;script&gt; and &lt;style&gt;. Applies too to a &lt;pre&gt; (not of code) with two lines or more that hold runs of three spaces or more between words, and to a text with two runs or more of three non-breaking spaces between words. A page with none is notApplicable.

**Expectation.** Such text is flagged for a person to confirm whether it is a word spaced out with spaces, which RGAA 10.1.3 forbids: a screen reader spells it letter by letter. CSS letter-spacing gives the same look. Words lined up with runs of spaces are asked about too (spacesAsTable in a &lt;pre&gt;, spacesAsColumns elsewhere): 10.1.3 forbids spaces used « pour simuler des tableaux » or « des colonnes de texte ».

### `rgaa-link-content-label-present`

**Links have a label in their content**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each link holds text or an image with a text alternative, rather than being named only by aria-label, aria-labelledby or title.

**Applies to.** Applies to links included in the accessibility tree: &lt;a&gt; with an href (or, in SVG, an xlink:href), and elements with role="link". An &lt;a href&gt; whose role is another widget (role="button", role="tab") is not a link to assistive technologies and is not matched. &lt;area&gt; is not matched: RGAA judges its text alternative under 1.1.2. A page with no link is notApplicable.

**Expectation.** The content of the link holds text, or an image with a text alternative (alt, aria-label, aria-labelledby, title, or the &lt;title&gt; or &lt;text&gt; of an &lt;svg&gt;). RGAA 6.2.1 asks for "un intitulé entre &lt;a&gt; et &lt;/a&gt;", and its methodology checks that the content of the element contains a label ("texte ou alternative"). A name given only by aria-label, aria-labelledby or title on the link itself does not count: the RGAA glossary "Intitulé (ou nom accessible) de lien", Note 4, says a link with no content fails 6.2. An image that has no text alternative, or that is hidden with aria-hidden="true", gives the link no label; a &lt;canvas&gt;, or an &lt;object&gt; or &lt;embed&gt; of an image type, counts as an image, and its alternative is an aria-label, aria-labelledby, title or fallback text (glossary « Image porteuse d'information », note 1: the alternative of a link's only image is the link's label). Text added by CSS (::before, ::after) is not content between &lt;a&gt; and &lt;/a&gt; (glossary « Intitulé de lien », note 5): a link whose only content is generated text fails (generatedTextOnly). The rule asks instead of failing when the content holds an embedded element such as a form field, or an element named by its own aria-label, or when text hidden from assistive technologies (aria-hidden="true") sits beside a name from aria-label, aria-labelledby or title. Hidden text with no such name leaves the link with no label at all, and fails.

### `rgaa-link-context-review`

**Generic links whose only context is outside RGAA's list are reviewed**

manual · no formal WCAG SC mapping · confidence medium · default severity minor

Flags links named by a generic phrase or a bare file format whose only context is an aria-describedby text or a &lt;dd&gt;, &lt;dt&gt;, &lt;blockquote&gt; or &lt;figcaption&gt;, which RGAA's glossary entry "Contexte du lien" does not list, for a person to check RGAA 6.1.

**Applies to.** Applies to links (a[href], area[href], role="link") whose whole accessible name is a known generic phrase ("en savoir plus", "click here", ...) or a bare file format ("PDF"), the lists link-name-quality uses with more French phrases (« Découvrir », « Plus d'info », « Voir tout »…); on a page with no language declared, every list applies. Its only nearby context is one that RGAA's glossary entry "Contexte du lien" does not list: the text an aria-describedby points to, or the text of an enclosing &lt;dd&gt;, &lt;dt&gt;, &lt;blockquote&gt; or &lt;figcaption&gt;. A link with context from its paragraph, list item or table cell (or, for a format name, the table's header row), or with no context at all, is left to link-name-quality. A page with no such link is notApplicable.

**Expectation.** RGAA 6.1.1 to 6.1.4 accept a link whose name alone, or together with its context, gives its function and destination. The glossary lists six contexts: the sentence, the &lt;p&gt;, the &lt;li&gt; (or a parent &lt;li&gt;), the preceding heading, the associated &lt;th&gt; and the &lt;td&gt;. WCAG technique ARIA1 accepts aria-describedby for 2.4.4, so link-name-quality accepts it and stays silent. Each such link is flagged for a person to check whether one of RGAA's six contexts makes it explicit.

### `rgaa-link-label-in-name-sources`

**Every name source of a link contains its visible label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the title, aria-label and aria-labelledby of a link with a visible label each contain that label, as RGAA 6.1.5 requires.

**Applies to.** Applies to HTML links (&lt;a href&gt; and role="link", glossary "Lien") that have a visible label, the text they display (glossary "Intitulé visible"), and at least one non-empty title, aria-label or aria-labelledby. A link whose only content is an image has no visible text this engine can read, and a link inside an &lt;svg&gt; is left out (6.1.5 checks SVG links through other sources, steps 4 to 6). A page with no such link is notApplicable.

**Expectation.** RGAA 6.1.5 steps 1 and 2: the content of the title, the aria-label and the text aria-labelledby points to each contain the visible label, not only the one that gives the link its accessible name. The glossary "Intitulé (ou nom accessible) de lien", note 2, says the same of the title. The comparison follows the particular cases of 6.1.5: punctuation and capital letters are ignored. Accents are not folded. A source that does not contain the words of the visible label, in order, fails: those particular cases excuse only punctuation, capital letters and symbols, so an abbreviation written out ("Avenue" for "Av."), a word with another ending or text in parentheses left out fails too.

### `rgaa-link-state-colors-review`

**Link states shown by color alone contrast 3:1 with the surrounding text**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that a link in a run of text, shown only by color, keeps a contrast of 3:1 with the surrounding text in each visited, active, hover or focus state shown by another color, and asks when the states cannot be put on the link (RGAA 10.6.1).

**Applies to.** Applies to links (&lt;a href&gt; and role="link") inside a run of text (their parent has text of its own, as for link-in-text-block) that carry no mark other than color at rest: no underline, no weight or style difference from the surrounding text, no border, outline, box-shadow, background image, background color of its own (a highlight, as link-in-text-block reads it), image or generated content (glossary "Lien dont la nature n'est pas évidente").

**Expectation.** RGAA 10.6.1 step 3: the 3:1 contrast between the link color and the surrounding text must be checked « pour les différents états du lien s'ils sont présentés au moyen d'une couleur différente : l'état non visité, l'état visité, l'état activé, l'état au survol et l'état à la prise de focus ». Where the page has a layout (a browser), each state is put on the link and its colors are read. A state whose color differs from the resting one and that adds no other mark fails below 3:1 against the surrounding text (STATE_CONTRAST_LOW). The link passes when every such state reaches 3:1. It is asked about when the browser's own visited color applies (BROWSER_STATE_COLORS) or a style sheet cannot be read (STYLESHEET_UNREADABLE). Without a layout (jsdom), the states cannot be put on the link, so it is asked about when an author rule for :visited, :active, :hover, :focus or :focus-visible changes only its color (STATE_COLOR_CHANGE), when the browser's visited color applies, or when a style sheet cannot be read. A link whose states raise no question is left out there. A page with no link in scope is notApplicable. Margin (`contrast-ratio`): of the link states shown by another color that reach 3:1 with the surrounding text, the one closest to it, unrounded; `context.state` names it (hover, focus, visited, active). `measuredCount` counts the links whose states were read in a browser.

**Margin.** `contrast-ratio`, in a ratio: the value must reach the threshold, and the result's `margin` names the element that came closest while meeting it.

### `rgaa-link-title-content-name`

**A link's title contains the name its content gives it**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Fails an image or composite link whose title does not repeat the text alternative of its images (and, for a composite link, its text), as the RGAA glossary « Intitulé de lien », note 2, requires.

**Applies to.** Applies to image links and composite links (glossary « Lien image », « Lien composite »: links whose content holds an image with a text alternative, with or without text) that have a non-empty title attribute and are included in the accessibility tree. Text links are left out: rgaa-link-label-in-name-sources already checks their title against their visible label (6.1.5). A link whose content holds hidden, CSS-generated or embedded content is left out too, since its name from content can't be read for certain. A page with none is notApplicable.

**Expectation.**

Glossary « Intitulé (ou nom accessible) de lien », note 2: « Un intitulé de lien sera considéré comme non-explicite dans le cas où le lien possède un attribut title dont la valeur ne reprendrait pas au moins le "nom accessible" issu du contenu du lien », since assistive technologies can be set to read the title instead of the content. Punctuation and capital letters are ignored, as 6.1.5's particular cases allow; accents are not folded.

- Fails an image link (6.1.2) whose title does not contain the text alternative of its images (imageLinkTitle).
- A composite link (6.1.3) passes when its title contains the link's text and the text alternative of each of its images, as whole words, in any order. It fails when the title leaves out an alternative (compositeLinkTitle): note 2 makes no exception for an icon. A title that drops the text fails 6.1.5 already.
- Asks, rather than failing, when every alternative the title leaves out is a single character or less once punctuation is set aside, which may be a symbol the title names by its function (symbolAlternative for an image link, compositeSymbolAlternative for a composite link).
- An image whose alternative is not in the markup (a CSS background, an icon font, which is generated content) is not read: such a link is a text link here, or is left out.

### `rgaa-listbox-option-groups-absent`

**ARIA listboxes do not group options**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that no element with role="listbox" groups its options with role="group", which RGAA does not accept in place of &lt;select&gt; and &lt;optgroup&gt;.

**Applies to.** Applies to every element other than &lt;select&gt; whose role attribute makes it a listbox (first token "listbox"). Listboxes hidden by the default hidden-content policy are not checked. A page with none is notApplicable.

**Expectation.** The listbox contains no element with role="group". RGAA 11.8's technical note: « il est impossible de créer des groupes d'options via l'utilisation de WAI-ARIA. De ce fait, une liste nécessitant un regroupement d'options structurée à l'aide d'une balise ayant un attribut WAI-ARIA role="listbox" sera considérée comme non conforme au critère 11.8 ». A role="group" inside the listbox shows that its author grouped the options, so the list needs grouping and fails.

### `rgaa-main-element-structure`

**Main content uses one visible &lt;main&gt; element**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that the main content is a &lt;main&gt; element and that every other &lt;main&gt; carries the hidden attribute, on HTML5 pages.

**Applies to.** Applies to a run over a whole document that declares the HTML5 doctype (helpers.getDoctypeInfo). RGAA 9.2 is not applicable when the declared doctype is not the HTML5 one, and a page with no doctype declares none. A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.**

Steps 4 and 5 of RGAA 9.2.1:

- the main content zone is structured with a &lt;main&gt; element. Every page has a main content zone (glossary « Zone de contenu principal »), so a page with text and no &lt;main&gt; element fails, whether or not it has role="main". A page with neither and no text of its own (only frames, a canvas or shadow DOM content) is asked about (cantTell), since only a person can say where its main content is. So is a page with text of its own that shows a visible &lt;iframe&gt; of 100 by 100 pixels or more (mainMayBeInFrame): its header, navigation and footer may sit around a frame that holds the main content, and the document the frame shows may structure it with &lt;main&gt;. A hidden frame, or a tracker of a few pixels, does not count, and such a page fails;
- when there are several &lt;main&gt; elements, all but one carry the hidden attribute. Every &lt;main&gt; is counted, hidden or not: CSS or aria-hidden alone does not do (« l'utilisation d'un style seul restera insuffisante », 9.2 technical note). A second &lt;main&gt; without its own hidden attribute, hidden only inside a closed &lt;details&gt; or under an ancestor's hidden="until-found", fails too (revealableMain): the user opens the details, or the browser's find-in-page reveals the content, with no script, and two &lt;main&gt; elements are then visible at once, which the test's « une balise &lt;main&gt; visible unique » and the technical note's « il ne peut y avoir en permanence qu'une seule balise visible » rule out. One hidden by an ancestor's plain hidden attribute or a closed &lt;dialog&gt; is asked about (hiddenByAncestor): only a script shows it, and whether it ever shows beside the other &lt;main&gt; is for a person. It passes 9.2.1 when the script that reveals it hides the other; the missing hidden attribute still fails 8.2.1 (rgaa-html-nesting-valid, extraMain). A page whose every &lt;main&gt; carries hidden is asked about too.

Steps 1, 2 and 6 also name the element: a zone marked with role="banner", "navigation" or "contentinfo" on another element than &lt;header&gt;, &lt;nav&gt; or &lt;footer&gt; fails (roleZoneOnly), unless such an element wraps it or sits inside it. Whether a page's header, navigation and footer zones are marked at all, and step 3 (&lt;nav&gt; kept for navigation zones), are left to a person.

### `rgaa-markup-for-presentation`

**Elements are not used only for presentation**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Fails headings with role="presentation" and paragraphs of only spaces or line breaks; asks about empty paragraphs and &lt;blockquote&gt; elements, runs of &lt;br&gt; and indents made of spaces.

**Applies to.** Applies to visible headings with role="presentation" or role="none", paragraphs and &lt;blockquote&gt; elements with no content, runs of two or more &lt;br&gt;, and text indented with non-breaking spaces. A page with none is notApplicable.

**Expectation.**

RGAA 8.9.1: tags other than &lt;div&gt;, &lt;span&gt; and &lt;table&gt; « ne doivent pas être utilisées uniquement à des fins de présentation ». The methodology lists « un titre utilisé comme légende, un élément &lt;blockquote&gt; ou des paragraphes vides ou encore des espaces utilisés pour créer des effets de marges », and accepts role="presentation" on an empty paragraph or a &lt;blockquote&gt; but not on a heading.

- Fails a heading (&lt;h1&gt;-&lt;h6&gt;) with role="presentation" or "none" (headingPresentation): « non-conforme sur un titre ».
- Fails a paragraph that holds only non-breaking spaces or &lt;br&gt;, without role="presentation" (spacerParagraph): it renders a blank line and nothing else.
- Asks about (cantTell) a paragraph with no content at all, which may render nothing; a &lt;blockquote&gt; with no text and no image (emptyBlockquote), which renders little more; an empty paragraph or &lt;blockquote&gt; with a role or aria-live, which a script may fill (placeholder); two or more &lt;br&gt; in a row, which may separate paragraphs or lines of an address or a poem; and text that starts with three non-breaking spaces or more, which may be a margin made of spaces. Runs of spaces between words, which may simulate a table or columns, are 10.1.3's matter (rgaa-letters-spaced-with-spaces).

### `rgaa-markup-validation-review`

**The generated source code passes the W3C validator**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Reads the W3C validator report on the generated source, given as the validator.report probe, and fails the errors it lists; without a report it asks a person to run the validator (RGAA 8.2.1).

**Applies to.** Applies to every page: RGAA 8.2 asks, for every page, whether its generated source code is valid for its document type.

**Expectation.**

RGAA 8.2.1, step 1 runs the W3C validator (Nu HTML Checker, « activer l'option W3C Nu markup checker ») on « le code source généré », the page after its scripts have run, and checks five conditions: tags, attributes and values follow the writing rules; tags are nested, opened and closed correctly; id values are unique; no attribute appears twice on one element. The caller can give the validator's report as the `validator.report` probe: `{ url, source: 'generated' | 'original', messages }`, where `messages` are the Nu checker's JSON messages as it outputs them.

- A report on the generated source with an error fails, one finding per error with its line and message (VALIDATOR_ERROR). Messages about CSS (starting "CSS:") and warnings are left out: 8.2.1's conditions are about the HTML.
- A report on the generated source with no error passes, unless it holds 200 messages or more, the most the engine reads from a probe, which is asked about (REPORT_TRUNCATED).
- A report saying the validator could not check the page is asked about (VALIDATOR_FAILED).
- A report on the original source is asked about, never passed or failed: its errors may be ones the parser repairs, which RGAA's method does not count, and a clean one says nothing of what scripts add (ORIGINAL_SOURCE). A report without `source` counts as one on the original source.
- Without a report, or with one for another page or for a narrowed scan, the page is asked about (pageReview): the HTML parser repairs unclosed and misnested tags, drops repeated attributes and moves misplaced elements before the engine sees the page, so the DOM cannot show most of what 8.2.1 checks.

### `rgaa-media-transcript-adjacent`

**Audio and video have an adjacent transcript or a link to one**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that the element right before or right after each &lt;audio&gt; and &lt;video&gt; is a transcript, or a link or button to one, as RGAA 4.1 requires, and asks about media that have none.

**Applies to.** Applies to every &lt;audio&gt; and &lt;video&gt; in the scan scope that is not hidden by the author. An &lt;audio&gt; without controls is hidden by the browser's own stylesheet but still plays, so for it the check looks at its parent and at its own hidden and aria-hidden attributes, as media-alternative-transcript-evidence does. A page with none is notApplicable.

**Expectation.** The element just before or just after the media in the code (RGAA glossary « Lien ou bouton adjacent »: « juste avant ou juste après l’élément ») is a link or button whose name mentions a transcript, or a block whose text does (a clearly identifiable adjacent transcript, or a block holding the link; a short text that only mentions a transcript, such as « Transcription à venir », is neither, and is asked about as transcriptMentionOnly). Then the media passes the presence step of RGAA 4.1.1, 4.1.2 and 4.1.3. Otherwise it is flagged (cantTell): the transcript may be elsewhere, the media may not need one (decorative, itself an alternative, a CAPTCHA), or a video may meet 4.1.2 or 4.1.3 through audio description instead. The rule never fails.

### `rgaa-meta-redirect-immediate`

**Meta redirects are immediate**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks whether a &lt;meta http-equiv="refresh"&gt; that sends the visitor to another address waits before doing so.

**Applies to.** Applies to a run over a whole document whose first valid &lt;meta http-equiv="refresh"&gt; sends the visitor to another address: its content has a delay and a URL that does not resolve to the page itself. HTML acts only on the first valid meta refresh of a document. A meta refresh that reloads the page is left to rgaa-meta-refresh-no-url-timing (RGAA 13.1.1). A &lt;meta&gt; inside &lt;noscript&gt; is ignored. A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.** A delay of 0 passes: the redirect is immediate (RGAA 13.1.2). Any other delay, however long, is asked about (cantTell) and never failed: 13.1.2 has no 20-hour exception, but a redirect from an obsolete address to the new version of the page is essential, and then the criterion is not applicable (13.1, particular cases). Only a person can tell which case this is.

### `rgaa-meta-refresh-no-url-timing`

**Meta refresh waits 20 hours or more**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that a &lt;meta http-equiv="refresh"&gt; that reloads the page waits at least 20 hours.

**Applies to.** Applies to a run over a whole document whose first valid &lt;meta http-equiv="refresh"&gt; reloads the page itself: its content has a delay and no URL, an empty URL, or the page's own address. HTML acts only on the first valid meta refresh of a document, so later ones are not read. A meta refresh that sends the visitor to another address is a redirect, left to rgaa-meta-redirect-immediate (RGAA 13.1.2). A &lt;meta&gt; inside &lt;noscript&gt; is ignored, as it never applies with scripting on. A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.** The delay is 72000 seconds (20 hours) or more, the last condition of RGAA 13.1.1 (« La limite de temps entre deux rafraîchissements est de vingt heures, au moins »). A shorter delay, 0 included, fails: a meta refresh gives the visitor no way to stop, relaunch or lengthen it, and no warning, which are the other three conditions.

### `rgaa-modal-tab-order`

**Focus stays inside an open modal dialog**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each open dialog marked aria-modal="true" while elements outside it can still take focus, for a person to check that focus stays inside it.

**Applies to.** Applies to each dialog shown as modal by aria-modal="true" (an element with role dialog or alertdialog, or a &lt;dialog&gt;), rendered, and not opened with showModal(), which makes the rest of the page inert. A page with none is notApplicable.

**Expectation.** The 12.8.1 methodology names this case: « l'ordre de tabulation dans une fenêtre modale ne doit considérer que les éléments … au sein de cette fenêtre ». aria-modal="true" tells assistive technologies that the rest of the page is out of reach, but does not stop the Tab key: elements outside the dialog that can take focus (not disabled, no tabindex="-1", not inert, not hidden) are reachable unless a script keeps focus inside the dialog, which only a person can check. The dialog is asked about (cantTell), naming how many such elements there are.

### `rgaa-moving-content-review`

**Moving or blinking content can be controlled**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags content that moves or blinks by itself for more than 5 seconds (marquee, autoplaying video without controls, endless SVG animations, CSS and script animations), for a person to check that it can be stopped, hidden or read without the movement.

**Applies to.** Applies to content that moves or blinks by itself for more than 5 seconds, as the page shows it: a &lt;marquee&gt;; a &lt;video&gt; that plays by itself (autoplay) with no controls attribute; an SVG animation (&lt;animate&gt;, &lt;animateTransform&gt;, &lt;animateMotion&gt;, &lt;set&gt;) repeated indefinitely; and, where the page has a layout, an animation running on visible content when the scan starts (CSS animation, CSS transition or one a script started) that repeats indefinitely or lasts more than 5 seconds. A page with none is notApplicable.

**Expectation.** RGAA 13.8.1 (moving content) and 13.8.2 (blinking content): content triggered automatically lasts 5 seconds or less, or the user can stop and restart it, show and hide it, or see all of its information without the movement. Each case is asked about (cantTell): a script or a button elsewhere in the page may give that control, which only a person can try. A CSS animation of opacity, visibility or colour only is reported as blinking (blinkingAnimation), any other as moving (movingAnimation).

### `rgaa-navigation-systems-review`

**A page that shows fewer than two navigation systems is reviewed**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags a page that shows fewer than two of a navigation menu, a site map link and a search engine, for a person to check that its set of pages offers two of them, unless the site has very few pages or the page is a step of a process.

**Applies to.**

Looks on the page for three of the « systèmes de navigation » of RGAA 12.1.1:

- a navigation menu (glossary « Menu et barre de navigation »: « liste de liens permettant une navigation spécifique dans le site »): a &lt;nav&gt; or role="navigation" holding 3 links or more, or a list of 3 links or more in the page header. A breadcrumb or a pagination (named so by aria-label, aria-labelledby, class or id), links that all point inside the page (skip links) and a menu in the page footer (« les liens de pied de page […] ne sont pas considérés comme un menu de navigation principal ») do not count;
- a site map (glossary « Page plan du site »): a link whose text, label or address says « plan du site », « sitemap » or « site map »;
- a search engine (glossary « Moteur de recherche (interne à un site web) »: « zone donnant accès directement (formulaire) ou indirectement (élément d’interface donnant accès au formulaire) »): a form or role="search" with a search field, or a link or button « Rechercher » / to a search page.

Elements count whether or not they are shown, since a menu or search form is often hidden at one screen width and opened by a button. A page that is a step of a process (a form with payment card fields, or a title that says « étape ») is notApplicable (particular case: « le critère est également non applicable pour les pages […] qui sont le résultat ou une partie d’un processus »). A page with two or more of these is notApplicable too: one page cannot pass 12.1, which is about a whole « ensemble de pages ». A scan of part of a page (a contextSelector or a fragment) is notApplicable, as it cannot see the whole page.

**Expectation.** RGAA 12.1.1: « chaque ensemble de pages vérifie-t-il une de ces conditions » : a menu and a site map, a menu and a search engine, or a search engine and a site map. A page that shows fewer than two may still belong to a set that offers them, or to a site of « un nombre très limité de pages », where the criterion does not apply: it is asked about once (fewerThanTwoSystems, with what was found).

### `rgaa-noscript-alternative-review`

**A &lt;noscript&gt; alternative gives similar content and features**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each &lt;noscript&gt; element with text, for a person to check that it gives content and features similar to those of the script.

**Applies to.** Applies to each &lt;noscript&gt; element in the body whose content holds text. One holding only tags, such as a tracking image or frame, is no alternative and is left out. A page with none is notApplicable.

**Expectation.** RGAA 7.2.1: a script with an alternative passes when « l'alternative entre &lt;noscript&gt; et &lt;/noscript&gt; permet d'accéder à des contenus et des fonctionnalités similaires ». Each &lt;noscript&gt; with text is asked about (noscriptAlternative), for a person to compare it with what the script gives; a message such as « Activez JavaScript » gives neither.

### `rgaa-object-embed-decorative-aria-hidden`

**Decorative image objects and embeds have aria-hidden="true" and no alternative**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that an &lt;object&gt; or &lt;embed&gt; image marked decorative has aria-hidden="true", no aria-labelledby, aria-label or title, and no alternative content inside it.

**Applies to.** Applies to &lt;object&gt; and &lt;embed&gt; elements of an image type (type="image/…") marked decorative: with aria-hidden="true" on the element, or with role="none"/"presentation". One inside a &lt;figure&gt; with a &lt;figcaption&gt; is left out: criterion 1.2 does not apply to an image with a caption (légende). Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

RGAA 1.2.3 (&lt;object&gt;) and 1.2.6 (&lt;embed&gt;): a decorative image has aria-hidden="true" and no text alternative, on itself or its children, and an &lt;object&gt; no text between &lt;object&gt; and &lt;/object&gt;. Fails:

- aria-hidden="true" with an alternative (hiddenImageHasAlternative). If the image is decorative, it breaks 1.2.3 or 1.2.6; if it carries information, hiding it breaks 1.1.6 or 1.1.7. Either way the page fails;
- role="none"/"presentation" without aria-hidden="true" and no content (presentationWithoutAriaHidden): the role marks it decorative, and RGAA asks for aria-hidden="true".

Asks (cantTell): an &lt;object&gt; with role="none"/"presentation", no aria-hidden="true" and content inside it (presentationWithContent): that content may be its alternative.

### `rgaa-object-image-role-img`

**Image objects have role="img" and a text alternative**

automatic · no formal WCAG SC mapping · confidence medium · default severity serious

Checks that each &lt;object type="image/…"&gt; has role="img" and a text alternative (aria-labelledby, aria-label or title), or is followed by a link or button to an alternative content.

**Applies to.** Applies to &lt;object&gt; elements whose type attribute starts with image/ (RGAA 1.1.6 covers "balise &lt;object&gt; avec l'attribut type="image/…"" only; an &lt;object&gt; with another type, or none, is out of scope). An &lt;object&gt; with aria-hidden="true", on itself or an ancestor, or with role="none"/"presentation", is left out: it is marked decorative, which 1.2.3 covers. One that is the only content of a link or a button is left out: its alternative is the control's name, which the glossary « Image porteuse d'information » (notes 1 and 2) sends to Links (6.1), Forms (11.9) or Scripts (7.1). Content hidden with CSS or the hidden attribute is left out too. A page with none is notApplicable.

**Expectation.**

RGAA 1.1.6 passes when one of these holds:

- the &lt;object&gt; has a text alternative (aria-labelledby, aria-label or title) and role="img";
- it is immediately followed by a link or button that gives access to an alternative content;
- a mechanism lets the user replace it with an alternative content.

Passes: role="img" and a text alternative. Fails: no text alternative, no fallback content between &lt;object&gt; and &lt;/object&gt;, and no link or button right after it, when the object has role="img" or certainly carries information (a captioned image, or one that takes focus). Without either, it is asked about (noAlternativeMayBeDecorative): it may be decorative, and then it fails 1.2.3 instead. Asks (cantTell):

- a text alternative without role="img". The test's first condition and step 3 of its methodology ask for both, so the alternative alone does not meet it: an informative image passes only through a link or button right after it or a replacement mechanism, and a decorative one fails 1.2.3, as it keeps an alternative;
- no text alternative, but a link or button right after the &lt;object&gt; (does it lead to an alternative content?);
- no text alternative, but fallback content inside the &lt;object&gt;, which RGAA does not list as a text alternative for 1.1.6.

### `rgaa-office-document-link`

**Downloadable office documents are accessible or have an accessible version**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each link or form that downloads an office document (PDF, Word, OpenDocument, spreadsheet, presentation, EPUB, RTF) for a person to check the document or its accessible version.

**Applies to.** Applies to links (&lt;a href&gt;, &lt;area href&gt;), forms and submit buttons that download an office document. A link qualifies when its `download` filename, the path of its address, or a value in its query string (`/get?file=report.pdf`) ends with an office document extension, when its type attribute names an office MIME type, or when its text, title or aria-label announces a format as a download is announced: in brackets ("Rapport annuel (PDF, 2 Mo)"), next to a file size, or after a separator at its end ("Rapport annuel - PDF"). A form qualifies by its `action`, and a submit button by its `formaction`, read the same way. The extensions are those of the formats RGAA's glossary entry "Version accessible" names: Microsoft Office (.doc, .docx, .docm, .dot, .dotx, .dotm, .xls, .xlsx, .xlsm, .xlsb, .xlt, .xltx, .xltm, .ppt, .pptx, .pptm, .pps, .ppsx, .ppsm, .pot, .potx, .potm), OpenDocument (.odt, .ott, .ods, .ots, .odp, .otp, .odg, .otg), PDF and EPUB, plus .rtf. A page with none is notApplicable.

**Expectation.** Each such link or form is flagged for a person to check one of the conditions of RGAA 13.3.1: the document is accessible, or an accessible version is offered for download or in HTML.

### `rgaa-optgroup-label-not-empty`

**Option group labels are not empty**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that the label attribute of every &lt;optgroup&gt; in a &lt;select&gt; that has one is not empty.

**Applies to.** Applies to every &lt;optgroup&gt; inside a &lt;select&gt; that has a label attribute (RGAA 11.8.3 step 1: « les listes de sélection […] qui possèdent des éléments &lt;optgroup&gt; pourvus d'un attribut label »). An &lt;optgroup&gt; with no label attribute is left to rgaa-optgroup-label-present (11.8.2). Option groups hidden by the default hidden-content policy are not checked. A page with no applicable option group is notApplicable.

**Expectation.** The label is not empty and not only whitespace. RGAA 11.8.3 asks whether the content of the label attribute is relevant, and an empty one names nothing. That is all this rule decides: whether a non-empty label is relevant is for a person.

### `rgaa-optgroup-label-present`

**Option groups have a label**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that every &lt;optgroup&gt; in a &lt;select&gt; has a label attribute.

**Applies to.** Applies to &lt;optgroup&gt; elements inside a &lt;select&gt;. A page with none is notApplicable.

**Expectation.** The &lt;optgroup&gt; has a label attribute (RGAA 11.8.2: « vérifier qu'il possède un attribut label »). An empty or whitespace-only label meets 11.8.2; that it names nothing is a relevance failure under 11.8.3, which this rule does not judge.

### `rgaa-orientation-content-parity`

**Content stays the same in portrait and landscape**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Lays the page out as portrait and as landscape and fails content shown in one orientation and missing from the other, and asks about elements an orientation media query hides when the page cannot be laid out (RGAA 13.9.1).

**Applies to.** Applies to a page whose readable style sheets hold an orientation media condition (`@media (orientation: portrait)` or `landscape`, at any depth, or on the `<style>`, `<link>` or `@import` that holds the rule). A page with none is notApplicable.

**Expectation.**

RGAA 13.9.1 asks that « le contenu proposé reste le même quel que soit le mode d’orientation de l’écran utilisé même si sa présentation et le moyen d’y accéder peut différer ».

- Where the page has a layout (a browser), it is laid out as portrait and as landscape, and the text and image alternatives shown in each are compared, leaving out the text of buttons and disclosure triggers, which is « le moyen d'y accéder ». Content shown in one orientation and hidden in the other, with its text shown nowhere else there, is reported on the outermost element hidden. It fails (CONTENT_MISSING) when it is content in its own right (2 words of 4 characters or more), no menu button or disclosure is shown in that orientation, and no more than a fifth of the hidden block's words are shown there; otherwise its presentation may just differ (a table shown as cards, a menu behind a button, another image alternative), and it is asked about (CONTENT_MAY_DIFFER). It is asked about when what is hidden holds the main content (a "rotate your device" page, which the essential-orientation exception may allow; MAIN_CONTENT_HIDDEN); when a control shown in that orientation opens it, a menu collapsed behind a toggle, since the means of reaching content may differ (CONTENT_BEHIND_CONTROL); and when an element an orientation rule hides has no text to compare (hiddenInOrientation). A short text about the orientation itself ("rotate your device", in the five languages of the pack's messages) shown in one orientation only is not content missing from the other. The page passes when every content shown in one orientation is shown in the other.
- Without a layout (jsdom), each element that a style rule inside an orientation condition hides with `display: none`, `visibility: hidden` or `visibility: collapse` is asked about (hiddenInOrientation).

### `rgaa-page-language-present`

**Page gives a default language**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that the page gives its default language with lang or xml:lang, on &lt;html&gt; or on an ancestor of every text.

**Applies to.** Applies to a run over a whole document with a root &lt;html&gt; element. A run narrowed by contextSelector or engineOptions.fragment is notApplicable.

**Expectation.**

RGAA 8.3.1 accepts either of two conditions: the language (lang and/or xml:lang) is given on the &lt;html&gt; element, or it is given on each text element or on one of its parents. The rule

- passes when &lt;html&gt; has a non-empty lang;
- passes when &lt;html&gt; has a non-empty xml:lang and no lang, on an XHTML 1.1 page or a page parsed as XML, where xml:lang is the attribute the methodology asks for; on any other page it asks (cantTell), because the glossary "Langue par défaut" makes lang mandatory for HTML 4 and HTML5 and requires both attributes for XHTML 1.0 served as text/html, while the test's wording (« lang et/ou xml:lang ») accepts either;
- otherwise, passes when every text in &lt;body&gt; has an ancestor, itself included, whose nearest lang or xml:lang is non-empty, and asks when some of that text depends on xml:lang alone in the same conditions;
- fails when some rendered text in &lt;body&gt; has no language at all, or when no element carries a language.

### `rgaa-page-title-unique`

**Page titles are unique across the site**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Compares the page title with the titles of the site’s other pages, given as the crawl.pageTitles probe, and fails one shared with another page, since RGAA 8.6.1 asks for a title that identifies the page uniquely.

**Applies to.** Applies to a run over a whole document whose &lt;title&gt; has text. A page with no title, or an empty one, is page-title-present's (RGAA 8.5.1) and notApplicable here.

**Expectation.**

RGAA 8.6.1 asks that the title be relevant, and the glossary entry « Titre de page » defines a relevant title as one that identifies the page « de manière claire, concise et unique ». The title is compared, with case and spacing ignored, with the other pages of the site given in the `crawl.pageTitles` probe (`{ pages: [{ url, title }] }`):

- another page, at another path, with the same title fails (TITLE_DUPLICATE);
- another page whose URL differs from this one only by its query string, or by what usually names one page twice (http or https, a leading www., a trailing /index.html or /index.php), with the same title, is asked about, since it may be this same page (TITLE_DUPLICATE_SAME_PATH);
- with no other page to compare, the title is asked about (TITLE_SINGLE_PAGE).

It passes when no other page shares the title.

### `rgaa-page-zones-reachable`

**Each area of the page can be reached or skipped**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that the header, main navigation, main content, footer and search areas each have a landmark, and asks about an area found from its name that relies on a heading, a skip or quick-access link, or a button instead (RGAA 12.6.1).

**Applies to.** Applies to a run over a whole document. RGAA 12.6.1 looks at five areas, where present: header, main navigation, main content, footer and search engine. An area is found from its landmark (banner, navigation, main, contentinfo, search), or, without one, from a name that says what it is: an id or class such as `header`, `nav`, `menu`, `content`, `footer`, `pied-de-page`, or a form with a search field. The main content is always present: a page with no main landmark is asked about. Deciding what counts as an area stays a person's call.

**Expectation.**

RGAA 12.6.1: each area has a landmark matching its nature, a heading that says what it holds, a button just before it that hides it, a skip link just before it, or a quick-access link to it that is visible, at least on focus.

- The rule passes when every area it finds has a landmark matching its nature, and no main content is missing.
- It never fails, since which blocks are areas is a person's call. It asks about an area found from its name, without a landmark: when a heading opens it (whether the heading says what it holds, ZONE_HEADING), a same-page link just before it skips it (ZONE_SKIP_LINK), a button just before it controls it (ZONE_TOGGLE), or a same-page link leads to it (whether that link is visible, ZONE_QUICK_LINK); and when it has none of these (ZONE_NO_MECHANISM). A page with no main landmark is asked about too (MAIN_NOT_FOUND).
- It also asks about each block outside every area it found that holds links to other pages or places (ZONE_UNIDENTIFIED): a header, navigation or footer whose markup names it in no way the rule recognises, which would otherwise leave the page passing unseen. The block is the outermost element around those links that holds no area. Same-page links are left out, since a skip link sits there.

### `rgaa-presentational-attributes-absent`

**Page uses no presentational attributes**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that no HTML element carries one of the presentational attributes RGAA lists, such as align, bgcolor or border.

**Applies to.** Applies to any scan scope; whether an HTML element in it carries one of the attributes RGAA 10.1.2 lists is always an answerable question.

**Expectation.** No HTML element carries align, alink, background, bgcolor, border, cellpadding, cellspacing, char, charoff, clear, color, compact, frameborder, hspace, link, marginheight, marginwidth, text, valign, vlink or vspace; size is allowed only on &lt;select&gt;, and width and height only on &lt;img&gt;, &lt;object&gt;, &lt;embed&gt;, &lt;canvas&gt; and &lt;svg&gt;. That is RGAA 10.1.2's list as written, so width and height on an &lt;iframe&gt; or a &lt;video&gt;, and size on an &lt;input&gt;, are reported too. Width and height on a &lt;source&gt; in a &lt;picture&gt; are allowed like those on &lt;img&gt;: they give the dimensions of that image candidate, which HTML added in 2021, after RGAA's list was written; this is the pack's reading of a list that predates them. On any other &lt;source&gt; they are reported. One occurrence per element, naming every such attribute it carries.

### `rgaa-presentational-elements-absent`

**Page uses no presentational elements**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that the page contains none of the presentational elements RGAA lists, such as &lt;font&gt;, &lt;center&gt; or &lt;big&gt;.

**Applies to.** Applies to any scan scope; whether it contains one of the elements RGAA 10.1.1 lists is always an answerable question.

**Expectation.** None of &lt;basefont&gt;, &lt;big&gt;, &lt;blink&gt;, &lt;center&gt;, &lt;font&gt;, &lt;marquee&gt;, &lt;s&gt;, &lt;strike&gt; or &lt;tt&gt; is present, and &lt;u&gt; is not present either unless the document has the HTML5 doctype, which gave &lt;u&gt; a meaning of its own. That is RGAA 10.1.1's list as written: it includes &lt;s&gt;, which HTML5 keeps.

### `rgaa-quotation-review`

**Quotations use &lt;q&gt; or &lt;blockquote&gt;**

manual · no formal WCAG SC mapping · confidence high · default severity minor

Flags paragraphs and passages of 8 words or more in quotation marks outside &lt;q&gt; and &lt;blockquote&gt;, for a person to check whether they are quotations and, if so, mark them up with &lt;q&gt; or &lt;blockquote&gt;.

**Applies to.** Applies to visible text that looks like a quotation not marked up as one: a paragraph or other block whose whole text is in quotation marks (« … », “…”, "…", „…“), or a passage of running text in « … » or “…”, of 8 words or more and outside &lt;q&gt;, &lt;blockquote&gt; and &lt;cite&gt;. French uses « » for titles, terms and names too, so shorter passages are left out, as are link text, headings, code, scripts, styles and form controls. A page with none is notApplicable.

**Expectation.** RGAA 9.4: « Dans chaque page web, chaque citation est-elle correctement indiquée ? ». 9.4.1: « chaque citation courte utilise-t-elle une balise &lt;q&gt; ? »; 9.4.2: « chaque bloc de citation utilise-t-il une balise &lt;blockquote&gt; ? ». A block in quotation marks is asked about as a possible block quotation (quotedBlock, 9.4.2), a passage in running text as a possible short quotation (quotedPassage, 9.4.1), one occurrence per element: whether the text quotes someone is for a person.

### `rgaa-radio-group-present`

**Radio buttons sharing a name are grouped**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags a set of radio buttons with the same name that is not inside one fieldset, role="group" or role="radiogroup", for a person to decide whether it needs grouping.

**Applies to.** Applies to sets of two or more &lt;input type="radio"&gt; with the same name in the same form (or outside any form). A page with none is notApplicable. When every set is grouped, the rule passes; under a scoped scan it reports notApplicable instead, since a set can reach past the scanned part of the page (ENGINE_OPTIONS.md, "What a scoped result means").

**Expectation.** Every radio button of the set sits in one &lt;fieldset&gt;, role="group" or role="radiogroup" element, one of the ways RGAA 11.5.1 accepts. That element need not be the closest group around each radio: an outer fieldset holding every radio of the set groups them even when inner groups split them. A set that is not is flagged: 11.5.1 applies "si nécessaire", so a person decides whether this set needs grouping.

### `rgaa-required-field-indication`

**Required fields show a required indication in their label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks each required field of a form with two or more fields: fails one whose visible label and linked passages show no required indication, or whose « * » is explained only after its first use or never; asks where an icon, a legend or styles may carry it.

**Applies to.** Applies to the fields of each form (a &lt;form&gt; or role="form", glossary « Formulaire ») that has at least two fields and does not mark its optional fields as such in their labels or legends (« facultatif », « optionnel »), a field's label being its &lt;label&gt; or the passage its aria-labelledby points to: the 11.10 particular case makes 11.10.1 and 11.10.2 not applicable then. Radio buttons of one name count as one field. Fields hidden from view are left out. A page with none is notApplicable.

**Expectation.**

- 11.10.2: a field with `required` or aria-required="true" shows a required indication (glossary « Indication de champ obligatoire »: text such as « obligatoire », or a sign such as « * ») visibly in its label or in a passage of text linked by aria-labelledby or aria-describedby. With a visible label, no indication in it or in those passages, none next to the field, and no image, icon or generated content that could be one, it fails (requiredNotIndicated). A sentence such as « tous les champs sont obligatoires » not linked to the field does not make up for it (allFieldsRequiredSentence): the particular case of 11.10 keeps the test applicable when all the fields are required. Linked by aria-describedby or aria-labelledby, the sentence is an indication in a linked passage, and passes. An indication found only next to the field, in a placeholder or a legend, an image or an icon, or a label hidden from view, is asked about (cantTell), as is a sentence with an exception (« sauf mention contraire »), which says optional fields are marked in some way the rule may not read (allFieldsRequiredWithException).
- Glossary note: a sign such as « * » must be explained « visuellement et dans l'ordre du code source, avant la première utilisation ». When the page explains it only after the first field that uses it, that field fails (markerExplainedAfter). When the page never explains it, a field with `required` or aria-required="true" fails (markerNotExplained) and any other is asked about, since the sign may not mean "required" there.

### `rgaa-role-img-aria-name`

**Elements with role="img" are named with aria-labelledby or aria-label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each exposed element with role="img" (other than &lt;img&gt; and an outer &lt;svg&gt;) has a text alternative from aria-labelledby or aria-label, the two sources RGAA accepts.

**Applies to.** Applies to elements whose role attribute starts with the token img, except &lt;img&gt; (RGAA lists its own sources for it) and an outer &lt;svg&gt; (RGAA test 1.1.5, see rgaa-svg-role-img and svg-text-alternative-present). An element with aria-hidden="true", on itself or an ancestor, is left out: the glossary entry "Image de décoration" says an element with role="img" is decorative only with aria-hidden="true". Content hidden with CSS or the hidden attribute is left out too, and so is an element that is the only content of a link or a button: its alternative is the control's name, which the glossary « Image porteuse d'information » (notes 1 and 2) sends to Links (6.1), Forms (11.9) or Scripts (7.1). A page with none is notApplicable.

**Expectation.** The element has a text alternative from one of the two sources RGAA 1.1.1 step 4 lists for role="img": text referenced by aria-labelledby, or a non-empty aria-label. A name that comes only from the title attribute, or no name at all, fails: the glossary entry "Alternative textuelle (image)" lists title for &lt;img&gt;, &lt;input type="image"&gt;, &lt;object&gt; and &lt;embed&gt; only. An element in the SVG namespace (a &lt;g role="img"&gt;, for example) named by a &lt;title&gt; child passes: since RGAA 4.1.2 the glossary entry "Alternative textuelle (image)" counts an SVG's &lt;title&gt; as its alternative, and 1.1.5 step 5 lists it.

### `rgaa-same-name-checkboxes-review`

**Sets of checkboxes and custom radio buttons are grouped if needed**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

Flags three or more checkboxes sharing a name, or two or more role="radio" elements in one parent, that are not inside a fieldset or a role="group" (or, for radios, role="radiogroup"), for a person to decide whether they need grouping.

**Applies to.** Applies to sets of three or more visible &lt;input type="checkbox"&gt; with the same name in the same form (or outside any form), and to sets of two or more visible elements with role="radio" (native radio buttons left out) that share a parent element. A page where every such set is grouped, or with none, is notApplicable.

**Expectation.** RGAA 11.5.1: « Les champs de même nature sont regroupés dans une balise &lt;fieldset&gt; », « dans une balise possédant un attribut WAI-ARIA role="group" », and, for radios (role="radio" included), « dans une balise possédant un attribut WAI-ARIA role="radiogroup" ou role="group" », « si nécessaire ». The glossary « Champs de même nature » names « un ensemble de boutons radio ou de cases à cocher qui se rapportent à une question » and adds that they « doivent être regroupés lorsque les intitulés de label ne sont pas suffisants ». A set with no common group is asked about (ungroupedCheckboxes, ungroupedRadios), since only a person can tell whether its labels are enough.

### `rgaa-script-button-name-present`

**Buttons outside a form have a name**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that each button outside a form, a component only a script can drive, has a name that RGAA 7.1.3 can judge.

**Applies to.** Applies to buttons (&lt;button&gt;, &lt;input&gt; of type submit, reset, button or image, and role="button") outside any form: no &lt;form&gt; or role="form" ancestor, and no form attribute naming one. Such a button does nothing unless a script drives it, so it is a component a script controls (glossary « Composant d'interface », RGAA 7.1). Buttons in a form are left to rgaa-form-button-name-present (11.9.1). A button hidden from assistive technologies, or whose explicit role is another one, is out of scope. A page with no such button is notApplicable.

**Expectation.** RGAA 7.1.3: « Le composant possède un nom pertinent ». Unlike 7.1.1, the test offers no alternative. A button with no name at all (no aria-labelledby, aria-label, content, value, alt or title) has none to be relevant and fails (nameMissing). An &lt;input type="image"&gt; with no alt, aria-label, aria-labelledby or title, which the browser names with a generic "Submit", is asked about (imageButtonNoAlt). Whether a name is relevant is left to a person.

### `rgaa-script-redirect-review`

**A timed redirection done by a script can be controlled**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each inline script that loads another address from a timer, for a person to check that the user can stop, extend or be warned of the redirection.

**Applies to.** Applies to inline &lt;script&gt; elements whose code loads another address from a timer: setTimeout or setInterval followed, within a few hundred characters, by an assignment to location or location.href, or a call to location.assign or location.replace. A page with none is notApplicable.

**Expectation.** RGAA 13.1.3: each redirection done by a script lets the user stop or restart it, extend its time limit ten times at least, or be warned with twenty seconds to extend it, unless the limit is twenty hours or more. A timed redirection is asked about (timedScriptRedirect), for a person to check which of these holds.

### `rgaa-scripted-components-review`

**Scripted components are compatible with assistive technologies**

manual · no formal WCAG SC mapping · confidence medium · default severity moderate

On a page with script, asks a person to check every scripted component against RGAA 7.1 (name, role, value, settings and state changes exposed and rendered by assistive technologies, a name that contains the visible label), and lists the elements in the markup that look like scripted components as a starting point.

**Applies to.** Applies to every page that contains script, in the scanned document or any open shadow root inside it: an executable &lt;script&gt; element, an inline event handler attribute (onclick and the like) on any element, a href, src, action or formaction starting with "javascript:", or a custom element (a tag name with a hyphen, which only works through script). A page with none of these is notApplicable: RGAA 7.1 asks about scripts, and with no script nothing can create or drive a custom component.

**Expectation.** Always cantTell on a page with script, never pass or fail. One occurrence at the scan root asks a person to check that every scripted component exposes its name, role, value, settings and state changes to assistive technologies (RGAA 7.1.1), is rendered correctly by them (7.1.2) and has a relevant name and role, with a name that contains its visible label (7.1.3), or that an accessible alternative exists. Behaviour attached from script files (addEventListener) cannot be seen in the markup, so this question stands even when nothing else is listed. After it, one occurrence per candidate element found in the markup, as a starting list for the auditor, never a complete one.

### `rgaa-select-fake-groups-review`

**Options are grouped with &lt;optgroup&gt;, not with fake heading options**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each &lt;select&gt; without &lt;optgroup&gt; whose options include disabled or dash-framed headings, for a person to check whether the items should be grouped with &lt;optgroup&gt;.

**Applies to.** Applies to &lt;select&gt; elements with no &lt;optgroup&gt; that hold an option used as a group heading: two disabled options or more after the first one (a single one is often an item out of stock), or an option whose text is framed by dashes or similar signs (« -- Europe -- », « === Fruits === »). The first option, often a « Choisissez » placeholder, is left out. A page with none is notApplicable.

**Expectation.** RGAA 11.8.1: « les items de même nature d'une liste de choix sont-ils regroupés avec une balise &lt;optgroup&gt;, si nécessaire ? » A fake heading option shows that the author grouped the items visually; assistive technologies read it as one more choice. Whether grouping is needed is for a person, so the list is asked about (fakeGroupHeading).

### `rgaa-skip-link-placement`

**Skip links are visible and at the same place on every page**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Checks that the link to the main content is visible, at least when it takes focus, and that the site’s other pages show it at the same place and in the same focus order (RGAA 12.7.2).

**Applies to.** Applies to a run over a whole document that has a skip link: a same-page link outside the main content zone (the first visible &lt;main&gt;, or failing one a visible role="main") whose target is &lt;main&gt;, or an element inside or just before it with no navigation block, link or other focusable element in between, as rgaa-skip-link-present recognises one. A page without one is notApplicable here: rgaa-skip-link-present reports it, and skip-link a link that does not work.

**Expectation.**

RGAA 12.7.2, conditions 1 to 3: the link sits at the same place in the presentation, comes in the same relative order in the source, and is visible or, failing that, visible when it takes focus.

- Visibility needs a layout (a browser). A link that is not visible at rest is focused, as by the keyboard, with transitions held off on the whole page, and measured again. It fails when it is still not visible: no size, outside the page, clipped by an ancestor, fully transparent or `visibility: hidden` (SKIP_LINK_NOT_VISIBLE). It is asked about when something may cover it, or an animation runs on it or an ancestor once it has focus (SKIP_LINK_VISIBILITY_UNKNOWN). Without a layout (jsdom) visibility is always asked about.
- Place and order need the site's other pages, through the `crawl.skipLinks` probe, and 12.7.2 compares only the pages of one « ensemble de pages » (the home page may be one on its own). The link fails when another page of its ensemble measured at the same viewport width shows it more than 24 CSS pixels to the side (SKIP_LINK_POSITION_DIFFERS). Moved only up or down, it is asked about (SKIP_LINK_POSITION_SHIFTED): content above it on one page, a cookie banner or a message, pushes it down without moving it in the layout, which the measured boxes cannot tell from a link placed elsewhere. The probe names this page's ensemble in `ensemble`, and each other page's in its record: a page of another ensemble is not compared, and when the names are missing a difference to the side is asked about (SKIP_LINK_POSITION_MAY_DIFFER). It is asked about when its focus order differs (SKIP_LINK_ORDER_DIFFERS), since what the order is relative to is a person's call; when no other page was measured at the same width (SKIP_LINK_VIEWPORT_DIFFERS); and when the probe brings no other page with a skip link (SKIP_LINK_SINGLE_PAGE).

It passes when it is visible, at least on focus, and every other page shows it at the same place and in the same focus order.

### `rgaa-skip-link-present`

**Pages have a skip link to the main content**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a page with navigation before its main content has a working same-page link to that content.

**Applies to.** Applies to a run over a whole document. RGAA 12.7.1 step 1 finds the main content zone through the visible &lt;main&gt; element; the rule takes the first one, or, failing one, a visible role="main". With neither, the rule asks a person to locate the zone, unless the page has no link and no navigation block, which is notApplicable. A run narrowed by contextSelector or engineOptions.fragment is notApplicable, and so is a document shown in a frame. While a modal dialog is open the rest of the page is inert, so only a skip link to the content whose target does not exist is judged (it fails); without one the rule is notApplicable.

**Expectation.**

A same-page link outside the main content zone leads to it: its fragment resolves to &lt;main&gt;, to an element before it with no navigation block, link or other focusable element between that element and the start of the zone, or to an element inside it with nothing focusable before it in the zone but navigation blocks (a breadcrumb at the top of &lt;main&gt; is part of the zone, and the link still reaches it). RGAA 12.7.1 accepts a skip link just before the zone or a quick-access link to it; a main landmark or headings alone do not count. The rule fails:

- when a navigation block (&lt;nav&gt; or role="navigation") comes before the main zone and no link leads to it; the 12.7 particular case, a one-page site, turns on the presence of navigation, so with navigation the link is needed;
- on a skip link whose target does not exist, whether or not the page has navigation.

A link whose target does not exist fails as a broken skip link only when its name or fragment says it leads to the content (« contenu », content, main, principal…); a broken first link that names something else (cookie settings, a menu) is no skip link to the content. It asks instead of failing when no navigation block comes before the main zone and no link leads to it (a one-page site may not need one), and on a skip link whose target exists but is hidden, sits before the zone with links or other focusable elements, but no navigation block, between the two, or sits inside the zone after links or other focusable elements outside navigation, and on a link to the content whose target lies before a navigation block that precedes the zone (a wrapper around a section menu and &lt;main&gt;). A skip link to a target inside navigation, after the zone, or with navigation between it and the zone leads elsewhere (to a menu, a search form, the footer) and does not count. A working skip link inside aria-hidden="true" is asked about (skipLinkAriaHidden): it works with the keyboard, but screen reader users cannot find it.

### `rgaa-status-message-review`

**Status messages use role="status", "alert", "log" or "progressbar"**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags elements that look like status messages (aria-live, or a class such as alert, message or error) with no status, alert, log or progressbar role, for a person to check the role they need.

**Applies to.**

Applies to visible elements that look like status messages and carry none of the roles 7.5 names (status, alert, log, progressbar):

- an element with aria-live, which shows the author meant it to be announced (liveWithoutRole);
- an element whose class or id names a message (alert, message, notification, notice, toast, flash, success, error, warning, feedback), holding a short text of 40 words or less (possibleStatusMessage).

An element inside one with such a role is left out. A page with none is notApplicable.

**Expectation.** RGAA 7.5.1 to 7.5.3: a status message telling of a success, a result or a state uses role="status"; one with a suggestion or an error, role="alert"; one with a progress, role="log", "progressbar" or "status". The methodology also accepts aria-live with aria-atomic="true", polite for a status and assertive for an alert, and aria-live="polite" for a log, which depends on what the message says. Whether the element is a status message (glossary « Message de statut »: a change in the content that informs the user without a change of context) is for a person, so each one is asked about.

### `rgaa-svg-decorative-aria-hidden`

**Decorative SVGs are hidden with aria-hidden="true"**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks each &lt;svg&gt; exposed to assistive technologies that may be decorative: fails one marked role="presentation" without aria-hidden="true", and asks about the others.

**Applies to.** Applies to outer &lt;svg&gt; elements exposed to assistive technologies: no aria-hidden="true" on themselves or an ancestor, no role="img" or graphics role, that draw something of their own (not a sprite sheet of &lt;defs&gt; and &lt;symbol&gt;), and that may be decorative: not the only content of a link or a button, not focusable themselves (tabindex 0 or more), and not in a &lt;figure&gt; with a &lt;figcaption&gt; (criterion 1.2 does not apply to an image with a caption). Content hidden with CSS or the hidden attribute is left out. A page with none is notApplicable.

**Expectation.**

RGAA 1.2.4 asks a decorative &lt;svg&gt; for aria-hidden="true", and for no alternative, no non-empty &lt;title&gt; or &lt;desc&gt;, and no title attribute.

- An &lt;svg&gt; with role="presentation" or role="none" fails (presentationWithoutAriaHidden): the author marks it decorative, and unlike 1.2.1 for &lt;img&gt;, 1.2.4 accepts only aria-hidden="true".
- Any other is asked about (cantTell): if it is decorative, such as an icon beside a button's text, it fails 1.2.4; if it carries information, 1.1.5 applies instead, which rgaa-svg-role-img and svg-text-alternative-present check. The 1.2.x methodology leaves that call to a person.

### `rgaa-svg-hidden-no-alternative`

**Hidden decorative SVGs carry no text alternative**

automatic · no formal WCAG SC mapping · confidence high · default severity minor

Checks that an &lt;svg&gt; with aria-hidden="true" has no aria-label, aria-labelledby, title attribute, or non-empty &lt;title&gt; or &lt;desc&gt;.

**Applies to.** Applies to &lt;svg&gt; elements with aria-hidden="true", outer ones only, that draw something of their own. A sprite sheet, an &lt;svg&gt; whose children are only &lt;defs&gt;, &lt;symbol&gt;, &lt;title&gt;, &lt;desc&gt;, &lt;style&gt; and other elements that are never drawn, is no image (glossary « Image de décoration »): its symbols are checked where a &lt;use&gt; draws them. A page with none is notApplicable.

**Expectation.** Neither the &lt;svg&gt; nor anything in it has an aria-label, aria-labelledby or title attribute with text, and any &lt;title&gt; or &lt;desc&gt; in it is empty (RGAA 1.2.4). aria-hidden="true" marks the SVG decorative, so it fails 1.2.4. If it in fact carries information, hiding it breaks 1.1.5 instead, which img-alt-decorative asks about: the SVG fails one of the two criteria, not both. Content drawn through &lt;use href="#id"&gt; (or xlink:href) counts as the SVG's own: the note of RGAA criterion 1.2 says 1.2.4 also applies to the &lt;svg&gt; or &lt;symbol&gt; a &lt;use&gt; element points to. Only same-document references are followed, recursively; an external file is not fetched.

### `rgaa-svg-role-img`

**SVGs with a text alternative have role="img"**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that an &lt;svg&gt; named by aria-labelledby, aria-label or &lt;title&gt; has role="img".

**Applies to.** Applies to outer &lt;svg&gt; elements that carry a text alternative: text referenced by aria-labelledby, a non-empty aria-label, or a non-empty &lt;title&gt; child. An &lt;svg&gt; with aria-hidden="true", on itself or an ancestor, is left out (rgaa-svg-hidden-no-alternative checks it), and so is content hidden with CSS or the hidden attribute. An &lt;svg role="img"&gt; with no alternative at all is left to svg-text-alternative-present. An &lt;svg&gt; that is the only content of a link or a button is left out: its alternative is the control's name, which the glossary « Image porteuse d'information » (notes 1 and 2) sends to Links (6.1), Forms (11.9) or Scripts (7.1). A page with none is notApplicable.

**Expectation.** The &lt;svg&gt; has role="img" (RGAA 1.1.5 step 3; step 4: "Si ce n'est pas le cas, le test est invalidé"), and has an alternative from one of the sources step 5 lists: the content of its &lt;title&gt;, aria-labelledby or aria-label. An alternative without role="img" fails when the SVG certainly carries information: it has a caption (a &lt;figure&gt; with a &lt;figcaption&gt;), or it takes focus itself (tabindex 0 or more). Otherwise it is asked about (cantTell): an icon beside a button's text is decorative, and then it fails 1.2.4 instead, which requires aria-hidden="true" and no alternative; the 1.1.5 methodology leaves that call to a person (« déterminer si l'image est porteuse d'information »). An &lt;svg role="img"&gt; named by its &lt;title&gt; alone passes: RGAA 4.1.2 added "Contenu de l'élément &lt;title&gt;" to step 5 (notes de révision 4.1 vers 4.1.2).

### `rgaa-table-title-adjacent`

**A heading just before a data table is tied to it if it is its title**

manual · no formal WCAG SC mapping · confidence high · default severity moderate

Flags each data table with no caption or name that comes right after a heading, for a person to check whether the heading is the table's title and should be tied to it.

**Applies to.** Applies to visible data tables (a &lt;table&gt; with a &lt;th&gt;, not role="presentation" or "none") with no &lt;caption&gt;, title, aria-label or aria-labelledby, whose previous element is a heading (&lt;h1&gt;-&lt;h6&gt;, or role="heading"). A page with none is notApplicable.

**Expectation.** RGAA 5.4.1: « Pour chaque tableau de données ayant un titre, le titre est-il correctement associé au tableau de données ? » A heading right before the table may be the table's title, given as plain text and not tied to it, or the title of the section the table belongs to: a person decides (adjacentHeading). If it is the table's title, a &lt;caption&gt; or aria-labelledby ties it.

### `rgaa-text-direction-marked`

**Text in the other reading direction is marked with dir**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Fails Hebrew, Arabic or other right-to-left script of two letters or more in a left-to-right context, and left-to-right text of three words or more in a right-to-left context, with no dir attribute around it, a &lt;bdi&gt; included; asks about a single letter and shorter left-to-right text.

**Applies to.** Applies to visible text whose strong characters read in the direction opposite to that of its context: right-to-left letters (Hebrew, Arabic, Syriac, Thaana, NKo and related blocks) where the direction is left to right, or other letters where it is right to left. The context is the nearest ancestor whose dir is ltr or rtl, and left to right with none (glossary « Sens de lecture »: « le sens de lecture par défaut est de gauche à droite »). Text under dir="auto" is left to rgaa-dir-attribute-valid; code, scripts and styles are left out. A page with none is notApplicable.

**Expectation.**

RGAA 8.10.1: « chaque texte dont le sens de lecture est différent du sens de lecture par défaut est contenu dans une balise possédant un attribut dir ». The test has no exception for short text, and its methodology names the passages « qui utilisent une langue qui se lit dans le sens inverse de la langue du document (comme l'arabe ou l'hébreu pour le français) ». It fails, with no dir between the text and its context:

- directionNotMarked: a run of right-to-left script (Hebrew, Arabic, Syriac, Thaana, NKo…) with two letters or more in a left-to-right context, as a whole element or inside other text, whatever its length (« العربية » in a language menu, « شكرا » quoted in a sentence): those scripts write only languages read right to left, so such a run is words of one. Also a text of three words or more that reads left to right in a right-to-left context;
- bdiWithoutDir: the same text inside a &lt;bdi&gt; with no dir: browsers isolate it, but RGAA asks for a dir attribute, which a &lt;bdi&gt; does not replace.

It asks (cantTell) where the characters may not be words of such a language, as a whole element (shortText) or a run inside other text (shortRun): a right-to-left run with fewer than two letters (a single letter, Arabic-Indic digits, a sign of those blocks such as ﷼), Arabic Mathematical Alphabetic Symbols (U+1EE00 to U+1EEFF), or a left-to-right run of one or two words in a right-to-left context (a brand name, an acronym). Text with no letter at all (Western digits, punctuation) is not looked at.

### `rgaa-text-image-review`

**Images of text that carry information are replaced by styled text where possible**

manual · no formal WCAG SC mapping · confidence high · default severity minor

Flags image buttons, images in headings and images named like text or banners, outside logos, for a person to check whether they show text that styled text could replace.

**Applies to.** Applies to visible images that likely show text (glossary « Image texte »), with a text alternative, so informative: an image button (&lt;input type="image"&gt;), an image inside a heading, and an &lt;img&gt; or role="img" whose file name, class or id names text, a title, a banner or a button (texte, text, titre, title, bandeau, banner, slogan, bouton, button, btn). Logos and brand names are left out (1.8's particular case): an image whose alternative, file name, class or id, or that of an ancestor, says logo, marque or brand. A page with none is notApplicable.

**Expectation.** RGAA 1.8.1 and 1.8.2: each informative image of text, « en l’absence d’un mécanisme de remplacement, doit si possible être remplacée par du texte stylé ». Whether the image holds text, whether a replacement mechanism exists, and whether its rendering is essential are for a person, so each such image is asked about (imageButton, imageInHeading, textImageName), one occurrence per element.

### `rgaa-th-association-present`

**Table headers have an id, a scope or a header role**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Fails a &lt;th&gt; with no id, scope or header role in a table with headers on both axes; asks about other tables whose headers have none.

**Applies to.** Applies to the &lt;th&gt; elements with text of tables that are not presentation tables (role="presentation" or "none"). A page with none is notApplicable.

**Expectation.**

RGAA 5.7.1: each &lt;th&gt; « s'appliquant à la totalité de la ligne ou de la colonne » has a unique id, a scope, or role="rowheader" or "columnheader".

- In a table with headers on both axes (a first row of &lt;th&gt; and rows that start with a &lt;th&gt; followed by &lt;td&gt;) and no rowspan or colspan, each &lt;th&gt; with none of the three fails (noAssociation): such a header covers a whole row or column, and the shape leaves no doubt.
- A table whose headers all sit in a single row or a single column passes: criterion 5.7's particular case lets such headers be &lt;th&gt; without scope.
- Elsewhere, the table is asked about once (noAssociationSimple): with spans, or headers that do not line up as a first row and first column, a header may cover only part of a row or column, which 5.7.1 leaves to 5.7.3.

### `rgaa-th-scope-row-col`

**Table headers use scope="row" or scope="col", the right one**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that every &lt;th&gt; with a scope attribute uses scope="row" or scope="col", which RGAA requires, and that the value matches whether the header heads a row or a column.

**Applies to.** Applies to every &lt;th&gt; with a scope attribute, except in a &lt;table&gt; with role="presentation" or role="none", which is not a data table. Headers hidden by the default hidden-content policy are not checked. A page with none is notApplicable.

**Expectation.**

RGAA gives a &lt;th&gt; two choices. A header over a whole row or column that has a scope uses scope="row" or scope="col" (5.7.2). A header over only part of a row or column has no scope, no role="rowheader" or "columnheader", and a unique id (5.7.3); the glossary « En-tête de colonne ou de ligne » adds that only a &lt;th&gt; can be used then. So:

- a scope other than row or col (rowgroup, colgroup, a misspelt or empty value) fails (otherScope): the header fails 5.7.2 if it covers a whole row or column, and 5.7.3 if it covers part of one;
- a scope pointing the wrong way fails (wrongAxis): scope="col" on the first cell of a body row whose other cells are &lt;td&gt;, under a first row of &lt;th&gt; only (a row header), and scope="row" on a cell of a first row of &lt;th&gt; only, above rows that start with a &lt;td&gt; (a column header). A table with a rowspan or colspan is left out of this check, since the cells' places are then a person's call.

### `rgaa-title-placeholder-identical`

**A form field's title and placeholder are identical**

automatic · no formal WCAG SC mapping · confidence medium · default severity moderate

Asks about form fields whose title and placeholder are both present but differ: RGAA's glossary entry "Étiquette de champ de formulaire" requires them to be identical.

**Applies to.** Applies to &lt;input&gt; and &lt;textarea&gt; fields that carry both a non-empty title and a non-empty placeholder. Only these fields show a placeholder; the attribute does nothing elsewhere. A hidden field, or a page with no such field, is notApplicable.

**Expectation.** RGAA's glossary entry "Étiquette de champ de formulaire" says that a placeholder « est susceptible d'être restitué à la place de l'attribut title » and that « lorsque ces deux attributs title et placeholder sont présents, ils doivent être identiques ». A field whose two values are the same once whitespace is collapsed passes.

### `rgaa-tooltip-review`

**Content shown on hover or focus can be dismissed, hovered and stays visible**

manual · no formal WCAG SC mapping · confidence high · default severity minor

Flags author tooltips and popovers (role="tooltip", or a tooltip library attribute), for a person to check that what they show can be dismissed with Escape, hovered, and stays until the pointer or focus leaves.

**Applies to.** Applies to author tooltips and popovers: an element with role="tooltip", and a visible element with a tooltip library's attribute (data-tooltip, data-tippy-content, data-balloon, or data-toggle / data-bs-toggle set to "tooltip", or to "popover" with a hover or focus trigger, since a popover otherwise opens on click). A role="tooltip" referenced by aria-describedby or aria-labelledby is reported on the element that references it. The title attribute is left out: 10.13's particular case makes content « contrôlé par l’agent utilisateur (par exemple, attribut title) » not applicable. A page with none is notApplicable.

**Expectation.** RGAA 10.13: content that appears on hover or focus can be hidden by the user without moving the pointer or the focus (10.13.1), can be hovered without disappearing (10.13.2), and stays visible until the pointer or focus leaves, the user hides it, or it is no longer valid (10.13.3). Each is behaviour a script decides, so every tooltip is asked about, once per test, so that each answer is filed under its own test: tooltipRoleDismiss, tooltipRoleHover and tooltipRolePersist for a role="tooltip" (10.13.1, 10.13.2, 10.13.3), and the same for a library attribute (tooltipAttribute…).

### `rgaa-valid-lang`

**Language code of a change of language is valid**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that the language code of lang on elements other than &lt;html&gt; is a valid ISO 639 code (RGAA 8.8).

**Applies to.** The same elements as valid-lang: an element other than &lt;html&gt; with a non-empty lang attribute and text (or an alt) whose language it sets.

**Expectation.** The language code, which the RGAA glossary "Code de langue" defines as the part before the first hyphen, is an ISO 639-1, ISO 639-2 or later ISO 639 code (8.8.1 step 2, « conforme à la norme ISO 639-1 ou ISO 639-2 et suivantes »). The only difference from valid-lang: the three-letter ISO 639-2 and 639-3 codes of languages that have a two-letter one (fra, fre, eng, ger…), which the IANA registry leaves out, and the qaa to qtz range ISO 639-2 reserves for local use, pass here and fail there. Whether the code names the right language (« pertinent ») is for a person.

### `rgaa-video-captions-track-kind`

**Video caption tracks use kind="captions"**

automatic · no formal WCAG SC mapping · confidence high · default severity moderate

Checks that a &lt;video&gt; with text tracks has at least one &lt;track kind="captions"&gt;, not only subtitles, and asks when its subtitles may be translations.

**Applies to.** Applies to &lt;video&gt; elements with at least one &lt;track&gt; child with a non-empty src carrying text for the video: kind="subtitles", kind="captions", no kind at all, which HTML reads as subtitles, or a kind HTML does not know (kind="caption"), which it reads as metadata. A track with no src delivers nothing and is ignored. A page with none is notApplicable.

**Expectation.**

At least one of those tracks has kind="captions" (RGAA 4.3.2). When the only tracks are subtitles:

- fail when a track has a kind HTML does not know, such as kind="caption": HTML makes it metadata, which is never shown;
- fail when a subtitles track has a srclang in the language of the video, as the lang attribute of the &lt;video&gt; itself gives it (primary subtag), or a label that names captions (« sourds et malentendants », SME, SDH, CC): it is captions that do not say so;
- cantTell otherwise: the track may be a translation, which is not a caption track (glossary « Sous-titres synchronisés », note 2), and then 4.3.2 does not apply and the question is 4.3.1's. The page's language is no evidence of the audio's: an English talk with French subtitles on a French page is a translation.

### `rgaa-viewport-zoom-review`

**Text can reach 200% zoom despite a viewport meta tag that limits zoom**

manual · no formal WCAG SC mapping · confidence medium · default severity serious

Flags a &lt;meta name="viewport"&gt; that disables zoom or caps it below 200%, for a person to check that text still reaches 200% with the browser text zoom, the browser graphic zoom or a zoom control of the site.

**Applies to.** Applies to &lt;meta name="viewport"&gt; elements whose content sets user-scalable or maximum-scale to a value that disables or limits zoom: user-scalable other than yes, device-width, device-height or a number outside -1 to 1; maximum-scale from 0 up to (not including) 2, or a value that does not parse. These are the values meta-viewport-zoom-enabled fails. A page with no such tag is notApplicable. The check is whole-document: notApplicable when the scan is scoped to part of the page.

**Expectation.** Always cantTell on such a tag, never pass or fail. RGAA 10.4.2 is met when text can be enlarged to 200% by any one of: the browser's text zoom, its graphic zoom, or a zoom control provided by the site (« selon une de ces conditions »). The viewport meta tag acts only on pinch zoom, which desktop browsers do not use, so whether it stops all three depends on the test environment. A person checks them.

### `rgaa-widget-label-in-name`

**The accessible name of a scripted component contains its visible label**

automatic · no formal WCAG SC mapping · confidence high · default severity serious

Checks that an element with an ARIA widget role (tab, menu item, tree item, grid cell, option), or a button outside a form, has an accessible name that contains its visible label, as RGAA 7.1.3 requires.

**Applies to.** Applies to elements with an explicit ARIA widget role that is neither a link, a button nor a form field (tab, menuitem, menuitemcheckbox, menuitemradio, treeitem, gridcell, option), and to buttons outside a form, whose visible text (or value) is their visible label, and that carry an aria-label or an aria-labelledby. Such a role marks a component built with a script (glossary "Composant d'interface"), and a button outside a form does nothing unless a script drives it; the buttons inside a form are 11.9.2's. A page with no such element is notApplicable.

**Expectation.** RGAA 7.1.3 methodology step 2: the component's accessible name contains its visible label. Punctuation and capital letters are ignored (the particular cases of 7.1.3); accents are not folded. An accessible name that does not contain its words, in order, fails: an abbreviation written out, a word with another ending or text in parentheses left out gets no exception. Only the accessible name is checked; a title is not.
