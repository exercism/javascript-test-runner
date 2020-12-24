#!/bin/bash

# Synopsis:
# Automatically tests exercism's JS track solutions against corresponding test files.
# Takes two-three arguments and makes sure all the tests are run

# Arguments:
# $1: exercise slug
# $2: path to solution folder (with trailing slash)
# $3: path to output directory (with trailing slash) (defaults to $2)

# Output:
# Writes the tests output to the output directory

# Example:
# ./run.sh two-fer path/to/two-fer/solution/folder/
# ./run.sh two-fer path/to/two-fer/solution/folder/ path/to/output-directory/

if [[ $1 != http?(s)://* ]]; then
  if [ -z "$2" ] ; then
    echo "Requires at least 2 arguments:"
    echo "1: exercise slug"
    echo "2: path to solution folder (with trailing slash)"
    echo ""
    echo "Usage:"
    echo "  run.sh two-fer path/to/two-fer/solution/folder/"
    exit 1
  fi

  if [ -z "$3" ] ; then
    OUTPUT="$2"
  else
    OUTPUT="$3"
  fi

  INPUT="$2"
  SLUG="$1"
else
  # This block allows you to download a solution and run the tests on it. This
  # allows passing in any solution URL your locally installed exercism CLI has
  # access to:
  #
  # - published: https://exercism.io/tracks/javascript/exercises/clock/solutions/a7d1b71693fb4298a3a99bd352dd4d74
  # - own: https://exercism.io/my/solutions/a7d1b71693fb4298a3a99bd352dd4d74
  # - mentoring: https://exercism.io/mentor/solutions/a7d1b71693fb4298a3a99bd352dd4d74
  # - private: https://exercism.io/solutions/a7d1b71693fb4298a3a99bd352dd4d74
  #
  uuid=$(basename $1)
  echo "Exercism remote UUID: $uuid"

  result=$(exercism download --uuid="${uuid}" | sed -n 1p) || exit $?
  echo $result

  SLUG=$(basename $result)
  TMP="./tmp/${SLUG}/${uuid}/"

  # Jest really doesn't like it when the input files are outside the CWD process
  # tree. Instead of trying to resolve that, the code here copies the downloaded
  # solution to a local temporary directory.
  #
  # This will fail if the cwd is not writable.
  #
  mkdir -p "$TMP"
  cp "$result" "$TMP" -r

  INPUT="$TMP$SLUG/"
  OUTPUT=$INPUT
fi

# Forces a trailing slash
INPUT="${INPUT%/}/"

# Forces a trailing slash
OUTPUT="${OUTPUT%/}/"

set -euo pipefail

ROOT="$(realpath $(dirname "$0")/..)"
REPORTER="$ROOT/dist/reporter.js"
if test -f "$REPORTER"; then
  echo "Using reporter: $REPORTER"
  echo "Using testroot: $INPUT"
  echo "Using baseroot: $ROOT"
else
  >&2 echo "Expected reporter.js to exist. Did you forget to yarn build first?"
  >&2 echo "With reporter: $REPORTER"
  >&2 echo "With testroot: $INPUT"
  >&2 echo "With baseroot: $ROOT"
  exit 1
fi

echo ""

# Put together the path to the test file
test_file="${INPUT}${SLUG}.spec.js"

# Put together the path to the test results file
result_file="${OUTPUT}results.json"

# Change xtest to test so all tests are run
if [[ "$OSTYPE" == "darwin"* ]]; then # Mac OS X
  # BSD sed -i takes an extra parameter to specify the backup file extension
  sed -i 'tmp' 's/xtest(/test(/g' "${test_file}"
  sed -i 'tmp' 's/xit(/it(/g' "${test_file}"
  sed -i 'tmp' 's/xdescribe(/describe(/g' "${test_file}"
else
  sed -i 's/xtest(/test(/g' "${test_file}"
  sed -i 's/xit(/it(/g' "${test_file}"
  sed -i 's/xdescribe(/describe(/g' "${test_file}"
fi

mkdir -p "${OUTPUT}"

# Disable auto exit
set +e

# Run tests
"$ROOT/node_modules/.bin/jest" test --no-cache "${INPUT}*" \
                               --outputFile="${result_file}" \
                               --reporters "${REPORTER}" \
                               --noStackTrace \
                               --verbose=false \
                               --roots "${INPUT}"

# Convert exit(1) (jest worked, but there are failing tests) to exit(0)
test_exit=$?

echo ""
echo "Find the output at:"
echo $result_file

if [ $test_exit -eq 1 ]
then
  exit 0
else
  exit $test_exit
fi
