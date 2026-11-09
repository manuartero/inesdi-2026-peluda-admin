import { rowReader } from './json-row.reader.ts'
import labelsJson from './model.labels.json' with { type: 'json' }
import {
  COUNTRIES,
  PET_ACTIVITIES,
  REVIEW_CHANNELS,
  REVIEW_STATUSES,
  SPECIES,
  TICKET_CHANNELS,
  TICKET_STATUSES,
} from './model.types.ts'

// Every enum value needs its Spanish label: a missing `PE` in `country` fails the build.
function labelsFor<T extends string>({ key, values }: { key: string; values: readonly T[] }) {
  const row = rowReader({ raw: labelsJson, where: 'model.labels.json' }).child(key)
  return Object.fromEntries(values.map((value) => [value, row.text(value)])) as Record<T, string>
}

export const LABELS = {
  country: labelsFor({ key: 'country', values: COUNTRIES }),
  ticketChannel: labelsFor({ key: 'ticketChannel', values: TICKET_CHANNELS }),
  ticketStatus: labelsFor({ key: 'ticketStatus', values: TICKET_STATUSES }),
  species: labelsFor({ key: 'species', values: SPECIES }),
  petActivity: labelsFor({ key: 'petActivity', values: PET_ACTIVITIES }),
  reviewChannel: labelsFor({ key: 'reviewChannel', values: REVIEW_CHANNELS }),
  reviewStatus: labelsFor({ key: 'reviewStatus', values: REVIEW_STATUSES }),
  reviewStatusPlural: labelsFor({ key: 'reviewStatusPlural', values: REVIEW_STATUSES }),
}
