import { Link } from 'react-router-dom'
import { Dumbbell, FileCode, Globe } from 'lucide-react'
import type { TRecentScan, TScanInputType } from '@typings/scan'
import { cn } from '@utils/classname'
import { formatDateTime } from '@utils/format-date-time'
import { getScoreTone } from '@utils/get-score-tone'

const inputTypeIcons: Record<TScanInputType, React.ElementType> = {
  URL: Globe,
  GYM: Dumbbell,
  HTML: FileCode,
}

type RecentScanListProps = {
  scans: TRecentScan[]
  reportPath: string
  renderActions?: (scan: TRecentScan) => React.ReactNode
}

export const RecentScanList: React.FC<RecentScanListProps> = ({
  scans,
  reportPath,
  renderActions,
}) => {
  return (
    <ul className='divide-y divide-border overflow-hidden rounded-lg border border-border bg-card'>
      {scans.map((scan) => {
        const Icon = inputTypeIcons[scan.inputType ?? 'URL']
        const score = scan.overallScore
        return (
          <li key={scan.id} className='flex items-center gap-3 px-4 py-3'>
            <span
              aria-hidden
              className='flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'
            >
              <Icon className='size-4' />
            </span>
            <div className='min-w-0 flex-1'>
              <Link
                to={`${reportPath}/${scan.id}`}
                className='block truncate text-sm font-medium underline-offset-4 hover:underline'
              >
                {scan.title ?? scan.target}
              </Link>
              <p className='truncate text-xs text-muted-foreground'>
                {[scan.subtitle, formatDateTime(scan.createdAt)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <span className='inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground'>
              <span
                aria-hidden
                className={cn(
                  'size-1.5 rounded-full bg-current',
                  score !== null && getScoreTone(score)
                )}
              />
              Score
              <span
                className={cn(
                  'font-semibold',
                  score !== null && getScoreTone(score)
                )}
              >
                {score ?? '—'}
              </span>
            </span>
            {renderActions && (
              <div className='shrink-0'>{renderActions(scan)}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
