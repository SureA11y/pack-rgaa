'use strict';

/**
 * Where core's French steps can't simply name RGAA's test instead of WCAG's:
 * what they say is WCAG's logic, not RGAA's (a level, a threshold, an
 * exception, what counts as passing). Each entry replaces the parts it gives
 * of core's entry for that rule and reason code; scripts/generate-review.js
 * fails if a code that counts toward a test is left with WCAG's terms.
 * @TESTS@ names the tests the code's findings bear on.
 */

const CONTEXT =
  'la phrase, le paragraphe, l’élément de liste, le titre précédent ou l’en-tête de tableau';
const ALTERNATIVE =
  'un composant d’interface ou une alternative accessible donne accès aux mêmes fonctionnalités';

const NAME_NEEDED = {
  passWhen: `L’élément a un nom explicite, ou ${ALTERNATIVE}.`,
  failWhen: `L’élément n’a pas de nom explicite et aucun composant ni alternative accessible ne donne accès aux mêmes fonctionnalités, ce qui ne respecte pas @TESTS@.`
};

const LABEL_NEARBY = {
  passWhen:
    'Un attribut title, ou un passage de texte accolé au champ, visible ou qui le devient à la prise de focus, permet de comprendre la nature de la saisie attendue.',
  failWhen:
    'Rien de tout cela ne permet de comprendre la nature de la saisie attendue, ce qui ne respecte pas @TESTS@.'
};

module.exports = {
  'aria-role-name-present': { name_internals: NAME_NEEDED, name_missing: NAME_NEEDED },
  'dialog-name-present': { name_internals: NAME_NEEDED, name_missing: NAME_NEEDED },
  'avoid-inline-spacing': {
    INLINE_SPACING_NOT_RESOLVABLE: {
      passWhen:
        'La valeur imposée atteint celle du test, ou le texte ne revient pas à la ligne, ou rien n’est perdu une fois l’espacement appliqué.'
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
        'Inspectez les éléments indiqués par le rapport, dans la même racine shadow, et notez l’id qu’ils partagent.',
        'Vérifiez si quelque chose fait référence à cet id : l’attribut for d’un label, un attribut aria-* comme aria-labelledby, ou un lien vers #the-id.',
        'Si quelque chose y fait référence, suivez la référence et vérifiez qu’elle atteint l’élément voulu.',
        'Vérifiez si l’audit juge le code des racines shadow : le validateur du W3C ne les voit pas dans le code source généré.'
      ],
      passWhen:
        'Rien ne casse à cause du doublon, et l’audit laisse les racines shadow hors du test 8.2.1.',
      failWhen:
        'Une référence atteint le mauvais élément, ou l’audit juge ce code : les valeurs d’attribut id ne sont pas uniques dans la page, ce qui ne respecte pas @TESTS@.'
    }
  },
  'form-control-programmatic-label-quality': {
    label_from_aria_label_only: LABEL_NEARBY,
    label_from_hidden_labelledby: {
      steps: [
        'Repérez le champ indiqué par le rapport et, dans les outils de développement, suivez ses id aria-labelledby jusqu’aux éléments qu’ils désignent.',
        'Vérifiez si ces éléments sont affichés à l’écran quand le champ l’est.',
        'Déterminez si ce passage de texte permet de connaître la fonction exacte du champ, et cherchez un title ou un texte accolé au champ qui dit quoi saisir.'
      ],
      ...LABEL_NEARBY
    },
    label_from_placeholder_primary: {
      steps: [
        'Repérez le champ indiqué par le rapport et lisez son placeholder.',
        'Saisissez quelque chose dans le champ.',
        'Vérifiez si un attribut title, ou un texte accolé au champ, dit encore à quoi il sert.'
      ],
      ...LABEL_NEARBY
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
  'identical-links-same-purpose': {
    SAME_NAME_DIFFERENT_DESTINATION: {
      steps: [
        'Repérez tous les liens portant le nom indiqué par le rapport et notez où chacun mène.',
        `Lisez le contexte de chaque lien : ${CONTEXT}.`,
        'Ouvrez chaque lien et comparez les pages atteintes.',
        'Déterminez si le contexte de chaque lien permet d’en comprendre la fonction et la destination.'
      ],
      passWhen:
        'Chaque lien mène à la même page ou à des pages de même fonction, ou son intitulé additionné à son contexte permet d’en comprendre la fonction et la destination.',
      failWhen:
        'Des liens de même nom mènent à des pages aux fonctions différentes et leur contexte ne permet pas de les distinguer, ce qui ne respecte pas @TESTS@.'
    }
  },
  'image-redundant-alt': {
    IMAGE_ALT_REDUNDANT: {
      failWhen:
        'L’alternative répète le texte à côté sans rien apporter de pertinent : les mêmes mots sont lus deux fois, ce qui ne respecte pas @TESTS@.'
    }
  },
  'link-name-quality': {
    AMBIGUOUS_FORMAT_NAME: {
      failWhen:
        'Rien près du lien n’indique de quel document il s’agit : ni l’intitulé ni le contexte du lien ne permettent d’en comprendre la fonction et la destination, ce qui ne respecte pas @TESTS@.'
    },
    GENERIC_LINK_TEXT: {
      steps: [
        'Repérez le lien indiqué par le rapport et lisez son texte, comme « lire la suite » ou « cliquez ici ».',
        `Lisez le contexte du lien : ${CONTEXT}.`,
        'Demandez-vous si l’intitulé, additionné à ce contexte, indique clairement la fonction et la destination du lien.',
        'Suivez le lien et confirmez qu’il mène là où le contexte l’indique.'
      ],
      passWhen:
        'L’intitulé du lien, additionné au contexte du lien, permet d’en comprendre la fonction et la destination.',
      failWhen:
        'Ni l’intitulé ni le contexte du lien ne permettent d’en comprendre la fonction et la destination, ce qui ne respecte pas @TESTS@.'
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
  tabindex: {
    TABINDEX_POSITIVE: {
      failWhen:
        'Le tabindex positif fait sauter le focus hors de l’ordre de lecture : l’ordre de tabulation n’est pas cohérent, ce qui ne respecte pas @TESTS@.'
    }
  }
};
