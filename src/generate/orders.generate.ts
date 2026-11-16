import type { Charge, Country, Customer, Order, OrderLine, Pet, Product, Subscription } from '../data/model.types.ts'
import { CYCLE_DAYS, dayOf, relativeDay } from './generate.dates.ts'
import type { Day } from './generate.dates.ts'
import { POOLS } from './generate.pools.ts'
import { LARGE_PET_KG, priceOn } from './generate.prices.ts'
import type { Random } from './generate.random.ts'

// The CMS shows the last ~4 months of orders, not years of them.
const ORDER_HISTORY_FROM: Day = -115
// A handwritten order on (or a few days from) a cycle date replaces the generated one.
const HANDWRITTEN_WINDOW_DAYS = 3
// Peluda ships ~650 orders a day; these are a sample, so IDs leave gaps: ORD-2026-<100000 + (328 + day) × 640 + n>.
// 328 keeps the numbers in the range of the handwritten orders (ORD-2026-306214 is from 3 weeks ago).
const ORDERS_PER_DAY = 640
const ORDER_NUMBER_DAY_BASE = 328

type OrderDraft = { day: Day; order: Omit<Order, 'id'> }

type OrdersInput = {
  random: Random
  subscriptions: Subscription[]
  customers: Customer[]
  pets: Pet[]
  products: Product[]
  handwrittenOrders: Order[]
  pausedSince: Map<string, Day>
  // Only generated subscriptions get random incidents: the case customers' history must not add noise to their tickets.
  withIncidents: Set<string>
}

function cycleDays({ subscription, stop }: { subscription: Subscription; stop?: Day }) {
  const days: Day[] = []
  for (let day = dayOf(subscription.startDate); day <= 0; day += CYCLE_DAYS) {
    if (stop !== undefined && day >= stop) {
      break
    }
    if (day >= ORDER_HISTORY_FROM) {
      days.push(day)
    }
  }
  return days
}

// The new dog recipe only ships from its `availableFrom`: an older order still carries the one it replaces.
function productOn({ product, day }: { product: Product; day: Day }) {
  return day < dayOf(product.availableFrom) && product.replaces !== undefined ? product.replaces : product.id
}

function orderLines(input: { subscription: Subscription; day: Day; pet: Pet | undefined; products: Map<string, Product> }) {
  const { subscription, day, pet, products } = input
  const cycle = (day - dayOf(subscription.startDate)) / CYCLE_DAYS
  const lines: OrderLine[] = []
  for (const productId of subscription.productIds) {
    const product = products.get(productId)
    if (product === undefined || (product.kind === 'toy' && cycle % 3 !== 0)) {
      continue
    }
    const food = product.kind === 'kibble' || product.kind === 'special_diet'
    const large = (pet?.weightKg ?? 0) >= LARGE_PET_KG
    lines.push({ productId: productOn({ product, day }), quantity: food && large ? 2 : 1 })
  }
  return lines
}

// Today's orders are being prepared, the last three days' are on their way, older ones are delivered.
function orderOutcome({ random, day, amount, withIncidents }: { random: Random; day: Day; amount: number; withIncidents: boolean }) {
  const age = -day
  const date = relativeDay(day)
  const failedFirst = withIncidents && random.chance(0.015)
  const charges: Charge[] = failedFirst
    ? [{ date, amount, status: 'failed' }, { date: relativeDay(day + 1), amount, status: 'charged' }]
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
    charges.push({ date: relativeDay(day + 8), amount, status: 'refunded' })
    return { status: 'returned' as const, charges }
  }
  return { status: 'delivered' as const, charges }
}

function trackingNumber({ random, country }: { random: Random; country: Country }) {
  return `${POOLS.carriers[country].trackingPrefix}${random.int({ min: 10000000, max: 99999999 })}`
}

function orderId({ random, day, taken }: { random: Random; day: Day; taken: Set<string> }) {
  const base = 100000 + (ORDER_NUMBER_DAY_BASE + day) * ORDERS_PER_DAY
  let id = ''
  do {
    id = `ORD-2026-${base + random.int({ min: 0, max: ORDERS_PER_DAY - 1 })}`
  } while (taken.has(id))
  taken.add(id)
  return id
}

const replacedByHandwritten = ({ handwrittenOrders, subscriptionId, day }: { handwrittenOrders: Order[]; subscriptionId: string; day: Day }) =>
  handwrittenOrders.some((order) => order.subscriptionId === subscriptionId && Math.abs(day - dayOf(order.date)) <= HANDWRITTEN_WINDOW_DAYS)

/**
 * One order every 4 weeks per subscription over the last ~4 months, for handwritten and generated subscriptions alike.
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
    const stop = subscription.cancelDate === undefined ? pausedSince.get(subscription.id) : dayOf(subscription.cancelDate)
    for (const day of cycleDays({ subscription, stop })) {
      if (replacedByHandwritten({ handwrittenOrders, subscriptionId: subscription.id, day })) {
        continue
      }
      const amount = priceOn({ price: subscription.monthlyPrice, country, day })
      const outcome = orderOutcome({ random, day, amount, withIncidents: withIncidents.has(subscription.id) })
      const order = {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        date: relativeDay(day),
        lines: orderLines({ subscription, day, pet: petById.get(subscription.petId), products: productById }),
        amount,
        currency: subscription.currency,
        status: outcome.status,
        carrier: POOLS.carriers[country].name,
        trackingNumber: trackingNumber({ random, country }),
        charges: outcome.charges,
      }
      drafts.push({ day, order })
    }
  }

  drafts.sort((a, b) => a.day - b.day || a.order.subscriptionId.localeCompare(b.order.subscriptionId))
  const taken = new Set(handwrittenOrders.map((order) => order.id))
  return drafts.map(({ day, order }) => ({ id: orderId({ random, day, taken }), ...order }))
}
