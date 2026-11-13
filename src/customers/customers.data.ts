import { DATA } from '@/data/peluda.data.ts'
import type { Order } from '@/data/model.types.ts'

// By ID: the handwritten case customers (CUS-00101…) come first, then the generated ones (CUS-01000…).
export const CUSTOMERS = [...DATA.customers].sort((a, b) => a.id.localeCompare(b.id))

export const findCustomer = (id: string | undefined) => DATA.customers.find((customer) => customer.id === id)

export const petsOf = (customerId: string | undefined) => DATA.pets.filter((pet) => pet.customerId === customerId)

export const subscriptionsOf = (customerId: string | undefined) =>
  DATA.subscriptions.filter((subscription) => subscription.customerId === customerId)

const newestFirst = (a: Order, b: Order) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)

export const ordersOf = (customerId: string | undefined) =>
  DATA.orders.filter((order) => order.customerId === customerId).sort(newestFirst)

export const findPlan = (id: string) => DATA.plans.find((plan) => plan.id === id)

export const productName = (id: string) => DATA.products.find((product) => product.id === id)?.name ?? id
