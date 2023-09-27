# Interface: Entry<\>

[archive-wasm](../modules/archive_wasm.md).Entry

## Properties

### atime

• **atime**: `bigint`

The timestamp indicating the last time this file was accessed expressed in nanoseconds since the POSIX Epoch

---

### birthtime

• **birthtime**: `bigint`

The timestamp indicating the creation time of this file expressed in nanoseconds since the POSIX Epoch

---

### ctime

• **ctime**: `bigint`

The timestamp indicating the last time the file status was changed expressed in nanoseconds since the POSIX Epoch

---

### data

• **data**: `ArrayBufferLike`

An `ArrayBuffer` containing the entry's data

---

### link

• **link**: `null` \| `string`

path to actual resource in case this is a symlink or hardlink

---

### mtime

• **mtime**: `bigint`

The timestamp indicating the last time this file was modified expressed in nanoseconds since the POSIX Epoch

---

### path

• **path**: `null` \| `string`

Path of the entry within the archive

---

### perm

• **perm**: `number`

A bit-field describing the file type and mode

---

### size

• **size**: `bigint`

Size of the entry in bytes

---

### type

• **type**: `null` \| [`EntryTypeName`](../enums/archive_wasm.EntryTypeName.md)

Indicates if the entry is a file, directory or something else
