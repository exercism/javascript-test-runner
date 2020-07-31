#!/bin/sh

# Synopsis:
# Automatically tests exercism's JS track solutions against corresponding test files.
# Takes two arguments and makes sure all the tests are run

# Arguments:
# $1: exercise slug
# $2: path to solution folder (with trailing slash)
# $3: path to output directory (with trailing slash)

# Output:
# Writes the tests output to the output directory

# Example:
# ./run.sh two-fer path/to/two-fer/solution/folder/ path/to/output-directory/

set -euo pipefail

# Put together the path to the test file
test_file="${2}/${1}.spec.js"

# Put together the path to the test results file
result_file="${3}/results.json"

# Change xtest to test so all tests are run
sed -i 's/xtest/test/g' "${test_file}"
sed -i 's/xit/it/g' "${test_file}"

mkdir -p "${3}"

# Disable auto exit
set +e

# Run tests
./node_modules/.bin/jest test --no-cache "${2}*" \
                              --outputFile="${result_file}" \
                              --reporters "./dist/reporter.js" \
                              --noStackTrace \
                              --verbose=false \
                              --roots "${2}"

# Convert exit(1) to exit(0)
test_exit=$?
if [ $test_exit -eq 1 ]
then
  exit 0
else
  exit $test_exit
fi
