import { countryFromParam } from '@/app/list-filters.params.ts'
import { REVIEW_STATUSES } from '@/data/model.types.ts'
import type { Country, Review, WithoutAnswerKey } from '@/data/model.types.ts'
import { DATA } from '@/data/peluda.data.ts'

export type ShownReview = WithoutAnswerKey<Review>

// Newest first, as review platforms show them; same-day reviews by ID, the latest first.
const newestFirst = (a: ShownReview, b: ShownReview) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)

export const REVIEWS = [...DATA.reviews].sort(newestFirst)

export const UNANSWERED = REVIEWS.filter((review) => review.status === 'unanswered')

export type ReviewFilters = { country?: Country; status?: ShownReview['status'] }

export const statusFromParam = (param: string | null) => REVIEW_STATUSES.find((status) => status === param)

export const reviewFilters = (params: URLSearchParams) => ({
  country: countryFromParam(params.get('country')),
  status: statusFromParam(params.get('status')),
})

export function matchesReview({ review, filters }: { review: ShownReview; filters: ReviewFilters }) {
  const countryMatches = !filters.country || review.country === filters.country
  const statusMatches = !filters.status || review.status === filters.status
  return countryMatches && statusMatches
}

export const filterReviews = (params: URLSearchParams) => {
  const filters = reviewFilters(params)
  return REVIEWS.filter((review) => matchesReview({ review, filters }))
}

export const findReview = (id: string | undefined) => REVIEWS.find((review) => review.id === id)

export const reviewsOf = (customerId: string) => REVIEWS.filter((review) => review.customerId === customerId)
