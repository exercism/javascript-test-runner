import path from 'path'
import chalk from 'chalk'
import slash from 'slash'

import { Config } from '@jest/types'
import { relativePath } from './relativePath'

export function trimAndFormatPath(
  pad: number,
  config: Config.ProjectConfig | Config.GlobalConfig,
  testPath: string,
  columns: number
): string {
  const maxLength = columns - pad
  const relative = relativePath(config, testPath)
  const { basename } = relative
  let { dirname } = relative

  // length is ok
  if ((dirname + path.sep + basename).length <= maxLength) {
    return slash(chalk.dim(dirname + path.sep) + chalk.bold(basename))
  }

  // we can fit trimmed dirname and full basename
  const basenameLength = basename.length
  if (basenameLength + 4 < maxLength) {
    const dirnameLength = maxLength - 4 - basenameLength
    dirname = `...${dirname.slice(
      dirname.length - dirnameLength,
      dirname.length
    )}`

    return slash(chalk.dim(dirname + path.sep) + chalk.bold(basename))
  }

  if (basenameLength + 4 === maxLength) {
    return slash(chalk.dim(`...${path.sep}`) + chalk.bold(basename))
  }

  // can't fit dirname, but can fit trimmed basename
  return slash(
    chalk.bold(
      `...${basename.slice(basename.length - maxLength - 4, basename.length)}`
    )
  )
}
