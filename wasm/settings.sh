#!/usr/bin/env sh

set -eu

set -- WASM true \
  STRICT true \
  POLYFILL false \
  EXPORT_ES6 true \
  INVOKE_RUN false \
  MODULARIZE true \
  FILESYSTEM false \
  RELOCATABLE true \
  STANDALONE_WASM true \
  SUPPORT_BIG_ENDIAN true \
  ALLOW_MEMORY_GROWTH true \
  MIN_NODE_VERSION 180000 \
  MIN_CHROME_VERSION 109 \
  MIN_SAFARI_VERSION 150601 \
  MIN_FIREFOX_VERSION 102

while [ "$#" -gt 0 ]; do
  sed -i -e "s/^\s*var\s\{1,\}${1}\s\{1,\}=.*$/var ${1} = ${2};/g" /emsdk/upstream/emscripten/src/settings.js
  shift 2
done
