// import spyConsole from './console'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalDescribe = (jasmine as any).getEnv().describe

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-explicit-any
;(jasmine as any).getEnv().describe = <T extends unknown[] = any[]>(
  description: string,
  specDefinitions: (...args: T) => void,
  ...describeArgs: T
) => {
  function spiedSpecDefinition(...args: T): void {
    // const restores: Array<() => void> = []

    beforeEach(() => {
      // restores.push(spyConsole().restore)
      console.log(`@exercism/javascript:${expect.getState().currentTestName}`)
    })

    afterEach(() => {
      // const restore = restores.shift()!
      // restore()
    })

    return specDefinitions(...args)
  }

  return originalDescribe(description, spiedSpecDefinition, ...describeArgs)
}
