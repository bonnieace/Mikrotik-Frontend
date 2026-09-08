import type { Payment } from '../../shared/types.ts'
const day = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Nairobi',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
export function todayEarnings(
  payments: Payment[] | null,
  service: 'hotspot' | 'pppoe',
  now = new Date(),
): number | null {
  if (payments === null) return null
  let total = 0
  for (const payment of payments) {
    if (payment.status !== 'completed' || payment.user_type !== service) continue
    const date = new Date(
      /(?:Z|[+-]\d{2}:\d{2})$/i.test(payment.created_at)
        ? payment.created_at
        : payment.created_at + 'Z',
    )
    if (!Number.isFinite(date.getTime())) return null
    if (day.format(date) !== day.format(now)) continue
    const amount = Number(payment.amount)
    if (payment.amount === '' || !Number.isFinite(amount)) return null
    total += amount
  }
  return Math.round(total * 100) / 100
}
export function planDuration(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes === 1440 ? '' : 's'}`
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`
  return `${minutes} minutes`
}

export function eatDateKey(value: string): string {
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : value + 'Z')
  return Number.isFinite(date.getTime()) ? day.format(date) : ''
}
