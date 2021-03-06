#!/bin/bash

set -euo pipefail

npx "prettier@$EXERCISM_PRETTIER_VERSION" --check "**/*.{js,jsx,ts,tsx,css,sass,scss,html,json,md,yml}"
