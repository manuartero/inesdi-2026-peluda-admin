import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/page-header.component.tsx'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatDay, formatTime } from '@/data/model.dates.ts'
import { countryWithFlag, LABELS } from '@/data/model.labels.ts'
import { COUNTRIES } from '@/data/model.types.ts'
import type { Country } from '@/data/model.types.ts'
import { INBOX, INBOX_DAYS, RECEIVED_TODAY } from './tickets.data.ts'
import type { InboxTicket } from './tickets.data.ts'

const ALL = 'all'

type Filters = { country?: Country; day?: string }

const countryFromParam = (param: string | null) => COUNTRIES.find((country) => country === param)
const dayFromParam = (param: string | null) => INBOX_DAYS.find((day) => day === param)

function matches({ ticket, filters }: { ticket: InboxTicket; filters: Filters }) {
  const countryMatches = !filters.country || ticket.country === filters.country
  const dayMatches = !filters.day || ticket.receivedAtMadrid.startsWith(filters.day)
  return countryMatches && dayMatches
}

function preview(message: string) {
  return message.replace(/\s+/g, ' ').trim()
}

function TicketRow({ ticket }: { ticket: InboxTicket }) {
  const navigate = useNavigate()
  return (
    <TableRow className="cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
      <TableCell className="tabular-nums whitespace-nowrap text-muted-foreground">
        {formatDay(ticket.receivedAtMadrid)} {formatTime(ticket.receivedAtMadrid)}
      </TableCell>
      <TableCell>{countryWithFlag(ticket.country)}</TableCell>
      <TableCell>{LABELS.ticketChannel[ticket.channel]}</TableCell>
      <TableCell className="max-w-44 truncate">{ticket.sender}</TableCell>
      <TableCell className="max-w-0 w-full">
        <Link to={`/tickets/${ticket.id}`} className="block truncate font-medium hover:underline">
          {ticket.subject}
        </Link>
        <div className="truncate text-xs text-muted-foreground">{preview(ticket.message)}</div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{LABELS.ticketStatus[ticket.status]}</Badge>
      </TableCell>
    </TableRow>
  )
}

export function TicketInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = {
    country: countryFromParam(searchParams.get('country')),
    day: dayFromParam(searchParams.get('day')),
  }
  const tickets = INBOX.filter((ticket) => matches({ ticket, filters }))
  const backlogCount = INBOX.length - RECEIVED_TODAY.length

  const setFilter = ({ key, value }: { key: keyof Filters; value: string | undefined }) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }

  const countOf = (filter: Filters) => INBOX.filter((ticket) => matches({ ticket, filters: { ...filters, ...filter } })).length

  return (
    <>
      <PageHeader
        title="Bandeja de tickets"
        description={`${INBOX.length} tickets sin clasificar: ${RECEIVED_TODAY.length} de hoy y ${backlogCount} de los dos días anteriores. Horas en horario de Madrid.`}
      />
      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filters.day ?? ALL}
            onValueChange={(value) => setFilter({ key: 'day', value: dayFromParam(value) })}
          >
            <ToggleGroupItem value={ALL}>Todos los días · {countOf({ day: undefined })}</ToggleGroupItem>
            {INBOX_DAYS.map((day) => (
              <ToggleGroupItem key={day} value={day}>
                {formatDay(day)} · {countOf({ day })}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filters.country ?? ALL}
            onValueChange={(value) => setFilter({ key: 'country', value: countryFromParam(value) })}
          >
            <ToggleGroupItem value={ALL}>Todos los países · {countOf({ country: undefined })}</ToggleGroupItem>
            {COUNTRIES.map((code) => (
              <ToggleGroupItem key={code} value={code}>
                {countryWithFlag(code)} · {countOf({ country: code })}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recibido</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Remitente</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
