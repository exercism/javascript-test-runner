import { describe, afterEach, test, expect } from '@jest/globals'
import { spawnSync } from 'child_process'
import { join, resolve } from 'path'
import { lstat, mkdtempSync, readFileSync, unlink } from 'fs'
import { tmpdir } from 'os'

const root = resolve(__dirname, '..')
const fixtures = resolve(__dirname, 'fixtures')
const bin = resolve(root, 'bin')
const run = resolve(bin, 'run.sh')

describe('logging via console.log', () => {
  jest.setTimeout(360 * 1000)

  describe('passing solution', () => {
    const resultPath = join(fixtures, 'two-fer', 'log', 'results.json')

    afterEach(() => {
      unlink(resultPath, () => {
        /** noop */
      })
    })

    test('generates a result.json with log messages', () => {
      spawnSync('bash', [run, 'two-fer', join(fixtures, 'two-fer', 'log')], {
        stdio: 'pipe',
        cwd: root,
      })

      return new Promise((resolve, reject) => {
        lstat(resultPath, (err, _) => {
          expect(err).toBeNull()

          const result = JSON.parse(readFileSync(resultPath).toString()) as {
            status: string
            tests: readonly {
              name: string
              status: 'pass'
              message: string
              output: null | string
              // eslint-disable-next-line @typescript-eslint/naming-convention
              test_code: string
              // eslint-disable-next-line @typescript-eslint/naming-convention
              task_id: number
            }[]
          }

          expect(result.status).toBe('pass')
          expect(result.tests.length).toBeGreaterThan(0)

          result.tests.forEach((test) => {
            expect(test.output).not.toBeNull()
            expect(test.output).toContain('[log] name:')
          })

          if (err) {
            reject(err)
          } else {
            resolve('')
          }
        })
      })
    })
  })
})
