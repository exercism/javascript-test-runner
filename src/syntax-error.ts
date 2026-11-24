// Node loads the files as native ES modules, so a syntax error comes straight
// from Node, as just "SyntaxError: Unexpected token 'const'", with no file
// name or line. Babel used to name the file and show the line. When the
// message has no file name, we parse the exercise's files with acorn to find
// the error, and report it in the same shape as Babel did:
//
//   SyntaxError: <solution>/two-fer.js: Unexpected keyword 'const' (1:13)
//
//     > 1 | export const const () => { (
//         |              ^
//       2 |

import fs from 'fs'
import path from 'path'
import { parse } from 'acorn'

type AcornSyntaxError = SyntaxError & { loc?: { line: number; column: number } }

export function locateSyntaxError(
  specFilePath: string,
  message: string
): string {
  if (
    !message.includes('SyntaxError: ') ||
    message.includes('SyntaxError: /')
  ) {
    return message
  }

  const dir = path.dirname(specFilePath)
  const files = fs
    .readdirSync(dir)
    .filter((file) => /\.m?js$/.test(file) && !file.includes('.config.'))
    .map((file) => path.join(dir, file))
    .sort((a, b) => Number(a === specFilePath) - Number(b === specFilePath))

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    try {
      parse(source, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        allowHashBang: true,
      })
    } catch (error) {
      const { loc, message: reason } = error as AcornSyntaxError
      if (!loc) {
        continue
      }
      return `SyntaxError: ${file}: ${reason}\n\n${codeFrame(source, loc.line, loc.column)}\n`
    }
  }

  return message
}

// Shows the lines around the error in the same layout as Babel's code frame.
function codeFrame(source: string, line: number, column: number): string {
  const lines = source.split(/\r?\n/)
  const first = Math.max(1, line - 2)
  const last = Math.min(lines.length, line + 3)
  const width = String(last).length
  const frame: string[] = []

  for (let n = first; n <= last; n++) {
    const marker = n === line ? '>' : ' '
    const code = lines[n - 1] ? ` ${lines[n - 1]}` : ''
    frame.push(`    ${marker} ${String(n).padStart(width)} |${code}`)
    if (n === line) {
      frame.push(`      ${' '.repeat(width)} | ${' '.repeat(column)}^`)
    }
  }

  return frame.join('\n')
}
