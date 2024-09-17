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

export default /** @type {import('prettier').Config} */ ({
  semi: false,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  endOfLine: 'lf',
  printWidth: 100,
  quoteProps: 'consistent',
  singleQuote: true,
  arrowParens: 'avoid',
  importOrder: [
    // Node.js built-in modules
    '<TYPES>^(node:)',
    '<TYPES>',
    '<TYPES>^[.]',
    '<BUILTIN_MODULES>',
    '',
    // Imports not matched by other special words or groups.
    '<THIRD_PARTY_MODULES>',
    '',
    // internal packages
    '^@/',
    '^~/',
    '',
    // relative
    '^[../]',
    '^[.]',
    '^(?!.*[.]css$)[./].*$',
    '.css$',
    '^(?!.*[.]scss$)[./].*$',
    '.scss$',
  ],
  trailingComma: 'es5',
  bracketSameLine: false,
  importOrderParserPlugins: ['importAttributes'],
  importOrderTypeScriptVersion: '5.0.0',
  overrides: [
    {
      files: '*.ts',
      options: {
        importOrderParserPlugins: ['typescript', 'decorators', 'importAttributes'],
      },
    },
    {
      files: ['*.d.ts', '*.d.mts', '*.d.cts'],
      options: {
        importOrderParserPlugins: [
          '["typescript", { "dts": true }]',
          'decorators',
          'importAttributes',
        ],
      },
    },
  ],
})
