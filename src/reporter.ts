import type {
  TestContext,
  Reporter,
  ReporterOnStartOptions,
  Test,
} from '@jest/reporters'
import type { AggregatedResult, TestResult } from '@jest/test-result'
import type { Config } from '@jest/types'
import { Output } from './output'

// eslint-disable-next-line import/no-default-export
export default class StandardReporter implements Reporter {
  private readonly output: Output

  private error: null | Error

  constructor(globalConfig: Config.GlobalConfig) {
    this.error = null
    this.output = new Output(globalConfig)
  }

  public getLastError(): Error | undefined {
    if (this.error) {
      return this.error
    }
  }

  public setError(error: Error): void {
    this.error = error
    this.output.error(error.message)
  }

  /**
   * @param results
   * @param options
   */
  public onRunStart(
    results: AggregatedResult,
    options: ReporterOnStartOptions
  ): void {
    // no-op
  }

  /**
   * @param test
   */
  public onTestStart(test: Test): void {
    this.output.testStarted(test.path)
  }

  /**
   * @param test
   * @param testResult
   * @param results
   */
  public async onTestFileResult(
    test: Test,
    testResult: TestResult,
    results: AggregatedResult
  ): Promise<void> {
    this.output.testFinished(test.path, testResult, results)
  }

  /**
   * @param contexts
   * @param aggregatedResults
   */
  public onRunComplete(
    _contexts: Set<TestContext>,
    aggregatedResults: AggregatedResult
  ): Promise<void> | void {
    this.output.finish(aggregatedResults)
  }
}
