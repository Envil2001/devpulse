import { nextjsConfig } from '@devpulse/eslint-config';

export default nextjsConfig({
  ignores: ['eslint.config.mjs'],
  tsconfigRootDir: import.meta.dirname,
});
