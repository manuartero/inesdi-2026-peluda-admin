import { Link, useNavigate, useSearchParams } from 'react-router'
import { ExportCsvButton } from '@/app/download-button.component.tsx'
import { PageHeader } from '@/app/page-header.component.tsx'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatAgo, formatDate, formatTime } from '@/data/model.dates.ts'
import { countryWithFlag, LABELS } from '@/data/model.labels.ts'
import { COUNTRIES } from '@/data/model.types.ts'
import { exportFileName } from '@/lib/csv.ts'
import type { Country } from '@/data/model.types.ts'
import { ticketsCsv } from './tickets.csv.ts'
import { ageInDays, INBOX, INBOX_AGES, LAST_24_HOURS } from './tickets.data.ts'
import type { InboxTicket } from './tickets.data.ts'

const ALL = 'all'

type Filters = { country?: Country; age?: number }

const countryFromParam = (param: string | null) => COUNTRIES.find((country) => country === param)
const ageFromParam = (param: string | null) => INBOX_AGES.find((age) => String(age) === param)

// ageLabel(0) is 'Últimas 24 h'; ageLabel(2) is 'Hace 2 días'.
const ageLabel = (age: number) => (age === 0 ? 'Últimas 24 h' : `Hace ${age} ${age === 1 ? 'día' : 'días'}`)

// ageFileName(0) is 'ultimas-24h'; ageFileName(2) is 'hace-2-dias'.
function ageFileName(age: number | undefined) {
  if (age === undefined) {
    return undefined
  }
  return age === 0 ? 'ultimas-24h' : `hace-${age}-dias`
}

function matches({ ticket, filters }: { ticket: InboxTicket; filters: Filters }) {
  const countryMatches = !filters.country || ticket.country === filters.country
  const ageMatches = filters.age === undefined || ageInDays(ticket) === filters.age
  return countryMatches && ageMatches
}

function preview(message: string) {
  return message.replace(/\s+/g, ' ').trim()
}

function TicketRow({ ticket }: { ticket: InboxTicket }) {
  const navigate = useNavigate()
  return (
    <TableRow className="cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
      <TableCell className="tabular-nums whitespace-nowrap text-muted-foreground">
        <time dateTime={ticket.receivedAtMadrid} title={`${formatDate(ticket.receivedAtMadrid)} ${formatTime(ticket.receivedAtMadrid)} en Madrid`}>
          {formatAgo(ticket.minutesAgo)}
        </time>
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
    age: ageFromParam(searchParams.get('age')),
  }
  const tickets = INBOX.filter((ticket) => matches({ ticket, filters }))
  const backlogCount = INBOX.length - LAST_24_HOURS.length

  const setFilter = ({ key, value }: { key: keyof Filters; value: string | number | undefined }) => {
    const next = new URLSearchParams(searchParams)
    if (value !== undefined) {
      next.set(key, String(value))
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
        description={`${INBOX.length} tickets sin clasificar: ${LAST_24_HOURS.length} de las últimas 24 horas y ${backlogCount} de los dos días anteriores. Pasa el ratón por encima para ver la hora de Madrid.`}
        actions={
          <ExportCsvButton
            count={tickets.length}
            fileName={exportFileName({ what: 'tickets', parts: [ageFileName(filters.age), filters.country] })}
            csv={() => ticketsCsv(tickets)}
          />
        }
      />
      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filters.age === undefined ? ALL : String(filters.age)}
            onValueChange={(value) => setFilter({ key: 'age', value: ageFromParam(value) })}
          >
            <ToggleGroupItem value={ALL}>Todos los días · {countOf({ age: undefined })}</ToggleGroupItem>
            {INBOX_AGES.map((age) => (
              <ToggleGroupItem key={age} value={String(age)}>
                {ageLabel(age)} · {countOf({ age })}
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
