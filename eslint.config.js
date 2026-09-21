// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/** Climbing more than one directory must go through a path alias. */
const deepRelativeImports = {
  group: ['../../*'],
  message: 'Use a path alias (@core, @shared, @features) instead of a deep relative import.',
};

/** Builds a rule that forbids the given aliases on top of the shared restrictions. */
const forbidAliases = (aliases, layer) => [
  'error',
  {
    patterns: [
      deepRelativeImports,
      ...aliases.map((alias) => ({
        group: [alias],
        message: `${layer} code must not depend on ${alias}.`,
      })),
    ],
  },
];

module.exports = defineConfig([
  globalIgnores(['dist/', 'coverage/', '.angular/']),
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'sv', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'sv', style: 'kebab-case' },
      ],
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/computed-must-return': 'error',
      '@angular-eslint/reactive-context-must-read-signal': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@angular-eslint/no-forward-ref': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'no-restricted-imports': ['error', { patterns: [deepRelativeImports] }],
    },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': forbidAliases(['@core/*', '@features/*'], 'Shared'),
    },
  },
  {
    files: ['src/app/core/**/*.ts'],
    rules: {
      'no-restricted-imports': forbidAliases(['@features/*'], 'Core'),
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/button-has-type': 'error',
      '@angular-eslint/template/no-empty-control-flow': 'error',
      '@angular-eslint/template/no-inline-styles': 'error',
      '@angular-eslint/template/prefer-at-else': 'error',
      '@angular-eslint/template/prefer-at-empty': 'error',
      '@angular-eslint/template/prefer-built-in-pipes': 'error',
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/prefer-contextual-for-variables': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-style-binding': 'error',
    },
  },
]);
