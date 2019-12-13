import path from 'path'
import fs from 'fs'
import { relativePath } from './utils/relativePath'
import { trimAndFormatPath } from './utils/trimAndFormatPath'

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
  private readonly globalConfig: jest.GlobalConfig

  constructor(globalConfig: jest.GlobalConfig) {
    this.globalConfig = globalConfig
    this.results = { tests: [] }
  }

  error(message: string) {
    this.results.status = 'error'
    this.results.message = message
  }

  finish(aggregatedResults: jest.AggregatedResult) {
    if (this.results.status === null) {
      this.results.status = aggregatedResults.success
        && (aggregatedResults.numPendingTests === 0)
        && (aggregatedResults.numFailedTests === 0)
        ? 'pass'
        : 'fail'
    }

    const artifact = JSON.stringify(this.results, undefined, 2)
    const outputPath = path.join(process.cwd(), 'results.json')

    fs.writeFileSync(outputPath, artifact)
  }

  testFinished(_path: string, _testResult: jest.TestResult, results: jest.AggregatedResult) {
    results.testResults.forEach((testResult) => {
      return this.testInnerFinished(testResult.testFilePath, testResult, testResult.testResults)
    })
  }

  testInnerFinished(path: string, testResult: jest.TestResult, innerResults: jest.AssertionResult[]) {
    if (testResult.console) {
      this.results.tests.push({
        name: trimAndFormatPath(0, this.globalConfig, path, 80),
        output: buildOutput(testResult.console),
        status: testResult.numPendingTests === 0 && testResult.numFailingTests === 0 ? 'pass' : 'fail',
        message: ''
      })
    }

    const outputs = buildTestOutput(testResult, innerResults)
    this.results.tests.push(...outputs.map((r) => ({ ...r, output: null })))
  }

  testStarted(_path: string) {
  }
}

function buildOutput(buffer: jest.ConsoleBuffer) {
  const output = buffer
    .map((entry) => `[${entry.type}] ${entry.message}`)
    .join('\n')

  if (output.length > 500) {
    return output.slice(0, 500 - '... (500 chars max)'.length).concat('... (500 chars max)')
  }

  return output
}

function buildTestOutput(
  testResult: jest.TestResult,
  inner: jest.AssertionResult[]
): Pick<OutputTestInterface, 'name' | 'status' | 'message'>[] {
  if (testResult.testExecError) {
    return [{
      message: testResult.failureMessage
        ? removeStackTrace(testResult.failureMessage)
        : testResult.testExecError.message,
      name: testResult.testFilePath,
      status: 'error',
    }]
  }

  return inner.map((assert) => {
    return {
      name: assert.ancestorTitles.concat(assert.title).join(' > '),
      status: assert.status === 'passed' ? 'pass' : 'fail',
      message: assert.failureMessages.map(removeStackTrace).join("\n")
    }
  })
}

function removeStackTrace(message: string): string {
  const i = message.indexOf('  at Object.')
  if (i === -1) {
    return message
  }
  const split = message.slice(0, i).lastIndexOf("\n")
  return split === -1
    ? message.slice(0, i).trimEnd()
    : message.slice(0, split).trimEnd()
}
