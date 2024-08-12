import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import shelljs from 'shelljs'
import { assertPass } from './asserts.mjs'
import { fixtures } from './paths.mjs'

shelljs.echo(
  'javascript-test-runner > passing solution with task ids > with output directory'
)

const slug = 'lasagna'
const fixture = join(fixtures, slug, 'exemplar')
const outputDir = process.env.process.env.TMP_MAY_BE_NON_EXEC
  ? fixture
  : mkdtempSync(join(tmpdir(), 'assert-pass-'))
const resultPath = join(outputDir, 'results.json')

assertPass(slug, fixture, outputDir)

const result = JSON.parse(readFileSync(resultPath).toString())
const expectedIds = [1, 2, 2, 3, 4]

if (result.status !== 'pass') {
  shelljs.echo(
    `task id test 💥 on ${slug} for ${fixture} failed. Status expected pass, actual: ${result.status}`
  )
  shelljs.exit(-1)
}

if (result.tests.length === 0) {
  shelljs.echo(
    `task id test 💥 on ${slug} for ${fixture} failed because no tests were ran.`
  )
  shelljs.exit(-1)
}

result.tests.forEach((test, index) => {
  if (!test) {
    shelljs.echo(
      `task id test 💥 on ${slug} for ${fixture} failed because test ${index} is not defined.`
    )
    shelljs.exit(-1)
  }

  if (test.task_id !== expectedIds[index]) {
    shelljs.echo(
      `task id test 💥 on ${slug} for ${fixture} failed because test ${index} task id ${test.task_id} does not match expected ${expectedIds[index]}`
    )
    shelljs.exit(-1)
  }
})

shelljs.echo(`task id test 🥳`)
