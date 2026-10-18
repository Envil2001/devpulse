import { extensionConfig } from '@devpulse/eslint-config';

export default extensionConfig({
  ignores: ['out/**', 'node_modules/**', 'esbuild.mjs'],
  tsconfigRootDir: import.meta.dirname,
});
