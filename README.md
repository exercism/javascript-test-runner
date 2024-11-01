# Exercism JavaScript Test Runner

[![javascript-test-runner / deploy](https://github.com/exercism/javascript-test-runner/actions/workflows/deploy.yml/badge.svg)](https://github.com/exercism/javascript-test-runner/actions/workflows/deploy.yml) [![javascript-test-runner / main](https://github.com/exercism/javascript-test-runner/actions/workflows/ci.js.yml/badge.svg)](https://github.com/exercism/javascript-test-runner/actions/workflows/ci.js.yml)

The Docker image for automatically run tests on JavaScript solutions submitted to [exercism][web-exercism].

## Installation

Clone this repository and then run:

```shell
corepack enable pnpm
corepack pnpm install
```

You'll need at least Node LTS for this to work.

```shell
corepack pnpm build
```

## Usage

If you're developing this, you can run this via `corepack pnpm` or the provided shell script.

- `.sh` enabled systems (UNIX, WSL): `corepack pnpm execute:dev`
- `.bat` fallback (cmd.exe, Git Bash for Windows): _unsupported_

You'll want these `:dev` variants because it will _build_ the required code (it will transpile from TypeScript to JavaScript, which is necessary to run this in Node environments, unlike Deno environments).
When on Windows, if you're using Git Bash for Windows or a similar terminal, the `.sh` files will work, but will open a new window (which closes after execution).
The `.bat` scripts will work in the same terminal.
In this case it might be much easier to run `bin/run.sh` directly, so a new shell won't open.

You can also manually build using `corepack pnpm build`, and then run the script directly: `./bin/run.sh arg1 arg2 arg3`.

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

...

Determining test suites to run...
Find the output at:
./tmp/clock/a7d1b71693fb4298a3a99bd352dd4d74/clock/results.json
```

As you can see, it will be copied to a local directory.
It's up to you to clean-up this directory.

## Running the Solution's Tests in Docker container

_This script is provided for testing purposes_

To run a solution's test in the Docker container, do the following:

1. Open terminal in project's root
2. Run `./run-in-docker.sh <exercise-slug> <relative-path-to-solution-folder>`

## Maintaining

The `package.json` needs to be in-sync with the [`javascript` track `package.json`][git-javascript].

### Testing

Running the tests of the test-runner itself can be achieved by using the `test` script from `package.json`.
The tests delegate to the _build output_, which is why `corepack pnpm test` first calls `corepack pnpm build` before running `jest`.

You can run individual test sets:

```shell
$ corepack pnpm node test/skip.test.mjs

skipping via test.skip > passing solution
assert pass
```

Or turn on output by setting `SILENT=0`. On Windows (requires Git Bash or similar) that would become:

```shell
$ corepack pnpm dlx cross-env SILENT=0 corepack pnpm node test/skip.test.mjs

skipping via test.skip > passing solution

╔═════════════════════════════════════════════════════════════╗
  🔧 Process input arguments for run
╚═════════════════════════════════════════════════════════════╝

✔️  Using reporter : C:/Users/Derk-Jan/Documents/GitHub/exercism/javascript-test-runner/dist/reporter.js
✔️  Using test-root: C:/Users/Derk-Jan/Documents/GitHub/exercism/javascript-test-runner/test/fixtures/pythagorean-triplet/exemplar/
✔️  Using base-root: C:/Users/Derk-Jan/Documents/GitHub/exercism/javascript-test-runner
✔️  Using setup-env: C:/Users/Derk-Jan/Documents/GitHub/exercism/javascript-test-runner/dist/jest/setup.js

╔═════════════════════════════════════════════════════════════╗
  🔧 Preparing run
╚═════════════════════════════════════════════════════════════╝

Input does not match output directory.
👁️  C:/Users/Derk-Jan/AppData/Local/Temp/foo-wkg81W/
✔️  Copying C:/Users/Derk-Jan/Documents/GitHub/exercism/javascript-test-runner/test/fixtures/pythagorean-triplet/exemplar/ to output.

If the solution contains babel.config.js or package.json at
the root, these configuration files will be used during the
test-runner process which we do not want.
The test-runner will therefore temporarily rename these files.

✔️  renaming babel.config.js in output so it can be replaced.
✔️  renaming package.json in output so it can be replaced.

The output directory is likely not placed inside the test
runner root. This means the CLI tools need configuration
files as given and understood by the test-runner for running
the tests. Will now turn the output directory into a
standalone package.

✔️  pnpm cache from root to output
✔️  .pnpm-lock.yaml from root to output
✔️  babel.config.js from root to output
✔️  package.json from root to output
✔️  .npmrc from root to output

The results of this run will be written to 'results.json'.
👁️  C:/Users/Derk-Jan/AppData/Local/Temp/foo-wkg81W/results.json

╔═════════════════════════════════════════════════════════════╗
  🔧 Preparing test suite file(s)
╚═════════════════════════════════════════════════════════════╝

There is a configuration file in the expected .meta location
which will now be used to determine which test files to prep.
👁️  C:/Users/Derk-Jan/Documents/GitHub/exercism/javascript-test-runner/test/fixtures/pythagorean-triplet/exemplar/.meta/config.json
{
  "blurb": "There exists exactly one Pythagorean triplet for which a + b + c = 1000. Find the product a * b * c.",
  "authors": ["matthewmorgan"],
  "contributors": [
    "ankorGH",
    "rchavarria",
    "ryanplusplus",
    "SleeplessByte",
    "tejasbubane",
    "xarxziux"
  ],
  "files": {
    "solution": ["pythagorean-triplet.js"],
    "test": ["pythagorean-triplet.spec.js"],
    "example": [".meta/proof.ci.js"]
  },
  "source": "Problem 9 at Project Euler",
  "source_url": "http://projecteuler.net/problem=9"
}

Enabling tests in C:/Users/Derk-Jan/AppData/Local/Temp/foo-wkg81W/pythagorean-triplet.spec.js

╔═════════════════════════════════════════════════════════════╗
  🔧 Preparing test project
╚═════════════════════════════════════════════════════════════╝

✔️  enabling corepack
✔️  pnpm version now: 9.7.0

✔️  standalone package found

total 2865
drwxr-xr-x 1 197612 197612      0 Aug  7 23:54 .
drwxr-xr-x 1 197612 197612      0 Aug  7 23:54 ..
drwxr-xr-x 1 197612 197612      0 Aug  7 23:54 .docs
-rw-r--r-- 1 197612 197612    132 Aug  7 23:54 .eslintignore
-rw-r--r-- 1 197612 197612    318 Aug  7 23:54 .eslintrc
drwxr-xr-x 1 197612 197612      0 Aug  7 23:54 .meta
-rw-r--r-- 1 197612 197612     33 Aug  7 23:54 .npmrc
-rw-r--r-- 1 197612 197612    248 Aug  7 23:54 babel.config.js
-rw-r--r-- 1 197612 197612    251 Aug  7 23:54 babel.config.js.💥.bak
-rw-r--r-- 1 197612 197612   2341 Aug  7 23:54 expected_results.json
drwxr-xr-x 1 197612 197612      0 Aug  7 23:54 node_modules
-rw-r--r-- 1 197612 197612   2229 Aug  7 23:54 package.json
-rw-r--r-- 1 197612 197612    859 Aug  7 23:54 package.json.💥.bak
-rw-r--r-- 1 197612 197612 194571 Aug  7 23:54 pnpm-lock.yaml
-rw-r--r-- 1 197612 197612    969 Aug  7 23:54 pythagorean-triplet.js
-rw-r--r-- 1 197612 197612   1865 Aug  7 23:54 pythagorean-triplet.spec.js

Found .pnpm hoisted packages
total 288
drwxr-xr-x 1 197612 197612      0 Aug  7 23:54 .
drwxr-xr-x 1 197612 197612      0 Aug  7 23:54 ..
-rw-r--r-- 1 197612 197612 194571 Aug  7 23:54 lock.yaml

╔═════════════════════════════════════════════════════════════╗
  ➤  Execution (tests: does the solution work?)
╚═════════════════════════════════════════════════════════════╝

✔️  jest tests (*.spec.js) discovered.
C:\Users\Derk-Jan\AppData\Local\Temp\foo-wkg81W\pythagorean-triplet.spec.js

⚙️  corepack pnpm jest <...>

✅ all tests (*.spec.js) passed.

If the solution previously contained configuration files,
they were disabled and now need to be restored.

✔️  restoring babel.config.js in output
✔️  restoring package.json in output

---------------------------------------------------------------
The results of this run have been written to 'results.json'.
👁️  C:/Users/Derk-Jan/AppData/Local/Temp/foo-wkg81W/results.json

assert pass 🥳
```

[web-exercism]: https://exercism.io
[git-automated-tests]: https://github.com/exercism/automated-tests
[git-javascript]: https://github.com/exercism/javascript
