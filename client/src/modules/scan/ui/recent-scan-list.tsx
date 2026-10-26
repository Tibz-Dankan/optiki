import { Link } from 'react-router-dom'
import type { TRecentScan } from '@typings/scan'
import { formatDateTime } from '@utils/format-date-time'

type RecentScanListProps = {
  scans: TRecentScan[]
  reportPath: string
}

export const RecentScanList: React.FC<RecentScanListProps> = ({
  scans,
  reportPath,
}) => {
  return (
    <ul className='grid gap-2'>
      {scans.map((scan) => (
        <li
          key={scan.id}
          className='flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border px-3 py-2 text-sm'
        >
          <Link
            to={`${reportPath}/${scan.id}`}
            className='min-w-0 flex-1 truncate font-medium underline-offset-4 hover:underline'
          >
            Open scan of {scan.target}
          </Link>
          <span>Score {scan.overallScore ?? '—'}</span>
          <span className='text-muted-foreground'>
            {formatDateTime(scan.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  )
}
