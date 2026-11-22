// Finds the tests in a test file, so the reporter can show each test's code
// and work out which test printed each console message.
//
// This used to be done by @exercism/static-analysis, which parses with
// @typescript-eslint/typescript-estree. That package loads the whole
// TypeScript compiler (about 9 MB of JavaScript) on every run, which took
// about a quarter of each run. Test files are plain JavaScript, so acorn, a
// small JavaScript parser, can read them in a fraction of the time.
import { parse } from 'acorn'
import type {
  AnyNode,
  ArrowFunctionExpression,
  CallExpression,
  Expression,
  FunctionExpression,
  Literal,
  Node,
  SourceLocation,
} from 'acorn'

type TestFunction = (FunctionExpression | ArrowFunctionExpression) & {
  loc: SourceLocation
}

export interface TestCase {
  /** The function passed to test(...) */
  testNode: TestFunction
  description: string[]
  test: string
  /** The number of top-level describe blocks up to and including this test */
  topLevelIndex: number
  name: (glue?: string) => string
  testCode: (source: string) => string
}

export interface ParsedTests {
  source: string
  tests: TestCase[]
}

const DESCRIBES = ['describe', 'xdescribe']
const TESTS = ['test', 'xtest', 'it', 'xit']
const MODIFIERS = ['skip', 'only']

function isIdentifier(node: Node, names: string[]): boolean {
  return (
    node.type === 'Identifier' &&
    names.includes((node as AnyNode & { name: string }).name)
  )
}

function isStringLiteral(
  node: Node | undefined
): node is Literal & { value: string } {
  return node?.type === 'Literal' && typeof (node as Literal).value === 'string'
}

// describe('...'), describe.skip('...'), xdescribe.only('...') and so on
function isDescribe(node: Expression): boolean {
  if (node.type !== 'CallExpression') return false
  const { callee } = node
  if (callee.type === 'Identifier') return DESCRIBES.includes(callee.name)
  return (
    callee.type === 'MemberExpression' &&
    isIdentifier(callee.object, DESCRIBES) &&
    (isIdentifier(callee.property, MODIFIERS) ||
      (isStringLiteral(callee.property) &&
        MODIFIERS.includes(callee.property.value)))
  )
}

// test('...'), it.skip('...'), xtest.only('...') and so on
function isTest(node: Expression): boolean {
  if (node.type !== 'CallExpression') return false
  const { callee } = node
  if (callee.type === 'Identifier') return TESTS.includes(callee.name)
  return (
    callee.type === 'MemberExpression' &&
    isIdentifier(callee.object, TESTS) &&
    isIdentifier(callee.property, MODIFIERS)
  )
}

function isTestFunction(node: Node | undefined): node is TestFunction {
  return (
    node?.type === 'FunctionExpression' ||
    node?.type === 'ArrowFunctionExpression'
  )
}

function sourceOf(source: string, node: Node): string {
  return source.substring(node.start, node.end)
}

function isNode(value: unknown): value is Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  )
}

function children(node: Node): Node[] {
  const result: Node[] = []
  Object.entries(node).forEach(([key, value]) => {
    if (key === 'loc') return
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (isNode(item)) result.push(item)
      })
    } else if (isNode(value)) {
      result.push(value)
    }
  })
  return result
}

/**
 * Finds the tests in the same way as @exercism/static-analysis did. Tests
 * and describe blocks named with anything other than a string literal (such
 * as a template literal) are left out.
 */
export function parseTests(source: string): ParsedTests {
  const program = parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
    allowHashBang: true,
  })

  const tests: TestCase[] = []
  const description: string[] = []
  let topLevelDescribes = 0

  function visit(node: Node): void {
    if (node.type === 'ExpressionStatement') {
      const { expression } = node as AnyNode & { expression: Expression }

      if (isDescribe(expression)) {
        const [nameArgument] = (expression as CallExpression).arguments
        if (!isStringLiteral(nameArgument)) return

        if (description.length === 0) topLevelDescribes += 1
        description.push(nameArgument.value)
        children(node).forEach(visit)
        description.pop()
        return
      }

      if (isTest(expression)) {
        const [nameArgument, testArgument] = (expression as CallExpression)
          .arguments
        if (isStringLiteral(nameArgument) && isTestFunction(testArgument)) {
          tests.push(
            createTestCase(
              testArgument,
              [...description],
              nameArgument.value,
              topLevelDescribes
            )
          )
        }
        return
      }
    }

    children(node).forEach(visit)
  }

  visit(program)
  return { source, tests }
}

function createTestCase(
  testNode: TestFunction,
  description: string[],
  test: string,
  topLevelIndex: number
): TestCase {
  return {
    testNode,
    description,
    test,
    topLevelIndex,
    name(glue = ' > '): string {
      return [...description, test].join(glue)
    },
    testCode(source: string): string {
      if (testNode.body.type === 'BlockStatement') {
        return testNode.body.body
          .map((statement) => sourceOf(source, statement))
          .join('\n')
      }
      return sourceOf(source, testNode.body)
    },
  }
}
