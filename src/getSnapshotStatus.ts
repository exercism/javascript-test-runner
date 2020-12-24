import chalk from 'chalk'
import { pluralize } from './utils/pluralize'

import { TestResult } from '@jest/test-result'

const ARROW = ' \u203A '
const DOT = ' \u2022 '
const FAIL_COLOR = chalk.bold.red
const SNAPSHOT_ADDED = chalk.bold.green
const SNAPSHOT_UPDATED = chalk.bold.green
const SNAPSHOT_OUTDATED = chalk.bold.yellow

export function getSnapshotStatus(
  snapshot: TestResult['snapshot'],
  afterUpdate: boolean
): string[] {
  const statuses: string[] = []

  if (snapshot.added) {
    statuses.push(
      SNAPSHOT_ADDED(
        `${ARROW + pluralize('snapshot', snapshot.added)} written.`
      )
    )
  }

  if (snapshot.updated) {
    statuses.push(
      SNAPSHOT_UPDATED(
        `${ARROW + pluralize('snapshot', snapshot.updated)} updated.`
      )
    )
  }

  if (snapshot.unmatched) {
    statuses.push(
      FAIL_COLOR(`${ARROW + pluralize('snapshot', snapshot.unmatched)} failed.`)
    )
  }

  if (snapshot.unchecked) {
    if (afterUpdate) {
      statuses.push(
        SNAPSHOT_UPDATED(
          `${ARROW + pluralize('snapshot', snapshot.unchecked)} removed.`
        )
      )
    } else {
      statuses.push(
        `${SNAPSHOT_OUTDATED(
          `${ARROW + pluralize('snapshot', snapshot.unchecked)} obsolete`
        )}.`
      )
    }

    if (snapshot.uncheckedKeys) {
      snapshot.uncheckedKeys.forEach((key: string) => {
        statuses.push(`  ${DOT}${key}`)
      })
    }
  }

  if (snapshot.fileDeleted) {
    statuses.push(SNAPSHOT_UPDATED(`${ARROW}snapshot file removed.`))
  }

  return statuses
}
