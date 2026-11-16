import { RELATIVE_AGO, RELATIVE_DAY, dataError } from './json-row.reader.ts'
import { NOW_MS, TODAY } from './model.types.ts'
import type { Contract, Country, Customer, Order, Pet, Product, Review, Subscription, Ticket, WithoutAnswerKey } from './model.types.ts'

// The data files never name a day: every date counts from now (formats in json-row.reader.ts), so the CMS always looks current.

const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * MINUTE_MS

export const TIME_ZONE: Record<Country, string> = {
  ES: 'Europe/Madrid',
  MX: 'America/Mexico_City',
  CO: 'America/Bogota',
  PE: 'America/Lima',
  AR: 'America/Argentina/Buenos_Aires',
}

const todayMs = () => Date.parse(`${TODAY}T00:00:00Z`)
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

function firstOfMonth(monthsFromNow: number) {
  const today = new Date(todayMs())
  return Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + monthsFromNow, 1)
}

// On 2026-11-16, resolveDay('-22d') is '2026-10-25' and resolveDay('+2M-1d') is '2026-12-31'.
export function resolveDay(relative: string) {
  const match = RELATIVE_DAY.exec(relative)
  if (match === null) {
    throw dataError(`expected a relative day like -22d or +2M-1d, got ${relative}`)
  }
  const [, months, days] = match
  const start = months === undefined ? todayMs() : firstOfMonth(Number(months))
  return isoDay(start + Number(days ?? 0) * DAY_MS)
}

// minutesAgo('-1d3h10m') is 1630.
export function minutesAgo(relative: string) {
  const match = RELATIVE_AGO.exec(relative)
  if (match === null) {
    throw dataError(`expected a time ago like -1d3h10m, got ${relative}`)
  }
  const [, days, hours, minutes] = match.map(Number)
  return (days || 0) * 24 * 60 + (hours || 0) * 60 + (minutes || 0)
}

const WALL_CLOCK = new Map<string, Intl.DateTimeFormat>()

function wallClockFormat(zone: string) {
  const known = WALL_CLOCK.get(zone)
  if (known !== undefined) {
    return known
  }
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' } as const
  const format = new Intl.DateTimeFormat('en-US', { ...options, hourCycle: 'h23', timeZone: zone })
  WALL_CLOCK.set(zone, format)
  return format
}

// wallClockIn({ ms: Date.parse('2026-11-16T09:00:00Z'), zone: 'Europe/Madrid' }) is '2026-11-16T10:00:00'.
export function wallClockIn({ ms, zone }: { ms: number; zone: string }) {
  const parts = Object.fromEntries(wallClockFormat(zone).formatToParts(new Date(ms)).map((part) => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
}

function textFormatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-ES', { ...options, timeZone: 'UTC' })
}

const DATE_FORMATS = {
  date: textFormatter({ day: 'numeric', month: 'long' }),
  month: textFormatter({ month: 'long' }),
  weekday: textFormatter({ weekday: 'long' }),
  WEEKDAY: textFormatter({ weekday: 'long' }),
  short: textFormatter({ day: 'numeric', month: 'numeric' }),
  nextMonth: textFormatter({ month: 'long' }),
  longDate: textFormatter({ day: 'numeric', month: 'long', year: 'numeric' }),
}
type DateFormat = keyof typeof DATE_FORMATS

const DATE_TOKEN = /\{(date|month|weekday|WEEKDAY|short|nextMonth|longDate):([^}]+)\}/g
const LEFTOVER_TOKEN = /\{\w+:[^}]*\}/

const dayFromOffset = ({ format, offset }: { format: DateFormat; offset: string }) => {
  if (format === 'longDate') {
    return resolveDay(offset)
  }
  if (format === 'nextMonth') {
    return isoDay(firstOfMonth(Number(offset)) + 14 * DAY_MS)
  }
  return resolveDay(`${offset}d`)
}

// On 2026-11-16: '{date:-22}' is «25 de octubre», '{nextMonth:1}' «diciembre», '{longDate:+2M-1d}' «31 de diciembre de 2026».
function tokenText({ format, offset }: { format: DateFormat; offset: string }) {
  const text = DATE_FORMATS[format].format(new Date(`${dayFromOffset({ format, offset })}T00:00:00Z`))
  return format === 'WEEKDAY' ? text.toUpperCase() : text
}

/**
 * Turns the date tokens of a handwritten text into dates around today.
 * - `{date:-22}` «25 de octubre» · `{month:+7}` «noviembre» · `{weekday:-4}` «jueves» · `{WEEKDAY:0}` «LUNES» · `{short:-18}` «29/10».
 * - The number is days from today, like the `-22d` dates of the rows, so texts and orders keep matching.
 * - `{nextMonth:1}` «diciembre» (in November) counts months, for plans like «a partir de diciembre».
 * - `{longDate:-34M}` «1 de enero de 2024» takes a relative day, for the contracts.
 * Throws on a token it does not know, such as `{fecha:-3}`.
 */
export function resolveDateTokens({ text, where }: { text: string; where: string }) {
  const resolved = text.replace(DATE_TOKEN, (_token, format: DateFormat, offset: string) => tokenText({ format, offset }))
  const leftover = LEFTOVER_TOKEN.exec(resolved)
  if (leftover) {
    throw dataError(`${where}: unknown date token ${leftover[0]}`)
  }
  return resolved
}

const resolveOptional = ({ text, where }: { text: string | undefined; where: string }) => text && resolveDateTokens({ text, where })
const resolveOptionalDay = (relative: string | undefined) => relative && resolveDay(relative)

export const resolveCustomer = (customer: Customer): Customer => ({
  ...customer,
  signupDate: resolveDay(customer.signupDate),
  notes: resolveOptional({ text: customer.notes, where: `${customer.id} › notes` }),
})

export const resolvePet = (pet: Pet): Pet => ({ ...pet, birthDate: resolveDay(pet.birthDate) })

export const resolveProduct = (product: Product): Product => ({ ...product, availableFrom: resolveDay(product.availableFrom) })

export const resolveContract = <T extends WithoutAnswerKey<Contract>>(contract: T): T => ({
  ...contract,
  signedOn: resolveDay(contract.signedOn),
  startDate: resolveDay(contract.startDate),
  expiryOnRecord: resolveDay(contract.expiryOnRecord),
})

export const resolveSubscription = (subscription: Subscription): Subscription => ({
  ...subscription,
  startDate: resolveDay(subscription.startDate),
  cancelDate: resolveOptionalDay(subscription.cancelDate),
  nextShipment: resolveOptionalDay(subscription.nextShipment),
})

export const resolveOrder = (order: Order): Order => ({
  ...order,
  date: resolveDay(order.date),
  charges: order.charges.map((charge) => ({ ...charge, date: resolveDay(charge.date) })),
})

// A ticket that arrived 3 h ago: `receivedAt` is the sender's wall clock, `receivedAtMadrid` the team's.
export const resolveTicket = <T extends WithoutAnswerKey<Ticket>>(ticket: T) => {
  const ago = minutesAgo(ticket.receivedAt)
  const arrivalMs = NOW_MS - ago * MINUTE_MS
  return {
    ...ticket,
    receivedAt: wallClockIn({ ms: arrivalMs, zone: TIME_ZONE[ticket.country] }),
    receivedAtMadrid: wallClockIn({ ms: arrivalMs, zone: TIME_ZONE.ES }),
    minutesAgo: ago,
    subject: resolveDateTokens({ text: ticket.subject, where: `${ticket.id} › subject` }),
    message: resolveDateTokens({ text: ticket.message, where: `${ticket.id} › message` }),
  }
}

export const resolveReview = <T extends WithoutAnswerKey<Review>>(review: T): T => ({
  ...review,
  date: resolveDay(review.date),
  title: resolveOptional({ text: review.title, where: `${review.id} › title` }),
  text: resolveDateTokens({ text: review.text, where: `${review.id} › text` }),
  reply: resolveOptional({ text: review.reply, where: `${review.id} › reply` }),
})
