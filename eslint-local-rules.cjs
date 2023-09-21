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

'use strict'

module.exports = {
  'disallow-jsdoc-typedef': {
    meta: {
      type: 'problem',
      docs: {
        description: '@typedef comments are not allowed',
        recommended: false,
      },
      fixable: 'code',
    },
    create(context) {
      const sourceCode = context.getSourceCode()
      return {
        Program() {
          for (const comment of sourceCode.getAllComments()) {
            if (comment && comment.value.includes('@typedef')) {
              context.report({
                fix(fixer) {
                  return fixer.remove(comment)
                },
                loc: comment.loc,
                message: '@typedef comments are not allowed',
                node: null,
              })
            }
          }
        },
      }
    },
  },
}
