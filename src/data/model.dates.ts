import { REFERENCE_DATE } from './model.types.ts'
import type { Country, IsoDate } from './model.types.ts'

// UTC offsets in late November 2026: Spain is on CET; Mexico, Colombia, Peru and Argentina have no daylight saving time.
export const UTC_OFFSET_HOURS: Record<Country, number> = { ES: 1, MX: -6, CO: -5, PE: -5, AR: -3 }

const HOUR_MS = 60 * 60 * 1000

// Dates in the data are wall-clock times without a zone. Treating them as UTC keeps the browser's own zone out of it.
function wallClock(iso: IsoDate) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : `${iso}Z`)
}

function formatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-ES', { ...options, timeZone: 'UTC' })
}

const DATE = formatter({ day: '2-digit', month: '2-digit', year: 'numeric' })
const TIME = formatter({ hour: '2-digit', minute: '2-digit' })
const LONG_DATE = formatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const formatDate = (iso: IsoDate) => DATE.format(wallClock(iso))
export const formatTime = (iso: IsoDate) => TIME.format(wallClock(iso))
export const formatLongDate = (iso: IsoDate) => LONG_DATE.format(wallClock(iso))

// madridTime({ local: '2026-11-24T08:10:00', country: 'MX' }) is '2026-11-24T15:10:00'.
export function madridTime({ local, country }: { local: IsoDate; country: Country }) {
  const shiftHours = UTC_OFFSET_HOURS.ES - UTC_OFFSET_HOURS[country]
  const madrid = new Date(wallClock(local).getTime() + shiftHours * HOUR_MS)
  return madrid.toISOString().slice(0, 19)
}

export const isOnReferenceDate = (iso: IsoDate) => iso.startsWith(REFERENCE_DATE)

function ageInMonths(birthDate: IsoDate) {
  const birth = wallClock(birthDate)
  const today = wallClock(REFERENCE_DATE)
  const months = (today.getUTCFullYear() - birth.getUTCFullYear()) * 12 + today.getUTCMonth() - birth.getUTCMonth()
  const monthPending = today.getUTCDate() < birth.getUTCDate()
  return monthPending ? months - 1 : months
}

// formatAge('2020-04-10') is '6 años'; formatAge('2026-04-15') is '7 meses'.
export function formatAge(birthDate: IsoDate) {
  const months = ageInMonths(birthDate)
  if (months < 12) {
    return months === 1 ? '1 mes' : `${months} meses`
  }
  const years = Math.floor(months / 12)
  return years === 1 ? '1 año' : `${years} años`
}

const DAY_MS = 24 * HOUR_MS

// daysFromReference('2026-12-31') is 37; a past date is negative.
export const daysFromReference = (iso: IsoDate) => Math.round((wallClock(iso).getTime() - wallClock(REFERENCE_DATE).getTime()) / DAY_MS)
