import chalk from 'chalk'

import { Config } from '@jest/types'

export function printDisplayName(config: Config.ProjectConfig): string {
  const { displayName } = config

  if (typeof displayName === 'string') {
    return chalk.supportsColor
      ? chalk.reset.inverse.white(` ${displayName} `)
      : displayName
  }

  if (displayName && typeof displayName === 'object') {
    return chalk.supportsColor
      ? chalk.reset.inverse.white(` ${displayName} `)
      : displayName.name

    // displayName.color
  }

  return ''
}
