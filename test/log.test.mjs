import shelljs from 'shelljs'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, sep } from 'node:path'
import { fixtures, root, run } from './paths.mjs'

const SILENT = process.env.SILENT !== '0' && process.env.RUNNER_DEBUG !== '1'

export function assertLog(slug, fixture, outputDir = null) {
  outputDir =
    outputDir ||
    (process.env.TMP_MAY_BE_NON_EXEC
      ? fixture
      : mkdtempSync(join(tmpdir(), 'assert-log-')))
  const resultPath = join(outputDir, 'results.json')

  if (fixture[fixture.length - 1] !== sep) {
    fixture = fixture + sep
  }

  if (outputDir[outputDir.length - 1] !== sep) {
    outputDir = outputDir + sep
  }

  // Clean-up remaining results
  if (existsSync(resultPath)) {
    shelljs.rm(resultPath)
  }

  const command = ['bash', run, slug, fixture, outputDir].join(' ')

  // shelljs.echo(`-> ${command}`)
  const { stderr, code } = shelljs.exec(command, {
    async: false,
    silent: SILENT,
    cwd: root,
  })

  if (stderr?.length) {
    shelljs.echo('⚠️ Did not expect anything logged to stderr.')
    shelljs.echo(stderr)
  }

  if (code !== 0) {
    shelljs.echo(
      `assert log 💥 on ${slug} for ${fixture} failed. Status expected 0, actual: ${code}`
    )
    shelljs.exit(code)
  }

  if (!existsSync(resultPath)) {
    shelljs.echo(
      `assert log 💥 on ${slug} for ${resultPath} failed. results.json does not exist.`
    )
    shelljs.exit(-1)
  }

  const result = JSON.parse(shelljs.cat(resultPath).toString())

  if (result.status !== 'pass') {
    shelljs.echo(
      `assert log 💥 on ${slug} for ${fixture} failed. Status expected pass, actual: ${result.status}`
    )
    shelljs.exit(-1)
  }

  if (result.tests.length === 0) {
    shelljs.echo(
      `assert log 💥 on ${slug} for ${fixture} failed because no tests were ran.`
    )
    shelljs.exit(-1)
  }

  result.tests.forEach((test, index) => {
    if (test.output === null) {
      shelljs.echo(
        `assert log 💥 on ${slug} for ${fixture} failed because test ${index} has no output.`
      )
      shelljs.exit(-1)
    }

    if (!String(test.output).includes('[log] name:')) {
      shelljs.echo(
        `assert log 💥 on ${slug} for ${fixture} failed because test ${index} has output but it does not contain "[log] name:".`
      )
      shelljs.exit(-1)
    }
  })

  shelljs.echo('assert log 🥳')
}

shelljs.echo(
  'javascript-test-runner > passing solution with logs > no output directory'
)
assertLog(
  'two-fer',
  join(fixtures, 'two-fer', 'log'),
  join(fixtures, 'two-fer', 'log')
)
