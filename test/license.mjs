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

import * as fs from 'node:fs'

// https://github.com/avajs/ava/pull/3128
// eslint-disable-next-line import/no-unresolved
import test from 'ava'

import { extract, EntryType } from '../dist/archive.mjs'

test('license.tar.gz', async t => {
  const tarFile = fs.readFileSync(new URL('./license.tar.gz', import.meta.url))
  const licenseFile = fs.readFileSync(new URL('../LICENSE.md', import.meta.url))
  const licenseFileStat = fs.statSync(new URL('../LICENSE.md', import.meta.url))
  const preambleFile = fs.readFileSync(new URL('../PREAMBLE', import.meta.url))
  const preambleFileStat = fs.statSync(new URL('../PREAMBLE', import.meta.url))

  const entries = Array.from(extract(tarFile), entry => {
    void entry.data
    return entry
  })

  const d = new TextDecoder()

  t.is(entries[0].path, 'LICENSE.md')
  t.is(entries[0].size, licenseFileStat.size)
  t.is(entries[0].type, EntryType.FILE)
  t.deepEqual(d.decode(entries[0].data), d.decode(licenseFile))
  t.is(entries[1].path, 'PREAMBLE')
  t.is(entries[1].size, preambleFileStat.size)
  t.is(entries[1].type, EntryType.FILE)
  t.deepEqual(d.decode(entries[1].data), d.decode(preambleFile))
})
