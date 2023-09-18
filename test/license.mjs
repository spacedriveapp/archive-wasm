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

import {
  extract,
  extractAll,
  disableWarning,
  FileReadError,
  PassphraseError,
  ArchiveError,
} from '../src/archive.mjs'

disableWarning()

const licenseFile = fs.readFileSync(new URL('../LICENSE.md', import.meta.url))
const licenseFileStat = fs.statSync(new URL('../LICENSE.md', import.meta.url), { bigint: true })
const preambleFile = fs.readFileSync(new URL('../PREAMBLE', import.meta.url))
const preambleFileStat = fs.statSync(new URL('../PREAMBLE', import.meta.url), { bigint: true })

const licenseCheck = (t, archivePath, passphrase, mode) => {
  const d = new TextDecoder()
  const archiveFile = fs.readFileSync(new URL(archivePath, import.meta.url))

  let entry
  let entries = extract(archiveFile, passphrase)
  if (mode) entries = Array.from(entries)

  entry = mode ? entries[0] : entries.next().value
  t.is(entry.path, 'LICENSE.md')
  t.is(entry.size, licenseFileStat.size)
  t.is(entry.mode, Number(licenseFileStat.mode))
  t.is(d.decode(entry.data), d.decode(licenseFile))

  entry = mode ? entries[1] : entries.next().value
  t.is(entry.path, 'PREAMBLE')
  t.is(entry.size, preambleFileStat.size)
  t.is(entry.mode, Number(preambleFileStat.mode))
  t.is(d.decode(entry.data), d.decode(preambleFile))
}

for (let archive of [
  'license.7z',
  'license.rar',
  'license.tgz',
  'license.tlz',
  'license.tzo',
  'license.zip',
  'license.tbz2',
  'license.tar.zst',
  'license.tar.lz4',
  ['license.encrypted.zip', '12345678'],
]) {
  let passphrase
  if (Array.isArray(archive)) [archive, passphrase] = archive
  test(`Test ${archive} with out of loop access`, async t =>
    licenseCheck(t, archive, passphrase, true))
  test(`Test ${archive} with in loop access`, async t =>
    licenseCheck(t, archive, passphrase, false))
}

test('Test 7z encrypted are not supported error', t => {
  const archiveFile = fs.readFileSync(new URL('license.encrypted.7z', import.meta.url))
  t.throws(() => extractAll(archiveFile, '12345678'), {
    instanceOf: FileReadError,
  })
})

test('Test rar encrypted are not supported error', t => {
  const archiveFile = fs.readFileSync(new URL('license.ecrypted.rar', import.meta.url))
  t.throws(() => extractAll(archiveFile, '12345678'), {
    instanceOf: FileReadError,
  })
})

test('Test rar headers encrypted are not supported error', t => {
  const archiveFile = fs.readFileSync(new URL('license.hecrypted.rar', import.meta.url))
  t.throws(() => extractAll(archiveFile, '12345678'), {
    instanceOf: ArchiveError,
  })
})

test('Test open encrypted zip without passphrase error', t => {
  const archiveFile = fs.readFileSync(new URL('license.encrypted.zip', import.meta.url))
  t.throws(() => extractAll(archiveFile), {
    instanceOf: PassphraseError,
  })
})

test('Test accessing entries in-loop and outside should work', t => {
  const archiveFile = fs.readFileSync(new URL('license.7z', import.meta.url))
  const inLoop = extractAll(archiveFile)
  const outsideLoop = Array.from(extract(archiveFile))

  for (let i = 0; i < inLoop.length; ++i) {
    t.is(inLoop[i].path, outsideLoop[i].path)
    t.is(inLoop[i].size, outsideLoop[i].size)
    t.is(inLoop[i].mode, outsideLoop[i].mode)
    t.deepEqual(inLoop[i].data, outsideLoop[i].data)
  }
})
