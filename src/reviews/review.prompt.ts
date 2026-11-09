import { formatDate } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import type { Customer, Pet } from '@/data/model.types.ts'
import type { ShownReview } from './reviews.data.ts'

function petLine(pet: Pet) {
  return `- ${pet.name}: ${LABELS.species[pet.species].toLowerCase()}, ${pet.breed}`
}

function customerLines({ customer, pets }: { customer: Customer | undefined; pets: Pet[] }) {
  if (!customer) {
    return ['Cliente: no identificado']
  }
  return [
    `Cliente: ${customer.firstName} ${customer.lastName} (${customer.id}), ${customer.city}`,
    ...(pets.length > 0 ? ['Mascotas:', ...pets.map(petLine)] : []),
  ]
}

/**
 * The text behind «Copiar para el prompt» on a review: the review as published plus who wrote it, if we know.
 * - The pets' names, so the reply can use them (brand voice rule 1). No email or phone.
 * - The published reply, when there is one.
 */
export function reviewPromptText({ review, customer, pets }: { review: ShownReview; customer: Customer | undefined; pets: Pet[] }) {
  return [
    `Reseña ${review.id}`,
    `Fecha: ${formatDate(review.date)}`,
    `Canal: ${LABELS.reviewChannel[review.channel]}`,
    `País: ${LABELS.country[review.country]}`,
    `Autor: ${review.author}`,
    `Valoración: ${review.stars} de 5 estrellas`,
    ...(review.title ? [`Título: ${review.title}`] : []),
    '',
    'Texto:',
    review.text,
    '',
    ...customerLines({ customer, pets }),
    ...(review.reply ? ['', 'Respuesta publicada:', review.reply] : []),
  ].join('\n')
}
