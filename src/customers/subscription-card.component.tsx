import { Field } from '@/app/field.component.tsx'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { formatMoney } from '@/data/model.money.ts'
import type { Pet, Subscription } from '@/data/model.types.ts'
import { findPlan, productName } from './customers.data.ts'

export function SubscriptionStatusBadge({ status }: { status: Subscription['status'] }) {
  const label = LABELS.subscriptionStatus[status]
  return (
    <>
      {status === 'active' && <Badge variant="secondary">{label}</Badge>}
      {status !== 'active' && <Badge variant="outline">{label}</Badge>}
    </>
  )
}

export function SubscriptionCard({ subscription, pet }: { subscription: Subscription; pet: Pet | undefined }) {
  const plan = findPlan(subscription.planId)
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>
            Plan {plan?.name ?? subscription.planId}
            {pet && <span className="font-normal text-muted-foreground"> · {pet.name}</span>}
          </span>
          <SubscriptionStatusBadge status={subscription.status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-1.5">
          <Field label="ID">
            <span className="font-mono text-xs">{subscription.id}</span>
          </Field>
          <Field label="Cuota mensual">{formatMoney({ amount: subscription.monthlyPrice, currency: subscription.currency })}</Field>
          <Field label="Productos">{subscription.productIds.map(productName).join(', ')}</Field>
          <Field label="Alta">{formatDate(subscription.startDate)}</Field>
          {subscription.cancelDate && <Field label="Baja">{formatDate(subscription.cancelDate)}</Field>}
          {subscription.nextShipment && <Field label="Próximo envío">{formatDate(subscription.nextShipment)}</Field>}
        </dl>
      </CardContent>
    </Card>
  )
}
