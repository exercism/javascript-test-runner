import { afterEach, describe, expect, test } from '@jest/globals'
import { spawnSync } from 'child_process'
import { lstat, readFileSync, unlink } from 'fs'
import { join, resolve } from 'path'

const root = resolve(__dirname, '..')
const fixtures = resolve(__dirname, 'fixtures')
const bin = resolve(root, 'bin')
const run = resolve(bin, 'run.sh')

describe('includes task id', () => {
  jest.setTimeout(120 * 1000)

  describe('passing solution', () => {
    const resultPath = join(fixtures, 'lasagna', 'exemplar', 'results.json')

    afterEach(() => {
      unlink(resultPath, () => {
        /** noop */
      })
    })

    test('can run the tests', () => {
      const spawned = spawnSync(
        'bash',
        [run, 'lasagna', join(fixtures, 'lasagna', 'exemplar')],
        {
          stdio: 'pipe',
          cwd: root,
        }
      )

      if (spawned.stderr?.length) {
        console.warn('Did not expect anything logged to stderr.')
        console.warn(spawned.stderr.toString())
      }

      expect(spawned.status).toBe(0)
    })

    test('generates a result.json with task ids', () => {
      spawnSync(
        'bash',
        [run, 'lasagna', join(fixtures, 'lasagna', 'exemplar')],
        {
          stdio: 'pipe',
          cwd: root,
        }
      )

      return new Promise((resolve, reject) => {
        lstat(resultPath, (err, _) => {
          expect(err).toBeNull()

          const result = JSON.parse(readFileSync(resultPath).toString()) as {
            status: string
            // eslint-disable-next-line @typescript-eslint/naming-convention
            tests: { task_id: number }[]
          }
          expect(result.status).toBe('pass')
          expect(result.tests).toBeDefined()
          expect(result.tests[0]).toBeDefined()
          expect(result.tests[0].task_id).toBe(1)

          expect(result.tests[1]).toBeDefined()
          expect(result.tests[1].task_id).toBe(2)
          expect(result.tests[2]).toBeDefined()
          expect(result.tests[2].task_id).toBe(2)

          expect(result.tests[3]).toBeDefined()
          expect(result.tests[3].task_id).toBe(3)

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
