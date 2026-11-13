import { formatDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { formatMoney } from '@/data/model.money.ts'
import type { Charge, Order, OrderLine } from '@/data/model.types.ts'
import { productName } from './customers.data.ts'

// lineText({ productId: 'PRD-TREAT-DOG', quantity: 2 }) is 'Snacks Perro ×2'.
function lineText(line: OrderLine) {
  const name = productName(line.productId)
  return line.quantity > 1 ? `${name} ×${line.quantity}` : name
}

export const linesText = (order: Order) => order.lines.map(lineText).join(', ')

// chargeText({ charge: { date: '2026-11-02', amount: 45, status: 'charged' }, order }) is 'Cobrado 45 €';
// the date only shows when it is not the order's, as with a refund a week later: 'Devuelto 45 € el 09/11/2026'.
export function chargeText({ charge, order }: { charge: Charge; order: Order }) {
  const text = `${LABELS.chargeStatus[charge.status]} ${formatMoney({ amount: charge.amount, currency: order.currency })}`
  return charge.date === order.date ? text : `${text} el ${formatDate(charge.date)}`
}
