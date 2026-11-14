import { formatDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { toCsv } from '@/lib/csv.ts'
import type { CsvColumn } from '@/lib/csv.ts'
import type { ShownReview } from './reviews.data.ts'

const COLUMNS: CsvColumn<ShownReview>[] = [
  { header: 'ID', value: (review) => review.id },
  { header: 'Fecha', value: (review) => formatDate(review.date) },
  { header: 'Canal', value: (review) => LABELS.reviewChannel[review.channel] },
  { header: 'País', value: (review) => LABELS.country[review.country] },
  { header: 'Autor', value: (review) => review.author },
  { header: 'ID cliente', value: (review) => review.customerId },
  { header: 'Estrellas', value: (review) => review.stars },
  { header: 'Título', value: (review) => review.title },
  { header: 'Reseña', value: (review) => review.text.trim() },
  { header: 'Estado', value: (review) => LABELS.reviewStatus[review.status] },
  { header: 'Respuesta publicada', value: (review) => review.reply?.trim() },
]

export const reviewsCsv = (reviews: ShownReview[]) => toCsv({ columns: COLUMNS, rows: reviews })
