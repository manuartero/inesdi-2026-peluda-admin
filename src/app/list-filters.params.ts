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
