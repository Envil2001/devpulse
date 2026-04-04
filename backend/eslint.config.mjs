import { nestjsConfig } from '@devpulse/eslint-config';

export default nestjsConfig({
  ignores: ['eslint.config.mjs'],
  tsconfigRootDir: import.meta.dirname,
});
