import { sharedConfig } from '@devpulse/eslint-config';

export default sharedConfig({
  ignores: ['eslint.config.mjs'],
  tsconfigRootDir: import.meta.dirname,
});
