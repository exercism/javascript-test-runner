//
// This is only a SKELETON file for the 'Clock' exercise. It's been provided as a
// convenience to get you started writing code faster.
//

const MINUTES_PER_HOUR = 60
const HOURS_ON_THE_CLOCK = 24
const MINUTES_PER_CLOCK = MINUTES_PER_HOUR * HOURS_ON_THE_CLOCK

function normalize(minutes) {
  while (minutes < 0) {
    minutes += MINUTES_PER_CLOCK
  }

  return minutes % MINUTES_PER_CLOCK
}

function clockPad(number) {
  return String(number).padStart(2, '0')
}

export class Clock {
  constructor(hours, minutes = 0) {
    this.minutes = normalize(hours * MINUTES_PER_HOUR + minutes)
  }

  toString() {
    const hours = Math.floor(this.minutes / MINUTES_PER_HOUR)
    const minutes = this.minutes % MINUTES_PER_HOUR

    return `${clockPad(hours)}:${clockPad(minutes)}`
  }

  plus(minutes) {
    return new Clock(0, this.minutes + minutes)
  }

  minus(minutes) {
    return this.plus(-minutes)
  }

  valueOf() {
    return this.minutes
  }

  equals(other) {
    return +other === +this
  }
}
