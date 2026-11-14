'use strict';

/**
 * Where core's steps can't simply name RGAA's test instead of WCAG's: what
 * they say is WCAG's logic, not RGAA's (a level, a threshold, an exception,
 * what counts as passing). Each entry replaces the parts it gives of core's
 * entry for that rule and reason code; scripts/generate-review.js fails if a
 * code that counts toward a test is left with WCAG's terms, or if an entry
 * differs between the languages.
 *
 * Every text is written in English and in French, side by side (t(en, fr)):
 * the English is the standard's review (standard.review), the French its
 * translation in i18n/fr.json. overrides(lang) gives the entries in one of
 * them, with core's own steps in that language where an entry keeps some.
 * @TESTS@ names the tests the code's findings bear on. A rule's '*' entry is a
 * function that edits each of its codes' { steps, passWhen, failWhen } once
 * the rest is applied.
 */

const LANGUAGES = ['en', 'fr'];

function overrides(lang) {
  if (!LANGUAGES.includes(lang)) throw new Error(`no review overrides in ${lang}`);
  // A text in English, then in French.
  const t = (en, fr) => (lang === 'fr' ? fr : en);

  // Core's own steps, for an entry that keeps some of them.
  const core = require(`@surea11y/core/procedures/${lang}`);
  const coreSteps = (prefix, code, count) =>
    Array.from({ length: count }, (_, i) => core[`${prefix}_review_${code}_step${i + 1}`]);

  // The contexts RGAA's glossary « Contexte du lien » lists, and no other.
  const CONTEXT = t(
    'the sentence, the paragraph, the list item (or the parent list item), the heading before it, the cell it is in and the table headers associated with that cell',
    'la phrase, le paragraphe, l’élément de liste (ou l’élément de liste parent), le titre qui le précède, la cellule où il se trouve et les en-têtes de tableau associés à cette cellule'
  );
  // 6.1.1 to 6.1.4 are one test per kind of link, and a link is of one kind.
  const LINK_TESTS = t(
    'which fails RGAA test 6.1.1 for a text link, 6.1.2 for an image link, 6.1.3 for a composite link or 6.1.4 for an SVG link',
    'ce qui ne respecte pas le test 6.1.1 du RGAA pour un lien texte, 6.1.2 pour un lien image, 6.1.3 pour un lien composite ou 6.1.4 pour un lien SVG'
  );
  // 6.1's particular case.
  const AMBIGUOUS = t(
    'or the link is ambiguous for everyone (no reader can know where it leads before activating it): RGAA criterion 6.1 is then not applicable',
    'ou le lien est ambigu pour tout le monde (aucun lecteur ne peut savoir où il mène avant de l’activer) : le critère 6.1 du RGAA est alors non applicable'
  );

  const ALTERNATIVE = t(
    'an interface component or an accessible alternative gives access to the same features',
    'un composant d’interface ou une alternative accessible donne accès aux mêmes fonctionnalités'
  );
  // 7.1.1's conditions 2 and 3.
  const ALTERNATIVE_PRESENT = t(
    'an accessible interface component or an accessible alternative on the page gives access to the same feature',
    'un composant d’interface accessible ou une alternative accessible présent dans la page donne accès à la même fonctionnalité'
  );
  const NO_ALTERNATIVE = t(
    'no accessible interface component or accessible alternative on the page gives access to the same feature',
    'aucun composant d’interface accessible ni aucune alternative accessible présent dans la page ne donne accès à la même fonctionnalité'
  );

  // 7.3.1's condition 2: another element, usable by keyboard and any pointing
  // device, does the same.
  const OTHER_ELEMENT = t(
    'another element of the page, usable by keyboard and by any pointing device, does the same action',
    'un autre élément de la page, utilisable au clavier et à tout dispositif de pointage, réalise la même action'
  );
  const NO_OTHER_ELEMENT = t(
    'no other element of the page usable by keyboard does the same action',
    'aucun autre élément de la page utilisable au clavier ne réalise la même action'
  );
  const otherElementStep = (what) =>
    t(
      `If the keyboard cannot do it here, check whether another element of the page, usable by keyboard and by mouse, does the same action (a button, a menu option). It counts only if it does everything ${what}.`,
      `Si le clavier ne permet pas de le faire ici, vérifiez si un autre élément de la page, utilisable au clavier et à la souris, réalise la même action (un bouton, une option de menu). Cela ne compte que s’il fait tout ce que ${what}.`
    );
  const CLICK_DOES = t('the click does', 'fait le clic');

  // 10.12.1: the test's spacing, set as a user would, and how to look.
  const SPACING_APPLIED = t(
    "Apply the text spacing of RGAA test 10.12.1 (line-height 1.5, spacing after paragraphs 2em, letter-spacing 0.12em, word-spacing 0.16em) through a user style sheet with !important, which overrides the page's !important, even inline. If you use a bookmarklet, also add these values with !important to the element's style (element.style).",
    'Appliquez l’espacement du texte du test 10.12.1 du RGAA (line-height 1.5, espacement après les paragraphes 2em, letter-spacing 0.12em, word-spacing 0.16em) au moyen d’une feuille de style utilisateur avec !important, qui l’emporte sur le !important de la page, même en ligne. Si vous utilisez un bookmarklet, ajoutez aussi ces valeurs avec !important dans le style de l’élément (element.style).'
  );
  const SPACING_LOOK = t(
    "In the browsers of the test environment, at the window widths the page is viewed at, check whether the element's text is cut off, overlaps or is hidden.",
    'Dans les navigateurs de l’environnement de test, aux largeurs de fenêtre où la page est consultée, vérifiez si le texte de l’élément est coupé, se chevauche ou est masqué.'
  );

  // 10.6.1: a link shown only by color, in each of its states.
  const LINK_STATES = t(
    'Hover over the link, reach it with Tab, activate it and show it as visited: in each state where its color changes, check a contrast of at least 3:1 with the surrounding text, and check that on hover and on focus a cue other than color appears.',
    'Survolez le lien, atteignez-le avec Tab, activez-le et affichez-le comme visité : dans chaque état où sa couleur change, vérifiez un contraste d’au moins 3:1 avec le texte environnant, et vérifiez qu’au survol et au focus une marque non liée à la couleur apparaît.'
  );
  const LINK_PASS = t(
    'The link has a cue other than color in its normal state, such as an underline, bold or a border, so test 10.6.1 does not apply; or its color contrasts at least 3:1 with the surrounding text in each of its colored states, and both hover and focus add a cue other than color.',
    'Le lien a une marque non liée à la couleur dans son état normal, comme un soulignement, du gras ou une bordure, donc le test 10.6.1 ne s’applique pas ; ou sa couleur contraste d’au moins 3:1 avec le texte environnant dans chacun de ses états colorés, et le survol comme le focus ajoutent une marque non liée à la couleur.'
  );
  const linkInText = (code, passWhen = LINK_PASS) => ({
    steps: [...coreSteps('linkInTextBlock', code, 3), LINK_STATES],
    passWhen
  });

  // 9.3: content the list holds but HTML does not allow there, asked about,
  // and items outside their list, which fail.
  const NESTING_STAYS = t(
    'Its placement is still a nesting error under RGAA test 8.2.1.',
    'Son placement reste une erreur d’imbrication au titre du test 8.2.1 du RGAA.'
  );
  const LIST_TESTS = t(
    'which fails RGAA test 9.3.1 for a <ul> or <menu> list, or RGAA test 9.3.2 for an <ol> list',
    'ce qui ne respecte pas le test 9.3.1 du RGAA pour une liste <ul> ou <menu>, ou le test 9.3.2 du RGAA pour une liste <ol>'
  );
  const DL_STRAY = (step1) => ({
    steps: [
      step1,
      t(
        'Look at how the page shows the reported content: as a term or a definition of the list, or as something else, such as a heading, a separator or a container.',
        'Regardez comment la page affiche le contenu signalé : comme un terme ou une définition de la liste, ou comme autre chose, par exemple un titre, un séparateur ou un conteneur.'
      )
    ],
    passWhen: t(
      `The reported content is not presented as a term or a definition of the list: each term shown is a <dt> and each definition a <dd> of the <dl>. ${NESTING_STAYS}`,
      `Le contenu signalé n’est pas présenté comme un terme ou une définition de la liste : chaque terme présenté est un <dt> et chaque définition un <dd> du <dl>. ${NESTING_STAYS}`
    ),
    failWhen: t(
      'The page presents a term or a definition that is not marked up with <dt> or <dd> in the <dl>, or a definition as that of a term that is not a <dt> of the <dl>, which fails @TESTS@.',
      'La page présente un terme ou une définition qui n’est pas balisé avec <dt> ou <dd> dans le <dl>, ou une définition comme celle d’un terme qui n’est pas un <dt> du <dl>, ce qui ne respecte pas @TESTS@.'
    )
  });

  // 8.6.1: a title lets a person find the page among the others.
  const TITLE_FOUND = t(
    'and lets the page be found in the browsing history or the list of tabs.',
    'et permet de retrouver la page dans l’historique de navigation ou la liste des onglets.'
  );

  const NAME_NEEDED = {
    passWhen: t(
      `The element has an explicit name, or ${ALTERNATIVE}.`,
      `L’élément a un nom explicite, ou ${ALTERNATIVE}.`
    ),
    failWhen: t(
      'The element has no explicit name and no accessible component or alternative gives access to the same features, which fails @TESTS@.',
      'L’élément n’a pas de nom explicite et aucun composant ni alternative accessible ne donne accès aux mêmes fonctionnalités, ce qui ne respecte pas @TESTS@.'
    )
  };

  // aria-role-name-present's findings count toward the test of their role
  // (rule-map.js): grid and tree 7.1.1, radiogroup 11.6.1, meter and
  // progressbar none.
  const NAME_BY_ROLE = {
    passWhen: t(
      `For a grid or a tree, the element has an explicit name, or ${ALTERNATIVE_PRESENT}. For a group of radio buttons (radiogroup), it has an aria-label or an aria-labelledby, or each radio button has a title, an aria-label, an aria-labelledby or an aria-describedby that says which group it belongs to.`,
      `Pour une grille ou une arborescence, l’élément a un nom explicite, ou ${ALTERNATIVE_PRESENT}. Pour un groupe de boutons radio (radiogroup), il a un aria-label ou un aria-labelledby, ou chaque bouton radio a un title, un aria-label, un aria-labelledby ou un aria-describedby qui indique à quel groupe il appartient.`
    ),
    failWhen: t(
      `For a grid or a tree: the element has no explicit name and ${NO_ALTERNATIVE}, which fails RGAA test 7.1.1. For a radiogroup: it has neither aria-label nor aria-labelledby, and its radio buttons do not say which group they belong to, which fails RGAA test 11.6.1. A meter or a progress bar with no name counts toward no test here: its label is a matter for RGAA test 11.1.1.`,
      `Pour une grille ou une arborescence : l’élément n’a pas de nom explicite et ${NO_ALTERNATIVE}, ce qui ne respecte pas le test 7.1.1 du RGAA. Pour un radiogroup : il n’a ni aria-label ni aria-labelledby, et ses boutons radio n’indiquent pas leur groupe, ce qui ne respecte pas le test 11.6.1 du RGAA. Un meter ou une barre de progression sans nom ne compte ici pour aucun test : son étiquette relève du test 11.1.1 du RGAA.`
    )
  };

  // A menu item, a tab or a tree item with no name (7.1.1, which passes
  // through another accessible component or an alternative).
  function itemName(item, Item) {
    const step1 = (shown) =>
      t(
        `Find ${item} the report names and note ${shown} shown on screen.`,
        `Repérez ${item} indiqué par le rapport et notez ${shown} affiché à l’écran.`
      );
    const step3 = t(
      'With a screen reader, move to the element and listen to the name announced.',
      'Avec un lecteur d’écran, placez-vous sur l’élément et écoutez le nom annoncé.'
    );
    const panel = t(
      "Open the Accessibility panel of the browser's developer tools and read the element's accessible name",
      'Ouvrez le panneau Accessibilité des outils de développement du navigateur et lisez le nom accessible de l’élément'
    );
    const failure = t('which fails @TESTS@.', 'ce qui ne respecte pas @TESTS@.');
    return {
      name_closedContent: {
        steps: [
          step1(t('the text or the icon', 'le texte ou l’icône')),
          t(
            `${panel}, which the browser takes from its content, placed in a closed shadow DOM the scan cannot read.`,
            `${panel}, que le navigateur tire de son contenu, placé dans un shadow DOM fermé que l’analyse ne peut pas lire.`
          ),
          step3
        ],
        passWhen: t(
          `The accessibility tree shows an explicit name for ${item}, taken from its content, and the screen reader announces it, or ${ALTERNATIVE_PRESENT}.`,
          `L’arbre d’accessibilité montre un nom explicite pour ${item}, tiré de son contenu, et le lecteur d’écran l’annonce, ou ${ALTERNATIVE_PRESENT}.`
        ),
        failWhen: t(
          `${Item} has no name in the accessibility tree, since its content gives none, and ${NO_ALTERNATIVE}, ${failure}`,
          `${Item} n’a pas de nom dans l’arbre d’accessibilité, car son contenu n’en donne aucun, et ${NO_ALTERNATIVE}, ${failure}`
        )
      },
      name_contentTooDeep: {
        passWhen: t(
          `The accessibility tree shows an explicit name for ${item}, taken from its nested content, and the screen reader announces it, or ${ALTERNATIVE_PRESENT}.`,
          `L’arbre d’accessibilité montre un nom explicite pour ${item}, tiré de son contenu imbriqué, et le lecteur d’écran l’annonce, ou ${ALTERNATIVE_PRESENT}.`
        ),
        failWhen: t(
          `${Item} has no name in the accessibility tree, since its content gives none, and ${NO_ALTERNATIVE}, ${failure}`,
          `${Item} n’a pas de nom dans l’arbre d’accessibilité, car son contenu n’en donne aucun, et ${NO_ALTERNATIVE}, ${failure}`
        )
      },
      name_internals: {
        passWhen: t(
          `The accessibility tree shows an explicit name for ${item}, set by ElementInternals or otherwise, and the screen reader announces it, or ${ALTERNATIVE_PRESENT}.`,
          `L’arbre d’accessibilité montre un nom explicite pour ${item}, défini par ElementInternals ou autrement, et le lecteur d’écran l’annonce, ou ${ALTERNATIVE_PRESENT}.`
        ),
        failWhen: t(
          `${Item} has no name in the accessibility tree (the screen reader announces only its role), and ${NO_ALTERNATIVE}, ${failure}`,
          `${Item} n’a pas de nom dans l’arbre d’accessibilité (le lecteur d’écran n’annonce que son rôle), et ${NO_ALTERNATIVE}, ${failure}`
        )
      }
    };
  }

  // 7.5.1 to 7.5.3 are one test per kind of message. Their tests ask that the
  // message use a role; core's findings ask whether it is announced at all.
  const STATUS_NATURE = t(
    'Work out what kind of message it is: a success, a result or a state; a suggestion or an error; or a progress.',
    'Déterminez la nature du message : une réussite, un résultat ou un état ; une suggestion ou une erreur ; ou une progression.'
  );
  const STATUS_TESTS = t(
    'which fails RGAA test 7.5.1 if it reports a success, a result or a state, 7.5.2 if it gives a suggestion or an error, or 7.5.3 if it shows a progress (the pack reads the role these tests require as a role assistive technologies receive, since RGAA criterion 7.5 asks that status messages be rendered correctly)',
    'ce qui ne respecte pas le test 7.5.1 du RGAA s’il informe d’une réussite, d’un résultat ou d’un état, 7.5.2 s’il présente une suggestion ou une erreur, ou 7.5.3 s’il indique une progression (le module lit le rôle qu’exigent ces tests comme un rôle que les technologies d’assistance reçoivent, puisque le critère 7.5 du RGAA demande que les messages de statut soient correctement restitués)'
  );

  // A presentation effect of the mouse is no action to make keyboard-operable:
  // the pack's reading of 7.3.1, which applies to every script event handler.
  const PRESENTATION_ONLY = t(
    'the mouse only produces a presentation effect that brings neither information nor a feature (a highlight on hover, for example): the pack then counts no action to make operable by keyboard. Information or a menu shown on hover is not a presentation effect',
    'la souris ne produit qu’un effet de présentation qui n’apporte ni information ni fonctionnalité (par exemple un surlignage au survol) : le module considère qu’il n’y a alors pas d’action à rendre accessible au clavier. Une information ou un menu affiché au survol n’est pas un effet de présentation'
  );

  const ERROR_FIRST = t(
    'Check whether the field is required (required, aria-required="true" or a visible indication) and whether its input requires a type or a format: test 11.10.4 concerns only required fields, test 11.10.7 only fields with a required type or format; if neither applies, these tests are not applicable.',
    'Vérifiez si le champ est obligatoire (required, aria-required="true" ou indication visible) et si sa saisie requiert un type ou un format : le test 11.10.4 ne concerne que les champs obligatoires, le test 11.10.7 que les champs à type ou format obligatoire ; si aucun des deux ne s’applique, ces tests sont non applicables.'
  );
  const ERROR_IN_LABEL = {
    passWhen: t(
      "The error message (and, for a field with a required type or format, the indication of the type or format expected) is visible and is in the field's <label> tag or in a passage of text that aria-labelledby or aria-describedby associates with it.",
      'Le message d’erreur (et, pour un champ à type ou format obligatoire, l’indication du type ou du format attendu) est visible et se trouve dans la balise <label> du champ ou dans un passage de texte que lui associe aria-labelledby ou aria-describedby.'
    ),
    failWhen: t(
      "No visible error message (for a field with a required type or format, no visible indication of the type or format expected) is in the field's <label> tag or in a passage of text associated by aria-labelledby or aria-describedby (a message tied only by aria-errormessage, placed next to the field with no association, or in a summary does not count), which fails RGAA test 11.10.4 for a required field, or RGAA test 11.10.7 for a field with a required type or format.",
      'Aucun message d’erreur visible (pour un champ à type ou format obligatoire, aucune indication visible du type ou du format attendu) ne se trouve dans la balise <label> du champ ni dans un passage de texte associé par aria-labelledby ou aria-describedby (un message relié seulement par aria-errormessage, placé à côté sans liaison ou dans un récapitulatif ne compte pas), ce qui ne respecte pas le test 11.10.4 du RGAA pour un champ obligatoire, ou le test 11.10.7 du RGAA pour un champ à type ou format obligatoire.'
    )
  };

  const NEARBY_TEXT = t(
    'Look for a title attribute on the field, or a passage of text next to the field, visible or shown when the field takes focus, that says what to enter.',
    'Cherchez un attribut title sur le champ, ou un passage de texte accolé au champ, visible ou qui le devient à la prise de focus, qui dit quoi saisir.'
  );
  // Criterion 3.2: RGAA's sizes, its second condition (a mechanism) and its
  // particular cases, and the one test the text's size and weight select.
  const CONTRAST_COMPARE = t(
    'Compare the ratio with 4.5:1, or with 3:1 if the text is at least 24px, or at least 18.5px and bold (rendered size).',
    'Comparez le ratio à 4,5:1, ou à 3:1 si le texte mesure au moins 24px, ou au moins 18,5px en gras (taille restituée).'
  );
  const CONTRAST_PASS = t(
    'or a mechanism on the page shows the text with a sufficient contrast ratio (checked by test 3.2.5); or the text falls under a particular case of RGAA criterion 3.2: a logo or brand name, purely decorative text, text in an image that carries no essential information, an interface element no action can be taken on (a disabled button, for example).',
    'ou un mécanisme de la page permet d’afficher le texte avec un rapport de contraste suffisant (vérifié par le test 3.2.5) ; ou le texte relève d’un cas particulier du critère RGAA 3.2 : logo ou nom de marque, texte purement décoratif, texte d’une image qui n’apporte aucune information essentielle, élément d’interface sur lequel aucune action n’est possible (un bouton disabled, par exemple).'
  );
  const CONTRAST_FAIL = t(
    'outside the particular cases and with no mechanism to show a sufficient contrast, which fails RGAA test 3.2.1 (regular text under 24px), 3.2.2 (bold text under 18.5px), 3.2.3 (regular text of 24px or more) or 3.2.4 (bold text of 18.5px or more), depending on its size.',
    'hors cas particuliers et sans mécanisme permettant d’afficher un contraste suffisant, ce qui ne respecte pas le test RGAA 3.2.1 (texte sans graisse de moins de 24px), 3.2.2 (texte en gras de moins de 18,5px), 3.2.3 (texte sans graisse de 24px ou plus) ou 3.2.4 (texte en gras de 18,5px ou plus), selon sa taille.'
  );
  // Core's words, as the generator leaves them, and RGAA's in their place.
  const CONTRAST_STEPS = [
    [
      t(
        'Compare the ratio with 4.5:1 (3:1 for large text) for minimum contrast, and 7:1 (4.5:1 for large text) for enhanced contrast.',
        'Comparez le ratio à 4,5:1 (3:1 pour le texte de grande taille) pour le contraste minimum, et à 7:1 (4,5:1 pour le texte de grande taille) pour le contraste renforcé.'
      ),
      CONTRAST_COMPARE
    ],
    [
      t(
        'Note the text size and weight to tell whether it counts as large (at least 24px, or 18.5px and bold).',
        'Notez la taille et la graisse du texte pour savoir s’il compte comme texte de grande taille (au moins 24px, ou 18,5px en gras).'
      ),
      t(
        'Note the rendered size and the weight of the text: they tell which of tests 3.2.1 to 3.2.4 applies.',
        'Notez la taille restituée et la graisse du texte : elles disent lequel des tests 3.2.1 à 3.2.4 s’applique.'
      )
    ],
    [
      t(
        'the color scheme the report names (blockerValue: light or dark)',
        'indiqué par le rapport (blockerValue : light ou dark)'
      ),
      t(
        'the color scheme the report names (light or dark)',
        'que nomme le rapport (clair ou sombre)'
      )
    ],
    [
      t('in each browser the page supports', 'dans chaque navigateur pris en charge par la page'),
      t(
        'in each browser of the test environment (base de référence)',
        'dans chaque navigateur de l’environnement de test (base de référence)'
      )
    ]
  ];
  // What WCAG exempts that RGAA lists among its particular cases instead.
  const CONTRAST_EXEMPT = [
    t(
      ', or the faded text is an inactive (disabled) control, which is exempt',
      ', ou le texte atténué est un contrôle inactif (désactivé), qui est exempté'
    ),
    t(', or it is purely decorative', ', ou il est purement décoratif')
  ];
  const CONTRAST_FAILS = t(
    /, which fails RGAA tests 3\.2\.1, 3\.2\.2, 3\.2\.3, 3\.2\.4(?:, unless the text is part of an inactive control)?\.$/,
    /, ce qui ne respecte pas les tests 3\.2\.1, 3\.2\.2, 3\.2\.3, 3\.2\.4 du RGAA(?:, sauf si le texte fait partie d’un contrôle inactif)?\.$/
  );

  function contrastInRgaaTerms({ steps, passWhen, failWhen }, code) {
    const out = {
      steps: steps.map((step) =>
        CONTRAST_STEPS.reduce((text, [from, to]) => text.replace(from, to), step)
      ),
      passWhen: `${CONTRAST_EXEMPT.reduce((text, from) => text.replace(from, ''), passWhen).replace(
        /\.$/,
        ''
      )}${t('; ', ' ; ')}${CONTRAST_PASS}`,
      failWhen: failWhen.replace(CONTRAST_FAILS, `, ${CONTRAST_FAIL}`)
    };
    // Core's wording changed: say so rather than keep WCAG's sizes.
    if (out.failWhen === failWhen || !out.steps.includes(CONTRAST_COMPARE)) {
      throw new Error(`contrast-computable ${code} (${lang}): core's steps no longer match`);
    }
    return out;
  }

  // Criterion 1.3 asks whether a short alternative is relevant; a detailed
  // description is criterion 1.6's.
  const NO_DETAILED_DESCRIPTION = (what, test) =>
    t(
      `For a chart or a diagram, it is enough that the alternative ${what} and says what it brings; if it only names it, a missing detailed description is a matter for test ${test}, not this one.`,
      `Pour un graphique ou un schéma, il suffit que l’alternative ${what} et dise ce qu’il apporte ; si elle ne fait que le nommer, l’absence de description détaillée relève du test ${test}, pas de celui-ci.`
    );

  // 4.10.1 asks for a way to stop the sound or set its volume, nothing more
  // (glossary « Contrôle (son déclenché automatiquement) »).
  const SOUND_CONTROL_TRY = t(
    'Activate this control and check that the sound stops or that its volume changes.',
    'Activez ce dispositif et vérifiez que le son s’arrête ou que son volume change.'
  );
  // A sound that plays by itself for more than 3 seconds with no way to stop it.
  const SOUND_UNSTOPPABLE = t(
    'A sound starts by itself for more than 3 seconds and nothing on the page stops it or sets its volume apart from the system volume, which fails RGAA test 4.10.1.',
    'Un son se lance tout seul pendant plus de 3 secondes et rien sur la page ne permet de l’arrêter ni d’en régler le volume indépendamment du volume du système, ce qui ne respecte pas le test 4.10.1 du RGAA.'
  );

  const IMAGE_TEXT_PASS = t(
    "The image holds no text; or its text is part of a logo, a brand name, a CAPTCHA or a test image, or the image's graphic accuracy is essential to the information (particular cases of RGAA criterion 1.8); or a replacement mechanism exists; or the text uses a graphic effect that CSS cannot reproduce.",
    'L’image ne contient pas de texte ; ou son texte fait partie d’un logo, d’une dénomination commerciale, d’un CAPTCHA ou d’une image-test, ou l’exactitude graphique de l’image est essentielle à l’information (cas particuliers du critère RGAA 1.8) ; ou un mécanisme de remplacement existe ; ou le texte fait appel à un effet graphique qui ne peut pas être reproduit en CSS.'
  );
  const IMAGE_TEXT_MECHANISM = t(
    'Look on the page for a replacement mechanism that replaces images of text with styled text.',
    'Cherchez sur la page un mécanisme de remplacement qui permet de remplacer les images texte par du texte stylé.'
  );

  // 9.2.1: each zone structured with its element. 9.2 does not apply under
  // another doctype than HTML5's (its particular case).
  const DOCTYPE_STEP = t(
    'Check that the page has the HTML5 doctype (<!DOCTYPE html>). If it has another, RGAA criterion 9.2 is not applicable.',
    'Vérifiez que la page a le doctype HTML5 (<!DOCTYPE html>). Si elle en a un autre, le critère 9.2 du RGAA est non applicable.'
  );
  const zone = (what, element) => ({
    steps: [
      DOCTYPE_STEP,
      what.find,
      t(
        `If it is, inspect it in the browser's developer tools and check whether it is a ${element} element, or is inside one.`,
        `Si c’est le cas, inspectez-le dans les outils de développement du navigateur et vérifiez qu’il s’agit d’un élément ${element}, ou qu’il se trouve dans un tel élément.`
      )
    ],
    passWhen: t(
      `The page's doctype is not HTML5's, the block is not ${what.en}, or it is structured with a ${element} element.`,
      `Le doctype de la page n’est pas celui de HTML5, le bloc n’est pas ${what.fr}, ou il est structuré au moyen d’un élément ${element}.`
    ),
    failWhen: t(
      `The block is ${what.en} and is not structured with a ${element} element, which fails @TESTS@.`,
      `Le bloc est ${what.fr} et n’est pas structuré au moyen d’un élément ${element}, ce qui ne respecte pas @TESTS@.`
    )
  });
  const HEADER_ZONE = {
    en: "the page's header zone",
    fr: 'la zone d’en-tête de la page',
    find: t(
      "Find the block the report names, and decide whether it is the page's header zone: the area at the top with the site's name or logo, often with its main menu.",
      'Retrouvez le bloc que le rapport désigne, et décidez s’il s’agit de la zone d’en-tête de la page : la zone en haut de page avec le nom ou le logo du site, souvent avec son menu principal.'
    )
  };
  const NAVIGATION_ZONE = {
    en: 'a main or secondary navigation zone',
    fr: 'une zone de navigation principale ou secondaire',
    find: t(
      "Find the block the report names, and decide whether it is a main or secondary navigation zone: a menu or navigation bar of links to the site's pages or sections.",
      'Retrouvez le bloc que le rapport désigne, et décidez s’il s’agit d’une zone de navigation principale ou secondaire : un menu ou une barre de navigation de liens vers les pages ou les rubriques du site.'
    )
  };
  const FOOTER_ZONE = {
    en: "the page's footer zone",
    fr: 'la zone de pied de page',
    find: t(
      "Find the block the report names, and decide whether it is the page's footer zone: the area at the bottom with information about the site, such as contact details, legal notices or copyright.",
      'Retrouvez le bloc que le rapport désigne, et décidez s’il s’agit de la zone de pied de page : la zone en bas de page avec des informations sur le site, comme les coordonnées, les mentions légales ou le copyright.'
    )
  };
  return {
    'aria-expanded-state-mismatch': {
      EXPANDED_FALSE_CONTROLLED_SHOWN: {
        passWhen: t(
          `The content is collapsed or only previewed while the button says "collapsed", and the state changes when the content opens, or ${ALTERNATIVE_PRESENT}.`,
          `Le contenu est réduit ou seulement en aperçu tant que le bouton indique « réduit », et l’état change quand le contenu s’ouvre, ou ${ALTERNATIVE_PRESENT}.`
        ),
        failWhen: t(
          `The content is fully shown while the toggle button tells screen reader users that it is collapsed, and ${NO_ALTERNATIVE}, which fails @TESTS@.`,
          `Le contenu est entièrement affiché alors que le bouton de bascule indique aux utilisateurs de lecteur d’écran qu’il est réduit, et ${NO_ALTERNATIVE}, ce qui ne respecte pas @TESTS@.`
        )
      },
      EXPANDED_TRUE_CONTROLLED_HIDDEN: {
        passWhen: t(
          `The content is shown while the button says "expanded", once any transition is over, or ${ALTERNATIVE_PRESENT}.`,
          `Le contenu est affiché tant que le bouton indique « développé », une fois toute transition terminée, ou ${ALTERNATIVE_PRESENT}.`
        ),
        failWhen: t(
          `The content stays hidden while the toggle button tells screen reader users that it is expanded, and ${NO_ALTERNATIVE}, which fails @TESTS@.`,
          `Le contenu reste masqué alors que le bouton de bascule indique aux utilisateurs de lecteur d’écran qu’il est développé, et ${NO_ALTERNATIVE}, ce qui ne respecte pas @TESTS@.`
        )
      }
    },
    'aria-role-name-present': { name_internals: NAME_BY_ROLE, name_missing: NAME_BY_ROLE },
    // 7.3.1 asks for the Enter key (methodology step 2, glossary « Accessible
    // et activable par le clavier »), not the Space key.
    'click-handler-keyboard-operable': {
      CLICK_HANDLER_FOCUS_LISTENER: {
        steps: [
          t(
            'Click the element the report names and note what happens.',
            'Cliquez sur l’élément indiqué par le rapport et notez ce qui se passe.'
          ),
          t(
            'Reload the page, then press Tab until the element has focus.',
            'Rechargez la page, puis appuyez sur Tab jusqu’à ce que l’élément ait le focus.'
          ),
          t(
            'Press Enter (and, if it is part of a group, the arrow keys), and compare with what the click did.',
            'Appuyez sur Entrée (et, s’il fait partie d’un groupe, sur les touches de direction), et comparez avec ce qu’a fait le clic.'
          ),
          otherElementStep(CLICK_DOES)
        ],
        passWhen: t(
          `Enter does what a click does, or, for a tab, moving focus to it with the arrow keys already shows its panel, or ${OTHER_ELEMENT}.`,
          `Entrée fait ce que fait un clic, ou, pour un onglet, y déplacer le focus avec les touches de direction affiche déjà son panneau, ou ${OTHER_ELEMENT}.`
        ),
        failWhen: t(
          `Enter does nothing, or less than a click, even once focus has arrived, and ${NO_OTHER_ELEMENT}, which fails @TESTS@.`,
          `Entrée ne fait rien, ou moins qu’un clic, même une fois le focus arrivé, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
        )
      },
      CLICK_HANDLER_KEY_LISTENER_ABOVE: {
        steps: [
          t(
            'Click the element the report names and note what happens.',
            'Cliquez sur l’élément indiqué par le rapport et notez ce qui se passe.'
          ),
          t(
            'Press Tab until the element has focus.',
            'Appuyez sur Tab jusqu’à ce que l’élément ait le focus.'
          ),
          t(
            'Press Enter (and, if it is part of a group, the arrow keys), and compare with the click.',
            'Appuyez sur Entrée (et, s’il fait partie d’un groupe, sur les touches de direction), et comparez avec le clic.'
          ),
          otherElementStep(CLICK_DOES)
        ],
        passWhen: t(
          `Enter does what a click does (or, for a complex action, the arrow keys let you do it), or ${OTHER_ELEMENT}.`,
          `Entrée fait ce que fait un clic (ou, pour une action complexe, les touches de direction permettent de la réaliser), ou ${OTHER_ELEMENT}.`
        ),
        failWhen: t(
          `Enter does nothing on the element (the listener on an ancestor does not handle it), and ${NO_OTHER_ELEMENT}, which fails @TESTS@.`,
          `Entrée ne fait rien sur l’élément (l’écouteur placé sur un ancêtre ne le gère pas), et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
        )
      },
      CLICK_HANDLER_NOT_FOCUSABLE: {
        steps: [
          t(
            'Click the element the report names and note what its click does.',
            'Cliquez sur l’élément indiqué par le rapport et notez ce que fait son clic.'
          ),
          t(
            'Go through the page with Tab and check that the element never takes focus.',
            'Parcourez la page avec Tab et vérifiez que l’élément ne reçoit jamais le focus.'
          ),
          t(
            'If it is an item of a list, a grid or a combobox, give focus to that widget and use the arrow keys to see whether the element becomes active and whether Enter runs the action.',
            'S’il s’agit d’un élément d’une liste, d’une grille ou d’une combobox, donnez le focus à ce widget et utilisez les touches de direction pour voir si l’élément devient actif et si Entrée exécute l’action.'
          ),
          t(
            'Otherwise, look on the page for another element, usable by keyboard and by mouse, that does the same action.',
            'Sinon, cherchez sur la page un autre élément, utilisable au clavier et à la souris, qui réalise la même action.'
          )
        ],
        passWhen: t(
          'The same action can be done by keyboard, through the widget that manages the element or through another element of the page usable by keyboard and by any pointing device.',
          'La même action peut être effectuée au clavier, par le widget qui gère l’élément ou par un autre élément de la page utilisable au clavier et à tout dispositif de pointage.'
        ),
        failWhen: t(
          `The action can only be done with the mouse, and ${NO_OTHER_ELEMENT}, which fails @TESTS@.`,
          `L’action ne peut être effectuée qu’à la souris, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
        )
      },
      CLICK_HANDLER_NOT_IN_TAB_ORDER: {
        steps: [
          t(
            'Click the element the report names and note what happens.',
            'Cliquez sur l’élément indiqué par le rapport et notez ce qui se passe.'
          ),
          t(
            'Go through the page with Tab and check whether focus ever reaches the element.',
            'Parcourez la page avec Tab et vérifiez si le focus arrive un jour sur l’élément.'
          ),
          t(
            'If it is part of a group (tabs, menu, toolbar, list), enter the group with Tab and use the arrow keys to see whether they move focus within it.',
            'S’il fait partie d’un groupe (onglets, menu, barre d’outils, liste), entrez dans le groupe avec Tab et utilisez les touches de direction pour voir si elles y déplacent le focus.'
          ),
          t(
            'Once it has focus, press Enter and compare with the click.',
            'Une fois qu’il a le focus, appuyez sur Entrée et comparez avec le clic.'
          ),
          otherElementStep(CLICK_DOES)
        ],
        passWhen: t(
          `The element can be reached by keyboard (Tab, or the arrow keys within its group) and Enter does what a click does, or ${OTHER_ELEMENT}.`,
          `L’élément peut être atteint au clavier (Tab, ou touches de direction dans son groupe) et Entrée fait ce que fait un clic, ou ${OTHER_ELEMENT}.`
        ),
        failWhen: t(
          `No key brings focus to the element and ${NO_OTHER_ELEMENT}: its action works only with the mouse, which fails @TESTS@.`,
          `Aucune touche n’amène le focus sur l’élément et ${NO_OTHER_ELEMENT} : son action ne fonctionne qu’à la souris, ce qui ne respecte pas @TESTS@.`
        )
      },
      CLICK_HANDLER_NO_KEY_HANDLER: {
        steps: [
          t(
            'Click the element the report names and note what happens.',
            'Cliquez sur l’élément indiqué par le rapport et notez ce qui se passe.'
          ),
          t(
            'Reload the page, then press Tab until the element has focus.',
            'Rechargez la page, puis appuyez sur Tab jusqu’à ce que l’élément ait le focus.'
          ),
          t(
            'Press Enter (and, if it is part of a group, the arrow keys), and compare with what the click did.',
            'Appuyez sur Entrée (et, s’il fait partie d’un groupe, sur les touches de direction), et comparez avec ce qu’a fait le clic.'
          ),
          otherElementStep(CLICK_DOES)
        ],
        passWhen: t(
          `Enter does what a click does (or, for a complex action, the arrow keys let you do it), or ${OTHER_ELEMENT}.`,
          `Entrée fait ce que fait un clic (ou, pour une action complexe, les touches de direction permettent de la réaliser), ou ${OTHER_ELEMENT}.`
        ),
        failWhen: t(
          `Enter does nothing, or less than a click, even once focus has arrived, and ${NO_OTHER_ELEMENT}, which fails @TESTS@.`,
          `Entrée ne fait rien, ou moins qu’un clic, même une fois le focus arrivé, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
        )
      }
    },
    'dialog-name-present': { name_internals: NAME_NEEDED, name_missing: NAME_NEEDED },
    // 7.3.2 asks only that focus stay where it is received; whether it shows is
    // 10.7's.
    // 9.2.1 asks for the element, where core's steps ask for the landmark.
    'page-zones-landmark': {
      BANNER_NOT_EXPOSED: zone(HEADER_ZONE, '<header>'),
      NAVIGATION_NOT_EXPOSED: zone(NAVIGATION_ZONE, '<nav>'),
      CONTENTINFO_NOT_EXPOSED: zone(FOOTER_ZONE, '<footer>')
    },
    'focus-not-removed-by-script': {
      FOCUS_HANDLER_BLURS_SELF: {
        passWhen: t(
          'Focus stays on the element (document.activeElement), and the next Tab moves on to the next control.',
          'Le focus reste sur l’élément (document.activeElement), et la touche Tab suivante passe au contrôle suivant.'
        )
      },
      FOCUS_HANDLER_CALLS_BLUR: {
        passWhen: t(
          'In each state, focus stays on the element (document.activeElement) and it can be operated by keyboard.',
          'Dans chaque état, le focus reste sur l’élément (document.activeElement) et il peut être actionné au clavier.'
        )
      },
      FOCUS_HANDLER_MOVES_FOCUS: {
        passWhen: t(
          'Focus stays on the element, or the element is only an invisible sentinel with no name that sends focus back inside a modal dialog (the pack does not count it as an element that takes focus), and every control can still be reached and operated by keyboard.',
          'Le focus reste sur l’élément, ou l’élément n’est qu’une sentinelle invisible et sans nom qui renvoie le focus à l’intérieur d’une boîte de dialogue modale (le module ne la compte pas comme un élément qui reçoit le focus), et chaque contrôle peut toujours être atteint et actionné au clavier.'
        ),
        failWhen: t(
          'An element that is not such a sentinel sends focus elsewhere as soon as it receives it, which fails @TESTS@.',
          'Un élément qui n’est pas une telle sentinelle envoie le focus ailleurs dès qu’il le reçoit, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'canvas-text-alternative-quality': {
      TEXT_ALTERNATIVE_REVIEW: {
        steps: [
          t(
            'Look at what the canvas the report names shows on screen, including how it changes as you use it.',
            'Regardez ce que le canevas indiqué par le rapport affiche à l’écran, y compris ses changements quand vous l’utilisez.'
          ),
          t(
            'Read its alternative (the value the report gives, or its content between <canvas> and </canvas> and its name in the Accessibility panel).',
            'Lisez son alternative (la valeur donnée par le rapport, ou son contenu entre <canvas> et </canvas> et son nom dans le panneau Accessibilité).'
          ),
          NO_DETAILED_DESCRIPTION(t('identifies the canvas', 'identifie le canevas'), '1.6.7'),
          t(
            'Check that this alternative says what the canvas brings to the content, and follows its changes.',
            'Vérifiez que cette alternative dit ce que le canevas apporte au contenu, et suit ses changements.'
          ),
          t(
            'If the canvas has content between <canvas> and </canvas>, listen to it with a screen reader and check that this content is rendered.',
            'Si le canevas a un contenu entre <canvas> et </canvas>, écoutez-le avec un lecteur d’écran et vérifiez que ce contenu est restitué.'
          )
        ],
        passWhen: t(
          'The alternative identifies the canvas and conveys the information or the function it brings, and the content between its tags, if any, is rendered by the screen reader.',
          'L’alternative identifie le canevas et transmet l’information ou la fonction qu’il apporte, et le contenu placé entre ses balises, s’il y en a un, est restitué par le lecteur d’écran.'
        ),
        failWhen: t(
          "The alternative is wrong, vague or does not match the canvas's information, which fails RGAA test 1.3.7; or the content between <canvas> and </canvas> is not rendered by the screen reader, which fails RGAA test 1.3.8.",
          'L’alternative est fausse, vague ou ne correspond pas à l’information du canevas, ce qui ne respecte pas le test 1.3.7 du RGAA ; ou le contenu placé entre <canvas> et </canvas> n’est pas restitué par le lecteur d’écran, ce qui ne respecte pas le test 1.3.8 du RGAA.'
        )
      }
    },
    'contrast-computable': { '*': contrastInRgaaTerms },
    'avoid-inline-spacing': {
      INLINE_SPACING_NOT_RESOLVABLE: {
        steps: [
          ...coreSteps('avoidInlineSpacing', 'INLINE_SPACING_NOT_RESOLVABLE', 2),
          SPACING_APPLIED,
          SPACING_LOOK
        ],
        passWhen: t(
          "The value set already reaches the test's, or, with the test's spacing applied, the element's text stays readable.",
          'La valeur imposée atteint déjà celle du test, ou, l’espacement du test appliqué, le texte de l’élément reste lisible.'
        ),
        failWhen: t(
          "With the test's spacing applied, some of the element's text is cut off, overlaps or is hidden, which fails @TESTS@.",
          'L’espacement du test appliqué, du texte de l’élément est coupé, se chevauche ou est masqué, ce qui ne respecte pas @TESTS@.'
        )
      },
      INLINE_SPACING_NO_SOFT_WRAP: {
        steps: [
          ...coreSteps('avoidInlineSpacing', 'INLINE_SPACING_NO_SOFT_WRAP', 1),
          t(
            'Check whether the text can go onto a second line (wrapping forbidden, a single word, a scrolling area).',
            'Vérifiez si le texte peut passer sur une deuxième ligne (retour à la ligne interdit, mot unique, zone qui défile).'
          ),
          SPACING_APPLIED,
          SPACING_LOOK
        ],
        passWhen: t(
          "With the test's spacing applied, the text stays readable: nothing is cut off, hidden or overlaps, whether it wraps or not.",
          'L’espacement du test appliqué, le texte reste lisible : rien n’est coupé, masqué ni ne se chevauche, qu’il passe ou non à la ligne.'
        ),
        failWhen: t(
          "With the test's spacing applied, some text is cut off, hidden or overlaps, which fails @TESTS@.",
          'L’espacement du test appliqué, du texte est coupé, masqué ou se chevauche, ce qui ne respecte pas @TESTS@.'
        )
      },
      INLINE_SPACING_SHORT_TEXT: {
        steps: [
          ...coreSteps('avoidInlineSpacing', 'INLINE_SPACING_SHORT_TEXT', 1),
          t(
            'Check whether the short text goes onto two lines at the window widths the page is viewed at.',
            'Vérifiez si le texte court passe sur deux lignes aux largeurs de fenêtre où la page est consultée.'
          ),
          SPACING_APPLIED,
          SPACING_LOOK
        ]
      }
    },
    'css-focus-indicator-suppressed': {
      FOCUS_INDICATOR_SUPPRESSED: {
        steps: [
          t(
            'Click just before the element the report names, then press Tab until it has focus.',
            'Cliquez juste avant l’élément indiqué par le rapport, puis appuyez sur Tab jusqu’à ce qu’il ait le focus.'
          ),
          t(
            'Look on the element, and around it, for any visible change when it takes focus.',
            'Cherchez sur l’élément, et autour de lui, tout changement visible lorsqu’il reçoit le focus.'
          ),
          t(
            'Press Tab and Shift+Tab to take focus away and back, comparing the two states.',
            'Appuyez sur Tab et Maj+Tab pour retirer puis remettre le focus, en comparant les deux états.'
          ),
          t(
            'Measure the contrast ratio of this indication: it must be at least 3:1.',
            'Mesurez le rapport de contraste de cette indication : il doit être d’au moins 3:1.'
          )
        ],
        passWhen: t(
          'A visible indication changes the outline or the background of the element when it has focus, with a contrast ratio of at least 3:1.',
          'Une indication visible agit sur le contour ou le fond de l’élément quand il a le focus, avec un rapport de contraste d’au moins 3:1.'
        ),
        failWhen: t(
          'Nothing visible changes when it takes focus, or the indication has a contrast ratio below 3:1, which fails @TESTS@.',
          'Rien de visible ne change à la prise de focus, ou l’indication a un rapport de contraste inférieur à 3:1, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'css-orientation-lock': {
      ORIENTATION_MEDIA_ROTATES_ELEMENT: {
        passWhen: t(
          'Rotating the element does not keep anyone from using the content (the element is decorative, or stays readable and usable), and all the content can be read and used in both orientations; or one orientation is essential to the content, which RGAA makes not applicable.',
          'La rotation de l’élément n’empêche pas de consulter le contenu (l’élément est décoratif, ou reste lisible et utilisable), et tout le contenu peut être lu et utilisé dans les deux orientations ; ou une orientation est essentielle au contenu, ce que le RGAA rend non applicable.'
        ),
        failWhen: t(
          'The content turns on its side in one orientation and cannot be read or used normally there, which fails @TESTS@.',
          'Le contenu pivote sur le côté dans une orientation et ne peut pas y être lu ou utilisé normalement, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'css-hidden-focus': {
      cssHiddenTabbable_needsFocusStateVerification: {
        failWhen: t(
          'Focus reaches the element while it stays hidden: no visual indication shows that it has focus, which fails @TESTS@.',
          'Le focus arrive sur l’élément alors qu’il reste masqué : aucune indication visuelle ne montre la prise de focus, ce qui ne respecte pas @TESTS@.'
        )
      },
      cssHiddenTabbable_runtimeRedirect_needsReview: {
        failWhen: t(
          'Focus can stay on the hidden element: no visual indication shows that it has focus, which fails @TESTS@.',
          'Le focus peut rester sur l’élément masqué : aucune indication visuelle ne montre la prise de focus, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'definition-list-children-valid': {
      DL_DT_DD_ORDER: DL_STRAY(
        t(
          'Inspect the description list the report names and note the definition before the first term, or the last term with no definition after it.',
          'Inspectez la liste de description indiquée par le rapport et notez la définition qui précède le premier terme, ou le dernier terme sans définition après lui.'
        )
      ),
      DL_INVALID_CHILD: DL_STRAY(
        t(
          'Inspect the description list the report names and note the child that is neither a <dt>/<dd> group, nor a single wrapping <div>, nor a script, a template or a style, or the text placed directly in it.',
          'Inspectez la liste de description indiquée par le rapport et notez l’enfant qui n’est ni un groupe <dt>/<dd>, ni un unique <div> englobant, ni un script, un template ou un style, ou le texte placé directement dedans.'
        )
      ),
      DL_NO_DT_DD: DL_STRAY(
        t(
          'Inspect the description list the report names and note the terms with no definition or the definitions with no term.',
          'Inspectez la liste de description indiquée par le rapport et notez les termes sans définition ou les définitions sans terme.'
        )
      )
    },
    'dlitem-parent-valid': {
      DLITEM_INVALID_PARENT: {
        steps: [
          t(
            'Inspect the <dt> or <dd> the report names and see that no <dl> contains it.',
            'Inspectez le <dt> ou le <dd> indiqué par le rapport et constatez qu’aucun <dl> ne le contient.'
          ),
          t(
            'Look at whether the page presents these terms and definitions as a description list.',
            'Regardez si la page présente ces termes et définitions comme une liste de description.'
          )
        ],
        passWhen: t(
          'The content is not presented as a description list, so test 9.3.3 does not apply to it; a <dt> or a <dd> outside a <dl> is still a nesting error under RGAA test 8.2.1.',
          'Le contenu n’est pas présenté comme une liste de description, donc le test 9.3.3 ne s’y applique pas ; un <dt> ou un <dd> hors d’un <dl> reste une erreur d’imbrication au titre du test 8.2.1 du RGAA.'
        ),
        failWhen: t(
          'The <dt> or the <dd> is marked up as an item of a description list, but no <dl> contains it: the list is not structured with the <dl>, <dt> and <dd> tags, which fails @TESTS@.',
          'Le <dt> ou le <dd> est balisé comme élément d’une liste de description, mais aucun <dl> ne le contient : la liste n’est pas structurée au moyen des balises <dl>, <dt> et <dd>, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'duplicate-id': {
      DUPLICATE_ID: {
        steps: [
          t(
            'Inspect the elements the report names and note the id they share.',
            'Inspectez les éléments indiqués par le rapport et notez l’id qu’ils partagent.'
          ),
          t(
            'Check in the generated source code that this id appears in it several times.',
            'Vérifiez dans le code source généré que cet id y figure plusieurs fois.'
          )
        ],
        passWhen: t(
          'Each id attribute value is unique in the page.',
          'Chaque valeur d’attribut id est unique dans la page.'
        ),
        failWhen: t(
          'The id attribute values are not unique in the page, which fails @TESTS@.',
          'Les valeurs d’attribut id ne sont pas uniques dans la page, ce qui ne respecte pas @TESTS@.'
        )
      },
      DUPLICATE_ID_IN_SHADOW_TREE: {
        steps: [
          t(
            'Inspect the elements the report names, in the same shadow root, and note the id they share.',
            'Inspectez les éléments indiqués par le rapport, dans la même racine fantôme (shadow root), et notez l’id qu’ils partagent.'
          ),
          t(
            "Check in the inspector that this id appears several times in that root, which is part of the page's generated source code.",
            'Vérifiez dans l’inspecteur que cet id figure plusieurs fois dans cette racine, qui fait partie du code source généré de la page.'
          )
        ],
        passWhen: t(
          'Each id attribute value is unique in the shadow root.',
          'Chaque valeur d’attribut id est unique dans la racine fantôme.'
        ),
        failWhen: t(
          "Several elements of the shadow root have the same id: the id attribute values are not unique, which fails @TESTS@, a shadow root being part of the page's generated source code.",
          'Plusieurs éléments de la racine fantôme portent le même id : les valeurs d’attribut id ne sont pas uniques, ce qui ne respecte pas @TESTS@, une racine fantôme faisant partie du code source généré de la page.'
        )
      }
    },
    'form-control-label-quality': {
      DUPLICATE_LABEL_TEXT: {
        failWhen: t(
          'Different fields share a label and nothing visible tells them apart: the label does not give the exact purpose of each field, which fails RGAA test 11.2.1 (label given by a <label> tag) or RGAA test 11.2.4 (label given by aria-labelledby).',
          'Des champs différents partagent une étiquette et rien de visible ne les distingue : l’étiquette ne permet pas de connaître la fonction exacte de chaque champ, ce qui ne respecte pas le test 11.2.1 du RGAA (étiquette fournie par une balise <label>) ou le test 11.2.4 du RGAA (étiquette fournie par aria-labelledby).'
        )
      },
      PARTIALLY_HIDDEN_LABEL: {
        steps: [
          t(
            'Find the field the report names and read the visible part of its label on screen.',
            'Repérez le champ indiqué par le rapport et lisez la partie visible de son étiquette à l’écran.'
          ),
          t(
            'Inspect the field in the Accessibility panel and read its full computed name, hidden parts included.',
            'Inspectez le champ dans le panneau Accessibilité et lisez son nom calculé complet, parties masquées comprises.'
          ),
          NEARBY_TEXT,
          t(
            'Decide whether the visible part of the label, that title or that passage of text tells what kind of input is expected.',
            'Déterminez si la partie visible de l’étiquette, ce title ou ce passage de texte permet de comprendre la nature de la saisie attendue.'
          )
        ],
        passWhen: t(
          'The visible part of the label, or a title attribute, or a passage of text next to the field, visible or shown when the field takes focus, tells what kind of input is expected.',
          'La partie visible de l’étiquette, ou un attribut title, ou un passage de texte accolé au champ, visible ou qui le devient à la prise de focus, permet de comprendre la nature de la saisie attendue.'
        ),
        failWhen: t(
          'Neither the visible part of the label, nor a title, nor a passage of text next to the field tells what kind of input is expected (for example, only "OK" is shown), which fails @TESTS@.',
          'Ni la partie visible de l’étiquette, ni un title, ni un passage de texte accolé au champ ne permet de comprendre la nature de la saisie attendue (par exemple, seul « OK » est affiché), ce qui ne respecte pas @TESTS@.'
        )
      },
      PLACEHOLDER_LABEL_TEXT: {
        failWhen: t(
          'The label is placeholder text that does not say what the field is for, which fails RGAA test 11.2.1 (label given by a <label> tag) or RGAA test 11.2.4 (label given by aria-labelledby).',
          'L’étiquette est un texte de remplacement qui ne dit pas à quoi sert le champ, ce qui ne respecte pas le test 11.2.1 du RGAA (étiquette fournie par une balise <label>) ou le test 11.2.4 du RGAA (étiquette fournie par aria-labelledby).'
        )
      }
    },
    'form-control-programmatic-label-quality': {
      label_from_aria_label_only: {
        steps: [
          t(
            'Find on screen the field the report names and read its aria-label, which the report gives.',
            'Repérez à l’écran le champ indiqué par le rapport et lisez son aria-label, que le rapport donne.'
          ),
          NEARBY_TEXT,
          t(
            'Decide whether the aria-label gives the exact purpose of the field.',
            'Déterminez si le contenu de l’aria-label permet de connaître la fonction exacte du champ.'
          )
        ],
        passWhen: t(
          'A title attribute, or a passage of text next to the field, visible or shown when the field takes focus, tells what kind of input is expected, and the aria-label gives the exact purpose of the field.',
          'Un attribut title, ou un passage de texte accolé au champ, visible ou qui le devient à la prise de focus, permet de comprendre la nature de la saisie attendue, et l’aria-label permet de connaître la fonction exacte du champ.'
        ),
        failWhen: t(
          'No title and no passage of text next to the field tells what kind of input is expected, which fails RGAA test 11.1.3; if it is the aria-label that does not give the exact purpose of the field, RGAA test 11.2.3 is the one failed.',
          'Aucun title ni aucun passage de texte accolé au champ ne permet de comprendre la nature de la saisie attendue, ce qui ne respecte pas le test 11.1.3 du RGAA ; si c’est l’aria-label qui ne permet pas de connaître la fonction exacte du champ, c’est le test 11.2.3 du RGAA qui n’est pas respecté.'
        )
      },
      label_from_hidden_labelledby: {
        steps: [
          t(
            'Find the field the report names and, in the developer tools, follow its aria-labelledby ids to the elements they point to.',
            'Repérez le champ indiqué par le rapport et, dans les outils de développement, suivez ses id aria-labelledby jusqu’aux éléments qu’ils désignent.'
          ),
          t(
            'Check whether these elements are shown on screen when the field is.',
            'Vérifiez si ces éléments sont affichés à l’écran quand le champ l’est.'
          ),
          t(
            'Decide whether this passage of text gives the exact purpose of the field, and look for a title or a text next to the field that says what to enter.',
            'Déterminez si ce passage de texte permet de connaître la fonction exacte du champ, et cherchez un title ou un texte accolé au champ qui dit quoi saisir.'
          )
        ],
        passWhen: t(
          'A title attribute, or a passage of text next to the field, visible or shown when the field takes focus, tells what kind of input is expected, and the passage aria-labelledby points to gives the exact purpose of the field.',
          'Un attribut title, ou un passage de texte accolé au champ, visible ou qui le devient à la prise de focus, permet de comprendre la nature de la saisie attendue, et le passage référencé par aria-labelledby permet de connaître la fonction exacte du champ.'
        ),
        failWhen: t(
          'No title and no passage of text next to the field tells what kind of input is expected, which fails RGAA test 11.1.3; if it is the passage aria-labelledby points to that does not give the exact purpose of the field, RGAA test 11.2.4 is the one failed.',
          'Aucun title ni aucun passage de texte accolé au champ ne permet de comprendre la nature de la saisie attendue, ce qui ne respecte pas le test 11.1.3 du RGAA ; si c’est le passage référencé par aria-labelledby qui ne permet pas de connaître la fonction exacte du champ, c’est le test 11.2.4 du RGAA qui n’est pas respecté.'
        )
      },
      label_from_title_primary: {
        steps: [
          t(
            'Find the field the report names and read its title attribute.',
            'Repérez le champ indiqué par le rapport et lisez son attribut title.'
          ),
          t(
            'Decide whether this title gives the exact purpose of the field and the type of data expected.',
            'Déterminez si ce title permet de connaître la fonction exacte du champ et le type de données attendu.'
          )
        ],
        passWhen: t(
          'The title gives the exact purpose of the field: RGAA accepts this label.',
          'Le title permet de connaître la fonction exacte du champ : RGAA accepte cette étiquette.'
        ),
        failWhen: t(
          'The title does not give the exact purpose of the field, which fails @TESTS@.',
          'Le title ne permet pas de connaître la fonction exacte du champ, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'invalid-field-error-message': {
      ERROR_MESSAGE_ARIA_HIDDEN: {
        steps: [
          ERROR_FIRST,
          t(
            'Find the field the report names and confirm that its error message is visible on screen.',
            'Repérez le champ indiqué par le rapport et confirmez que son message d’erreur est visible à l’écran.'
          ),
          t(
            'Inspect the message element aria-errormessage points to and note which of its children have aria-hidden="true".',
            'Inspectez l’élément de message vers lequel pointe aria-errormessage et notez lesquels de ses enfants portent aria-hidden="true".'
          ),
          t(
            "Check whether the visible error text is in the field's <label> tag or in a passage of text associated by aria-labelledby or aria-describedby.",
            'Vérifiez si le texte d’erreur visible se trouve dans la balise <label> du champ ou dans un passage de texte associé par aria-labelledby ou aria-describedby.'
          )
        ],
        ...ERROR_IN_LABEL
      },
      ERROR_MESSAGE_EMPTY: {
        steps: [
          ERROR_FIRST,
          t(
            'Find the field the report names and set off its error state (submit the form or enter an invalid value) if it is not shown already.',
            'Repérez le champ indiqué par le rapport et déclenchez son état d’erreur (soumettez le formulaire ou saisissez une valeur non valide) s’il n’est pas déjà affiché.'
          ),
          t(
            'Inspect the field and find the element its aria-errormessage attribute points to; confirm that it is empty.',
            'Inspectez le champ et trouvez l’élément vers lequel pointe son attribut aria-errormessage ; confirmez qu’il est vide.'
          ),
          t(
            "Look in the field's <label> tag and in a passage of text associated by aria-labelledby or aria-describedby for visible words that say what is wrong.",
            'Cherchez dans la balise <label> du champ et dans un passage de texte associé par aria-labelledby ou aria-describedby des mots visibles qui disent ce qui ne va pas.'
          )
        ],
        ...ERROR_IN_LABEL
      },
      ERROR_MESSAGE_HIDDEN: {
        steps: [
          ERROR_FIRST,
          t(
            'Make the field invalid as a user would (submit the form empty, or enter a wrong value).',
            'Rendez le champ non valide comme le ferait un utilisateur (soumettez le formulaire vide, ou saisissez une valeur erronée).'
          ),
          t(
            'Look for the error message the field points to (its aria-errormessage), and check whether it appears on screen.',
            'Cherchez le message d’erreur vers lequel pointe le champ (son aria-errormessage), et vérifiez s’il apparaît à l’écran.'
          ),
          t(
            "Otherwise, look for the message in the field's <label> tag or in a passage of text associated by aria-labelledby or aria-describedby, and check that it is visible.",
            'Sinon, cherchez le message dans la balise <label> du champ ou dans un passage de texte associé par aria-labelledby ou aria-describedby, et vérifiez qu’il est visible.'
          )
        ],
        ...ERROR_IN_LABEL
      },
      ERROR_MESSAGE_NOT_SHOWN_DESCRIBED: {
        steps: [
          ERROR_FIRST,
          t(
            'Find the field the report names and set off its error state if it is not shown already.',
            'Repérez le champ indiqué par le rapport et déclenchez son état d’erreur s’il n’est pas déjà affiché.'
          ),
          t(
            'Open the Accessibility panel for the field and read its description (from aria-describedby).',
            'Ouvrez le panneau Accessibilité pour le champ et lisez sa description (issue de aria-describedby).'
          ),
          t(
            'Compare this description with the error: decide whether it says what is wrong, or is only help text such as an input format.',
            'Comparez cette description avec l’erreur : déterminez si elle dit ce qui ne va pas, ou si ce n’est qu’un texte d’aide comme un format de saisie.'
          ),
          t(
            'Check that this passage associated by aria-describedby, if it states the error, is itself visible on screen.',
            'Vérifiez que ce passage associé par aria-describedby, s’il énonce l’erreur, est lui-même visible à l’écran.'
          )
        ],
        ...ERROR_IN_LABEL
      },
      ERROR_MESSAGE_TARGET_MISSING: {
        steps: [
          ERROR_FIRST,
          t(
            'Find the field the report names and note the id in its aria-errormessage attribute.',
            'Repérez le champ indiqué par le rapport et notez l’id présent dans son attribut aria-errormessage.'
          ),
          t(
            'Set off the error (submit the form or enter an invalid value) and look in the Elements panel for an element with this id.',
            'Déclenchez l’erreur (soumettez le formulaire ou saisissez une valeur non valide) et cherchez dans le panneau Éléments un élément portant cet id.'
          ),
          t(
            'If the element appears, check that it is shown and that it holds a text describing the error.',
            'Si l’élément apparaît, vérifiez qu’il est affiché et qu’il contient un texte décrivant l’erreur.'
          ),
          t(
            "Look for the message in the field's <label> tag or in a passage of text associated by aria-labelledby or aria-describedby: an element tied only by aria-errormessage is not enough.",
            'Cherchez le message dans la balise <label> du champ ou dans un passage de texte associé par aria-labelledby ou aria-describedby : un élément relié seulement par aria-errormessage ne suffit pas.'
          )
        ],
        ...ERROR_IN_LABEL
      },
      NO_ERROR_MESSAGE: {
        steps: [
          ERROR_FIRST,
          t(
            'Find the field the report names; it is marked aria-invalid.',
            'Repérez le champ indiqué par le rapport ; il est marqué aria-invalid.'
          ),
          t(
            'Check whether the field is really in error at this point; if it is marked invalid before the user has entered anything, enter a valid value and see whether the mark goes away.',
            'Vérifiez si le champ est réellement en erreur à ce moment ; s’il est marqué non valide avant que l’utilisateur ait saisi quoi que ce soit, saisissez une valeur valide et voyez si la marque disparaît.'
          ),
          t(
            "Look in the field's <label> tag and in the passages of text associated by aria-labelledby or aria-describedby for a visible message that says what is wrong.",
            'Cherchez dans la balise <label> du champ et dans les passages de texte associés par aria-labelledby ou aria-describedby un message visible qui dit ce qui ne va pas.'
          )
        ],
        passWhen: t(
          "The field is not really in error (aria-invalid goes away with a valid value), or the error message is visible and is in the field's <label> tag or in a passage of text associated by aria-labelledby or aria-describedby.",
          'Le champ n’est pas réellement en erreur (aria-invalid disparaît avec une saisie valide), ou le message d’erreur est visible et se trouve dans la balise <label> du champ ou dans un passage de texte associé par aria-labelledby ou aria-describedby.'
        ),
        failWhen: ERROR_IN_LABEL.failWhen
      }
    },
    'heading-order': {
      HEADING_ORDER_SKIPPED_LEVEL: {
        steps: [
          t(
            'Find the heading the report names and note its level and that of the heading before it (from the report or the Accessibility panel).',
            'Repérez le titre indiqué par le rapport et notez son niveau ainsi que celui du titre précédent (d’après le rapport ou le panneau Accessibilité).'
          ),
          t(
            "List the page's headings in order, with a screen reader's list of headings or by inspecting them, and look at the section around the skip.",
            'Listez les titres de la page dans l’ordre, avec la liste des titres d’un lecteur d’écran ou en les inspectant, et regardez la section autour du saut.'
          ),
          t(
            'Decide whether the hierarchy of headings stays relevant and consistent at that point.',
            'Déterminez si la hiérarchie des titres reste pertinente et cohérente à cet endroit.'
          )
        ],
        passWhen: t(
          'The hierarchy stays relevant and consistent: a skipped level alone does not fail the criterion.',
          'La hiérarchie reste pertinente et cohérente : un saut de niveau seul n’invalide pas le critère.'
        ),
        failWhen: t(
          'The skipped level makes the hierarchy inconsistent or misleading, which fails @TESTS@.',
          'Le saut de niveau rend la hiérarchie incohérente ou trompeuse, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'embed-text-alternative-quality': {
      TEXT_ALTERNATIVE_REVIEW: {
        steps: [
          t(
            'Look at what the embedded content the report names shows, and check that it is an image (type="image/…"); otherwise, test 1.3.5 does not apply.',
            'Regardez ce que montre le contenu intégré indiqué par le rapport, et vérifiez qu’il s’agit d’une image (type="image/…") ; sinon, le test 1.3.5 ne s’applique pas.'
          ),
          t(
            'Read its alternative (aria-label, the text of aria-labelledby or title, as the report gives it).',
            'Lisez son alternative (aria-label, texte de aria-labelledby ou title, tel que le donne le rapport).'
          ),
          t(
            'Check that this alternative says what the image brings to the content.',
            'Vérifiez que cette alternative dit ce que l’image apporte au contenu.'
          )
        ],
        passWhen: t(
          'The embedded content is not an image, or the alternative says exactly what the image brings.',
          'Le contenu intégré n’est pas une image, ou l’alternative dit avec exactitude ce que l’image apporte.'
        ),
        failWhen: t(
          'The embedded image has an alternative that is generic, wrong, or does not match its information, which fails RGAA test 1.3.5.',
          'L’image embarquée a une alternative générique, fausse, ou qui ne correspond pas à son information, ce qui ne respecte pas le test 1.3.5 du RGAA.'
        )
      }
    },
    'identical-links-same-purpose': {
      SAME_NAME_DIFFERENT_DESTINATION: {
        steps: [
          t(
            'Find all the links with the name the report gives and note where each one leads.',
            'Repérez tous les liens portant le nom indiqué par le rapport et notez où chacun mène.'
          ),
          t(
            `Read the context of each link: ${CONTEXT}.`,
            `Lisez le contexte de chaque lien : ${CONTEXT}.`
          ),
          t(
            'Open each link and compare the pages reached.',
            'Ouvrez chaque lien et comparez les pages atteintes.'
          ),
          t(
            'Decide whether the context of each link tells its purpose and destination.',
            'Déterminez si le contexte de chaque lien permet d’en comprendre la fonction et la destination.'
          )
        ],
        passWhen: t(
          `The links lead to the same destination, or the context of each link tells them apart and tells its purpose and destination, ${AMBIGUOUS}.`,
          `Les liens mènent à la même destination, ou le contexte de chaque lien permet de les différencier et d’en comprendre la fonction et la destination, ${AMBIGUOUS}.`
        ),
        failWhen: t(
          `Links with the same name lead to different destinations and their context does not tell them apart, ${LINK_TESTS}.`,
          `Des liens de même nom mènent à des destinations différentes et leur contexte ne permet pas de les différencier, ${LINK_TESTS}.`
        )
      }
    },
    'image-of-text': {
      IMAGE_BUTTON_TEXT_REVIEW: {
        steps: [
          t(
            'Find the image button the report names and look at the image.',
            'Repérez le bouton image indiqué par le rapport et regardez l’image.'
          ),
          t(
            'Check whether the image holds words or letters, and not only an icon.',
            'Vérifiez si l’image contient des mots ou des lettres, et pas seulement une icône.'
          ),
          t(
            'If so, decide whether that text could be text styled with CSS, or uses a graphic effect that CSS cannot reproduce.',
            'Si c’est le cas, déterminez si ce texte pourrait être du texte stylé en CSS, ou s’il fait appel à un effet graphique que CSS ne peut pas reproduire.'
          ),
          IMAGE_TEXT_MECHANISM
        ],
        passWhen: IMAGE_TEXT_PASS,
        failWhen: t(
          'The button shows an image of text that could be styled text, outside the particular cases and with no replacement mechanism, which fails RGAA test 1.8.2.',
          'Le bouton affiche un texte en image qui pourrait être du texte stylé, hors cas particuliers et sans mécanisme de remplacement, ce qui ne respecte pas le test 1.8.2 du RGAA.'
        )
      },
      SVG_IMAGE_TEXT_REVIEW: {
        steps: [
          t(
            'Find the image the report names and look at the text drawn in it.',
            'Repérez l’image indiquée par le rapport et regardez le texte qui y est dessiné.'
          ),
          t(
            'Decide whether it is part of a logo or a brand name, or a text such as a heading, a sentence or a label.',
            'Déterminez s’il fait partie d’un logo ou d’une dénomination commerciale, ou s’il s’agit d’un texte comme un titre, une phrase ou un libellé.'
          ),
          t(
            'If not, decide whether the text could be text styled with CSS, or uses a graphic effect that CSS cannot reproduce.',
            'Sinon, déterminez si le texte pourrait être du texte stylé en CSS, ou s’il fait appel à un effet graphique que CSS ne peut pas reproduire.'
          ),
          IMAGE_TEXT_MECHANISM
        ],
        passWhen: IMAGE_TEXT_PASS,
        failWhen: t(
          'The image draws a text that could be styled text, outside the particular cases and with no replacement mechanism, which fails RGAA test 1.8.1.',
          'L’image dessine un texte qui pourrait être du texte stylé, hors cas particuliers et sans mécanisme de remplacement, ce qui ne respecte pas le test 1.8.1 du RGAA.'
        )
      }
    },
    'image-redundant-alt': {
      IMAGE_ALT_REDUNDANT: {
        steps: [
          t(
            'Find the image the report names and the text next to it in the same link, the same button or the same parent.',
            'Repérez l’image indiquée par le rapport et le texte situé à côté dans le même lien, le même bouton ou le même parent.'
          ),
          t(
            'Look at the image and decide whether it brings information of its own, or whether the nearby text already gives all its information.',
            'Regardez l’image et décidez si elle apporte une information propre, ou si le texte voisin donne déjà toute son information.'
          ),
          t(
            'If it brings information of its own, read its alt and check that it says that information.',
            'Si elle apporte une information propre, lisez son alt et vérifiez qu’il dit cette information.'
          )
        ],
        passWhen: t(
          'The image brings information of its own and its alt says it, even if it repeats words of the nearby text.',
          'L’image apporte une information propre et son alt la dit, même s’il reprend des mots du texte voisin.'
        ),
        failWhen: t(
          'The image brings nothing the nearby text does not already give: it is a decorative image, and its non-empty alt fails RGAA test 1.2.1; or it brings information of its own that its alt does not say, which fails RGAA test 1.3.1.',
          'L’image n’apporte rien que le texte voisin ne donne déjà : c’est une image de décoration, et son alt non vide ne respecte pas le test 1.2.1 du RGAA ; ou elle apporte une information propre que son alt ne dit pas, ce qui ne respecte pas le test 1.3.1 du RGAA.'
        )
      }
    },
    'img-alt-decorative': {
      EXCLUDED_ELEMENT_REVIEW: {
        failWhen: t(
          'The image conveys information that the content it goes with does not give, and yet it is hidden from assistive technologies, which fails RGAA test 1.1.1 (1.1.5 for an <svg> tag, 1.1.8 for a <canvas> tag).',
          'L’image transmet une information que le contenu auquel elle est associée ne donne pas, et pourtant elle est masquée aux technologies d’assistance, ce qui ne respecte pas le test 1.1.1 du RGAA (1.1.5 pour une balise <svg>, 1.1.8 pour une balise <canvas>).'
        )
      }
    },
    'img-alt-quality': {
      TEXT_ALTERNATIVE_REVIEW: {
        steps: [
          t(
            'Find the image the report names and read its alt text (the report gives the reason it looked suspect, if any).',
            'Repérez l’image indiquée par le rapport et lisez son texte alt (le rapport donne la raison pour laquelle il semblait suspect, le cas échéant).'
          ),
          t(
            'Look at the image and its context, and ask yourself what it brings to the content.',
            'Regardez l’image et son contexte, et demandez-vous ce qu’elle apporte au contenu.'
          ),
          NO_DETAILED_DESCRIPTION(t('identifies the image', 'identifie l’image'), '1.6.1'),
          t(
            'Decide whether the alt says what the image brings to the content; a file name, a web address or a generic word such as "image" does not.',
            'Décidez si l’alt dit ce que l’image apporte au contenu ; un nom de fichier, une adresse web ou un mot générique comme « image » ne le dit pas.'
          )
        ],
        passWhen: t(
          'The alt text identifies the image and conveys the information the user needs, or, for a complex image, identifies it exactly.',
          'Le texte alt identifie l’image et transmet l’information dont l’utilisateur a besoin, ou, pour une image complexe, l’identifie avec exactitude.'
        ),
        failWhen: t(
          'The alt text is wrong, vague or generic (a file name, an address, "image") or does not match the image\'s information, which fails RGAA test 1.3.1.',
          'Le texte alt est faux, vague ou générique (un nom de fichier, une adresse, « image ») ou ne correspond pas à l’information de l’image, ce qui ne respecte pas le test 1.3.1 du RGAA.'
        )
      }
    },
    'no-autoplay-audio': {
      AUTOPLAY_CONTROLS_HIDDEN: {
        steps: [
          t(
            'Load the page with the sound on and listen for whether the hidden audio or video the report names starts by itself.',
            'Chargez la page avec le son activé et écoutez si l’audio ou la vidéo masqué indiqué par le rapport démarre de lui-même.'
          ),
          t(
            'If it plays sound for more than 3 seconds, look on the page for a control (a button, for example) that stops it or sets its volume apart from the system volume.',
            'S’il émet du son pendant plus de 3 secondes, cherchez sur la page un dispositif (un bouton, par exemple) qui l’arrête ou en règle le volume indépendamment du volume du système.'
          ),
          SOUND_CONTROL_TRY
        ],
        passWhen: t(
          'No sound lasts more than 3 seconds, or a control on the page stops it or sets its volume apart from the system volume.',
          'Aucun son ne dure plus de 3 secondes, ou un dispositif de la page permet de l’arrêter ou d’en régler le volume indépendamment du volume du système.'
        ),
        failWhen: SOUND_UNSTOPPABLE
      },
      AUTOPLAY_NO_CONTROLS_MECHANISM: {
        steps: [
          t(
            'Load the page with the sound on and listen for whether the audio or video the report names starts by itself.',
            'Chargez la page avec le son activé et écoutez si l’audio ou la vidéo indiqué par le rapport démarre de lui-même.'
          ),
          t(
            'If it plays sound for more than 3 seconds, look for a control that pauses it, stops it, mutes it or sets its volume, on the element that plays it or elsewhere on the page.',
            'S’il joue du son pendant plus de 3 secondes, cherchez un dispositif qui permet de le mettre en pause, de l’arrêter, de le couper ou d’en régler le volume, sur l’élément qui le déclenche ou ailleurs dans la page.'
          ),
          SOUND_CONTROL_TRY
        ],
        passWhen: t(
          'No sound plays for more than 3 seconds, or a control on the page pauses it, stops it, mutes it or sets its volume.',
          'Aucun son ne joue plus de 3 secondes, ou un dispositif de la page permet de le mettre en pause, de l’arrêter, de le couper ou d’en régler le volume.'
        ),
        failWhen: t(
          'A sound starts by itself for more than 3 seconds with no way to pause it, stop it or set its volume apart from the system volume, which fails RGAA test 4.10.1.',
          'Un son se lance tout seul pendant plus de 3 secondes sans moyen de le mettre en pause, de l’arrêter ou d’en régler le volume indépendamment du volume du système, ce qui ne respecte pas le test 4.10.1 du RGAA.'
        )
      },
      EMBEDDED_SOUND_SOURCE: {
        steps: [
          t(
            'Load the page with the sound on and listen for whether the embed, object or bgsound the report names plays sound by itself.',
            'Chargez la page avec le son activé et écoutez si l’embed, l’object ou le bgsound indiqué par le rapport émet du son de lui-même.'
          ),
          t(
            'If it plays for more than 3 seconds, look for a control that stops it or sets its volume, in the embedded player or elsewhere on the page.',
            'S’il joue pendant plus de 3 secondes, cherchez un dispositif qui l’arrête ou en règle le volume, dans le lecteur intégré ou ailleurs dans la page.'
          ),
          SOUND_CONTROL_TRY
        ],
        passWhen: t(
          'Nothing starts by itself for more than 3 seconds, or a control stops it or sets its volume.',
          'Rien ne se lance automatiquement pendant plus de 3 secondes, ou un dispositif permet de l’arrêter ou d’en régler le volume.'
        ),
        failWhen: t(
          'A sound starts by itself for more than 3 seconds and nothing stops it or sets its volume apart from the system volume, which fails RGAA test 4.10.1.',
          'Un son se lance tout seul pendant plus de 3 secondes et rien ne permet de l’arrêter ni d’en régler le volume indépendamment du volume du système, ce qui ne respecte pas le test 4.10.1 du RGAA.'
        )
      }
    },
    'object-text-alternative-quality': {
      TEXT_ALTERNATIVE_REVIEW: {
        steps: [
          t(
            'Look at the object the report names and check that it shows an image (type="image/…"); otherwise, test 1.3.4 does not apply.',
            'Regardez l’objet indiqué par le rapport et vérifiez qu’il affiche une image (type="image/…") ; sinon, le test 1.3.4 ne s’applique pas.'
          ),
          t(
            'Read its alternative in the report (content between <object> and </object>, aria-label, the text of aria-labelledby or title), or in the Accessibility panel of the developer tools.',
            'Lisez son alternative dans le rapport (contenu placé entre <object> et </object>, aria-label, texte de aria-labelledby ou title), ou dans le panneau Accessibilité des outils de développement.'
          ),
          NO_DETAILED_DESCRIPTION(t('identifies the image', 'identifie l’image'), '1.6.2'),
          t(
            'Decide whether this alternative says what the image brings to the content.',
            'Décidez si cette alternative dit ce que l’image apporte au contenu.'
          )
        ],
        passWhen: t(
          'The object is not an image, or its alternative identifies the image and conveys the information it brings.',
          'L’objet n’est pas une image, ou son alternative identifie l’image et transmet l’information qu’elle apporte.'
        ),
        failWhen: t(
          'The alternative of the object image is wrong, vague (such as "object" or a file name) or does not match its information, which fails RGAA test 1.3.4.',
          'L’alternative de l’image objet est fausse, vague (comme « objet » ou un nom de fichier) ou ne correspond pas à son information, ce qui ne respecte pas le test 1.3.4 du RGAA.'
        )
      }
    },
    'link-in-text-block': {
      ...Object.fromEntries(
        [
          'ANCESTOR_OPACITY',
          'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
          'BACKGROUND_IMAGE_OR_GRADIENT',
          'BACKGROUND_OVERLAP',
          'COLOR_NOT_COMPUTABLE',
          'CONTRAST_HELPERS_UNAVAILABLE',
          'ELEMENT_OPACITY',
          'ENGINE_EXCEPTION',
          'MIX_BLEND_MODE',
          'PSEUDO_ELEMENT_COLOR',
          'TEXT_DECORATION_NOT_RESOLVABLE',
          'TEXT_SHADOW',
          'TEXT_STROKE'
        ].map((code) => [code, linkInText(code)])
      ),
      BACKGROUND_NOT_OPAQUE_AT_ROOT: {
        passWhen: t(
          "In every setting the page is shown in, the link's own background stands out clearly from the one around it (the pack counts that background as a visual cue of the link), or another cue than color sets the link apart.",
          'Dans tous les contextes où la page s’affiche, l’arrière-plan propre du lien se distingue nettement de celui qui l’entoure (le pack compte ce fond comme une marque visuelle du lien), ou une autre marque non liée à la couleur distingue le lien.'
        )
      },
      LINK_COLOR_CONTRAST_ONLY: {
        steps: [
          ...coreSteps('linkInTextBlock', 'LINK_COLOR_CONTRAST_ONLY', 3),
          t(
            "If the link's color changes once visited, on activation, on hover or on focus, check in each of these states a contrast of at least 3:1 with the surrounding text.",
            'Si la couleur du lien change une fois visité, à l’activation, au survol ou au focus, vérifiez dans chacun de ces états un contraste d’au moins 3:1 avec le texte environnant.'
          )
        ],
        passWhen: t(
          'Both hover and focus add to the link a visual indication other than a change of color, such as an underline, and in each state where its color changes, the link keeps a contrast of at least 3:1 with the surrounding text.',
          'Le survol comme la prise de focus ajoutent au lien une indication visuelle autre qu’un changement de couleur, comme un soulignement, et dans chaque état où sa couleur change, le lien garde un contraste d’au moins 3:1 avec le texte environnant.'
        ),
        failWhen: t(
          "Hover or focus changes only the link's color, or one of its colored states contrasts below 3:1 with the surrounding text, which fails @TESTS@.",
          'Le survol ou la prise de focus ne change que la couleur du lien, ou un de ses états colorés contraste à moins de 3:1 avec le texte environnant, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'list-children-valid': {
      LIST_INVALID_CHILD: {
        steps: coreSteps('listChildrenValid', 'LIST_INVALID_CHILD', 2),
        passWhen: t(
          `The content that is not an <li> is not presented as one of the list's items (a heading, a separator, a container, stray text): each item shown in the list is an <li>. ${NESTING_STAYS}`,
          `Le contenu qui n’est pas un <li> n’est pas présenté comme l’un des éléments de la liste (un titre, un séparateur, un conteneur, du texte isolé) : chaque élément présenté dans la liste est un <li>. ${NESTING_STAYS}`
        ),
        failWhen: t(
          `The page presents this content as one of the list's items, but it is not marked up with <li>: the list is not structured with the <ul> (or <ol>) and <li> elements, ${LIST_TESTS}.`,
          `La page présente ce contenu comme l’un des éléments de la liste, mais il n’est pas balisé avec <li> : la liste n’est pas structurée au moyen des éléments <ul> (ou <ol>) et <li>, ${LIST_TESTS}.`
        )
      },
      LIST_ITEM_ROLE_OVERRIDDEN: {
        steps: coreSteps('listChildrenValid', 'LIST_ITEM_ROLE_OVERRIDDEN', 2),
        passWhen: t(
          "The <li> whose role is replaced is not presented as one of the list's items.",
          'Le <li> dont le rôle est remplacé n’est pas présenté comme l’un des éléments de la liste.'
        ),
        failWhen: t(
          `The page presents this <li> as one of the list's items, but its role attribute takes away its list item role: the list is not structured with the <ul> (or <ol>) and <li> elements, ${LIST_TESTS}.`,
          `La page présente ce <li> comme l’un des éléments de la liste, mais son attribut role lui retire son rôle d’élément de liste : la liste n’est pas structurée au moyen des éléments <ul> (ou <ol>) et <li>, ${LIST_TESTS}.`
        )
      }
    },
    'listitem-parent-valid': {
      LISTITEM_INVALID_PARENT: {
        steps: coreSteps('listitemParentValid', 'LISTITEM_INVALID_PARENT', 2),
        passWhen: t(
          'The element is not presented as an item of a list; an <li> outside a list is still a nesting error under RGAA test 8.2.1.',
          'L’élément n’est pas présenté comme élément d’une liste ; un <li> hors d’une liste reste une erreur d’imbrication au titre du test 8.2.1 du RGAA.'
        ),
        failWhen: t(
          'The <li> is marked up as a list item, but no <ul>, <ol> or <menu> tag contains it: the list is not structured with the <ul> and <li> elements, which fails @TESTS@.',
          'Le <li> est balisé comme élément de liste, mais aucune balise <ul>, <ol> ou <menu> ne le contient : la liste n’est pas structurée au moyen des éléments <ul> et <li>, ce qui ne respecte pas @TESTS@.'
        )
      },
      LIST_ROLE_OVERRIDDEN: {
        steps: coreSteps('listitemParentValid', 'LIST_ROLE_OVERRIDDEN', 2),
        passWhen: t(
          'The content is not presented as a list (it is, for example, a menu or tabs whose role fits), so test 9.3 does not apply to it.',
          'Le contenu n’est pas présenté comme une liste (c’est par exemple un menu ou des onglets dont le rôle convient), donc le test 9.3 ne s’y applique pas.'
        ),
        failWhen: t(
          `The page presents the content as a list, but the role attribute of the <ul> (or <ol>) tag takes away its list role, ${LIST_TESTS}.`,
          `La page présente le contenu comme une liste, mais l’attribut role de la balise <ul> (ou <ol>) lui retire son rôle de liste, ${LIST_TESTS}.`
        )
      }
    },
    'link-name-quality': {
      AMBIGUOUS_FORMAT_NAME: {
        steps: [
          t(
            'Find the link the report names; its text is only a format, such as "PDF".',
            'Repérez le lien indiqué par le rapport ; son texte n’est qu’un format, comme « PDF ».'
          ),
          t(
            `Read the link's context: ${CONTEXT}, and see whether one of them names the document.`,
            `Lisez le contexte du lien : ${CONTEXT}, et voyez si l’un d’eux nomme le document.`
          ),
          t(
            'Follow the link and confirm that the document is the one this context names.',
            'Suivez le lien et confirmez que le document est bien celui que nomme ce contexte.'
          )
        ],
        passWhen: t(
          `The sentence, the paragraph, the list item, the heading before it, the link's cell or a table header associated with that cell names the document: the link then reads, for example, as the annual report in PDF; ${AMBIGUOUS}.`,
          `La phrase, le paragraphe, l’élément de liste, le titre précédent, la cellule du lien ou un en-tête de tableau associé à cette cellule nomme le document : le lien se comprend alors, par exemple, comme le rapport annuel en PDF ; ${AMBIGUOUS}.`
        ),
        failWhen: t(
          `Nothing in the link's context says which document it is: neither the link's text nor its context tells its purpose and destination, ${LINK_TESTS}.`,
          `Rien dans le contexte du lien n’indique de quel document il s’agit : ni l’intitulé ni le contexte du lien ne permettent d’en comprendre la fonction et la destination, ${LINK_TESTS}.`
        )
      },
      GENERIC_LINK_TEXT: {
        steps: [
          t(
            'Find the link the report names and read its text, such as "read more" or "click here".',
            'Repérez le lien indiqué par le rapport et lisez son texte, comme « lire la suite » ou « cliquez ici ».'
          ),
          t(`Read the link's context: ${CONTEXT}.`, `Lisez le contexte du lien : ${CONTEXT}.`),
          t(
            "Ask yourself whether the link's text, together with that context, clearly says what the link does and where it leads.",
            'Demandez-vous si l’intitulé, additionné à ce contexte, indique clairement la fonction et la destination du lien.'
          ),
          t(
            'Follow the link and confirm that it leads where the context says.',
            'Suivez le lien et confirmez qu’il mène là où le contexte l’indique.'
          )
        ],
        passWhen: t(
          `The link's text, together with the link's context, tells its purpose and destination, ${AMBIGUOUS}.`,
          `L’intitulé du lien, additionné au contexte du lien, permet d’en comprendre la fonction et la destination, ${AMBIGUOUS}.`
        ),
        failWhen: t(
          `Neither the link's text nor its context tells its purpose and destination, ${LINK_TESTS}.`,
          `Ni l’intitulé ni le contexte du lien ne permettent d’en comprendre la fonction et la destination, ${LINK_TESTS}.`
        )
      }
    },
    'live-region-announcements': {
      LIVE_REGION_BUSY: {
        steps: [
          t(
            'Find the live region the report names; it had aria-busy="true" when the page was scanned.',
            'Repérez la zone live indiquée par le rapport ; elle avait aria-busy="true" lors de l’analyse de la page.'
          ),
          t(
            'Trigger the action that updates the region, then inspect it in the developer tools and see whether aria-busy turns to false or is removed once the update is over.',
            'Déclenchez l’action qui met à jour la zone, puis inspectez-la dans les outils de développement et voyez si aria-busy passe à false ou est retiré une fois la mise à jour terminée.'
          ),
          t(
            'Do the action again with a screen reader running and listen to the message.',
            'Refaites l’action avec un lecteur d’écran en marche et écoutez le message.'
          ),
          t(
            'If you hear nothing from this region, check whether the page announces the same message another way, for example from another status region the screen reader reads. It counts only if you hear the whole message without moving focus.',
            'Si vous n’entendez rien de cette zone, vérifiez si la page annonce le même message autrement, par exemple depuis une autre zone d’état que le lecteur d’écran lit. Cela ne compte que si vous entendez le message en entier sans déplacer le focus.'
          ),
          STATUS_NATURE
        ],
        failWhen: t(
          `aria-busy stays true, the screen reader holds back or skips the message and the page announces it in no other way, ${STATUS_TESTS}.`,
          `aria-busy reste à true, le lecteur d’écran retient ou saute le message et la page ne l’annonce d’aucune autre façon, ${STATUS_TESTS}.`
        )
      },
      LIVE_REGION_HIDDEN: {
        steps: [
          t(
            'Find the live region the report names and note what hides it, as the report says: aria-hidden="true" or inert on it or on an ancestor, or a modal dialog open in front of it.',
            'Repérez la zone live indiquée par le rapport et notez ce qui la masque, comme le précise le rapport : aria-hidden="true" ou inert sur elle ou sur un ancêtre, ou une boîte de dialogue modale ouverte devant elle.'
          ),
          t(
            'Check whether a modal dialog was open when the page was scanned; if so, note whether the page writes to the region while it is open, then close it and see whether the region is still hidden.',
            'Vérifiez si une boîte de dialogue modale était ouverte lors de l’analyse de la page ; si c’est le cas, notez si la page écrit dans la zone pendant qu’elle est ouverte, puis fermez-la et voyez si la zone est toujours masquée.'
          ),
          t(
            'Trigger the action that updates the region (submit a form, add to the cart, run a search) with a screen reader running.',
            'Déclenchez l’action qui met à jour la zone (soumettre un formulaire, ajouter au panier, lancer une recherche) avec un lecteur d’écran en marche.'
          ),
          t(
            'Listen to the message. If you hear nothing, check in the Accessibility pane of the developer tools whether this region, or another status region carrying the same message, is in the tree when the text changes.',
            'Écoutez le message. Si vous n’entendez rien, vérifiez dans le volet Accessibilité des outils de développement si cette zone, ou une autre zone d’état portant le même message, est dans l’arbre quand le texte change.'
          ),
          STATUS_NATURE
        ],
        failWhen: t(
          `The region is still hidden by aria-hidden, inert or an open modal dialog when the message arrives, and nothing else announces it: the screen reader says nothing, ${STATUS_TESTS}.`,
          `La zone est encore masquée par aria-hidden, inert ou une boîte de dialogue modale ouverte quand le message arrive, et rien d’autre ne l’annonce : le lecteur d’écran ne dit rien, ${STATUS_TESTS}.`
        )
      },
      LIVE_REGION_INSERTED_WITH_CONTENT: {
        steps: [
          t(
            'Find the message the report quotes and the action that shows it (the report gives the text and the region).',
            'Repérez le message cité par le rapport et l’action qui l’affiche (le rapport donne le texte et la zone).'
          ),
          t(
            'Start a screen reader, then do that action.',
            'Lancez un lecteur d’écran, puis effectuez cette action.'
          ),
          t(
            'Listen to the message without moving focus to it.',
            'Écoutez le message sans y déplacer le focus.'
          ),
          t(
            'If it is not read, check in the developer tools whether the page adds the region already filled; an empty region should first be on the page, with the text written into it afterwards.',
            'S’il n’est pas lu, vérifiez dans les outils de développement si la page ajoute la zone déjà remplie ; une zone vide devrait d’abord être présente sur la page, le texte y étant écrit ensuite.'
          ),
          STATUS_NATURE
        ],
        failWhen: t(
          `The message appears on screen but the screen reader does not announce it, because the region was added with its text already in it, ${STATUS_TESTS}.`,
          `Le message apparaît à l’écran mais le lecteur d’écran ne l’annonce pas, parce que la zone a été ajoutée avec son texte déjà présent, ${STATUS_TESTS}.`
        )
      },
      LIVE_REGION_SHOWN_AND_FILLED: {
        steps: [
          t(
            'Find the message the report quotes and the action that shows it.',
            'Repérez le message cité par le rapport et l’action qui l’affiche.'
          ),
          t(
            'Start a screen reader, then do that action.',
            'Lancez un lecteur d’écran, puis effectuez cette action.'
          ),
          t(
            'Listen to the message without moving focus to it.',
            'Écoutez le message sans y déplacer le focus.'
          ),
          t(
            'If it is not read, check in the developer tools whether the region stays hidden until its text is set; it should be visible (or present and empty) before the text arrives.',
            'S’il n’est pas lu, vérifiez dans les outils de développement si la zone reste masquée jusqu’au moment où son texte est défini ; elle devrait être visible (ou présente et vide) avant l’arrivée du texte.'
          ),
          STATUS_NATURE
        ],
        failWhen: t(
          `The message appears but the screen reader does not announce it, because the region was shown and filled at the same moment, ${STATUS_TESTS}.`,
          `Le message apparaît mais le lecteur d’écran ne l’annonce pas, parce que la zone a été affichée et remplie au même moment, ${STATUS_TESTS}.`
        )
      }
    },
    'menuitem-name-present': itemName(
      t('the menu item', 'l’élément de menu'),
      t('The menu item', 'L’élément de menu')
    ),
    'mouse-only-event-handlers': {
      MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE: {
        steps: [
          t(
            'Find the element the report names and note what its mouse handlers do as you hover over it or click it.',
            'Repérez l’élément indiqué par le rapport et notez ce que font ses gestionnaires de souris en le survolant ou en cliquant dessus.'
          ),
          t(
            'Go through this part of the page with Tab and watch whether focus ever reaches the element or something it contains.',
            'Parcourez cette partie de la page avec Tab et observez si le focus arrive un jour sur l’élément ou sur quelque chose qu’il contient.'
          ),
          t(
            'If it does, try Enter and the arrow keys and compare with what the mouse did.',
            'Si c’est le cas, essayez Entrée et les touches de direction et comparez avec ce qu’a fait la souris.'
          ),
          otherElementStep(t('the mouse does', 'fait la souris'))
        ],
        passWhen: t(
          `The element (or an element it contains) takes keyboard focus and its keyboard or focus handlers give the same result as the mouse, or ${OTHER_ELEMENT}, or ${PRESENTATION_ONLY}.`,
          `L’élément (ou un élément qu’il contient) reçoit le focus clavier et ses gestionnaires de clavier ou de focus donnent le même résultat que la souris, ou ${OTHER_ELEMENT}, ou ${PRESENTATION_ONLY}.`
        ),
        failWhen: t(
          `Focus never reaches the element and ${NO_OTHER_ELEMENT}, which fails @TESTS@.`,
          `Le focus n’atteint jamais l’élément et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
        )
      },
      MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT: {
        passWhen: t(
          `The keyboard gets the same result on focus or with a key, or ${OTHER_ELEMENT}, or ${PRESENTATION_ONLY}.`,
          `Le clavier obtient le même résultat au focus ou avec une touche, ou ${OTHER_ELEMENT}, ou ${PRESENTATION_ONLY}.`
        ),
        failWhen: t(
          `Something the mouse does (opening a menu, showing information, moving an element) cannot be done by keyboard, and ${NO_OTHER_ELEMENT}, which fails @TESTS@.`,
          `Une chose que fait la souris (ouvrir un menu, afficher une information, déplacer un élément) ne peut pas être faite au clavier, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
        )
      }
    },
    'manual-review': {
      KEYBOARD_REVIEW: {
        steps: [
          t(
            "Click in the browser's address bar, then press Tab several times, and Shift+Tab to go back, to go through each link and each control of the page.",
            'Cliquez dans la barre d’adresse du navigateur, puis appuyez plusieurs fois sur Tab, et sur Maj+Tab pour revenir, afin de parcourir chaque lien et chaque contrôle de la page.'
          ),
          t(
            'At each stop, check that you can see where focus is (outline or background changed, with a contrast of at least 3:1 against what surrounds it), and that the order it moves in stays consistent with the content (it need not follow the reading order as long as it stays consistent; in a modal window, it must go through its elements only).',
            'À chaque arrêt, vérifiez que vous voyez où se trouve le focus (contour ou fond modifié, contrasté à 3:1 au moins avec ce qui l’entoure), et que l’ordre de déplacement reste cohérent avec le contenu (il n’a pas à suivre l’ordre de lecture tant qu’il reste cohérent ; dans une fenêtre modale, il ne doit parcourir que ses éléments).'
          ),
          t(
            'Open and close the menus and the dialogs by keyboard, and go through their content too.',
            'Ouvrez et fermez au clavier les menus et les boîtes de dialogue, et parcourez aussi leur contenu.'
          ),
          t(
            'Check that, from each element, Tab or Shift+Tab reaches the next or previous element, or that another key the user is told about does.',
            'Vérifiez que, depuis chaque élément, Tab ou Maj+Tab permet d’atteindre l’élément suivant ou précédent, ou qu’une autre touche dont l’utilisateur est informé le permet.'
          )
        ],
        passWhen: t(
          'The tab order stays consistent, each element lets you reach the next and the previous one by keyboard, and taking focus is always visible.',
          'L’ordre de tabulation reste cohérent, chaque élément permet d’atteindre le suivant et le précédent au clavier, et la prise de focus est toujours visible.'
        ),
        failWhen: t(
          'The tab order is not consistent (RGAA test 12.8.1), or focus stays stuck on an element with no way out the user is told about (RGAA test 12.9.1), or taking focus is not visible (RGAA test 10.7.1): each of these cases fails the RGAA test named.',
          'L’ordre de tabulation n’est pas cohérent (test 12.8.1 du RGAA), ou le focus reste bloqué sur un élément sans moyen dont l’utilisateur est informé (test 12.9.1 du RGAA), ou la prise de focus n’est pas visible (test 10.7.1 du RGAA) : chacun de ces cas ne respecte pas le test RGAA indiqué.'
        )
      }
    },
    'page-title-patterns': {
      duplicateTitlesAcrossPages: {
        passWhen: t(
          'The pages that share the title are one content at different URLs.',
          'Les pages qui partagent le titre sont un même contenu à des URL différentes.'
        ),
        failWhen: t(
          'Different pages share one title that neither identifies each of them nor tells them apart in the browsing history or the list of tabs, which fails @TESTS@.',
          'Des pages différentes partagent un même titre, qui ne permet ni de les identifier de manière unique ni de les distinguer dans l’historique de navigation ou la liste des onglets, ce qui ne respecte pas @TESTS@.'
        )
      },
      genericTitle: {
        passWhen: t(
          `The title says what the page is about, even if it is a common word, ${TITLE_FOUND}`,
          `Le titre dit de quoi parle la page, même s’il s’agit d’un mot courant, ${TITLE_FOUND}`
        )
      },
      templateLikeTitle: {
        passWhen: t(
          `The page is the site's home page, which the title names, or the title says what the page is about, ${TITLE_FOUND}`,
          `La page est la page d’accueil du site, que le titre nomme, ou le titre dit de quoi parle la page, ${TITLE_FOUND}`
        )
      },
      templatedTitlesAcrossPages: {
        passWhen: t(
          `Each title has a part of its own that says what its page is about, ${TITLE_FOUND}`,
          `Chaque titre a une partie propre qui dit de quoi parle sa page, ${TITLE_FOUND}`
        ),
        failWhen: t(
          'Beyond the shared part, the titles neither identify each page nor let it be found in the history or the list of tabs, which fails @TESTS@.',
          'Au-delà de la partie partagée, les titres ne permettent pas d’identifier chaque page ni de la retrouver dans l’historique ou la liste des onglets, ce qui ne respecte pas @TESTS@.'
        )
      },
      titleReview: {
        passWhen: t(
          `The title says what the page is about or what it is for, ${TITLE_FOUND}`,
          `Le titre dit de quoi parle la page ou à quoi elle sert, ${TITLE_FOUND}`
        )
      },
      veryShortTitle: {
        passWhen: t(
          `The short title says what the page is about, for example the name of the product or the place it presents, ${TITLE_FOUND}`,
          `Le titre court dit de quoi parle la page, par exemple le nom du produit ou du lieu qu’elle présente, ${TITLE_FOUND}`
        )
      }
    },
    'server-side-image-map-absent': {
      SERVER_SIDE_IMAGE_MAP: {
        passWhen: t(
          'Each destination of the image map can also be reached through a link, a set of links or another component (a select list, for example) usable whatever the pointing device.',
          'Chaque destination de l’image réactive est aussi accessible par un lien, un ensemble de liens ou un autre composant (une liste de sélection, par exemple) utilisable quel que soit le dispositif de pointage.'
        )
      }
    },
    'skip-link': {
      SKIP_LINK_TARGET_MISSING: {
        failWhen: t(
          "Nothing happens or focus stays at the top, because no element matches the link's target: the link does not work, which fails @TESTS@.",
          'Rien ne se passe ou le focus reste en haut, car aucun élément ne correspond à la cible du lien : le lien n’est pas fonctionnel, ce qui ne respecte pas @TESTS@.'
        )
      },
      SKIP_LINK_TARGET_UNUSABLE: {
        failWhen: t(
          'The target is hidden, not displayed or has no size: the link does not work, which fails @TESTS@.',
          'La cible est masquée, non affichée ou sans dimension : le lien n’est pas fonctionnel, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'text-spacing-content-loss': {
      STYLESHEET_IMPORTANT: {
        steps: [
          ...coreSteps('textSpacingContentLoss', 'STYLESHEET_IMPORTANT', 3),
          t(
            "If not, add these values with !important to the element's style (the element.style section), as a user style sheet would, which overrides the page's !important, and check whether its text stays readable.",
            'Si ce n’est pas le cas, ajoutez ces valeurs avec !important dans le style de l’élément (section element.style), comme le ferait une feuille de style utilisateur, qui l’emporte sur le !important de la page, et vérifiez si son texte reste lisible.'
          )
        ],
        passWhen: t(
          "The test's spacing applies to the element, or applies once set as a user style sheet would set it, and its text stays readable: nothing is cut off, hidden or overlaps.",
          'L’espacement du test s’applique à l’élément, ou s’y applique une fois imposé comme le ferait une feuille de style utilisateur, et son texte reste lisible : rien n’est coupé, masqué ni ne se chevauche.'
        ),
        failWhen: t(
          "Once the test's spacing is applied to the element, some text is cut off, hidden or overlaps, which fails @TESTS@.",
          'Une fois l’espacement du test appliqué à l’élément, du texte est coupé, masqué ou se chevauche, ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'svg-text-alternative-quality': {
      TEXT_ALTERNATIVE_REVIEW: {
        steps: [
          t(
            'Look at the graphic the report names and note what it shows (an icon, a logo, a chart and its data).',
            'Regardez le graphique indiqué par le rapport et notez ce qu’il montre (une icône, un logo, un diagramme et ses données).'
          ),
          t(
            'Read its alternative in the report (title, aria-label or the text of aria-labelledby; desc does not count for this test), or in the Accessibility panel of the developer tools.',
            'Lisez son alternative dans le rapport (title, aria-label ou texte de aria-labelledby ; desc ne compte pas pour ce test), ou dans le panneau Accessibilité des outils de développement.'
          ),
          NO_DETAILED_DESCRIPTION(t('identifies the graphic', 'identifie le graphique'), '1.6.5'),
          t(
            'Decide whether the alternative says what the graphic brings to the content, or whether it is a decorative image.',
            'Décidez si l’alternative dit ce que le graphique apporte au contenu, ou s’il s’agit d’une image de décoration.'
          )
        ],
        passWhen: t(
          'The alternative identifies the graphic and conveys the information it brings.',
          'L’alternative identifie le graphique et transmet l’information qu’il apporte.'
        ),
        failWhen: t(
          'The graphic carries information and its alternative is wrong, vague (such as "image" or "icon") or does not match its information, which fails RGAA test 1.3.6; or it is a decorative image that is not hidden by aria-hidden="true" and keeps an alternative, which fails RGAA test 1.2.4.',
          'Le graphique est porteur d’information et son alternative est fausse, vague (comme « image » ou « icône ») ou ne correspond pas à son information, ce qui ne respecte pas le test 1.3.6 du RGAA ; ou c’est une image de décoration qui n’est pas masquée par aria-hidden="true" et garde une alternative, ce qui ne respecte pas le test 1.2.4 du RGAA.'
        )
      }
    },
    'table-fake-caption': {
      SINGLE_CELL_FIRST_ROW_NO_CAPTION: {
        steps: [
          t(
            'Find the table the report names and look at its first row, which holds a single cell of text.',
            'Repérez le tableau indiqué par le rapport et regardez sa première ligne, qui contient une seule cellule de texte.'
          ),
          t(
            'First check that it is a data table; a layout table is a matter for RGAA criterion 5.3. Then decide whether this cell is a title for the whole table, or a real piece of data or a header of its column.',
            'Vérifiez d’abord qu’il s’agit d’un tableau de données ; un tableau de mise en forme relève du critère RGAA 5.3. Déterminez ensuite si cette cellule est un titre pour tout le tableau, ou une vraie donnée ou un en-tête de sa colonne.'
          ),
          t(
            'If it is a title, check in the Accessibility panel of the developer tools whether the table has a name, given by a <caption> tag, a title attribute, aria-label or aria-labelledby.',
            'S’il s’agit d’un titre, vérifiez dans le panneau Accessibilité des outils de développement si le tableau a un nom, donné par une balise <caption>, un attribut title, aria-label ou aria-labelledby.'
          )
        ],
        passWhen: t(
          "The cell of the first row is data or a header; or the table's title is associated with it by a <caption> tag, a title attribute, aria-label or aria-labelledby; or the table is a layout table.",
          'La cellule de la première ligne est une donnée ou un en-tête ; ou le titre du tableau lui est associé par une balise <caption>, un attribut title, aria-label ou aria-labelledby ; ou le tableau est un tableau de mise en forme.'
        ),
        failWhen: t(
          "The data table's title appears only as a cell of the first row, without being associated with it by a <caption> tag, a title attribute, aria-label or aria-labelledby, which fails RGAA test 5.4.1.",
          'Le titre du tableau de données n’apparaît que comme une cellule de la première ligne, sans lui être associé par une balise <caption>, un attribut title, aria-label ou aria-labelledby, ce qui ne respecte pas le test 5.4.1 du RGAA.'
        )
      }
    },
    tabindex: {
      TABINDEX_POSITIVE: {
        steps: [
          t(
            'Click just before the start of the page, then press Tab several times, watching the focus outline.',
            'Cliquez juste avant le début de la page, puis appuyez plusieurs fois sur Tab en observant le contour de focus.'
          ),
          t(
            'Note when the element the report names takes focus, compared with its place on screen.',
            'Notez à quel moment l’élément indiqué par le rapport reçoit le focus, par rapport à sa position à l’écran.'
          ),
          t(
            'Check whether the order in which focus goes through the page stays consistent with its content (it may depart from the reading order as long as it stays logical), going forward with Tab and back with Shift+Tab.',
            'Vérifiez si l’ordre dans lequel le focus parcourt la page reste cohérent avec son contenu (il peut s’écarter de l’ordre de lecture tant qu’il reste logique), en avançant avec Tab puis en reculant avec Maj+Tab.'
          )
        ],
        passWhen: t(
          'Focus goes through the page in an order consistent with its content, even if it departs from the reading order.',
          'Le focus parcourt la page dans un ordre cohérent avec son contenu, même s’il s’écarte de l’ordre de lecture.'
        ),
        failWhen: t(
          'The positive tabindex sends focus in an order inconsistent with the content (for example, it jumps from one area to another unrelated one, then comes back), which fails @TESTS@.',
          'Le tabindex positif fait passer le focus dans un ordre incohérent avec le contenu (par exemple, il saute d’une zone à une autre sans lien, puis revient), ce qui ne respecte pas @TESTS@.'
        )
      }
    },
    'tab-name-present': itemName(t('the tab', 'l’onglet'), t('The tab', 'L’onglet')),
    'treeitem-name-present': itemName(
      t('the tree item', 'l’élément d’arborescence'),
      t('The tree item', 'L’élément d’arborescence')
    ),
    // 7.3.1 asks that the element work by keyboard; whether a screen reader
    // announces it is 7.1.2's.
    'widget-keyboard-focusable': {
      ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE: {
        steps: [
          t(
            'Find the element the report names; it uses aria-activedescendant to point to its active item.',
            'Repérez l’élément indiqué par le rapport ; il utilise aria-activedescendant pour désigner son élément actif.'
          ),
          t(
            'Using only the keyboard, open or reach the widget (for example by typing in its search field) and watch whether it is this element, and not another, that takes focus.',
            'En n’utilisant que le clavier, ouvrez ou atteignez le widget (par exemple en tapant dans son champ de recherche) et observez si c’est bien cet élément, et pas un autre, qui reçoit le focus.'
          ),
          t(
            'Press the arrow keys and check that the active item visibly changes and that Enter picks it.',
            'Appuyez sur les touches de direction et vérifiez que l’élément actif change visiblement et qu’Entrée le choisit.'
          ),
          t(
            'If the items cannot be reached that way, check whether another element of the page, usable by keyboard and by mouse, makes the same choices possible, for example a text field to type the value in. It counts only if every choice is available that way.',
            'Si les éléments ne peuvent pas être atteints ainsi, vérifiez si un autre élément de la page, utilisable au clavier et à la souris, permet de faire les mêmes choix, par exemple un champ de texte où saisir la valeur. Cela ne compte que si chaque choix est disponible ainsi.'
          )
        ],
        passWhen: t(
          'The element takes focus and the arrow keys go through the items and pick them, or another element of the page, usable by keyboard and by any pointing device, makes the same choices possible.',
          'L’élément reçoit le focus et les touches de direction permettent de parcourir et de choisir les éléments, ou un autre élément de la page, utilisable au clavier et à tout dispositif de pointage, permet de faire les mêmes choix.'
        ),
        failWhen: t(
          'The element cannot take focus, so its items can be neither gone through nor picked by keyboard, and no other element of the page usable by keyboard makes the same choices possible, which fails @TESTS@.',
          'L’élément ne peut pas recevoir le focus, ses éléments ne peuvent donc pas être parcourus ni choisis au clavier, et aucun autre élément de la page utilisable au clavier ne permet les mêmes choix, ce qui ne respecte pas @TESTS@.'
        )
      },
      COMPOSITE_NO_TAB_STOP: {
        steps: [
          t(
            'Find the widget the report names (a menu, a list box, a tab list, a toolbar, a grid or a tree).',
            'Repérez le widget indiqué par le rapport (un menu, une zone de liste, une liste d’onglets, une barre d’outils, une grille ou une arborescence).'
          ),
          t(
            'Click just before it and press Tab, then watch whether focus goes into it or reaches one of its items.',
            'Cliquez juste avant lui et appuyez sur Tab, puis observez si le focus y entre ou atteint l’un de ses éléments.'
          ),
          t(
            'If it is a popup, open it by keyboard from its button and see whether focus moves into it.',
            'S’il s’agit d’une fenêtre contextuelle, ouvrez-la au clavier depuis son bouton et voyez si le focus s’y déplace.'
          ),
          t(
            'Once inside, check that the arrow keys move from one item to another.',
            'Une fois à l’intérieur, vérifiez que les touches de direction permettent de passer d’un élément à l’autre.'
          ),
          t(
            'If focus never goes into it, check whether another element of the page, usable by keyboard and by mouse, does what the component does, for example the same choices offered as links or buttons. It counts only if every option of the component is available that way.',
            'Si le focus n’y entre jamais, vérifiez si un autre élément de la page, utilisable au clavier et à la souris, réalise ce que fait le composant, par exemple les mêmes choix proposés sous forme de liens ou de boutons. Cela ne compte que si chaque option du composant est disponible ainsi.'
          )
        ],
        passWhen: t(
          'Tab (or the button that opens it) puts focus in the component and the arrow keys move from one item to another, or other elements of the page, usable by keyboard and by any pointing device, do everything its items do.',
          'Tab (ou le bouton qui l’ouvre) place le focus dans le composant et les touches de direction passent d’un élément à l’autre, ou d’autres éléments de la page, utilisables au clavier et à tout dispositif de pointage, réalisent tout ce que font ses éléments.'
        ),
        failWhen: t(
          'Focus never goes into the component or its items by keyboard, and no other element of the page usable by keyboard does what they do, which fails @TESTS@.',
          'Le focus n’entre jamais dans le composant ni dans ses éléments au clavier, et aucun autre élément de la page utilisable au clavier ne réalise ce qu’ils font, ce qui ne respecte pas @TESTS@.'
        )
      },
      WIDGET_NOT_FOCUSABLE: {
        steps: [
          t(
            'Find the widget the report names and note what it does when you click or touch it.',
            'Repérez le widget indiqué par le rapport et notez ce qu’il fait quand on clique dessus ou qu’on le touche.'
          ),
          t(
            'Click just before it, then press Tab and watch whether focus ever reaches it.',
            'Cliquez juste avant lui, puis appuyez sur Tab et observez si le focus arrive un jour sur lui.'
          ),
          t(
            'If it never takes focus, look for another element of the page, usable by keyboard and by mouse, that does the same action.',
            'S’il ne reçoit jamais le focus, cherchez un autre élément de la page, utilisable au clavier et à la souris, qui réalise la même action.'
          ),
          t(
            'If the element does nothing, test 7.3.1 does not apply to it: note that its widget role matches no action.',
            'Si l’élément ne fait rien, le test 7.3.1 ne s’applique pas à lui : notez que son rôle de widget ne correspond à aucune action.'
          )
        ],
        passWhen: t(
          `The widget takes keyboard focus and works by keyboard (Enter, or the arrow keys for a complex action), or ${OTHER_ELEMENT}.`,
          `Le widget reçoit le focus clavier et s’utilise au clavier (Entrée, ou touches de direction pour une action complexe), ou ${OTHER_ELEMENT}.`
        ),
        failWhen: t(
          `The widget can be neither reached nor used by keyboard, and ${NO_OTHER_ELEMENT}, which fails @TESTS@.`,
          `Le widget ne peut pas être atteint ni utilisé au clavier, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
        )
      },
      WIDGET_NOT_IN_TAB_ORDER: {
        steps: [
          t(
            'Find the widget the report names and note when it appears (for example when a menu or a dialog opens).',
            'Repérez le widget indiqué par le rapport et notez quand il apparaît (par exemple à l’ouverture d’un menu ou d’une boîte de dialogue).'
          ),
          t(
            'Use only the keyboard to open or reach that part of the page, and watch whether a script moves focus to the widget, or whether the arrow keys reach it.',
            'N’utilisez que le clavier pour ouvrir ou atteindre cette partie de la page, et observez si un script déplace le focus sur le widget, ou si les touches de direction l’atteignent.'
          ),
          t(
            'If focus never reaches it, look for another element of the page, usable by keyboard and by mouse, that does the same action.',
            'Si le focus ne l’atteint jamais, cherchez un autre élément de la page, utilisable au clavier et à la souris, qui réalise la même action.'
          )
        ],
        passWhen: t(
          `Focus is moved to the widget by a script or by the arrow keys when needed, and it then works by keyboard (Enter, or the arrow keys for a complex action), or ${OTHER_ELEMENT}.`,
          `Le focus est déplacé sur le widget par un script ou par les touches de direction quand c’est nécessaire, et il s’utilise alors au clavier (Entrée, ou touches de direction pour une action complexe), ou ${OTHER_ELEMENT}.`
        ),
        failWhen: t(
          `Neither Tab nor the arrow keys ever reach the widget, and ${NO_OTHER_ELEMENT}, which fails @TESTS@.`,
          `Ni Tab ni les touches de direction n’atteignent jamais le widget, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
        )
      }
    },
    'video-caption': {
      CAPTIONS_REVIEW: {
        steps: [
          t(
            'Play the video the report names and turn on its captions.',
            'Lancez la vidéo indiquée par le rapport et activez ses sous-titres.'
          ),
          t(
            'Watch it with the sound on and compare the captions with what is said and heard.',
            'Regardez-la avec le son et comparez les sous-titres avec ce qui est dit et entendu.'
          ),
          t(
            'Check that they give all the dialogue and the important sounds and stay in sync; it is recommended, though not required, that they say who is speaking.',
            'Vérifiez qu’ils reprennent tous les dialogues et les sons importants et qu’ils restent synchronisés ; il est recommandé, sans être exigé, qu’ils indiquent qui parle.'
          )
        ]
      },
      CAPTIONS_TRACK_NOT_DETECTED: {
        passWhen: t(
          'The video has no meaningful sound; synchronized captions (in this video or in a captioned version reached by an adjacent link or button) cover the dialogue and the sounds; or the video falls under a particular case of RGAA criterion 4.1 (decorative, itself an alternative to content of the page, CAPTCHA, test, exemptions tied to the publication date).',
          'La vidéo n’a pas de son porteur de sens ; des sous-titres synchronisés (dans cette vidéo ou dans une version sous-titrée accessible par un lien ou bouton adjacent) couvrent les dialogues et les sons ; ou la vidéo relève d’un cas particulier du critère RGAA 4.1 (décorative, elle-même alternative à un contenu de la page, CAPTCHA, test, exemptions liées à la date de publication).'
        )
      },
      SUBTITLES_TRACK_ONLY: {
        steps: [
          t(
            'Play the video the report names and turn on its translation subtitle track (subtitles).',
            'Lancez la vidéo indiquée par le rapport et activez sa piste de sous-titres de traduction (subtitles).'
          ),
          t(
            'Watch it with the sound on and compare the text with what is heard.',
            'Regardez-la avec le son et comparez le texte avec ce qui est entendu.'
          ),
          t(
            'Check that besides the dialogue, it gives the sounds that matter to follow the action; also look, just before or after the video, for a link or a button to a captioned version.',
            'Vérifiez qu’en plus des dialogues, elle restitue les sons importants pour comprendre l’action ; cherchez aussi, juste avant ou après la vidéo, un lien ou un bouton vers une version sous-titrée.'
          )
        ],
        passWhen: t(
          'The track gives the words and the important sounds (it works as synchronized captions, then, but test 4.3.2 asks for kind="captions"); or a captioned version is reached by an adjacent link or button; or the video has no audio that needs captions, or falls under the particular cases of RGAA criterion 4.1.',
          'La piste restitue les paroles et les sons importants (elle fonctionne donc comme des sous-titres synchronisés, mais le test 4.3.2 demande alors kind="captions") ; ou une version sous-titrée est accessible par un lien ou bouton adjacent ; ou la vidéo n’a pas d’audio qui nécessite des sous-titres, ou relève des cas particuliers du critère RGAA 4.1.'
        ),
        failWhen: t(
          'The track gives only the words, without the important sounds, and no captioned version is offered next to it, which fails RGAA test 4.3.1.',
          'La piste ne donne que les paroles, sans les sons importants, et aucune version sous-titrée n’est proposée à côté, ce qui ne respecte pas le test 4.3.1 du RGAA.'
        )
      }
    }
  };
}

module.exports = { overrides, LANGUAGES };
