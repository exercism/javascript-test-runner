# Exercism JavaScript Test Runner

The Docker image for automatically run tests on JavaScript solutions submitted to [exercism][web-exercism].

## Running the Tests

To run a solution's tests, do the following:
1. Open terminal in project's root
2. Run `./run.sh <exercise-slug> <path-to-solution-folder>`

## Running the Tests in Docker container

*This script is provided for testing purposes*

To run a solution's test in the Docker container, do the following:
1. Open terminal in project's root
2. Run `./run-in-docker.sh <exercise-slug> <relative-path-to-solution-folder>`

## Maintaining

The `package.json` needs to be in-sync with the [`javascript` track `package.json`][git-javascript].

### Known issues

* The output format of the tests still does not conform to the [exercism automated tests][git-automated-tests] standard.

[web-exercism]: https://exercism.io
[git-automated-tests]: https://github.com/exercism/automated-tests
[git-javascript]: https://github.com/exercism/javascript
