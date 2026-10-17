'use strict';

/**
 * Runs every *.test.js under tests/ with node's test runner, in one process
 * per file as `node --test` does, and exits with its code.
 */

const { readdirSync, statSync } = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function collect(dir, out) {
  for (const entry of readdirSync(dir).sort()) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (entry.endsWith('.test.js')) out.push(full);
  }
  return out;
}

const files = collect(path.join(__dirname, '..', 'tests'), []);
const { status } = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(status === null ? 1 : status);
