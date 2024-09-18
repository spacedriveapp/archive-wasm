#!/usr/bin/env sh

set -eu

if ! command -v npx 1>/dev/null 2>&1; then
  echo "npx is not available" >&2
  exit 1
fi

__dir="$(CDPATH='' cd "$(dirname "$0")" && pwd)"

_manager="$(
  for manager in docker podman; do
    if command -v "$manager" 1>/dev/null 2>&1; then
      echo "$manager"
      break
    fi
  done
)"

if [ -z "${_manager:-}" ]; then
  echo "Require docker or podman to be installed" >&2
  exit 1
fi

_dist="$(CDPATH='' cd "${__dir}/../src/wasm" && pwd)"
mkdir -p "$_dist"

if [ "$_manager" = 'podman' ]; then
  set -- --jobs 4 --security-opt label=disable --format docker
fi

case "$(uname -m)" in
  aarch64 | arm64)
    _arm64='-arm64'
    ;;
esac

$_manager build --network host --build-arg ARM="${_arm64:-}" "$@" -o "${_dist}/" "$__dir"

npx eslint --no-ignore --rule 'jsdoc/require-jsdoc: off' --rule 'prettier/prettier: off' --fix "${_dist}/libarchive.mjs" >/dev/null || true
npx prettier --write "${_dist}/libarchive.mjs"
sed -i.bak -e '/export default/d' "${_dist}/libarchive.mjs"
rm -f "${_dist}/libarchive.mjs.bak"
