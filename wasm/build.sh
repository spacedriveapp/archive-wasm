#!/usr/bin/env sh

set -eu

__dir="$(CDPATH='' cd "$(dirname "$0")" && pwd)"

_manager="$(
  for manager in docker podman; do
    if command -v "$manager" 1>/dev/null 2>&1; then
      echo "$manager"
    fi
  done
)"

if [ -z "${_manager:-}" ]; then
  echo "Require docker or podman to be installed" >&2
  exit 1
fi

_dist="$(CDPATH='' cd "${__dir}/../src" && pwd)"
mkdir -p "$_dist"

if [ "$_manager" = 'podman' ]; then
  $_manager build "$__dir" --jobs 4 --tag archive-wasm:latest --security-opt label=disable --network host --format docker
else
  $_manager build "$__dir" --jobs 4 --tag archive-wasm:latest
fi

_id="$($_manager create archive-wasm:latest true)"
$_manager cp "$_id:/wasm" "${_dist}/"
$_manager rm -v "$_id"

npx eslint --no-ignore --rule 'jsdoc/require-jsdoc: off' --fix "${_dist}/wasm/libarchive.mjs" >/dev/null || true
sed -i.bak -e '/export default/d' "${_dist}/wasm/libarchive.mjs"
rm -f "${_dist}/wasm/libarchive.mjs.bak"
