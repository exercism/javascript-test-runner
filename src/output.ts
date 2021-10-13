import { ConsoleBuffer } from '@jest/console'
import {
  AggregatedResult,
  AssertionResult,
  TestResult,
} from '@jest/test-result'
import { Config } from '@jest/types'
import fs from 'fs'
import path from 'path'
import {
  AstParser,
  ExtractedTestCase,
  extractTests,
  ParsedSource,
} from '@exercism/static-analysis'

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
  test_code: string
}

const OUTPUT_VERSION = 2
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
        // Pending tests are skipped tests. test.skip tests are fine in our
        // reporter and should not be forced to have ran here. So the next
        // line is commented out.
        //
        // aggregatedResults.numPendingTests === 0 &&
        aggregatedResults.numFailedTests === 0
          ? 'pass'
          : 'fail'

      // Divert status if nothing ran
      if (
        this.results.status === 'pass' &&
        aggregatedResults.numPassedTests === 0
      ) {
        this.results.status = 'fail'
        this.error(
          'Expected to run at least one test, but none were found. This can ' +
            'happen if the test file(s) (.spec.js) are missing or empty. ' +
            'These files are normally not empty. Revert any changes or report ' +
            'an issue if the problem persists.'
        )
      }
    }

    const parsedSources: Record<
      string,
      {
        program: ParsedSource['program']
        source: ParsedSource['source']
        tests: Record<string, ExtractedTestCase>
      }
    > = {}

    // Every tested test file is indexed and parsed
    this.results.tests
      .map((test) => test.test_code)
      .filter((path, index, self) => self.indexOf(path) === index)
      .forEach((file) => {
        try {
          const [{ program, source }] = AstParser.ANALYZER.parseSync(
            fs.readFileSync(file).toString()
          )
          const tests = extractTests(program)

          parsedSources[file] = {
            program,
            source,
            tests: tests.reduce((results, item) => {
              results[item.name(' > ')] = item
              results[item.name(' ' as ' > ')] = item
              return results
            }, {} as Record<string, ExtractedTestCase>),
          }
        } catch (err) {
          console.error(
            `When trying to parse ${file}, the following error occurred`,
            err
          )
        }
      })

    // Extract the test code, if possible
    const tests = this.results.tests.map((test) => {
      const parsedSource = parsedSources[test.test_code]
      if (!parsedSource) {
        return { ...test, test_code: null }
      }

      const testCase = parsedSource.tests[test.name]
      if (!testCase) {
        return { ...test, test_code: null }
      }

      return { ...test, test_code: testCase.testCode(parsedSource.source) }
    })

    // Re-order the output so that tests output shows below main output
    const { status, message } = this.results

    const artifact = JSON.stringify(
      { status, message, tests, version: OUTPUT_VERSION },
      undefined,
      2
    )
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
    }

    const consoleOutputs = testResult.console
      ? buildOutput(specFilePath, testResult.console)
      : ({} as Record<string, string>)

    const outputs = buildTestOutput(specFilePath, testResult, innerResults)
    const firstFailureIndex = outputs.findIndex(
      (output) => output.status === 'fail'
    )

    this.results.tests.push(
      ...outputs.map((withoutOutput, i, self) => {
        const isFirstFailure =
          firstFailureIndex === i ||
          (firstFailureIndex === -1 && self.length === i + 1)
        const outputMessage =
          consoleOutputs[withoutOutput.name.replace(/ > /g, ' ')] || null

        return {
          ...withoutOutput,
          output: isFirstFailure
            ? [consoleOutputs[''], outputMessage].filter(Boolean).join('\n') ||
              null
            : outputMessage,
          test_code: specFilePath,
        }
      })
    )
  }

  public testStarted(_path: string): void {
    // noop
  }
}

function buildOutput(
  specFilePath: string,
  buffer: ConsoleBuffer
): Record<string, string> {
  const [, outputs] = buffer.reduce(
    ([lastTest, messages], entry) => {
      // Change current test messages
      if (entry.message.startsWith('@exercism/javascript:')) {
        return [
          entry.message.slice('@exercism/javascript:'.length).trim(),
          messages,
        ] as const
      }

      const sanitized = `[${entry.type}] ${sanitizeErrorMessage(
        specFilePath,
        entry.message
      )}`
      messages[lastTest] = messages[lastTest] || []
      messages[lastTest].push(sanitized)

      return [lastTest, messages] as const
    },
    ['', {}] as readonly [string, Record<string, string[]>]
  )

  return Object.keys(outputs).reduce((results, key) => {
    const message = (outputs[key] || []).join('\n') || ''
    if (message.length <= 500) {
      results[key] = message
    } else {
      results[key] = message
        .slice(0, 500 - '... (500 chars max)'.length)
        .concat('... (500 chars max)')
    }

    return results
  }, {} as Record<string, string>)
}

function buildTestOutput(
  path: string,
  testResult: TestResult,
  inner: AssertionResult[]
): Pick<OutputTestInterface, 'name' | 'status' | 'message'>[] {
  if (testResult.testExecError) {
    return [
      {
        name: testResult.testFilePath,
        status: 'error',
        message: sanitizeErrorMessage(
          path,
          testResult.failureMessage
            ? removeStackTrace(testResult.failureMessage)
            : testResult.testExecError.message
        ),
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
