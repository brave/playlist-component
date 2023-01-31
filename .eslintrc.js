module.exports = {
  'env': {
    'browser': true,
    'es6': true,
  },
  'extends': 'standard-with-typescript',
  'ignorePatterns': [
    '.eslintrc.js'
  ],
  'plugins': [
    'licenses'
    ],
  'overrides': [
  ],
  'parserOptions': {
    'project': './tsconfig-lint.json'
  },
  'rules': {
    'licenses/header': [
      2,
      {
        'tryUseCreatedYear': true,
        'comment': {
          'allow': 'both',
          'prefer': 'line'
        },
        'header': [
          'Copyright (c) {YEAR} The Brave Authors. All rights reserved.',
          'This Source Code Form is subject to the terms of the Mozilla Public',
          'License, v. 2.0. If a copy of the MPL was not distributed with this file,',
          'You can obtain one at https://mozilla.org/MPL/2.0/.'
        ],
      }
    ],
    'quote-props': [
      'error',
      'consistent'
    ],
    '@typescript-eslint/indent': 0,
    '@typescript-eslint/no-useless-constructor': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    'import/first': 0,
    '@typescript-eslint/no-var-requires': 0,
    'consistent-type-definitions': 0,
    '@typescript-eslint/strict-boolean-expressions': 0,
    '@typescript-eslint/restrict-template-expressions': 0,
    '@typescript-eslint/restrict-plus-operands': 0,
    '@typescript-eslint/prefer-optional-chain': 0,
    '@typescript-eslint/prefer-nullish-coalescing': 0,
    '@typescript-eslint/no-misused-promises': 0,
    'no-mixed-operators': 0,
    'no-prototype-builtins': 0,
    '@typescript-eslint/promise-function-async': 0,
    'no-case-declarations': 0,
    '@typescript-eslint/no-dynamic-delete': 0,
    '@typescript-eslint/no-empty-interface': 0,
    'no-useless-escape': 0,
    'no-return-assign': 0,
    'no-async-promise-executor': 0,
    'no-fallthrough': 0,
    'array-callback-return': 0,
    'prefer-promise-reject-errors': 0,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/no-base-to-string': 0,
    'prefer-regex-literals': 0,
    '@typescript-eslint/no-implied-eval': 0,
    '@typescript-eslint/no-namespace': 0,
    '@typescript-eslint/require-array-sort-compare': 0,
    'no-loss-of-precision': 0,
    '@typescript-eslint/no-this-alias': 0,
    '@typescript-eslint/no-redeclare': 0,
    'no-unsafe-negation': 0,
    'promise/param-names': 0,
    'node/no-callback-literal': 0,
    '@typescript-eslint/consistent-type-definitions': 0,
    'multiline-ternary': 0,
    '@typescript-eslint/prefer-readonly': 0,
  }
}
