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
import { findCustomer, petsOf } from '@/customers/customers.data.ts'
import { PetCard } from '@/customers/pet-card.component.tsx'
import { formatDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { reviewPromptText } from './review.prompt.ts'
import { ReviewStars } from './review-stars.component.tsx'
import { REVIEWS, findReview } from './reviews.data.ts'
import type { ShownReview } from './reviews.data.ts'

function ReviewCard({ review }: { review: ShownReview }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{review.title ?? `Reseña de ${review.author}`}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="space-y-1.5">
          <Field label="Autor">{review.author}</Field>
          <Field label="Valoración">
            <ReviewStars stars={review.stars} />
          </Field>
          <Field label="Canal">{LABELS.reviewChannel[review.channel]}</Field>
          <Field label="País">{LABELS.country[review.country]}</Field>
          <Field label="Fecha">{formatDate(review.date)}</Field>
        </dl>
        <div className="rounded-md border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">{review.text}</div>
      </CardContent>
    </Card>
  )
}

function ReplyCard({ reply }: { reply: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Respuesta publicada</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed whitespace-pre-wrap">{reply}</CardContent>
    </Card>
  )
}

const reviewPath = (review: ShownReview | undefined) => review && `/reviews/${review.id}`

function ReviewDetail({ review }: { review: ShownReview }) {
  const customer = findCustomer(review.customerId)
  const pets = petsOf(customer?.id)
  const index = REVIEWS.indexOf(review)
  const promptText = reviewPromptText({ review, customer, pets })

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="font-mono">{review.id}</span>
            <Badge variant="outline">{LABELS.reviewStatus[review.status]}</Badge>
          </span>
        }
        description={
          <Link to="/reviews" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Reseñas · {index + 1} de {REVIEWS.length}
          </Link>
        }
        actions={
          <div className="flex items-center gap-2">
            <StepLinks previous={reviewPath(REVIEWS[index - 1])} next={reviewPath(REVIEWS[index + 1])} noun="Reseña" />
            <CopyPromptButton text={promptText} />
          </div>
        }
      />
      <div className="grid items-start gap-6 px-8 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <ReviewCard review={review} />
          {review.reply && <ReplyCard reply={review.reply} />}
        </div>
        <div className="space-y-4">
          {customer && <CustomerCard customer={customer} />}
          {!customer && <UnknownCustomerCard />}
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </div>
    </>
  )
}

export function ReviewDetailPage() {
  const { reviewId } = useParams()
  const review = findReview(reviewId)
  return (
    <>
      {review && <ReviewDetail key={review.id} review={review} />}
      {!review && <NotFoundPage />}
    </>
  )
}
