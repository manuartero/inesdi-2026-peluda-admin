import { Badge } from '@/components/ui/badge'
import { daysFromReference, formatDate } from '@/data/model.dates.ts'
import type { IsoDate } from '@/data/model.types.ts'

const SOON_DAYS = 90

// daysLeftLabel(37) is 'en 37 días'; daysLeftLabel(-3) is 'hace 3 días'.
function daysLeftLabel(days: number) {
  if (days === 0) {
    return 'hoy'
  }
  const count = Math.abs(days)
  const noun = count === 1 ? 'día' : 'días'
  return days > 0 ? `en ${count} ${noun}` : `hace ${count} ${noun}`
}

export function ContractExpiry({ expiry }: { expiry: IsoDate }) {
  const days = daysFromReference(expiry)
  const isSoon = days >= 0 && days <= SOON_DAYS
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="tabular-nums">{formatDate(expiry)}</span>
      <span className="text-muted-foreground">· {daysLeftLabel(days)}</span>
      {isSoon && <Badge variant="secondary">Vence pronto</Badge>}
    </span>
  )
}
