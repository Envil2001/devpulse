import { extensionConfig } from '@devpulse/eslint-config';

export default extensionConfig({
  ignores: ['eslint.config.mjs', 'out/**'],
  tsconfigRootDir: import.meta.dirname,
});
