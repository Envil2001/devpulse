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
  },
  overrides: [
    {
      files: ['*.request.dto.ts'],
      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'class',
            format: ['PascalCase'],
            custom: { regex: 'RequestDto$', match: true },
          },
        ],
      },
    },
    {
      files: ['*.response.dto.ts'],
      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'class',
            format: ['PascalCase'],
            custom: { regex: 'ResponseDto$', match: true },
          },
        ],
      },
    },
    {
      files: ['*.dto.ts'],
      excludedFiles: ['*.request.dto.ts', '*.response.dto.ts'],
      rules: {
        '@typescript-eslint/naming-convention': [
          'warn',
          {
            selector: 'class',
            format: ['PascalCase'],
            custom: { regex: '(Request|Response|Internal)?Dto$', match: true },
          },
        ],
      },
    },
  ],
};
