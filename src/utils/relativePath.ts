import path from 'path'

import { Config } from '@jest/types'

export interface RelativePath {
  basename: string
  dirname: string
}

export function relativePath(config: Config.ProjectConfig | Config.GlobalConfig, testPath: string): RelativePath {
  // this function can be called with ProjectConfigs or GlobalConfigs. GlobalConfigs
  // do not have config.cwd, only config.rootDir. Try using config.cwd, fallback
  // to config.rootDir. (Also, some unit just use config.rootDir, which is ok)
  testPath = path.relative(('cwd' in config && config.cwd) || config.rootDir, testPath);
  const dirname = path.dirname(testPath);
  const basename = path.basename(testPath);

  return { basename, dirname };
}
