import { Field } from '@/app/field.component.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/data/model.dates.ts'
import { countryWithFlag } from '@/data/model.labels.ts'
import type { Customer } from '@/data/model.types.ts'

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {customer.firstName} {customer.lastName}
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
