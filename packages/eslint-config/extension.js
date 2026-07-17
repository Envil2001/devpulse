module.exports = {
  extends: './base.js',
  env: {
    node: true,
  },
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    'no-console': 'off',
  },
};
