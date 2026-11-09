import { DATA } from '@/data/peluda.data.ts'
import { isOnReferenceDate, madridTime } from '@/data/model.dates.ts'
import type { Ticket, WithoutAnswerKey } from '@/data/model.types.ts'

type ShownTicket = WithoutAnswerKey<Ticket>

// Latin American tickets carry their local time: the inbox orders everything by Madrid time, as the team sees it.
function withMadridTime(ticket: ShownTicket) {
  return { ...ticket, receivedAtMadrid: madridTime({ local: ticket.receivedAt, country: ticket.country }) }
}

export type InboxTicket = ReturnType<typeof withMadridTime>

const byArrival = (a: InboxTicket, b: InboxTicket) => a.receivedAtMadrid.localeCompare(b.receivedAtMadrid)

export const INBOX = DATA.tickets.map(withMadridTime).sort(byArrival)

export const UNCLASSIFIED_TODAY = INBOX.filter(
  (ticket) => ticket.status === 'unclassified' && isOnReferenceDate(ticket.receivedAtMadrid),
)

export const findTicket = (id: string | undefined) => INBOX.find((ticket) => ticket.id === id)

