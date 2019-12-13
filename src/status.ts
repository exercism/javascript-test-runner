import chalk from 'chalk'
import stringLength from 'string-length'

import { trimAndFormatPath } from './utils/trimAndFormatPath'
import { wrapAnsiString } from './utils/wrapAnsiString'
import { printDisplayName } from './utils/printDisplayName'

const RUNNING_TEXT = ' RUNS ';
const RUNNING = `${chalk.reset.inverse.yellow.bold(RUNNING_TEXT)} `;

interface TestRecord {
  testPath: string
  config: jest.ProjectConfig
}

/**
 * This class is a perf optimization for sorting the list of currently
 * running tests. It tries to keep tests in the same positions without
 * shifting the whole list.
 */
class CurrentTestList {
  _array: Array<null | TestRecord>;

  constructor() {
    this._array = [];
  }

  add(testPath: string, config: jest.ProjectConfig) {
    const index = this._array.indexOf(null);
    const record = { config, testPath };
    if (index !== -1) {
      this._array[index] = record;
    } else {
      this._array.push(record);
    }
  }

  delete(testPath: string) {
    const record = this._array.find(
      record => record && record.testPath === testPath
    );
    this._array[this._array.indexOf(record || null)] = null;
  }

  get() {
    return this._array;
  }
}

/**
 * A class that generates the CLI status of currently running tests
 * and also provides an ANSI escape sequence to remove status lines
 * from the terminal.
 */
export class Status {
  private readonly _currentTests: CurrentTestList;
  private _callback?: () => void;
  private _height: number;
  private _done: boolean;
  private _emitScheduled: boolean;
  private _estimatedTime: number;
  private _showStatus: boolean;
  private _cache: null | { clear: string; content: string };
  private _aggregatedResults?: jest.AggregatedResult;
  private _interval?: NodeJS.Timeout;
  private _lastUpdated?: number;

  constructor() {
    this._cache = null;
    this._currentTests = new CurrentTestList();
    this._done = false;
    this._emitScheduled = false;
    this._estimatedTime = 0;
    this._height = 0;
    this._showStatus = false;
  }

  onChange(callback = () => {}) {
    this._callback = callback;
  }

  runStarted(aggregatedResults: jest.AggregatedResult, options: jest.ReporterOnStartOptions) {
    this._estimatedTime = (options && options.estimatedTime) || 0;
    this._showStatus = options && options.showStatus;
    this._interval = setInterval(() => this._tick(), 1000);
    this._aggregatedResults = aggregatedResults;
    this._debouncedEmit();
  }

  runFinished() {
    this._done = true;
    clearInterval(this._interval!);
    this._emit();
  }

  testStarted(testPath: string, config: jest.ProjectConfig) {
    this._currentTests.add(testPath, config);
    if (!this._showStatus) {
      this._emit();
    } else {
      this._debouncedEmit();
    }
  }

  testFinished(_config: unknown, testResult: jest.TestResult, aggregatedResults: jest.AggregatedResult) {
    const { testFilePath } = testResult;
    this._aggregatedResults = aggregatedResults;
    this._currentTests.delete(testFilePath);
    this._debouncedEmit();
  }

  get() {
    if (this._cache) {
      return this._cache;
    }

    if (this._done) {
      return { clear: '', content: '' };
    }

    // $FlowFixMe
    const width = process.stdout.columns;
    let content = '\n';
    this._currentTests.get().forEach(record => {
      if (record) {
        const { config, testPath } = record;

        const projectDisplayName = config.displayName
          ? `${printDisplayName(config)} `
          : '';
        const prefix = RUNNING + projectDisplayName;

        content += `${wrapAnsiString(
          prefix +
            trimAndFormatPath(stringLength(prefix), config, testPath, width),
          width
        )}\n`;
      }
    });

    let height = 0;

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\n') {
        height++;
      }
    }

    const clear = '\r\x1B[K\r\x1B[1A'.repeat(height);

    return (this._cache = { clear, content });
  }

  _emit() {
    this._cache = null;
    this._lastUpdated = Date.now();
    this._callback && this._callback();
  }

  _debouncedEmit() {
    if (!this._emitScheduled) {
      // Perf optimization to avoid two separate renders When
      // one test finishes and another test starts executing.
      this._emitScheduled = true;
      setTimeout(() => {
        this._emit();
        this._emitScheduled = false;
      }, 100);
    }
  }

  _tick() {
    this._debouncedEmit();
  }
}
