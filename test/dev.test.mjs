/**
 * $ corepack pnpm node test/dev.test.mjs
 *
 * or with all logs:
 *
 * $ corepack pnpm dlx cross-env SILENT=0 corepack pnpm node test/dev.test.mjs
 */

import { join } from 'node:path'
import { assertPass } from './asserts.mjs'
import { fixtures } from './paths.mjs'

assertPass(
  'clock',
  join(fixtures, 'clock', 'pass'),
  join(fixtures, 'clock', 'pass')
)
