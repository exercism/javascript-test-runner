#!/usr/bin/env bash

# Synopsis:
# Run the test runner once on a small exercise while building the Docker
# image, with NODE_COMPILE_CACHE set (see the Dockerfile). Node saves the
# compiled code of every module it loads (Jest, the transformer and the
# reporter's parser) in that folder. Each run then loads the compiled code
# instead of compiling it again.

set -euo pipefail

ROOT="$(realpath "$(dirname "$0")/..")"
WARM_UP_DIR="$(mktemp -d)/warm-up/"

mkdir -p "${WARM_UP_DIR}.meta"

cat > "${WARM_UP_DIR}.meta/config.json" <<'JSON'
{
  "files": {
    "solution": ["warm-up.js"],
    "test": ["warm-up.spec.js"]
  }
}
JSON

cat > "${WARM_UP_DIR}warm-up.js" <<'JS'
export function answer() {
  console.log('warming up')
  return 42
}
JS

cat > "${WARM_UP_DIR}warm-up.spec.js" <<'JS'
import { describe, expect, test } from '@jest/globals'
import { answer } from './warm-up'

describe('answer', () => {
  test('is 42', () => {
    expect(answer()).toBe(42)
  })
})
JS

"${ROOT}/bin/run.sh" warm-up "${WARM_UP_DIR}" "${WARM_UP_DIR}" > /dev/null

# Check the warm-up run passed, so a broken runner fails the image build
grep -q '"status": "pass"' "${WARM_UP_DIR}results.json"

rm -rf "$(dirname "${WARM_UP_DIR}")"
