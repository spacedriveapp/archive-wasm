#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Illegal usage of the library. */
#define	ARCHIVE_ERRNO_PROGRAMMER_ERROR (-3)
/* Unrecognized or invalid file format. */
#define	ARCHIVE_ERRNO_FILE_FORMAT (-2)
/* Unknown or unclassified error. */
#define	ARCHIVE_ERRNO_MISC (-1)

#include <archive.h>
#include <archive_entry.h>

#define EPASS (-37455)

#define empty_str(str) (str == NULL || str[0] == '\0')

struct archive *open_archive(const void *buf, size_t size,
                             const char *passphrase) {
  // https://github.com/libarchive/libarchive/blob/v3.7.2/libarchive/archive_read.c#L88-L108
  struct archive *archive = archive_read_new();
  if (archive == NULL) {
    return NULL;
  }

  /**
   * Always returns ARCHIVE_OK
   * https://github.com/libarchive/libarchive/blob/v3.7.2/libarchive/archive_read_support_filter_all.c#L77-L84
   */
  archive_read_support_filter_all(archive);

  /**
   * Always returns ARCHIVE_OK
   * https://github.com/libarchive/libarchive/blob/v3.7.2/libarchive/archive_read_support_format_all.c#L81-L88
   */
  archive_read_support_format_all(archive);

  if (empty_str(passphrase)) {
    if (archive_read_has_encrypted_entries(archive) == 1) {
      archive_set_error(archive, EPASS, "Archive requires password");
      return archive;
    }
  } else {
    /**
     * ARCHIVE_OK | ARCHIVE_FATAL
     * https://github.com/libarchive/libarchive/blob/v3.7.2/libarchive/archive_read_add_passphrase.c#L87-L108
     */
    if (archive_read_add_passphrase(archive, passphrase) != ARCHIVE_OK) {
      // Return the allocated archive to allow the JS side to read the error
      return archive;
    }
  }

  // Can be any error code from what I could gleam from the source code
  int code = archive_read_open_memory(archive, buf, size);
  if (code == ARCHIVE_RETRY) {
    // ¯\_(ツ)_/¯
    code = archive_read_open_memory(archive, buf, size);
    if (code == ARCHIVE_RETRY) {
      code = ARCHIVE_FATAL;
      if (empty_str(archive_error_string(archive))) {
        archive_set_error(archive, ARCHIVE_ERRNO_MISC,
                          "Retry for archive_read_open_memory failed");
      }
    }
  }
  if (code != ARCHIVE_OK) {
    if (code == ARCHIVE_WARN) {
      const char *error = archive_error_string(archive);
      fprintf(stderr, "LibArchive.openArchive: %s",
              error == NULL ? "Unknown warning" : error);
      archive_clear_error(archive);
    } else {
      // Return the allocated archive to allow the JS side to read the error
      return archive;
    }
  }

  return archive;
}

struct archive_entry *get_next_entry(struct archive *archive) {
  struct archive_entry *entry = NULL;
  /**
   * ARCHIVE_EOF | ARCHIVE_OK | ARCHIVE_WARN | ARCHIVE_RETRY | ARCHIVE_FATAL
   * https://github.com/libarchive/libarchive/blob/v3.7.2/libarchive/archive_read.c#L649-L670
   */
  int code = archive_read_next_header(archive, &entry);
  if (code == ARCHIVE_RETRY) {
    // ¯\_(ツ)_/¯
    code = archive_read_next_header(archive, &entry);
    if (code == ARCHIVE_RETRY) {
      code = ARCHIVE_FATAL;
      if (empty_str(archive_error_string(archive))) {
        archive_set_error(archive, ARCHIVE_ERRNO_MISC,
                          "Retry for archive_read_next_header failed");
      }
    }
  }

  if (code == ARCHIVE_WARN) {
    const char *error = archive_error_string(archive);
    fprintf(stderr, "LibArchive.getNextEntry: %s",
            error == NULL ? "Unknown warning" : error);
    archive_clear_error(archive);
  } else if (code == ARCHIVE_EOF) {
    archive_clear_error(archive);
    archive_entry_clear(entry);
    return NULL;
  } else if (code == ARCHIVE_FATAL) {
    if (empty_str(archive_error_string(archive))) {
      archive_set_error(archive, ARCHIVE_ERRNO_MISC,
                        "archive_read_next_header failed");
    }
    archive_entry_clear(entry);
    return NULL;
  }

  return entry;
}

void *get_filedata(struct archive *archive, size_t buffsize) {
  if (buffsize > SIZE_MAX) {
    archive_set_error(archive, ENOMEM,
                      "Required buffer size is larger than SIZE_MAX");
    return NULL;
  }

  void *buff = malloc(buffsize);
  if (buff == NULL) {
    archive_set_error(archive, ENOMEM, "Failed to allocate filedata buffer");
    return NULL;
  }

  /**
   * ARCHIVE_RETRY | ARCHIVE_FATAL | number of bytes read (>=0)
   * https://github.com/libarchive/libarchive/blob/v3.7.2/libarchive/archive_read.c#L649-L670
   */
  int read_size = archive_read_data(archive, buff, buffsize);
  if (read_size < 0) {
    if (read_size == ARCHIVE_RETRY) {
      // ¯\_(ツ)_/¯
      read_size = archive_read_data(archive, buff, buffsize);
      if (read_size == ARCHIVE_RETRY) {
        read_size = ARCHIVE_FATAL;
        if (empty_str(archive_error_string(archive))) {
          archive_set_error(archive, ARCHIVE_ERRNO_MISC,
                            "Retry for archive_read_data failed");
        }
        free(buff);
        return NULL;
      }
    }

    if (read_size < 0) {
      if (empty_str(archive_error_string(archive))) {
        archive_set_error(archive, ARCHIVE_ERRNO_MISC,
                          "archive_read_next_header failed");
      }
      free(buff);
      return NULL;
    }
  }

  // HACK: Allow us to get the size from JS
  archive_set_error(archive, 0, "%d", read_size);

  return buff;
}
