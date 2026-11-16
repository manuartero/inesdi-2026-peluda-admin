import type { Country, Customer, Pet, Species, Subscription } from '../data/model.types.ts'
import { POOLS } from './generate.pools.ts'
import type { Random } from './generate.random.ts'

export type Household = { customer: Customer; pets: Pet[] }

// Customers who still receive boxes, with their pets: the ones who write tickets and reviews today.
export function households({ customers, pets, subscriptions }: { customers: Customer[]; pets: Pet[]; subscriptions: Subscription[] }) {
  const stillSubscribed = new Set(subscriptions.filter((subscription) => subscription.status !== 'cancelled').map((s) => s.customerId))
  return customers
    .filter((customer) => stillSubscribed.has(customer.id))
    .map((customer) => ({ customer, pets: pets.filter((pet) => pet.customerId === customer.id) }))
}

// pickHousehold({ random, households, country: 'MX', species: 'cat' }) returns a Mexican customer with a cat, and that cat.
export function pickHousehold(input: { random: Random; households: Household[]; country: Country; species?: Species }) {
  const { random, country, species } = input
  const matches = input.households.filter(
    (household) => household.customer.country === country && household.pets.some((pet) => species === undefined || pet.species === species),
  )
  const household = random.pick(matches)
  const pet = random.pick(household.pets.filter((candidate) => species === undefined || candidate.species === species))
  return { customer: household.customer, pet }
}

// fillIn({ text: 'Hola, {pet}', values: { pet: 'Lola' } }) is 'Hola, Lola'.
export function fillIn({ text, values }: { text: string; values: Record<string, string> }) {
  return text.replace(/\{(\w+)\}/g, (placeholder, key: string) => values[key] ?? placeholder)
}

export function personName({ random, country }: { random: Random; country: Country }) {
  const names = POOLS.names[country]
  const firstName = random.pick(random.chance(0.5) ? names.female : names.male)
  const firstSurname = random.pick(names.surnames)
  const twoSurnames = country !== 'AR' || random.chance(0.3)
  const lastName = twoSurnames ? `${firstSurname} ${random.pick(names.surnames)}` : firstSurname
  return { firstName, lastName }
}

// freeIds({ first: 1001, count: 3, taken, format: (n) => `TCK-${n}` }) is TCK-1001, TCK-1002 and TCK-1003, skipping any ID in `taken`.
export function freeIds(input: { first: number; count: number; taken: Set<string>; format: (number: number) => string }) {
  const { first, count, taken, format } = input
  const ids: string[] = []
  for (let number = first; ids.length < count; number++) {
    const id = format(number)
    if (!taken.has(id)) {
      ids.push(id)
    }
  }
  return ids
}
