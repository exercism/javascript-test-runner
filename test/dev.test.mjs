import { join } from 'node:path'
import { assertPass } from './asserts.mjs'
import { fixtures } from './paths.mjs'

// run this file like:
// corepack pnpm dlx cross-env SILENT=0 corepack pnpm node test/dev.test.mjs

assertPass(
  'clock',
  join(fixtures, 'clock', 'pass'),
  join(fixtures, 'clock', 'pass')
)
