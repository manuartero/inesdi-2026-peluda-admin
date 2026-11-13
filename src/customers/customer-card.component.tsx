import { Link } from 'react-router'
import { Field } from '@/app/field.component.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/data/model.dates.ts'
import { countryWithFlag } from '@/data/model.labels.ts'
import type { Customer } from '@/data/model.types.ts'

// From a ticket or a review, `linkToRecord` opens the customer's record; on the record itself there is nowhere to go.
export function CustomerCard({ customer, linkToRecord = true }: { customer: Customer; linkToRecord?: boolean }) {
  const name = `${customer.firstName} ${customer.lastName}`
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {linkToRecord && (
            <Link to={`/customers/${customer.id}`} className="hover:underline">
              {name}
            </Link>
          )}
          {!linkToRecord && name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-1.5">
          <Field label="ID">
            <span className="font-mono text-xs">{customer.id}</span>
          </Field>
          <Field label="Email">{customer.email}</Field>
          <Field label="Teléfono">{customer.phone}</Field>
          <Field label="Ciudad">
            {customer.city}, {countryWithFlag(customer.country)}
          </Field>
          <Field label="Cliente desde">{formatDate(customer.signupDate)}</Field>
          {customer.notes && <Field label="Notas internas">{customer.notes}</Field>}
        </dl>
      </CardContent>
    </Card>
  )
}

export function UnknownCustomerCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cliente no identificado</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        No coincide con ningún cliente registrado.
      </CardContent>
    </Card>
  )
}
