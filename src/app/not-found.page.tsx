import { Link } from 'react-router'
import { PageHeader } from './page-header.component.tsx'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Página no encontrada" />
      <div className="space-y-2 px-8 py-16 text-center text-sm text-muted-foreground">
        <p>Esta dirección no existe en Peluda Admin.</p>
        <Link to="/" className="font-medium text-foreground underline underline-offset-4">
          Volver al inicio
        </Link>
      </div>
    </>
  )
}
