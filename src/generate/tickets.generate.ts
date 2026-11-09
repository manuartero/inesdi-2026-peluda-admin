import type { RowReader } from '../data/json-row.reader.ts'
import { UTC_OFFSET_HOURS } from '../data/model.dates.ts'
import { parseList } from '../data/model.parse.ts'
import { COUNTRIES, REFERENCE_DATE, SPECIES, TICKET_CATEGORIES, URGENCIES } from '../data/model.types.ts'
import type { Country, Ticket } from '../data/model.types.ts'
import { personName } from './customers.generate.ts'
import { fillIn, pickHousehold } from './generate.people.ts'
import type { Household } from './generate.people.ts'
import type { Random } from './generate.random.ts'
import { withTime } from './generate.dates.ts'
import templatesJson from './tickets.templates.json' with { type: 'json' }

// 150 tickets today in total, split like the subscribers. The handwritten 30 are on top of these.
const TICKET_COUNT: Record<Country, number> = { ES: 65, MX: 29, CO: 12, PE: 10, AR: 4 }
const INBOX_SIZE = 150
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
function madridMinutes(random: Random) {
  if (random.chance(0.12)) {
    return random.int({ min: 0, max: WORKDAY_START_MINUTES - 1 })
  }
  return random.int({ min: WORKDAY_START_MINUTES, max: LAST_ARRIVAL_MINUTES - 1 })
}

// localTime({ country: 'MX', madrid: 600 }) is '2026-11-24T03:00:00': 10:00 in Madrid is 03:00 in Mexico City.
function localTime({ country, madrid }: { country: Country; madrid: number }) {
  const shiftMinutes = (UTC_OFFSET_HOURS.ES - UTC_OFFSET_HOURS[country]) * 60
  return withTime({ date: REFERENCE_DATE, minutes: madrid - shiftMinutes })
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

function draftTicket(input: { random: Random; households: Household[]; country: Country; template: TicketTemplate; madrid: number }) {
  const { random, households, country, template, madrid } = input
  const channel = random.weighted<Ticket['channel']>([
    { value: 'email', weight: 35 },
    { value: 'form', weight: 20 },
    { value: 'app', weight: 25 },
    { value: 'whatsapp', weight: 20 },
  ])
  const writer = chooseWriter({ random, households, country, template })
  const values = { firstName: writer.firstName, pet: writer.pet ?? '' }
  return {
    madrid,
    receivedAt: localTime({ country, madrid }),
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
function freeTicketNumbers(handwrittenIds: string[]) {
  const taken = new Set(handwrittenIds)
  const numbers = Array.from({ length: INBOX_SIZE }, (_, index) => `TCK-20261124-${String(index + 1).padStart(4, '0')}`)
  return numbers.filter((id) => !taken.has(id))
}

/**
 * Today's filler tickets: ~120 on top of the 30 handwritten ones, 150 in all.
 * - Spanish customers write with «vosotros», Latin American ones with «ustedes».
 * - Their answer key carries `handwritten: false` and no trap.
 */
export function generateTickets({ random, households, handwrittenIds }: { random: Random; households: Household[]; handwrittenIds: string[] }) {
  const decks = Object.fromEntries(REGIONS.map((region) => [region, random.deck(TEMPLATES.filter((t) => t.region === region))]))
  const drafts = COUNTRIES.flatMap((country) =>
    Array.from({ length: TICKET_COUNT[country] }, (_, index) => {
      const madrid = country === 'ES' && index === 0 ? LAST_ARRIVAL_MINUTES : madridMinutes(random)
      const template = decks[regionOf(country)]()
      return draftTicket({ random, households, country, template, madrid })
    }),
  )
  drafts.sort((a, b) => a.madrid - b.madrid)
  const ids = freeTicketNumbers(handwrittenIds)
  if (ids.length !== drafts.length) {
    throw new Error(`tickets: ${drafts.length} filler tickets for ${ids.length} free numbers`)
  }
  return drafts.map(({ madrid: _madrid, ...ticket }, index): Ticket => ({ id: ids[index], ...ticket }))
}
