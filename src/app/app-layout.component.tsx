import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'
import { REFERENCE_DATE } from '@/data/model.types.ts'
import { formatLongDate } from '@/data/model.dates.ts'
import { UNANSWERED } from '@/reviews/reviews.data.ts'
import { UNCLASSIFIED_TODAY } from '@/tickets/tickets.data.ts'
import { APP_NAV } from './app-nav.ts'
import type { NavEntry } from './app-nav.ts'
import { PeludaLogo } from './peluda-logo.component.tsx'

const BADGES: Record<string, number> = { '/tickets': UNCLASSIFIED_TODAY.length, '/reviews': UNANSWERED.length }

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
    isActive && 'bg-sidebar-accent font-medium text-sidebar-foreground',
  )
}

function NavItem({ entry }: { entry: NavEntry }) {
  const Icon = entry.icon
  const badge = BADGES[entry.path]
  return (
    <NavLink to={entry.path} end={entry.path === '/'} className={navLinkClass}>
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{entry.label}</span>
      {badge !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{badge}</span>}
    </NavLink>
  )
}

export function AppLayout() {
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 flex h-svh w-60 shrink-0 flex-col border-r bg-sidebar px-3 py-4">
        <div className="px-2.5 pb-5">
          <PeludaLogo />
        </div>
        <nav className="flex flex-col gap-0.5">
          {APP_NAV.map((entry) => (
            <NavItem key={entry.path} entry={entry} />
          ))}
        </nav>
        <div className="mt-auto space-y-1 px-2.5 text-xs text-muted-foreground">
          <div className="first-letter:uppercase">{formatLongDate(REFERENCE_DATE)}</div>
          <div>Entorno de formación · datos ficticios</div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
