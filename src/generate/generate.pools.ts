import { rowReader } from '../data/json-row.reader.ts'
import type { RowReader } from '../data/json-row.reader.ts'
import { COUNTRIES, SPECIES } from '../data/model.types.ts'
import type { Country } from '../data/model.types.ts'
import poolsJson from './generate.pools.json' with { type: 'json' }
import type { Weighted } from './generate.random.ts'

function byCountry<T>(read: (country: Country) => T) {
  return Object.fromEntries(COUNTRIES.map((country) => [country, read(country)])) as Record<Country, T>
}

function readNames(row: RowReader) {
  return { female: row.texts('female'), male: row.texts('male'), surnames: row.texts('surnames') }
}

function readCity(row: RowReader): Weighted<string> {
  return { value: row.text('name'), weight: row.number('weight') }
}

function readBreed(row: RowReader) {
  return {
    species: row.oneOf({ key: 'species', values: SPECIES }),
    name: row.text('name'),
    minKg: row.number('minKg'),
    maxKg: row.number('maxKg'),
    weight: row.number('weight'),
    countries: row.optional({ key: 'countries', read: (key) => row.listOf({ key, values: COUNTRIES }) }) ?? [...COUNTRIES],
  }
}

function readCarrier(row: RowReader) {
  return { name: row.text('name'), trackingPrefix: row.text('trackingPrefix') }
}

export type Breed = ReturnType<typeof readBreed>

function readPools() {
  const row = rowReader({ raw: poolsJson, where: 'generate.pools.json' })
  const names = row.child('names')
  const cities = row.child('cities')
  const carriers = row.child('carriers')
  const petNames = row.child('petNames')
  return {
    names: byCountry((country) => readNames(names.child(country))),
    cities: byCountry((country) => cities.list(country).map(readCity)),
    breeds: row.list('breeds').map(readBreed),
    petNames: { dog: petNames.texts('dog'), cat: petNames.texts('cat') },
    allergies: row.texts('allergies'),
    customerNotes: row.texts('customerNotes'),
    carriers: byCountry((country) => readCarrier(carriers.child(country))),
  }
}

export const POOLS = readPools()
