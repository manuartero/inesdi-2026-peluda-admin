import { Link, useNavigate } from 'react-router'
import { PageHeader } from '@/app/page-header.component.tsx'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LABELS } from '@/data/model.labels.ts'
import { ContractExpiry } from './contract-expiry.component.tsx'
import { SUPPLIERS } from './suppliers.data.ts'
import type { SupplierWithContract } from './suppliers.data.ts'

const digitisedCount = SUPPLIERS.filter((supplier) => supplier.contract).length

function SupplierRow({ supplier }: { supplier: SupplierWithContract }) {
  const navigate = useNavigate()
  const { contract } = supplier
  return (
    <TableRow className="cursor-pointer" onClick={() => navigate(`/suppliers/${supplier.id}`)}>
      <TableCell>
        <Link to={`/suppliers/${supplier.id}`} className="font-medium hover:underline">
          {supplier.legalName}
        </Link>
        <div className="text-xs text-muted-foreground">{supplier.city}</div>
      </TableCell>
      <TableCell className="whitespace-normal">{supplier.service}</TableCell>
      <TableCell>{LABELS.country[supplier.country]}</TableCell>
      <TableCell className="whitespace-normal">
        {contract && contract.title}
        {!contract && <Badge variant="outline">Contrato no digitalizado</Badge>}
      </TableCell>
      <TableCell>{contract && <ContractExpiry expiry={contract.expiryOnRecord} />}</TableCell>
    </TableRow>
  )
}

export function SupplierListPage() {
  return (
    <>
      <PageHeader
        title="Proveedores y contratos"
        description={`${SUPPLIERS.length} proveedores clave, ${digitisedCount} con el contrato digitalizado.`}
      />
      <div className="px-8 py-6">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Vencimiento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUPPLIERS.map((supplier) => (
                <SupplierRow key={supplier.id} supplier={supplier} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
