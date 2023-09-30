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

compress() {
  _name="$1"
  shift

  rar a "${_name}.rar" -ol -idq "$@"
  rar a "${_name}.ecrypted.rar" -p12345678 -ol -idq "$@"
  rar a "${_name}.hecrypted.rar" -hp12345678 -ol -idq "$@"
  7zz a -snl "${_name}.7z" "$@" >/dev/null
  7zz a -snl "${_name}.encrypted.7z" -p12345678 "$@" >/dev/null
  zip -q "${_name}.zip" --symlinks "$@"
  zip -q "${_name}.encrypted.zip" --symlinks -P12345678 "$@"
  pax -wf "${_name}.pax" "$@"
  pax -wzf "${_name}.pax.Z" "$@"
  bsdtar -cf "${_name}.tgz" --gzip "$@"
  bsdtar -cf "${_name}.tlz" --lzma "$@"
  bsdtar -cf "${_name}.tzo" --lzop "$@"
  bsdtar -cf "${_name}.tbz2" --bzip2 "$@"
  bsdtar -cf "${_name}.tar.lz4" --lz4 "$@"
  bsdtar -cf "${_name}.tar.zst" --zstd "$@"
  xorrisofs -quiet -R -V TEST -o "${_name}.iso" "$@"
}

# Remove temporary archivesq
trap 'cleanup' EXIT

# Check if system has all the dependencies requires to run tests
# yay -Sy --needed rar 7-zip zip pax lz4 gzip xz lzop zstd bzip2 libarchive libisoburn
deps rar 7zz zip pax npx lz4 gzip lzma lzop zstd bzip2 bsdtar xorrisofs

# Go to project root
cd "$(dirname "$0")/.."

echo "Downloading test archives..." >&2
# Download Microsoft Tahoma font (https://learn.microsoft.com/en-us/typography/font-list/tahoma, Can't include in the repo due to license)
download IELPKTH.CAB 'https://master.dl.sourceforge.net/project/corefonts/OldFiles/IELPKTH.CAB'
# Download GBK encoded zip (https://sourceforge.net/p/sevenzip/bugs/2198, not including in the repo because I am not sure about the precedence of the files)
download GBK.zip 'https://sourceforge.net/p/sevenzip/bugs/2198/attachment/sample.zip'

# Disable macOS unsufferable ._* files being compressed and breaking tests
export COPYFILE_DISABLE=1

# Create test archives
echo "Creating test archives..." >&2
compress test/license LICENSE.md PREAMBLE
compress test/gitignore .gitignore .prettierignore

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
