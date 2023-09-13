#define LIBARCHIVE_STATIC

#include "emscripten.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <archive.h>
#include <archive_entry.h>


EMSCRIPTEN_KEEPALIVE
void* archive_open( const void *buf, size_t size, const char * passphrase ) {
  struct archive *a;
  int r;

  a = archive_read_new();
  archive_read_support_filter_all(a);
  archive_read_support_format_all(a);

  if( passphrase ){
    archive_read_add_passphrase(a, passphrase);
  }

  r = archive_read_open_memory(a, buf, size);
  if (r != ARCHIVE_OK){
    fprintf(stderr, "Memory read error %d\n",r);
    fprintf(stderr, "%s\n",archive_error_string(a));
  }
  return a;
}

EMSCRIPTEN_KEEPALIVE
const void* get_next_entry(void *archive) {
  struct archive_entry *entry;
  if( archive_read_next_header(archive,&entry) == ARCHIVE_OK ){
    return entry;
  }else{
    return NULL;
  }
}

EMSCRIPTEN_KEEPALIVE
void* get_filedata(void *archive,size_t buffsize) {
  void *buff = malloc( buffsize );
  int read_size = archive_read_data(archive,buff,buffsize);
  if( read_size < 0 ){
    fprintf(stderr, "Error occured while reading file");
    return (void*) read_size;
  }else{
    return buff;
  }
}

EMSCRIPTEN_KEEPALIVE
void archive_close(void *archive) {
  int r = archive_read_free(archive);
  if (r != ARCHIVE_OK){
    fprintf(stderr, "Error read free %d\n",r);
    fprintf(stderr, "%s\n",archive_error_string(archive));
  }
}
