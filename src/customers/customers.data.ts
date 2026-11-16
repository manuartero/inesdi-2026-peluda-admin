import { countryFromParam } from '@/app/list-filters.params.ts'
import type { Country, Customer, Order } from '@/data/model.types.ts'
import { DATA } from '@/data/peluda.data.ts'

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

// normalized('  Lucía NAVARRO ') is 'lucia navarro', so «lucia» finds «Lucía».
export const normalized = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

// One string per customer with everything the search box looks at: name, ID, email, city and pet names.
function searchableText(customer: Customer) {
  const petNames = petsOf(customer.id).map((pet) => pet.name)
  return normalized([customer.firstName, customer.lastName, customer.id, customer.email, customer.city, ...petNames].join(' '))
}

const SEARCHABLE = new Map(CUSTOMERS.map((customer) => [customer.id, searchableText(customer)]))

export type CustomerFilters = { country?: Country; query: string }

export const customerFilters = (params: URLSearchParams) => ({
  country: countryFromParam(params.get('country')),
  query: normalized(params.get('q') ?? ''),
})

export function matchesCustomer({ customer, filters }: { customer: Customer; filters: CustomerFilters }) {
  const countryMatches = !filters.country || customer.country === filters.country
  const queryMatches = !filters.query || (SEARCHABLE.get(customer.id) ?? '').includes(filters.query)
  return countryMatches && queryMatches
}

export const filterCustomers = (params: URLSearchParams) => {
  const filters = customerFilters(params)
  return CUSTOMERS.filter((customer) => matchesCustomer({ customer, filters }))
}
