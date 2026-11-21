// Transforms solutions and test files for Jest.
//
// Most files go through esbuild. It turns modern JavaScript into CommonJS
// like Babel does, but it is written in Go and loads and runs much faster.
//
// Babel still handles two cases, so that every test passes or fails exactly
// as it did with Babel alone:
//
// - Files that call jest.mock (or a related call). Only Babel moves these
//   calls above the imports, which Jest needs for the mock to apply.
// - Files that esbuild fails to compile. Babel then compiles them, or reports
//   the same syntax error as before.
//
// Babel is only loaded when one of these cases comes up.
const esbuild = require('esbuild')

const HOISTED_JEST_CALL =
  /\bjest\s*\.\s*(mock|unmock|enableAutomock|disableAutomock|deepUnmock)\s*\(/

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
      const { code, map } = esbuild.transformSync(sourceText, {
        format: 'cjs',
        loader: 'js',
        target: `node${process.versions.node}`,
        sourcefile: sourcePath,
        // Babel runs every file in strict mode, so that, for example,
        // assigning to a getter-only property throws.
        banner: '"use strict";',
        sourcemap: 'external',
        sourcesContent: false,
      })
      return { code, map }
    } catch {
      return getBabel().process(sourceText, sourcePath, options)
    }
  },
}
