#!/usr/bin/env sh

# Synopsis:
# Test the test runner Docker image by running it against a predefined set of 
# solutions with an expected output.
# The test runner Docker image is built automatically.

# Output:
# Outputs the diff of the expected test results against the actual test results
# generated by the test runner Docker image.

# Example:
# ./bin/run-tests-in-docker.sh

# Stop executing when a command returns a non-zero return code
set -e

# Build the Docker image
docker build --rm -t exercism/javascript-test-runner .

# Run the Docker image using the settings mimicking the production environment
docker run \
    --rm \
    --network none \
    --read-only \
    --mount type=bind,src="${PWD}/test/fixtures",dst=/opt/test-runner/test/fixtures \
    --mount type=tmpfs,dst=/tmp \
    --volume "${PWD}/bin/run-tests.sh:/opt/test-runner/bin/run-tests.sh" \
    --workdir /opt/test-runner \
    --entrypoint /opt/test-runner/bin/run-tests.sh \
    exercism/javascript-test-runner
