# Changelog

## [2.1.0] - 2025-03-19

---

#### Fixed

- Fixed `extract`'s recursive feature, which was broken for some nested archives.

#### Added

- Added `baseDir` option to `extract` to append a base directory to entry paths.
- Added `normalize` option (enabled by default) to `extract` to normalize entry paths.
- Added `stripComponents` option to `extract` to skip leading path components.
- Added hard recursion limit depth of 16 and corresponding error.
- Expanded tests to include new features.

#### Changed

- Renamed `excluded` and `included` options to `exclude` and `include`.
- Moved `include` and `exclude` options and functionality to `extract`.
- Updated Emscripten to 4.0.5.
- Improved documentation.

## [2.0.0] - 2025-03-18

---

#### Added

- Added `.excluded` and `.included` options to `extractTo`.
- Replaced references to old libarchive version.

#### Changed

- Improved typing for input and archive data:
  - Added `ArrayBufferView` as a possible type for the `extract` function and its derivatives.
  - Removed incorrect `SharedArrayBuffer` union for `Entry.data` type.
- Updated documentation.
- Updated libarchive to v3.7.7.
- Updated libarchive dependencies.

## [1.7.1] - 2024-09-18

---

#### Fixed

- Fixed test.

#### Changed

- Updated Emscripten, libarchive, and Mbed-TLS.
- Removed `fix_tz.patch` (fix included in new Emscripten version).
- Updated libarchive headers.

## [1.7.0] - 2024-08-02

---

#### Changed

- Updated build dependencies:
  - New ESLint 9 config.
  - New Prettier config.
  - New Babel config.
  - Improved TypeScript config.
- Fixed test.
- Updated dependencies.
- Updated documentation.
- Improved wasm build script.
- Updated libarchive headers.
- Updated libarchive wasm type definitions.
- Updated to Emscripten 3.1.64.
  - Patched missing `__secs_to_zone`.
  - Improved fix for `tuklib_integer.cmake` usage error in liblzma.
  - Fixed lzma test failure.

#### Added

- Added GH workflow to test the project.
- Added step to install required dependencies for tests in CI.

#### Changed

- Downgraded Emscripten to 3.1.61 due to breaking changes.

## [1.6.1] - 2023-12-20

---

#### Fixed

- Fixed broken LZMA in last version's wasm build.
- Fixed test script hanging on error.

### Added

- Added test for `extractTo` using spacedrive native-deps archive.

## [1.6.0] - 2023-12-20

---

#### Fixed

- Fixed `extractTo` symlink extraction on Linux.

#### Changed

- Removed incorrect file type grouping logic from `extractTo`. Files are now extracted in archive order.
- Renamed `fchmod` to `lchmod`.
- Updated dependencies (both js and native).
- Added some compilation improvements.

## [1.5.3] - 2023-09-29

---

#### Fixed

- Fixed data corruption and crashes from use after free of recursive archive buffer's pointer.

#### Changed

- Restored mtree support.
- Disabled ar, empty, mtree, and cab extraction support for recursive extractions.

## [1.5.2] - 2023-09-28

---

#### Fixed

- Fixed GBK test downloading the wrong file.
- Added symlink test

#### Changed

- Disabled mtree support due to false positives when `recursive` is enabled.

## [1.5.1] - 2023-09-27

---

#### Fixed

- Fixed symlink and hardlink breaking on `extractAll`/`extractTo` due to an incorrect `NullError`.

## [1.5.0] - 2023-09-27

---

#### Added

- Added `recursive` option to `extract` for extracting sub-archives.
- Added `encoding` option to `extract` for decoding entry metadata.
- Added `sizeLimit` option to `extractAll` for zip bomb protection.
- Added logic to guess Entry's metadata encoding.
- Added tests for new features.

#### Changed

- Changed from jsdoc-markdown to typedoc-plugin-markdown.

## [1.4.0] - 2023-09-22

---

#### Fixed

- Fixed `extract`'s `ignoreDotDir` option not matching against `./` paths.
- Fixed `ENOENT` errors for valid files due to missing subdirectories in `extractTo`.

#### Changed

- Rewrote `extractTo`, making extraction synchronous between file types.
- Ensured all subdirectories exist during `extractTo`.
- Added `chmod` option to `extractTo`.

## [1.3.0] - 2023-09-20

---

#### Added

- Added `overwrite` option to `extractTo` and `ignoreDotDir` to `extract`.
- Added tests for pax, iso, and cab.

#### Changed

- Minor changes to test scripts.
- Fixed libarchive type definition to match new export.
- Made changes to wasm build to accommodate changes from new Emscripten version:
  - Reflected removed properties from Emscripten wasm initialization function in type definition.
  - Replaced `module.mjs` with `--extern-pre-js` in wasm build.
  - Reduced Firefox required version to 102.

## [1.2.0] - 2023-09-19

---

#### Added

- Added `.perm`, `.type`, and `.link` to entry object.
- Added `extractTo` in `archive-wasm/fs.mjs`.
- Added `bomb.zip` test.

#### Changed

- Removed `getEntryType` function.
- Improved documentation.

## [1.1.0] - 2023-09-18

---

### Fixed

- Fixed reading entry's data after its loop has completed.

#### Added

- Added `extractAll` and replaced `entry.type` with `getEntryType` function.
- Added entry mode, atime, ctime, mtime, birthtime.
- Added typing for the wasm module.
- Added tests for most archive formats/compressions and some error handling tests.
- Added rar tests.

#### Changed

- Improved code organization.
- Improved error handling.

## [1.0.0] - 2023-09-15

---

Initial release.

#### Added

- Added tests, build step, and a public API
- Implemented all logic (not fully tested yet).
