import { asList, dataError, rowReader } from './json-row.reader.ts'
import {
  CHARGE_STATUSES,
  CONTRACT_TRAP_KINDS,
  COUNTRIES,
  CURRENCY_BY_COUNTRY,
  ORDER_STATUSES,
  PET_ACTIVITIES,
  PLAN_IDS,
  PRODUCT_KINDS,
  REVIEW_CHANNELS,
  REVIEW_KINDS,
  REVIEW_STATUSES,
  SPECIES,
  STARS,
  SUBSCRIPTION_STATUSES,
  TICKET_CATEGORIES,
  TICKET_CHANNELS,
  TICKET_STATUSES,
  URGENCIES,
} from './model.types.ts'
import type {
  Company,
  Contract,
  Customer,
  Order,
  Pet,
  Plan,
  Product,
  Review,
  ReviewAnswerKey,
  Subscription,
  Supplier,
  Ticket,
  TicketAnswerKey,
  WithoutAnswerKey,
} from './model.types.ts'
import type { RowReader } from './json-row.reader.ts'

export type Parse<T> = (row: RowReader) => T

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

export const parseContract: Parse<WithoutAnswerKey<Contract>> = (row) => ({
  id: row.text('id'),
  supplierId: row.text('supplierId'),
  title: row.text('title'),
  signedOn: row.date('signedOn'),
  startDate: row.date('startDate'),
  expiryOnRecord: row.date('expiryOnRecord'),
  file: row.text('file'),
})

export const parseContractAnswerKey: Parse<Contract['answerKey']> = (contractRow) => {
  const traps = contractRow.child('answerKey').list('traps')
  return {
    traps: traps.map((trap) => ({
      kind: trap.oneOf({ key: 'kind', values: CONTRACT_TRAP_KINDS }),
      clause: trap.text('clause'),
      explanation: trap.text('explanation'),
    })),
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

const CURRENCIES = Object.values(CURRENCY_BY_COUNTRY)

export const parseSubscription: Parse<Subscription> = (row) => ({
  id: row.text('id'),
  customerId: row.text('customerId'),
  petId: row.text('petId'),
  planId: row.oneOf({ key: 'planId', values: PLAN_IDS }),
  status: row.oneOf({ key: 'status', values: SUBSCRIPTION_STATUSES }),
  startDate: row.date('startDate'),
  cancelDate: row.optional({ key: 'cancelDate', read: row.date }),
  monthlyPrice: row.number('monthlyPrice'),
  currency: row.oneOf({ key: 'currency', values: CURRENCIES }),
  productIds: row.texts('productIds'),
  nextShipment: row.optional({ key: 'nextShipment', read: row.date }),
})

export const parseOrder: Parse<Order> = (row) => ({
  id: row.text('id'),
  subscriptionId: row.text('subscriptionId'),
  customerId: row.text('customerId'),
  date: row.date('date'),
  lines: row.list('lines').map((line) => ({ productId: line.text('productId'), quantity: line.number('quantity') })),
  amount: row.number('amount'),
  currency: row.oneOf({ key: 'currency', values: CURRENCIES }),
  status: row.oneOf({ key: 'status', values: ORDER_STATUSES }),
  carrier: row.text('carrier'),
  trackingNumber: row.text('trackingNumber'),
  charges: row.list('charges').map((charge) => ({
    date: charge.date('date'),
    amount: charge.number('amount'),
    status: charge.oneOf({ key: 'status', values: CHARGE_STATUSES }),
  })),
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

function readStars(row: RowReader) {
  const value = row.number('stars')
  const stars = STARS.find((candidate) => candidate === value)
  if (stars === undefined) {
    throw dataError(`${row.text('id')} › stars: expected 1 to 5, got ${value}`)
  }
  return stars
}

export const parseReview: Parse<WithoutAnswerKey<Review>> = (row) => ({
  id: row.text('id'),
  date: row.date('date'),
  channel: row.oneOf({ key: 'channel', values: REVIEW_CHANNELS }),
  country: row.oneOf({ key: 'country', values: COUNTRIES }),
  customerId: row.optional({ key: 'customerId', read: row.text }),
  author: row.text('author'),
  stars: readStars(row),
  title: row.optional({ key: 'title', read: row.text }),
  text: row.text('text'),
  status: row.oneOf({ key: 'status', values: REVIEW_STATUSES }),
  reply: row.optional({ key: 'reply', read: row.text }),
})

export const parseReviewAnswerKey: Parse<ReviewAnswerKey> = (reviewRow) => {
  const row = reviewRow.child('answerKey')
  return {
    kind: row.oneOf({ key: 'kind', values: REVIEW_KINDS }),
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
