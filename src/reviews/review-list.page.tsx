import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '@/app/page-header.component.tsx'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { COUNTRIES, REVIEW_STATUSES } from '@/data/model.types.ts'
import { ReviewStars } from './review-stars.component.tsx'
import { REVIEWS, UNANSWERED } from './reviews.data.ts'
import type { ShownReview } from './reviews.data.ts'

const ALL = 'all'

type Filters = { country?: string; status?: string }

const countryFromParam = (param: string | null) => COUNTRIES.find((country) => country === param)
const statusFromParam = (param: string | null) => REVIEW_STATUSES.find((status) => status === param)

const preview = (text: string) => text.replace(/\s+/g, ' ').trim()

function matches({ review, filters }: { review: ShownReview; filters: Filters }) {
  const countryMatches = !filters.country || review.country === filters.country
  const statusMatches = !filters.status || review.status === filters.status
  return countryMatches && statusMatches
}

function ReviewRow({ review }: { review: ShownReview }) {
  const navigate = useNavigate()
  const isUnanswered = review.status === 'unanswered'
  return (
    <TableRow className="cursor-pointer" onClick={() => navigate(`/reviews/${review.id}`)}>
      <TableCell className="tabular-nums text-muted-foreground">{formatDate(review.date)}</TableCell>
      <TableCell>
        <ReviewStars stars={review.stars} />
      </TableCell>
      <TableCell>{LABELS.reviewChannel[review.channel]}</TableCell>
      <TableCell>{LABELS.country[review.country]}</TableCell>
      <TableCell className="max-w-36 truncate">{review.author}</TableCell>
      <TableCell className="max-w-0 w-full">
        <Link to={`/reviews/${review.id}`} className="block truncate hover:underline">
          {review.title && <span className="font-medium">{review.title} · </span>}
          {preview(review.text)}
        </Link>
      </TableCell>
      <TableCell>
        {isUnanswered && <Badge variant="outline">{LABELS.reviewStatus[review.status]}</Badge>}
        {!isUnanswered && <Badge variant="secondary">{LABELS.reviewStatus[review.status]}</Badge>}
      </TableCell>
    </TableRow>
  )
}

export function ReviewListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = {
    country: countryFromParam(searchParams.get('country')),
    status: statusFromParam(searchParams.get('status')),
  }
  const reviews = REVIEWS.filter((review) => matches({ review, filters }))

  const setFilter = ({ key, value }: { key: keyof Filters; value: string | undefined }) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }

  const countOf = (filter: Filters) => REVIEWS.filter((review) => matches({ review, filters: { ...filters, ...filter } })).length

  return (
    <>
      <PageHeader
        title="Reseñas"
        description={`${REVIEWS.length} reseñas del último mes en la web, la app y Google. ${UNANSWERED.length} sin responder.`}
      />
      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filters.status ?? ALL}
            onValueChange={(value) => setFilter({ key: 'status', value: statusFromParam(value) })}
          >
            <ToggleGroupItem value={ALL}>Todas · {countOf({ status: undefined })}</ToggleGroupItem>
            {REVIEW_STATUSES.map((status) => (
              <ToggleGroupItem key={status} value={status}>
                {LABELS.reviewStatusPlural[status]} · {countOf({ status })}
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
            <ToggleGroupItem value={ALL}>Todos los países</ToggleGroupItem>
            {COUNTRIES.map((code) => (
              <ToggleGroupItem key={code} value={code}>
                {LABELS.country[code]} · {countOf({ country: code })}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Valoración</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Reseña</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <ReviewRow key={review.id} review={review} />
              ))}
            </TableBody>
          </Table>
          {reviews.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Ninguna reseña con estos filtros.</p>}
        </div>
      </div>
    </>
  )
}
