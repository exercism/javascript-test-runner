import { describe, afterEach, test, expect } from '@jest/globals'
import { spawnSync } from 'child_process'
import { join, resolve } from 'path'
import { lstat, mkdtempSync, readFileSync, unlink } from 'fs'
import { tmpdir } from 'os'

const root = resolve(__dirname, '..')
const fixtures = resolve(__dirname, 'fixtures')
const bin = resolve(root, 'bin')
const run = resolve(bin, 'run.sh')

describe('skipping via test.skip', () => {
  jest.setTimeout(120 * 1000)

  describe('passing solution', () => {
    const resultPath = join(
      fixtures,
      'pythagorean-triplet',
      'exemplar',
      'results.json'
    )

    afterEach(() => {
      unlink(resultPath, () => {
        /** noop */
      })
    })

    test('can run the tests', () => {
      const spawned = spawnSync(
        'bash',
        [
          run,
          'pythagorean-triplet',
          join(fixtures, 'pythagorean-triplet', 'exemplar'),
        ],
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

    test('generates a result.json', () => {
      spawnSync(
        'bash',
        [
          run,
          'pythagorean-triplet',
          join(fixtures, 'pythagorean-triplet', 'exemplar'),
        ],
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
          }
          expect(result.status).toBe('pass')

          if (err) {
            reject(err)
          } else {
            resolve('')
          }
        })
      })
    })

    test('generates a result.json at the correct location', () => {
      const outputDir = mkdtempSync(join(tmpdir(), 'foo-'))

      spawnSync(
        'bash',
        [
          run,
          'pythagorean-triplet',
          join(fixtures, 'pythagorean-triplet', 'exemplar'),
          outputDir,
        ],
        {
          stdio: 'pipe',
          cwd: root,
        }
      )

      return new Promise((resolve, reject) => {
        lstat(join(outputDir, 'results.json'), (err, _) => {
          expect(err).toBeNull()

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
