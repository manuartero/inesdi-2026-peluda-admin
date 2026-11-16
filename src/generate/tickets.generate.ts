import type { RowReader } from '../data/json-row.reader.ts'
import { parseList } from '../data/model.parse.ts'
import { COUNTRIES, DAY_MINUTES, SPECIES, TICKET_CATEGORIES, URGENCIES } from '../data/model.types.ts'
import type { Country, Ticket } from '../data/model.types.ts'
import { fillIn, freeIds, personName, pickHousehold } from './generate.people.ts'
import type { Household } from './generate.people.ts'
import type { Random } from './generate.random.ts'
import type { Day } from './generate.dates.ts'
import templatesJson from './tickets.templates.json' with { type: 'json' }

// ~150 tickets a day, split like the subscribers, by days from today. Today the handwritten 30 are on top of these 121.
// With a 26 h first response, the inbox still holds the two days before today: 143 + 157 + 151 = 451 unclassified tickets.
const FILLER_COUNT_BY_DAY: Record<number, Record<Country, number>> = {
  [-2]: { ES: 77, MX: 34, CO: 14, PE: 13, AR: 5 },
  [-1]: { ES: 85, MX: 38, CO: 16, PE: 13, AR: 5 },
  0: { ES: 66, MX: 29, CO: 12, PE: 10, AR: 4 },
}
const BACKLOG_DAYS = [-2, -1, 0]
// Arrival times are laid out on a Madrid clock where «now» is 18:00, so the last ticket landed ten minutes ago.
const NOW_MINUTES = 18 * 60
const LAST_ARRIVAL_MINUTES = 17 * 60 + 50
const WORKDAY_START_MINUTES = 7 * 60
const IDENTIFIED_SHARE = 0.88

const REGIONS = ['es', 'latam'] as const

function readTemplate(row: RowReader) {
  return {
    region: row.oneOf({ key: 'region', values: REGIONS }),
    category: row.oneOf({ key: 'category', values: TICKET_CATEGORIES }),
    urgency: row.oneOf({ key: 'urgency', values: URGENCIES }),
    species: row.optional({ key: 'species', read: (key) => row.oneOf({ key, values: SPECIES }) }),
    subject: row.text('subject'),
    message: row.text('message'),
  }
}

type TicketTemplate = ReturnType<typeof readTemplate>

const TEMPLATES = parseList({ json: templatesJson, file: 'tickets.templates.json', parse: readTemplate })

const regionOf = (country: Country) => (country === 'ES' ? 'es' : 'latam')

// Most tickets arrive in Madrid's working day; a few overnight, which is the afternoon in Latin America.
// Today stops at 17:50; the days before run until midnight.
function madridMinutes({ random, lastArrival }: { random: Random; lastArrival: number }) {
  if (random.chance(0.12)) {
    return random.int({ min: 0, max: WORKDAY_START_MINUTES - 1 })
  }
  return random.int({ min: WORKDAY_START_MINUTES, max: lastArrival - 1 })
}

// receivedAgo({ day: -1, madrid: 600 }) is '-1d8h': 10:00 yesterday on a clock where now is 18:00.
function receivedAgo({ day, madrid }: { day: Day; madrid: number }) {
  const minutes = -day * DAY_MINUTES + NOW_MINUTES - madrid
  const days = Math.floor(minutes / DAY_MINUTES)
  const hours = Math.floor((minutes % DAY_MINUTES) / 60)
  const rest = minutes % 60
  return `-${days ? `${days}d` : ''}${hours ? `${hours}h` : ''}${rest ? `${rest}m` : ''}`
}

function unknownPhone({ random, country }: { random: Random; country: Country }) {
  const formats: Record<Country, string> = {
    ES: `+34 600 000 ${random.int({ min: 800, max: 999 })}`,
    MX: `+52 55 0000 ${random.int({ min: 8000, max: 9999 })}`,
    CO: `+57 300 000 ${random.int({ min: 8000, max: 9999 })}`,
    PE: `+51 900 000 ${random.int({ min: 800, max: 999 })}`,
    AR: `+54 11 0000 ${random.int({ min: 8000, max: 9999 })}`,
  }
  return formats[country]
}

type Writer = { firstName: string; lastName: string; customerId?: string; pet?: string }

// Some tickets come from someone we cannot match to a customer; a template that names the pet needs one.
function chooseWriter(input: { random: Random; households: Household[]; country: Country; template: TicketTemplate }): Writer {
  const { random, households, country, template } = input
  const namesPet = template.message.includes('{pet}')
  if (!namesPet && !random.chance(IDENTIFIED_SHARE)) {
    return personName({ random, country })
  }
  const { customer, pet } = pickHousehold({ random, households, country, species: template.species })
  return { firstName: customer.firstName, lastName: customer.lastName, customerId: customer.id, pet: pet.name }
}

// Signed as people sign: the full name in an email, the first name on WhatsApp, the phone when nobody signs.
function senderFor({ random, writer, channel, country }: { random: Random; writer: Writer; channel: Ticket['channel']; country: Country }) {
  const firstSurname = writer.lastName.split(' ')[0]
  if (channel !== 'whatsapp') {
    return `${writer.firstName} ${firstSurname}`
  }
  return writer.customerId === undefined ? unknownPhone({ random, country }) : writer.firstName
}

type TicketSlot = { day: Day; country: Country; madrid: number }

function draftTicket(input: { random: Random; households: Household[]; slot: TicketSlot; template: TicketTemplate }) {
  const { random, households, slot, template } = input
  const { day, country, madrid } = slot
  const channel = random.weighted<Ticket['channel']>([
    { value: 'email', weight: 35 },
    { value: 'form', weight: 20 },
    { value: 'app', weight: 25 },
    { value: 'whatsapp', weight: 20 },
  ])
  const writer = chooseWriter({ random, households, country, template })
  const values = { firstName: writer.firstName, pet: writer.pet ?? '' }
  return {
    day,
    madrid,
    receivedAt: receivedAgo({ day, madrid }),
    country,
    channel,
    customerId: writer.customerId,
    sender: senderFor({ random, writer, channel, country }),
    subject: channel === 'whatsapp' ? '(sin asunto)' : template.subject,
    message: fillIn({ text: template.message, values }),
    status: 'unclassified' as const,
    answerKey: { category: template.category, urgency: template.urgency, handwritten: false },
  }
}

// IDs never carry a date, so a ticket number in a slide or a demo stays valid: today's are TCK-0001 on, yesterday's TCK-1001 on,
// the day before's TCK-2001 on. Handwritten tickets keep their numbers (0004, 0009…); filler takes the free ones, in arrival order.
// ticketNumbers({ day: -1, count: 3, taken }) is TCK-1001, TCK-1002 and TCK-1003.
const ticketNumbers = ({ day, count, taken }: { day: Day; count: number; taken: Set<string> }) =>
  freeIds({ first: -day * 1000 + 1, count, taken, format: (number) => `TCK-${String(number).padStart(4, '0')}` })

// The slots of one day: when and from where each ticket arrives. Today's first Spanish one is the 17:50 ticket.
function daySlots({ random, day }: { random: Random; day: Day }) {
  const isToday = day === 0
  const counts = FILLER_COUNT_BY_DAY[day]
  const lastArrival = isToday ? LAST_ARRIVAL_MINUTES : DAY_MINUTES
  return COUNTRIES.flatMap((country) =>
    Array.from({ length: counts[country] }, (_, index): TicketSlot => {
      const isLastOfToday = isToday && country === 'ES' && index === 0
      const madrid = isLastOfToday ? LAST_ARRIVAL_MINUTES : madridMinutes({ random, lastArrival })
      return { day, country, madrid }
    }),
  )
}

type DayInput = { random: Random; households: Household[]; decks: Record<string, () => TicketTemplate>; day: Day; taken: Set<string> }

function dayTickets({ random, households, decks, day, taken }: DayInput) {
  const drafts = daySlots({ random, day }).map((slot) => draftTicket({ random, households, slot, template: decks[regionOf(slot.country)]() }))
  drafts.sort((a, b) => a.madrid - b.madrid)
  const ids = ticketNumbers({ day, count: drafts.length, taken })
  return drafts.map(({ day: _day, madrid: _madrid, ...ticket }, index): Ticket => ({ id: ids[index], ...ticket }))
}

/**
 * The filler tickets of the inbox: 421 on top of the 30 handwritten ones, 451 in all.
 * - About 150 a day: today (up to 17:50) and the two days before, still unclassified.
 * - Spanish customers write with «vosotros», Latin American ones with «ustedes».
 * - Their answer key carries `handwritten: false` and no trap.
 */
export function generateTickets({ random, households, handwrittenIds }: { random: Random; households: Household[]; handwrittenIds: string[] }) {
  const decks = Object.fromEntries(REGIONS.map((region) => [region, random.deck(TEMPLATES.filter((t) => t.region === region))]))
  const taken = new Set(handwrittenIds)
  return BACKLOG_DAYS.flatMap((day) => dayTickets({ random, households, decks, day, taken }))
}
