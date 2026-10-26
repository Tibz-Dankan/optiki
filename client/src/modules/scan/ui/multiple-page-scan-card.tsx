import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { multiplePageScanStatusLabels } from '@constants/scan'
import type { TMultiplePageScanSummary } from '@typings/scan'
import { cn } from '@utils/classname'
import { describeMultiplePageScan } from '@utils/describe-multiple-page-scan'
import { formatAddress } from '@utils/format-address'
import { formatDateTime } from '@utils/format-date-time'
import { formatRelativeTime } from '@utils/format-relative-time'
import { getScoreTone } from '@utils/get-score-tone'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'
import { MultiplePageScanActions } from '@modules/scan/ui/multiple-page-scan-actions'
import { ScanStatusBadge } from '@modules/scan/ui/scan-status-badge'

const countPages = (count: number) =>
  `${count} ${count === 1 ? 'page' : 'pages'}`

type MultiplePageScanCardProps = {
  scan: TMultiplePageScanSummary
}

export const MultiplePageScanCard: React.FC<MultiplePageScanCardProps> = ({
  scan,
}) => {
  const isActive = isMultiplePageScanActive(scan)
  const { pagesDiscovered, pagesScanned, pagesSkipped, limitReached } =
    scan.progress
  const pagesToScan = Math.min(pagesDiscovered, scan.maxPages)
  const title = scan.title || formatAddress(scan.target.startURL)
  const score = isActive ? null : scan.scores.overall
  const findings = scan.counts.findings

  const pagesText = !isActive
    ? `${countPages(pagesScanned)} scanned${limitReached ? ' · limit reached' : ''}`
    : pagesToScan === 0
      ? 'Finding pages…'
      : `${pagesScanned} of ${countPages(pagesToScan)} scanned`
  const progress = !isActive
    ? 100
    : pagesToScan === 0
      ? 0
      : Math.min(((pagesScanned + pagesSkipped) / pagesToScan) * 100, 100)

  return (
    <article
      aria-label={`Multiple-page scan of ${title}`}
      className='flex flex-col gap-3.5 rounded-lg border border-border bg-card p-4'
    >
      <div className='flex items-start gap-3'>
        <span
          aria-hidden
          className='flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-primary'
        >
          <Layers className='size-4.5' />
        </span>
        <div className='grid min-w-0 flex-1 gap-0.5'>
          <Link
            to={`/u/scans/multiple/${scan.id}`}
            className='truncate text-[15px] font-semibold underline-offset-4 hover:underline'
          >
            <span className='sr-only'>Open multiple-page scan of </span>
            {title}
          </Link>
          <span className='truncate text-xs text-muted-foreground'>
            {scan.target.origin ?? scan.target.startURL}
          </span>
        </div>
        <MultiplePageScanActions
          scan={scan}
          label={`Actions for multiple-page scan of ${describeMultiplePageScan(scan)}`}
          variant='ghost'
        />
      </div>

      <div className='grid gap-2'>
        <div className='flex items-center justify-between gap-3'>
          <span className='text-[13px] text-muted-foreground'>{pagesText}</span>
          <ScanStatusBadge
            status={scan.status}
            label={multiplePageScanStatusLabels[scan.status]}
          />
        </div>
        <div
          aria-hidden
          className='h-1.5 overflow-hidden rounded-full bg-muted'
        >
          <div
            className='h-full rounded-full bg-primary transition-[width]'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className='flex items-center justify-between gap-3 border-t border-border pt-3 text-[13px]'>
        <span className='flex items-center gap-3'>
          <span>
            <span className='text-muted-foreground'>Score </span>
            <span
              className={cn(
                'font-semibold',
                score === null ? 'text-muted-foreground' : getScoreTone(score)
              )}
            >
              {score ?? '—'}
            </span>
          </span>
          <span className='text-muted-foreground'>
            {findings} {findings === 1 ? 'finding' : 'findings'}
            {isActive && ' so far'}
          </span>
        </span>
        <time
          dateTime={scan.createdAt}
          title={formatDateTime(scan.createdAt)}
          className='whitespace-nowrap text-muted-foreground'
        >
          {formatRelativeTime(scan.createdAt)}
        </time>
      </div>
    </article>
  )
}
