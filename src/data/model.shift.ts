import { dataError } from './json-row.reader.ts'
import { addDays, daysBetween } from './model.dates.ts'
import { DATA_DATE, TODAY } from './model.types.ts'
import type { Customer, IsoDate, Order, Pet, Product, Review, Subscription, Ticket, WithoutAnswerKey } from './model.types.ts'

// The data is written for DATA_DATE; on 2026-12-01 everything moves 7 days later, so «hoy» is always today.
const SHIFT_DAYS = daysBetween({ from: DATA_DATE, to: TODAY })

const shift = (iso: IsoDate) => addDays({ iso, days: SHIFT_DAYS })
const shiftOptional = (iso: IsoDate | undefined) => iso && shift(iso)

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
}
type DateFormat = keyof typeof DATE_FORMATS

const DATE_TOKEN = /\{(date|month|weekday|WEEKDAY|short|nextMonth):([+-]?\d+)\}/g
const LEFTOVER_TOKEN = /\{\w+:[^}]*\}/

// In November, monthsAhead(1) is a day in December and monthsAhead(2) one in January.
function monthsAhead(months: number) {
  const today = new Date(`${TODAY}T00:00:00Z`)
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + months, 15))
}

// '{date:-22}' is «2 de noviembre» when today is the data date, 24 November; '{nextMonth:1}' is «diciembre» all November.
function tokenText({ format, offset }: { format: DateFormat; offset: number }) {
  const date = format === 'nextMonth' ? monthsAhead(offset) : new Date(`${addDays({ iso: TODAY, days: offset })}T00:00:00Z`)
  const text = DATE_FORMATS[format].format(date)
  return format === 'WEEKDAY' ? text.toUpperCase() : text
}

/**
 * Turns the date tokens of a handwritten text into dates around today.
 * - `{date:-22}` «2 de noviembre» · `{month:+7}` «diciembre» · `{weekday:-4}` «viernes» · `{WEEKDAY:0}` «MARTES» · `{short:-18}` «6/11».
 * - The number is days from DATA_DATE, so the texts keep matching the shifted orders and charges.
 * - Except `{nextMonth:1}` «diciembre» (in November): months from today, for plans like «a partir de diciembre».
 * Throws on a token it does not know, such as `{fecha:-3}`.
 */
export function resolveDateTokens({ text, where }: { text: string; where: string }) {
  const resolved = text.replace(DATE_TOKEN, (_token, format: DateFormat, offset: string) => tokenText({ format, offset: Number(offset) }))
  const leftover = LEFTOVER_TOKEN.exec(resolved)
  if (leftover) {
    throw dataError(`${where}: unknown date token ${leftover[0]}`)
  }
  return resolved
}

const resolveOptional = ({ text, where }: { text: string | undefined; where: string }) => text && resolveDateTokens({ text, where })

// 'TCK-20261124-0004' becomes 'TCK-20261201-0004' on 2026-12-01: the ID carries the day the ticket arrived.
function shiftTicketId(id: string) {
  const day = id.slice(4, 12)
  const shifted = shift(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`).replaceAll('-', '')
  return `TCK-${shifted}${id.slice(12)}`
}

export const shiftCustomer = (customer: Customer): Customer => ({
  ...customer,
  signupDate: shift(customer.signupDate),
  notes: resolveOptional({ text: customer.notes, where: `${customer.id} › notes` }),
})

export const shiftPet = (pet: Pet): Pet => ({ ...pet, birthDate: shift(pet.birthDate) })

export const shiftProduct = (product: Product): Product => ({ ...product, availableFrom: shift(product.availableFrom) })

export const shiftSubscription = (subscription: Subscription): Subscription => ({
  ...subscription,
  startDate: shift(subscription.startDate),
  cancelDate: shiftOptional(subscription.cancelDate),
  nextShipment: shiftOptional(subscription.nextShipment),
})

export const shiftOrder = (order: Order): Order => ({
  ...order,
  date: shift(order.date),
  charges: order.charges.map((charge) => ({ ...charge, date: shift(charge.date) })),
})

export const shiftTicket = <T extends WithoutAnswerKey<Ticket>>(ticket: T): T => ({
  ...ticket,
  id: shiftTicketId(ticket.id),
  receivedAt: shift(ticket.receivedAt),
  subject: resolveDateTokens({ text: ticket.subject, where: `${ticket.id} › subject` }),
  message: resolveDateTokens({ text: ticket.message, where: `${ticket.id} › message` }),
})

export const shiftReview = <T extends WithoutAnswerKey<Review>>(review: T): T => ({
  ...review,
  date: shift(review.date),
  title: resolveOptional({ text: review.title, where: `${review.id} › title` }),
  text: resolveDateTokens({ text: review.text, where: `${review.id} › text` }),
  reply: resolveOptional({ text: review.reply, where: `${review.id} › reply` }),
})
