#!/usr/bin/env bash

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

# change xtest to test so all tests are run
sed -i 's/xtest/test/g' $test_file

# install dependencies
npm i --prefix $2
npm i --prefix $2 jest-junit

# Add custom test to package.json to run the tests with junit output
# This is a hack to avoid jest cli complications
# TODO: find a clean way to use jest cli
if grep -q '^.*customTest' "$2/package.json"; then
    echo "hello from replace"
    sed -i "s#^\s*\"customTest\":.*#\"customTest\": \"jest --no-cache \.\/\* --outputFile=${result_file} --reporters=jest-junit\",#g" "$2/package.json"
else
    echo "hello from insert after"
    sed -i "/^\s*\"test\":.*/a \"customTest\": \"jest --no-cache \./* --outputFile=${result_file} --reporters=jest-junit\"," "$2/package.json"
fi

# run tests
npm run customTest --prefix $2