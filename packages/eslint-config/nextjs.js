import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

/**
 * Next.js / React config — framework rules plus fixable source hygiene.
 * Type-aware backend rules intentionally do not apply to React components.
 *
 * @param {Object} options
 * @param {string[]} [options.ignores]
 * @param {string} [options.tsconfigRootDir]
 * @param {Record<string, unknown>} [options.rules]
 */
export default function nextjsConfig(options = {}) {
  return defineConfig(
    ...nextVitals,
    ...nextTs,
    eslintConfigPrettier,
    {
      files: ['**/*.{ts,tsx,mts,cts}'],
      linterOptions: {
        reportUnusedDisableDirectives: 'error',
      },
      plugins: {
        'simple-import-sort': simpleImportSort,
        'unused-imports': unusedImports,
      },
      languageOptions: {
        parserOptions: {
          tsconfigRootDir: options.tsconfigRootDir,
        },
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'warn',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
          'warn',
          {
            vars: 'all',
            varsIgnorePattern: '^_',
            args: 'after-used',
            argsIgnorePattern: '^_',
          },
        ],
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        ...options.rules,
      },
    },
    globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', ...(options.ignores ?? [])]),
  );
}
