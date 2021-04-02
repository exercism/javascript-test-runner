# Changelog

## 2.3.1

- Install `jq` into the Docker image

## 2.3.0

- Enable `.meta/config.json`
- Add test that _requires_ `.meta/config.json` files to be set

## 2.2.1

- Upgrade `@exercism/static-analysis`
- Make sure all peer deps are listed as deps

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
