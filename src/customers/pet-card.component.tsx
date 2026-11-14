import { Field } from '@/app/field.component.tsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatAge } from '@/data/model.dates.ts'
import { LABELS } from '@/data/model.labels.ts'
import type { Pet } from '@/data/model.types.ts'
import { PetName } from './pet-icon.component.tsx'

export function PetCard({ pet }: { pet: Pet }) {
  const allergies = pet.allergies.length > 0 ? pet.allergies.join(', ') : 'Ninguna conocida'
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <PetName species={pet.species} name={pet.name} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-1.5">
          <Field label="Especie">{LABELS.species[pet.species]}</Field>
          <Field label="Raza">{pet.breed}</Field>
          <Field label="Edad">{formatAge(pet.birthDate)}</Field>
          <Field label="Peso">{pet.weightKg.toLocaleString('es-ES')} kg</Field>
          <Field label="Actividad">{LABELS.petActivity[pet.activity]}</Field>
          <Field label="Alergias">{allergies}</Field>
        </dl>
      </CardContent>
    </Card>
  )
}
