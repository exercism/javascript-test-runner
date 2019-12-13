import chalk from 'chalk'

export function printDisplayName(config: jest.ProjectConfig): string {
  const { displayName } = config;

  if (displayName) {
    return chalk.supportsColor
      ? chalk.reset.inverse.white(` ${displayName} `)
      : displayName;
  }

  return '';
}
