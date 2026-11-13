import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { NotFoundPage } from '@/app/not-found.page.tsx'
import { PageHeader } from '@/app/page-header.component.tsx'
import { StepLinks } from '@/app/step-links.component.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatTime } from '@/data/model.dates.ts'
import type { Customer, Pet } from '@/data/model.types.ts'
import { ReviewStars } from '@/reviews/review-stars.component.tsx'
import { reviewsOf } from '@/reviews/reviews.data.ts'
import { ticketsOf } from '@/tickets/tickets.data.ts'
import { CustomerCard } from './customer-card.component.tsx'
import { CUSTOMERS, findCustomer, ordersOf, petsOf, subscriptionsOf } from './customers.data.ts'
import { OrderHistory } from './order-history.component.tsx'
import { PetCard } from './pet-card.component.tsx'
import { SubscriptionCard } from './subscription-card.component.tsx'

function TicketsCard({ customerId }: { customerId: string }) {
  const tickets = ticketsOf(customerId)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Tickets <span className="font-normal text-muted-foreground">· {tickets.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 && <p className="text-sm text-muted-foreground">Sin tickets.</p>}
        <ul className="divide-y text-sm">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="flex gap-3 py-2">
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatDate(ticket.receivedAtMadrid)} {formatTime(ticket.receivedAtMadrid)}
              </span>
              <Link to={`/tickets/${ticket.id}`} className="truncate font-medium hover:underline">
                {ticket.subject}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function ReviewsCard({ customerId }: { customerId: string }) {
  const reviews = reviewsOf(customerId)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Reseñas <span className="font-normal text-muted-foreground">· {reviews.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 && <p className="text-sm text-muted-foreground">Sin reseñas.</p>}
        <ul className="divide-y text-sm">
          {reviews.map((review) => (
            <li key={review.id} className="flex items-center gap-3 py-2">
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatDate(review.date)}</span>
              <ReviewStars stars={review.stars} />
              <Link to={`/reviews/${review.id}`} className="truncate hover:underline">
                {review.title ?? review.text}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

const petOf = ({ pets, petId }: { pets: Pet[]; petId: string }) => pets.find((pet) => pet.id === petId)

const customerPath = (customer: Customer | undefined) => customer && `/customers/${customer.id}`

function CustomerDetail({ customer }: { customer: Customer }) {
  const pets = petsOf(customer.id)
  const subscriptions = subscriptionsOf(customer.id)
  const index = CUSTOMERS.indexOf(customer)

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {customer.firstName} {customer.lastName}
            <span className="font-mono text-sm font-normal text-muted-foreground">{customer.id}</span>
          </span>
        }
        description={
          <Link to="/customers" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Clientes · {index + 1} de {CUSTOMERS.length}
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <StepLinks previous={customerPath(CUSTOMERS[index - 1])} next={customerPath(CUSTOMERS[index + 1])} noun="Cliente" />
          </div>
        }
      />
      <div className="grid items-start gap-6 px-8 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 xl:grid-cols-2">
            {subscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.id} subscription={subscription} pet={petOf({ pets, petId: subscription.petId })} />
            ))}
          </div>
          <OrderHistory orders={ordersOf(customer.id)} />
          <TicketsCard customerId={customer.id} />
          <ReviewsCard customerId={customer.id} />
        </div>
        <div className="space-y-4">
          <CustomerCard customer={customer} linkToRecord={false} />
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </div>
    </>
  )
}

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const customer = findCustomer(customerId)
  return (
    <>
      {customer && <CustomerDetail key={customer.id} customer={customer} />}
      {!customer && <NotFoundPage />}
    </>
  )
}
