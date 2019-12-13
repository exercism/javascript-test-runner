import chalk from 'chalk'
import { specialChars } from 'jest-util';

const { ICONS } = specialChars;

interface TestSuite {
  suites: TestSuite[]
  tests: jest.AssertionResult[]
  title: string
}

type TestsBySuites = TestSuite

export function getTestResults(testResults: jest.TestResult['testResults']) {
  const testSuites = groupTestsBySuites(testResults);

  return getLogSuite(testSuites, 0);
};

function groupTestsBySuites(testResults: jest.TestResult['testResults']) {
  const output: TestsBySuites = { suites: [], tests: [], title: '' };

  testResults.forEach((testResult: jest.AssertionResult) => {
    let targetSuite = output;

    // Find the target suite for this test,
    // creating nested suites as necessary.
    for (const title of testResult.ancestorTitles) {
      let matchingSuite = targetSuite.suites.find(s => s.title === title);
      if (!matchingSuite) {
        matchingSuite = { suites: [], tests: [], title };
        targetSuite.suites.push(matchingSuite);
      }
      targetSuite = matchingSuite;
    }

    targetSuite.tests.push(testResult);
  });

  return output;
};

export function getLogSuite(suite: TestSuite, indentLevel: number): string {
  let output = '';

  if (suite.title) {
    output += getLine(suite.title, indentLevel);
  }

  output += logTests(suite.tests, indentLevel + 1);

  suite.suites.forEach(
    suite => (output += getLogSuite(suite, indentLevel + 1))
  );

  return output;
};

export function getLine(str: string, indentLevel: number): string {
  const indentation = '  '.repeat(indentLevel || 0);

  return `${indentation}${str || ''}\n`;
};

export function logTests(tests: jest.AssertionResult[], indentLevel: number): string {
  let output = '';
  tests.forEach(test => (output += logTest(test, indentLevel)));

  return output;
};

export function logTest(test: jest.AssertionResult, indentLevel : number) {
  const status = getIcon(test.status);
  const time = test.duration ? ` (${test.duration.toFixed(0)}ms)` : '';
  const testStatus = `${status} ${chalk.dim(test.title + time)}`;

  return getLine(testStatus, indentLevel);
};

export function getIcon(status: jest.Status): string {
  switch (status) {
    case 'failed':
      return chalk.red(ICONS.failed);
    case 'pending':
      return chalk.yellow(ICONS.pending);
    case 'skipped':
      return chalk.magenta(ICONS.todo);
    default:
      return chalk.green(ICONS.success);
  }
};
