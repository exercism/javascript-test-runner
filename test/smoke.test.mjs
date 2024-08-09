import { join } from 'node:path'
import shelljs from 'shelljs'
import { assertError, assertPass, rejectPass } from './asserts.mjs'
import { fixtures } from './paths.mjs'

/** Test passing */
shelljs.echo('javascript-test-runner > passing solution > no output directory')
assertPass(
  'two-fer',
  join(fixtures, 'two-fer', 'pass'),
  join(fixtures, 'two-fer', 'pass')
)

shelljs.echo(
  'javascript-test-runner > passing solution > with output directory'
)
assertPass('two-fer', join(fixtures, 'two-fer', 'pass'))

shelljs.echo(
  'javascript-test-runner > passing solution > uses .meta/config.json'
)
assertPass(
  'poetry-club-door-policy',
  join(fixtures, 'poetry-club-door-policy', 'pass'),
  join(fixtures, 'poetry-club-door-policy', 'pass')
)

/** Test failures */
const failures = ['tests', 'empty']

failures.forEach((cause) => {
  const input = join(fixtures, 'two-fer', 'fail', cause)
  shelljs.echo(
    `javascript-test-runner > failing solution (${cause}) > no output directory`
  )
  rejectPass('two-fer', input, input)

  shelljs.echo(
    `javascript-test-runner > failing solution (${cause}) > with output directory`
  )
  rejectPass('two-fer', input)
})

/** Test errors */
const errors = ['missing', 'syntax', 'malformed_tests']

errors.forEach((cause) => {
  const input = join(fixtures, 'two-fer', 'error', cause)
  shelljs.echo(
    `javascript-test-runner > solution with error (${cause}) > no output directory`
  )
  assertError('two-fer', input, input)

  shelljs.echo(
    `javascript-test-runner > solution with error (${cause}) > with output directory`
  )
  assertError('two-fer', input)
})
