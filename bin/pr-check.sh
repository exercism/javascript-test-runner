#!/usr/bin/env bash

# Documentation on @
#   https://www.gnu.org/savannah-checkouts/gnu/bash/manual/bash.html#index-_0040
# Documentation on shift [n]
#   https://www.gnu.org/savannah-checkouts/gnu/bash/manual/bash.html#index-shift
# Why quoting the argument is "necessary":
#   https://stackoverflow.com/questions/4824590/propagate-all-arguments-in-a-bash-shell-script/4824637#4824637

set -euo pipefail

# eats 1 argument
shift 1

DIRNAME=$(dirname "$0")
"${DIRNAME}/lint.sh" "$@"
"${DIRNAME}/check-formatting.sh" "$@"