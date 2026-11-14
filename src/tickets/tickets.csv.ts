import { formatDate, formatTime } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { toCsv } from '@/lib/csv.ts'
import type { CsvColumn } from '@/lib/csv.ts'
import type { InboxTicket } from './tickets.data.ts'

const dateTime = (iso: string) => `${formatDate(iso)} ${formatTime(iso)}`

// What a team member gets from «Exportar CSV»: the ticket as the inbox shows it. No answer key; no email or phone, as in «Copiar para el prompt».
const COLUMNS: CsvColumn<InboxTicket>[] = [
  { header: 'ID', value: (ticket) => ticket.id },
  { header: 'Recibido (hora de Madrid)', value: (ticket) => dateTime(ticket.receivedAtMadrid) },
  { header: 'Recibido (hora local)', value: (ticket) => dateTime(ticket.receivedAt) },
  { header: 'País', value: (ticket) => LABELS.country[ticket.country] },
  { header: 'Canal', value: (ticket) => LABELS.ticketChannel[ticket.channel] },
  { header: 'Remitente', value: (ticket) => ticket.sender },
  { header: 'ID cliente', value: (ticket) => ticket.customerId },
  { header: 'ID pedido', value: (ticket) => ticket.orderId },
  { header: 'Asunto', value: (ticket) => ticket.subject },
  { header: 'Mensaje', value: (ticket) => ticket.message.trim() },
  { header: 'Estado', value: (ticket) => LABELS.ticketStatus[ticket.status] },
]

export const ticketsCsv = (tickets: InboxTicket[]) => toCsv({ columns: COLUMNS, rows: tickets })
