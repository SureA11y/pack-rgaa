'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('@surea11y/core/testing');
const { runa11yCoreOnHtml } = require('../../helpers/run.js');

const RULE_ID = 'rgaa-button-name-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="fr"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

function reasons(rule) {
  return rule.occurrences.map((o) => [o.occurrenceOutcome, o.data.details.reasonCode]);
}

test(`${RULE_ID}: a button outside a form with no name fails`, () => {
  for (const body of [
    '<button type="button"></button>',
    '<input type="button">',
    '<button><img src="a.png" alt=""></button>',
    '<span role="button" tabindex="0"></span>'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'nameMissing', body);
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'buttonNamePresentRgaa_summary_fail_nameMissing'
    );
  }
});

test(`${RULE_ID}: an image button named only by the browser is asked about`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<input type="image" src="a.png">'), RUN),
    RULE_ID,
    'cantTell'
  );
  assert.deepEqual(reasons(rule), [['cantTell', 'imageButtonNoAlt']]);
  assert.equal(rule.occurrences[0].uncertainty.code, 'judgement-required');
});

test(`${RULE_ID}: a named button passes`, () => {
  for (const body of [
    '<button>Menu</button>',
    '<button aria-label="Fermer">×</button>',
    '<button><svg role="img"><title>Rechercher</title></svg></button>',
    '<input type="image" src="a.png" alt="Rechercher">',
    '<button title="Imprimer"></button>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'pass');
  }
});

// The buttons in a form, or joined to one, are rgaa-form-button-name-present's
// (11.9.1), so an empty one counts once.
test(`${RULE_ID}: buttons in a form, joined to one, or hidden are not applicable`, () => {
  for (const body of [
    '<form><button></button></form>',
    '<div role="form" aria-label="Filtres"><button></button></div>',
    '<form id="f"></form><button form="f"></button>',
    '<button aria-hidden="true" tabindex="-1"></button>',
    '<p>Rien</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: under the rgaa-4.1.2 profile it names 7.1.1, and is opt-in`, () => {
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['7.1.1']);
  const result = runa11yCoreOnHtml(page('<button></button>'), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  const rule = assertRule(result, RULE_ID, 'fail');
  assert.deepEqual(
    rule.meta.normativeMappings.filter((m) => m.standard === 'RGAA').map((m) => m.requirement),
    ['7.1.1']
  );
  const wcag = runa11yCoreOnHtml(page('<button></button>'));
  assert.ok(!wcag.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: 4,
    maxOccurrences: 4
  });
  assert.deepEqual(
    rule.occurrences.map((o) => [(o.html.match(/id="([^"]+)"/) || [])[1], o.occurrenceOutcome]),
    [
      ['bnp_case_01', 'fail'],
      ['bnp_case_02', 'fail'],
      ['bnp_case_03', 'fail'],
      ['bnp_case_04', 'cantTell']
    ]
  );
});
