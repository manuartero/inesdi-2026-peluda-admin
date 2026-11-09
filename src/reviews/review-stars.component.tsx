import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { STARS } from '@/data/model.types.ts'
import type { Review } from '@/data/model.types.ts'

export function ReviewStars({ stars }: { stars: Review['stars'] }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${stars} de 5 estrellas`} role="img">
      {STARS.map((position) => (
        <Star
          key={position}
          className={cn('size-3.5', position <= stars && 'fill-amber-400 text-amber-400', position > stars && 'text-muted-foreground/40')}
        />
      ))}
    </span>
  )
}
