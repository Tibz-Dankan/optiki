export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`
  const seconds = Math.round(ms / 1000)
  const minutes = `${Math.floor(seconds / 60)} min`
  return seconds % 60 === 0 ? minutes : `${minutes} ${seconds % 60} s`
}
