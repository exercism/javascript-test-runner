export function pluralize(word: string, count: number): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
