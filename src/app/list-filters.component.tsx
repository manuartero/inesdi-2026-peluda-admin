import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { countryWithFlag } from '@/data/model.labels.ts'
import { COUNTRIES } from '@/data/model.types.ts'
import type { Country } from '@/data/model.types.ts'
import { countryFromParam } from './list-filters.params.ts'

const ALL = 'all'

type FilterOption = { value: string; label: string }

// One button per option plus «all» first. `onChange` gets the raw value: the page turns it back into a filter.
export function FilterGroup(input: { value: string | undefined; allLabel: string; options: FilterOption[]; onChange: (value: string) => void }) {
  const { value, allLabel, options, onChange } = input
  return (
    <ToggleGroup type="single" variant="outline" size="sm" value={value ?? ALL} onValueChange={onChange}>
      <ToggleGroupItem value={ALL}>{allLabel}</ToggleGroupItem>
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

// countOf(undefined) is the count for «Todos los países», with the page's other filters applied.
export function CountryFilter(input: { country: Country | undefined; countOf: (country: Country | undefined) => number; onChange: (country: Country | undefined) => void }) {
  const { country, countOf, onChange } = input
  return (
    <FilterGroup
      value={country}
      allLabel={`Todos los países · ${countOf(undefined)}`}
      options={COUNTRIES.map((code) => ({ value: code, label: `${countryWithFlag(code)} · ${countOf(code)}` }))}
      onChange={(value) => onChange(countryFromParam(value))}
    />
  )
}
