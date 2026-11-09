// Reads one object from a data JSON and fails loudly on the first wrong field, so a typo breaks the build.
// Imports inside src/data/ keep the `.ts` extension so `node` can run data-check.cli.ts without a bundler.

type Row = Record<string, unknown>

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/

export function dataError(message: string) {
  const error = new Error(message)
  error.name = 'DataError'
  return error
}

export function isDataError(error: unknown) {
  return error instanceof Error && error.name === 'DataError'
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
// `tickets.handwritten.json #3 (TCK-20261124-0012) › subject: expected a non-empty string, got 42`.
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

  const date = (key: string) => {
    const value = text(key)
    if (!ISO_DATE.test(value)) {
      return fail({ key, expected: 'a date like 2026-11-24 or 2026-11-24T09:15:00' })
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

  return { has, text, number, flag, date, oneOf, texts, listOf, child, list, optional }
}

export type RowReader = ReturnType<typeof rowReader>
