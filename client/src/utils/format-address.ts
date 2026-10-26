export function formatAddress(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}
