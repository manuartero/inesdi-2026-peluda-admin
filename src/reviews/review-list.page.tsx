import { Link, useNavigate } from 'react-router'
import { ExportCsvButton } from '@/app/download-button.component.tsx'
import { CountryFilter, FilterGroup } from '@/app/list-filters.component.tsx'
import { countryFromParam, useListParams } from '@/app/list-filters.params.ts'
import { PageHeader } from '@/app/page-header.component.tsx'
import { RelativeDay } from '@/app/relative-day.component.tsx'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { countryWithFlag, LABELS } from '@/data/model.labels.ts'
import { REVIEW_STATUSES, TODAY } from '@/data/model.types.ts'
import type { Country } from '@/data/model.types.ts'
import { exportFileName } from '@/lib/csv.ts'
import { reviewsCsv } from './reviews.csv.ts'
import { ReviewStars } from './review-stars.component.tsx'
import { REVIEWS, UNANSWERED } from './reviews.data.ts'
import type { ShownReview } from './reviews.data.ts'

type Filters = { country?: Country; status?: ShownReview['status'] }

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
      <TableCell className="tabular-nums text-muted-foreground"><RelativeDay iso={review.date} /></TableCell>
      <TableCell>
        <ReviewStars stars={review.stars} />
      </TableCell>
      <TableCell>{LABELS.reviewChannel[review.channel]}</TableCell>
      <TableCell>{countryWithFlag(review.country)}</TableCell>
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
  const { searchParams, setParam } = useListParams<keyof Filters>()
  const filters = {
    country: countryFromParam(searchParams.get('country')),
    status: statusFromParam(searchParams.get('status')),
  }
  const reviews = REVIEWS.filter((review) => matches({ review, filters }))

  const countOf = (filter: Filters) => REVIEWS.filter((review) => matches({ review, filters: { ...filters, ...filter } })).length

  return (
    <>
      <PageHeader
        title="Reseñas"
        description={`${REVIEWS.length} reseñas del último mes en la web, la app y Google. ${UNANSWERED.length} sin responder.`}
        actions={
          <ExportCsvButton
            count={reviews.length}
            fileName={exportFileName({ what: 'resenas', parts: [TODAY, filters.status, filters.country] })}
            csv={() => reviewsCsv(reviews)}
          />
        }
      />
      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap gap-3">
          <FilterGroup
            value={filters.status}
            allLabel={`Todas · ${countOf({ status: undefined })}`}
            options={REVIEW_STATUSES.map((status) => ({ value: status, label: `${LABELS.reviewStatusPlural[status]} · ${countOf({ status })}` }))}
            onChange={(value) => setParam({ key: 'status', value: statusFromParam(value) })}
          />
          <CountryFilter
            country={filters.country}
            countOf={(country) => countOf({ country })}
            onChange={(country) => setParam({ key: 'country', value: country })}
          />
        </div>
        <div className="surface overflow-hidden">
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
