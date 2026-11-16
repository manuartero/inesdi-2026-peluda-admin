// Reads one object from a data JSON and fails loudly on the first wrong field, so a typo breaks the build.
// Imports inside src/data/ keep the `.ts` extension so `node` can run data-check.cli.ts without a bundler.

type Row = Record<string, unknown>

// Dates in the data files count from now (see model.relative.ts).
// - A day: `-22d` (22 days ago), `+6d`, `0d` (today); `-34M` is the 1st of the month 34 months ago, `+2M-1d` the last day of next month.
// - A ticket's arrival: `-1d3h10m` is 1 day, 3 hours and 10 minutes ago.
export const RELATIVE_DAY = /^(?=.)(?:([+-]\d+)M)?(?:([+-]?\d+)d)?$/
export const RELATIVE_AGO = /^-(?=\d)(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?$/

export function dataError(message: string) {
  const error = new Error(message)
  error.name = 'DataError'
  return error
}

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function asList({ json, where }: { json: unknown; where: string }) {
  if (!Array.isArray(json)) {
    throw dataError(`${where}: expected a list`)
  }
  return json as unknown[]
}

// rowReader({ raw, where: 'tickets.handwritten.json #3' }).text('subject') fails with
// `tickets.handwritten.json #3 (TCK-0012) › subject: expected a non-empty string, got 42`.
export function rowReader({ raw, where }: { raw: unknown; where: string }) {
  if (!isRow(raw)) {
    throw dataError(`${where}: expected an object`)
  }
  const label = typeof raw.id === 'string' ? `${where} (${raw.id})` : where

  const fail = ({ key, expected }: { key: string; expected: string }) => {
    throw dataError(`${label} › ${key}: expected ${expected}, got ${JSON.stringify(raw[key])}`)
  }

  const has = (key: string) => raw[key] !== undefined

  const text = (key: string) => {
    const value = raw[key]
    if (typeof value !== 'string' || value.trim() === '') {
      return fail({ key, expected: 'a non-empty string' })
    }
    return value
  }

  const number = (key: string) => {
    const value = raw[key]
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fail({ key, expected: 'a number' })
    }
    return value
  }

  const flag = (key: string) => {
    const value = raw[key]
    if (typeof value !== 'boolean') {
      return fail({ key, expected: 'true or false' })
    }
    return value
  }

  const day = (key: string) => {
    const value = text(key)
    if (!RELATIVE_DAY.test(value)) {
      return fail({ key, expected: 'a relative day like -22d, +6d, 0d or +2M-1d' })
    }
    return value
  }

  const ago = (key: string) => {
    const value = text(key)
    if (!RELATIVE_AGO.test(value)) {
      return fail({ key, expected: 'a time ago like -1d3h10m or -45m' })
    }
    return value
  }

  const oneOf = <T extends string>({ key, values }: { key: string; values: readonly T[] }) => {
    const value = raw[key]
    const match = values.find((candidate) => candidate === value)
    if (match === undefined) {
      return fail({ key, expected: `one of ${values.join(' · ')}` })
    }
    return match
  }

  const texts = (key: string) => {
    const value = raw[key]
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
      return fail({ key, expected: 'a list of strings' })
    }
    return value as string[]
  }

  const listOf = <T extends string>({ key, values }: { key: string; values: readonly T[] }) => {
    const items = texts(key)
    const unknown = items.find((item) => !values.some((candidate) => candidate === item))
    if (unknown !== undefined) {
      return fail({ key, expected: `a list of ${values.join(' · ')}` })
    }
    return items as T[]
  }

  const child = (key: string) => {
    if (!isRow(raw[key])) {
      return fail({ key, expected: 'an object' })
    }
    return rowReader({ raw: raw[key], where: `${label} › ${key}` })
  }

  // list('traps') reads each item with its own reader: `… › answerKey › traps #1 › kind: expected …`.
  const list = (key: string) => {
    const value = raw[key]
    if (!Array.isArray(value)) {
      return fail({ key, expected: 'a list' })
    }
    return value.map((item, index) => rowReader({ raw: item, where: `${label} › ${key} #${index}` }))
  }

  const optional = <T>({ key, read }: { key: string; read: (key: string) => T }) => {
    if (!has(key)) {
      return undefined
    }
    return read(key)
  }

  return { has, text, number, flag, day, ago, oneOf, texts, listOf, child, list, optional }
}

export type RowReader = ReturnType<typeof rowReader>
