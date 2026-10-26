const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

export function formatRelativeTime(value: string): string {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 45) return 'just now'

  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' })
  for (const [unit, size] of units) {
    const count = Math.floor(seconds / size)
    if (count >= 1) return format.format(-count, unit)
  }
  return format.format(-1, 'minute')
}
