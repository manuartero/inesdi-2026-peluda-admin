import type { Currency } from './model.types.ts'

// formatMoney({ amount: 51.75, currency: 'EUR' }) is '51,75 €'; formatMoney({ amount: 48300, currency: 'ARS' }) is '48.300 $'.
export function formatMoney({ amount, currency }: { amount: number; currency: Currency }) {
  const decimals = Number.isInteger(amount) ? 0 : 2
  return amount.toLocaleString('es-ES', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  })
}
