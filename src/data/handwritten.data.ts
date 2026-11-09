import companyJson from '../../data/handwritten/company.handwritten.json' with { type: 'json' }
import contractsJson from '../../data/handwritten/contracts.handwritten.json' with { type: 'json' }
import customersJson from '../../data/handwritten/customers.handwritten.json' with { type: 'json' }
import ordersJson from '../../data/handwritten/orders.handwritten.json' with { type: 'json' }
import petsJson from '../../data/handwritten/pets.handwritten.json' with { type: 'json' }
import plansJson from '../../data/handwritten/plans.handwritten.json' with { type: 'json' }
import productsJson from '../../data/handwritten/products.handwritten.json' with { type: 'json' }
import reviewsJson from '../../data/handwritten/reviews.handwritten.json' with { type: 'json' }
import subscriptionsJson from '../../data/handwritten/subscriptions.handwritten.json' with { type: 'json' }
import suppliersJson from '../../data/handwritten/suppliers.handwritten.json' with { type: 'json' }
import ticketsJson from '../../data/handwritten/tickets.handwritten.json' with { type: 'json' }
import {
  parseCompany,
  parseContract,
  parseCustomer,
  parseList,
  parseOne,
  parseOrder,
  parsePet,
  parsePlan,
  parseProduct,
  parseReview,
  parseSubscription,
  parseSupplier,
  parseTicket,
} from './model.parse.ts'

// The case content, with the traps. Cross-file checks run on the merged data in peluda.data.ts.
export const HANDWRITTEN = {
  plans: parseList({ json: plansJson, file: 'plans.handwritten.json', parse: parsePlan }),
  products: parseList({ json: productsJson, file: 'products.handwritten.json', parse: parseProduct }),
  suppliers: parseList({ json: suppliersJson, file: 'suppliers.handwritten.json', parse: parseSupplier }),
  contracts: parseList({ json: contractsJson, file: 'contracts.handwritten.json', parse: parseContract }),
  customers: parseList({ json: customersJson, file: 'customers.handwritten.json', parse: parseCustomer }),
  pets: parseList({ json: petsJson, file: 'pets.handwritten.json', parse: parsePet }),
  subscriptions: parseList({ json: subscriptionsJson, file: 'subscriptions.handwritten.json', parse: parseSubscription }),
  orders: parseList({ json: ordersJson, file: 'orders.handwritten.json', parse: parseOrder }),
  tickets: parseList({ json: ticketsJson, file: 'tickets.handwritten.json', parse: parseTicket }),
  reviews: parseList({ json: reviewsJson, file: 'reviews.handwritten.json', parse: parseReview }),
  company: parseOne({ json: companyJson, file: 'company.handwritten.json', parse: parseCompany }),
}
