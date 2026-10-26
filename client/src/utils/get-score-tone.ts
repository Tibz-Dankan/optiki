export function getScoreTone(score: number): string {
  if (score >= 90) return 'text-success'
  if (score >= 70) return 'text-info'
  if (score >= 50) return 'text-warning'
  return 'text-destructive'
}
