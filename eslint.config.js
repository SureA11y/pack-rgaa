'use strict';

// The lint rules core's own rules are held to: a rule runs on pages it
// doesn't control, so it reads the DOM through ctx.helpers.dom, resolves a
// role with helpers.aria.getExplicitRole and looks an ID up in the referring
// element's own tree.
const safeDom = require('@surea11y/core/eslint-plugin');

module.exports = [
  { languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' } },
  { files: ['rules/**'], ...safeDom.configs.recommended },
  {
    // Old libraries (Prototype, MooTools) replace Array.from with one that
    // drops Sets, Map iterators and the mapping function, and core stops a
    // scan of such a page when a rule that runs uses it. Spread goes through
    // the iterators, which they leave alone.
    files: ['rules/**'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Array',
          property: 'from',
          message: 'A page can replace Array.from: use spread ([...x], [...x].map(f)).'
        }
      ]
    }
  },
  { ignores: ['node_modules/**', 'bench/**'] }
];
