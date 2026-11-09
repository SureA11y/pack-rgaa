'use strict';

/**
 * What a standard gives, as hashes: each rollup (composites()), each rule's
 * entries and each WCAG rollup's entries (mappingsFor), and its validation of
 * every rule, for the rules of the installed core and the pack's own. Recorded
 * per core version (tests/fixtures/standard/core-<version>.json) from the
 * pack's own mapping functions, before they gave way to core's, so the test
 * that compares holds the pack to what it gave (tests/standard.test.js).
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const core = require('@surea11y/core');

const CORE_VERSION = require('@surea11y/core/package.json').version;
const FILE = path.join(__dirname, '..', 'fixtures', 'standard', `core-${CORE_VERSION}.json`);

// JSON with each object's keys in order, so the hash says what a value
// holds, not the order its fields were written in.
const canonical = (value) =>
  JSON.stringify(value, (key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]])
        )
      : v
  );
const hash = (value) =>
  crypto.createHash('sha256').update(canonical(value)).digest('hex').slice(0, 16);

// The pack's own rules, as the standard sees them.
function packRules() {
  const out = [];
  for (const type of ['automatic', 'manual']) {
    const dir = path.join(__dirname, '..', '..', 'rules', type);
    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith('.js')) continue;
      const rule = require(path.join(dir, file));
      out.push({ ruleId: rule.id, wcagSc: (rule.meta && rule.meta.wcagSc) || [] });
    }
  }
  return out;
}

// The rules of the installed core, and their hash: the recorded facts are
// compared only with the core whose rules they were recorded with.
function coreRules() {
  return core.getChecksCatalog().map((c) => ({ ruleId: c.ruleId, wcagSc: c.wcagSc || [] }));
}
const catalogHash = () => hash([coreRules(), core.getRulesCatalog().map((c) => c.id)]);

/** The facts of a standard: { composites, mappings, wcagRollups, validate }. */
function standardFacts({ composites, mappingsFor, validate }) {
  const rules = coreRules().concat(packRules());
  const rollups = composites();
  return {
    core: CORE_VERSION,
    catalog: catalogHash(),
    rollups: rollups.map((c) => [c.id, hash(c)]),
    mappings: Object.fromEntries(
      rules.map((r) => [r.ruleId, hash(mappingsFor({ id: r.ruleId, wcagSc: r.wcagSc }))])
    ),
    wcagRollups: Object.fromEntries(
      core
        .getRulesCatalog()
        .map((c) => [
          c.id,
          hash(mappingsFor({ id: c.id, wcagSc: c.meta.wcagSc, checksIds: c.checksIds }))
        ])
    ),
    validate: validate(rules)
  };
}

module.exports = { standardFacts, catalogHash, FILE, CORE_VERSION };
