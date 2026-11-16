import { DAY_MINUTES } from '@/data/model.types.ts'
import { DATA } from '@/data/peluda.data.ts'

export type InboxTicket = (typeof DATA.tickets)[number]

const byArrival = (a: InboxTicket, b: InboxTicket) => b.minutesAgo - a.minutesAgo

export const INBOX = [...DATA.tickets].sort(byArrival)

// ageInDays(ticket) is 0 for a ticket from the last 24 hours, 1 for one from 24 to 48 hours ago…
export const ageInDays = (ticket: InboxTicket) => Math.floor(ticket.minutesAgo / DAY_MINUTES)

export const LAST_24_HOURS = INBOX.filter((ticket) => ageInDays(ticket) === 0)

// INBOX_AGES is [0, 1, 2]: the inbox goes back three days.
export const INBOX_AGES = [...new Set(INBOX.map(ageInDays))].sort()

export const findTicket = (id: string | undefined) => INBOX.find((ticket) => ticket.id === id)

export const ticketsOf = (customerId: string) => INBOX.filter((ticket) => ticket.customerId === customerId)
