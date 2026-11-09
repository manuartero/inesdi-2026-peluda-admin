import type { RowReader } from '../data/json-row.reader.ts'
import { rowReader } from '../data/json-row.reader.ts'
import { parseList } from '../data/model.parse.ts'
import { COUNTRIES, REFERENCE_DATE, SPECIES, STARS } from '../data/model.types.ts'
import type { Country, Review } from '../data/model.types.ts'
import { personName } from './customers.generate.ts'
import { addDays } from './generate.dates.ts'
import { fillIn, pickHousehold } from './generate.people.ts'
import type { Household } from './generate.people.ts'
import type { Random } from './generate.random.ts'
import templatesJson from './reviews.templates.json' with { type: 'json' }

// With the handwritten 20 (average 3,0), these 100 bring the overall average to ≈ 4,3, as in the dossier.
const STAR_COUNT: Record<Review['stars'], number> = { 5: 68, 4: 24, 3: 4, 2: 2, 1: 2 }
const REVIEW_COUNT: Record<Country, number> = { ES: 56, MX: 22, CO: 10, PE: 8, AR: 4 }
// ~30 % answered overall, almost all positive: 6 handwritten + 28 positive + 2 mixed here.
const ANSWERED_POSITIVE = 28
const ANSWERED_MIXED = 2
const DAYS_BACK = 30
// Handwritten reviews go from REV-2026-0401 to REV-2026-0420.
const FIRST_REVIEW_NUMBER = 300

const REGIONS = ['es', 'latam', 'ar', 'any'] as const
type Region = (typeof REGIONS)[number]
const REGIONS_BY_COUNTRY: Record<Country, Region[]> = {
  ES: ['es', 'any'],
  MX: ['latam', 'any'],
  CO: ['latam', 'any'],
  PE: ['latam', 'any'],
  AR: ['ar', 'latam', 'any'],
}

function readStars(row: RowReader) {
  const value = row.number('stars')
  const stars = STARS.find((candidate) => candidate === value)
  if (stars === undefined) {
    throw new Error(`reviews.templates.json › stars: expected 1 to 5, got ${value}`)
  }
  return stars
}

function readTemplate(row: RowReader) {
  return {
    stars: readStars(row),
    region: row.oneOf({ key: 'region', values: REGIONS }),
    species: row.optional({ key: 'species', read: (key) => row.oneOf({ key, values: SPECIES }) }),
    title: row.text('title'),
    text: row.text('text'),
  }
}

type ReviewTemplate = ReturnType<typeof readTemplate>

function readReplies(row: RowReader) {
  return { withPet: row.texts('withPet'), withoutPet: row.texts('withoutPet'), mixed: row.texts('mixed'), signers: row.texts('signers') }
}

const templatesRow = rowReader({ raw: templatesJson, where: 'reviews.templates.json' })
const TEMPLATES = parseList({ json: templatesJson.reviews, file: 'reviews.templates.json › reviews', parse: readTemplate })
const REPLIES = Object.fromEntries(COUNTRIES.map((country) => [country, readReplies(templatesRow.child('replies').child(country))])) as Record<
  Country,
  ReturnType<typeof readReplies>
>

const kindOf = (stars: Review['stars']) => (stars >= 4 ? 'positive' : stars === 3 ? 'mixed' : 'negative')

// A template deck per country and star rating, so the same text rarely shows up twice in a row.
function templateDecks(random: Random) {
  const decks = new Map<string, () => ReviewTemplate>()
  return ({ country, stars }: { country: Country; stars: Review['stars'] }) => {
    const key = `${country}-${stars}`
    const existing = decks.get(key)
    if (existing !== undefined) {
      return existing()
    }
    const matches = TEMPLATES.filter((template) => template.stars === stars && REGIONS_BY_COUNTRY[country].includes(template.region))
    const deck = random.deck(matches)
    decks.set(key, deck)
    return deck()
  }
}

// Bad reviews land on Google, where we rarely know who wrote them; app and web reviews come from logged-in customers.
function reviewChannel({ random, stars }: { random: Random; stars: Review['stars'] }) {
  if (stars <= 2) {
    return 'google' as const
  }
  return random.weighted<Review['channel']>([
    { value: 'google', weight: 50 },
    { value: 'app', weight: 25 },
    { value: 'web', weight: 25 },
  ])
}

function draftReview(input: { random: Random; households: Household[]; country: Country; stars: Review['stars']; template: ReviewTemplate }) {
  const { random, households, country, stars, template } = input
  const channel = reviewChannel({ random, stars })
  const known = channel === 'google' ? undefined : pickHousehold({ random, households, country, species: template.species })
  const writer = known?.customer ?? personName({ random, country })
  return {
    date: addDays({ date: REFERENCE_DATE, days: -random.int({ min: 0, max: DAYS_BACK }) }),
    channel,
    country,
    customerId: known?.customer.id,
    author: `${writer.firstName} ${writer.lastName.slice(0, 1)}.`,
    stars,
    title: channel === 'google' ? undefined : template.title,
    text: template.text,
    firstName: writer.firstName,
    pet: known?.pet.name,
  }
}

type ReviewDraft = ReturnType<typeof draftReview>

// The brand voice per country: «tú» in Spain, Mexico and Peru, «usted» in Colombia, «vos» in Argentina. One emoji, only when positive.
function replyFor({ random, draft }: { random: Random; draft: ReviewDraft }) {
  const replies = REPLIES[draft.country]
  const positive = draft.stars >= 4
  const withPet = positive && draft.pet !== undefined && random.chance(0.7)
  const pool = positive ? (withPet ? replies.withPet : replies.withoutPet) : replies.mixed
  const body = fillIn({ text: random.pick(pool), values: { name: draft.firstName, pet: draft.pet ?? '' } })
  const signature = `${random.pick(replies.signers)}, del equipo de Peluda${positive ? ' 🐾' : ''}`
  return `${body}\n\n${signature}`
}

function answeredDrafts({ random, drafts }: { random: Random; drafts: ReviewDraft[] }) {
  const notToday = drafts.filter((draft) => draft.date < REFERENCE_DATE)
  const positive = random.shuffle(notToday.filter((draft) => draft.stars >= 4)).slice(0, ANSWERED_POSITIVE)
  const mixed = random.shuffle(notToday.filter((draft) => draft.stars === 3)).slice(0, ANSWERED_MIXED)
  return new Set([...positive, ...mixed])
}

/**
 * ~100 filler reviews from the last month, on top of the 20 handwritten ones.
 * - Stars are dealt from fixed counts, so the average never drifts with the seed.
 * - Their answer key carries `handwritten: false` and no trap.
 */
export function generateReviews({ random, households }: { random: Random; households: Household[] }) {
  const stars = random.shuffle(STARS.flatMap((value) => Array.from({ length: STAR_COUNT[value] }, () => value)))
  const countries = random.shuffle(COUNTRIES.flatMap((country) => Array.from({ length: REVIEW_COUNT[country] }, () => country)))
  const nextTemplate = templateDecks(random)
  const drafts = countries.map((country, index) => {
    const template = nextTemplate({ country, stars: stars[index] })
    return draftReview({ random, households, country, stars: stars[index], template })
  })
  drafts.sort((a, b) => a.date.localeCompare(b.date))
  const answered = answeredDrafts({ random, drafts })

  return drafts.map(({ firstName: _firstName, pet: _pet, ...draft }, index): Review => {
    const isAnswered = answered.has(drafts[index])
    return {
      id: `REV-2026-${String(FIRST_REVIEW_NUMBER + index).padStart(4, '0')}`,
      ...draft,
      status: isAnswered ? 'answered' : 'unanswered',
      reply: isAnswered ? replyFor({ random, draft: drafts[index] }) : undefined,
      answerKey: { kind: kindOf(draft.stars), handwritten: false },
    }
  })
}
