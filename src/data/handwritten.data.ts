import companyJson from '../../data/handwritten/company.handwritten.json' with { type: 'json' }
import contractsJson from '../../data/handwritten/contracts.handwritten.json' with { type: 'json' }
import customersJson from '../../data/handwritten/customers.handwritten.json' with { type: 'json' }
import petsJson from '../../data/handwritten/pets.handwritten.json' with { type: 'json' }
import plansJson from '../../data/handwritten/plans.handwritten.json' with { type: 'json' }
import productsJson from '../../data/handwritten/products.handwritten.json' with { type: 'json' }
import reviewsJson from '../../data/handwritten/reviews.handwritten.json' with { type: 'json' }
import suppliersJson from '../../data/handwritten/suppliers.handwritten.json' with { type: 'json' }
import ticketsJson from '../../data/handwritten/tickets.handwritten.json' with { type: 'json' }
import { dataError } from './json-row.reader.ts'
import {
  parseCompany,
  parseContract,
  parseCustomer,
  parseList,
  parseOne,
  parsePet,
  parsePlan,
  parseProduct,
  parseReview,
  parseSupplier,
  parseTicket,
} from './model.parse.ts'
import type { Supplier } from './model.types.ts'

type Identified = { id: string }

function checkUniqueIds({ items, file }: { items: Identified[]; file: string }) {
  const seen = new Set<string>()
  for (const { id } of items) {
    if (seen.has(id)) {
      throw dataError(`${file}: duplicate id ${id}`)
    }
    seen.add(id)
  }
}

// checkReference({ from: 'TCK-20261124-0004', field: 'customerId', id: 'CUS-00999', targets }) fails:
// the ticket would show an empty customer card in the demo.
function checkReference({ from, field, id, targets }: { from: string; field: string; id?: string; targets: Identified[] }) {
  if (id === undefined || targets.some((target) => target.id === id)) {
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

function loadHandwritten() {
  const plans = parseList({ json: plansJson, file: 'plans.handwritten.json', parse: parsePlan })
  const products = parseList({ json: productsJson, file: 'products.handwritten.json', parse: parseProduct })
  const suppliers = parseList({ json: suppliersJson, file: 'suppliers.handwritten.json', parse: parseSupplier })
  const contracts = parseList({ json: contractsJson, file: 'contracts.handwritten.json', parse: parseContract })
  const customers = parseList({ json: customersJson, file: 'customers.handwritten.json', parse: parseCustomer })
  const pets = parseList({ json: petsJson, file: 'pets.handwritten.json', parse: parsePet })
  const tickets = parseList({ json: ticketsJson, file: 'tickets.handwritten.json', parse: parseTicket })
  const reviews = parseList({ json: reviewsJson, file: 'reviews.handwritten.json', parse: parseReview })
  const company = parseOne({ json: companyJson, file: 'company.handwritten.json', parse: parseCompany })

  checkUniqueIds({ items: products, file: 'products.handwritten.json' })
  checkUniqueIds({ items: suppliers, file: 'suppliers.handwritten.json' })
  checkUniqueIds({ items: contracts, file: 'contracts.handwritten.json' })
  checkUniqueIds({ items: customers, file: 'customers.handwritten.json' })
  checkUniqueIds({ items: pets, file: 'pets.handwritten.json' })
  checkUniqueIds({ items: tickets, file: 'tickets.handwritten.json' })
  checkUniqueIds({ items: reviews, file: 'reviews.handwritten.json' })

  for (const product of products) {
    checkReference({ from: product.id, field: 'manufacturerId', id: product.manufacturerId, targets: suppliers })
    checkReference({ from: product.id, field: 'replaces', id: product.replaces, targets: products })
  }
  for (const supplier of suppliers) {
    checkReference({ from: supplier.id, field: 'contractId', id: supplier.contractId, targets: contracts })
  }
  for (const contract of contracts) {
    checkReference({ from: contract.id, field: 'supplierId', id: contract.supplierId, targets: suppliers })
    checkContractOwner({ contract, suppliers })
  }
  for (const pet of pets) {
    checkReference({ from: pet.id, field: 'customerId', id: pet.customerId, targets: customers })
  }
  for (const ticket of tickets) {
    checkReference({ from: ticket.id, field: 'customerId', id: ticket.customerId, targets: customers })
  }

  for (const review of reviews) {
    checkReference({ from: review.id, field: 'customerId', id: review.customerId, targets: customers })
    checkReply(review)
  }

  return { plans, products, suppliers, contracts, customers, pets, tickets, reviews, company }
}

export const HANDWRITTEN = loadHandwritten()
