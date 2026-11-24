// Runs the track's Jest-style test files on Node's built-in test runner.
//
// bin/run.sh preloads this file with `node --require`, so it runs before the
// test file loads. Node loads the solution and the test file as they are, as
// native ES modules. Jest used to load every file through Babel first.
//
// Before the test file loads, this file:
//
// 1. registers a module hook, so Node finds `@jest/globals` and files
//    imported without their extension, as Jest did.
// 2. loads jest-globals.mjs, which provides the Jest API on top of node:test
//    and runs the test file's jest.mock calls.
// 3. loads the core-js polyfills for built-ins missing from the image's Node.
//
// Worker threads started by a solution also run this file, because they
// inherit Node's options. They need the hook and the polyfills. Loading the
// Jest API would make every worker start much more slowly, so only the main
// thread loads it.
import { registerHooks } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { isMainThread } from 'node:worker_threads'

const JEST_GLOBALS = path.join(__dirname, 'jest-globals.mjs')

// Jest found these imports itself. Node only finds `@jest/globals` in a
// node_modules folder, and a relative import only if it names the file in
// full. The track's test files name every file in full, but solutions to
// earlier versions of the exercises, and many students' own files, leave out
// the extension. So if Node can't find a relative import, this tries it with
// `.js` and then as a folder with `index.js`, as Jest did. Solutions still
// can't import any of the runner's other packages.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@jest/globals') {
      return { url: pathToFileURL(JEST_GLOBALS).href, shortCircuit: true }
    }

    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
        throw error
      }
      for (const candidate of [`${specifier}.js`, `${specifier}/index.js`]) {
        try {
          return nextResolve(candidate, context)
        } catch {
          // Try the next one. If none exists, report the original error.
        }
      }
      throw error
    }
  },
})

if (isMainThread && process.env.TEST_FILE) {
  // Jest ran with --colors, which makes chalk colour the messages from
  // `expect`. Node has no such option, so this adds the flag to the process's
  // arguments, where chalk looks for it, before Jest's packages load.
  process.argv.push('--colors')

  // jest-globals.mjs is an ES module, and Node can require it because it has
  // no top-level await.
  require(JEST_GLOBALS)
}

// Jest compiled each file with Babel, which added a core-js polyfill for each
// built-in that the file used and the image's Node lacked. Loading the few
// polyfills this Node needs on every run is cheaper than finding which ones
// each file uses.
//
// The list holds core-js's stable features missing from Node 24.18 (see the
// Dockerfile). After changing either version, regenerate it with:
//
//   node -p "require('core-js-compat')({ targets: { node: '24.18' }, modules: ['core-js/stable'], version: require('core-js/package.json').version }).list"
const CORE_JS_MODULES = [
  'es.iterator.concat',
  'es.map.get-or-insert',
  'es.map.get-or-insert-computed',
  'es.math.sum-precise',
  'es.async-iterator.async-dispose',
  'es.uint8-array.from-base64',
  'es.uint8-array.from-hex',
  'es.uint8-array.set-from-base64',
  'es.uint8-array.set-from-hex',
  'es.uint8-array.to-base64',
  'es.uint8-array.to-hex',
  'es.weak-map.get-or-insert',
  'es.weak-map.get-or-insert-computed',
  'web.self',
  'web.structured-clone',
]
for (const name of CORE_JS_MODULES) {
  require(`core-js/modules/${name}`)
}
