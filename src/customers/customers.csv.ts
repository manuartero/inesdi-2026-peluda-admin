import { formatDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import type { Customer } from '@/data/model.types.ts'
import { toCsv } from '@/lib/csv.ts'
import type { CsvColumn } from '@/lib/csv.ts'
import { findPlan, petsOf, subscriptionsOf } from './customers.data.ts'

// petsText('CUS-00103') is 'Coco (gato), Bruno (perro)'.
const petsText = (customerId: string) =>
  petsOf(customerId)
    .map((pet) => `${pet.name} (${LABELS.species[pet.species].toLowerCase()})`)
    .join(', ')

// subscriptionsText('CUS-00103') is 'Básico (Activa), Completo (Activa)'.
const subscriptionsText = (customerId: string) =>
  subscriptionsOf(customerId)
    .map((subscription) => `${findPlan(subscription.planId)?.name ?? subscription.planId} (${LABELS.subscriptionStatus[subscription.status]})`)
    .join(', ')

// No email or phone: the export is for analysis, as «Copiar para el prompt» is.
const COLUMNS: CsvColumn<Customer>[] = [
  { header: 'ID', value: (customer) => customer.id },
  { header: 'Nombre', value: (customer) => customer.firstName },
  { header: 'Apellidos', value: (customer) => customer.lastName },
  { header: 'País', value: (customer) => LABELS.country[customer.country] },
  { header: 'Ciudad', value: (customer) => customer.city },
  { header: 'Cliente desde', value: (customer) => formatDate(customer.signupDate) },
  { header: 'Mascotas', value: (customer) => petsText(customer.id) },
  { header: 'Suscripciones', value: (customer) => subscriptionsText(customer.id) },
  { header: 'Notas internas', value: (customer) => customer.notes },
]

export const customersCsv = (customers: Customer[]) => toCsv({ columns: COLUMNS, rows: customers })
