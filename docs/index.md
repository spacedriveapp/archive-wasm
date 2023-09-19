## Modules

<dl>
<dt><a href="#module_archive-wasm">archive-wasm</a></dt>
<dd><p>Idiomatic JavaScript API for extracting most archive files with LibArchive</p>
</dd>
<dt><a href="#archive-wasm/src/fs.module_mjs">archive-wasm/src/fs.mjs</a></dt>
<dd><p>Utilities for extracting archives to disk using NodeJS&#39;s fs API</p>
</dd>
</dl>

<a name="module_archive-wasm"></a>

## archive-wasm
Idiomatic JavaScript API for extracting most archive files with LibArchive


* [archive-wasm](#module_archive-wasm)
    * _static_
        * [.disableWarning()](#module_archive-wasm.disableWarning)
        * [.extract(data, [passphrase])](#module_archive-wasm.extract) ⇒ <code>Generator.&lt;module:archive~Entry, void, void&gt;</code>
            * [~entry](#module_archive-wasm.extract..entry) : <code>module:archive~Entry</code>
        * [.extractAll(data, [passphrase])](#module_archive-wasm.extractAll) ⇒ <code>Array.&lt;module:archive~Entry&gt;</code>
    * _inner_
        * [~Entry](#module_archive-wasm..Entry) : <code>object</code>

<a name="module_archive-wasm.disableWarning"></a>

### archive.disableWarning()
Disable lib warnings

**Kind**: static method of [<code>archive-wasm</code>](#module_archive-wasm)  
<a name="module_archive-wasm.extract"></a>

### archive.extract(data, [passphrase]) ⇒ <code>Generator.&lt;module:archive~Entry, void, void&gt;</code>
Uncompress archive and iterate through all it's entries

**Kind**: static method of [<code>archive-wasm</code>](#module_archive-wasm)  
**Returns**: <code>Generator.&lt;module:archive~Entry, void, void&gt;</code> - Generator that iterate through all of the archive's entries  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>ArrayBufferLike</code> | Archive's data |
| [passphrase] | <code>string</code> | Passphrase to decrypt protect zip archives |

<a name="module_archive-wasm.extract..entry"></a>

#### extract~entry : <code>module:archive~Entry</code>
**Kind**: inner constant of [<code>extract</code>](#module_archive-wasm.extract)  
<a name="module_archive-wasm.extractAll"></a>

### archive.extractAll(data, [passphrase]) ⇒ <code>Array.&lt;module:archive~Entry&gt;</code>
Uncompress all entries in an archive

> This function is the preferred choice over `extract` when your use case
  involves accessing the content data of all entries within the archive,
  and memory usage is not a critical concern. It provides a performance
  advantage for this specific scenario by circumventing certain workarounds
  required to support random-time access to an entry's data within
  LibArchive's streaming process model. If your goal is to process all
  entries and retrieve their content, `extractAll` is the recommended method.

**Kind**: static method of [<code>archive-wasm</code>](#module_archive-wasm)  
**Returns**: <code>Array.&lt;module:archive~Entry&gt;</code> - List with all entries included in the archive  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>ArrayBufferLike</code> | Archive's data |
| [passphrase] | <code>string</code> | Passphrase to decrypt protect zip archives |

<a name="module_archive-wasm..Entry"></a>

### archive-wasm~Entry : <code>object</code>
A compressed data entry inside an archive

**Kind**: inner typedef of [<code>archive-wasm</code>](#module_archive-wasm)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| size | <code>bigint</code> | Size of the entry in bytes. |
| perm | <code>number</code> | A bit-field describing the file type and mode. |
| path | <code>string</code> | Path of the entry within the archive. |
| type | <code>EntryTypeName</code> | Indicates if the entry is a file, directory or something else |
| link | <code>string</code> | path to actual resource in case this is a symlink or hardlink |
| atime | <code>bigint</code> | The timestamp indicating the last time this file was accessed expressed in nanoseconds since the POSIX Epoch. |
| ctime | <code>bigint</code> | The timestamp indicating the last time the file status was changed expressed in nanoseconds since the POSIX Epoch. |
| mtime | <code>bigint</code> | The timestamp indicating the last time this file was modified expressed in nanoseconds since the POSIX Epoch. |
| birthtime | <code>bigint</code> | The timestamp indicating the creation time of this file expressed in nanoseconds since the POSIX Epoch. |
| data | <code>ArrayBufferLike</code> | An `ArrayBuffer` containing the entry's data. |

<a name="archive-wasm/src/fs.module_mjs"></a>

## archive-wasm/src/fs.mjs
Utilities for extracting archives to disk using NodeJS's fs API

<a name="archive-wasm/src/fs.module_mjs.extractTo"></a>

### fs.extractTo(data, out, [passphrase])
Extract all supported archive entries inside a given path

> Only files, directories, symlinks and hardlinks are supported.
  Any extra entry type, or invalid entry, in the archive will be skipped (with a warning printed to console)
  This function throws if it attempts to overwrite any existing file

**Kind**: static method of [<code>archive-wasm/src/fs.mjs</code>](#archive-wasm/src/fs.module_mjs)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>ArrayBufferLike</code> | Archive's data |
| out | <code>string</code> | Path where the archive entries will be extracted to |
| [passphrase] | <code>string</code> | Passphrase to decrypt protect zip archives |

