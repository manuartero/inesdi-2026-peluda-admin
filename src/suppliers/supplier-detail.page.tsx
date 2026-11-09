import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { CopyPromptButton } from '@/app/copy-prompt-button.component.tsx'
import { NotFoundPage } from '@/app/not-found.page.tsx'
import { PageHeader } from '@/app/page-header.component.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { ContractExpiry } from './contract-expiry.component.tsx'
import { ContractText } from './contract-text.component.tsx'
import { findSupplier } from './suppliers.data.ts'
import type { ShownContract, SupplierWithContract } from './suppliers.data.ts'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

function ContractCard({ contract }: { contract: ShownContract }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contrato</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-1.5">
          <Field label="Referencia">
            <span className="font-mono text-xs">{contract.id}</span>
          </Field>
          <Field label="Título">{contract.title}</Field>
          <Field label="Firmado">{formatDate(contract.signedOn)}</Field>
          <Field label="Inicio">{formatDate(contract.startDate)}</Field>
          <Field label="Vencimiento">
            <ContractExpiry expiry={contract.expiryOnRecord} />
          </Field>
        </dl>
      </CardContent>
    </Card>
  )
}

function SupplierCard({ supplier }: { supplier: SupplierWithContract }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proveedor</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-1.5">
          <Field label="ID">
            <span className="font-mono text-xs">{supplier.id}</span>
          </Field>
          <Field label="NIF / RFC / CUIT">{supplier.taxId}</Field>
          <Field label="Ciudad">
            {supplier.city}, {LABELS.country[supplier.country]}
          </Field>
          <Field label="Servicio">{supplier.service}</Field>
          <Field label="Contacto">
            {supplier.contact.name}
            <div className="text-muted-foreground">{supplier.contact.email}</div>
          </Field>
        </dl>
      </CardContent>
    </Card>
  )
}

function ContractTextCard({ contract }: { contract: ShownContract }) {
  return (
    <Card>
      <CardContent>
        <ContractText markdown={contract.text} />
      </CardContent>
    </Card>
  )
}

function NotDigitisedCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contrato no digitalizado</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        El contrato de este proveedor solo está en papel. Pide una copia a Compras.
      </CardContent>
    </Card>
  )
}

function SupplierDetail({ supplier }: { supplier: SupplierWithContract }) {
  const { contract } = supplier
  return (
    <>
      <PageHeader
        title={supplier.legalName}
        description={
          <Link to="/suppliers" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Proveedores y contratos
          </Link>
        }
        actions={contract && <CopyPromptButton text={contract.text} />}
      />
      <div className="grid items-start gap-6 px-8 py-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {contract && <ContractTextCard contract={contract} />}
        {!contract && <NotDigitisedCard />}
        <div className="space-y-4 lg:sticky lg:top-6">
          {contract && <ContractCard contract={contract} />}
          <SupplierCard supplier={supplier} />
        </div>
      </div>
    </>
  )
}

export function SupplierDetailPage() {
  const { supplierId } = useParams()
  const supplier = findSupplier(supplierId)
  return (
    <>
      {supplier && <SupplierDetail key={supplier.id} supplier={supplier} />}
      {!supplier && <NotFoundPage />}
    </>
  )
}
