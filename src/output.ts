import { AstParser, extractTests } from '@exercism/static-analysis'
import type { ExtractedTestCase, ParsedSource } from '@exercism/static-analysis'
import type { ConsoleBuffer } from '@jest/console'
import type {
  AggregatedResult,
  AssertionResult,
  TestResult,
} from '@jest/test-result'
import type { Config } from '@jest/types'
import fs from 'fs'
import path from 'path'

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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  test_code: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  task_id?: number
}

type ExerciseConfig = {
  custom?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'version.tests.compatibility'?: 'jest-27' | 'jest-29'
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'flag.tests.task-per-describe': boolean
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'flag.tests.may-run-long': boolean
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'flag.tests.includes-optional': boolean
  }
}

const OUTPUT_VERSION = 3

export class Output {
  private results: Partial<OutputInterface> & Pick<OutputInterface, 'tests'>
  private readonly globalConfig: Config.GlobalConfig
  private readonly outputFile: string
  private readonly sources: Record<string, ParsedSource>
  private readonly tests: Record<string, ReturnType<typeof extractTests>>
  private readonly config: null | ExerciseConfig

  constructor(globalConfig: Config.GlobalConfig) {
    this.globalConfig = globalConfig
    this.results = { tests: [] }
    this.outputFile =
      this.globalConfig.outputFile ?? path.join(process.cwd(), 'results.json')

    this.config = findConfig(path.dirname(this.outputFile))
    this.sources = {}
    this.tests = {}
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
            tests: tests.reduce<Record<string, ExtractedTestCase>>(
              (results, item) => {
                results[item.name(' > ')] = item
                results[item.name(' ' as ' > ')] = item
                return results
              },
              {}
            ),
          }
        } catch (err: unknown) {
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return { ...test, test_code: null }
      }

      const testCase = parsedSource.tests[test.name]
      if (!testCase) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return { ...test, test_code: null }
      }

      // Version 3 optionally can output the task ID
      if (this.configFlag('flag.tests.task-per-describe')) {
        return {
          ...test,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          task_id: testCase.topLevelIndex,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          test_code: testCase.testCode(parsedSource.source),
        }
      }

      return {
        ...test,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        test_code: testCase.testCode(parsedSource.source),
      }
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

  private configFlag(
    flag: keyof NonNullable<ExerciseConfig['custom']>
  ): boolean {
    if (!this.config || !this.config.custom) {
      return false
    }

    return this.config.custom[flag] as boolean
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
          testResult.failureMessage ??
            'Something went wrong when running the tests.'
        )
      )
      return
    }

    // Suites ran fine. Output normally.
    results.testResults.forEach((testResult) => {
      this.testInnerFinished(specFilePath, testResult, testResult.testResults)
    })
  }

  private getSource(specFilePath: string): {
    source: ParsedSource
    tests: ExtractedTestCase[]
  } {
    if (!this.sources[specFilePath]) {
      const [{ program, source }] = AstParser.ANALYZER.parseSync(
        fs.readFileSync(specFilePath).toString()
      )
      this.tests[specFilePath] = extractTests(program)
      this.sources[specFilePath] = { program, source }
    }

    return {
      source: this.sources[specFilePath],
      tests: this.tests[specFilePath],
    }
  }

  public testInnerFinished(
    specFilePath: string,
    testResult: TestResult,
    innerResults: AssertionResult[]
  ): void {
    const consoleOutputs: Record<string, string> = testResult.console
      ? buildOutput(
          specFilePath,
          testResult.console,
          this.getSource(specFilePath)
        )
      : {}

    const outputs = buildTestOutput(specFilePath, testResult, innerResults)
    const firstFailureIndex = outputs.findIndex(
      (output) => output.status === 'fail'
    )

    this.results.tests.push(
      ...outputs.map((withoutOutput, i, self) => {
        const isFirstFailure =
          firstFailureIndex === i ||
          (firstFailureIndex === -1 && self.length === i + 1)

        const outputMessage = consoleOutputs[withoutOutput.name] || null

        return {
          ...withoutOutput,
          output: isFirstFailure
            ? [consoleOutputs[''], outputMessage].filter(Boolean).join('\n') ||
              null
            : outputMessage,
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
  buffer: ConsoleBuffer,
  { tests }: { source: ParsedSource; tests: ExtractedTestCase[] }
): Record<string, string> {
  const outputs = buffer.reduce<Record<string, string[]>>((outputs, entry) => {
    // The origin stack trace will look something like this:
    //
    //   at twoFer (<specFile>:4:11)
    //   at Object.<anonymous> (<specFilePath>:5:12)
    //
    // We want to extract the :5:12) part, convert it to a proper line, column
    // and then look in the test file which test is "around" it. This only
    // works if the test file looks like this:
    //
    // test('my-test', () => {
    //   ...
    //   codeThatEventuallyResultsInLog();
    //   ...
    // })

    let foundTest: ExtractedTestCase | undefined
    // Using find because it will break when something is found!

    entry.origin.split('\n').find((originLine) => {
      if (!originLine.includes(specFilePath)) {
        return undefined
      }

      const [control, line, column] = originLine
        .slice(originLine.indexOf(specFilePath) + specFilePath.length)
        .split(':')

      // Stacktrace didn't look like what we expected
      if (control !== '') {
        return undefined
      }

      const messageLoc = {
        line: Number(line),
        column: Number(column.slice(0, column.length - 1)),
      }
      return (foundTest = tests.find(({ testNode }) => {
        if (messageLoc.line < testNode.loc.start.line) {
          return false
        }
        if (messageLoc.line > testNode.loc.end.line) {
          return false
        }
        if (
          messageLoc.line === testNode.loc.start.line &&
          messageLoc.column < testNode.loc.start.column
        ) {
          return false
        }
        if (
          messageLoc.line === testNode.loc.end.line &&
          messageLoc.column > testNode.loc.end.column
        ) {
          return false
        }

        return true
      }))
    })

    const testName = foundTest?.name(' > ') ?? ''
    const sanitized = `[${entry.type}] ${sanitizeErrorMessage(
      specFilePath,
      entry.message
    )}`

    outputs[testName] = outputs[testName] || []
    outputs[testName].push(sanitized)

    return outputs
  }, {})

  return Object.keys(outputs).reduce<Record<string, string>>((results, key) => {
    const message = (outputs[key] || []).join('\n') || ''
    if (message.length <= 500) {
      results[key] = message
    } else {
      results[key] = message
        .slice(0, 500 - '... (500 chars max)'.length)
        .concat('... (500 chars max)')
    }

    return results
  }, {})
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

  return inner
    .filter(
      (assert) => assert.status !== 'skipped' && assert.status !== 'pending'
    )
    .map((assert) => {
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

  dirs.forEach((sensitivePath) => {
    while (message.includes(sensitivePath)) {
      message = message.replace(sensitivePath, '<solution>')
    }
  })

  if (message.includes('SyntaxError: <solution>')) {
    return message.slice(message.indexOf('SyntaxError: <solution>'))
  }

  return message
}

function findConfig(rootDir: string): null | ExerciseConfig {
  const configPaths = [
    path.join(rootDir, '.meta', 'config.json'),
    path.join(rootDir, '.exercism', 'config.json'),
  ]

  const actualConfigPath = configPaths.find((potentialPath) =>
    fs.existsSync(potentialPath)
  )

  if (!actualConfigPath) {
    return null
  }

  return JSON.parse(
    fs.readFileSync(actualConfigPath).toString()
  ) as ExerciseConfig
}
