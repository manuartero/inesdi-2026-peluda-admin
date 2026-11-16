import { formatDate, formatRelativeDay } from '@/data/model.dates.ts'
import type { IsoDate } from '@/data/model.types.ts'

// «hace 3 días», with the exact date on hover.
export function RelativeDay({ iso }: { iso: IsoDate }) {
  return (
    <time dateTime={iso} title={formatDate(iso)}>
      {formatRelativeDay(iso)}
    </time>
  )
}
