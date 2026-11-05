import tseslint from 'typescript-eslint';

import baseConfig from './base.js';

export default baseConfig({
  ignores: ['eslint.config.mjs'],
  tsconfigRootDir: import.meta.dirname,
  extraConfigs: [
    {
      files: ['**/*.js'],
      ...tseslint.configs.disableTypeChecked,
      rules: {
        ...tseslint.configs.disableTypeChecked.rules,
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'unicorn/prefer-string-raw': 'off',
      },
    },
  ],
});
