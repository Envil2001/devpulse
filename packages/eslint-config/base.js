import eslint from '@eslint/js';
import * as importPlugin from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

/**
 * Base ESLint config — TypeScript strict + import ordering + code quality.
 * All package-specific configs extend this.
 *
 * @param {Object}  options
 * @param {string[]} [options.ignores]
 * @param {string}  [options.tsconfigRootDir]
 * @param {Record<string, string>} [options.globals]
 * @param {Record<string, unknown>} [options.rules]      - extra rules merged last
 * @param {unknown[]} [options.extraConfigs]             - flat config objects appended after base
 */
export default function baseConfig(options = {}) {
  return tseslint.config(
    { ignores: options.ignores ?? [] },

    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,

    sonarjs.configs.recommended,
    unicorn.configs['flat/recommended'],

    eslintPluginPrettierRecommended,

    {
      plugins: {
        import: importPlugin,
        'simple-import-sort': simpleImportSort,
        'unused-imports': unusedImports,
      },
      languageOptions: {
        globals: options.globals ?? {},
        parserOptions: {
          projectService: true,
          tsconfigRootDir: options.tsconfigRootDir,
        },
      },
      settings: {
        'import/resolver': {
          typescript: true,
          node: true,
        },
      },
      rules: {
        // ── TypeScript ────────────────────────────────────────────────────────
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/prefer-readonly': 'error',
        '@typescript-eslint/array-type': ['error', { default: 'generic' }],
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          { allowExpressions: true, allowTypedFunctionExpressions: true },
        ],
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/no-unused-vars': 'off', // handled by unused-imports
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',

        // ── Unused imports (auto-removed on --fix / save) ────────────────────
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

        // ── Import sorting & grouping ─────────────────────────────────────────
        'simple-import-sort/imports': [
          'error',
          {
            groups: [
              ['^node:'],                                       // 1. Node built-ins
              ['^@?\\w'],                                       // 2. External packages
              ['^@devpulse/'],                                  // 3. Internal monorepo
              ['^\\.\\.(?!/?$)', '^\\.\\./?$'],                 // 4. Parent relative
              ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'], // 5. Local relative
            ],
          },
        ],
        'simple-import-sort/exports': 'error',

        // ── Import quality ────────────────────────────────────────────────────
        'import/no-cycle': 'error',
        'import/no-duplicates': 'error',

        // ── Code quality ──────────────────────────────────────────────────────
        'no-console': 'warn',
        'prefer-const': 'error',
        eqeqeq: ['error', 'always'],
        'no-var': 'error',
        'consistent-return': 'error',
        complexity: ['warn', { max: 10 }],

        // ── Unicorn overrides (disable overly strict rules) ───────────────────
        'unicorn/prevent-abbreviations': 'off',
        'unicorn/no-null': 'off',
        'unicorn/filename-case': 'off',
        'unicorn/no-array-for-each': 'off',
        'unicorn/prefer-module': 'off',

        // ── Prettier ──────────────────────────────────────────────────────────
        'prettier/prettier': [
          'error',
          {
            singleQuote: true,
            semi: true,
            trailingComma: 'all',
            printWidth: 100,
            tabWidth: 2,
            endOfLine: 'auto',
          },
        ],

        ...options.rules,
      },
    },

    ...(options.extraConfigs ?? []),
  );
}
