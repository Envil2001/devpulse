import { nestjsConfig } from '@devpulse/eslint-config';

export default nestjsConfig({
  ignores: ['eslint.config.mjs'],
  tsconfigRootDir: import.meta.dirname,
  extraConfigs: [
    {
      files: ['src/**/*.dto.ts', 'src/**/dto/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-call': 'off',
      },
    },
  ],
});
