import { findPlan, productName } from '@/customers/customers.data.ts'
import { chargeText, linesText } from '@/customers/order.text.ts'
import { formatAge, formatDate, formatTime } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import { formatMoney } from '@/data/model.money.ts'
import type { Customer, Order, Pet, Subscription } from '@/data/model.types.ts'
import type { InboxTicket } from './tickets.data.ts'

function petLine(pet: Pet) {
  const allergies = pet.allergies.length > 0 ? `alergias: ${pet.allergies.join(', ')}` : 'sin alergias conocidas'
  const details = [
    LABELS.species[pet.species].toLowerCase(),
    pet.breed,
    formatAge(pet.birthDate),
    `${pet.weightKg.toLocaleString('es-ES')} kg`,
    `actividad ${LABELS.petActivity[pet.activity].toLowerCase()}`,
    allergies,
  ]
  return `- ${pet.name}: ${details.join(', ')}`
}

function customerLines({ customer, pets }: { customer: Customer | undefined; pets: Pet[] }) {
  if (!customer) {
    return ['Cliente: no identificado']
  }
  return [
    `Cliente: ${customer.firstName} ${customer.lastName} (${customer.id})`,
    `Ciudad: ${customer.city}, ${LABELS.country[customer.country]}`,
    `Cliente desde: ${formatDate(customer.signupDate)}`,
    ...(customer.notes ? [`Notas internas: ${customer.notes}`] : []),
    ...(pets.length > 0 ? ['Mascotas:', ...pets.map(petLine)] : []),
  ]
}

// The newest orders are enough to read a billing or shipping ticket; the ticket's own order always goes in, however old.
const PROMPT_ORDER_COUNT = 6

type CustomerHistory = { customer: Customer | undefined; pets: Pet[]; subscriptions: Subscription[]; orders: Order[] }

// '- SUB-00103-1 · Coco · Plan Básico · Activa · 29 € al mes · Pienso Adulto Gato · alta 07/10/2024 · próximo envío 30/11/2026'
function subscriptionLine({ subscription, pets }: { subscription: Subscription; pets: Pet[] }) {
  const pet = pets.find((candidate) => candidate.id === subscription.petId)
  const details = [
    subscription.id,
    pet?.name,
    `Plan ${findPlan(subscription.planId)?.name ?? subscription.planId}`,
    LABELS.subscriptionStatus[subscription.status],
    `${formatMoney({ amount: subscription.monthlyPrice, currency: subscription.currency })} al mes`,
    subscription.productIds.map(productName).join(', '),
    `alta ${formatDate(subscription.startDate)}`,
    subscription.cancelDate && `baja ${formatDate(subscription.cancelDate)}`,
    subscription.nextShipment && `próximo envío ${formatDate(subscription.nextShipment)}`,
  ]
  return `- ${details.filter(Boolean).join(' · ')}`
}

// '- 02/11/2026 · ORD-2026-296152 · Pienso Adulto Gato · 29 € · Entregado · Cobrado 29 € · Rutas Levante RL-51401528'
function orderLine({ order, ticketOrderId }: { order: Order; ticketOrderId?: string }) {
  const details = [
    formatDate(order.date),
    order.id === ticketOrderId ? `${order.id} (el pedido del ticket)` : order.id,
    linesText(order),
    formatMoney({ amount: order.amount, currency: order.currency }),
    LABELS.orderStatus[order.status],
    order.charges.map((charge) => chargeText({ charge, order })).join(' + '),
    `${order.carrier} ${order.trackingNumber}`,
  ]
  return `- ${details.join(' · ')}`
}

function promptOrders({ orders, ticketOrderId }: { orders: Order[]; ticketOrderId?: string }) {
  const newest = orders.slice(0, PROMPT_ORDER_COUNT)
  const ticketOrder = orders.find((order) => order.id === ticketOrderId)
  const isTicketOrderMissing = ticketOrder !== undefined && !newest.includes(ticketOrder)
  return isTicketOrderMissing ? [...newest, ticketOrder] : newest
}

// A titled block with a blank line before it, or nothing when there are no lines: «Suscripciones:» alone would read as «none».
const block = ({ title, lines }: { title: string; lines: string[] }) => (lines.length > 0 ? ['', title, ...lines] : [])

function historyLines({ history, ticketOrderId }: { history: CustomerHistory; ticketOrderId?: string }) {
  const { subscriptions, pets } = history
  const orders = promptOrders({ orders: history.orders, ticketOrderId })
  const subscriptionLines = subscriptions.map((subscription) => subscriptionLine({ subscription, pets }))
  const orderLines = orders.map((order) => orderLine({ order, ticketOrderId }))
  return [
    ...block({ title: 'Suscripciones:', lines: subscriptionLines }),
    ...block({ title: 'Últimos pedidos (el más reciente primero):', lines: orderLines }),
  ]
}

/**
 * The text behind «Copiar para el prompt»: the ticket as the team sees it plus the customer record.
 * - Subscriptions and the newest orders, so «me habéis cobrado dos veces» can be checked against the charges.
 * - Never the answer key (the build strips it anyway).
 * - No email or phone: they add nothing to classifying the ticket.
 */
export function ticketPromptText({ ticket, history }: { ticket: InboxTicket; history: CustomerHistory }) {
  const { customer, pets } = history
  return [
    `Ticket ${ticket.id}`,
    `Recibido: ${formatDate(ticket.receivedAt)} ${formatTime(ticket.receivedAt)} (hora local)`,
    `País: ${LABELS.country[ticket.country]}`,
    `Canal: ${LABELS.ticketChannel[ticket.channel]}`,
    `Remitente: ${ticket.sender}`,
    `Asunto: ${ticket.subject}`,
    '',
    'Mensaje:',
    ticket.message,
    '',
    ...customerLines({ customer, pets }),
    ...historyLines({ history, ticketOrderId: ticket.orderId }),
  ].join('\n')
}
