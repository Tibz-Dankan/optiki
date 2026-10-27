import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'
import {
  multiplePageScanStatusLabels,
  scanSources,
  statusLabels,
} from '@constants/scan'
import type { TScanListItem } from '@typings/scan'
import { cn } from '@utils/classname'
import { describeMultiplePageScan } from '@utils/describe-multiple-page-scan'
import { describeScanHeading } from '@utils/describe-scan-heading'
import { describeScanTarget } from '@utils/describe-scan-target'
import { formatAddress } from '@utils/format-address'
import { formatDateTime } from '@utils/format-date-time'
import { formatRelativeTime } from '@utils/format-relative-time'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'
import { summarizeFindings } from '@utils/summarize-findings'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/table'
import { MultiplePageScanActions } from '@modules/scan/ui/multiple-page-scan-actions'
import { ScanInputTypeIcon } from '@modules/scan/ui/scan-input-type-icon'
import { ScanOwnerActions } from '@modules/scan/ui/scan-owner-actions'
import { ScanStatusBadge } from '@modules/scan/ui/scan-status-badge'
import { ScoreMeter } from '@modules/scan/ui/score-meter'

const headClassName =
  'h-10 bg-card px-3 text-xs text-muted-foreground first:ps-4'
const cellClassName = 'px-3 py-3 first:ps-4'

const describeRow = (scan: TScanListItem) => {
  if (scan.multiplePageScan) {
    return {
      href: `/u/scans/multiple/${scan.id}`,
      title: scan.title || formatAddress(scan.target.startURL),
      subtitle: scan.target.origin ?? scan.target.startURL,
      score: isMultiplePageScanActive(scan) ? null : scan.scores.overall,
      statusLabel: multiplePageScanStatusLabels[scan.status],
    }
  }
  return {
    href: `/u/scans/${scan.id}`,
    ...describeScanHeading(scan),
    score: scan.scores.overall,
    statusLabel: statusLabels[scan.status],
  }
}

type ScanTableProps = {
  scans: TScanListItem[]
  isCompact?: boolean
  hasTypeColumn?: boolean
}

export const ScanTable: React.FC<ScanTableProps> = ({
  scans,
  isCompact,
  hasTypeColumn,
}) => {
  const minWidth = !isCompact
    ? 'min-w-240'
    : hasTypeColumn
      ? 'min-w-178'
      : 'min-w-150'

  return (
    <div className='overflow-hidden rounded-lg border border-border'>
      <Table className={cn('table-fixed', minWidth)}>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead className={headClassName}>Page</TableHead>
            {hasTypeColumn && (
              <TableHead className={cn(headClassName, 'w-28')}>Type</TableHead>
            )}
            <TableHead className={cn(headClassName, 'w-28')}>Score</TableHead>
            {!isCompact && (
              <TableHead className={cn(headClassName, 'w-[15%]')}>
                Findings
              </TableHead>
            )}
            <TableHead className={cn(headClassName, 'w-32')}>Source</TableHead>
            {!isCompact && (
              <TableHead className={cn(headClassName, 'w-[17%]')}>
                Status
              </TableHead>
            )}
            <TableHead className={cn(headClassName, 'w-34')}>Created</TableHead>
            <TableHead className={cn(headClassName, 'w-14')}>
              <span className='sr-only'>Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scans.map((scan) => {
            const { href, title, subtitle, score, statusLabel } =
              describeRow(scan)
            const findings = summarizeFindings(scan.status, scan.counts)
            const source = scanSources[scan.triggeredBy]
            const SourceIcon = source.icon
            return (
              <TableRow key={scan.id}>
                <TableCell className={cellClassName}>
                  <div className='flex min-w-0 items-center gap-3'>
                    {scan.multiplePageScan ? (
                      <span
                        aria-hidden
                        className='flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'
                      >
                        <Layers className='size-4' />
                      </span>
                    ) : (
                      <ScanInputTypeIcon inputType={scan.inputType} />
                    )}
                    <div className='grid min-w-0 gap-0.5'>
                      <Link
                        to={href}
                        className='truncate font-medium underline-offset-4 hover:underline'
                      >
                        {scan.multiplePageScan && (
                          <span className='sr-only'>Multi-page scan of </span>
                        )}
                        {title}
                      </Link>
                      {subtitle && (
                        <span className='truncate text-xs text-muted-foreground'>
                          {subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                {hasTypeColumn && (
                  <TableCell className={cellClassName}>
                    {scan.multiplePageScan ? 'Multi-page' : 'Single-page'}
                  </TableCell>
                )}
                <TableCell className={cellClassName}>
                  <ScoreMeter score={score} />
                </TableCell>
                {!isCompact && (
                  <TableCell className={cellClassName}>
                    <div className='grid min-w-0 gap-0.5'>
                      <span className='truncate'>{findings.text}</span>
                      {findings.detail && (
                        <span className={cn('truncate text-xs', findings.tone)}>
                          {findings.detail}
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell className={cellClassName}>
                  <div className='flex items-center gap-2'>
                    <SourceIcon
                      className='size-4 shrink-0 text-muted-foreground'
                      aria-hidden
                    />
                    <div className='grid gap-0.5'>
                      <span>{source.label}</span>
                      <span className='text-xs text-muted-foreground'>
                        {scan.mode === 'RENDERED' ? 'Rendered' : 'Static'}
                      </span>
                    </div>
                  </div>
                </TableCell>
                {!isCompact && (
                  <TableCell className={cellClassName}>
                    <div className='flex min-w-0 flex-col items-start gap-1'>
                      <ScanStatusBadge
                        status={scan.status}
                        label={statusLabel}
                      />
                      {scan.error && (
                        <span
                          title={scan.error.message}
                          className='max-w-full truncate text-xs text-muted-foreground'
                        >
                          {scan.error.message}
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell className={cellClassName}>
                  <time
                    dateTime={scan.createdAt}
                    title={formatDateTime(scan.createdAt)}
                    className='text-muted-foreground'
                  >
                    {formatRelativeTime(scan.createdAt)}
                  </time>
                </TableCell>
                <TableCell className={cn(cellClassName, 'text-right')}>
                  {scan.multiplePageScan ? (
                    <MultiplePageScanActions
                      scan={scan}
                      label={`Actions for multiple-page scan of ${describeMultiplePageScan(scan)}`}
                      variant='ghost'
                    />
                  ) : (
                    <ScanOwnerActions
                      scan={scan}
                      label={`Actions for scan of ${describeScanTarget(scan)}`}
                      variant='ghost'
                    />
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
