import { DATA } from '@/data/peluda.data.ts'
import type { Review, WithoutAnswerKey } from '@/data/model.types.ts'

export type ShownReview = WithoutAnswerKey<Review>

// Newest first, as review platforms show them; same-day reviews by ID, the latest first.
const newestFirst = (a: ShownReview, b: ShownReview) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)

export const REVIEWS = [...DATA.reviews].sort(newestFirst)

export const UNANSWERED = REVIEWS.filter((review) => review.status === 'unanswered')

export const findReview = (id: string | undefined) => REVIEWS.find((review) => review.id === id)

export const reviewsOf = (customerId: string) => REVIEWS.filter((review) => review.customerId === customerId)
