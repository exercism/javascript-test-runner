import { Status } from './status'
import { Output } from './output'
import { isInteractive } from 'jest-util'

import { getResultHeader } from './getResultHeader'
import { getSnapshotStatus } from './getSnapshotStatus'
import { getTestResults } from './getTestResults'
import { getSummary } from './getSummary'
import { Stdlib } from './stdlib'

class StandardReporter implements jest.Reporter {
  private readonly globalConfig: jest.GlobalConfig
  private readonly stdlib: Stdlib
  private readonly status: Status
  private readonly output: Output

  private error: null | Error
  private clear: string

  constructor(globalConfig: jest.GlobalConfig) {
    this.globalConfig = globalConfig
    this.stdlib = new Stdlib(globalConfig)

    this.error = null
    this.clear = ''
    this.status = new Status()
    this.output = new Output(globalConfig)

    this.status.onChange(() => {})
  }

  getLastError(): jest.Maybe<Error> {
    return this.error
  }

  setError(error: Error) {
    this.error = error
    this.output.error(error.message)
  }

  /**
   * @param results
   * @param options
   */
  onRunStart(results: jest.AggregatedResult, options: jest.ReporterOnStartOptions): void {
    this.status.runStarted(results, options)
    if (isInteractive) {
      this.stdlib.clear()
    }
  }

  /**
   * @param test
   */
  onTestStart(test: jest.Test): void {
    this.status.testStarted(test.path, test.context.config)
    this.output.testStarted(test.path)
  }

  /**
   * @param test
   * @param testResult
   * @param results
   */
  onTestResult(test: jest.Test, testResult: jest.TestResult, results: jest.AggregatedResult): void {
    this.status.testFinished(test.context.config, testResult, results)
    this.output.testFinished(test.path, testResult, results)

    if (!testResult.skipped) {
      this.stdlib.log(
        getResultHeader(testResult, this.globalConfig, test.context.config)
      )

      if (
        this.globalConfig.verbose &&
        !testResult.testExecError &&
        !testResult.skipped
      ) {
        this.stdlib.log(getTestResults(testResult.testResults))
      }

      if (testResult.failureMessage) {
        this.stdlib.error(testResult.failureMessage)
      }

      const didUpdate = this.globalConfig.updateSnapshot === 'all'
      const snapshotStatuses = getSnapshotStatus(
        testResult.snapshot,
        didUpdate
      )
      snapshotStatuses.forEach(this.stdlib.log.bind(this.stdlib))
    }
    this.stdlib.forceFlushBufferedOutput()
  }

  /**
   * @param contexts
   * @param aggregatedResults
   */
  onRunComplete(_contexts: Set<jest.Context>, aggregatedResults: jest.AggregatedResult): jest.Maybe<Promise<void>> {
    this.stdlib.log(getSummary(aggregatedResults, undefined))
    this.status.runFinished()
    this.stdlib.close()
    this.stdlib.clear()

    this.output.finish(aggregatedResults)
  }
}

export = StandardReporter
