import { COUNTRIES, CURRENCY_BY_COUNTRY, DATA_DATE } from '../data/model.types.ts'
import type { Country, Customer, IsoDate, Pet, Plan, Species, Subscription } from '../data/model.types.ts'
import { addDays, daysBetween, earliest, latest, nextCycleAfter } from './generate.dates.ts'
import { POOLS } from './generate.pools.ts'
import { subscriptionPrice } from './generate.prices.ts'
import type { Random } from './generate.random.ts'

// ~600 customers split like the dossier's subscribers: 9.812 · 3.947 · 1.836 · 1.429 · 540.
const CUSTOMER_COUNT: Record<Country, number> = { ES: 333, MX: 132, CO: 60, PE: 51, AR: 24 }
// Peluda opens in Spain in 2021, Mexico in 2023, Peru in 2024, Colombia in 2025 and Argentina in 2026.
const LAUNCH_DATE: Record<Country, IsoDate> = { ES: '2021-09-01', MX: '2023-04-01', PE: '2024-03-01', CO: '2025-02-01', AR: '2026-03-01' }
const LAST_SIGNUP: IsoDate = '2026-11-10'
// Handwritten customers go from CUS-00101 to CUS-00599.
const FIRST_CUSTOMER_NUMBER = 1000
const DOG_SHARE = 0.75
const CARE_COUNTRIES: Country[] = ['ES', 'MX']

type CustomerBaseInput = { random: Random; plans: Plan[]; takenEmails: string[] }

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')

// phoneFor({ country: 'MX', number: '01042' }) is '+52 55 0000 1042': test numbers, like the handwritten ones.
function phoneFor({ country, number }: { country: Country; number: string }) {
  const tail = number.slice(1)
  const formats: Record<Country, string> = {
    ES: `+34 600 00${tail.slice(0, 1)} ${tail.slice(1)}`,
    MX: `+52 55 0000 ${tail}`,
    CO: `+57 300 000 ${tail}`,
    PE: `+51 900 00${tail.slice(0, 1)} ${tail.slice(1)}`,
    AR: `+54 11 0000 ${tail}`,
  }
  return formats[country]
}

// Signups lean towards recent months: the company keeps growing.
function signupDate({ random, country }: { random: Random; country: Country }) {
  const span = daysBetween({ from: LAUNCH_DATE[country], to: LAST_SIGNUP })
  return addDays({ date: LAUNCH_DATE[country], days: Math.floor(span * random.next() ** 0.6) })
}

export function personName({ random, country }: { random: Random; country: Country }) {
  const names = POOLS.names[country]
  const firstName = random.pick(random.chance(0.5) ? names.female : names.male)
  const firstSurname = random.pick(names.surnames)
  const twoSurnames = country !== 'AR' || random.chance(0.3)
  const lastName = twoSurnames ? `${firstSurname} ${random.pick(names.surnames)}` : firstSurname
  return { firstName, lastName }
}

function uniqueEmail({ firstName, lastName, taken }: { firstName: string; lastName: string; taken: Set<string> }) {
  const base = `${slug(firstName.split(' ')[0])}.${slug(lastName.split(' ')[0])}`
  let email = `${base}@example.com`
  for (let suffix = 2; taken.has(email); suffix++) {
    email = `${base}${suffix}@example.com`
  }
  taken.add(email)
  return email
}

function customerDraft({ random, country }: { random: Random; country: Country }) {
  return { country, signupDate: signupDate({ random, country }), ...personName({ random, country }) }
}

type CustomerDraft = ReturnType<typeof customerDraft>

function toCustomer({ random, draft, index, taken }: { random: Random; draft: CustomerDraft; index: number; taken: Set<string> }) {
  const number = String(FIRST_CUSTOMER_NUMBER + index).padStart(5, '0')
  const customer: Customer = {
    id: `CUS-${number}`,
    firstName: draft.firstName,
    lastName: draft.lastName,
    email: uniqueEmail({ firstName: draft.firstName, lastName: draft.lastName, taken }),
    phone: phoneFor({ country: draft.country, number }),
    country: draft.country,
    city: random.weighted(POOLS.cities[draft.country]),
    signupDate: draft.signupDate,
  }
  if (random.chance(0.06)) {
    customer.notes = random.pick(POOLS.customerNotes)
  }
  return customer
}

const roundWeight = (kg: number) => (kg < 10 ? Math.round(kg * 10) / 10 : Math.round(kg * 2) / 2)

// Ages lean young: most pets are between 1 and 8 years old.
const ageInMonths = (random: Random) => 7 + Math.floor(173 * random.next() ** 1.3)

function petActivity({ random, ageMonths }: { random: Random; ageMonths: number }) {
  if (ageMonths >= 120) {
    return random.chance(0.6) ? 'low' : 'medium'
  }
  return random.weighted<Pet['activity']>([
    { value: 'low', weight: 25 },
    { value: 'medium', weight: 50 },
    { value: 'high', weight: 25 },
  ])
}

function generatePet({ random, customer, index, usedNames }: { random: Random; customer: Customer; index: number; usedNames: Set<string> }) {
  const species: Species = random.chance(DOG_SHARE) ? 'dog' : 'cat'
  const breeds = POOLS.breeds.filter((breed) => breed.species === species && breed.countries.includes(customer.country))
  const breed = random.weighted(breeds.map((value) => ({ value, weight: value.weight })))
  const names = POOLS.petNames[species].filter((name) => !usedNames.has(name))
  const name = random.pick(names)
  usedNames.add(name)
  const ageMonths = ageInMonths(random)
  const adultKg = breed.minKg + (breed.maxKg - breed.minKg) * random.next()
  const growth = ageMonths < 12 ? 0.5 + ageMonths / 24 : 1
  const pet: Pet = {
    id: `PET-${customer.id.slice(4)}-${index + 1}`,
    customerId: customer.id,
    name,
    species,
    breed: breed.name,
    birthDate: addDays({ date: DATA_DATE, days: -Math.round(ageMonths * 30.4) - random.int({ min: 0, max: 20 }) }),
    weightKg: roundWeight(adultKg * growth),
    activity: petActivity({ random, ageMonths }),
    allergies: random.chance(0.12) ? [random.pick(POOLS.allergies)] : [],
  }
  return { pet, ageMonths }
}

function kibbleFor({ species, country, ageMonths }: { species: Species; country: Country; ageMonths: number }) {
  if (country === 'ES') {
    if (species === 'cat') {
      return 'PRD-KIBBLE-ADULT-CAT'
    }
    return ageMonths < 12 ? 'PRD-KIBBLE-PUPPY-DOG' : 'PRD-KIBBLE-ADULT-DOG'
  }
  const suffix = country === 'AR' ? 'AR' : 'LATAM'
  return species === 'dog' ? `PRD-KIBBLE-ADULT-DOG-${suffix}` : `PRD-KIBBLE-ADULT-CAT-${suffix}`
}

function dietFor({ pet, country, ageMonths }: { pet: Pet; country: Country; ageMonths: number }) {
  if (country !== 'ES') {
    return 'PRD-DIET-LATAM'
  }
  if (pet.allergies.length > 0) {
    return 'PRD-DIET-SENSITIVE-SKIN'
  }
  return ageMonths >= 96 ? 'PRD-DIET-SENIOR' : 'PRD-DIET-WEIGHT'
}

// The Cuidado plan needs a diet and the VetAmiga network, which only exist in Spain and Mexico.
function choosePlan({ random, pet, country, ageMonths }: { random: Random; pet: Pet; country: Country; ageMonths: number }) {
  const careAvailable = CARE_COUNTRIES.includes(country)
  const needsCare = ageMonths >= 108 || pet.allergies.length > 0
  if (careAvailable && random.chance(needsCare ? 0.6 : 0.05)) {
    return 'care'
  }
  return random.chance(0.45) ? 'basic' : 'complete'
}

function productIdsFor({ plan, pet, country, ageMonths }: { plan: Plan['id']; pet: Pet; country: Country; ageMonths: number }) {
  if (plan === 'care') {
    return [dietFor({ pet, country, ageMonths })]
  }
  const kibble = kibbleFor({ species: pet.species, country, ageMonths })
  if (plan === 'basic') {
    return [kibble]
  }
  return [kibble, pet.species === 'dog' ? 'PRD-TREAT-DOG' : 'PRD-TREAT-CAT', 'PRD-TOY-QUARTERLY']
}

// The first pet subscribes at signup; a second one joins later. Nobody starts in the last 20 days, so everyone has an order.
function startDate({ random, customer, pet, index }: { random: Random; customer: Customer; pet: Pet; index: number }) {
  const joined = index === 0 ? customer.signupDate : addDays({ date: customer.signupDate, days: random.int({ min: 30, max: 540 }) })
  const weaned = addDays({ date: pet.birthDate, days: 60 })
  const latestStart = latest([addDays({ date: DATA_DATE, days: -20 }), customer.signupDate])
  return earliest([latest([joined, weaned]), latestStart])
}

type Lifecycle = { status: Subscription['status']; cancelDate?: IsoDate; pausedSince?: IsoDate }

// About 10 % cancelled in the last year and 5 % paused; the rest active.
function lifecycle({ random, start }: { random: Random; start: IsoDate }): Lifecycle {
  const age = daysBetween({ from: start, to: DATA_DATE })
  const roll = random.next()
  if (age > 90 && roll < 0.1) {
    const from = latest([addDays({ date: start, days: 56 }), addDays({ date: DATA_DATE, days: -365 })])
    const span = daysBetween({ from, to: addDays({ date: DATA_DATE, days: -5 }) })
    return { status: 'cancelled', cancelDate: addDays({ date: from, days: random.int({ min: 0, max: span }) }) }
  }
  if (age > 60 && roll < 0.15) {
    const pausedSince = latest([addDays({ date: DATA_DATE, days: -random.int({ min: 10, max: 90 }) }), addDays({ date: start, days: 30 })])
    return { status: 'paused', pausedSince }
  }
  return { status: 'active' }
}

function findPlan({ plans, id }: { plans: Plan[]; id: Plan['id'] }) {
  const plan = plans.find((candidate) => candidate.id === id)
  if (plan === undefined) {
    throw new Error(`plans.handwritten.json: no plan ${id}`)
  }
  return plan
}

function generateSubscription(input: { random: Random; plans: Plan[]; customer: Customer; pet: Pet; ageMonths: number; index: number }) {
  const { random, plans, customer, pet, ageMonths, index } = input
  const country = customer.country
  const planId = choosePlan({ random, pet, country, ageMonths })
  const start = startDate({ random, customer, pet, index })
  const { status, cancelDate, pausedSince } = lifecycle({ random, start })
  const subscription: Subscription = {
    id: `SUB-${pet.id.slice(4)}`,
    customerId: customer.id,
    petId: pet.id,
    planId,
    status,
    startDate: start,
    cancelDate,
    monthlyPrice: subscriptionPrice({ plan: findPlan({ plans, id: planId }), country, weightKg: pet.weightKg }),
    currency: CURRENCY_BY_COUNTRY[country],
    productIds: productIdsFor({ plan: planId, pet, country, ageMonths }),
    nextShipment: status === 'active' ? nextCycleAfter({ start, date: DATA_DATE }) : undefined,
  }
  return { subscription, pausedSince }
}

/**
 * The generated customer base: ~600 customers (CUS-01000 on), one or two pets each and one subscription per pet.
 * - IDs follow signup order across countries.
 * - `pausedSince` is not stored: it tells the order generator when a paused subscription stopped shipping.
 */
export function generateCustomerBase({ random, plans, takenEmails }: CustomerBaseInput) {
  const drafts = COUNTRIES.flatMap((country) =>
    Array.from({ length: CUSTOMER_COUNT[country] }, () => customerDraft({ random, country })),
  )
  drafts.sort((a, b) => a.signupDate.localeCompare(b.signupDate))
  const taken = new Set(takenEmails)
  const customers = drafts.map((draft, index) => toCustomer({ random, draft, index, taken }))

  const pets: Pet[] = []
  const subscriptions: Subscription[] = []
  const pausedSince = new Map<string, IsoDate>()
  for (const customer of customers) {
    const petCount = random.weighted([
      { value: 1, weight: 78 },
      { value: 2, weight: 20 },
      { value: 3, weight: 2 },
    ])
    const usedNames = new Set<string>()
    for (let index = 0; index < petCount; index++) {
      const { pet, ageMonths } = generatePet({ random, customer, index, usedNames })
      const generated = generateSubscription({ random, plans, customer, pet, ageMonths, index })
      pets.push(pet)
      subscriptions.push(generated.subscription)
      if (generated.pausedSince !== undefined) {
        pausedSince.set(generated.subscription.id, generated.pausedSince)
      }
    }
  }
  return { customers, pets, subscriptions, pausedSince }
}
