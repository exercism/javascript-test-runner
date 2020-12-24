import path from 'path'
import chalk from 'chalk'
import slash from 'slash'

import { Config } from '@jest/types'

import { relativePath } from './relativePath'

export function formatTestPath(
  config: Config.ProjectConfig | Config.GlobalConfig,
  testPath: string
): string {
  const { dirname, basename } = relativePath(config, testPath)

  return slash(chalk.dim(dirname + path.sep) + chalk.bold(basename))
}
