import shelljs from 'shelljs'
import { existsSync, mkdtempSync } from 'node:fs'
import { join, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { run, root } from './paths.mjs'

const SILENT = process.env.SILENT !== '0' && process.env.RUNNER_DEBUG !== '1'

export function assertPass(slug, fixture, outputDir = null) {
  outputDir =
    outputDir ||
    (process.env.process.env.TMP_MAY_BE_NON_EXEC
      ? fixture
      : mkdtempSync(join(tmpdir(), 'assert-pass-')))
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
    shelljs.echo('Did not expect anything logged to stderr.')
    shelljs.echo(stderr)
  }

  if (code !== 0) {
    shelljs.echo(
      `assert pass 💥 on ${slug} for ${fixture} failed. Status expected 0, actual: ${code}`
    )
    shelljs.exit(code)
  }

  if (!existsSync(resultPath)) {
    shelljs.echo(
      `assert pass 💥 on ${slug} for ${resultPath} failed. results.json does not exist.`
    )
    shelljs.exit(-1)
  }

  const result = JSON.parse(shelljs.cat(resultPath).toString())

  if (result.status !== 'pass') {
    shelljs.echo(
      `assert pass 💥 on ${slug} for ${fixture} failed. Status expected pass, actual: ${result.status}`
    )
    shelljs.exit(-1)
  }

  shelljs.echo('assert pass 🥳')
}

export function rejectPass(slug, fixture, outputDir = null) {
  outputDir =
    outputDir ||
    (process.env.process.env.TMP_MAY_BE_NON_EXEC
      ? fixture
      : mkdtempSync(join(tmpdir(), 'reject-pass-')))
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
    // Even when the tests fail, the status should be 0
    // 0: passed
    // 1: tests failed (jest)
    // 2: could not compile (tsc)
    //
    // In case of a captured 1 or 2, they should be converted back to 0
    shelljs.echo(
      `reject pass 💥 on ${slug} for ${fixture} failed. Status expected 0, actual: ${code}`
    )
    shelljs.exit(code)
  }

  if (!existsSync(resultPath)) {
    shelljs.echo(
      `reject pass 💥 on ${slug} for ${fixture} failed. result.json does not exist.`
    )
    shelljs.exit(-1)
  }

  const result = JSON.parse(shelljs.cat(resultPath).toString())

  if (result.status !== 'fail') {
    shelljs.echo(
      `reject pass 💥 on ${slug} for ${fixture} failed. Status expected fail, actual: ${result.status}`
    )
    shelljs.exit(-1)
  }

  shelljs.echo('reject pass 🥳')
}

export function assertError(slug, fixture, outputDir = null) {
  outputDir =
    outputDir ||
    (process.env.process.env.TMP_MAY_BE_NON_EXEC
      ? fixture
      : mkdtempSync(join(tmpdir(), 'assert-error-')))
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
    // Even when the tests fail, the status should be 0
    // 0: passed
    // 1: tests failed (jest)
    // 2: could not compile (tsc)
    //
    // In case of a captured 1 or 2, they should be converted back to 0
    shelljs.echo(
      `assert error 💥 on ${slug} for ${fixture} failed. Status expected 0, actual: ${code}`
    )
    shelljs.exit(code)
  }

  if (!existsSync(resultPath)) {
    shelljs.echo(
      `assert error 💥 on ${slug} for ${fixture} failed. result.json does not exist.`
    )
    shelljs.exit(-1)
  }

  const result = JSON.parse(shelljs.cat(resultPath).toString())

  if (result.status !== 'error') {
    shelljs.echo(
      `assert error 💥 on ${slug} for ${fixture} failed. Status expected error, actual: ${result.status}`
    )
    shelljs.exit(-1)
  }

  shelljs.echo('assert error 🥳')
}
