import { resolve } from 'node:path'

export const root = resolve(import.meta.dirname, '..')
export const fixtures = resolve(import.meta.dirname, 'fixtures')
export const bin = resolve(root, 'bin')
export const run = resolve(bin, 'run.sh')
