import chalk from 'chalk'

const PROGRESS_BAR_WIDTH = 40

export function renderTime(
  runTime: number,
  estimatedTime: number,
  width: number
): string {
  // If we are more than one second over the estimated time, highlight it.
  const renderedTime =
    estimatedTime && runTime >= estimatedTime + 1
      ? chalk.bold.yellow(`${runTime}s`)
      : `${runTime}s`
  let time = `${chalk.bold('Time:')}        ${renderedTime}`
  if (runTime < estimatedTime) {
    time += `, estimated ${estimatedTime}s`
  }

  // Only show a progress bar if the test run is actually going to take
  // some time.
  if (estimatedTime > 2 && runTime < estimatedTime && width) {
    const availableWidth = Math.min(PROGRESS_BAR_WIDTH, width)
    const length = Math.min(
      Math.floor((runTime / estimatedTime) * availableWidth),
      availableWidth
    )
    if (availableWidth >= 2) {
      time += `\n${chalk.green('█').repeat(length)}${chalk
        .white('█')
        .repeat(availableWidth - length)}`
    }
  }

  return time
}
