// Transforms solutions and test files for Jest.
//
// Most files go through SWC. It produces the same CommonJS as Babel, but it
// is written in Rust and loads and runs much faster than Babel.
//
// Babel still handles two cases, so that every test passes or fails exactly
// as it did with Babel alone:
//
// - Files that call jest.mock (or a related call). SWC does not move these
//   calls above the imports when `jest` is imported from '@jest/globals'.
// - Files that SWC fails to compile. Babel then compiles them, or reports the
//   same syntax error as before.
//
// Babel is only loaded when one of these cases comes up.
const swcJest = require('@swc/jest')

const HOISTED_JEST_CALL =
  /\bjest\s*\.\s*(mock|unmock|enableAutomock|disableAutomock|deepUnmock)\s*\(/

const swc = swcJest.createTransformer({
  swcrc: false,
  env: {
    targets: { node: process.versions.node },
    mode: 'usage',
    coreJs: '3.44',
  },
})

let babel = null
function getBabel() {
  if (!babel) {
    babel = require('babel-jest').default.createTransformer()
  }
  return babel
}

module.exports = {
  process(sourceText, sourcePath, options) {
    if (HOISTED_JEST_CALL.test(sourceText)) {
      return getBabel().process(sourceText, sourcePath, options)
    }

    try {
      return swc.process(sourceText, sourcePath, options)
    } catch {
      return getBabel().process(sourceText, sourcePath, options)
    }
  },
}
