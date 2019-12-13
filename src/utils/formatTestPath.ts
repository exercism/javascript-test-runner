import path from  'path'
import chalk from 'chalk'
import slash from 'slash'

import { relativePath } from './relativePath'

export function formatTestPath(config: jest.ProjectConfig | jest.GlobalConfig, testPath: string): string {
  const { dirname, basename } = relativePath(config, testPath);

  return slash(chalk.dim(dirname + path.sep) + chalk.bold(basename));
};
