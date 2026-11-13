import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { formatMoney } from '@/data/model.money.ts'
import type { Order } from '@/data/model.types.ts'
import { chargeText, linesText } from './order.text.ts'

const PROBLEM_STATUSES: Order['status'][] = ['issue', 'returned']

function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const label = LABELS.orderStatus[status]
  const isProblem = PROBLEM_STATUSES.includes(status)
  return (
    <>
      {isProblem && <Badge variant="destructive">{label}</Badge>}
      {!isProblem && <Badge variant="outline">{label}</Badge>}
    </>
  )
}

function OrderRow({ order, highlighted }: { order: Order; highlighted: boolean }) {
  return (
    <TableRow className={highlighted ? 'bg-amber-50 dark:bg-amber-950/40' : undefined}>
      <TableCell className="tabular-nums text-muted-foreground">{formatDate(order.date)}</TableCell>
      <TableCell className="font-mono text-xs">{order.id}</TableCell>
      <TableCell className="max-w-0 w-full whitespace-normal">{linesText(order)}</TableCell>
      <TableCell className="tabular-nums">{formatMoney({ amount: order.amount, currency: order.currency })}</TableCell>
      <TableCell className="whitespace-nowrap">
        {order.charges.map((charge) => (
          <div key={`${charge.date}-${charge.status}-${charge.amount}`}>{chargeText({ charge, order })}</div>
        ))}
      </TableCell>
      <TableCell>
        <OrderStatusBadge status={order.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {order.carrier}
        <div className="font-mono">{order.trackingNumber}</div>
      </TableCell>
    </TableRow>
  )
}

type OrderHistoryProps = { orders: Order[]; highlightedOrderId?: string; title?: string }

// Newest first. The ticket detail highlights the order the ticket is about.
export function OrderHistory({ orders, highlightedOrderId, title = 'Pedidos' }: OrderHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title} <span className="font-normal text-muted-foreground">· {orders.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 && <p className="text-sm text-muted-foreground">Sin pedidos.</p>}
        {orders.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Cobros</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Envío</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} highlighted={order.id === highlightedOrderId} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
