import { formatAge, formatDate, formatTime } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import type { Customer, Pet } from '@/data/model.types.ts'
import type { InboxTicket } from './tickets.data.ts'

function petLine(pet: Pet) {
  const allergies = pet.allergies.length > 0 ? `alergias: ${pet.allergies.join(', ')}` : 'sin alergias conocidas'
  const details = [
    LABELS.species[pet.species].toLowerCase(),
    pet.breed,
    formatAge(pet.birthDate),
    `${pet.weightKg.toLocaleString('es-ES')} kg`,
    `actividad ${LABELS.petActivity[pet.activity].toLowerCase()}`,
    allergies,
  ]
  return `- ${pet.name}: ${details.join(', ')}`
}

function customerLines({ customer, pets }: { customer: Customer | undefined; pets: Pet[] }) {
  if (!customer) {
    return ['Cliente: no identificado']
  }
  return [
    `Cliente: ${customer.firstName} ${customer.lastName} (${customer.id})`,
    `Ciudad: ${customer.city}, ${LABELS.country[customer.country]}`,
    `Cliente desde: ${formatDate(customer.signupDate)}`,
    ...(customer.notes ? [`Notas internas: ${customer.notes}`] : []),
    ...(pets.length > 0 ? ['Mascotas:', ...pets.map(petLine)] : []),
  ]
}

/**
 * The text behind «Copiar para el prompt»: the ticket as the team sees it plus the customer record.
 * - Never the answer key (the build strips it anyway).
 * - No email or phone: they add nothing to classifying the ticket.
 */
export function ticketPromptText({ ticket, customer, pets }: { ticket: InboxTicket; customer: Customer | undefined; pets: Pet[] }) {
  return [
    `Ticket ${ticket.id}`,
    `Recibido: ${formatDate(ticket.receivedAt)} ${formatTime(ticket.receivedAt)} (hora local)`,
    `País: ${LABELS.country[ticket.country]}`,
    `Canal: ${LABELS.ticketChannel[ticket.channel]}`,
    `Remitente: ${ticket.sender}`,
    `Asunto: ${ticket.subject}`,
    '',
    'Mensaje:',
    ticket.message,
    '',
    ...customerLines({ customer, pets }),
  ].join('\n')
}
