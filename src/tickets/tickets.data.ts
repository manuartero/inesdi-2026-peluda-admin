import { countryFromParam } from '@/app/list-filters.params.ts'
import { DAY_MINUTES } from '@/data/model.types.ts'
import type { Country } from '@/data/model.types.ts'
import { DATA } from '@/data/peluda.data.ts'

export type InboxTicket = (typeof DATA.tickets)[number]

const byArrival = (a: InboxTicket, b: InboxTicket) => b.minutesAgo - a.minutesAgo

export const INBOX = [...DATA.tickets].sort(byArrival)

// ageInDays(ticket) is 0 for a ticket from the last 24 hours, 1 for one from 24 to 48 hours ago…
export const ageInDays = (ticket: InboxTicket) => Math.floor(ticket.minutesAgo / DAY_MINUTES)

export const LAST_24_HOURS = INBOX.filter((ticket) => ageInDays(ticket) === 0)

// INBOX_AGES is [0, 1, 2]: the inbox goes back three days.
export const INBOX_AGES = [...new Set(INBOX.map(ageInDays))].sort()

export type TicketFilters = { country?: Country; age?: number }

export const ageFromParam = (param: string | null) => INBOX_AGES.find((age) => String(age) === param)

// ticketFilters(new URLSearchParams('country=MX&age=0')) is { country: 'MX', age: 0 }; unknown values count as no filter.
export const ticketFilters = (params: URLSearchParams) => ({
  country: countryFromParam(params.get('country')),
  age: ageFromParam(params.get('age')),
})

export function matchesTicket({ ticket, filters }: { ticket: InboxTicket; filters: TicketFilters }) {
  const countryMatches = !filters.country || ticket.country === filters.country
  const ageMatches = filters.age === undefined || ageInDays(ticket) === filters.age
  return countryMatches && ageMatches
}

export const filterInbox = (params: URLSearchParams) => {
  const filters = ticketFilters(params)
  return INBOX.filter((ticket) => matchesTicket({ ticket, filters }))
}

export const findTicket = (id: string | undefined) => INBOX.find((ticket) => ticket.id === id)

export const ticketsOf = (customerId: string) => INBOX.filter((ticket) => ticket.customerId === customerId)
