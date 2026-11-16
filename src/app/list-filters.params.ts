import { useSearchParams } from 'react-router'
import { COUNTRIES } from '@/data/model.types.ts'

// The filters of a list live in the URL (`/tickets?country=MX&age=0`), so a filtered view survives a reload and can be shared.

export const countryFromParam = (param: string | null) => COUNTRIES.find((country) => country === param)

// setParam({ key: 'age', value: 0 }) keeps `age=0`; an undefined or empty value removes the key.
export function useListParams<Key extends string>() {
  const [searchParams, setSearchParams] = useSearchParams()
  const setParam = ({ key, value }: { key: Key; value: string | number | undefined }) => {
    const next = new URLSearchParams(searchParams)
    if (value === undefined || value === '') {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }
    setSearchParams(next, { replace: true })
  }
  return { searchParams, setParam }
}

// withQuery({ path: '/tickets', params }) is '/tickets?country=MX', or '/tickets' when no filter is on.
export function withQuery({ path, params }: { path: string; params: URLSearchParams }) {
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

/**
 * Previous / next on a detail page walk the list it was opened from: with ?country=MX, «siguiente» is the next Mexican ticket.
 * - The links keep the filters, and «back» returns to the filtered list.
 * - An item the filters leave out (a link from elsewhere) walks the whole list instead.
 */
export function useListSteps<T>(input: { item: T; all: T[]; filter: (params: URLSearchParams) => T[]; listPath: string; pathOf: (item: T) => string }) {
  const { item, all, filter, listPath, pathOf } = input
  const [searchParams] = useSearchParams()
  const filtered = filter(searchParams)
  const isInFiltered = filtered.includes(item)
  const list = isInFiltered ? filtered : all
  const params = isInFiltered ? searchParams : new URLSearchParams()
  const index = list.indexOf(item)
  const stepTo = (other: T | undefined) => other && withQuery({ path: pathOf(other), params })
  return {
    position: index + 1,
    total: list.length,
    previous: stepTo(list[index - 1]),
    next: stepTo(list[index + 1]),
    back: withQuery({ path: listPath, params }),
  }
}
