#!/bin/bash

set -euo pipefail

yarn build
yarn test:bare