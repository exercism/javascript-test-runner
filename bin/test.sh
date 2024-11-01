#!/usr/bin/env bash

set -euo pipefail

corepack enable pnpm
corepack pnpm build || exit
corepack pnpm test:bare
