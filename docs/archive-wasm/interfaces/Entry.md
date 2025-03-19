[**archive-wasm**](../../README.md)

---

# Interface: Entry

## Properties

### atime

> **atime**: `bigint`

The timestamp indicating the last time this file was accessed, expressed in nanoseconds since the POSIX Epoch.

---

### birthtime

> **birthtime**: `bigint`

The timestamp indicating this file’s creation time, expressed in nanoseconds since the POSIX Epoch.

---

### ctime

> **ctime**: `bigint`

The timestamp indicating the last time the file status was changed, expressed in nanoseconds since the POSIX Epoch.

---

### data

> **data**: `ArrayBuffer`

An ArrayBuffer containing the entry’s data.

---

### link

> **link**: `null` \| `string`

The path to the actual resource if this is a symlink or hardlink.

---

### mtime

> **mtime**: `bigint`

The timestamp indicating the last time this file was modified, expressed in nanoseconds since the POSIX Epoch.

---

### path

> **path**: `null` \| `string`

The path of the entry within the archive.

---

### perm

> **perm**: `number`

A bit field describing the file type and mode.

---

### size

> **size**: `bigint`

The size of the entry in bytes.

---

### type

> **type**: `null` \| [`EntryTypeName`](../enumerations/EntryTypeName.md)

Indicates if the entry is a file, directory, or another type.
