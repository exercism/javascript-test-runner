// Provides the Jest API used by the track's test files, on top of node:test,
// Jest's own `expect` package and `jest-mock`. setup.mts makes
// `import ... from '@jest/globals'` load this file, and loads it before the
// test file. This file also:
//
// 1. makes the API available as globals, as Jest did.
// 2. replaces `console` with Jest's BufferedConsole, which records each
//    message with the stack it came from. The reporter uses that stack to work
//    out which test printed the message.
// 3. runs the test file's jest.mock calls before the test file loads, as Jest
//    did (see hoistMocks below).
import { BufferedConsole } from '@jest/console'
import { parse } from 'acorn'
import type { Statement } from 'acorn'
import { expect } from 'expect'
import { ModuleMocker } from 'jest-mock'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import {
  after,
  afterEach as nodeAfterEach,
  before,
  beforeEach as nodeBeforeEach,
  describe as nodeDescribe,
  mock,
  test as nodeTest,
} from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { getCallSites } from 'node:util'
import { runInThisContext } from 'node:vm'

/** Collects every console message, for the reporter. */
export const testConsole = new BufferedConsole()
globalThis.console = testConsole

// Jest fails a test or hook that takes longer than 5 seconds.
const TIMEOUT = 5000

type Callback = (error?: unknown) => void
type Result = Promise<void> | void
type TestFn = (done: Callback) => Result

// Jest passes a `done` callback to a function that takes an argument, and
// waits for it to be called. Node does the same for a function that takes two
// arguments (the test context, then `done`).
//
// Jest also failed a test that left a rejected promise unhandled. Node only
// does that if it notices the rejection before the test ends, so a test
// without `done` waits for Node to check for unhandled rejections first.
//
// Node's timer for the timeout can fire during that wait, after a slow test
// has already finished. Jest passed such a test, so a test that has used up
// its time skips the wait.
function wrap(
  fn: TestFn,
  timeout = TIMEOUT
): (context: unknown, done: Callback) => Result {
  return fn.length > 0
    ? (_context, done): Result => fn(done)
    : async (): Promise<void> => {
        const start = performance.now()
        await (fn as () => Result)()
        if (performance.now() - start < timeout) {
          await new Promise<void>((resolve) => {
            setImmediate(resolve)
          })
        }
      }
}

// Jest reported the test file as failed to run when the solution threw an
// error, or left a rejected promise unhandled, while the files were loading
// (for example at its top level). Node's test runner ignores these errors
// when the tests run in its own process. So we keep them here until the
// tests start, and the reporter reports the first one.
export const loadErrors: unknown[] = []

function keepLoadError(error: unknown): void {
  loadErrors.push(error)
}

process.on('uncaughtException', keepLoadError)
process.on('unhandledRejection', keepLoadError)

// Node runs the first test straight after loading the test file, before it
// reports unhandled rejections. So the first describe or test adds a hook
// that waits for those reports before any test runs.
let waitingForLoadErrors = false

function waitForLoadErrors(): void {
  if (waitingForLoadErrors) {
    return
  }
  waitingForLoadErrors = true

  before(async () => {
    await new Promise<void>((resolve) => {
      setImmediate(resolve)
    })
    process.off('uncaughtException', keepLoadError)
    process.off('unhandledRejection', keepLoadError)
  })
}

export function test(name: string, fn: TestFn, timeout = TIMEOUT): void {
  waitForLoadErrors()
  void nodeTest(name, { timeout }, wrap(fn, timeout))
}
test.skip = (name: string, fn: TestFn): void => {
  void nodeTest(name, { skip: true }, wrap(fn))
}

// bin/prepare.sh turns xtest, xit and xdescribe into test, it and describe in
// the test file, so that every test runs.
export const it = test
export const xtest = test.skip
export const xit = test.skip

export function describe(name: string, fn: () => void): void {
  waitForLoadErrors()
  void nodeDescribe(name, () => {
    fn()
  })
}
describe.skip = (name: string, fn: () => void): void => {
  void nodeDescribe(name, { skip: true }, () => {
    fn()
  })
}
export const xdescribe = describe.skip

export function beforeEach(fn: TestFn, timeout = TIMEOUT): void {
  nodeBeforeEach(wrap(fn, timeout), { timeout })
}
export function afterEach(fn: TestFn, timeout = TIMEOUT): void {
  nodeAfterEach(wrap(fn, timeout), { timeout })
}
export function beforeAll(fn: TestFn, timeout = TIMEOUT): void {
  before(wrap(fn, timeout), { timeout })
}
export function afterAll(fn: TestFn, timeout = TIMEOUT): void {
  after(wrap(fn, timeout), { timeout })
}

const mocker = new ModuleMocker(globalThis)
const mockedModules = new Set<string>()

export const jest = {
  fn: mocker.fn.bind(mocker),
  spyOn: mocker.spyOn.bind(mocker),
  mocked: mocker.mocked.bind(mocker),
  replaceProperty: mocker.replaceProperty.bind(mocker),
  clearAllMocks: mocker.clearAllMocks.bind(mocker),
  resetAllMocks: mocker.resetAllMocks.bind(mocker),
  restoreAllMocks: mocker.restoreAllMocks.bind(mocker),

  // Replaces a module with the object returned by `factory`. This uses Node's
  // mock.module, which needs the --experimental-test-module-mocks flag.
  mock(moduleName: string, factory: () => Record<string, unknown>): void {
    const url = pathToFileURL(createRequire(callerFile()).resolve(moduleName))
    if (mockedModules.has(url.href)) {
      // hoistMocks already ran this call, before the test file loaded.
      return
    }
    mockedModules.add(url.href)

    const { default: defaultExport, ...namedExports } = factory()
    mock.module(url.href, { defaultExport, namedExports })
  },
}

/** The file of the function that called the function calling this one. */
function callerFile(): string {
  // [0] is this function, [1] is its caller, and [2] is the caller's caller.
  const file = getCallSites(3)[2]?.scriptName ?? ''
  return file.startsWith('file:') ? fileURLToPath(file) : file
}

export { expect }

Object.assign(globalThis, {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
  test,
  xdescribe,
  xit,
  xtest,
})

// Jest moved each jest.mock call above the imports of the test file (with
// babel-plugin-jest-hoist), so the mock replaced the module before anything
// imported it. Native ES modules load all their imports before any of their
// code runs, which would be too late for the mock. So before Node loads the
// test file, this finds its top-level jest.mock calls with acorn and runs them
// here. As in Jest, a mock factory may only use globals such as `jest`.
function hoistMocks(testFile: string): void {
  const source = fs.readFileSync(testFile, 'utf8')

  let body: Statement[]
  try {
    ;({ body } = parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      allowHashBang: true,
    }) as { body: Statement[] })
  } catch {
    // Node will report the syntax error when it loads the test file.
    return
  }

  const calls = body
    .filter(
      (statement) =>
        statement.type === 'ExpressionStatement' &&
        statement.expression.type === 'CallExpression' &&
        statement.expression.callee.type === 'MemberExpression' &&
        statement.expression.callee.object.type === 'Identifier' &&
        statement.expression.callee.object.name === 'jest' &&
        statement.expression.callee.property.type === 'Identifier' &&
        statement.expression.callee.property.name === 'mock'
    )
    .map((statement) => source.slice(statement.start, statement.end))

  if (calls.length > 0) {
    // Naming the test file lets jest.mock resolve paths from it.
    runInThisContext(calls.join('\n'), { filename: testFile })
  }
}

if (process.env.TEST_FILE) {
  hoistMocks(process.env.TEST_FILE)
}
