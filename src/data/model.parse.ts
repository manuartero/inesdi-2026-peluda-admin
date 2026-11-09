import { asList, rowReader } from './json-row.reader.ts'
import {
  COUNTRIES,
  PET_ACTIVITIES,
  PLAN_IDS,
  PRODUCT_KINDS,
  SPECIES,
  TICKET_CATEGORIES,
  TICKET_CHANNELS,
  TICKET_STATUSES,
  URGENCIES,
} from './model.types.ts'
import type {
  Company,
  Customer,
  Pet,
  Plan,
  Product,
  Supplier,
  Ticket,
  TicketAnswerKey,
  WithoutAnswerKey,
} from './model.types.ts'
import type { RowReader } from './json-row.reader.ts'

type Parse<T> = (row: RowReader) => T

function countryRecord(row: RowReader) {
  return Object.fromEntries(COUNTRIES.map((country) => [country, row.number(country)])) as Record<
    (typeof COUNTRIES)[number],
    number
  >
}

export const parsePlan: Parse<Plan> = (row) => ({
  id: row.oneOf({ key: 'id', values: PLAN_IDS }),
  name: row.text('name'),
  includes: row.text('includes'),
  prices: countryRecord(row.child('prices')),
})

export const parseProduct: Parse<Product> = (row) => ({
  id: row.text('id'),
  name: row.text('name'),
  kind: row.oneOf({ key: 'kind', values: PRODUCT_KINDS }),
  species: row.oneOf({ key: 'species', values: [...SPECIES, 'both'] }),
  manufacturerId: row.optional({ key: 'manufacturerId', read: row.text }),
  markets: row.listOf({ key: 'markets', values: COUNTRIES }),
  availableFrom: row.date('availableFrom'),
  replaces: row.optional({ key: 'replaces', read: row.text }),
})

export const parseSupplier: Parse<Supplier> = (row) => {
  const contact = row.child('contact')
  return {
    id: row.text('id'),
    legalName: row.text('legalName'),
    taxId: row.text('taxId'),
    country: row.oneOf({ key: 'country', values: COUNTRIES }),
    city: row.text('city'),
    service: row.text('service'),
    contact: { name: contact.text('name'), email: contact.text('email') },
    contractId: row.optional({ key: 'contractId', read: row.text }),
  }
}

export const parseCustomer: Parse<Customer> = (row) => ({
  id: row.text('id'),
  firstName: row.text('firstName'),
  lastName: row.text('lastName'),
  email: row.text('email'),
  phone: row.text('phone'),
  country: row.oneOf({ key: 'country', values: COUNTRIES }),
  city: row.text('city'),
  signupDate: row.date('signupDate'),
  notes: row.optional({ key: 'notes', read: row.text }),
})

export const parsePet: Parse<Pet> = (row) => ({
  id: row.text('id'),
  customerId: row.text('customerId'),
  name: row.text('name'),
  species: row.oneOf({ key: 'species', values: SPECIES }),
  breed: row.text('breed'),
  birthDate: row.date('birthDate'),
  weightKg: row.number('weightKg'),
  activity: row.oneOf({ key: 'activity', values: PET_ACTIVITIES }),
  allergies: row.texts('allergies'),
})

export const parseTicket: Parse<WithoutAnswerKey<Ticket>> = (row) => ({
  id: row.text('id'),
  receivedAt: row.date('receivedAt'),
  country: row.oneOf({ key: 'country', values: COUNTRIES }),
  channel: row.oneOf({ key: 'channel', values: TICKET_CHANNELS }),
  customerId: row.optional({ key: 'customerId', read: row.text }),
  orderId: row.optional({ key: 'orderId', read: row.text }),
  sender: row.text('sender'),
  subject: row.text('subject'),
  message: row.text('message'),
  status: row.oneOf({ key: 'status', values: TICKET_STATUSES }),
})

export const parseTicketAnswerKey: Parse<TicketAnswerKey> = (ticketRow) => {
  const row = ticketRow.child('answerKey')
  return {
    category: row.oneOf({ key: 'category', values: TICKET_CATEGORIES }),
    urgency: row.oneOf({ key: 'urgency', values: URGENCIES }),
    trap: row.optional({ key: 'trap', read: row.text }),
    handwritten: row.flag('handwritten'),
  }
}

export const parseCompany: Parse<Company> = (row) => {
  const firstResponse = row.child('firstResponseHours')
  return {
    subscribers: countryRecord(row.child('subscribers')),
    annualRevenueEur: row.number('annualRevenueEur'),
    monthlyChurnPct: row.number('monthlyChurnPct'),
    ticketsPerDay: row.number('ticketsPerDay'),
    firstResponseHours: { current: firstResponse.number('current'), target: firstResponse.number('target') },
    reviewsPerMonth: row.number('reviewsPerMonth'),
    reviewsAnsweredPct: row.number('reviewsAnsweredPct'),
    averageRating: row.number('averageRating'),
  }
}

// parseList({ json, file: 'pets.handwritten.json', parse }) names the bad row: `pets.handwritten.json #4 (PET-00103-2) › …`.
export function parseList<T>({ json, file, parse }: { json: unknown; file: string; parse: Parse<T> }) {
  const rows = asList({ json, where: file })
  return rows.map((raw, index) => parse(rowReader({ raw, where: `${file} #${index}` })))
}

export function parseOne<T>({ json, file, parse }: { json: unknown; file: string; parse: Parse<T> }) {
  return parse(rowReader({ raw: json, where: file }))
}
