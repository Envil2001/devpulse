import tseslint from 'typescript-eslint';

import baseConfig from './base.js';

/**
 * Strict config for shared utility packages — no framework, no console, maximum TS rigour.
 *
 * @param {Object}  options
 * @param {string[]} [options.ignores]
 * @param {string}  [options.tsconfigRootDir]
 * @param {Record<string, unknown>} [options.rules]
 */
export default function sharedConfig(options = {}) {
  const base = baseConfig({
    ignores: options.ignores,
    tsconfigRootDir: options.tsconfigRootDir,
  });

  return tseslint.config(...base, {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',

      ...options.rules,
    },
  });
}
