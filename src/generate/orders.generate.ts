import { REFERENCE_DATE } from '../data/model.types.ts'
import type { Charge, Country, Customer, IsoDate, Order, OrderLine, Pet, Product, Subscription } from '../data/model.types.ts'
import { addDays, CYCLE_DAYS, dayOfYear, daysBetween } from './generate.dates.ts'
import { POOLS } from './generate.pools.ts'
import { priceOn } from './generate.prices.ts'
import type { Random } from './generate.random.ts'

// The CMS shows the last few months of orders, not years of them: ~1.000 orders in total.
const ORDER_HISTORY_FROM: IsoDate = '2026-08-01'
// A handwritten order on (or a few days from) a cycle date replaces the generated one.
const HANDWRITTEN_WINDOW_DAYS = 3
// Peluda ships ~650 orders a day; these are a sample, so IDs leave gaps: ORD-2026-<100000 + day of year × 640 + n>.
const ORDERS_PER_DAY = 640
const LARGE_PET_KG = 30

type OrderDraft = Omit<Order, 'id'>

type OrdersInput = {
  random: Random
  subscriptions: Subscription[]
  customers: Customer[]
  pets: Pet[]
  products: Product[]
  handwrittenOrders: Order[]
  pausedSince: Map<string, IsoDate>
  // Only generated subscriptions get random incidents: the case customers' history must not add noise to their tickets.
  withIncidents: Set<string>
}

function cycleDates({ subscription, stop }: { subscription: Subscription; stop?: IsoDate }) {
  const dates: IsoDate[] = []
  for (let date = subscription.startDate; date <= REFERENCE_DATE; date = addDays({ date, days: CYCLE_DAYS })) {
    if (stop !== undefined && date >= stop) {
      break
    }
    if (date >= ORDER_HISTORY_FROM) {
      dates.push(date)
    }
  }
  return dates
}

// The 2026 dog recipe only ships from 1 October: an order from September still carries the 2024 one.
function productOn({ product, date }: { product: Product; date: IsoDate }) {
  return date < product.availableFrom && product.replaces !== undefined ? product.replaces : product.id
}

function orderLines(input: { subscription: Subscription; date: IsoDate; pet: Pet | undefined; products: Map<string, Product> }) {
  const { subscription, date, pet, products } = input
  const cycle = daysBetween({ from: subscription.startDate, to: date }) / CYCLE_DAYS
  const lines: OrderLine[] = []
  for (const productId of subscription.productIds) {
    const product = products.get(productId)
    if (product === undefined || (product.kind === 'toy' && cycle % 3 !== 0)) {
      continue
    }
    const food = product.kind === 'kibble' || product.kind === 'special_diet'
    const large = (pet?.weightKg ?? 0) >= LARGE_PET_KG
    lines.push({ productId: productOn({ product, date }), quantity: food && large ? 2 : 1 })
  }
  return lines
}

// Today's orders are being prepared, the last three days' are on their way, older ones are delivered.
function orderOutcome({ random, date, amount, withIncidents }: { random: Random; date: IsoDate; amount: number; withIncidents: boolean }) {
  const age = daysBetween({ from: date, to: REFERENCE_DATE })
  const failedFirst = withIncidents && random.chance(0.015)
  const charges: Charge[] = failedFirst
    ? [{ date, amount, status: 'failed' }, { date: addDays({ date, days: 1 }), amount, status: 'charged' }]
    : [{ date, amount, status: 'charged' }]
  if (age === 0) {
    return { status: 'preparing' as const, charges }
  }
  if (age <= 3) {
    return { status: 'shipped' as const, charges }
  }
  const roll = withIncidents ? random.next() : 1
  if (roll < 0.02) {
    return { status: 'issue' as const, charges }
  }
  if (roll < 0.035 && age >= 10) {
    charges.push({ date: addDays({ date, days: 8 }), amount, status: 'refunded' })
    return { status: 'returned' as const, charges }
  }
  return { status: 'delivered' as const, charges }
}

function trackingNumber({ random, country }: { random: Random; country: Country }) {
  return `${POOLS.carriers[country].trackingPrefix}${random.int({ min: 10000000, max: 99999999 })}`
}

function orderId({ random, date, taken }: { random: Random; date: IsoDate; taken: Set<string> }) {
  const base = 100000 + dayOfYear(date) * ORDERS_PER_DAY
  let id = ''
  do {
    id = `ORD-${date.slice(0, 4)}-${base + random.int({ min: 0, max: ORDERS_PER_DAY - 1 })}`
  } while (taken.has(id))
  taken.add(id)
  return id
}

const replacedByHandwritten = ({ handwrittenOrders, subscriptionId, date }: { handwrittenOrders: Order[]; subscriptionId: string; date: IsoDate }) =>
  handwrittenOrders.some(
    (order) => order.subscriptionId === subscriptionId && Math.abs(daysBetween({ from: order.date, to: date })) <= HANDWRITTEN_WINDOW_DAYS,
  )

/**
 * One order every 4 weeks per subscription since August 2026, for handwritten and generated subscriptions alike.
 * - Stops at the cancel date, or when a paused subscription stopped shipping.
 * - Skips the cycles a handwritten order already covers (Marina's broken box, Daniel's «entregado»…).
 */
export function generateOrders(input: OrdersInput) {
  const { random, subscriptions, customers, pets, products, handwrittenOrders, pausedSince, withIncidents } = input
  const countryOf = new Map(customers.map((customer) => [customer.id, customer.country]))
  const petById = new Map(pets.map((pet) => [pet.id, pet]))
  const productById = new Map(products.map((product) => [product.id, product]))

  const drafts: OrderDraft[] = []
  for (const subscription of subscriptions) {
    const country = countryOf.get(subscription.customerId)
    if (country === undefined) {
      throw new Error(`${subscription.id}: customer ${subscription.customerId} not found`)
    }
    const stop = subscription.cancelDate ?? pausedSince.get(subscription.id)
    for (const date of cycleDates({ subscription, stop })) {
      if (replacedByHandwritten({ handwrittenOrders, subscriptionId: subscription.id, date })) {
        continue
      }
      const amount = priceOn({ price: subscription.monthlyPrice, country, date })
      const outcome = orderOutcome({ random, date, amount, withIncidents: withIncidents.has(subscription.id) })
      drafts.push({
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        date,
        lines: orderLines({ subscription, date, pet: petById.get(subscription.petId), products: productById }),
        amount,
        currency: subscription.currency,
        status: outcome.status,
        carrier: POOLS.carriers[country].name,
        trackingNumber: trackingNumber({ random, country }),
        charges: outcome.charges,
      })
    }
  }

  drafts.sort((a, b) => a.date.localeCompare(b.date) || a.subscriptionId.localeCompare(b.subscriptionId))
  const taken = new Set(handwrittenOrders.map((order) => order.id))
  return drafts.map((draft) => ({ id: orderId({ random, date: draft.date, taken }), ...draft }))
}
