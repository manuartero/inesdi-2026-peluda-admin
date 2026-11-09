// `pnpm generate`: writes the fixed-seed filler to data/generated/. Same seed, same files: rerun it after changing a rule or a template.
import { writeFileSync } from 'node:fs'
import { HANDWRITTEN } from '../data/handwritten.data.ts'
import { generateCustomerBase } from './customers.generate.ts'
import { households } from './generate.people.ts'
import { seededRandom } from './generate.random.ts'
import { generateOrders } from './orders.generate.ts'
import { generateReviews } from './reviews.generate.ts'
import { generateTickets } from './tickets.generate.ts'

const SEED = 20261124
const GENERATED_DIR = new URL('../../data/generated/', import.meta.url)

// formatJson({ id: 'PET-01042-1', allergies: [] }) is '{ "id": "PET-01042-1", "allergies": [] }', like the handwritten files.
function formatJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(formatJson).join(', ')}]`
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).filter(([, child]) => child !== undefined)
    return `{ ${entries.map(([key, child]) => `${JSON.stringify(key)}: ${formatJson(child)}`).join(', ')} }`
  }
  return JSON.stringify(value)
}

// One row per line, so a diff after regenerating shows exactly which rows changed.
function writeRows({ file, rows }: { file: string; rows: unknown[] }) {
  const lines = rows.map((row) => `  ${formatJson(row)}`)
  writeFileSync(new URL(file, GENERATED_DIR), `[\n${lines.join(',\n')}\n]\n`)
  return `${rows.length} ${file.split('.')[0]}`
}

function generate() {
  const random = seededRandom(SEED)
  const base = generateCustomerBase({
    random,
    plans: HANDWRITTEN.plans,
    takenEmails: HANDWRITTEN.customers.map((customer) => customer.email),
  })
  const orders = generateOrders({
    random,
    subscriptions: [...HANDWRITTEN.subscriptions, ...base.subscriptions],
    customers: [...HANDWRITTEN.customers, ...base.customers],
    pets: [...HANDWRITTEN.pets, ...base.pets],
    products: HANDWRITTEN.products,
    handwrittenOrders: HANDWRITTEN.orders,
    pausedSince: base.pausedSince,
    withIncidents: new Set(base.subscriptions.map((subscription) => subscription.id)),
  })
  // Filler tickets and reviews come from generated customers only: the case customers say exactly what the cases need.
  const writers = households({ customers: base.customers, pets: base.pets, subscriptions: base.subscriptions })
  const tickets = generateTickets({ random, households: writers, handwrittenIds: HANDWRITTEN.tickets.map((ticket) => ticket.id) })
  const reviews = generateReviews({ random, households: writers })

  const written = [
    writeRows({ file: 'customers.generated.json', rows: base.customers }),
    writeRows({ file: 'pets.generated.json', rows: base.pets }),
    writeRows({ file: 'subscriptions.generated.json', rows: base.subscriptions }),
    writeRows({ file: 'orders.generated.json', rows: orders }),
    writeRows({ file: 'tickets.generated.json', rows: tickets }),
    writeRows({ file: 'reviews.generated.json', rows: reviews }),
  ]
  console.log(`Generated: ${written.join(', ')}.`)
}

generate()
