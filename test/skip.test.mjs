import { join } from 'node:path'
import shelljs from 'shelljs'
import { assertPass } from './asserts.mjs'
import { fixtures } from './paths.mjs'

shelljs.echo('skipping via test.skip > passing solution')
assertPass(
  'pythagorean-triplet',
  join(fixtures, 'pythagorean-triplet', 'exemplar')
)
