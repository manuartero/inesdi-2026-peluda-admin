import type { Country, IsoDate, Plan } from '../data/model.types.ts'

// Dogs of 30 kg or more eat more, so their box costs 15 % more: Thor (34 kg) pays 51,75 € for the 45 € Completo.
const LARGE_PET_KG = 30
const LARGE_PET_FACTOR = 1.15

// Argentina reviews prices every quarter for inflation; plan prices are the ones in force since the last rise.
// Martín's ticket (0141) complains about «el segundo [aumento] en el año».
const AR_PRICE_RISES: { from: IsoDate; factor: number }[] = [
  { from: '2026-06-01', factor: 1.12 },
  { from: '2026-09-01', factor: 1.15 },
]

const ROUNDING_STEP: Record<Country, number> = { ES: 0.01, MX: 1, CO: 1000, PE: 1, AR: 100 }

// roundPrice({ amount: 228850, country: 'CO' }) is 229000.
export function roundPrice({ amount, country }: { amount: number; country: Country }) {
  const step = ROUNDING_STEP[country]
  return Math.round(Math.round(amount / step) * step * 100) / 100
}

export function subscriptionPrice({ plan, country, weightKg }: { plan: Plan; country: Country; weightKg: number }) {
  const factor = weightKg >= LARGE_PET_KG ? LARGE_PET_FACTOR : 1
  return roundPrice({ amount: plan.prices[country] * factor, country })
}

// priceOn({ price: 65000, country: 'AR', date: '2026-07-14' }) is 56500: before the September rise.
export function priceOn({ price, country, date }: { price: number; country: Country; date: IsoDate }) {
  if (country !== 'AR') {
    return price
  }
  const laterRises = AR_PRICE_RISES.filter((rise) => date < rise.from)
  const factor = laterRises.reduce((total, rise) => total * rise.factor, 1)
  return roundPrice({ amount: price / factor, country })
}
