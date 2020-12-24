#!/bin/bash

set -euo pipefail

yarn build || exit
yarn test:bare

