// The generator counts in days from today: -22 is 22 days ago, 6 is in 6 days. The files get them as `-22d` and `+6d`.
export type Day = number

// relativeDay(-22) is '-22d', relativeDay(6) is '+6d' and relativeDay(0) is '0d'.
export const relativeDay = (day: Day) => (day > 0 ? `+${day}d` : `${day}d`)

// dayOf('-22d') is -22. Rows the generator reads (subscriptions, orders, products) only hold plain day offsets.
export function dayOf(relative: string) {
  const match = /^([+-]?\d+)d$/.exec(relative)
  if (match === null) {
    throw new Error(`expected a relative day like -22d, got ${relative}`)
  }
  return Number(match[1])
}

export const CYCLE_DAYS = 28

// Orders ship every 4 weeks from the start day: nextCycleAfter({ start: -48, day: 0 }) is 8.
export function nextCycleAfter({ start, day }: { start: Day; day: Day }) {
  const cycles = Math.floor((day - start) / CYCLE_DAYS) + 1
  return start + Math.max(cycles, 0) * CYCLE_DAYS
}
