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
test_file="${2}${1}.spec.js"

# Put together the path to the test results file
result_file="${3}results.json"
package_json_source="./package.template.json" # /opt/test-runner/package.json
package_json="./package.json"

# Change xtest to test so all tests are run
sed -i 's/xtest/test/g' "${test_file}"
sed -i 's/xit/it/g' "${test_file}"

# Symlink the node_modules we have, then install missing packages
# ln -sfr "./production_node_modules" .
# NOTE: this should have been done by the docker image.

# NOTE: we are NOT allowed to access the internet, so this is just praying that
#       it works. I guess this is what we'll have to do.
#
# yarn install --prefer-offline --cwd "${2}"

# Afterwards, copy the package.json
cp "${package_json_source}" "${package_json}"
sed -i "s;{result_file};${result_file};g" "${package_json}"
sed -i "s;{in};${2};g" "${package_json}"

mkdir -p "${3}"

(cd "${2}"; yarn test:cli)
