#!/usr/bin/env sh

set -eu

has() {
  for prog in "$@"; do
    if ! command -v "$prog" 1>/dev/null 2>&1; then
      echo "Missing required program: ${prog}" >&2
      exit 1
    fi
  done
}

cleanup() {
  printf "\nDeleting test archives...\n" >&2
  git clean -qfX test
}

# Remove temporary archivesq
trap 'cleanup' EXIT

# Check if system has all the dependencies requires to run tests
has 7zz zip npx lz4 gzip lzma lzop zstd bzip2 bsdtar

# Go to project root
cd "$(dirname "$0")/.."

# Create test archives
echo "Creating test archives..." >&2
rar a test/license.rar LICENSE.md PREAMBLE -idq
rar a test/license.ecrypted.rar LICENSE.md PREAMBLE -p12345678 -idq
rar a test/license.hecrypted.rar LICENSE.md PREAMBLE -hp12345678 -idq
7zz a test/license.7z LICENSE.md PREAMBLE >/dev/null
7zz a test/license.encrypted.7z LICENSE.md PREAMBLE -p12345678 >/dev/null
zip -q test/license.zip LICENSE.md PREAMBLE
zip -q test/license.encrypted.zip LICENSE.md PREAMBLE -P12345678
bsdtar --no-mac-metadata -cf test/license.tgz --gzip LICENSE.md PREAMBLE
bsdtar --no-mac-metadata -cf test/license.tlz --lzma LICENSE.md PREAMBLE
bsdtar --no-mac-metadata -cf test/license.tzo --lzop LICENSE.md PREAMBLE
bsdtar --no-mac-metadata -cf test/license.tbz2 --bzip2 LICENSE.md PREAMBLE
bsdtar --no-mac-metadata -cf test/license.tar.lz4 --lz4 LICENSE.md PREAMBLE
bsdtar --no-mac-metadata -cf test/license.tar.zst --zstd LICENSE.md PREAMBLE

signal() {
  set -- "${1:-INT}" "$2" "$(ps x -o "pid pgid" | awk -v pid="${2:-$$}" '$1 == pid { print $2 }')"

  if [ "$3" -gt 0 ]; then
    # reset trap to avoid interrupt loop
    trap '' "$1"
    kill "-$1" -- "-$3" 2>/dev/null
  elif [ "$2" -gt 0 ]; then
    kill "-$1" "$2" 2>/dev/null
  fi

  sleep 3

  if [ "$2" -gt 0 ]; then
    kill -KILL "$2" 2>/dev/null
  fi

  if [ "$3" -gt 0 ]; then
    cleanup
    kill -KILL -- "-$3" 2>/dev/null
  fi
}

npx ava "$@" &
_pid=$!
trap 'signal INT "$_pid"' INT
trap 'signal TERM "$_pid"' TERM
wait "$_pid"
