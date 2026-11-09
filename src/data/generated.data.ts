import customersJson from '../../data/generated/customers.generated.json' with { type: 'json' }
import ordersJson from '../../data/generated/orders.generated.json' with { type: 'json' }
import petsJson from '../../data/generated/pets.generated.json' with { type: 'json' }
import reviewsJson from '../../data/generated/reviews.generated.json' with { type: 'json' }
import subscriptionsJson from '../../data/generated/subscriptions.generated.json' with { type: 'json' }
import ticketsJson from '../../data/generated/tickets.generated.json' with { type: 'json' }
import {
  parseCustomer,
  parseList,
  parseOrder,
  parsePet,
  parseReview,
  parseSubscription,
  parseTicket,
} from './model.parse.ts'

// Fixed-seed filler written by `pnpm generate` (src/generate/). Never edited by hand.
export const GENERATED = {
  customers: parseList({ json: customersJson, file: 'customers.generated.json', parse: parseCustomer }),
  pets: parseList({ json: petsJson, file: 'pets.generated.json', parse: parsePet }),
  subscriptions: parseList({ json: subscriptionsJson, file: 'subscriptions.generated.json', parse: parseSubscription }),
  orders: parseList({ json: ordersJson, file: 'orders.generated.json', parse: parseOrder }),
  tickets: parseList({ json: ticketsJson, file: 'tickets.generated.json', parse: parseTicket }),
  reviews: parseList({ json: reviewsJson, file: 'reviews.generated.json', parse: parseReview }),
}
