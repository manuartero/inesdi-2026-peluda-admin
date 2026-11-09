// Peluda data model. Field-by-field notes in data/schema.md.

export const COUNTRIES = ['ES', 'MX', 'CO', 'PE', 'AR'] as const
export type Country = (typeof COUNTRIES)[number]
export type Currency = 'EUR' | 'MXN' | 'COP' | 'PEN' | 'ARS'
export const SPECIES = ['dog', 'cat'] as const
export type Species = (typeof SPECIES)[number]
// `2026-11-24` or `2026-11-24T09:15:00`, in the country's local time.
export type IsoDate = string

export const CURRENCY_BY_COUNTRY: Record<Country, Currency> = {
  ES: 'EUR',
  MX: 'MXN',
  CO: 'COP',
  PE: 'PEN',
  AR: 'ARS',
}
// The CMS "today" is session 1, so the demo, the screenshots and the recording all match.
export const REFERENCE_DATE: IsoDate = '2026-11-24'

export const PLAN_IDS = ['basic', 'complete', 'care'] as const

export type Plan = {
  id: (typeof PLAN_IDS)[number]
  name: string
  includes: string
  prices: Record<Country, number>
}

export const PRODUCT_KINDS = ['kibble', 'special_diet', 'treat', 'toy'] as const

export type Product = {
  id: string
  name: string
  kind: (typeof PRODUCT_KINDS)[number]
  species: Species | 'both'
  manufacturerId?: string
  markets: Country[]
  availableFrom: IsoDate
  replaces?: string
}

export type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country: Country
  city: string
  signupDate: IsoDate
  notes?: string
}

export const PET_ACTIVITIES = ['low', 'medium', 'high'] as const

export type Pet = {
  id: string
  customerId: string
  name: string
  species: Species
  breed: string
  birthDate: IsoDate
  weightKg: number
  activity: (typeof PET_ACTIVITIES)[number]
  allergies: string[]
}

export type Subscription = {
  id: string
  customerId: string
  petId: string
  planId: Plan['id']
  status: 'active' | 'paused' | 'cancelled'
  startDate: IsoDate
  cancelDate?: IsoDate
  monthlyPrice: number
  currency: Currency
  productIds: string[]
  nextShipment?: IsoDate
}

export type Charge = {
  date: IsoDate
  amount: number
  status: 'charged' | 'refunded' | 'failed'
}

export type Order = {
  id: string
  subscriptionId: string
  customerId: string
  date: IsoDate
  lines: { productId: string; quantity: number }[]
  amount: number
  currency: Currency
  status: 'preparing' | 'shipped' | 'delivered' | 'issue' | 'returned'
  carrier: string
  trackingNumber: string
  // Two `charged` entries on one order is the "charged twice" ticket.
  charges: Charge[]
}

// Answer keys are never shown in the CMS nor copied into the prompt.
// The build strips them from the bundle (see vite.config.ts), so the CMS works with `WithoutAnswerKey<T>`.
export type WithoutAnswerKey<T> = Omit<T, 'answerKey'>

export const TICKET_CATEGORIES = ['shipping', 'billing', 'plan_change', 'cancellation', 'product_health', 'account', 'other'] as const
export const URGENCIES = ['high', 'medium', 'low'] as const

export type TicketAnswerKey = {
  category: (typeof TICKET_CATEGORIES)[number]
  urgency: (typeof URGENCIES)[number]
  trap?: string
  handwritten: boolean
}

export const TICKET_CHANNELS = ['email', 'form', 'app', 'whatsapp'] as const
export const TICKET_STATUSES = ['unclassified'] as const

export type Ticket = {
  id: string
  receivedAt: IsoDate
  country: Country
  channel: (typeof TICKET_CHANNELS)[number]
  customerId?: string
  orderId?: string
  sender: string
  subject: string
  message: string
  status: (typeof TICKET_STATUSES)[number]
  answerKey: TicketAnswerKey
}

export type Supplier = {
  id: string
  legalName: string
  taxId: string
  country: Country
  city: string
  service: string
  contact: { name: string; email: string }
  contractId?: string
}

export const CONTRACT_TRAP_KINDS = ['auto_renewal', 'hidden_penalty', 'missing_clause'] as const

export type ContractTrap = {
  kind: (typeof CONTRACT_TRAP_KINDS)[number]
  // The clause number as written in the text (`14.2`, `II.6`); for `missing_clause`, the clause that should be there: "Confidencialidad".
  clause: string
  explanation: string
}

export type Contract = {
  id: string
  supplierId: string
  title: string
  signedOn: IsoDate
  startDate: IsoDate
  // What the team believes, not what the text says: the auto-renewal trap hides in the gap.
  expiryOnRecord: IsoDate
  // Relative to data/handwritten/, e.g. `contracts/nutrican.md`.
  file: string
  answerKey: { traps: ContractTrap[] }
}

export type Review = {
  id: string
  date: IsoDate
  channel: 'web' | 'app' | 'google'
  country: Country
  customerId?: string
  author: string
  stars: 1 | 2 | 3 | 4 | 5
  title?: string
  text: string
  status: 'unanswered' | 'answered'
  reply?: string
  answerKey: {
    kind: 'positive' | 'negative' | 'mixed' | 'troll' | 'personal_data'
    handwritten: boolean
  }
}

export type Company = {
  subscribers: Record<Country, number>
  annualRevenueEur: number
  monthlyChurnPct: number
  ticketsPerDay: number
  firstResponseHours: { current: number; target: number }
  reviewsPerMonth: number
  reviewsAnsweredPct: number
  averageRating: number
}
