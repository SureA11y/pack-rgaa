'use strict';

/**
 * Where core's French steps can't simply name RGAA's test instead of WCAG's:
 * what they say is WCAG's logic, not RGAA's (a level, a threshold, an
 * exception, what counts as passing). Each entry replaces the parts it gives
 * of core's entry for that rule and reason code; scripts/generate-review.js
 * fails if a code that counts toward a test is left with WCAG's terms.
 * @TESTS@ names the tests the code's findings bear on. A rule's '*' entry is a
 * function that edits each of its codes' { steps, passWhen, failWhen } once
 * the rest is applied.
 */

// Core's own French steps, for an entry that keeps some of them.
const core = require('@surea11y/core/procedures/fr');
const coreSteps = (prefix, code, count) =>
  Array.from({ length: count }, (_, i) => core[`${prefix}_review_${code}_step${i + 1}`]);

// The contexts RGAA's glossary « Contexte du lien » lists, and no other.
const CONTEXT =
  'la phrase, le paragraphe, l’élément de liste (ou l’élément de liste parent), le titre qui le précède, la cellule où il se trouve et les en-têtes de tableau associés à cette cellule';
// 6.1.1 to 6.1.4 are one test per kind of link, and a link is of one kind.
const LINK_TESTS =
  'ce qui ne respecte pas le test 6.1.1 du RGAA pour un lien texte, 6.1.2 pour un lien image, 6.1.3 pour un lien composite ou 6.1.4 pour un lien SVG';
// 6.1's particular case.
const AMBIGUOUS =
  'ou le lien est ambigu pour tout le monde (aucun lecteur ne peut savoir où il mène avant de l’activer) : le critère 6.1 du RGAA est alors non applicable';

const ALTERNATIVE =
  'un composant d’interface ou une alternative accessible donne accès aux mêmes fonctionnalités';
// 7.1.1's conditions 2 and 3.
const ALTERNATIVE_PRESENT =
  'un composant d’interface accessible ou une alternative accessible présent dans la page donne accès à la même fonctionnalité';
const NO_ALTERNATIVE =
  'aucun composant d’interface accessible ni aucune alternative accessible présent dans la page ne donne accès à la même fonctionnalité';

// 7.3.1's condition 2: another element, usable by keyboard and any pointing
// device, does the same.
const OTHER_ELEMENT =
  'un autre élément de la page, utilisable au clavier et à tout dispositif de pointage, réalise la même action';
const NO_OTHER_ELEMENT =
  'aucun autre élément de la page utilisable au clavier ne réalise la même action';
const otherElementStep = (what) =>
  `Si le clavier ne permet pas de le faire ici, vérifiez si un autre élément de la page, utilisable au clavier et à la souris, réalise la même action (un bouton, une option de menu). Cela ne compte que s’il fait tout ce que ${what}.`;

// 10.12.1: the test's spacing, set as a user would, and how to look.
const SPACING_APPLIED =
  'Appliquez l’espacement du texte du test 10.12.1 du RGAA (line-height 1.5, espacement après les paragraphes 2em, letter-spacing 0.12em, word-spacing 0.16em) au moyen d’une feuille de style utilisateur avec !important, qui l’emporte sur le !important de la page, même en ligne. Si vous utilisez un bookmarklet, ajoutez aussi ces valeurs avec !important dans le style de l’élément (element.style).';
const SPACING_LOOK =
  'Dans les navigateurs de l’environnement de test, aux largeurs de fenêtre où la page est consultée, vérifiez si le texte de l’élément est coupé, se chevauche ou est masqué.';

// 10.6.1: a link shown only by color, in each of its states.
const LINK_STATES =
  'Survolez le lien, atteignez-le avec Tab, activez-le et affichez-le comme visité : dans chaque état où sa couleur change, vérifiez un contraste d’au moins 3:1 avec le texte environnant, et vérifiez qu’au survol et au focus une marque non liée à la couleur apparaît.';
const LINK_PASS =
  'Le lien a une marque non liée à la couleur dans son état normal, comme un soulignement, du gras ou une bordure, donc le test 10.6.1 ne s’applique pas ; ou sa couleur contraste d’au moins 3:1 avec le texte environnant dans chacun de ses états colorés, et le survol comme le focus ajoutent une marque non liée à la couleur.';
const linkInText = (code, passWhen = LINK_PASS) => ({
  steps: [...coreSteps('linkInTextBlock', code, 3), LINK_STATES],
  passWhen
});

// 9.3: content the list holds but HTML does not allow there, asked about,
// and items outside their list, which fail.
const NESTING_STAYS =
  'Son placement reste une erreur d’imbrication au titre du test 8.2.1 du RGAA.';
const LIST_TESTS =
  'ce qui ne respecte pas le test 9.3.1 du RGAA pour une liste <ul> ou <menu>, ou le test 9.3.2 du RGAA pour une liste <ol>';
const DL_STRAY = (step1) => ({
  steps: [
    step1,
    'Regardez comment la page affiche le contenu signalé : comme un terme ou une définition de la liste, ou comme autre chose, par exemple un titre, un séparateur ou un conteneur.'
  ],
  passWhen: `Le contenu signalé n’est pas présenté comme un terme ou une définition de la liste : chaque terme présenté est un <dt> et chaque définition un <dd> du <dl>. ${NESTING_STAYS}`,
  failWhen:
    'La page présente un terme ou une définition qui n’est pas balisé avec <dt> ou <dd> dans le <dl>, ou une définition comme celle d’un terme qui n’est pas un <dt> du <dl>, ce qui ne respecte pas @TESTS@.'
});

// 8.6.1: a title lets a person find the page among the others.
const TITLE_FOUND =
  'et permet de retrouver la page dans l’historique de navigation ou la liste des onglets.';

const NAME_NEEDED = {
  passWhen: `L’élément a un nom explicite, ou ${ALTERNATIVE}.`,
  failWhen: `L’élément n’a pas de nom explicite et aucun composant ni alternative accessible ne donne accès aux mêmes fonctionnalités, ce qui ne respecte pas @TESTS@.`
};

// aria-role-name-present's findings count toward the test of their role
// (rule-map.js): grid and tree 7.1.1, radiogroup 11.6.1, meter and
// progressbar none.
const NAME_BY_ROLE = {
  passWhen: `Pour une grille ou une arborescence, l’élément a un nom explicite, ou ${ALTERNATIVE_PRESENT}. Pour un groupe de boutons radio (radiogroup), il a un aria-label ou un aria-labelledby, ou chaque bouton radio a un title, un aria-label, un aria-labelledby ou un aria-describedby qui indique à quel groupe il appartient.`,
  failWhen: `Pour une grille ou une arborescence : l’élément n’a pas de nom explicite et ${NO_ALTERNATIVE}, ce qui ne respecte pas le test 7.1.1 du RGAA. Pour un radiogroup : il n’a ni aria-label ni aria-labelledby, et ses boutons radio n’indiquent pas leur groupe, ce qui ne respecte pas le test 11.6.1 du RGAA. Un meter ou une barre de progression sans nom ne compte ici pour aucun test : son étiquette relève du test 11.1.1 du RGAA.`
};

// A menu item, a tab or a tree item with no name (7.1.1, which passes
// through another accessible component or an alternative).
function itemName(item, Item) {
  const step1 = (shown) =>
    `Repérez ${item} indiqué par le rapport et notez ${shown} affiché à l’écran.`;
  const step3 = 'Avec un lecteur d’écran, placez-vous sur l’élément et écoutez le nom annoncé.';
  const panel =
    'Ouvrez le panneau Accessibilité des outils de développement du navigateur et lisez le nom accessible de l’élément';
  const failure = `ce qui ne respecte pas @TESTS@.`;
  return {
    name_closedContent: {
      steps: [
        step1('le texte ou l’icône'),
        `${panel}, que le navigateur tire de son contenu, placé dans un shadow DOM fermé que l’analyse ne peut pas lire.`,
        step3
      ],
      passWhen: `L’arbre d’accessibilité montre un nom explicite pour ${item}, tiré de son contenu, et le lecteur d’écran l’annonce, ou ${ALTERNATIVE_PRESENT}.`,
      failWhen: `${Item} n’a pas de nom dans l’arbre d’accessibilité, car son contenu n’en donne aucun, et ${NO_ALTERNATIVE}, ${failure}`
    },
    name_contentTooDeep: {
      passWhen: `L’arbre d’accessibilité montre un nom explicite pour ${item}, tiré de son contenu imbriqué, et le lecteur d’écran l’annonce, ou ${ALTERNATIVE_PRESENT}.`,
      failWhen: `${Item} n’a pas de nom dans l’arbre d’accessibilité, car son contenu n’en donne aucun, et ${NO_ALTERNATIVE}, ${failure}`
    },
    name_internals: {
      passWhen: `L’arbre d’accessibilité montre un nom explicite pour ${item}, défini par ElementInternals ou autrement, et le lecteur d’écran l’annonce, ou ${ALTERNATIVE_PRESENT}.`,
      failWhen: `${Item} n’a pas de nom dans l’arbre d’accessibilité (le lecteur d’écran n’annonce que son rôle), et ${NO_ALTERNATIVE}, ${failure}`
    }
  };
}

// 7.5.1 to 7.5.3 are one test per kind of message. Their tests ask that the
// message use a role; core's findings ask whether it is announced at all.
const STATUS_NATURE =
  'Déterminez la nature du message : une réussite, un résultat ou un état ; une suggestion ou une erreur ; ou une progression.';
const STATUS_TESTS =
  'ce qui ne respecte pas le test 7.5.1 du RGAA s’il informe d’une réussite, d’un résultat ou d’un état, 7.5.2 s’il présente une suggestion ou une erreur, ou 7.5.3 s’il indique une progression (le module lit le rôle qu’exigent ces tests comme un rôle que les technologies d’assistance reçoivent, puisque le critère 7.5 du RGAA demande que les messages de statut soient correctement restitués)';

// A presentation effect of the mouse is no action to make keyboard-operable:
// the pack's reading of 7.3.1, which applies to every script event handler.
const PRESENTATION_ONLY =
  'la souris ne produit qu’un effet de présentation qui n’apporte ni information ni fonctionnalité (par exemple un surlignage au survol) : le module considère qu’il n’y a alors pas d’action à rendre accessible au clavier. Une information ou un menu affiché au survol n’est pas un effet de présentation';

const ERROR_FIRST =
  'Vérifiez si le champ est obligatoire (required, aria-required="true" ou indication visible) et si sa saisie requiert un type ou un format : le test 11.10.4 ne concerne que les champs obligatoires, le test 11.10.7 que les champs à type ou format obligatoire ; si aucun des deux ne s’applique, ces tests sont non applicables.';
const ERROR_IN_LABEL = {
  passWhen:
    'Le message d’erreur (et, pour un champ à type ou format obligatoire, l’indication du type ou du format attendu) est visible et se trouve dans la balise <label> du champ ou dans un passage de texte que lui associe aria-labelledby ou aria-describedby.',
  failWhen:
    'Aucun message d’erreur visible (pour un champ à type ou format obligatoire, aucune indication visible du type ou du format attendu) ne se trouve dans la balise <label> du champ ni dans un passage de texte associé par aria-labelledby ou aria-describedby (un message relié seulement par aria-errormessage, placé à côté sans liaison ou dans un récapitulatif ne compte pas), ce qui ne respecte pas le test 11.10.4 du RGAA pour un champ obligatoire, ou le test 11.10.7 du RGAA pour un champ à type ou format obligatoire.'
};

const NEARBY_TEXT =
  'Cherchez un attribut title sur le champ, ou un passage de texte accolé au champ, visible ou qui le devient à la prise de focus, qui dit quoi saisir.';
// Criterion 3.2: RGAA's sizes, its second condition (a mechanism) and its
// particular cases, and the one test the text's size and weight select.
const CONTRAST_COMPARE =
  'Comparez le ratio à 4,5:1, ou à 3:1 si le texte mesure au moins 24px, ou au moins 18,5px en gras (taille restituée).';
const CONTRAST_PASS =
  'ou un mécanisme de la page permet d’afficher le texte avec un rapport de contraste suffisant (vérifié par le test 3.2.5) ; ou le texte relève d’un cas particulier du critère RGAA 3.2 : logo ou nom de marque, texte purement décoratif, texte d’une image qui n’apporte aucune information essentielle, élément d’interface sur lequel aucune action n’est possible (un bouton disabled, par exemple).';
const CONTRAST_FAIL =
  'hors cas particuliers et sans mécanisme permettant d’afficher un contraste suffisant, ce qui ne respecte pas le test RGAA 3.2.1 (texte sans graisse de moins de 24px), 3.2.2 (texte en gras de moins de 18,5px), 3.2.3 (texte sans graisse de 24px ou plus) ou 3.2.4 (texte en gras de 18,5px ou plus), selon sa taille.';

function contrastInRgaaTerms({ steps, passWhen, failWhen }, code) {
  const out = {
    steps: steps.map((step) =>
      step
        .replace(
          'Comparez le ratio à 4,5:1 (3:1 pour le texte de grande taille).',
          CONTRAST_COMPARE
        )
        .replace(
          'Notez la taille et la graisse du texte pour savoir s’il compte comme texte de grande taille (au moins 24px, ou 18,5px en gras).',
          'Notez la taille restituée et la graisse du texte : elles disent lequel des tests 3.2.1 à 3.2.4 s’applique.'
        )
        .replace(
          'indiqué par le rapport (blockerValue : light ou dark)',
          'que nomme le rapport (clair ou sombre)'
        )
        .replace(
          'dans chaque navigateur pris en charge par la page',
          'dans chaque navigateur de l’environnement de test (base de référence)'
        )
    ),
    passWhen: `${passWhen
      .replace(', ou le texte atténué est un contrôle inactif (désactivé), qui est exempté', '')
      .replace(', ou il est purement décoratif', '')
      .replace(/\.$/, '')} ; ${CONTRAST_PASS}`,
    failWhen: failWhen.replace(
      /, ce qui ne respecte pas les tests 3\.2\.1, 3\.2\.2, 3\.2\.3, 3\.2\.4 du RGAA(?:, sauf si le texte fait partie d’un contrôle inactif)?\.$/,
      `, ${CONTRAST_FAIL}`
    )
  };
  // Core's wording changed: say so rather than keep WCAG's sizes.
  if (out.failWhen === failWhen || !out.steps.includes(CONTRAST_COMPARE)) {
    throw new Error(`contrast-computable ${code}: core's steps no longer match`);
  }
  return out;
}

// Criterion 1.3 asks whether a short alternative is relevant; a detailed
// description is criterion 1.6's.
const NO_DETAILED_DESCRIPTION = (what, test) =>
  `Pour un graphique ou un schéma, il suffit que l’alternative ${what} et dise ce qu’il apporte ; si elle ne fait que le nommer, l’absence de description détaillée relève du test ${test}, pas de celui-ci.`;

// 4.10.1 asks for a way to stop the sound or set its volume, nothing more
// (glossary « Contrôle (son déclenché automatiquement) »).
const SOUND_CONTROL_TRY =
  'Activez ce dispositif et vérifiez que le son s’arrête ou que son volume change.';

module.exports = {
  'aria-expanded-state-mismatch': {
    EXPANDED_FALSE_CONTROLLED_SHOWN: {
      passWhen: `Le contenu est réduit ou seulement en aperçu tant que le bouton indique « réduit », et l’état change quand le contenu s’ouvre, ou ${ALTERNATIVE_PRESENT}.`,
      failWhen: `Le contenu est entièrement affiché alors que le bouton de bascule indique aux utilisateurs de lecteur d’écran qu’il est réduit, et ${NO_ALTERNATIVE}, ce qui ne respecte pas @TESTS@.`
    },
    EXPANDED_TRUE_CONTROLLED_HIDDEN: {
      passWhen: `Le contenu est affiché tant que le bouton indique « développé », une fois toute transition terminée, ou ${ALTERNATIVE_PRESENT}.`,
      failWhen: `Le contenu reste masqué alors que le bouton de bascule indique aux utilisateurs de lecteur d’écran qu’il est développé, et ${NO_ALTERNATIVE}, ce qui ne respecte pas @TESTS@.`
    }
  },
  'aria-role-name-present': { name_internals: NAME_BY_ROLE, name_missing: NAME_BY_ROLE },
  // 7.3.1 asks for the Enter key (methodology step 2, glossary « Accessible
  // et activable par le clavier »), not the Space key.
  'click-handler-keyboard-operable': {
    CLICK_HANDLER_FOCUS_LISTENER: {
      steps: [
        'Cliquez sur l’élément indiqué par le rapport et notez ce qui se passe.',
        'Rechargez la page, puis appuyez sur Tab jusqu’à ce que l’élément ait le focus.',
        'Appuyez sur Entrée (et, s’il fait partie d’un groupe, sur les touches de direction), et comparez avec ce qu’a fait le clic.',
        otherElementStep('fait le clic')
      ],
      passWhen: `Entrée fait ce que fait un clic, ou, pour un onglet, y déplacer le focus avec les touches de direction affiche déjà son panneau, ou ${OTHER_ELEMENT}.`,
      failWhen: `Entrée ne fait rien, ou moins qu’un clic, même une fois le focus arrivé, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
    },
    CLICK_HANDLER_KEY_LISTENER_ABOVE: {
      steps: [
        'Cliquez sur l’élément indiqué par le rapport et notez ce qui se passe.',
        'Appuyez sur Tab jusqu’à ce que l’élément ait le focus.',
        'Appuyez sur Entrée (et, s’il fait partie d’un groupe, sur les touches de direction), et comparez avec le clic.',
        otherElementStep('fait le clic')
      ],
      passWhen: `Entrée fait ce que fait un clic (ou, pour une action complexe, les touches de direction permettent de la réaliser), ou ${OTHER_ELEMENT}.`,
      failWhen: `Entrée ne fait rien sur l’élément (l’écouteur placé sur un ancêtre ne le gère pas), et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
    },
    CLICK_HANDLER_NOT_FOCUSABLE: {
      steps: [
        'Cliquez sur l’élément indiqué par le rapport et notez ce que fait son clic.',
        'Parcourez la page avec Tab et vérifiez que l’élément ne reçoit jamais le focus.',
        'S’il s’agit d’un élément d’une liste, d’une grille ou d’une combobox, donnez le focus à ce widget et utilisez les touches de direction pour voir si l’élément devient actif et si Entrée exécute l’action.',
        'Sinon, cherchez sur la page un autre élément, utilisable au clavier et à la souris, qui réalise la même action.'
      ],
      passWhen:
        'La même action peut être effectuée au clavier, par le widget qui gère l’élément ou par un autre élément de la page utilisable au clavier et à tout dispositif de pointage.',
      failWhen: `L’action ne peut être effectuée qu’à la souris, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
    },
    CLICK_HANDLER_NOT_IN_TAB_ORDER: {
      steps: [
        'Cliquez sur l’élément indiqué par le rapport et notez ce qui se passe.',
        'Parcourez la page avec Tab et vérifiez si le focus arrive un jour sur l’élément.',
        'S’il fait partie d’un groupe (onglets, menu, barre d’outils, liste), entrez dans le groupe avec Tab et utilisez les touches de direction pour voir si elles y déplacent le focus.',
        'Une fois qu’il a le focus, appuyez sur Entrée et comparez avec le clic.',
        otherElementStep('fait le clic')
      ],
      passWhen: `L’élément peut être atteint au clavier (Tab, ou touches de direction dans son groupe) et Entrée fait ce que fait un clic, ou ${OTHER_ELEMENT}.`,
      failWhen: `Aucune touche n’amène le focus sur l’élément et ${NO_OTHER_ELEMENT} : son action ne fonctionne qu’à la souris, ce qui ne respecte pas @TESTS@.`
    },
    CLICK_HANDLER_NO_KEY_HANDLER: {
      steps: [
        'Cliquez sur l’élément indiqué par le rapport et notez ce qui se passe.',
        'Rechargez la page, puis appuyez sur Tab jusqu’à ce que l’élément ait le focus.',
        'Appuyez sur Entrée (et, s’il fait partie d’un groupe, sur les touches de direction), et comparez avec ce qu’a fait le clic.',
        otherElementStep('fait le clic')
      ],
      passWhen: `Entrée fait ce que fait un clic (ou, pour une action complexe, les touches de direction permettent de la réaliser), ou ${OTHER_ELEMENT}.`,
      failWhen: `Entrée ne fait rien, ou moins qu’un clic, même une fois le focus arrivé, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
    }
  },
  'dialog-name-present': { name_internals: NAME_NEEDED, name_missing: NAME_NEEDED },
  // 7.3.2 asks only that focus stay where it is received; whether it shows is
  // 10.7's.
  'focus-not-removed-by-script': {
    FOCUS_HANDLER_BLURS_SELF: {
      passWhen:
        'Le focus reste sur l’élément (document.activeElement), et la touche Tab suivante passe au contrôle suivant.'
    },
    FOCUS_HANDLER_CALLS_BLUR: {
      passWhen:
        'Dans chaque état, le focus reste sur l’élément (document.activeElement) et il peut être actionné au clavier.'
    },
    FOCUS_HANDLER_MOVES_FOCUS: {
      passWhen:
        'Le focus reste sur l’élément, ou l’élément n’est qu’une sentinelle invisible et sans nom qui renvoie le focus à l’intérieur d’une boîte de dialogue modale (le module ne la compte pas comme un élément qui reçoit le focus), et chaque contrôle peut toujours être atteint et actionné au clavier.',
      failWhen:
        'Un élément qui n’est pas une telle sentinelle envoie le focus ailleurs dès qu’il le reçoit, ce qui ne respecte pas @TESTS@.'
    }
  },
  'canvas-text-alternative-quality': {
    TEXT_ALTERNATIVE_REVIEW: {
      steps: [
        'Regardez ce que le canevas indiqué par le rapport affiche à l’écran, y compris ses changements quand vous l’utilisez.',
        'Lisez son alternative (la valeur donnée par le rapport, ou son contenu entre <canvas> et </canvas> et son nom dans le panneau Accessibilité).',
        NO_DETAILED_DESCRIPTION('identifie le canevas', '1.6.7'),
        'Vérifiez que cette alternative dit ce que le canevas apporte au contenu, et suit ses changements.',
        'Si le canevas a un contenu entre <canvas> et </canvas>, écoutez-le avec un lecteur d’écran et vérifiez que ce contenu est restitué.'
      ],
      passWhen:
        'L’alternative identifie le canevas et transmet l’information ou la fonction qu’il apporte, et le contenu placé entre ses balises, s’il y en a un, est restitué par le lecteur d’écran.',
      failWhen:
        'L’alternative est fausse, vague ou ne correspond pas à l’information du canevas, ce qui ne respecte pas le test 1.3.7 du RGAA ; ou le contenu placé entre <canvas> et </canvas> n’est pas restitué par le lecteur d’écran, ce qui ne respecte pas le test 1.3.8 du RGAA.'
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
      passWhen:
        'La valeur imposée atteint déjà celle du test, ou, l’espacement du test appliqué, le texte de l’élément reste lisible.',
      failWhen:
        'L’espacement du test appliqué, du texte de l’élément est coupé, se chevauche ou est masqué, ce qui ne respecte pas @TESTS@.'
    },
    INLINE_SPACING_NO_SOFT_WRAP: {
      steps: [
        ...coreSteps('avoidInlineSpacing', 'INLINE_SPACING_NO_SOFT_WRAP', 1),
        'Vérifiez si le texte peut passer sur une deuxième ligne (retour à la ligne interdit, mot unique, zone qui défile).',
        SPACING_APPLIED,
        SPACING_LOOK
      ],
      passWhen:
        'L’espacement du test appliqué, le texte reste lisible : rien n’est coupé, masqué ni ne se chevauche, qu’il passe ou non à la ligne.',
      failWhen:
        'L’espacement du test appliqué, du texte est coupé, masqué ou se chevauche, ce qui ne respecte pas @TESTS@.'
    },
    INLINE_SPACING_SHORT_TEXT: {
      steps: [
        ...coreSteps('avoidInlineSpacing', 'INLINE_SPACING_SHORT_TEXT', 1),
        'Vérifiez si le texte court passe sur deux lignes aux largeurs de fenêtre où la page est consultée.',
        SPACING_APPLIED,
        SPACING_LOOK
      ]
    }
  },
  'css-focus-indicator-suppressed': {
    FOCUS_INDICATOR_SUPPRESSED: {
      steps: [
        'Cliquez juste avant l’élément indiqué par le rapport, puis appuyez sur Tab jusqu’à ce qu’il ait le focus.',
        'Cherchez sur l’élément, et autour de lui, tout changement visible lorsqu’il reçoit le focus.',
        'Appuyez sur Tab et Maj+Tab pour retirer puis remettre le focus, en comparant les deux états.',
        'Mesurez le rapport de contraste de cette indication : il doit être d’au moins 3:1.'
      ],
      passWhen:
        'Une indication visible agit sur le contour ou le fond de l’élément quand il a le focus, avec un rapport de contraste d’au moins 3:1.',
      failWhen:
        'Rien de visible ne change à la prise de focus, ou l’indication a un rapport de contraste inférieur à 3:1, ce qui ne respecte pas @TESTS@.'
    }
  },
  'css-orientation-lock': {
    ORIENTATION_MEDIA_ROTATES_ELEMENT: {
      passWhen:
        'La rotation de l’élément n’empêche pas de consulter le contenu (l’élément est décoratif, ou reste lisible et utilisable), et tout le contenu peut être lu et utilisé dans les deux orientations ; ou une orientation est essentielle au contenu, ce que le RGAA rend non applicable.',
      failWhen:
        'Le contenu pivote sur le côté dans une orientation et ne peut pas y être lu ou utilisé normalement, ce qui ne respecte pas @TESTS@.'
    }
  },
  'css-hidden-focus': {
    cssHiddenTabbable_needsFocusStateVerification: {
      failWhen:
        'Le focus arrive sur l’élément alors qu’il reste masqué : aucune indication visuelle ne montre la prise de focus, ce qui ne respecte pas @TESTS@.'
    },
    cssHiddenTabbable_runtimeRedirect_needsReview: {
      failWhen:
        'Le focus peut rester sur l’élément masqué : aucune indication visuelle ne montre la prise de focus, ce qui ne respecte pas @TESTS@.'
    }
  },
  'definition-list-children-valid': {
    DL_DT_DD_ORDER: DL_STRAY(
      'Inspectez la liste de description indiquée par le rapport et notez la définition qui précède le premier terme, ou le dernier terme sans définition après lui.'
    ),
    DL_INVALID_CHILD: DL_STRAY(
      'Inspectez la liste de description indiquée par le rapport et notez l’enfant qui n’est ni un groupe <dt>/<dd>, ni un unique <div> englobant, ni un script, un template ou un style, ou le texte placé directement dedans.'
    ),
    DL_NO_DT_DD: DL_STRAY(
      'Inspectez la liste de description indiquée par le rapport et notez les termes sans définition ou les définitions sans terme.'
    )
  },
  'dlitem-parent-valid': {
    DLITEM_INVALID_PARENT: {
      steps: [
        'Inspectez le <dt> ou le <dd> indiqué par le rapport et constatez qu’aucun <dl> ne le contient.',
        'Regardez si la page présente ces termes et définitions comme une liste de description.'
      ],
      passWhen: `Le contenu n’est pas présenté comme une liste de description, donc le test 9.3.3 ne s’y applique pas ; un <dt> ou un <dd> hors d’un <dl> reste une erreur d’imbrication au titre du test 8.2.1 du RGAA.`,
      failWhen:
        'Le <dt> ou le <dd> est balisé comme élément d’une liste de description, mais aucun <dl> ne le contient : la liste n’est pas structurée au moyen des balises <dl>, <dt> et <dd>, ce qui ne respecte pas @TESTS@.'
    }
  },
  'duplicate-id': {
    DUPLICATE_ID: {
      steps: [
        'Inspectez les éléments indiqués par le rapport et notez l’id qu’ils partagent.',
        'Vérifiez dans le code source généré que cet id y figure plusieurs fois.'
      ],
      passWhen: 'Chaque valeur d’attribut id est unique dans la page.',
      failWhen:
        'Les valeurs d’attribut id ne sont pas uniques dans la page, ce qui ne respecte pas @TESTS@.'
    },
    DUPLICATE_ID_IN_SHADOW_TREE: {
      steps: [
        'Inspectez les éléments indiqués par le rapport, dans la même racine fantôme (shadow root), et notez l’id qu’ils partagent.',
        'Vérifiez dans l’inspecteur que cet id figure plusieurs fois dans cette racine, qui fait partie du code source généré de la page.'
      ],
      passWhen: 'Chaque valeur d’attribut id est unique dans la racine fantôme.',
      failWhen:
        'Plusieurs éléments de la racine fantôme portent le même id : les valeurs d’attribut id ne sont pas uniques, ce qui ne respecte pas @TESTS@, une racine fantôme faisant partie du code source généré de la page.'
    }
  },
  'form-control-label-quality': {
    DUPLICATE_LABEL_TEXT: {
      failWhen:
        'Des champs différents partagent une étiquette et rien de visible ne les distingue : l’étiquette ne permet pas de connaître la fonction exacte de chaque champ, ce qui ne respecte pas le test 11.2.1 du RGAA (étiquette fournie par une balise <label>) ou le test 11.2.4 du RGAA (étiquette fournie par aria-labelledby).'
    },
    PARTIALLY_HIDDEN_LABEL: {
      steps: [
        'Repérez le champ indiqué par le rapport et lisez la partie visible de son étiquette à l’écran.',
        'Inspectez le champ dans le panneau Accessibilité et lisez son nom calculé complet, parties masquées comprises.',
        NEARBY_TEXT,
        'Déterminez si la partie visible de l’étiquette, ce title ou ce passage de texte permet de comprendre la nature de la saisie attendue.'
      ],
      passWhen:
        'La partie visible de l’étiquette, ou un attribut title, ou un passage de texte accolé au champ, visible ou qui le devient à la prise de focus, permet de comprendre la nature de la saisie attendue.',
      failWhen:
        'Ni la partie visible de l’étiquette, ni un title, ni un passage de texte accolé au champ ne permet de comprendre la nature de la saisie attendue (par exemple, seul « OK » est affiché), ce qui ne respecte pas @TESTS@.'
    },
    PLACEHOLDER_LABEL_TEXT: {
      failWhen:
        'L’étiquette est un texte de remplacement qui ne dit pas à quoi sert le champ, ce qui ne respecte pas le test 11.2.1 du RGAA (étiquette fournie par une balise <label>) ou le test 11.2.4 du RGAA (étiquette fournie par aria-labelledby).'
    }
  },
  'form-control-programmatic-label-quality': {
    label_from_aria_label_only: {
      steps: [
        'Repérez à l’écran le champ indiqué par le rapport et lisez son aria-label, que le rapport donne.',
        NEARBY_TEXT,
        'Déterminez si le contenu de l’aria-label permet de connaître la fonction exacte du champ.'
      ],
      passWhen:
        'Un attribut title, ou un passage de texte accolé au champ, visible ou qui le devient à la prise de focus, permet de comprendre la nature de la saisie attendue, et l’aria-label permet de connaître la fonction exacte du champ.',
      failWhen:
        'Aucun title ni aucun passage de texte accolé au champ ne permet de comprendre la nature de la saisie attendue, ce qui ne respecte pas le test 11.1.3 du RGAA ; si c’est l’aria-label qui ne permet pas de connaître la fonction exacte du champ, c’est le test 11.2.3 du RGAA qui n’est pas respecté.'
    },
    label_from_hidden_labelledby: {
      steps: [
        'Repérez le champ indiqué par le rapport et, dans les outils de développement, suivez ses id aria-labelledby jusqu’aux éléments qu’ils désignent.',
        'Vérifiez si ces éléments sont affichés à l’écran quand le champ l’est.',
        'Déterminez si ce passage de texte permet de connaître la fonction exacte du champ, et cherchez un title ou un texte accolé au champ qui dit quoi saisir.'
      ],
      passWhen:
        'Un attribut title, ou un passage de texte accolé au champ, visible ou qui le devient à la prise de focus, permet de comprendre la nature de la saisie attendue, et le passage référencé par aria-labelledby permet de connaître la fonction exacte du champ.',
      failWhen:
        'Aucun title ni aucun passage de texte accolé au champ ne permet de comprendre la nature de la saisie attendue, ce qui ne respecte pas le test 11.1.3 du RGAA ; si c’est le passage référencé par aria-labelledby qui ne permet pas de connaître la fonction exacte du champ, c’est le test 11.2.4 du RGAA qui n’est pas respecté.'
    },
    label_from_title_primary: {
      steps: [
        'Repérez le champ indiqué par le rapport et lisez son attribut title.',
        'Déterminez si ce title permet de connaître la fonction exacte du champ et le type de données attendu.'
      ],
      passWhen:
        'Le title permet de connaître la fonction exacte du champ : RGAA accepte cette étiquette.',
      failWhen:
        'Le title ne permet pas de connaître la fonction exacte du champ, ce qui ne respecte pas @TESTS@.'
    }
  },
  'invalid-field-error-message': {
    ERROR_MESSAGE_ARIA_HIDDEN: {
      steps: [
        ERROR_FIRST,
        'Repérez le champ indiqué par le rapport et confirmez que son message d’erreur est visible à l’écran.',
        'Inspectez l’élément de message vers lequel pointe aria-errormessage et notez lesquels de ses enfants portent aria-hidden="true".',
        'Vérifiez si le texte d’erreur visible se trouve dans la balise <label> du champ ou dans un passage de texte associé par aria-labelledby ou aria-describedby.'
      ],
      ...ERROR_IN_LABEL
    },
    ERROR_MESSAGE_EMPTY: {
      steps: [
        ERROR_FIRST,
        'Repérez le champ indiqué par le rapport et déclenchez son état d’erreur (soumettez le formulaire ou saisissez une valeur non valide) s’il n’est pas déjà affiché.',
        'Inspectez le champ et trouvez l’élément vers lequel pointe son attribut aria-errormessage ; confirmez qu’il est vide.',
        'Cherchez dans la balise <label> du champ et dans un passage de texte associé par aria-labelledby ou aria-describedby des mots visibles qui disent ce qui ne va pas.'
      ],
      ...ERROR_IN_LABEL
    },
    ERROR_MESSAGE_HIDDEN: {
      steps: [
        ERROR_FIRST,
        'Rendez le champ non valide comme le ferait un utilisateur (soumettez le formulaire vide, ou saisissez une valeur erronée).',
        'Cherchez le message d’erreur vers lequel pointe le champ (son aria-errormessage), et vérifiez s’il apparaît à l’écran.',
        'Sinon, cherchez le message dans la balise <label> du champ ou dans un passage de texte associé par aria-labelledby ou aria-describedby, et vérifiez qu’il est visible.'
      ],
      ...ERROR_IN_LABEL
    },
    ERROR_MESSAGE_NOT_SHOWN_DESCRIBED: {
      steps: [
        ERROR_FIRST,
        'Repérez le champ indiqué par le rapport et déclenchez son état d’erreur s’il n’est pas déjà affiché.',
        'Ouvrez le panneau Accessibilité pour le champ et lisez sa description (issue de aria-describedby).',
        'Comparez cette description avec l’erreur : déterminez si elle dit ce qui ne va pas, ou si ce n’est qu’un texte d’aide comme un format de saisie.',
        'Vérifiez que ce passage associé par aria-describedby, s’il énonce l’erreur, est lui-même visible à l’écran.'
      ],
      ...ERROR_IN_LABEL
    },
    ERROR_MESSAGE_TARGET_MISSING: {
      steps: [
        ERROR_FIRST,
        'Repérez le champ indiqué par le rapport et notez l’id présent dans son attribut aria-errormessage.',
        'Déclenchez l’erreur (soumettez le formulaire ou saisissez une valeur non valide) et cherchez dans le panneau Éléments un élément portant cet id.',
        'Si l’élément apparaît, vérifiez qu’il est affiché et qu’il contient un texte décrivant l’erreur.',
        'Cherchez le message dans la balise <label> du champ ou dans un passage de texte associé par aria-labelledby ou aria-describedby : un élément relié seulement par aria-errormessage ne suffit pas.'
      ],
      ...ERROR_IN_LABEL
    },
    NO_ERROR_MESSAGE: {
      steps: [
        ERROR_FIRST,
        'Repérez le champ indiqué par le rapport ; il est marqué aria-invalid.',
        'Vérifiez si le champ est réellement en erreur à ce moment ; s’il est marqué non valide avant que l’utilisateur ait saisi quoi que ce soit, saisissez une valeur valide et voyez si la marque disparaît.',
        'Cherchez dans la balise <label> du champ et dans les passages de texte associés par aria-labelledby ou aria-describedby un message visible qui dit ce qui ne va pas.'
      ],
      passWhen:
        'Le champ n’est pas réellement en erreur (aria-invalid disparaît avec une saisie valide), ou le message d’erreur est visible et se trouve dans la balise <label> du champ ou dans un passage de texte associé par aria-labelledby ou aria-describedby.',
      failWhen: ERROR_IN_LABEL.failWhen
    }
  },
  'heading-order': {
    HEADING_ORDER_SKIPPED_LEVEL: {
      steps: [
        'Repérez le titre indiqué par le rapport et notez son niveau ainsi que celui du titre précédent (d’après le rapport ou le panneau Accessibilité).',
        'Listez les titres de la page dans l’ordre, avec la liste des titres d’un lecteur d’écran ou en les inspectant, et regardez la section autour du saut.',
        'Déterminez si la hiérarchie des titres reste pertinente et cohérente à cet endroit.'
      ],
      passWhen:
        'La hiérarchie reste pertinente et cohérente : un saut de niveau seul n’invalide pas le critère.',
      failWhen:
        'Le saut de niveau rend la hiérarchie incohérente ou trompeuse, ce qui ne respecte pas @TESTS@.'
    }
  },
  'embed-text-alternative-quality': {
    TEXT_ALTERNATIVE_REVIEW: {
      steps: [
        'Regardez ce que montre le contenu intégré indiqué par le rapport, et vérifiez qu’il s’agit d’une image (type="image/…") ; sinon, le test 1.3.5 ne s’applique pas.',
        'Lisez son alternative (aria-label, texte de aria-labelledby ou title, tel que le donne le rapport).',
        'Vérifiez que cette alternative dit ce que l’image apporte au contenu.'
      ],
      passWhen:
        'Le contenu intégré n’est pas une image, ou l’alternative dit avec exactitude ce que l’image apporte.',
      failWhen:
        'L’image embarquée a une alternative générique, fausse, ou qui ne correspond pas à son information, ce qui ne respecte pas le test 1.3.5 du RGAA.'
    }
  },
  'identical-links-same-purpose': {
    SAME_NAME_DIFFERENT_DESTINATION: {
      steps: [
        'Repérez tous les liens portant le nom indiqué par le rapport et notez où chacun mène.',
        `Lisez le contexte de chaque lien : ${CONTEXT}.`,
        'Ouvrez chaque lien et comparez les pages atteintes.',
        'Déterminez si le contexte de chaque lien permet d’en comprendre la fonction et la destination.'
      ],
      passWhen: `Les liens mènent à la même destination, ou le contexte de chaque lien permet de les différencier et d’en comprendre la fonction et la destination, ${AMBIGUOUS}.`,
      failWhen: `Des liens de même nom mènent à des destinations différentes et leur contexte ne permet pas de les différencier, ${LINK_TESTS}.`
    }
  },
  'image-of-text': {
    IMAGE_BUTTON_TEXT_REVIEW: {
      steps: [
        'Repérez le bouton image indiqué par le rapport et regardez l’image.',
        'Vérifiez si l’image contient des mots ou des lettres, et pas seulement une icône.',
        'Si c’est le cas, déterminez si ce texte pourrait être du texte stylé en CSS, ou s’il fait appel à un effet graphique que CSS ne peut pas reproduire.',
        'Cherchez sur la page un mécanisme de remplacement qui permet de remplacer les images texte par du texte stylé.'
      ],
      passWhen:
        'L’image ne contient pas de texte ; ou son texte fait partie d’un logo, d’une dénomination commerciale, d’un CAPTCHA ou d’une image-test, ou l’exactitude graphique de l’image est essentielle à l’information (cas particuliers du critère RGAA 1.8) ; ou un mécanisme de remplacement existe ; ou le texte fait appel à un effet graphique qui ne peut pas être reproduit en CSS.',
      failWhen:
        'Le bouton affiche un texte en image qui pourrait être du texte stylé, hors cas particuliers et sans mécanisme de remplacement, ce qui ne respecte pas le test 1.8.2 du RGAA.'
    },
    SVG_IMAGE_TEXT_REVIEW: {
      steps: [
        'Repérez l’image indiquée par le rapport et regardez le texte qui y est dessiné.',
        'Déterminez s’il fait partie d’un logo ou d’une dénomination commerciale, ou s’il s’agit d’un texte comme un titre, une phrase ou un libellé.',
        'Sinon, déterminez si le texte pourrait être du texte stylé en CSS, ou s’il fait appel à un effet graphique que CSS ne peut pas reproduire.',
        'Cherchez sur la page un mécanisme de remplacement qui permet de remplacer les images texte par du texte stylé.'
      ],
      passWhen:
        'L’image ne contient pas de texte ; ou son texte fait partie d’un logo, d’une dénomination commerciale, d’un CAPTCHA ou d’une image-test, ou l’exactitude graphique de l’image est essentielle à l’information (cas particuliers du critère RGAA 1.8) ; ou un mécanisme de remplacement existe ; ou le texte fait appel à un effet graphique qui ne peut pas être reproduit en CSS.',
      failWhen:
        'L’image dessine un texte qui pourrait être du texte stylé, hors cas particuliers et sans mécanisme de remplacement, ce qui ne respecte pas le test 1.8.1 du RGAA.'
    }
  },
  'image-redundant-alt': {
    IMAGE_ALT_REDUNDANT: {
      steps: [
        'Repérez l’image indiquée par le rapport et le texte situé à côté dans le même lien, le même bouton ou le même parent.',
        'Regardez l’image et décidez si elle apporte une information propre, ou si le texte voisin donne déjà toute son information.',
        'Si elle apporte une information propre, lisez son alt et vérifiez qu’il dit cette information.'
      ],
      passWhen:
        'L’image apporte une information propre et son alt la dit, même s’il reprend des mots du texte voisin.',
      failWhen:
        'L’image n’apporte rien que le texte voisin ne donne déjà : c’est une image de décoration, et son alt non vide ne respecte pas le test 1.2.1 du RGAA ; ou elle apporte une information propre que son alt ne dit pas, ce qui ne respecte pas le test 1.3.1 du RGAA.'
    }
  },
  'img-alt-decorative': {
    EXCLUDED_ELEMENT_REVIEW: {
      failWhen:
        'L’image transmet une information que le contenu auquel elle est associée ne donne pas, et pourtant elle est masquée aux technologies d’assistance, ce qui ne respecte pas le test 1.1.1 du RGAA (1.1.5 pour une balise <svg>, 1.1.8 pour une balise <canvas>).'
    }
  },
  'img-alt-quality': {
    TEXT_ALTERNATIVE_REVIEW: {
      steps: [
        'Repérez l’image indiquée par le rapport et lisez son texte alt (le rapport donne la raison pour laquelle il semblait suspect, le cas échéant).',
        'Regardez l’image et son contexte, et demandez-vous ce qu’elle apporte au contenu.',
        NO_DETAILED_DESCRIPTION('identifie l’image', '1.6.1'),
        'Décidez si l’alt dit ce que l’image apporte au contenu ; un nom de fichier, une adresse web ou un mot générique comme « image » ne le dit pas.'
      ],
      passWhen:
        'Le texte alt identifie l’image et transmet l’information dont l’utilisateur a besoin, ou, pour une image complexe, l’identifie avec exactitude.',
      failWhen:
        'Le texte alt est faux, vague ou générique (un nom de fichier, une adresse, « image ») ou ne correspond pas à l’information de l’image, ce qui ne respecte pas le test 1.3.1 du RGAA.'
    }
  },
  'no-autoplay-audio': {
    AUTOPLAY_CONTROLS_HIDDEN: {
      steps: [
        'Chargez la page avec le son activé et écoutez si l’audio ou la vidéo masqué indiqué par le rapport démarre de lui-même.',
        'S’il émet du son pendant plus de 3 secondes, cherchez sur la page un dispositif (un bouton, par exemple) qui l’arrête ou en règle le volume indépendamment du volume du système.',
        SOUND_CONTROL_TRY
      ],
      passWhen:
        'Aucun son ne dure plus de 3 secondes, ou un dispositif de la page permet de l’arrêter ou d’en régler le volume indépendamment du volume du système.',
      failWhen:
        'Un son se lance tout seul pendant plus de 3 secondes et rien sur la page ne permet de l’arrêter ni d’en régler le volume indépendamment du volume du système, ce qui ne respecte pas le test 4.10.1 du RGAA.'
    },
    AUTOPLAY_NO_CONTROLS_MECHANISM: {
      steps: [
        'Chargez la page avec le son activé et écoutez si l’audio ou la vidéo indiqué par le rapport démarre de lui-même.',
        'S’il joue du son pendant plus de 3 secondes, cherchez un dispositif qui permet de le mettre en pause, de l’arrêter, de le couper ou d’en régler le volume, sur l’élément qui le déclenche ou ailleurs dans la page.',
        SOUND_CONTROL_TRY
      ],
      passWhen:
        'Aucun son ne joue plus de 3 secondes, ou un dispositif de la page permet de le mettre en pause, de l’arrêter, de le couper ou d’en régler le volume.',
      failWhen:
        'Un son se lance tout seul pendant plus de 3 secondes sans moyen de le mettre en pause, de l’arrêter ou d’en régler le volume indépendamment du volume du système, ce qui ne respecte pas le test 4.10.1 du RGAA.'
    },
    EMBEDDED_SOUND_SOURCE: {
      steps: [
        'Chargez la page avec le son activé et écoutez si l’embed, l’object ou le bgsound indiqué par le rapport émet du son de lui-même.',
        'S’il joue pendant plus de 3 secondes, cherchez un dispositif qui l’arrête ou en règle le volume, dans le lecteur intégré ou ailleurs dans la page.',
        SOUND_CONTROL_TRY
      ],
      passWhen:
        'Rien ne se lance automatiquement pendant plus de 3 secondes, ou un dispositif permet de l’arrêter ou d’en régler le volume.',
      failWhen:
        'Un son se lance tout seul pendant plus de 3 secondes et rien ne permet de l’arrêter ni d’en régler le volume indépendamment du volume du système, ce qui ne respecte pas le test 4.10.1 du RGAA.'
    }
  },
  'object-text-alternative-quality': {
    TEXT_ALTERNATIVE_REVIEW: {
      steps: [
        'Regardez l’objet indiqué par le rapport et vérifiez qu’il affiche une image (type="image/…") ; sinon, le test 1.3.4 ne s’applique pas.',
        'Lisez son alternative dans le rapport (contenu placé entre <object> et </object>, aria-label, texte de aria-labelledby ou title), ou dans le panneau Accessibilité des outils de développement.',
        NO_DETAILED_DESCRIPTION('identifie l’image', '1.6.2'),
        'Décidez si cette alternative dit ce que l’image apporte au contenu.'
      ],
      passWhen:
        'L’objet n’est pas une image, ou son alternative identifie l’image et transmet l’information qu’elle apporte.',
      failWhen:
        'L’alternative de l’image objet est fausse, vague (comme « objet » ou un nom de fichier) ou ne correspond pas à son information, ce qui ne respecte pas le test 1.3.4 du RGAA.'
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
      passWhen:
        'Dans tous les contextes où la page s’affiche, l’arrière-plan propre du lien se distingue nettement de celui qui l’entoure (le pack compte ce fond comme une marque visuelle du lien), ou une autre marque non liée à la couleur distingue le lien.'
    },
    LINK_COLOR_CONTRAST_ONLY: {
      steps: [
        ...coreSteps('linkInTextBlock', 'LINK_COLOR_CONTRAST_ONLY', 3),
        'Si la couleur du lien change une fois visité, à l’activation, au survol ou au focus, vérifiez dans chacun de ces états un contraste d’au moins 3:1 avec le texte environnant.'
      ],
      passWhen:
        'Le survol comme la prise de focus ajoutent au lien une indication visuelle autre qu’un changement de couleur, comme un soulignement, et dans chaque état où sa couleur change, le lien garde un contraste d’au moins 3:1 avec le texte environnant.',
      failWhen:
        'Le survol ou la prise de focus ne change que la couleur du lien, ou un de ses états colorés contraste à moins de 3:1 avec le texte environnant, ce qui ne respecte pas @TESTS@.'
    }
  },
  'list-children-valid': {
    LIST_INVALID_CHILD: {
      steps: coreSteps('listChildrenValid', 'LIST_INVALID_CHILD', 2),
      passWhen: `Le contenu qui n’est pas un <li> n’est pas présenté comme l’un des éléments de la liste (un titre, un séparateur, un conteneur, du texte isolé) : chaque élément présenté dans la liste est un <li>. ${NESTING_STAYS}`,
      failWhen: `La page présente ce contenu comme l’un des éléments de la liste, mais il n’est pas balisé avec <li> : la liste n’est pas structurée au moyen des éléments <ul> (ou <ol>) et <li>, ${LIST_TESTS}.`
    },
    LIST_ITEM_ROLE_OVERRIDDEN: {
      steps: coreSteps('listChildrenValid', 'LIST_ITEM_ROLE_OVERRIDDEN', 2),
      passWhen:
        'Le <li> dont le rôle est remplacé n’est pas présenté comme l’un des éléments de la liste.',
      failWhen: `La page présente ce <li> comme l’un des éléments de la liste, mais son attribut role lui retire son rôle d’élément de liste : la liste n’est pas structurée au moyen des éléments <ul> (ou <ol>) et <li>, ${LIST_TESTS}.`
    }
  },
  'listitem-parent-valid': {
    LISTITEM_INVALID_PARENT: {
      steps: coreSteps('listitemParentValid', 'LISTITEM_INVALID_PARENT', 2),
      passWhen:
        'L’élément n’est pas présenté comme élément d’une liste ; un <li> hors d’une liste reste une erreur d’imbrication au titre du test 8.2.1 du RGAA.',
      failWhen:
        'Le <li> est balisé comme élément de liste, mais aucune balise <ul>, <ol> ou <menu> ne le contient : la liste n’est pas structurée au moyen des éléments <ul> et <li>, ce qui ne respecte pas @TESTS@.'
    },
    LIST_ROLE_OVERRIDDEN: {
      steps: coreSteps('listitemParentValid', 'LIST_ROLE_OVERRIDDEN', 2),
      passWhen:
        'Le contenu n’est pas présenté comme une liste (c’est par exemple un menu ou des onglets dont le rôle convient), donc le test 9.3 ne s’y applique pas.',
      failWhen: `La page présente le contenu comme une liste, mais l’attribut role de la balise <ul> (ou <ol>) lui retire son rôle de liste, ${LIST_TESTS}.`
    }
  },
  'link-name-quality': {
    AMBIGUOUS_FORMAT_NAME: {
      steps: [
        'Repérez le lien indiqué par le rapport ; son texte n’est qu’un format, comme « PDF ».',
        `Lisez le contexte du lien : ${CONTEXT}, et voyez si l’un d’eux nomme le document.`,
        'Suivez le lien et confirmez que le document est bien celui que nomme ce contexte.'
      ],
      passWhen: `La phrase, le paragraphe, l’élément de liste, le titre précédent, la cellule du lien ou un en-tête de tableau associé à cette cellule nomme le document : le lien se comprend alors, par exemple, comme le rapport annuel en PDF ; ${AMBIGUOUS}.`,
      failWhen: `Rien dans le contexte du lien n’indique de quel document il s’agit : ni l’intitulé ni le contexte du lien ne permettent d’en comprendre la fonction et la destination, ${LINK_TESTS}.`
    },
    GENERIC_LINK_TEXT: {
      steps: [
        'Repérez le lien indiqué par le rapport et lisez son texte, comme « lire la suite » ou « cliquez ici ».',
        `Lisez le contexte du lien : ${CONTEXT}.`,
        'Demandez-vous si l’intitulé, additionné à ce contexte, indique clairement la fonction et la destination du lien.',
        'Suivez le lien et confirmez qu’il mène là où le contexte l’indique.'
      ],
      passWhen: `L’intitulé du lien, additionné au contexte du lien, permet d’en comprendre la fonction et la destination, ${AMBIGUOUS}.`,
      failWhen: `Ni l’intitulé ni le contexte du lien ne permettent d’en comprendre la fonction et la destination, ${LINK_TESTS}.`
    }
  },
  'live-region-announcements': {
    LIVE_REGION_BUSY: {
      steps: [
        'Repérez la zone live indiquée par le rapport ; elle avait aria-busy="true" lors de l’analyse de la page.',
        'Déclenchez l’action qui met à jour la zone, puis inspectez-la dans les outils de développement et voyez si aria-busy passe à false ou est retiré une fois la mise à jour terminée.',
        'Refaites l’action avec un lecteur d’écran en marche et écoutez le message.',
        'Si vous n’entendez rien de cette zone, vérifiez si la page annonce le même message autrement, par exemple depuis une autre zone d’état que le lecteur d’écran lit. Cela ne compte que si vous entendez le message en entier sans déplacer le focus.',
        STATUS_NATURE
      ],
      failWhen: `aria-busy reste à true, le lecteur d’écran retient ou saute le message et la page ne l’annonce d’aucune autre façon, ${STATUS_TESTS}.`
    },
    LIVE_REGION_HIDDEN: {
      steps: [
        'Repérez la zone live indiquée par le rapport et notez ce qui la masque, comme le précise le rapport : aria-hidden="true" ou inert sur elle ou sur un ancêtre, ou une boîte de dialogue modale ouverte devant elle.',
        'Vérifiez si une boîte de dialogue modale était ouverte lors de l’analyse de la page ; si c’est le cas, notez si la page écrit dans la zone pendant qu’elle est ouverte, puis fermez-la et voyez si la zone est toujours masquée.',
        'Déclenchez l’action qui met à jour la zone (soumettre un formulaire, ajouter au panier, lancer une recherche) avec un lecteur d’écran en marche.',
        'Écoutez le message. Si vous n’entendez rien, vérifiez dans le volet Accessibilité des outils de développement si cette zone, ou une autre zone d’état portant le même message, est dans l’arbre quand le texte change.',
        STATUS_NATURE
      ],
      failWhen: `La zone est encore masquée par aria-hidden, inert ou une boîte de dialogue modale ouverte quand le message arrive, et rien d’autre ne l’annonce : le lecteur d’écran ne dit rien, ${STATUS_TESTS}.`
    },
    LIVE_REGION_INSERTED_WITH_CONTENT: {
      steps: [
        'Repérez le message cité par le rapport et l’action qui l’affiche (le rapport donne le texte et la zone).',
        'Lancez un lecteur d’écran, puis effectuez cette action.',
        'Écoutez le message sans y déplacer le focus.',
        'S’il n’est pas lu, vérifiez dans les outils de développement si la page ajoute la zone déjà remplie ; une zone vide devrait d’abord être présente sur la page, le texte y étant écrit ensuite.',
        STATUS_NATURE
      ],
      failWhen: `Le message apparaît à l’écran mais le lecteur d’écran ne l’annonce pas, parce que la zone a été ajoutée avec son texte déjà présent, ${STATUS_TESTS}.`
    },
    LIVE_REGION_SHOWN_AND_FILLED: {
      steps: [
        'Repérez le message cité par le rapport et l’action qui l’affiche.',
        'Lancez un lecteur d’écran, puis effectuez cette action.',
        'Écoutez le message sans y déplacer le focus.',
        'S’il n’est pas lu, vérifiez dans les outils de développement si la zone reste masquée jusqu’au moment où son texte est défini ; elle devrait être visible (ou présente et vide) avant l’arrivée du texte.',
        STATUS_NATURE
      ],
      failWhen: `Le message apparaît mais le lecteur d’écran ne l’annonce pas, parce que la zone a été affichée et remplie au même moment, ${STATUS_TESTS}.`
    }
  },
  'menuitem-name-present': itemName('l’élément de menu', 'L’élément de menu'),
  'mouse-only-event-handlers': {
    MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE: {
      steps: [
        'Repérez l’élément indiqué par le rapport et notez ce que font ses gestionnaires de souris en le survolant ou en cliquant dessus.',
        'Parcourez cette partie de la page avec Tab et observez si le focus arrive un jour sur l’élément ou sur quelque chose qu’il contient.',
        'Si c’est le cas, essayez Entrée et les touches de direction et comparez avec ce qu’a fait la souris.',
        otherElementStep('fait la souris')
      ],
      passWhen: `L’élément (ou un élément qu’il contient) reçoit le focus clavier et ses gestionnaires de clavier ou de focus donnent le même résultat que la souris, ou ${OTHER_ELEMENT}, ou ${PRESENTATION_ONLY}.`,
      failWhen: `Le focus n’atteint jamais l’élément et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
    },
    MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT: {
      passWhen: `Le clavier obtient le même résultat au focus ou avec une touche, ou ${OTHER_ELEMENT}, ou ${PRESENTATION_ONLY}.`,
      failWhen: `Une chose que fait la souris (ouvrir un menu, afficher une information, déplacer un élément) ne peut pas être faite au clavier, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
    }
  },
  'manual-review': {
    KEYBOARD_REVIEW: {
      steps: [
        'Cliquez dans la barre d’adresse du navigateur, puis appuyez plusieurs fois sur Tab, et sur Maj+Tab pour revenir, afin de parcourir chaque lien et chaque contrôle de la page.',
        'À chaque arrêt, vérifiez que vous voyez où se trouve le focus (contour ou fond modifié, contrasté à 3:1 au moins avec ce qui l’entoure), et que l’ordre de déplacement reste cohérent avec le contenu (il n’a pas à suivre l’ordre de lecture tant qu’il reste cohérent ; dans une fenêtre modale, il ne doit parcourir que ses éléments).',
        'Ouvrez et fermez au clavier les menus et les boîtes de dialogue, et parcourez aussi leur contenu.',
        'Vérifiez que, depuis chaque élément, Tab ou Maj+Tab permet d’atteindre l’élément suivant ou précédent, ou qu’une autre touche dont l’utilisateur est informé le permet.'
      ],
      passWhen:
        'L’ordre de tabulation reste cohérent, chaque élément permet d’atteindre le suivant et le précédent au clavier, et la prise de focus est toujours visible.',
      failWhen:
        'L’ordre de tabulation n’est pas cohérent (test 12.8.1 du RGAA), ou le focus reste bloqué sur un élément sans moyen dont l’utilisateur est informé (test 12.9.1 du RGAA), ou la prise de focus n’est pas visible (test 10.7.1 du RGAA) : chacun de ces cas ne respecte pas le test RGAA indiqué.'
    }
  },
  'page-title-patterns': {
    duplicateTitlesAcrossPages: {
      passWhen: 'Les pages qui partagent le titre sont un même contenu à des URL différentes.',
      failWhen:
        'Des pages différentes partagent un même titre, qui ne permet ni de les identifier de manière unique ni de les distinguer dans l’historique de navigation ou la liste des onglets, ce qui ne respecte pas @TESTS@.'
    },
    genericTitle: {
      passWhen: `Le titre dit de quoi parle la page, même s’il s’agit d’un mot courant, ${TITLE_FOUND}`
    },
    templateLikeTitle: {
      passWhen: `La page est la page d’accueil du site, que le titre nomme, ou le titre dit de quoi parle la page, ${TITLE_FOUND}`
    },
    templatedTitlesAcrossPages: {
      passWhen: `Chaque titre a une partie propre qui dit de quoi parle sa page, ${TITLE_FOUND}`,
      failWhen:
        'Au-delà de la partie partagée, les titres ne permettent pas d’identifier chaque page ni de la retrouver dans l’historique ou la liste des onglets, ce qui ne respecte pas @TESTS@.'
    },
    titleReview: {
      passWhen: `Le titre dit de quoi parle la page ou à quoi elle sert, ${TITLE_FOUND}`
    },
    veryShortTitle: {
      passWhen: `Le titre court dit de quoi parle la page, par exemple le nom du produit ou du lieu qu’elle présente, ${TITLE_FOUND}`
    }
  },
  'server-side-image-map-absent': {
    SERVER_SIDE_IMAGE_MAP: {
      passWhen:
        'Chaque destination de l’image réactive est aussi accessible par un lien, un ensemble de liens ou un autre composant (une liste de sélection, par exemple) utilisable quel que soit le dispositif de pointage.'
    }
  },
  'skip-link': {
    SKIP_LINK_TARGET_MISSING: {
      failWhen:
        'Rien ne se passe ou le focus reste en haut, car aucun élément ne correspond à la cible du lien : le lien n’est pas fonctionnel, ce qui ne respecte pas @TESTS@.'
    },
    SKIP_LINK_TARGET_UNUSABLE: {
      failWhen:
        'La cible est masquée, non affichée ou sans dimension : le lien n’est pas fonctionnel, ce qui ne respecte pas @TESTS@.'
    }
  },
  'text-spacing-content-loss': {
    STYLESHEET_IMPORTANT: {
      steps: [
        ...coreSteps('textSpacingContentLoss', 'STYLESHEET_IMPORTANT', 3),
        'Si ce n’est pas le cas, ajoutez ces valeurs avec !important dans le style de l’élément (section element.style), comme le ferait une feuille de style utilisateur, qui l’emporte sur le !important de la page, et vérifiez si son texte reste lisible.'
      ],
      passWhen:
        'L’espacement du test s’applique à l’élément, ou s’y applique une fois imposé comme le ferait une feuille de style utilisateur, et son texte reste lisible : rien n’est coupé, masqué ni ne se chevauche.',
      failWhen:
        'Une fois l’espacement du test appliqué à l’élément, du texte est coupé, masqué ou se chevauche, ce qui ne respecte pas @TESTS@.'
    }
  },
  'svg-text-alternative-quality': {
    TEXT_ALTERNATIVE_REVIEW: {
      steps: [
        'Regardez le graphique indiqué par le rapport et notez ce qu’il montre (une icône, un logo, un diagramme et ses données).',
        'Lisez son alternative dans le rapport (title, aria-label ou texte de aria-labelledby ; desc ne compte pas pour ce test), ou dans le panneau Accessibilité des outils de développement.',
        NO_DETAILED_DESCRIPTION('identifie le graphique', '1.6.5'),
        'Décidez si l’alternative dit ce que le graphique apporte au contenu, ou s’il s’agit d’une image de décoration.'
      ],
      passWhen: 'L’alternative identifie le graphique et transmet l’information qu’il apporte.',
      failWhen:
        'Le graphique est porteur d’information et son alternative est fausse, vague (comme « image » ou « icône ») ou ne correspond pas à son information, ce qui ne respecte pas le test 1.3.6 du RGAA ; ou c’est une image de décoration qui n’est pas masquée par aria-hidden="true" et garde une alternative, ce qui ne respecte pas le test 1.2.4 du RGAA.'
    }
  },
  'table-fake-caption': {
    SINGLE_CELL_FIRST_ROW_NO_CAPTION: {
      steps: [
        'Repérez le tableau indiqué par le rapport et regardez sa première ligne, qui contient une seule cellule de texte.',
        'Vérifiez d’abord qu’il s’agit d’un tableau de données ; un tableau de mise en forme relève du critère RGAA 5.3. Déterminez ensuite si cette cellule est un titre pour tout le tableau, ou une vraie donnée ou un en-tête de sa colonne.',
        'S’il s’agit d’un titre, vérifiez dans le panneau Accessibilité des outils de développement si le tableau a un nom, donné par une balise <caption>, un attribut title, aria-label ou aria-labelledby.'
      ],
      passWhen:
        'La cellule de la première ligne est une donnée ou un en-tête ; ou le titre du tableau lui est associé par une balise <caption>, un attribut title, aria-label ou aria-labelledby ; ou le tableau est un tableau de mise en forme.',
      failWhen:
        'Le titre du tableau de données n’apparaît que comme une cellule de la première ligne, sans lui être associé par une balise <caption>, un attribut title, aria-label ou aria-labelledby, ce qui ne respecte pas le test 5.4.1 du RGAA.'
    }
  },
  tabindex: {
    TABINDEX_POSITIVE: {
      steps: [
        'Cliquez juste avant le début de la page, puis appuyez plusieurs fois sur Tab en observant le contour de focus.',
        'Notez à quel moment l’élément indiqué par le rapport reçoit le focus, par rapport à sa position à l’écran.',
        'Vérifiez si l’ordre dans lequel le focus parcourt la page reste cohérent avec son contenu (il peut s’écarter de l’ordre de lecture tant qu’il reste logique), en avançant avec Tab puis en reculant avec Maj+Tab.'
      ],
      passWhen:
        'Le focus parcourt la page dans un ordre cohérent avec son contenu, même s’il s’écarte de l’ordre de lecture.',
      failWhen:
        'Le tabindex positif fait passer le focus dans un ordre incohérent avec le contenu (par exemple, il saute d’une zone à une autre sans lien, puis revient), ce qui ne respecte pas @TESTS@.'
    }
  },
  'tab-name-present': itemName('l’onglet', 'L’onglet'),
  'treeitem-name-present': itemName('l’élément d’arborescence', 'L’élément d’arborescence'),
  // 7.3.1 asks that the element work by keyboard; whether a screen reader
  // announces it is 7.1.2's.
  'widget-keyboard-focusable': {
    ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE: {
      steps: [
        'Repérez l’élément indiqué par le rapport ; il utilise aria-activedescendant pour désigner son élément actif.',
        'En n’utilisant que le clavier, ouvrez ou atteignez le widget (par exemple en tapant dans son champ de recherche) et observez si c’est bien cet élément, et pas un autre, qui reçoit le focus.',
        'Appuyez sur les touches de direction et vérifiez que l’élément actif change visiblement et qu’Entrée le choisit.',
        'Si les éléments ne peuvent pas être atteints ainsi, vérifiez si un autre élément de la page, utilisable au clavier et à la souris, permet de faire les mêmes choix, par exemple un champ de texte où saisir la valeur. Cela ne compte que si chaque choix est disponible ainsi.'
      ],
      passWhen:
        'L’élément reçoit le focus et les touches de direction permettent de parcourir et de choisir les éléments, ou un autre élément de la page, utilisable au clavier et à tout dispositif de pointage, permet de faire les mêmes choix.',
      failWhen:
        'L’élément ne peut pas recevoir le focus, ses éléments ne peuvent donc pas être parcourus ni choisis au clavier, et aucun autre élément de la page utilisable au clavier ne permet les mêmes choix, ce qui ne respecte pas @TESTS@.'
    },
    COMPOSITE_NO_TAB_STOP: {
      steps: [
        'Repérez le widget indiqué par le rapport (un menu, une zone de liste, une liste d’onglets, une barre d’outils, une grille ou une arborescence).',
        'Cliquez juste avant lui et appuyez sur Tab, puis observez si le focus y entre ou atteint l’un de ses éléments.',
        'S’il s’agit d’une fenêtre contextuelle, ouvrez-la au clavier depuis son bouton et voyez si le focus s’y déplace.',
        'Une fois à l’intérieur, vérifiez que les touches de direction permettent de passer d’un élément à l’autre.',
        'Si le focus n’y entre jamais, vérifiez si un autre élément de la page, utilisable au clavier et à la souris, réalise ce que fait le composant, par exemple les mêmes choix proposés sous forme de liens ou de boutons. Cela ne compte que si chaque option du composant est disponible ainsi.'
      ],
      passWhen:
        'Tab (ou le bouton qui l’ouvre) place le focus dans le composant et les touches de direction passent d’un élément à l’autre, ou d’autres éléments de la page, utilisables au clavier et à tout dispositif de pointage, réalisent tout ce que font ses éléments.',
      failWhen:
        'Le focus n’entre jamais dans le composant ni dans ses éléments au clavier, et aucun autre élément de la page utilisable au clavier ne réalise ce qu’ils font, ce qui ne respecte pas @TESTS@.'
    },
    WIDGET_NOT_FOCUSABLE: {
      steps: [
        'Repérez le widget indiqué par le rapport et notez ce qu’il fait quand on clique dessus ou qu’on le touche.',
        'Cliquez juste avant lui, puis appuyez sur Tab et observez si le focus arrive un jour sur lui.',
        'S’il ne reçoit jamais le focus, cherchez un autre élément de la page, utilisable au clavier et à la souris, qui réalise la même action.',
        'Si l’élément ne fait rien, le test 7.3.1 ne s’applique pas à lui : notez que son rôle de widget ne correspond à aucune action.'
      ],
      passWhen: `Le widget reçoit le focus clavier et s’utilise au clavier (Entrée, ou touches de direction pour une action complexe), ou ${OTHER_ELEMENT}.`,
      failWhen: `Le widget ne peut pas être atteint ni utilisé au clavier, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
    },
    WIDGET_NOT_IN_TAB_ORDER: {
      steps: [
        'Repérez le widget indiqué par le rapport et notez quand il apparaît (par exemple à l’ouverture d’un menu ou d’une boîte de dialogue).',
        'N’utilisez que le clavier pour ouvrir ou atteindre cette partie de la page, et observez si un script déplace le focus sur le widget, ou si les touches de direction l’atteignent.',
        'Si le focus ne l’atteint jamais, cherchez un autre élément de la page, utilisable au clavier et à la souris, qui réalise la même action.'
      ],
      passWhen: `Le focus est déplacé sur le widget par un script ou par les touches de direction quand c’est nécessaire, et il s’utilise alors au clavier (Entrée, ou touches de direction pour une action complexe), ou ${OTHER_ELEMENT}.`,
      failWhen: `Ni Tab ni les touches de direction n’atteignent jamais le widget, et ${NO_OTHER_ELEMENT}, ce qui ne respecte pas @TESTS@.`
    }
  },
  'video-caption': {
    CAPTIONS_REVIEW: {
      steps: [
        'Lancez la vidéo indiquée par le rapport et activez ses sous-titres.',
        'Regardez-la avec le son et comparez les sous-titres avec ce qui est dit et entendu.',
        'Vérifiez qu’ils reprennent tous les dialogues et les sons importants et qu’ils restent synchronisés ; il est recommandé, sans être exigé, qu’ils indiquent qui parle.'
      ]
    },
    CAPTIONS_TRACK_NOT_DETECTED: {
      passWhen:
        'La vidéo n’a pas de son porteur de sens ; des sous-titres synchronisés (dans cette vidéo ou dans une version sous-titrée accessible par un lien ou bouton adjacent) couvrent les dialogues et les sons ; ou la vidéo relève d’un cas particulier du critère RGAA 4.1 (décorative, elle-même alternative à un contenu de la page, CAPTCHA, test, exemptions liées à la date de publication).'
    },
    SUBTITLES_TRACK_ONLY: {
      steps: [
        'Lancez la vidéo indiquée par le rapport et activez sa piste de sous-titres de traduction (subtitles).',
        'Regardez-la avec le son et comparez le texte avec ce qui est entendu.',
        'Vérifiez qu’en plus des dialogues, elle restitue les sons importants pour comprendre l’action ; cherchez aussi, juste avant ou après la vidéo, un lien ou un bouton vers une version sous-titrée.'
      ],
      passWhen:
        'La piste restitue les paroles et les sons importants (elle fonctionne donc comme des sous-titres synchronisés, mais le test 4.3.2 demande alors kind="captions") ; ou une version sous-titrée est accessible par un lien ou bouton adjacent ; ou la vidéo n’a pas d’audio qui nécessite des sous-titres, ou relève des cas particuliers du critère RGAA 4.1.',
      failWhen:
        'La piste ne donne que les paroles, sans les sons importants, et aucune version sous-titrée n’est proposée à côté, ce qui ne respecte pas le test 4.3.1 du RGAA.'
    }
  }
};
