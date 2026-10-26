/** @type {import('jest').Config} */
module.exports = {
  rootDir: 'src',
  testRegex: '\\.spec\\.ts$',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/setup.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.spec.json' }],
  },
  transformIgnorePatterns: [],
};
