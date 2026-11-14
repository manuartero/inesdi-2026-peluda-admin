import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'
import { TODAY } from '@/data/model.types.ts'
import { formatLongDate } from '@/data/model.dates.ts'
import { UNANSWERED } from '@/reviews/reviews.data.ts'
import { UNCLASSIFIED } from '@/tickets/tickets.data.ts'
import { APP_NAV } from './app-nav.ts'
import type { NavEntry } from './app-nav.ts'
import { PeludaLogo } from './peluda-logo.component.tsx'

const BADGES: Record<string, number> = { '/tickets': UNCLASSIFIED.length, '/reviews': UNANSWERED.length }

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'group flex items-center gap-2.5 rounded-lg border-[1.5px] border-transparent px-2.5 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-muted hover:text-sidebar-foreground',
    isActive && 'active border-border-strong bg-muted font-semibold text-sidebar-foreground shadow-[0_2px_0_0_var(--border-strong)]',
  )
}

function NavItem({ entry }: { entry: NavEntry }) {
  const Icon = entry.icon
  const badge = BADGES[entry.path]
  return (
    <NavLink to={entry.path} end={entry.path === '/'} className={navLinkClass}>
      <Icon className="size-4 shrink-0 group-[.active]:text-brand" strokeWidth={2.25} />
      <span className="flex-1 truncate">{entry.label}</span>
      {badge !== undefined && <span className="rounded-full bg-foreground px-1.5 py-px text-[0.7rem] font-semibold tabular-nums text-background">{badge}</span>}
    </NavLink>
  )
}

export function AppLayout() {
  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 flex h-svh w-60 shrink-0 flex-col border-r-[1.5px] border-border-strong bg-sidebar px-3 py-4">
        <div className="px-2.5 pb-5">
          <PeludaLogo />
        </div>
        <nav className="flex flex-col gap-0.5">
          {APP_NAV.map((entry) => (
            <NavItem key={entry.path} entry={entry} />
          ))}
        </nav>
        <div className="mt-auto space-y-1 px-2.5 text-xs text-muted-foreground">
          <div className="first-letter:uppercase">{formatLongDate(TODAY)}</div>
          <div>Entorno de formación · datos ficticios</div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
