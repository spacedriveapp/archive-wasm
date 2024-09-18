/*!
 * archive-wasm - LibArchive compiled to WASM with a idiomatic JS API
 * Copyright (C) 2023 Spacedrive Technology Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import babelParser from '@babel/eslint-parser'
import babel from '@babel/eslint-plugin'
import jsdoc from 'eslint-plugin-jsdoc'
import licenseHeader from 'eslint-plugin-license-header'
import localRules from 'eslint-plugin-local-rules'
import prettier from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import neostandard, { plugins, resolveIgnoresFromGitignore } from 'neostandard'

/** @type { import('eslint').Linter.Config[] } */
export default [
  ...neostandard({
    ts: true,
    noStyle: true,
    ignores: [...resolveIgnoresFromGitignore(), 'src/wasm/libarchive.mjs'],
  }),
  {
    plugins: { localRules, licenseHeader },
    rules: {
      'licenseHeader/header': ['error', 'PREAMBLE'],
    },
  },
  plugins.n.configs['flat/recommended-module'],
  {
    files: ['**/*.js', '**/*.mjs'],
    plugins: { babel },
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
      },
    },
  },
  {
    ...plugins.n.configs['flat/recommended-script'],
    files: ['**/*.cjs'],
  },
  plugins.promise.configs['flat/recommended'],
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...jsdoc.configs['flat/recommended-typescript-flavor'],
    rules: {
      ...jsdoc.configs['flat/recommended-typescript-flavor'].rules,
      'jsdoc/require-returns-check': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
    },
  },
  ...[
    ...plugins['typescript-eslint'].configs.strictTypeChecked,
    ...plugins['typescript-eslint'].configs.stylisticTypeChecked,
  ].map(conf => ({
    ...conf,
    files: ['**/*.ts', '**/*.d.ts', '**/*.d.mts', '**/*.d.cts'],
    languageOptions: {
      ...(conf.languageOptions ?? {}),
      parserOptions: {
        ...(conf.parserOptions ?? {}),
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),
  {
    files: ['**/*.ts', '**/*.d.ts', '**/*.d.mts', '**/*.d.cts'],
    rules: {
      'n/no-unpublished-import': [
        'error',
        {
          ignoreTypeImport: true,
        },
      ],
      '@typescript-eslint/no-extra-semi': 'off',
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': [
        'error',
        {
          fixToUnknown: true,
        },
      ],
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        {
          ignoreTypeReferences: true,
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
      ],
    },
  },
  {
    files: ['*.d.ts', '**/*.d.mts'],
    rules: {
      'localRules/disallow-jsdoc-typedef': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['src/wasm/libarchive.mjs', 'src/wasm/libarchive.d.mts'],
    rules: {
      'licenseHeader/header': 'off',
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'export',
        },
      ],
    },
  },
  {
    files: ['src/**/*.mjs'],
    ignores: ['src/fs.mjs', 'src/wasm/libarchive.mjs'],
    languageOptions: {
      globals: {
        ...globals['shared-node-browser'],
        ...globals.es2022,
      },
    },
  },
  {
    files: ['**/*'],
    rules: {
      'no-void': ['error', { allowAsStatement: true }],
      'n/no-missing-import': 'off',
    },
  },
  prettier,
]
