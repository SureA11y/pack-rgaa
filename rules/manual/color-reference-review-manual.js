/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-color-reference-review
 * @atomic true
 * @summary Text that refers to a colour does not give the information by colour alone
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible text that indicates something by a colour: « les
 *   champs indiqués en rouge », « les cases en vert », « shown in red »,
 *   « the green items ». A colour name alone (« un t-shirt rouge ») does not
 *   count: the colour must follow a verb such as indiquer, signaler,
 *   marquer, surligner, afficher, or come with a word for a part of the page
 *   (champ, case, ligne, élément, texte, field, item, row, text…). Text in
 *   code, scripts, styles and form controls is left out. A page with none
 *   is notApplicable.
 * @expectation
 *   RGAA 3.1.2: « Pour chaque indication de couleur donnée par un texte,
 *   l’information ne doit pas être donnée uniquement par la couleur ». Each
 *   such text is asked about (colorReference), one occurrence per element:
 *   whether the same information is also given another way (a word, a
 *   sign, a shape) is for a person.
 * @implementation-notes
 * - Manual (cantTell).
 * - French, English, Spanish and German phrasings, used whatever the
 *   page's language.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-color-reference-review';

const meta = {
  title: 'Text that refers to a colour does not give the information by colour alone',
  description:
    'Flags text that indicates something by a colour (« indiqués en rouge », « shown in green »), for a person to check that the information is also given another way.',
  i18n: {
    titleKey: 'colorReferenceReview_title',
    descriptionKey: 'colorReferenceReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'color', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['colorReference'],
  review: {
    colorReference: {
      steps: [
        'Find the text the report names: it refers to a colour, such as "the fields in red".',
        'Find what it refers to on the page.',
        'Check whether something other than colour identifies it: a visible text or sign (such as an asterisk explained in the page), or an icon, shape or style that also comes with a text in the code (aria-label, title, hidden text, aria-current).'
      ],
      passWhen:
        'Something other than colour gives the same information, or the text gives no information by colour.',
      failWhen: 'The colour is the only way to get the information, which fails RGAA 3.1.2.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }

  const FR = '(?:rouges?|verte?s?|bleue?s?|orange|jaunes?|grise?s?|violette?s?|roses?)';
  const EN = '(?:red|green|blue|orange|yellow|gr[ae]y|purple|pink)';
  const ES = '(?:rojo|roja|verde|azul|naranja|amarillo|amarilla|gris|morado|morada|rosa)s?';
  const DE = '(?:rot|grün|blau|orange|gelb|grau|lila|violett|rosa)';
  // Word boundaries that see accented letters, which \b does not.
  const B = '(?<!\\p{L})';
  const E = '(?!\\p{L})';
  const PATTERNS = [
    // « indiqués en rouge », « surlignées en vert », « en couleur rouge »
    new RegExp(
      `${B}(?:indiqu|signal|marqu|surlign|affich|apparai|apparaî|écrit|colori|mis|mise|identifi|représent)\\p{L}*\\s+(?:en|par\\s+(?:la\\s+)?couleur)\\s+(?:couleur\\s+)?${FR}${E}`,
      'iu'
    ),
    // « les champs en rouge », « les cases vertes »
    new RegExp(
      `${B}(?:champs?|cases?|lignes?|cellules?|zones?|éléments?|mentions?|textes?|mots?|boutons?|liens?|pastilles?|points?|icônes?)\\s+(?:(?:en|de\\s+couleur)\\s+)?${FR}${E}`,
      'iu'
    ),
    // « shown in red », « highlighted in green »
    new RegExp(
      `${B}(?:shown|marked|highlighted|displayed|indicated|appears?|written|colou?red|printed|identified)\\s+in\\s+${EN}${E}`,
      'iu'
    ),
    // « the red fields », « items in green »
    new RegExp(
      `${B}${EN}\\s+(?:fields?|items?|rows?|cells?|text|words?|labels?|dots?|icons?|links?|buttons?|areas?|entries)${E}`,
      'iu'
    ),
    new RegExp(`${B}(?:fields?|items?|rows?|cells?|text|words?|entries)\\s+in\\s+${EN}${E}`, 'iu'),
    // « marcados en rojo », « los campos en verde »
    new RegExp(
      `${B}(?:indicad|marcad|resaltad|señalad|mostrad|escrit|campos?|casillas?|filas?|celdas?|elementos?|textos?|palabras?)\\p{L}*\\s+en\\s+${ES}${E}`,
      'iu'
    ),
    // « rot markiert », « grün hervorgehoben », « in Rot »
    new RegExp(
      `${B}${DE}\\s+(?:markiert|hervorgehoben|gekennzeichnet|dargestellt|angezeigt|unterlegt)${E}`,
      'iu'
    ),
    new RegExp(
      `${B}(?:markiert|hervorgehoben|gekennzeichnet|dargestellt|angezeigt)\\s+in\\s+${DE}${E}`,
      'iu'
    )
  ];

  const SKIP = new Set([
    'script',
    'style',
    'template',
    'noscript',
    'code',
    'kbd',
    'samp',
    'pre',
    'textarea',
    'select',
    'option',
    'button'
  ]);
  function excluded(el) {
    for (let a = el; a && dom.nodeType(a) === 1; a = dom.parentElement(a)) {
      if (SKIP.has(tagOf(a))) return true;
      if (norm(dom.getAttribute(a, 'aria-hidden')).toLowerCase() === 'true') return true;
    }
    return false;
  }

  const occurrences = [];
  const seen = new Set();
  const body = dom.body(document);
  let walker = null;
  try {
    walker = body ? dom.createTreeWalker(document, body, 4, null) : null;
  } catch {}
  for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
    const t = norm(dom.nodeValue(n));
    if (t.length < 6) continue;
    const p = dom.parentElement(n);
    if (!p || seen.has(p)) continue;
    let match = null;
    for (const re of PATTERNS) {
      match = re.exec(t);
      if (match) break;
    }
    if (!match || excluded(p) || !visible(p)) continue;
    seen.add(p);
    const sample = match[0];
    occurrences.push(
      helpers.reportOccurrence(p, {
        summary: `This text refers to a colour ("${sample}"); check that the information is not given by colour alone.`,
        hint: 'Give the same information another way as well: a word, a sign such as an asterisk, or a shape (RGAA 3.1.2).',
        i18n: {
          summaryKey: 'colorReferenceReview_summary_cantTell',
          hintKey: 'colorReferenceReview_hint_cantTell',
          params: { sample }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the information the colour gives is also given another way.'
        },
        data: {
          details: { reasonCode: 'colorReference', sample },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
