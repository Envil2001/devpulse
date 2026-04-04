import globals from 'globals';
import tseslint from 'typescript-eslint';

import baseConfig from './base.js';

const VSCODE_GLOBALS = {
  acquireVsCodeApi: 'readonly',
  vscode: 'readonly',
};

/**
 * Config for VS Code extensions — Node globals, VS Code API globals, relaxed console.
 *
 * @param {Object}  options
 * @param {string[]} [options.ignores]
 * @param {string}  [options.tsconfigRootDir]
 * @param {Record<string, unknown>} [options.rules]
 */
export default function extensionConfig(options = {}) {
  const base = baseConfig({
    ignores: options.ignores,
    tsconfigRootDir: options.tsconfigRootDir,
    globals: { ...globals.node, ...VSCODE_GLOBALS },
  });

  return tseslint.config(
    ...base,
    {
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        'unicorn/no-process-exit': 'off',
        'unicorn/prefer-top-level-await': 'off',

        ...options.rules,
      },
    },
  );
}
