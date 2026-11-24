// Runs the track's Jest-style test files on Node's built-in test runner.
//
// bin/run.sh preloads this file with `node --import`, so it runs before the
// test file loads. Node loads the solution and the test file as they are, as
// native ES modules. Jest used to load every file through Babel first.
//
// This file registers a module hook that does two things:
//
// 1. It makes `import ... from '@jest/globals'` load jest-globals.mjs, which
//    provides the Jest API on top of node:test.
// 2. It lets relative imports leave out the `.js` extension, as Jest did
//    (`import { twoFer } from './two-fer'`).
//
// Worker threads started by a solution also run this file, because they
// inherit Node's options. They only need the hook, so they don't load the
// Jest API, which would make every worker start much more slowly.
import { registerHooks } from 'node:module'
import { isMainThread } from 'node:worker_threads'

const jestGlobals = new URL('./jest-globals.mjs', import.meta.url).href

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@jest/globals') {
      return { url: jestGlobals, shortCircuit: true }
    }

    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND' &&
        specifier.startsWith('.')
      ) {
        return nextResolve(`${specifier}.js`, context)
      }
      throw error
    }
  },
})

if (isMainThread) {
  // Jest ran with --colors, which makes chalk colour the messages from
  // `expect`. Node has no such option, so this adds the flag to the process's
  // arguments, where chalk looks for it, before Jest's packages load.
  process.argv.push('--colors')
  await import(jestGlobals)
}
