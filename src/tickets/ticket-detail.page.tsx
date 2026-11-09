import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { NotFoundPage } from '@/app/not-found.page.tsx'
import { PageHeader } from '@/app/page-header.component.tsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAge, formatDate, formatTime } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import type { Customer, Pet } from '@/data/model.types.ts'
import { CopyPromptButton } from './copy-prompt-button.component.tsx'
import { ticketPromptText } from './ticket.prompt.ts'
import { INBOX, findCustomer, findTicket, petsOf } from './tickets.data.ts'
import type { InboxTicket } from './tickets.data.ts'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

function MessageCard({ ticket }: { ticket: InboxTicket }) {
  const isLocalTimeDifferent = ticket.country !== 'ES'
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ticket.subject}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="space-y-1.5">
          <Field label="Remitente">{ticket.sender}</Field>
          <Field label="Canal">{LABELS.ticketChannel[ticket.channel]}</Field>
          <Field label="País">{LABELS.country[ticket.country]}</Field>
          <Field label="Recibido">
            {formatDate(ticket.receivedAt)} {formatTime(ticket.receivedAt)}
            {isLocalTimeDifferent && (
              <span className="text-muted-foreground"> (hora local; {formatTime(ticket.receivedAtMadrid)} en Madrid)</span>
            )}
          </Field>
        </dl>
        <div className="rounded-md border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</div>
      </CardContent>
    </Card>
  )
}

function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {customer.firstName} {customer.lastName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-1.5">
          <Field label="ID">
            <span className="font-mono text-xs">{customer.id}</span>
          </Field>
          <Field label="Email">{customer.email}</Field>
          <Field label="Teléfono">{customer.phone}</Field>
          <Field label="Ciudad">
            {customer.city}, {LABELS.country[customer.country]}
          </Field>
          <Field label="Cliente desde">{formatDate(customer.signupDate)}</Field>
          {customer.notes && <Field label="Notas internas">{customer.notes}</Field>}
        </dl>
      </CardContent>
    </Card>
  )
}

function UnknownSenderCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cliente no identificado</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        El remitente no coincide con ningún cliente registrado.
      </CardContent>
    </Card>
  )
}

function PetCard({ pet }: { pet: Pet }) {
  const allergies = pet.allergies.length > 0 ? pet.allergies.join(', ') : 'Ninguna conocida'
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{pet.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-1.5">
          <Field label="Especie">{LABELS.species[pet.species]}</Field>
          <Field label="Raza">{pet.breed}</Field>
          <Field label="Edad">{formatAge(pet.birthDate)}</Field>
          <Field label="Peso">{pet.weightKg.toLocaleString('es-ES')} kg</Field>
          <Field label="Actividad">{LABELS.petActivity[pet.activity]}</Field>
          <Field label="Alergias">{allergies}</Field>
        </dl>
      </CardContent>
    </Card>
  )
}

function StepLink({ ticket, children, label }: { ticket: InboxTicket | undefined; children: ReactNode; label: string }) {
  if (!ticket) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    )
  }
  return (
    <Button variant="outline" size="icon" asChild aria-label={label}>
      <Link to={`/tickets/${ticket.id}`}>{children}</Link>
    </Button>
  )
}

function TicketDetail({ ticket }: { ticket: InboxTicket }) {
  const customer = findCustomer(ticket.customerId)
  const pets = petsOf(customer?.id)
  const index = INBOX.indexOf(ticket)
  const promptText = ticketPromptText({ ticket, customer, pets })

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="font-mono">{ticket.id}</span>
            <Badge variant="outline">{LABELS.ticketStatus[ticket.status]}</Badge>
          </span>
        }
        description={
          <Link to="/tickets" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Bandeja de tickets · {index + 1} de {INBOX.length}
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <StepLink ticket={INBOX[index - 1]} label="Ticket anterior">
              <ChevronLeft />
            </StepLink>
            <StepLink ticket={INBOX[index + 1]} label="Ticket siguiente">
              <ChevronRight />
            </StepLink>
            <CopyPromptButton text={promptText} />
          </div>
        }
      />
      <div className="grid items-start gap-6 px-8 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <MessageCard ticket={ticket} />
        <div className="space-y-4">
          {customer && <CustomerCard customer={customer} />}
          {!customer && <UnknownSenderCard />}
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </div>
    </>
  )
}

export function TicketDetailPage() {
  const { ticketId } = useParams()
  const ticket = findTicket(ticketId)
  return (
    <>
      {ticket && <TicketDetail key={ticket.id} ticket={ticket} />}
      {!ticket && <NotFoundPage />}
    </>
  )
}
