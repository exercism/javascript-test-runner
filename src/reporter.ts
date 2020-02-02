import { Status } from './status'
import { Output } from './output'
import { isInteractive } from 'jest-util'

import { Config } from '@jest/types';
import { Context, Test, Reporter, ReporterOnStartOptions }  from '@jest/reporters'
import { AggregatedResult, TestResult } from '@jest/test-result'

import { getResultHeader } from './getResultHeader'
import { getSnapshotStatus } from './getSnapshotStatus'
import { getTestResults } from './getTestResults'
import { getSummary } from './getSummary'
import { Stdlib } from './stdlib'

class StandardReporter implements Reporter {
  private readonly globalConfig: Config.GlobalConfig
  private readonly stdlib: Stdlib
  private readonly status: Status
  private readonly output: Output

  private error: null | Error
  private clear: string

  constructor(globalConfig: Config.GlobalConfig) {
    this.globalConfig = globalConfig
    this.stdlib = new Stdlib(globalConfig)

    this.error = null
    this.clear = ''
    this.status = new Status()
    this.output = new Output(globalConfig)

    this.status.onChange(() => {})
  }

  getLastError(): Error | void {
    if (this.error) {
      return this.error
    }
  }

  setError(error: Error) {
    this.error = error
    this.output.error(error.message)
  }

  /**
   * @param results
   * @param options
   */
  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions): void {
    this.status.runStarted(results, options)
    if (isInteractive) {
      this.stdlib.clear()
    }
  }

  /**
   * @param test
   */
  onTestStart(test: Test): void {
    this.status.testStarted(test.path, test.context.config)
    this.output.testStarted(test.path)
  }

  /**
   * @param test
   * @param testResult
   * @param results
   */
  onTestResult(test: Test, testResult: TestResult, results: AggregatedResult): void {
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
  onRunComplete(_contexts: Set<Context>, aggregatedResults: AggregatedResult): Promise<void> | void {
    this.stdlib.log(getSummary(aggregatedResults, undefined))
    this.status.runFinished()
    this.stdlib.close()
    this.stdlib.clear()

    this.output.finish(aggregatedResults)
  }
}

export = StandardReporter
