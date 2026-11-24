// A reporter for Node's test runner (`node --test --test-reporter`). It
// collects the result of each test from the runner's events, then writes
// results.json through Output, as the Jest reporter did.
//
// bin/run.sh runs the tests with --test-isolation=none, so the tests,
// jest-globals.mjs and this reporter share one process. That lets the reporter
// read the console messages collected by jest-globals.mjs.
//
// Node gives reporters no options, so run.sh passes the test file and the
// results file in the TEST_FILE and RESULTS_FILE environment variables.
import path from 'node:path'
import type { TestEvent } from 'node:test/reporters'
import { fileURLToPath } from 'node:url'
import { inspect } from 'node:util'
import { Output } from './output.js'
import type { AggregatedResult, AssertionResult, TestResult } from './output.js'

const RUNNER_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

type TestFailure = Error & { code?: string; failureType?: string }

export default async function* reporter(
  source: AsyncIterable<TestEvent>
): AsyncGenerator<string> {
  const testFile = process.env.TEST_FILE ?? ''
  const output = new Output(process.env.RESULTS_FILE ?? 'results.json')

  const ancestors: string[] = []
  const results: AssertionResult[] = []
  let pendingSuites = 0

  // Set when the test file can't run: it fails to load, or a describe block
  // throws. Jest reported both as a test suite that failed to run.
  let failureMessage: string | undefined

  for await (const event of source) {
    if (event.type === 'test:start') {
      ancestors[event.data.nesting] = event.data.name
    }

    if (event.type !== 'test:pass' && event.type !== 'test:fail') {
      continue
    }

    const { data } = event
    const error =
      event.type === 'test:fail'
        ? (event.data.details.error as TestFailure)
        : undefined

    // Node reports a file that fails to load as a failed test, with the
    // error itself. Every other failure wraps the error in ERR_TEST_FAILURE.
    if (error && error.code !== 'ERR_TEST_FAILURE') {
      failureMessage ??= formatError(error, testFile)
      continue
    }

    // Node reports a test file that defines no tests as one passing test,
    // named after the file. Jest reported that the file failed to run.
    if (data.nesting === 0 && data.name === data.file) {
      failureMessage ??= 'Your test suite must contain at least one test.'
      continue
    }

    if (data.details.type === 'suite') {
      if (data.skip) {
        pendingSuites += 1
      }
      if (error?.failureType === 'testCodeFailure') {
        failureMessage ??= formatError(error, testFile)
      }
      continue
    }

    results.push({
      ancestorTitles: ancestors.slice(0, data.nesting),
      title: data.name,
      status: data.skip || data.todo ? 'pending' : error ? 'failed' : 'passed',
      failureMessages: error ? [formatError(error, testFile)] : [],
    })
  }

  // Node loads this reporter before the preloaded setup.mts, so this file
  // imports jest-globals.mjs only now, to let setup.mts load it first.
  const { loadErrors, testConsole } = await import('./jest-globals.mjs')

  if (loadErrors.length > 0) {
    failureMessage ??= formatError(loadErrors[0] as TestFailure, testFile)
  }

  const testResult: TestResult = {
    testFilePath: testFile,
    failureMessage,
    console: testConsole.getBuffer(),
    testResults: results,
  }

  const count = (status: AssertionResult['status']): number =>
    results.filter((result) => result.status === status).length

  const aggregatedResults: AggregatedResult = {
    numFailedTests: count('failed'),
    numFailedTestSuites: count('failed') > 0 ? 1 : 0,
    numPassedTests: count('passed'),
    numPendingTests: count('pending'),
    numPendingTestSuites: pendingSuites,
    numRuntimeErrorTestSuites: failureMessage ? 1 : 0,
    testResults: [testResult],
  }

  output.testFinished(testFile, testResult, aggregatedResults)
  output.finish(aggregatedResults)

  yield `${aggregatedResults.numPassedTests} passed, ${aggregatedResults.numFailedTests} failed\n`
}

/**
 * Turns an error into a message in the shape Jest gave: the error's own stack,
 * without the frames of the test function and the runner. So the message
 * keeps the frames in the student's code.
 */
function formatError(error: TestFailure, testFile: string): string {
  // Node wraps the error from a failed test or hook in ERR_TEST_FAILURE.
  const cause: unknown = error.code === 'ERR_TEST_FAILURE' ? error.cause : error

  if (cause instanceof Error && typeof cause.stack === 'string') {
    return cutStack(cause.stack, testFile)
  }

  if (
    error.code === 'ERR_TEST_FAILURE' &&
    error.failureType !== 'testCodeFailure'
  ) {
    // A timeout, or a test cancelled because its parent failed. The cause is
    // Node's message, such as "test timed out after 5000ms".
    return String(cause)
  }

  return `thrown: ${inspect(cause)}`
}

function cutStack(stack: string, testFile: string): string {
  const lines = stack.split('\n')
  const isFrame = (line: string): boolean => /^\s+at /.test(line)

  // Keep the frames up to the first one in Node or in the runner. Then drop
  // the frames at the end that are in the test file, which are the test
  // function itself. Jest cut the stack at the same place.
  let end = lines.findIndex(
    (line) =>
      isFrame(line) && (line.includes('node:') || line.includes(RUNNER_ROOT))
  )
  if (end === -1) {
    end = lines.length
  }
  while (
    end > 0 &&
    isFrame(lines[end - 1]) &&
    lines[end - 1].includes(testFile)
  ) {
    end -= 1
  }

  return lines.slice(0, end).join('\n')
}
