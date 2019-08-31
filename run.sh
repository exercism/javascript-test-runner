#!/usr/bin/env bash

# Synopsis:
# Automatically tests exercism's JS track solutions against corresponding test files.
# Takes two arguments and makes sure all the tests are run

# Arguments:
# $1: exercise slug
# $2: path to solution folder (without trailing slash)

# Output:
# [For now] writes the tests output to the terminal

# Example:
# ./run.sh two-fer path/to/two-fer/solution/folder

# Put together the path to the test file
test_file=$2/$1.spec.js

# change xtest to test so all tests are run
sed -i 's/xtest/test/g' $test_file

npm i --prefix $2
npm run test --prefix $2