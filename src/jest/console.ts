import { spyOn } from 'jest-mock'

const defaultKeys = ['debug', 'log', 'info', 'warn', 'error'] as const

type ConsoleFunction = jest.FunctionPropertyNames<Console>
type Spies = Record<ConsoleFunction, jest.SpyInstance<Console>>

interface CapturedConsole {
  getSpy(key: ConsoleFunction): jest.SpyInstance<Console>
  restore(): void
  clear(): void
  calls(): Record<string, any[]>
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

  function getSpy(spykey: string) {
    return spies[spykey as keyof typeof spies]
  }

  // Return function to restore console
  return {
    getSpy: getSpy,

    restore: () => {
      Object.keys(spies).forEach((spykey) => getSpy(spykey).mockRestore())
    },

    clear: () => {
      Object.keys(spies).forEach((spykey) => getSpy(spykey).mockClear())
    },

    calls: () => {
      return Object.keys(spies).reduce((result, spyKey) => {
        result[spyKey] = [...getSpy(spyKey).mock.calls]
        return result
      }, {} as Record<string, any[]>)
    },
  }
}

export default captureConsole
