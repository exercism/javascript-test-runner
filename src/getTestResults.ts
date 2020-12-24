import chalk from 'chalk'
import { specialChars } from 'jest-util'

import { Status, AssertionResult, TestResult } from '@jest/test-result'

const { ICONS } = specialChars

interface TestSuite {
  suites: TestSuite[]
  tests: AssertionResult[]
  title: string
}

type TestsBySuites = TestSuite

export function getTestResults(testResults: TestResult['testResults']): string {
  const testSuites = groupTestsBySuites(testResults)

  return getLogSuite(testSuites, 0)
}

function groupTestsBySuites(testResults: TestResult['testResults']): TestSuite {
  const output: TestsBySuites = { suites: [], tests: [], title: '' }

  testResults.forEach((testResult: AssertionResult) => {
    let targetSuite = output

    // Find the target suite for this test,
    // creating nested suites as necessary.
    for (const title of testResult.ancestorTitles) {
      let matchingSuite = targetSuite.suites.find((s) => s.title === title)
      if (!matchingSuite) {
        matchingSuite = { suites: [], tests: [], title }
        targetSuite.suites.push(matchingSuite)
      }
      targetSuite = matchingSuite
    }

    targetSuite.tests.push(testResult)
  })

  return output
}

export function getLogSuite(suite: TestSuite, indentLevel: number): string {
  let output = ''

  if (suite.title) {
    output += getLine(suite.title, indentLevel)
  }

  output += logTests(suite.tests, indentLevel + 1)

  suite.suites.forEach(
    (suite) => (output += getLogSuite(suite, indentLevel + 1))
  )

  return output
}

export function getLine(str: string, indentLevel: number): string {
  const indentation = '  '.repeat(indentLevel || 0)

  return `${indentation}${str || ''}\n`
}

export function logTests(
  tests: AssertionResult[],
  indentLevel: number
): string {
  let output = ''
  tests.forEach((test) => (output += logTest(test, indentLevel)))

  return output
}

export function logTest(test: AssertionResult, indentLevel: number): string {
  const status = getIcon(test.status)
  const time = test.duration ? ` (${test.duration.toFixed(0)}ms)` : ''
  const testStatus = `${status} ${chalk.dim(test.title + time)}`

  return getLine(testStatus, indentLevel)
}

export function getIcon(status: Status): string {
  switch (status) {
    case 'failed':
      return chalk.red(ICONS.failed)
    case 'pending':
      return chalk.yellow(ICONS.pending)
    case 'skipped':
      return chalk.magenta(ICONS.todo)
    default:
      return chalk.green(ICONS.success)
  }
}
