import { Link } from 'react-router-dom'
import { Clock, ExternalLink, Layers, Lock, ScanSearch } from 'lucide-react'
import { multiplePageScanStatusLabels, scanSources } from '@constants/scan'
import type { TMultiplePageScanSummary } from '@typings/scan'
import { describeMultiplePageScan } from '@utils/describe-multiple-page-scan'
import { formatAddress } from '@utils/format-address'
import { formatDateTime } from '@utils/format-date-time'
import { formatDuration } from '@utils/format-duration'
import { formatRelativeTime } from '@utils/format-relative-time'
import { Badge } from '@shared/ui/badge'
import { Button } from '@shared/ui/button'
import { MultiplePageScanActions } from '@modules/scan/ui/multiple-page-scan-actions'
import { ScanStatusBadge } from '@modules/scan/ui/scan-status-badge'

const Dot: React.FC = () => (
  <span aria-hidden className='text-muted-foreground/60'>
    ·
  </span>
)

const describeTiming = (scan: TMultiplePageScanSummary) => {
  switch (scan.status) {
    case 'QUEUED':
      return { verb: 'Queued', at: scan.createdAt }
    case 'RUNNING':
      return { verb: 'Started', at: scan.timing.startedAt ?? scan.createdAt }
    default:
      return {
        verb: 'Scanned',
        at: scan.createdAt,
        duration: scan.timing.durationMs,
      }
  }
}

type MultiplePageScanHeaderProps = {
  scan: TMultiplePageScanSummary
}

export const MultiplePageScanHeader: React.FC<MultiplePageScanHeaderProps> = ({
  scan,
}) => {
  const source = scanSources[scan.triggeredBy]
  const SourceIcon = source.icon
  const timing = describeTiming(scan)

  return (
    <div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-4'>
      <div className='flex min-w-0 flex-[1_1_480px] items-start gap-4'>
        <span
          aria-hidden
          className='flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary'
        >
          <Layers className='size-5.5' />
        </span>
        <div className='grid min-w-0 gap-1.5'>
          <h1 className='text-[28px] leading-tight font-bold tracking-tight wrap-anywhere'>
            {formatAddress(describeMultiplePageScan(scan))}
          </h1>
          <a
            href={scan.target.startURL}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1.5 justify-self-start text-sm break-all text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
          >
            {formatAddress(scan.target.startURL)}
            <ExternalLink className='size-3.25 shrink-0' aria-hidden />
            <span className='sr-only'> (opens in a new tab)</span>
          </a>
          <div className='mt-1 flex flex-wrap items-center gap-2'>
            <ScanStatusBadge
              status={scan.status}
              label={multiplePageScanStatusLabels[scan.status]}
            />
            <Badge variant='secondary' className='rounded-lg'>
              {scan.mode === 'RENDERED' ? 'Rendered' : 'Static'}
            </Badge>
            <Badge variant='secondary' className='rounded-lg'>
              {scan.ruleSet === 'FULL' ? 'All 17 rules' : '9 core rules'}
            </Badge>
            <Badge variant='outline' className='rounded-lg'>
              <Lock aria-hidden />
              Private
            </Badge>
            <Dot />
            <span className='inline-flex items-center gap-1.5 text-[13px] text-muted-foreground'>
              <SourceIcon className='size-3.5' aria-hidden />
              {source.label}
            </span>
            <Dot />
            <span className='inline-flex items-center gap-1.5 text-[13px] text-muted-foreground'>
              <Clock className='size-3.5' aria-hidden />
              <span>
                {timing.verb}{' '}
                <time dateTime={timing.at} title={formatDateTime(timing.at)}>
                  {formatRelativeTime(timing.at)}
                </time>
                {!!timing.duration &&
                  ` · took ${formatDuration(timing.duration)}`}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <Button asChild variant='outline'>
          <Link to='/u/scan'>
            <ScanSearch aria-hidden />
            Scan another page
          </Link>
        </Button>
        <MultiplePageScanActions
          scan={scan}
          label='Multiple-page scan actions'
          redirectTo='/u/scans'
        />
      </div>
    </div>
  )
}
