import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/page-header.component.tsx'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatTime } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { COUNTRIES } from '@/data/model.types.ts'
import type { Country } from '@/data/model.types.ts'
import { INBOX } from './tickets.data.ts'
import type { InboxTicket } from './tickets.data.ts'

const ALL = 'all'

function countryFromParam(param: string | null) {
  return COUNTRIES.find((country) => country === param)
}

function countIn(country: Country) {
  return INBOX.filter((ticket) => ticket.country === country).length
}

function preview(message: string) {
  return message.replace(/\s+/g, ' ').trim()
}

function TicketRow({ ticket }: { ticket: InboxTicket }) {
  const navigate = useNavigate()
  return (
    <TableRow className="cursor-pointer" onClick={() => navigate(`/tickets/${ticket.id}`)}>
      <TableCell className="tabular-nums text-muted-foreground">{formatTime(ticket.receivedAtMadrid)}</TableCell>
      <TableCell>{LABELS.country[ticket.country]}</TableCell>
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
  const country = countryFromParam(searchParams.get('country'))
  const tickets = INBOX.filter((ticket) => !country || ticket.country === country)

  const selectCountry = (value: string) => {
    const selected = countryFromParam(value)
    setSearchParams(selected ? { country: selected } : {}, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Bandeja de tickets"
        description={`${INBOX.length} tickets recibidos hoy, todos sin clasificar. Horas en horario de Madrid.`}
      />
      <div className="space-y-4 px-8 py-6">
        <ToggleGroup type="single" variant="outline" size="sm" value={country ?? ALL} onValueChange={selectCountry}>
          <ToggleGroupItem value={ALL}>Todos · {INBOX.length}</ToggleGroupItem>
          {COUNTRIES.map((code) => (
            <ToggleGroupItem key={code} value={code}>
              {LABELS.country[code]} · {countIn(code)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="rounded-lg border">
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
