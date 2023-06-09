# Changelog

## 4.0.0

- Update dependencies including core-js
- Update Yarn to stable (3+)
- Update bin/\* to use Yarn 3
- Update package.json to use Yarn 3
- Fix linting issues

## 3.3.1

- Fix debug logging
- Add test for logging

## 3.3.0

- Change implementation to re-enable babel

## 3.2.2

- Change version of core-js to exact match

## 3.2.1

- Add core-js to package.json of test-runner

## 3.2.0

- Change to jest 29
- Change to newer AST generator
- Change core-js to latest

## 3.1.1

- Fix `src/jest/setup.ts` extraneous content
- Change dependencies to latest version

## 3.1.0

- Add support for version 3 output
- Add config.json based handling of task IDs
- Add support for `.exercism` instead of `.meta` for downloaded exercises.

## 3.0.0

- Change to Jest 27
- Add sanitization of jest reported syntax errors

## 2.5.1

- Fix skipped tests showing up as failed despite passed complete status.

## 2.5.0

- Add allow skipping/pending tests (`test.skip`)

## 2.4.0

- Add `prettier`
- Change dependencies to latest versions

## 2.3.3

- Fix a bug with the output generation
- Change dependencies to latest versions

## 2.3.2

- Add `version: 2` to output

## 2.3.1

- Add `jq` installation into the Docker image

## 2.3.0

- Add support for `.meta/config.json`
- Add test that _requires_ `.meta/config.json` files to be set

## 2.2.1

- Change `@exercism/static-analysis` to latest version
- Fix peer dependencies: make sure all peer deps are listed as deps

## 2.2.0

- Add `test_code` when available
- Fix `output` when there is none (previously `""`, now `null`)

## 2.1.0

- Add `output` per test (user `console.log`)
- Add `message` and `status: fail` when there are 0 tests

## 2.0.0

- Add deploy to dockerhub
- Add build and run tests on commit
- Add build and run tests on pr
- Add format action workflow
- Add third argument in binary usage
- Add aliases of various binaries
- Add remote solution execution
- Add fallback for arguments without trailing /
- Update traversal of AST to use @typescript-estree
- Update dependencies
- Change LICENSE from MIT to AGPL-3.0-or-later

## 1.0.0

Initial release
