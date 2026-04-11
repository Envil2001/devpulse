import nPlugin from 'eslint-plugin-n';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import baseConfig from './base.js';

/**
 * NestJS / Node.js config — extends base + eslint-plugin-n.
 *
 * @param {Object}  options
 * @param {string[]} [options.ignores]
 * @param {string}  [options.tsconfigRootDir]
 * @param {'commonjs'|'module'} [options.sourceType]
 * @param {Record<string, unknown>} [options.rules]
 */
export default function nestjsConfig(options = {}) {
  const base = baseConfig({
    ignores: options.ignores,
    tsconfigRootDir: options.tsconfigRootDir,
    globals: { ...globals.node, ...globals.jest },
  });

  const nodeConfig =
    options.sourceType === 'module'
      ? nPlugin.configs['flat/recommended-module']
      : nPlugin.configs['flat/recommended-script'];

  return tseslint.config(...base, nodeConfig, {
    languageOptions: {
      sourceType: options.sourceType ?? 'commonjs',
    },
    rules: {
      // Node.js async safety
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],

      // NestJS DI/decorator patterns often trigger these —
      // library typings (ThrottlerModule, PassportModule, etc.) are
      // frequently unresolved at the type-check level, so errors here
      // are almost always false-positives from third-party code.
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // n plugin rules that conflict with TS/NestJS tooling
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',

      // NestJS uses top-level bootstrap(), not top-level await
      'unicorn/prefer-top-level-await': 'off',

      // NestJS @Module / @Controller / @Injectable classes look "empty" to ESLint
      '@typescript-eslint/no-extraneous-class': 'off',

      ...options.rules,
    },
  });
}
