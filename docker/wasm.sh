#!/usr/bin/env sh

set -eux

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

_dist="$(CDPATH='' cd "${__dir}/../dist" && pwd)"
mkdir -p "$_dist"

$_manager build "$__dir" --jobs 4 --tag archive-wasm:latest

_id="$($_manager create archive-wasm:latest true)"
$_manager cp "$_id:/wasm" "${_dist}/"
$_manager rm -v "$_id"