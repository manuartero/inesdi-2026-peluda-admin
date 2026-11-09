// Build gate: `pnpm check:data` (also run by `pnpm build`) validates every data file and the UI labels.
// The browser never sees the answer keys (the build strips them), so they can only be checked here.
import ticketsJson from '../../data/handwritten/tickets.handwritten.json' with { type: 'json' }
import { HANDWRITTEN } from './handwritten.data.ts'
import { LABELS } from './model.labels.ts'
import { parseList, parseTicketAnswerKey } from './model.parse.ts'

const answerKeys = parseList({ json: ticketsJson, file: 'tickets.handwritten.json', parse: parseTicketAnswerKey })
const { customers, pets, tickets, products, suppliers, plans } = HANDWRITTEN

console.log(
  [
    'Data OK:',
    `${tickets.length} tickets (${answerKeys.length} answer keys),`,
    `${customers.length} customers, ${pets.length} pets,`,
    `${plans.length} plans, ${products.length} products, ${suppliers.length} suppliers,`,
    `${Object.keys(LABELS).length} label groups.`,
  ].join(' '),
)
