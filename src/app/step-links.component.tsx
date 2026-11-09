import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

function StepLink({ to, label, children }: { to: string | undefined; label: string; children: ReactNode }) {
  if (!to) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    )
  }
  return (
    <Button variant="outline" size="icon" asChild aria-label={label}>
      <Link to={to}>{children}</Link>
    </Button>
  )
}

// Previous / next arrows for a detail page; a missing `to` (first or last item) shows the arrow disabled.
export function StepLinks({ previous, next, noun }: { previous?: string; next?: string; noun: string }) {
  return (
    <>
      <StepLink to={previous} label={`${noun} anterior`}>
        <ChevronLeft />
      </StepLink>
      <StepLink to={next} label={`${noun} siguiente`}>
        <ChevronRight />
      </StepLink>
    </>
  )
}
