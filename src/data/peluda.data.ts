import { GENERATED } from './generated.data.ts'
import { HANDWRITTEN } from './handwritten.data.ts'
import { dataError } from './json-row.reader.ts'
import type { Order, Pet, Subscription, Supplier } from './model.types.ts'

type Identified = { id: string }

// Handwritten and generated rows share one ID space: `CUS-01042` in both files would make findCustomer() pick either.
function idsOf({ items, what }: { items: Identified[]; what: string }) {
  const ids = new Set<string>()
  for (const { id } of items) {
    if (ids.has(id)) {
      throw dataError(`${what}: duplicate id ${id}`)
    }
    ids.add(id)
  }
  return ids
}

// checkReference({ from: 'TCK-20261124-0004', field: 'customerId', id: 'CUS-00999', ids }) fails:
// the ticket would show an empty customer card in the demo.
function checkReference({ from, field, id, ids }: { from: string; field: string; id?: string; ids: Set<string> }) {
  if (id === undefined || ids.has(id)) {
    return
  }
  throw dataError(`${from} › ${field}: ${id} does not exist`)
}

// SUP-VETAMIGA pointing at CTR-NUTRICAN-2024 would open the wrong contract from the supplier page.
function checkContractOwner({ contract, suppliers }: { contract: { id: string; supplierId: string }; suppliers: Supplier[] }) {
  const owner = suppliers.find((supplier) => supplier.contractId === contract.id)
  if (owner?.id !== contract.supplierId) {
    throw dataError(`${contract.id} › supplierId: ${contract.supplierId} does not list it as its contractId`)
  }
}

// An answered review shows its reply; an unanswered one with a reply would leak a model answer into the demo.
function checkReply(review: { id: string; status: string; reply?: string }) {
  const hasReply = review.reply !== undefined
  if (hasReply !== (review.status === 'answered')) {
    throw dataError(`${review.id} › reply: only answered reviews have one, and they all do`)
  }
}

// SUB-00103-2 for Bruno must belong to Lucía, Bruno's owner, or her record would list someone else's pet.
function checkSameCustomer({ from, field, customerId, owner }: { from: string; field: string; customerId?: string; owner?: string }) {
  if (customerId === undefined || owner === undefined || owner === customerId) {
    return
  }
  throw dataError(`${from} › ${field}: belongs to ${owner}, not to ${customerId}`)
}

// A subscription stops at its cancel date and only a cancelled one has it: Raúl's order after his cancellation is the trap.
function checkCancelDate(subscription: Subscription) {
  const hasCancelDate = subscription.cancelDate !== undefined
  if (hasCancelDate !== (subscription.status === 'cancelled')) {
    throw dataError(`${subscription.id} › cancelDate: only cancelled subscriptions have one, and they all do`)
  }
}

const ownerById = <T extends { id: string; customerId: string }>(items: T[]) =>
  new Map(items.map((item) => [item.id, item.customerId]))

function loadData() {
  const { plans, products, suppliers, contracts, company } = HANDWRITTEN
  const customers = [...HANDWRITTEN.customers, ...GENERATED.customers]
  const pets: Pet[] = [...HANDWRITTEN.pets, ...GENERATED.pets]
  const subscriptions = [...HANDWRITTEN.subscriptions, ...GENERATED.subscriptions]
  const orders: Order[] = [...HANDWRITTEN.orders, ...GENERATED.orders]
  const tickets = [...HANDWRITTEN.tickets, ...GENERATED.tickets]
  const reviews = [...HANDWRITTEN.reviews, ...GENERATED.reviews]

  const planIds = idsOf({ items: plans, what: 'plans' })
  const productIds = idsOf({ items: products, what: 'products' })
  const supplierIds = idsOf({ items: suppliers, what: 'suppliers' })
  const contractIds = idsOf({ items: contracts, what: 'contracts' })
  const customerIds = idsOf({ items: customers, what: 'customers' })
  const petIds = idsOf({ items: pets, what: 'pets' })
  const subscriptionIds = idsOf({ items: subscriptions, what: 'subscriptions' })
  const orderIds = idsOf({ items: orders, what: 'orders' })
  idsOf({ items: tickets, what: 'tickets' })
  idsOf({ items: reviews, what: 'reviews' })
  const petOwners = ownerById(pets)
  const subscriptionOwners = ownerById(subscriptions)
  const orderOwners = ownerById(orders)

  for (const product of products) {
    checkReference({ from: product.id, field: 'manufacturerId', id: product.manufacturerId, ids: supplierIds })
    checkReference({ from: product.id, field: 'replaces', id: product.replaces, ids: productIds })
  }
  for (const supplier of suppliers) {
    checkReference({ from: supplier.id, field: 'contractId', id: supplier.contractId, ids: contractIds })
  }
  for (const contract of contracts) {
    checkReference({ from: contract.id, field: 'supplierId', id: contract.supplierId, ids: supplierIds })
    checkContractOwner({ contract, suppliers })
  }
  for (const pet of pets) {
    checkReference({ from: pet.id, field: 'customerId', id: pet.customerId, ids: customerIds })
  }
  for (const subscription of subscriptions) {
    const from = subscription.id
    checkReference({ from, field: 'customerId', id: subscription.customerId, ids: customerIds })
    checkReference({ from, field: 'petId', id: subscription.petId, ids: petIds })
    checkReference({ from, field: 'planId', id: subscription.planId, ids: planIds })
    for (const productId of subscription.productIds) {
      checkReference({ from, field: 'productIds', id: productId, ids: productIds })
    }
    const owner = petOwners.get(subscription.petId)
    checkSameCustomer({ from, field: 'petId', customerId: subscription.customerId, owner })
    checkCancelDate(subscription)
  }
  for (const order of orders) {
    checkReference({ from: order.id, field: 'subscriptionId', id: order.subscriptionId, ids: subscriptionIds })
    for (const line of order.lines) {
      checkReference({ from: order.id, field: 'lines', id: line.productId, ids: productIds })
    }
    const owner = subscriptionOwners.get(order.subscriptionId)
    checkSameCustomer({ from: order.id, field: 'subscriptionId', customerId: order.customerId, owner })
  }
  for (const ticket of tickets) {
    checkReference({ from: ticket.id, field: 'customerId', id: ticket.customerId, ids: customerIds })
    checkReference({ from: ticket.id, field: 'orderId', id: ticket.orderId, ids: orderIds })
    const owner = ticket.orderId === undefined ? undefined : orderOwners.get(ticket.orderId)
    checkSameCustomer({ from: ticket.id, field: 'orderId', customerId: ticket.customerId, owner })
  }
  for (const review of reviews) {
    checkReference({ from: review.id, field: 'customerId', id: review.customerId, ids: customerIds })
    checkReply(review)
  }

  return { plans, products, suppliers, contracts, company, customers, pets, subscriptions, orders, tickets, reviews }
}

// Handwritten case content plus the generated filler, checked as one data set.
export const DATA = loadData()
