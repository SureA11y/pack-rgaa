/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-consequential-form-review
 * @atomic true
 * @summary Forms with financial, legal or data consequences can be checked, confirmed or undone
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible forms that certainly have the consequences 11.12
 *   names, found by narrow signals only:
 *   - card fields (autocomplete cc-number, cc-csc, cc-exp…), a payment;
 *   - a current-password and a new-password field together, a password
 *     change (a sign-up form has only the new one);
 *   - a submit button whose whole label, amounts and arrows aside, is one
 *     of the French or English phrases apps use for paying or ordering,
 *     deleting or closing an account, cancelling a subscription, an order
 *     or a booking, signing, changing a password, or sending the answers
 *     of a test (« Payer », « Valider ma commande », « Supprimer mon
 *     compte », « Résilier mon abonnement », « Signer », « Place order »,
 *     « Delete account »…).
 *   Generic labels (« Valider », « Envoyer », « Confirmer », « Continuer »,
 *   « Enregistrer », « Supprimer », « Annuler », Submit, Save, OK) and
 *   search forms are left out: they say nothing of the consequences. A
 *   page with none is notApplicable.
 * @expectation
 *   RGAA 11.12.1: a form « qui modifie ou supprime des données, ou qui
 *   transmet des réponses à un test ou un examen, ou dont la validation a
 *   des conséquences financières ou juridiques » lets the user change or
 *   cancel the data afterwards, check and correct them before a multi-step
 *   form is submitted, or confirm explicitly (a checkbox or an extra
 *   step). 11.12.2: a form that changes or deletes financial, legal or
 *   personal data offers a way to get them back or an explicit
 *   confirmation. What happens after submitting is not in the page, so
 *   each such form is asked about once (payment, accountDeletion,
 *   cancellation, signature, passwordChange, testAnswers).
 * @implementation-notes
 * - Manual (cantTell).
 * - Only submit buttons inside a <form> are read (<button> without
 *   type or type=submit, <input type=submit|image>).
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-consequential-form-review';

const meta = {
  title: 'Forms with financial, legal or data consequences can be checked, confirmed or undone',
  description:
    'Flags payment, account deletion, cancellation, signature, password change and test forms, found by card fields or by their submit button, for a person to check that the data can be reviewed, confirmed or recovered.',
  i18n: {
    titleKey: 'consequentialFormReview_title',
    descriptionKey: 'consequentialFormReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const attr = (el, name) => {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  };
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const roleOf = (el) => {
    try {
      return helpers.aria.getExplicitRole(el) || '';
    } catch {
      return '';
    }
  };
  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }
  const query = (sel) =>
    helpers.queryAllSmart ? helpers.queryAllSmart(sel) : helpers.queryAll(sel);

  // A label as a phrase: lower case, typographic apostrophes, no amounts,
  // currencies, arrows or punctuation around it.
  function phrase(text) {
    return norm(
      String(text || '')
        .normalize('NFC')
        .toLowerCase()
        .replace(/[’ʼ]/g, "'")
        .replace(/[\d\s.,]*\d[\d\s.,]*\s*(?:€|\$|£|eur|euros?)?/g, ' ')
        .replace(/[€$£]/g, ' ')
        .replace(/[>›»→←‹«<!?:;()[\]{}*+\-–—/\\|.,"]/g, ' ')
    );
  }

  // Whole labels apps use, French then English. Each is matched as the
  // entire label, so « Payer » matches and « Payer en plusieurs fois :
  // conditions » does not.
  const KINDS = [
    [
      'payment',
      [
        'payer(?: maintenant| ma commande| la commande)?',
        '(?:effectuer|valider|confirmer) (?:le|mon) paiement',
        'valider et payer',
        'commander(?: et payer)?',
        'passer (?:la |ma )?commande',
        '(?:valider|confirmer|finaliser) (?:la|ma) commande',
        "finaliser (?:mon|l')achat",
        'acheter(?: maintenant)?',
        '(?:faire|je fais) un don',
        '(?:effectuer|valider|confirmer) le virement',
        'souscrire(?: maintenant)?',
        'réserver et payer',
        'confirmer (?:la|ma) réservation',
        'pay(?: now)?',
        'place (?:my |your )?order',
        'complete (?:order|purchase|payment)',
        'confirm (?:order|payment|purchase|booking|transfer)',
        'buy(?: now)?',
        'purchase',
        'donate(?: now)?',
        'make (?:a )?payment',
        'submit payment',
        'book and pay'
      ]
    ],
    [
      'accountDeletion',
      [
        'supprimer (?:mon |le |votre )?compte',
        'supprimer définitivement(?: mon compte| le compte)?',
        'supprimer mes données',
        '(?:fermer|clôturer) (?:mon |le )?compte',
        'delete (?:my |your )?account',
        '(?:permanently delete|delete permanently)',
        'close (?:my )?account',
        'delete my data'
      ]
    ],
    [
      'cancellation',
      [
        "résilier(?: (?:mon |l')abonnement| le contrat| mon contrat)?",
        'annuler (?:ma |la )(?:commande|réservation)',
        "annuler (?:mon |l')abonnement",
        'cancel (?:my )?(?:subscription|order|booking|reservation|membership)'
      ]
    ],
    [
      'signature',
      [
        'signer(?: le contrat| le document| électroniquement)?',
        'valider et signer',
        '(?:valider|signer|envoyer) ma déclaration',
        'sign(?: contract| the contract| document| the document)?',
        'sign and submit'
      ]
    ],
    [
      'passwordChange',
      [
        '(?:changer|modifier) (?:mon |le )?mot de passe',
        'change (?:my )?password',
        'update (?:my )?password'
      ]
    ],
    [
      'testAnswers',
      [
        '(?:envoyer|valider|soumettre) mes réponses',
        "terminer (?:le test|l'examen|le quiz)",
        'submit (?:my )?answers',
        'submit (?:the )?(?:exam|test|quiz)',
        'finish (?:the )?(?:exam|test|quiz)'
      ]
    ]
  ].map(([kind, list]) => [kind, new RegExp(`^(?:${list.join('|')})$`, 'u')]);

  function labelOf(el) {
    const ref = norm(attr(el, 'aria-labelledby'));
    if (ref) {
      const parts = ref
        .split(' ')
        .map((r) => {
          try {
            const t = helpers.getElementByIdInTree(el, r);
            return t ? norm(dom.textContent(t)) : '';
          } catch {
            return '';
          }
        })
        .filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    const aria = norm(attr(el, 'aria-label'));
    if (aria) return aria;
    if (tagOf(el) === 'input') return norm(attr(el, 'value')) || norm(attr(el, 'alt'));
    return norm(dom.textContent(el));
  }

  const isSubmit = (el) => {
    const tag = tagOf(el);
    const type = String(attr(el, 'type') || '').toLowerCase();
    if (tag === 'button') return !type || type === 'submit';
    return tag === 'input' && (type === 'submit' || type === 'image');
  };

  const occurrences = [];
  for (const form of query('form')) {
    if (roleOf(form) === 'search' || !visible(form)) continue;
    const fields = Array.from(dom.querySelectorAll(form, 'input, select, textarea')).filter(
      (f) => visible(f) || String(attr(f, 'type') || '').toLowerCase() === 'hidden'
    );
    const tokens = fields.map((f) => String(attr(f, 'autocomplete') || '').toLowerCase());
    let kind = '';
    let label = '';
    if (tokens.some((t) => /(?:^|\s)cc-(?:number|csc|exp(?:-month|-year)?)(?:\s|$)/.test(t))) {
      kind = 'payment';
    } else if (
      tokens.some((t) => /(?:^|\s)current-password(?:\s|$)/.test(t)) &&
      tokens.some((t) => /(?:^|\s)new-password(?:\s|$)/.test(t))
    ) {
      kind = 'passwordChange';
    }
    for (const b of Array.from(dom.querySelectorAll(form, 'button, input'))) {
      if (!isSubmit(b) || !visible(b)) continue;
      const text = labelOf(b);
      const p = phrase(text);
      const hit = KINDS.find(([, re]) => re.test(p));
      if (!hit) continue;
      label = text;
      if (!kind) kind = hit[0];
      break;
    }
    if (!kind) continue;
    const params = { label };
    const key = label ? kind : `${kind}_noLabel`;
    const SUMMARY = {
      payment: 'This form pays or places an order ("{{label}}").',
      payment_noLabel: 'This form asks for card details.',
      accountDeletion: 'This form deletes or closes an account ("{{label}}").',
      cancellation: 'This form cancels a subscription, an order or a booking ("{{label}}").',
      signature: 'This form signs a document or a declaration ("{{label}}").',
      passwordChange: 'This form changes a password ("{{label}}").',
      passwordChange_noLabel:
        'This form changes a password: it asks for the current and a new one.',
      testAnswers: 'This form sends the answers to a test or an exam ("{{label}}").'
    };
    occurrences.push(
      helpers.reportOccurrence(form, {
        summary: SUMMARY[key].replace('{{label}}', label),
        hint: 'Check that the user can review and correct the data before submitting, confirm explicitly (a checkbox or an extra step), or change, cancel or recover them afterwards (RGAA 11.12).',
        i18n: {
          summaryKey: `consequentialFormReview_summary_cantTell_${key}`,
          hintKey: 'consequentialFormReview_hint_cantTell',
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the data can be reviewed, confirmed, changed, cancelled or recovered.'
        },
        data: {
          details: { reasonCode: kind, label },
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
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
