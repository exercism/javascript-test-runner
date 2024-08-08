#!/usr/bin/env bash

set -uo pipefail

if [ -z "${EXERCISM_PRETTIER_VERSION:-}" ]; then
  echo "[format] pulling prettier version from package.json using sed"
  EXERCISM_PRETTIER_VERSION="$(corepack pnpm list prettier --parseable | sed -n -e '1,$s/^.*prettier@//' -e 's/\\node_modules\\prettier//p')"
  echo "[format] expected version is now ${EXERCISM_PRETTIER_VERSION:-}"
fi

if [ -z "${EXERCISM_PRETTIER_VERSION:-}" ]; then
  echo "Version could not be pulled using sed" >&2
  echo ""
  echo "---------------------------------------------------"
  echo "This script requires the EXERCISM_PRETTIER_VERSION variable to work."
  echo "Please see https://exercism.org/docs/building/markdown/style-guide for guidance."
  echo "---------------------------------------------------"
  echo "$(corepack pnpm -v)"
  echo ""
  echo "This is what corepack pnpm list reports:"
  echo "$ corepack pnpm list prettier --parseable"
  echo "$(corepack pnpm list prettier --parseable)"
  echo ""
  echo "And corepack pnpm info reports the following:"
  echo "$ corepack pnpm info prettier"
  echo "$(corepack pnpm info prettier)"
  echo ""
  echo "This is the version that can be extracted using sed:"
  echo "$ corepack pnpm list prettier --parseable | sed -n -e '1,\$s/^.*prettier@//' -e 's/\\node_modules\\prettier//p'"
  echo "└─ $(corepack pnpm list prettier --parseable | sed -n -e '1,$s/^.*prettier@//' -e 's/\\node_modules\\prettier//p')"
  echo ""
  echo "These files are found in the repo root:"
  echo "$(ls -p | grep -v /)"
  echo "---------------------------------------------------"
  exit 1
else
 echo "[format] running with prettier@$EXERCISM_PRETTIER_VERSION"
fi

corepack pnpm dlx "prettier@$EXERCISM_PRETTIER_VERSION" --write "**/*.{js,jsx,ts,tsx,css,sass,scss,html,json,md,yml}"
