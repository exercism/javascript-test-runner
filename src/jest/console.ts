/* eslint-disable @typescript-eslint/no-explicit-any */
import { spyOn } from 'jest-mock'

const defaultKeys = ['debug', 'log', 'info', 'warn', 'error'] as const

type ConsoleFunction = jest.FunctionPropertyNames<Console>
type Spies = Record<ConsoleFunction, jest.SpyInstance<Console>>

interface CapturedConsole {
  getSpy(key: ConsoleFunction): jest.SpyInstance<Console>
  restore(): void
  clear(): void
  calls(): Record<string, unknown[]>
}

function captureConsole(
  keys?: ConsoleFunction | ReadonlyArray<ConsoleFunction>
): CapturedConsole {
  const capturedKeys = typeof keys === 'string' ? [keys] : keys || defaultKeys

  // Capture these
  const spies = capturedKeys.reduce(
    (result: Partial<Spies>, key: ConsoleFunction) => {
      result[key] = spyOn<Console, any>(global.console, key) as any
      return result
    },
    {}
  ) as Spies

  function getSpy(spykey: string): any {
    return spies[spykey as keyof typeof spies]
  }

  // Return function to restore console
  return {
    getSpy: getSpy,

    restore: (): void => {
      Object.keys(spies).forEach((spykey) => getSpy(spykey).mockRestore())
    },

    clear: (): void => {
      Object.keys(spies).forEach((spykey) => getSpy(spykey).mockClear())
    },

    calls: (): Record<string, unknown[]> => {
      return Object.keys(spies).reduce((result, spyKey) => {
        result[spyKey] = [...getSpy(spyKey).mock.calls]
        return result
      }, {} as Record<string, unknown[]>)
    },
  }
}

export default captureConsole
