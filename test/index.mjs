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

import { createHash } from 'node:crypto'
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
  ExceedSizeLimitError,
} from '../src/archive.mjs'
import { FILETYPE_FLAG } from '../src/wasm/enums.mjs'

disableWarning()

const d = new TextDecoder()
const licenseFile = d.decode(fs.readFileSync(new URL('../LICENSE.md', import.meta.url)))
const licenseFileStat = fs.statSync(new URL('../LICENSE.md', import.meta.url), { bigint: true })
const preambleFile = d.decode(fs.readFileSync(new URL('../PREAMBLE', import.meta.url)))
const preambleFileStat = fs.statSync(new URL('../PREAMBLE', import.meta.url), { bigint: true })

const licenseCheck = (t, archivePath, opts, mode) => {
  const archiveFile = fs.readFileSync(new URL(archivePath, import.meta.url))

  let entries = extract(archiveFile, opts)
  if (mode) entries = Array.from(entries)

  let i = 0
  for (const [path, data, stat] of [
    ['LICENSE.md', licenseFile, licenseFileStat],
    ['PREAMBLE', preambleFile, preambleFileStat],
  ]) {
    const entry = mode ? entries[i] : entries.next().value
    t.false(entry == null)
    t.is(entry.path, path)
    t.is(entry.size, stat.size)
    t.is(entry.perm, ~FILETYPE_FLAG & Number(stat.mode))
    t.is(entry.type, 'FILE')
    t.is(entry.link, null)
    t.is(d.decode(entry.data), data)
    t.true(entry.atime >= 0n)
    t.true(entry.ctime >= 0n)
    t.true(entry.mtime >= 0n)
    t.true(entry.birthtime >= 0n)
    i++
  }
}

for (let archive of [
  'license.7z',
  'license.rar',
  'license.tgz',
  'license.tlz',
  'license.tzo',
  'license.zip',
  'license.iso',
  'license.pax',
  'license.pax.Z',
  'license.tbz2',
  'license.tar.zst',
  'license.tar.lz4',
  ['license.encrypted.zip', '12345678'],
]) {
  let passphrase
  if (Array.isArray(archive)) [archive, passphrase] = archive
  test(`Test ${archive} with out of loop access`, async t =>
    licenseCheck(t, archive, passphrase, true))
  test(`Test ${archive} with out of loop access and recursive`, async t =>
    licenseCheck(t, archive, { passphrase, recursive: true }, true))
  test(`Test ${archive} with in-loop access`, async t =>
    licenseCheck(t, archive, passphrase, false))
  test(`Test ${archive} with in-loop access and recursive`, async t =>
    licenseCheck(t, archive, { passphrase, recursive: true }, false))
}

test('Test recursive zip bomb', t => {
  // from: https://github.com/iamtraction/ZOD
  const archiveFile = fs.readFileSync(new URL('bomb.zip', import.meta.url))
  t.notThrows(() => Array.from(extract(archiveFile, '42')))
  t.notThrows(() => Array.from(extract(archiveFile, { passphrase: '42', recursive: true })))
  t.notThrows(() => extractAll(archiveFile, '42'))
  t.throws(() => extractAll(archiveFile, { passphrase: '42', recursive: true }), {
    instanceOf: ExceedSizeLimitError,
  })
})

test('Test non recursive zip bomb', t => {
  // https://www.bamsoftware.com/hacks/zipbomb/
  const archiveFile = fs.readFileSync(new URL('bombNonRecursive.zip', import.meta.url))
  t.notThrows(() => Array.from(extract(archiveFile)))
  t.throws(() => extractAll(archiveFile), {
    instanceOf: ExceedSizeLimitError,
  })
})

const GBK_PATHS = [
  'The.Wire.S01E04.Old Cases.720p.HDTV.x264-BATV.简体&英文(据HDTV.720p-BATV修改字体).srt',
  'The.Wire.S01E04.Old Cases.720p.HDTV.x264-BATV.简体&英文(据HDTV.720p-BATV修改字体).ass',
]

test('Test GBK.zip', t => {
  // from: https://sourceforge.net/p/sevenzip/bugs/2198/
  const archiveFile = fs.readFileSync(new URL('GBK.zip', import.meta.url))
  const names = Array.from(extract(archiveFile, { encoding: 'gb18030' }), entry => entry.path)
  t.deepEqual(names, GBK_PATHS)
})

const IELPKTH_MD5 = {
  'CHARSET.DAT': '3e7eb76bb122e29a5b60902d0caad598',
  'TH.INF': 'f4fd1cc76da571d4dbd94bd3d6dd3caa',
  'kbdth1.dll': '2dffc32410bbd169a3fba56fd08cf2e5',
  'kbdth0.dll': '78b2a883a01615946b785877c2a6b51a',
  'CP_874.NLS': '1a7902c07c1bf1f617be4dd12ed4763a',
  'tahomabd.ttf': '4f17b1af2781d384bf955d411a7742e5',
  'advpack.dll': '4d99bd9bb90715be7f2590bfd97b51f9',
  'kbdth1.kbd': '504db413acfe019db89b3c0ac2f58fb2',
  'kbdth0.kbd': 'b83828483411fd8ef7888c5f2224c3db',
  'C_874.NLS': '7a0ee54f89ffe0f038660ba580fb4440',
  'tahoma.ttf': '66e7a2238693879b1ab39a122a074a37',
  'unTH.INF': 'deb2b5d83062730eb768cd5992f28176',
  'langinst.exe': 'e5c8c7250d57cef16cb1581904ed6209',
  'csseqchk.dll': '5db2f9eda2fb505e77b3e634b6202f52',
}

test('Test IELPKTH.CAB', t => {
  // from: https://github.com/iamtraction/ZOD
  const archiveFile = fs.readFileSync(new URL('IELPKTH.CAB', import.meta.url))

  for (const entry of extract(archiveFile)) {
    const md5 = IELPKTH_MD5[entry.path]
    t.assert(typeof md5 === 'string')

    const hashFunc = createHash('md5')
    hashFunc.update(Buffer.from(entry.data))
    t.is(md5, hashFunc.digest('hex'))
  }
})

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

test("Test extract's ignoreDotDir option", t => {
  const archiveFile = fs.readFileSync(new URL('license.iso', import.meta.url))
  let iter = extract(archiveFile, { ignoreDotDir: false })
  let entry = iter.next().value
  t.is(entry.path, '.')
  t.is(entry.type, 'DIR')

  iter = extract(archiveFile, { ignoreDotDir: true })
  entry = iter.next().value
  t.not(entry.path, '.')
})
