@REM Only works in bash for windows and similar terminals that accept / paths

@REM Synopsis:
@REM Test runner for run.sh in a docker container
@REM Takes the same arguments as run.sh (EXCEPT THAT SOLUTION AND OUTPUT PATH ARE RELATIVE)
@REM Builds the Dockerfile
@REM Runs the docker image passing along the initial arguments

@REM Arguments:
@REM $1: exercise slug
@REM $2: **RELATIVE** path to solution folder (without trailing slash)
@REM $3: **RELATIVE** path to output directory (without trailing slash)

@REM Output:
@REM Writes the tests output to the output directory

@REM Example:
@REM ./run-in-docker.bat two-fer ./relative/path/to/two-fer/solution/folder/ ./relative/path/to/output-directory/
@REM ./run-in-docker.bat two-fer ./test/fixtures/two-fer/pass ./test/fixtures/two-fer/pass

@REM build docker image
docker build -t javascript-test-runner .

@REM run image passing the arguments
docker run^
 --network none^
 --read-only^
 --mount type=bind,src=%cd%/%2,dst=/solution/^
 --mount type=bind,src=%cd%/%3,dst=/output/^
 --mount type=tmpfs,dst=/tmp:exec^
 javascript-test-runner %1 /solution/ /output/
