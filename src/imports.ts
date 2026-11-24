// Rewrites the import paths in the test file, and in the files it imports, so
// that Node's own module loader can find every file. setup.cts calls this
// before the test file loads.
//
// Jest found these files itself. Node only finds a relative import if it
// names the file in full, and only finds `@jest/globals` in a node_modules
// folder. A module hook could fix both while the files load, but Node's hooks
// are not yet stable. So this changes the paths in the files instead:
//
// - `'./two-fer'` becomes `'./two-fer.js'` if two-fer.js exists, and
//   `'./lib'` becomes `'./lib/index.js'` if lib is a folder. The track's
//   files name the file in full, but solutions to earlier versions of the
//   exercises, and many students' own files, leave out the extension.
// - `'@jest/globals'` becomes the path of the runner's jest-globals.mjs. So
//   solutions still can't import any of the runner's packages.
//
// The files are parsed with acorn, so text in strings and comments is never
// changed. A file that fails to parse is left alone, and Node will report the
// syntax error when it loads the file.
import { parse } from 'acorn'
import type { Node } from 'acorn'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const JEST_GLOBALS = path.join(__dirname, 'jest-globals.mjs')

interface Edit {
  start: number
  end: number
  text: string
}

type StringLiteral = Node & { type: 'Literal'; value: string; raw: string }

export function rewriteImports(entryFile: string): void {
  const visited = new Set<string>()

  function visit(file: string): void {
    if (visited.has(file)) {
      return
    }
    visited.add(file)

    const source = fs.readFileSync(file, 'utf8')
    let program: Node
    try {
      program = parse(source, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowHashBang: true,
      })
    } catch {
      return
    }

    const edits: Edit[] = []
    for (const { literal, isRequire } of importPaths(program)) {
      const specifier = literal.value
      let replacement: string | undefined

      if (specifier === '@jest/globals') {
        replacement = isRequire
          ? JEST_GLOBALS
          : pathToFileURL(JEST_GLOBALS).href
      } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
        const target = path.resolve(path.dirname(file), specifier)
        const found = findFile(target)
        if (found) {
          visit(found)
          // require() finds a file without its extension by itself.
          if (!isRequire && found !== target) {
            replacement = specifier + found.slice(target.length)
          }
        }
      }

      if (replacement !== undefined) {
        const quote = literal.raw[0]
        edits.push({
          start: literal.start,
          end: literal.end,
          text: `${quote}${replacement}${quote}`,
        })
      }
    }

    if (edits.length === 0) {
      return
    }

    let rewritten = source
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      rewritten =
        rewritten.slice(0, edit.start) + edit.text + rewritten.slice(edit.end)
    }
    fs.writeFileSync(file, rewritten)
  }

  visit(path.resolve(entryFile))
}

/** Finds the file Jest would load for a relative import, as Jest did. */
function findFile(target: string): string | undefined {
  for (const candidate of [
    target,
    `${target}.js`,
    path.join(target, 'index.js'),
  ]) {
    if (fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()) {
      return candidate
    }
  }
  return undefined
}

/**
 * The string paths in import and export declarations, in `import()`, and in
 * `require()` calls.
 */
function importPaths(
  program: Node
): { literal: StringLiteral; isRequire: boolean }[] {
  const found: { literal: StringLiteral; isRequire: boolean }[] = []

  function walk(node: Node): void {
    const value = node as Node & Record<string, unknown>

    if (
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportAllDeclaration' ||
      node.type === 'ImportExpression'
    ) {
      if (isStringLiteral(value.source)) {
        found.push({ literal: value.source, isRequire: false })
      }
    } else if (node.type === 'CallExpression') {
      const callee = value.callee as Node & { name?: string }
      const [first] = value.arguments as Node[]
      if (
        callee.type === 'Identifier' &&
        callee.name === 'require' &&
        isStringLiteral(first)
      ) {
        found.push({ literal: first, isRequire: true })
      }
    }

    for (const child of Object.values(value)) {
      if (Array.isArray(child)) {
        child.forEach((item) => {
          if (isNode(item)) walk(item)
        })
      } else if (isNode(child)) {
        walk(child)
      }
    }
  }

  walk(program)
  return found
}

function isNode(value: unknown): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  )
}

function isStringLiteral(value: unknown): value is StringLiteral {
  return (
    isNode(value) &&
    value.type === 'Literal' &&
    typeof (value as { value?: unknown }).value === 'string'
  )
}
