#!/bin/bash

# Synopsis:
# Test the test runner by running it against a predefined set of solutions
# with an expected output.

# Output:
# Outputs the diff of the expected test results against the actual test results
# generated by the test runner.

# Example:
# ./bin/run-tests.sh

set -uo pipefail

mount

exit_code=0

# We need to copy the fixtures to a temp directory as the user
# running within the Docker container does not have permissions
# to run the sed command on the fixtures directory
fixtures_dir="test/fixtures"
tmp_fixtures_dir="/tmp/test/fixtures"
rm -rf "${tmp_fixtures_dir}"
mkdir -p "${tmp_fixtures_dir}"
cp -R ${fixtures_dir}/* "${tmp_fixtures_dir}"

# Iterate over all test directories
for test_file in $(find "${tmp_fixtures_dir}" -name '*.spec.js'); do
    echo "👁️  ${test_file}"

    slug=$(basename "${test_file}" | sed s/.spec.js$//)
    test_dir=$(dirname "${test_file}")
    test_dir_name=$(basename "${test_dir}")
    test_dir_path=$(realpath "${test_dir}")
    results_file_path="${test_dir_path}/results.json"
    expected_results_file_path="${test_dir_path}/expected_results.json"

    # Make sure there is no existing node_modules directory
    rm -rf "${test_dir_path}/node_modules"

    bin/run.sh "${slug}" "${test_dir_path}" "${test_dir_path}"

    if test -f $expected_results_file_path; then
        echo "${slug}/${test_dir_name}: comparing results.json to expected_results.json"
        diff "${results_file_path}" "${expected_results_file_path}"
    fi;

    if [ $? -ne 0 ]; then
        exit_code=1
    fi
done

exit ${exit_code}
