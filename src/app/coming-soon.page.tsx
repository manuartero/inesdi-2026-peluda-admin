import { PageHeader } from './page-header.component.tsx'

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="px-8 py-16 text-center text-sm text-muted-foreground">Próximamente.</div>
    </>
  )
}
