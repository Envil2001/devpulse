import nextPlugin from '@next/eslint-plugin-next';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tailwindPlugin from 'eslint-plugin-tailwindcss';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import baseConfig from './base.js';

/**
 * Next.js / React config — extends base + React hooks + Tailwind CSS.
 *
 * @param {Object}  options
 * @param {string[]} [options.ignores]
 * @param {string}  [options.tsconfigRootDir]
 * @param {Record<string, unknown>} [options.rules]
 */
export default function nextjsConfig(options = {}) {
  const base = baseConfig({
    ignores: options.ignores,
    tsconfigRootDir: options.tsconfigRootDir,
    globals: { ...globals.browser, ...globals.node },
  });

  return tseslint.config(
    ...base,

    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],

    {
      plugins: {
        'react-hooks': reactHooks,
        '@next/next': nextPlugin,
        tailwindcss: tailwindPlugin,
      },
      settings: {
        react: { version: 'detect' },
        tailwindcss: { callees: ['cn', 'clsx', 'cva'] },
      },
      rules: {
        // ── React hooks ───────────────────────────────────────────────────────
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',

        // ── JSX ───────────────────────────────────────────────────────────────
        'react/prop-types': 'off', // TypeScript handles this
        'react/jsx-key': 'error',
        'react/jsx-no-useless-fragment': 'warn',
        'react/display-name': 'warn',

        // ── Next.js ───────────────────────────────────────────────────────────
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs['core-web-vitals'].rules,

        // ── Tailwind ──────────────────────────────────────────────────────────
        ...tailwindPlugin.configs.recommended.rules,
        'tailwindcss/classnames-order': 'warn',
        'tailwindcss/no-custom-classname': 'warn',
        'tailwindcss/no-contradicting-classname': 'error',

        // ── Unicorn overrides for React patterns ──────────────────────────────
        'unicorn/no-array-reduce': 'off',

        ...options.rules,
      },
    },
  );
}
