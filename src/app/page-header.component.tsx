import type { ReactNode } from 'react'

type PageHeaderProps = { title: ReactNode; description?: ReactNode; actions?: ReactNode }

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b-[1.5px] border-border-strong bg-card px-8 py-6">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </header>
  )
}
