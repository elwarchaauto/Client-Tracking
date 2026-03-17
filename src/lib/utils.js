export const CURRENCIES = [
  { value: 'DZD', label: 'DZD — Dinar algérien', symbol: 'DA' },
  { value: 'EUR', label: 'EUR — Euro',            symbol: '€'  },
  { value: 'USD', label: 'USD — Dollar US',       symbol: '$'  },
]

export function fmt(amount, currency = 'DZD') {
  if (amount == null) return '—'
  const sym = CURRENCIES.find(c => c.value === currency)?.symbol || currency
  const n = Number(amount).toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency === 'EUR' ? `${n} ${sym}` : `${sym} ${n}`
}

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function initials(name = '') {
  return name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}