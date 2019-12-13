import { clearLine } from 'jest-util'

export class Stdlib {
  private out: NodeJS.WriteStream['write']
  private err: NodeJS.WriteStream['write']
  private readonly useStderr: boolean
  private readonly bufferedOutput: Set<() => void>

  constructor(globalConfig: jest.GlobalConfig) {
    this.out = process.stdout.write.bind(process.stdout);
    this.err = process.stderr.write.bind(process.stderr);
    this.useStderr = globalConfig.useStderr;
    this.bufferedOutput = new Set();
    this.wrapStdio(process.stdout);
    this.wrapStdio(process.stderr);
  }

  log(message: string) {
    if (this.useStderr) {
      this.err(`${message}\n`);
    } else {
      this.out(`${message}\n`);
    }
  }

  error(message: string) {
    this.err(`${message}\n`);
  }

  clear() {
    clearLine(process.stdout);
    clearLine(process.stderr);
  }

  close() {
    this.forceFlushBufferedOutput();
    process.stdout.write = this.out;
    process.stderr.write = this.err;
  }

  // Don't wait for the debounced call and flush all output immediately.
  forceFlushBufferedOutput() {
    for (const flushBufferedOutput of this.bufferedOutput) {
      flushBufferedOutput();
    }
  }

  wrapStdio(stream: NodeJS.WritableStream) {
    const originalWrite = stream.write;

    let buffer: Parameters<NodeJS.WriteStream['write']>[0][] = [];
    let timeout: NodeJS.Timeout | null = null;

    const flushBufferedOutput = () => {
      const string = buffer.join('');
      buffer = [];

      if (string) {
        originalWrite.call(stream, string);
      }

      this.bufferedOutput.delete(flushBufferedOutput);
    };

    this.bufferedOutput.add(flushBufferedOutput);

    const debouncedFlush = () => {
      // If the process blows up no errors would be printed.
      // There should be a smart way to buffer stderr, but for now
      // we just won't buffer it.
      if (stream === process.stderr || stream === process.stdout) {
        flushBufferedOutput();
      } else {
        if (!timeout) {
          timeout = setTimeout(() => {
            flushBufferedOutput();
            timeout = null;
          }, 100);
        }
      }
    };

    stream.write = (chunk: Parameters<NodeJS.WriteStream['write']>[0]) => {
      buffer.push(chunk);
      debouncedFlush();

      return true;
    };
  }
}
