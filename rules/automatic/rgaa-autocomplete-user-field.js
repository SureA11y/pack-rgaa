/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-autocomplete-user-field
 * @atomic true
 * @summary A field about the user must have a valid autocomplete value
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the <input>, <select> and <textarea> fields that take a
 *   value (not disabled, not of type hidden, button, checkbox, file, image,
 *   radio, reset or submit), outside search forms, that may concern the
 *   user: the author gave them an autocomplete value, or they look like
 *   personal data (type email, tel or password, or a label, name, id or
 *   placeholder naming a name, an address, a telephone, an email, a
 *   birth date, an identifier or a password). Content hidden with CSS or
 *   the hidden attribute is left out. A page with none is notApplicable.
 * @expectation
 *   RGAA 11.13.1 applies to each field « dont l'objet se rapporte à une
 *   information concernant l'utilisateur », and asks for an autocomplete
 *   attribute whose value is in the list of the glossary « Liste des
 *   valeurs de l'attribut autocomplete » (on and off are not in it):
 *   - fails a value that names a field of that list (email, tel,
 *     postal-code…) but is not well formed (« email home », « work
 *     photo »): the author says the field is about the user, and the
 *     browser cannot use the value;
 *   - asks (cantTell) about a field that looks like personal data with no
 *     autocomplete, on, off, or a value naming no field of the list: only a
 *     person can say whether the information concerns the user (an
 *     email to send a page to a friend does not);
 *   - passes a well-formed value. Whether it suits the field is the
 *     relevance condition of 11.13.1, which a person judges.
 *   A field with an invalid value that does not look like personal data
 *   (autocomplete="nope" on a filter) is not about the user, so 11.13 does
 *   not apply to it.
 * @implementation-notes
 * - autocomplete-valid, the WCAG rule, fails every invalid value, on any
 *   field: on a search field, 11.13 does not apply. This rule takes 11.13.1
 *   instead.
 * - The well-formedness test is autocomplete-valid's: an optional
 *   section-*, then shipping or billing, then home, work, mobile, fax or
 *   pager before a contact field only, then one field name, then webauthn.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-autocomplete-user-field';

const meta = {
  title: 'Fields about the user have a valid autocomplete value',
  description:
    'Checks the autocomplete value of each field that may concern the user: fails a malformed value naming a user field, and asks about personal-data fields without a valid one.',
  i18n: {
    titleKey: 'autocompleteUserField_title',
    descriptionKey: 'autocompleteUserField_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const FIELD_NAMES = new Set([
    'name',
    'honorific-prefix',
    'given-name',
    'additional-name',
    'family-name',
    'honorific-suffix',
    'nickname',
    'username',
    'new-password',
    'current-password',
    'one-time-code',
    'organization-title',
    'organization',
    'street-address',
    'address-line1',
    'address-line2',
    'address-line3',
    'address-level4',
    'address-level3',
    'address-level2',
    'address-level1',
    'country',
    'country-name',
    'postal-code',
    'cc-name',
    'cc-given-name',
    'cc-additional-name',
    'cc-family-name',
    'cc-number',
    'cc-exp',
    'cc-exp-month',
    'cc-exp-year',
    'cc-csc',
    'cc-type',
    'transaction-currency',
    'transaction-amount',
    'language',
    'bday',
    'bday-day',
    'bday-month',
    'bday-year',
    'sex',
    'tel',
    'tel-country-code',
    'tel-national',
    'tel-area-code',
    'tel-local',
    'tel-local-prefix',
    'tel-local-suffix',
    'tel-extension',
    'email',
    'impp',
    'url',
    'photo'
  ]);
  const CONTACT_MODALITY = new Set(['home', 'work', 'mobile', 'fax', 'pager']);
  const FIXED_VALUE_TYPES = new Set([
    'hidden',
    'button',
    'checkbox',
    'file',
    'image',
    'radio',
    'reset',
    'submit',
    'search',
    'range',
    'color'
  ]);
  const PERSONAL_TYPES = new Set(['email', 'tel', 'password']);
  // Words that name personal data, in the shipped locales.
  const PERSONAL_WORDS =
    /\b(nom|pr[ée]nom|civilit[ée]|courriel|e-?mail|m[ée]l|t[ée]l[ée]phone|t[ée]l|portable|mobile|adresse|code postal|cp|ville|commune|pays|date de naissance|naissance|soci[ée]t[ée]|entreprise|identifiant|login|mot de passe|name|first ?name|last ?name|surname|given ?name|family ?name|phone|address|zip|postcode|postal code|city|country|birth ?date|date of birth|birthday|username|password|company|organi[sz]ation|vorname|nachname|stra(ss|ß)e|postleitzahl|plz|ort|telefon|geburtsdatum|benutzername|passwort|nombre|apellidos?|correo|tel[ée]fono|direcci[óo]n|c[óo]digo postal|ciudad|fecha de nacimiento|usuario|contrase[ñn]a)\b|氏名|名前|メール|電話|住所|郵便番号|生年月日|パスワード/i;
  const NAME_ATTR_WORDS =
    /(^|[_\-.[\]])(e?mail|courriel|tel|phone|telephone|mobile|portable|nom|prenom|firstname|lastname|first_?name|last_?name|surname|fname|lname|name|adresse|address|street|zip|zipcode|postcode|postal_?code|cp|city|ville|country|pays|birth|birthday|dob|naissance|login|username|user|identifiant|password|passwd|pwd|company|societe|organisation|organization)($|[_\-.[\]])/i;

  const ASCII_WS = /[\t\n\f\r ]+/;
  const trim = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const tokensOf = (raw) =>
    String(raw == null ? '' : raw)
      .replace(/^[\t\n\f\r ]+|[\t\n\f\r ]+$/g, '')
      .toLowerCase()
      .split(ASCII_WS)
      .filter(Boolean);

  // A well-formed autofill detail token list (autocomplete-valid's test).
  function isValid(tokens) {
    if (!tokens.length) return false;
    let i = 0;
    if (tokens[i] && tokens[i].startsWith('section-')) i += 1;
    if (tokens[i] === 'shipping' || tokens[i] === 'billing') i += 1;
    if (CONTACT_MODALITY.has(tokens[i])) {
      const next = tokens[i + 1] || '';
      if (!(next === 'email' || next === 'impp' || next === 'tel' || next.startsWith('tel-'))) {
        return false;
      }
      i += 1;
    }
    let end = tokens.length;
    if (tokens[end - 1] === 'webauthn') end -= 1;
    const remaining = tokens.slice(i, end);
    return remaining.length === 1 && FIELD_NAMES.has(remaining[0]);
  }

  function disabled(el) {
    if (dom.hasAttribute(el, 'disabled')) return true;
    try {
      if (dom.matches(el, ':disabled')) return true;
    } catch {}
    return trim(dom.getAttribute(el, 'aria-disabled')).toLowerCase() === 'true';
  }

  // In a search form: role="search", or a form whose role is search.
  function inSearch(el) {
    for (let a = dom.parentElement(el); a; a = dom.parentElement(a)) {
      if (helpers.aria.getExplicitRole(a) === 'search') return true;
      if (String(dom.localName(a) || '').toLowerCase() === 'search') return true;
    }
    return false;
  }

  function nameOf(el) {
    try {
      const info = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
      return trim(info && info.value);
    } catch {
      return '';
    }
  }

  function looksPersonal(el, type) {
    if (PERSONAL_TYPES.has(type)) return true;
    const words = [nameOf(el), dom.getAttribute(el, 'placeholder')].map(trim).join(' ');
    if (PERSONAL_WORDS.test(words)) return true;
    return ['name', 'id'].some((a) => NAME_ATTR_WORDS.test(trim(dom.getAttribute(el, a))));
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('input, select, textarea')
    : helpers.queryAll('input, select, textarea');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const tag = String(dom.localName(el) || dom.tagName(el)).toLowerCase();
    const type = tag === 'input' ? trim(dom.getAttribute(el, 'type')).toLowerCase() || 'text' : tag;
    if (FIXED_VALUE_TYPES.has(type)) continue;
    if (disabled(el) || inSearch(el)) continue;

    const raw = dom.getAttribute(el, 'autocomplete');
    const tokens = tokensOf(raw);
    const value = trim(raw);
    const valid = isValid(tokens);
    const namesField = tokens.some((t) => FIELD_NAMES.has(t));
    const personal = looksPersonal(el, type);
    if (!valid && !namesField && !personal) continue;
    applicableCount += 1;
    if (valid) continue;

    if (namesField) {
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This field's autocomplete value "${value}" names a field about the user but is not well formed, so the browser cannot use it.`,
          hint: 'Write the value as the list gives it: an optional section-*, shipping or billing, home, work or mobile before a contact field only, then one field name, such as "shipping postal-code" or "work email".',
          i18n: {
            summaryKey: 'autocompleteUserField_summary_fail',
            hintKey: 'autocompleteUserField_hint_fail',
            params: { value }
          },
          data: { details: { reasonCode: 'malformedUserField', value }, visibilityFilter: VF }
        })
      );
      continue;
    }

    const reasonCode = !value
      ? 'noAutocomplete'
      : tokens.length === 1 && (tokens[0] === 'on' || tokens[0] === 'off')
        ? 'onOff'
        : 'noFieldName';
    const summaries = {
      noAutocomplete: 'This field looks like personal data and has no autocomplete attribute.',
      onOff: `This field looks like personal data and has autocomplete="${value}", which is not in RGAA's list of values.`,
      noFieldName: `This field looks like personal data and its autocomplete value "${value}" names no field of RGAA's list.`
    };
    cantTells.push(
      helpers.reportOccurrence(el, {
        summary: summaries[reasonCode],
        hint: 'If the field asks for information about the user, give it the autocomplete value of the list that matches it, such as "email", "tel" or "family-name".',
        i18n: {
          summaryKey: `autocompleteUserField_summary_cantTell_${reasonCode}`,
          hintKey: 'autocompleteUserField_hint_cantTell',
          params: { value }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the field asks for information about the user.',
          evidence: { reasonCode, value }
        },
        data: { details: { reasonCode, value }, visibilityFilter: VF }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'moderate');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
