import spyConsole from './console'

const originalDescribe = (jasmine as any).getEnv().describe

;(jasmine as any).getEnv().describe = <T extends unknown[] = any[]>(
  description: string,
  specDefinitions: (...args: T) => void,
  ...describeArgs: T
) => {
  function spiedSpecDefinition(...args: T) {
    let restores: Array<() => void> = []

    beforeEach(() => {
      restores.push(spyConsole().restore)
    })

    afterEach(() => {
      const restore = restores.shift()!

      restore()
    })

    return specDefinitions(...args)
  }

  return (originalDescribe as any)(
    description,
    spiedSpecDefinition,
    ...describeArgs
  )
}
