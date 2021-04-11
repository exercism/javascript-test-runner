# Exercism JavaScript Test Runner

[![javascript-test-runner / deploy](https://github.com/exercism/javascript-test-runner/actions/workflows/deploys.yml/badge.svg)](https://github.com/exercism/javascript-test-runner/actions/workflows/deploys.yml) [![javascript-test-runner / main](https://github.com/exercism/javascript-test-runner/actions/workflows/ci.js.yml/badge.svg)](https://github.com/exercism/javascript-test-runner/actions/workflows/ci.js.yml)

The Docker image for automatically run tests on JavaScript solutions submitted to [exercism][web-exercism].

> At this moment, the input path _must_ be relative to the `package.json` of this respository. `jest` doesn't like running outside of its tree. This might change in the future.

## Installation

Clone this repository and then run:

```bash
yarn install
```

You'll need at least Node LTS for this to work.

```
yarn build
```

## Usage

If you're developing this, you can run this via `yarn` or the provided shell script.

- `.sh` enabled systems (UNIX, WSL): `yarn execute:dev`
- `.bat` fallback (cmd.exe, Git Bash for Windows): _unsupported_

You'll want these `:dev` variants because it will _build_ the required code (it will transpile from TypeScript to JavaScript, which is necessary to run this in Node environments, unlike Deno environments). When on Windows, if you're using Git Bash for Windows or a similar terminal, the `.sh` files will work, but will open a new window (which closes after execution). The `.bat` scripts will work in the same terminal. In this case it might be much easier to run `bin/run.sh` directly, so a new shell won't open.

You can also manually build using `yarn` or `yarn build`, and then run the script directly: `./bin/run.sh arg1 arg2 arg3`.

## Running the Solution's Tests

To run a solution's tests, do the following:

1. Open terminal in project's root
2. Run `./bin/run.sh <exercise-slug> <path-to-solution-folder> [<path-to-output-folder>]`

For example:

```shell
$ ./bin/run.sh two-fer ./test/fixtures/two-fer/pass

PASS  test/fixtures/two-fer/pass/two-fer.spec.js
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        2.817s
Find the output at:
test/fixtures/two-fer/pass/results.json
```

## Running the Tests of a Remote Solution

Instead of passing in an `<exercises-slug>` and `<path-to-solution-folder>`, you can also directly pass in an `https://exercism.io` url, as long as you have the `exercism` CLI installed.

You can pass the following type of URLs:

- Published solutions: `/tracks/javascript/exercises/<slug>/<id>`
- Mentor solutions: `/mentor/solutions/<id>`
- Your solutions: `/my/solutions/<id>`
- Private solutions: `/solutions/<id>`

For example:

```
$ ./bin/run.sh https://exercism.io/my/solutions/a7d1b71693fb4298a3a99bd352dd4d74
Exercism remote UUID: a7d1b71693fb4298a3a99bd352dd4d74

Downloaded to
C:\Users\Derk-Jan\Exercism\javascript\clock
PASS  tmp/clock/a7d1b71693fb4298a3a99bd352dd4d74/clock/clock.spec.js
Test Suites: 1 passed, 1 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        2.987s
Find the output at:
./tmp/clock/a7d1b71693fb4298a3a99bd352dd4d74/clock/results.json
```

As you can see, it will be copied to a local directory. It's up to you to clean-up this directory.

## Running the Solution's Tests in Docker container

_This script is provided for testing purposes_

To run a solution's test in the Docker container, do the following:

1. Open terminal in project's root
2. Run `./run-in-docker.sh <exercise-slug> <relative-path-to-solution-folder>`

## Maintaining

The `package.json` needs to be in-sync with the [`javascript` track `package.json`][git-javascript].

### Testing

Running the tests of the test-runner itself can be achieved by using the `test` script from `package.json`. The tests delegate to the _build output_, which is why `yarn test` first calls `yarn build` before running `jest`. **The tests take over a minute to run on a decent machine**.

[web-exercism]: https://exercism.io
[git-automated-tests]: https://github.com/exercism/automated-tests
[git-javascript]: https://github.com/exercism/javascript
