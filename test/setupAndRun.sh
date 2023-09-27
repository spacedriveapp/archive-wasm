#!/usr/bin/env sh

set -eu

has() {
  command -v "$1" 1>/dev/null 2>&1
}

deps() {
  for prog in "$@"; do
    if ! has "$prog"; then
      echo "Missing required program: ${prog}" >&2
      exit 1
    fi
  done
}

cleanup() {
  printf "\nDeleting test archives...\n" >&2
  git clean -qfX -e '!IELPKTH.CAB' -e '!GBK.zip' test
}

download() {
  if ! [ -s "test/${1}" ]; then
    rm -rf "test/${1}"
    if has wget; then
      wget -O "test/${1}" "$2"
    elif has curl; then
      curl -LSso "test/${1}" "$2"
    else
      echo "Need either wget or curl to download ${1} test file" >&2
      exit
    fi
  fi
}

# Remove temporary archivesq
trap 'cleanup' EXIT

# Check if system has all the dependencies requires to run tests
deps 7zz zip pax npx lz4 gzip lzma lzop zstd bzip2 bsdtar xorrisofs

# Go to project root
cd "$(dirname "$0")/.."

# Download Microsoft Tahoma font (Can't include in the repo due to license)
download IELPKTH.CAB 'https://master.dl.sourceforge.net/project/corefonts/OldFiles/IELPKTH.CAB'

# Download GBK encoded zip
download GBK.zip 'https://master.dl.sourceforge.net/project/corefonts/OldFiles/IELPKTH.CAB'

# Disable macOS unsufferable ._* files being compressed and breaking tests
export COPYFILE_DISABLE=1

# Create test archives
echo "Creating test archives..." >&2
rar a test/license.rar LICENSE.md PREAMBLE -idq
rar a test/license.ecrypted.rar -p12345678 -idq
rar a test/license.hecrypted.rar LICENSE.md PREAMBLE -hp12345678 -idq
7zz a test/license.7z LICENSE.md PREAMBLE >/dev/null
7zz a test/license.encrypted.7z LICENSE.md PREAMBLE -p12345678 >/dev/null
zip -q test/license.zip LICENSE.md PREAMBLE
zip -q test/license.encrypted.zip LICENSE.md PREAMBLE -P12345678
pax -wf test/license.pax LICENSE.md PREAMBLE
pax -wzf test/license.pax.Z LICENSE.md PREAMBLE
bsdtar -cf test/license.tgz --gzip LICENSE.md PREAMBLE
bsdtar -cf test/license.tlz --lzma LICENSE.md PREAMBLE
bsdtar -cf test/license.tzo --lzop LICENSE.md PREAMBLE
bsdtar -cf test/license.tbz2 --bzip2 LICENSE.md PREAMBLE
bsdtar -cf test/license.tar.lz4 --lz4 LICENSE.md PREAMBLE
bsdtar -cf test/license.tar.zst --zstd LICENSE.md PREAMBLE
xorrisofs -quiet -J -R -V TEST -o test/license.iso -graft-points /LICENSE.md=LICENSE.md /PREAMBLE=PREAMBLE

signal() {
  set -- "${1:-INT}" "${2:-0}" "$(ps x -o "pid pgid" | awk -v pid="${2:-$$}" '$1 == pid { print $2 }')"

  if [ "$3" -gt 0 ]; then
    # reset trap to avoid interrupt loop
    trap '' "$1"
    kill "-$1" -- "-$3" 2>/dev/null
  elif [ "$2" -gt 0 ]; then
    kill "-$1" "$2" 2>/dev/null
  fi

  sleep 1

  if [ "$2" -gt 0 ]; then
    kill -KILL "$2" 2>/dev/null
  fi

  if [ "$3" -gt 0 ]; then
    cleanup
    kill -KILL -- "-$3" 2>/dev/null
  fi
}

npx -- ava "$@" &
_pid=$!
trap 'signal INT "$_pid"' INT
trap 'signal TERM "$_pid"' TERM
wait "$_pid"

# Handle debug mode sometimes hanging after test is done
while [ $# -gt 0 ]; do
  if [ "$1" = 'debug' ]; then
    signal INT
    break
  fi
  shift
done
