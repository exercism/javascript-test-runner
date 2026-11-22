#!/usr/bin/env bash

# Synopsis:
# Record the files read by one run of the test runner, while building the
# Docker image. run.sh reads these files into the page cache at the start of
# each run (see run.sh).

# Arguments:
# $1: path of the list to write

set -euo pipefail

ROOT="$(realpath "$(dirname "$0")/..")"
TRACE="$(mktemp)"

# Log every file opened by the warm-up run and by every process it starts
strace -f -qq -e trace=openat,execve -e signal=none -o "${TRACE}" "${ROOT}/bin/warm-up.sh"

# Keep the files that opened successfully, in the order they were first
# opened. The warm-up exercise reads packages through its node_modules link,
# so those paths are rewritten to the real folder. Files in the exercise
# itself, and in /tmp, /proc, /dev and /sys, are left out.
grep -v ' = -1 ' "${TRACE}" \
  | grep -oE '(openat\(AT_FDCWD, |execve\()"[^"]+"' \
  | sed -E 's/^[^"]*"//; s/"$//' \
  | sed -E "s#^/tmp/[^/]+/warm-up/node_modules/#${ROOT}/node_modules/#" \
  | grep -vE '^/(tmp|proc|dev|sys)/' \
  | awk '!seen[$0]++' \
  | while read -r file; do
      if test -f "${file}"; then echo "${file}"; fi
    done > "$1"

rm -f "${TRACE}"

echo "Recorded $(wc -l < "$1") files in $1"
