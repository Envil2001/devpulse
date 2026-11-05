import { sharedConfig } from '@devpulse/eslint-config';

export default sharedConfig({
  ignores: ['dist/**', 'eslint.config.mjs'],
  tsconfigRootDir: import.meta.dirname,
});
