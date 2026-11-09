import type { IsoDate } from '../data/model.types.ts'

const DAY_MS = 24 * 60 * 60 * 1000

// Plain calendar days in UTC, like model.dates.ts: the machine's time zone never moves a date.
const toTime = (date: IsoDate) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`)
const fromTime = (time: number) => new Date(time).toISOString().slice(0, 10)

// addDays({ date: '2026-11-02', days: 28 }) is '2026-11-30'.
export const addDays = ({ date, days }: { date: IsoDate; days: number }) => fromTime(toTime(date) + days * DAY_MS)

// daysBetween({ from: '2026-11-20', to: '2026-11-24' }) is 4.
export const daysBetween = ({ from, to }: { from: IsoDate; to: IsoDate }) => Math.round((toTime(to) - toTime(from)) / DAY_MS)

// dayOfYear('2026-11-02') is 306.
export const dayOfYear = (date: IsoDate) => daysBetween({ from: `${date.slice(0, 4)}-01-01`, to: date }) + 1

// latest(['2026-07-01', '2025-03-24']) is '2026-07-01'.
export const latest = (dates: IsoDate[]) => dates.reduce((a, b) => (a > b ? a : b))
export const earliest = (dates: IsoDate[]) => dates.reduce((a, b) => (a < b ? a : b))

// withTime({ date: '2026-11-24', minutes: 530 }) is '2026-11-24T08:50:00'; negative minutes fall on the day before.
export function withTime({ date, minutes }: { date: IsoDate; minutes: number }) {
  return new Date(toTime(date) + minutes * 60 * 1000).toISOString().slice(0, 19)
}

export const CYCLE_DAYS = 28

// Orders ship every 4 weeks from the start date: nextCycleAfter({ start: '2026-10-07', date: '2026-11-24' }) is '2026-12-02'.
export function nextCycleAfter({ start, date }: { start: IsoDate; date: IsoDate }) {
  const cycles = Math.floor(daysBetween({ from: start, to: date }) / CYCLE_DAYS) + 1
  return addDays({ date: start, days: Math.max(cycles, 0) * CYCLE_DAYS })
}
