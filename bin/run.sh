#!/bin/sh

# Synopsis:
# Automatically tests exercism's JS track solutions against corresponding test files.
# Takes two arguments and makes sure all the tests are run

# Arguments:
# $1: exercise slug
# $2: path to solution folder (without trailing slash)
# $3: path to output directory (without trailing slash)

# Output:
# Writes the tests output to the output directory

# Example:
# ./run.sh two-fer path/to/two-fer/solution/folder path/to/output-directory

# Put together the path to the test file
test_file="$2/$1.spec.js"

# Put together the path to the test results file
result_file="$2/results.xml"
package_json_source = "package.json"
package_json="$2/package.json"

# Change xtest to test so all tests are run
sed -i 's/xtest/test/g' $test_file
sed -i 's/xit/it/g' $test_file

# Symlink the node_modules we have, then install missing packages
ln -sf production_node_modules $2/node_modules
yarn install --cwd $2

# Afterwards, copy the Package.json
cp $package_json_source $package_json
sed -i "s/{result_file}/${result_file}/g" $package_json

yarn test:cli --cwd $2
