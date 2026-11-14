import { DATA } from '@/data/peluda.data.ts'
import { isToday, madridTime } from '@/data/model.dates.ts'
import type { Ticket, WithoutAnswerKey } from '@/data/model.types.ts'

type ShownTicket = WithoutAnswerKey<Ticket>

// Latin American tickets carry their local time: the inbox orders everything by Madrid time, as the team sees it.
function withMadridTime(ticket: ShownTicket) {
  return { ...ticket, receivedAtMadrid: madridTime({ local: ticket.receivedAt, country: ticket.country }) }
}

export type InboxTicket = ReturnType<typeof withMadridTime>

const byArrival = (a: InboxTicket, b: InboxTicket) => a.receivedAtMadrid.localeCompare(b.receivedAtMadrid)

export const INBOX = DATA.tickets.map(withMadridTime).sort(byArrival)

// The whole inbox is unclassified: today's tickets plus the backlog of the two days before.
export const UNCLASSIFIED = INBOX.filter((ticket) => ticket.status === 'unclassified')

export const RECEIVED_TODAY = INBOX.filter((ticket) => isToday(ticket.receivedAtMadrid))

// INBOX_DAYS is ['2026-11-22', '2026-11-23', '2026-11-24'], by Madrid date.
export const INBOX_DAYS = [...new Set(INBOX.map((ticket) => ticket.receivedAtMadrid.slice(0, 10)))]

export const findTicket = (id: string | undefined) => INBOX.find((ticket) => ticket.id === id)

export const ticketsOf = (customerId: string) => INBOX.filter((ticket) => ticket.customerId === customerId)
