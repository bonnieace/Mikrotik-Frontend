export function money(value: string | number, currency = 'KES') { return new Intl.NumberFormat('en-KE', { style: 'currency', currency }).format(Number(value)) }
export function dateTime(value?: string | null) {
  if (!value) return '—'
  // The backend serializes naive UTC datetimes. Do not reinterpret them as local time.
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : value + 'Z')
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' }).format(date)
}
