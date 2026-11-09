// Build gate: `pnpm check:data` (also run by `pnpm build`) validates every data file and the UI labels.
// The browser never sees the answer keys (the build strips them), so they can only be checked here.
import { readFileSync } from 'node:fs'
import contractsJson from '../../data/handwritten/contracts.handwritten.json' with { type: 'json' }
import reviewsJson from '../../data/handwritten/reviews.handwritten.json' with { type: 'json' }
import ticketsJson from '../../data/handwritten/tickets.handwritten.json' with { type: 'json' }
import generatedReviewsJson from '../../data/generated/reviews.generated.json' with { type: 'json' }
import generatedTicketsJson from '../../data/generated/tickets.generated.json' with { type: 'json' }
import { dataError } from './json-row.reader.ts'
import { LABELS } from './model.labels.ts'
import { parseContractAnswerKey, parseList, parseReviewAnswerKey, parseTicketAnswerKey } from './model.parse.ts'
import type { Parse } from './model.parse.ts'
import type { ContractTrap } from './model.types.ts'
import { DATA } from './peluda.data.ts'

const HANDWRITTEN_DIR = new URL('../../data/handwritten/', import.meta.url)

// readHandwrittenText('brand-voice.md') fails the build if the file is missing or empty.
function readHandwrittenText(file: string) {
  const text = readFileSync(new URL(file, HANDWRITTEN_DIR), 'utf8')
  if (text.trim() === '') {
    throw dataError(`${file} is empty`)
  }
  return text
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// A `14.2` trap needs a paragraph starting `14.2. …`; a missing «Confidencialidad» must not appear anywhere in the text.
function checkTrap({ contractId, text, trap }: { contractId: string; text: string; trap: ContractTrap }) {
  if (trap.kind === 'missing_clause') {
    if (text.toLowerCase().includes(trap.clause.toLowerCase())) {
      throw dataError(`${contractId} › answerKey: «${trap.clause}» is meant to be missing, but the text mentions it`)
    }
    return
  }
  const paragraph = new RegExp(`^${escapeRegExp(trap.clause)}\\. `, 'm')
  if (!paragraph.test(text)) {
    throw dataError(`${contractId} › answerKey: no paragraph starts with «${trap.clause}.»`)
  }
}

function checkContracts() {
  const answerKeys = parseList({ json: contractsJson, file: 'contracts.handwritten.json', parse: parseContractAnswerKey })
  DATA.contracts.forEach((contract, index) => {
    const text = readHandwrittenText(contract.file)
    for (const trap of answerKeys[index].traps) {
      checkTrap({ contractId: contract.id, text, trap })
    }
  })
  return answerKeys
}

// The `handwritten` flag tells the case tickets from the filler: a filler row flagged `true` would land in the answer key.
function checkHandwrittenFlag({ answerKeys, file, expected }: { answerKeys: { handwritten: boolean }[]; file: string; expected: boolean }) {
  const index = answerKeys.findIndex((answerKey) => answerKey.handwritten !== expected)
  if (index !== -1) {
    throw dataError(`${file} #${index} › answerKey › handwritten: expected ${expected}`)
  }
  return answerKeys
}

function readAnswerKeys<T extends { handwritten: boolean }>(input: { handwritten: unknown; generated: unknown; kind: string; parse: Parse<T> }) {
  const { kind, parse } = input
  const handwrittenFile = `${kind}.handwritten.json`
  const generatedFile = `${kind}.generated.json`
  const handwritten = parseList({ json: input.handwritten, file: handwrittenFile, parse })
  const generated = parseList({ json: input.generated, file: generatedFile, parse })
  return [
    ...checkHandwrittenFlag({ answerKeys: handwritten, file: handwrittenFile, expected: true }),
    ...checkHandwrittenFlag({ answerKeys: generated, file: generatedFile, expected: false }),
  ]
}

const ticketAnswerKeys = readAnswerKeys({ handwritten: ticketsJson, generated: generatedTicketsJson, kind: 'tickets', parse: parseTicketAnswerKey })
const reviewAnswerKeys = readAnswerKeys({ handwritten: reviewsJson, generated: generatedReviewsJson, kind: 'reviews', parse: parseReviewAnswerKey })
const contractAnswerKeys = checkContracts()
readHandwrittenText('brand-voice.md')
const trapCount = contractAnswerKeys.reduce((total, answerKey) => total + answerKey.traps.length, 0)
const { customers, pets, subscriptions, orders, tickets, reviews, products, suppliers, contracts, plans } = DATA

console.log(
  [
    'Data OK:',
    `${tickets.length} tickets (${ticketAnswerKeys.length} answer keys),`,
    `${reviews.length} reviews (${reviewAnswerKeys.length} answer keys),`,
    `${contracts.length} contracts (${trapCount} traps),`,
    `${customers.length} customers, ${pets.length} pets, ${subscriptions.length} subscriptions, ${orders.length} orders,`,
    `${plans.length} plans, ${products.length} products, ${suppliers.length} suppliers,`,
    'the brand voice guide,',
    `${Object.keys(LABELS).length} label groups.`,
  ].join(' '),
)
