module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@next/next/recommended',
    'plugin:tailwind-v4/recommended',
  ],
  env: {
    browser: true,
  },
  plugins: ['tailwind-v4'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',

    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    'react/self-closing-comp': ['error', { component: true, html: true }],
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/function-component-definition': 'off',
    'react/jsx-sort-props': [
      'warn',
      {
        callbacksLast: true,
        shorthandFirst: true,
        ignoreCase: true,
        noSortAlphabetically: false,
        reservedFirst: true,
      },
    ],

    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'error',

    'tailwind-v4/no-undefined-classes': ['error', { allowArbitraryValues: true }],
  },
};
