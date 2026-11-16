import { Search } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ExportCsvButton } from '@/app/download-button.component.tsx'
import { CountryFilter } from '@/app/list-filters.component.tsx'
import { countryFromParam, useListParams } from '@/app/list-filters.params.ts'
import { PageHeader } from '@/app/page-header.component.tsx'
import { RelativeDay } from '@/app/relative-day.component.tsx'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { countryWithFlag } from '@/data/model.labels.ts'
import { TODAY } from '@/data/model.types.ts'
import { exportFileName } from '@/lib/csv.ts'
import type { Country, Customer } from '@/data/model.types.ts'
import { customersCsv } from './customers.csv.ts'
import { CUSTOMERS, petsOf, subscriptionsOf } from './customers.data.ts'
import { PetName } from './pet-icon.component.tsx'
import { SubscriptionStatusBadge } from './subscription-card.component.tsx'

// normalized('  Lucía NAVARRO ') is 'lucia navarro', so «lucia» finds «Lucía».
const normalized = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

// One string per customer with everything the search box looks at: name, ID, email, city and pet names.
function searchableText(customer: Customer) {
  const petNames = petsOf(customer.id).map((pet) => pet.name)
  return normalized([customer.firstName, customer.lastName, customer.id, customer.email, customer.city, ...petNames].join(' '))
}

const SEARCHABLE = new Map(CUSTOMERS.map((customer) => [customer.id, searchableText(customer)]))

function matches({ customer, query, country }: { customer: Customer; query: string; country?: Country }) {
  const countryMatches = !country || customer.country === country
  const queryMatches = !query || (SEARCHABLE.get(customer.id) ?? '').includes(query)
  return countryMatches && queryMatches
}

function CustomerRow({ customer }: { customer: Customer }) {
  const navigate = useNavigate()
  const pets = petsOf(customer.id)
  const subscriptions = subscriptionsOf(customer.id)
  const statuses = [...new Set(subscriptions.map((subscription) => subscription.status))]
  return (
    <TableRow className="cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
      <TableCell className="font-mono text-xs text-muted-foreground">{customer.id}</TableCell>
      <TableCell className="font-medium">
        <Link to={`/customers/${customer.id}`} className="hover:underline">
          {customer.firstName} {customer.lastName}
        </Link>
      </TableCell>
      <TableCell>{countryWithFlag(customer.country)}</TableCell>
      <TableCell>{customer.city}</TableCell>
      <TableCell className="max-w-0 w-full">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {pets.map((pet) => (
            <PetName key={pet.id} species={pet.species} name={pet.name} />
          ))}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {statuses.map((status) => (
            <SubscriptionStatusBadge key={status} status={status} />
          ))}
        </div>
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground"><RelativeDay iso={customer.signupDate} /></TableCell>
    </TableRow>
  )
}

export function CustomerListPage() {
  const { searchParams, setParam } = useListParams<'country' | 'q'>()
  const country = countryFromParam(searchParams.get('country'))
  const rawQuery = searchParams.get('q') ?? ''
  const query = normalized(rawQuery)
  const customers = CUSTOMERS.filter((customer) => matches({ customer, query, country }))

  const countIn = (code: Country | undefined) => CUSTOMERS.filter((customer) => matches({ customer, query, country: code })).length
  const search = (event: ChangeEvent<HTMLInputElement>) => setParam({ key: 'q', value: event.target.value })

  return (
    <>
      <PageHeader
        title="Clientes"
        description={`${CUSTOMERS.length} clientes en cinco países.`}
        actions={
          <ExportCsvButton
            count={customers.length}
            fileName={exportFileName({ what: 'clientes', parts: [TODAY, country] })}
            csv={() => customersCsv(customers)}
          />
        }
      />
      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={rawQuery}
              onChange={search}
              placeholder="Nombre, ID, email, ciudad o mascota"
              aria-label="Buscar clientes"
              className="pl-8"
            />
          </div>
          <CountryFilter country={country} countOf={countIn} onChange={(code) => setParam({ key: 'country', value: code })} />
        </div>
        <div className="surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Mascotas</TableHead>
                <TableHead>Suscripción</TableHead>
                <TableHead>Cliente desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <CustomerRow key={customer.id} customer={customer} />
              ))}
            </TableBody>
          </Table>
          {customers.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Ningún cliente coincide con la búsqueda.</p>}
        </div>
      </div>
    </>
  )
}
