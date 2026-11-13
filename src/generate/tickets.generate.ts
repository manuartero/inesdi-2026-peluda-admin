import type { RowReader } from '../data/json-row.reader.ts'
import { UTC_OFFSET_HOURS } from '../data/model.dates.ts'
import { parseList } from '../data/model.parse.ts'
import { COUNTRIES, REFERENCE_DATE, SPECIES, TICKET_CATEGORIES, URGENCIES } from '../data/model.types.ts'
import type { Country, IsoDate, Ticket } from '../data/model.types.ts'
import { personName } from './customers.generate.ts'
import { fillIn, pickHousehold } from './generate.people.ts'
import type { Household } from './generate.people.ts'
import type { Random } from './generate.random.ts'
import { addDays, withTime } from './generate.dates.ts'
import templatesJson from './tickets.templates.json' with { type: 'json' }

// ~150 tickets a day, split like the subscribers. Today the handwritten 30 are on top of these 120.
const TODAY_COUNT: Record<Country, number> = { ES: 65, MX: 29, CO: 12, PE: 10, AR: 4 }
const PREVIOUS_DAY_COUNT: Record<Country, number> = { ES: 81, MX: 36, CO: 15, PE: 13, AR: 5 }
const DAILY_SIZE = 150
// With a 26 h first response, the inbox still holds the two days before today: 450 unclassified tickets.
const BACKLOG_DAYS = 2
const DAY_MINUTES = 24 * 60
// The last ticket lands at 17:50 Madrid time, ten minutes before session 1 starts.
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

// localTime({ date: '2026-11-24', country: 'MX', madrid: 600 }) is '2026-11-24T03:00:00': 10:00 in Madrid is 03:00 in Mexico City.
function localTime({ date, country, madrid }: { date: IsoDate; country: Country; madrid: number }) {
  const shiftMinutes = (UTC_OFFSET_HOURS.ES - UTC_OFFSET_HOURS[country]) * 60
  return withTime({ date, minutes: madrid - shiftMinutes })
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

type TicketSlot = { date: IsoDate; country: Country; madrid: number }

function draftTicket(input: { random: Random; households: Household[]; slot: TicketSlot; template: TicketTemplate }) {
  const { random, households, slot, template } = input
  const { date, country, madrid } = slot
  const channel = random.weighted<Ticket['channel']>([
    { value: 'email', weight: 35 },
    { value: 'form', weight: 20 },
    { value: 'app', weight: 25 },
    { value: 'whatsapp', weight: 20 },
  ])
  const writer = chooseWriter({ random, households, country, template })
  const values = { firstName: writer.firstName, pet: writer.pet ?? '' }
  return {
    date,
    madrid,
    receivedAt: localTime({ date, country, madrid }),
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

// Handwritten tickets keep their numbers (0004, 0009…); filler takes the free ones up to 0150, in arrival order.
// freeTicketNumbers({ date: '2026-11-23', taken }) is TCK-20261123-0001 … TCK-20261123-0150.
function freeTicketNumbers({ date, taken }: { date: IsoDate; taken: Set<string> }) {
  const day = date.replaceAll('-', '')
  const numbers = Array.from({ length: DAILY_SIZE }, (_, index) => `TCK-${day}-${String(index + 1).padStart(4, '0')}`)
  return numbers.filter((id) => !taken.has(id))
}

// The slots of one day: when and from where each ticket arrives. Today's first Spanish one is the 17:50 ticket.
function daySlots({ random, date }: { random: Random; date: IsoDate }) {
  const isToday = date === REFERENCE_DATE
  const counts = isToday ? TODAY_COUNT : PREVIOUS_DAY_COUNT
  const lastArrival = isToday ? LAST_ARRIVAL_MINUTES : DAY_MINUTES
  return COUNTRIES.flatMap((country) =>
    Array.from({ length: counts[country] }, (_, index): TicketSlot => {
      const isLastOfToday = isToday && country === 'ES' && index === 0
      const madrid = isLastOfToday ? LAST_ARRIVAL_MINUTES : madridMinutes({ random, lastArrival })
      return { date, country, madrid }
    }),
  )
}

type DayInput = { random: Random; households: Household[]; decks: Record<string, () => TicketTemplate>; date: IsoDate; taken: Set<string> }

function dayTickets({ random, households, decks, date, taken }: DayInput) {
  const drafts = daySlots({ random, date }).map((slot) => draftTicket({ random, households, slot, template: decks[regionOf(slot.country)]() }))
  drafts.sort((a, b) => a.madrid - b.madrid)
  const ids = freeTicketNumbers({ date, taken })
  if (ids.length !== drafts.length) {
    throw new Error(`tickets ${date}: ${drafts.length} filler tickets for ${ids.length} free numbers`)
  }
  return drafts.map(({ date: _date, madrid: _madrid, ...ticket }, index): Ticket => ({ id: ids[index], ...ticket }))
}

// backlogDates() is ['2026-11-22', '2026-11-23', '2026-11-24'].
const backlogDates = () => Array.from({ length: BACKLOG_DAYS + 1 }, (_, index) => addDays({ date: REFERENCE_DATE, days: index - BACKLOG_DAYS }))

/**
 * The filler tickets of the inbox: 420 on top of the 30 handwritten ones, 450 in all.
 * - 150 a day: today (up to 17:50) and the two days before, still unclassified.
 * - Spanish customers write with «vosotros», Latin American ones with «ustedes».
 * - Their answer key carries `handwritten: false` and no trap.
 */
export function generateTickets({ random, households, handwrittenIds }: { random: Random; households: Household[]; handwrittenIds: string[] }) {
  const decks = Object.fromEntries(REGIONS.map((region) => [region, random.deck(TEMPLATES.filter((t) => t.region === region))]))
  const taken = new Set(handwrittenIds)
  return backlogDates().flatMap((date) => dayTickets({ random, households, decks, date, taken }))
}
