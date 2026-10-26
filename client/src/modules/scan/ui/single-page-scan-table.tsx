import { Link } from 'react-router-dom'
import { scanSources, statusLabels } from '@constants/scan'
import type { TScanSummary } from '@typings/scan'
import { cn } from '@utils/classname'
import { describeScanHeading } from '@utils/describe-scan-heading'
import { describeScanTarget } from '@utils/describe-scan-target'
import { formatDateTime } from '@utils/format-date-time'
import { formatRelativeTime } from '@utils/format-relative-time'
import { summarizeFindings } from '@utils/summarize-findings'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/table'
import { ScanInputTypeIcon } from '@modules/scan/ui/scan-input-type-icon'
import { ScanOwnerActions } from '@modules/scan/ui/scan-owner-actions'
import { ScanStatusBadge } from '@modules/scan/ui/scan-status-badge'
import { ScoreMeter } from '@modules/scan/ui/score-meter'

const headClassName =
  'h-10 bg-card px-3 text-xs text-muted-foreground first:ps-4'
const cellClassName = 'px-3 py-3 first:ps-4'

type SinglePageScanTableProps = {
  scans: TScanSummary[]
  isCompact?: boolean
}

export const SinglePageScanTable: React.FC<SinglePageScanTableProps> = ({
  scans,
  isCompact,
}) => {
  return (
    <div className='overflow-hidden rounded-lg border border-border'>
      <Table
        className={cn('table-fixed', isCompact ? 'min-w-150' : 'min-w-240')}
      >
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead className={headClassName}>Page</TableHead>
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
            const { title, subtitle } = describeScanHeading(scan)
            const findings = summarizeFindings(scan.status, scan.counts)
            const source = scanSources[scan.triggeredBy]
            const SourceIcon = source.icon
            return (
              <TableRow key={scan.id}>
                <TableCell className={cellClassName}>
                  <div className='flex min-w-0 items-center gap-3'>
                    <ScanInputTypeIcon inputType={scan.inputType} />
                    <div className='grid min-w-0 gap-0.5'>
                      <Link
                        to={`/u/scans/${scan.id}`}
                        className='truncate font-medium underline-offset-4 hover:underline'
                      >
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
                <TableCell className={cellClassName}>
                  <ScoreMeter score={scan.scores.overall} />
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
                        label={statusLabels[scan.status]}
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
                  <ScanOwnerActions
                    scan={scan}
                    label={`Actions for scan of ${describeScanTarget(scan)}`}
                    variant='ghost'
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
