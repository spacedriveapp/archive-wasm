#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Illegal usage of the library. */
#define ARCHIVE_ERRNO_PROGRAMMER_ERROR (-3)
/* Unrecognized or invalid file format. */
#define ARCHIVE_ERRNO_FILE_FORMAT (-2)
/* Unknown or unclassified error. */
#define ARCHIVE_ERRNO_MISC (-1)

#include <archive.h>
#include <archive_entry.h>

#define EPASS (-37455)

#define empty_str(str) (str == NULL || str[0] == '\0')

// https://github.com/libarchive/libarchive/blob/v3.7.7/libarchive/archive_read_support_format_all.c#L31-L88
void support_format(struct archive *a, int recursive) {
  /*
   * These bidders are all pretty cheap; they just examine a
   * small initial part of the archive.  If one of these bids
   * high, we can maybe avoid running any of the more expensive
   * bidders below.
   */
  if (recursive == 0)
    archive_read_support_format_ar(a);
  archive_read_support_format_cpio(a);
  if (recursive == 0)
    archive_read_support_format_empty(a);
  archive_read_support_format_lha(a);
  if (recursive == 0)
    archive_read_support_format_mtree(a);
  archive_read_support_format_tar(a);
  archive_read_support_format_warc(a);

  /*
   * Install expensive bidders last.  By doing them last, we
   * increase the chance that a high bid from someone else will
   * make it unnecessary for these to do anything at all.
   */
  /* These three have potentially large look-ahead. */
  archive_read_support_format_7zip(a);
  if (recursive == 0)
    archive_read_support_format_cab(a);
  archive_read_support_format_rar(a);
  archive_read_support_format_rar5(a);
  archive_read_support_format_iso9660(a);
  /* Seek is really bad, since it forces the read-ahead
   * logic to discard buffered data. */
  archive_read_support_format_zip(a);

  /* Note: We always return ARCHIVE_OK here, even if some of the
   * above return ARCHIVE_WARN.  The intent here is to enable
   * "as much as possible."  Clients who need specific
   * compression should enable those individually so they can
   * verify the level of support. */
  /* Clear any warning messages set by the above functions. */
  archive_clear_error(a);
}

// https://github.com/libarchive/libarchive/blob/v3.7.7/libarchive/archive_read_support_filter_all.c#L40C1-L84C2
void support_filter(struct archive *a) {

  /* Bzip falls back to "bunzip2" command-line */
  archive_read_support_filter_bzip2(a);
  /* The decompress code doesn't use an outside library. */
  archive_read_support_filter_compress(a);
  /* Gzip decompress falls back to "gzip -d" command-line. */
  archive_read_support_filter_gzip(a);
  /* Lzip falls back to "unlzip" command-line program. */
  archive_read_support_filter_lzip(a);
  /* The LZMA file format has a very weak signature, so it
   * may not be feasible to keep this here, but we'll try.
   * This will come back out if there are problems. */
  /* Lzma falls back to "unlzma" command-line program. */
  archive_read_support_filter_lzma(a);
  /* Xz falls back to "unxz" command-line program. */
  archive_read_support_filter_xz(a);
  /* The decode code doesn't use an outside library. */
  archive_read_support_filter_uu(a);
  /* The decode code doesn't use an outside library. */
  archive_read_support_filter_rpm(a);
  /* Lzop decompress falls back to "lzop -d" command-line. */
  archive_read_support_filter_lzop(a);
  /* Lz4 falls back to "lz4 -d" command-line program. */
  archive_read_support_filter_lz4(a);
  /* Zstd falls back to "zstd -d" command-line program. */
  archive_read_support_filter_zstd(a);

  /* Note: We always return ARCHIVE_OK here, even if some of the
   * above return ARCHIVE_WARN.  The intent here is to enable
   * "as much as possible."  Clients who need specific
   * compression should enable those individually so they can
   * verify the level of support. */
  /* Clear any warning messages set by the above functions. */
  archive_clear_error(a);
}

struct archive *open_archive(const void *buf, size_t size,
                             const char *passphrase, int recursive) {
  // https://github.com/libarchive/libarchive/blob/v3.7.7/libarchive/archive_read.c#L87-L107
  struct archive *archive = archive_read_new();
  if (archive == NULL) {
    return NULL;
  }

  support_filter(archive);
  support_format(archive, recursive);

  if (empty_str(passphrase)) {
    if (archive_read_has_encrypted_entries(archive) == 1) {
      archive_set_error(archive, EPASS, "Archive requires password");
      return archive;
    }
  } else {
    /**
     * ARCHIVE_OK | ARCHIVE_FATAL
     * https://github.com/libarchive/libarchive/blob/v3.7.7/libarchive/archive_read_add_passphrase.c#L86-L107
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
      fprintf(stderr, "LibArchive.openArchive: %s\n",
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
   * https://github.com/libarchive/libarchive/blob/v3.7.7/libarchive/archive_read.c#L648-L669
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
    fprintf(stderr, "LibArchive.getNextEntry: %s\n",
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
   * https://github.com/libarchive/libarchive/blob/v3.7.7/libarchive/archive_read.c#L648-L669
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
