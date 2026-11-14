import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { CopyPromptButton } from '@/app/copy-prompt-button.component.tsx'
import { Field } from '@/app/field.component.tsx'
import { NotFoundPage } from '@/app/not-found.page.tsx'
import { PageHeader } from '@/app/page-header.component.tsx'
import { StepLinks } from '@/app/step-links.component.tsx'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerCard, UnknownCustomerCard } from '@/customers/customer-card.component.tsx'
import { findCustomer, ordersOf, petsOf, subscriptionsOf } from '@/customers/customers.data.ts'
import { OrderHistory } from '@/customers/order-history.component.tsx'
import { PetCard } from '@/customers/pet-card.component.tsx'
import { SubscriptionCard } from '@/customers/subscription-card.component.tsx'
import { formatDate, formatTime } from '@/data/model.dates.ts'
import { countryWithFlag, LABELS } from '@/data/model.labels.ts'
import { ticketPromptText } from './ticket.prompt.ts'
import { INBOX, findTicket } from './tickets.data.ts'
import type { InboxTicket } from './tickets.data.ts'

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
          <Field label="País">{countryWithFlag(ticket.country)}</Field>
          <Field label="Recibido">
            {formatDate(ticket.receivedAt)} {formatTime(ticket.receivedAt)}
            {isLocalTimeDifferent && (
              <span className="text-muted-foreground"> (hora local; {formatTime(ticket.receivedAtMadrid)} en Madrid)</span>
            )}
          </Field>
        </dl>
        <div className="rounded-lg border-[1.5px] bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</div>
      </CardContent>
    </Card>
  )
}

const ticketPath = (ticket: InboxTicket | undefined) => ticket && `/tickets/${ticket.id}`

function TicketDetail({ ticket }: { ticket: InboxTicket }) {
  const customer = findCustomer(ticket.customerId)
  const pets = petsOf(customer?.id)
  const subscriptions = subscriptionsOf(customer?.id)
  const orders = ordersOf(customer?.id)
  const index = INBOX.indexOf(ticket)
  const promptText = ticketPromptText({ ticket, history: { customer, pets, subscriptions, orders } })

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
            <StepLinks previous={ticketPath(INBOX[index - 1])} next={ticketPath(INBOX[index + 1])} noun="Ticket" />
            <CopyPromptButton text={promptText} />
          </div>
        }
      />
      <div className="grid items-start gap-6 px-8 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <MessageCard ticket={ticket} />
          {customer && <OrderHistory orders={orders} highlightedOrderId={ticket.orderId} title="Pedidos del cliente" />}
        </div>
        <div className="space-y-4">
          {customer && <CustomerCard customer={customer} />}
          {!customer && <UnknownCustomerCard />}
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
          {subscriptions.map((subscription) => (
            <SubscriptionCard key={subscription.id} subscription={subscription} pet={pets.find((pet) => pet.id === subscription.petId)} />
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
