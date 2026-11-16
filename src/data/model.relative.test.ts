import { afterEach, describe, expect, it, vi } from 'vitest'
import { minutesAgo, wallClockIn } from './model.relative.ts'

// model.types.ts reads the clock when it loads, so each case loads the modules again at a fixed now.
async function resolveDayAt({ now, relative }: { now: string; relative: string }) {
  vi.setSystemTime(new Date(now))
  vi.resetModules()
  const { resolveDay } = await import('./model.relative.ts')
  return resolveDay(relative)
}

afterEach(() => {
  vi.useRealTimers()
})

describe('resolveDay()', () => {
  ;[
    { relative: '0d', expected: '2026-11-16' },
    { relative: '-22d', expected: '2026-10-25' },
    { relative: '+6d', expected: '2026-11-22' },
    { relative: '-34M', expected: '2024-01-01' },
    { relative: '+2M-1d', expected: '2026-12-31' },
    { relative: '+4M-1d', expected: '2027-02-28' },
  ].forEach(({ relative, expected }) =>
    it(`turns ${relative} into ${expected} on 2026-11-16`, async () => {
      vi.useFakeTimers()
      expect(await resolveDayAt({ now: '2026-11-16T10:00:00Z', relative })).toBe(expected)
    }),
  )
})

describe('minutesAgo()', () => {
  it('adds up days, hours and minutes', () => {
    expect(minutesAgo('-1d3h10m')).toBe(1630)
  })

  it('throws on a date that is not relative', () => {
    expect(() => minutesAgo('2026-11-16T10:00:00')).toThrow('expected a time ago')
  })
})

describe('wallClockIn()', () => {
  it('uses the real time zones, summer time included', () => {
    const ms = Date.parse('2026-07-01T12:00:00Z')
    expect({
      madrid: wallClockIn({ ms, zone: 'Europe/Madrid' }),
      mexico: wallClockIn({ ms, zone: 'America/Mexico_City' }),
    }).toEqual({ madrid: '2026-07-01T14:00:00', mexico: '2026-07-01T06:00:00' })
  })
})
