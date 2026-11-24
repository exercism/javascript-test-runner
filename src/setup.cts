// Runs the track's Jest-style test files on Node's built-in test runner.
//
// bin/run.sh preloads this file with `node --require`, so it runs before the
// test file loads. Node loads the solution and the test file as they are, as
// native ES modules. Jest used to load every file through Babel first.
//
// Before the test file loads, this file:
//
// 1. rewrites the import paths in the test file and the files it imports, so
//    Node can find them without a module hook (see imports.ts).
// 2. loads jest-globals.mjs, which provides the Jest API on top of node:test
//    and runs the test file's jest.mock calls.
//
// Worker threads started by a solution also run this file, because they
// inherit Node's options. Only the main thread needs it, and loading the
// Jest API would make every worker start much more slowly.
import { isMainThread } from 'node:worker_threads'
import { rewriteImports } from './imports.js'

if (isMainThread && process.env.TEST_FILE) {
  rewriteImports(process.env.TEST_FILE)

  // Jest ran with --colors, which makes chalk colour the messages from
  // `expect`. Node has no such option, so this adds the flag to the process's
  // arguments, where chalk looks for it, before Jest's packages load.
  process.argv.push('--colors')

  // jest-globals.mjs is an ES module, and Node can require it because it has
  // no top-level await.
  require('./jest-globals.mjs')
}
