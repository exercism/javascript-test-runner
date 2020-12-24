import path from 'path'
import fs from 'fs'

import { ConsoleBuffer } from '@jest/console'
import {
  AggregatedResult,
  AssertionResult,
  TestResult,
} from '@jest/test-result'
import { Config } from '@jest/types'

interface OutputInterface {
  status: 'fail' | 'pass' | 'error'
  message: string
  tests: OutputTestInterface[]
}

interface OutputTestInterface {
  name: string
  status: 'fail' | 'pass' | 'error'
  message: string
  output: string | null
}

export class Output {
  private results: Partial<OutputInterface> & Pick<OutputInterface, 'tests'>
  private readonly globalConfig: Config.GlobalConfig
  private readonly outputFile: string

  constructor(globalConfig: Config.GlobalConfig) {
    this.globalConfig = globalConfig
    this.results = { tests: [] }
    this.outputFile =
      this.globalConfig.outputFile || path.join(process.cwd(), 'results.json')
  }

  public error(message: string): void {
    this.results.status = 'error'
    this.results.message = message
  }

  public finish(aggregatedResults: AggregatedResult): void {
    if (!this.results.status) {
      this.results.status =
        aggregatedResults.numRuntimeErrorTestSuites === 0 &&
        aggregatedResults.numFailedTestSuites === 0 &&
        aggregatedResults.numPendingTests === 0 &&
        aggregatedResults.numFailedTests === 0
          ? 'pass'
          : 'fail'
    }

    const artifact = JSON.stringify(this.results, undefined, 2)

    fs.writeFileSync(this.outputFile, artifact)
  }

  public testFinished(
    specFilePath: string,
    testResult: TestResult,
    results: AggregatedResult
  ): void {
    // Syntax errors etc. These are runtime errors: failures to run
    if (results.numRuntimeErrorTestSuites > 0) {
      this.error(
        sanitizeErrorMessage(
          specFilePath,
          testResult.failureMessage ||
            'Something went wrong when running the tests.'
        )
      )
      return
    }

    // Suites ran fine. Output normally.
    results.testResults.forEach((testResult) => {
      return this.testInnerFinished(
        specFilePath,
        testResult,
        testResult.testResults
      )
    })
  }

  public testInnerFinished(
    specFilePath: string,
    testResult: TestResult,
    innerResults: AssertionResult[]
  ): void {
    if (testResult.console) {
      /*
      // The code below works, but is not accepted by the current runner spec on exercism
      const name = [
        typeof testResult.displayName === 'string' && testResult.displayName,
        typeof testResult.displayName === 'object' && testResult.displayName && testResult.displayName.name,
        innerResults[0] && innerResults[0].ancestorTitles.join(' > '),
        trimAndFormatPath(0, this.globalConfig, path, 80)
      ].filter(Boolean)[0] as string

      this.results.tests.push({
        name: name,
        output: buildOutput(testResult.console),
        status: testResult.numPendingTests === 0 && testResult.numFailingTests === 0 ? 'pass' : 'fail',
        message: ''
      })
      */

      this.results.message = sanitizeErrorMessage(
        specFilePath,
        buildOutput(testResult.console)
      )
    }

    const outputs = buildTestOutput(specFilePath, testResult, innerResults)
    this.results.tests.push(...outputs.map((r) => ({ ...r, output: null })))
  }

  public testStarted(_path: string): void {
    // noop
  }
}

function buildOutput(buffer: ConsoleBuffer): string {
  const output = buffer
    .map((entry) => `[${entry.type}] ${entry.message}`)
    .join('\n')

  if (output.length > 500) {
    return output
      .slice(0, 500 - '... (500 chars max)'.length)
      .concat('... (500 chars max)')
  }

  return output
}

function buildTestOutput(
  path: string,
  testResult: TestResult,
  inner: AssertionResult[]
): Pick<OutputTestInterface, 'name' | 'status' | 'message'>[] {
  if (testResult.testExecError) {
    return [
      {
        message: sanitizeErrorMessage(
          path,
          testResult.failureMessage
            ? removeStackTrace(testResult.failureMessage)
            : testResult.testExecError.message
        ),
        name: testResult.testFilePath,
        status: 'error',
      },
    ]
  }

  return inner.map((assert) => {
    return {
      name: assert.ancestorTitles.concat(assert.title).join(' > '),
      status: assert.status === 'passed' ? 'pass' : 'fail',
      message: sanitizeErrorMessage(
        testResult.testFilePath,
        assert.failureMessages.map(removeStackTrace).join('\n')
      ),
    }
  })
}

function removeStackTrace(message: string): string {
  const i = message.indexOf('  at Object.')
  if (i === -1) {
    return message
  }
  const split = message.slice(0, i).lastIndexOf('\n')
  return split === -1
    ? message.slice(0, i).trimEnd()
    : message.slice(0, split).trimEnd()
}

function sanitizeErrorMessage(specFilePath: string, message: string): string {
  const dirs = [
    path.dirname(specFilePath),
    path.dirname(path.dirname(specFilePath)),
    process.cwd(),
    path.dirname(process.cwd()),
  ]

  dirs.forEach((sensativePath) => {
    while (message.indexOf(sensativePath) !== -1) {
      message = message.replace(sensativePath, '<solution>')
    }
  })

  return message
}
