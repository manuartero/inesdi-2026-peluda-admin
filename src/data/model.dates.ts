import { DAY_MINUTES, DAY_MS, TODAY } from './model.types.ts'
import type { IsoDate } from './model.types.ts'

// Dates in the data are wall-clock times without a zone. Treating them as UTC keeps the browser's own zone out of it.
function wallClock(iso: IsoDate) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : `${iso}Z`)
}

export function utcFormatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-ES', { ...options, timeZone: 'UTC' })
}

const DATE = utcFormatter({ day: '2-digit', month: '2-digit', year: 'numeric' })
const TIME = utcFormatter({ hour: '2-digit', minute: '2-digit' })
const LONG_DATE = utcFormatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const formatDate = (iso: IsoDate) => DATE.format(wallClock(iso))
export const formatTime = (iso: IsoDate) => TIME.format(wallClock(iso))
export const formatLongDate = (iso: IsoDate) => LONG_DATE.format(wallClock(iso))

function ageInMonths(birthDate: IsoDate) {
  const birth = wallClock(birthDate)
  const today = wallClock(TODAY)
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

// daysBetween({ from: '2026-11-16', to: '2026-12-31' }) is 45; an earlier `to` is negative. Times of day are ignored.
const daysBetween = ({ from, to }: { from: IsoDate; to: IsoDate }) =>
  Math.round((wallClock(to.slice(0, 10)).getTime() - wallClock(from.slice(0, 10)).getTime()) / DAY_MS)

// On 2026-11-16, daysFromToday('2026-12-31') is 45.
export const daysFromToday = (iso: IsoDate) => daysBetween({ from: TODAY, to: iso })

const RELATIVE = new Intl.RelativeTimeFormat('es-ES', { numeric: 'always' })

// On 2026-11-16: formatRelativeDay('2026-11-16') is 'hoy', '2026-11-13' 'hace 3 días', '2026-12-31' 'dentro de 45 días',
// '2026-08-10' 'hace 3 meses' and '2023-02-15' 'hace 3 años'.
export function formatRelativeDay(iso: IsoDate) {
  const days = daysFromToday(iso)
  if (days === 0) {
    return 'hoy'
  }
  const months = Math.trunc(days / 30.4)
  if (Math.abs(months) < 2) {
    return RELATIVE.format(days, 'day')
  }
  const years = Math.trunc(days / 365)
  if (Math.abs(years) < 1) {
    return RELATIVE.format(months, 'month')
  }
  return RELATIVE.format(years, 'year')
}

// formatAgo(25) is 'hace 25 minutos', formatAgo(190) 'hace 3 horas', formatAgo(1630) 'hace 1 día'.
export function formatAgo(minutes: number) {
  if (minutes < 60) {
    return RELATIVE.format(-minutes, 'minute')
  }
  if (minutes < DAY_MINUTES) {
    return RELATIVE.format(-Math.floor(minutes / 60), 'hour')
  }
  return RELATIVE.format(-Math.floor(minutes / DAY_MINUTES), 'day')
}
