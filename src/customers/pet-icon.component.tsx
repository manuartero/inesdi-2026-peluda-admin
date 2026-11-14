import { Cat, Dog } from 'lucide-react'
import { LABELS } from '@/data/model.labels.ts'
import type { Species } from '@/data/model.types.ts'

const SPECIES_ICONS = { dog: Dog, cat: Cat } satisfies Record<Species, unknown>

// A flat round chip with the species drawn in it, next to a pet's name.
export function PetIcon({ species }: { species: Species }) {
  const Icon = SPECIES_ICONS[species]
  return (
    <span
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-ledge"
      title={LABELS.species[species]}
    >
      <Icon className="size-4" strokeWidth={2.25} aria-label={LABELS.species[species]} />
    </span>
  )
}

// The pet's name with its species chip: `🐶 Bruno`.
export function PetName({ species, name }: { species: Species; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <PetIcon species={species} />
      {name}
    </span>
  )
}
