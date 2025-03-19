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
  git clean -qfX -e '!IELPKTH.CAB' -e '!GBK.zip' -e '!native-deps-x86_64-linux-gnu.tar.xz' -e '!moddable-tools-mac64arm.zip' test
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
# Add spacedrive own native-deps for testing
download native-deps-x86_64-linux-gnu.tar.xz https://github.com/spacedriveapp/native-deps/releases/latest/download/native-deps-x86_64-linux-gnu.tar.xz
# Add Moddable tools
download moddable-tools-mac64arm.zip https://github.com/Moddable-OpenSource/moddable/releases/download/5.5.0/moddable-tools-mac64arm.zip

# Disable macOS unsufferable ._* files being compressed and breaking tests
export COPYFILE_DISABLE=1

# Create test archives
echo "Creating test archives..." >&2
compress test/license LICENSE.md PREAMBLE
compress test/gitignore .gitignore .prettierignore

# Create a nested zip file
(
  cd "$(dirname "$0")"
  echo "the cake is a lie" >congratulations.txt
  zip -rq nested.zip congratulations.txt
  rm congratulations.txt
  for _ in $(seq 1 23); do
    mkdir inside
    mv nested.zip inside
    zip -rq nested.zip inside
    rm -r inside
  done
)

npx -- ava "$@" &
trap 'kill -s INT $(jobs -pr)' INT
trap 'kill -s TERM $(jobs -pr)' TERM
wait %1
