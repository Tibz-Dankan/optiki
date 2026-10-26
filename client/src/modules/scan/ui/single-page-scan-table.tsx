import { Link } from 'react-router-dom'
import { scanSources, statusLabels } from '@constants/scan'
import type { TScanSummary } from '@typings/scan'
import { cn } from '@utils/classname'
import { describeScanHeading } from '@utils/describe-scan-heading'
import { describeScanTarget } from '@utils/describe-scan-target'
import { formatDateTime } from '@utils/format-date-time'
import { formatRelativeTime } from '@utils/format-relative-time'
import { getScoreTone } from '@utils/get-score-tone'
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

const headClassName =
  'h-10 bg-card px-3 text-xs text-muted-foreground first:ps-4'
const cellClassName = 'px-3 py-3 first:ps-4'

const summarizeFindings = (
  scan: TScanSummary
): { text: string; detail?: string; tone?: string } => {
  if (scan.status === 'RUNNING') return { text: 'Scanning…' }
  if (scan.status === 'FAILED') return { text: '—' }

  const { findings, critical, serious } = scan.counts
  if (findings === 0) return { text: 'No findings' }
  const severe = [
    critical > 0 && `${critical} critical`,
    serious > 0 && `${serious} serious`,
  ].filter(Boolean)
  return {
    text: `${findings} ${findings === 1 ? 'finding' : 'findings'}`,
    detail: severe.length > 0 ? severe.join(' · ') : 'Moderate or minor only',
    tone:
      critical > 0
        ? 'text-destructive'
        : serious > 0
          ? 'text-foreground dark:text-warning'
          : 'text-muted-foreground',
  }
}

type SinglePageScanTableProps = {
  scans: TScanSummary[]
}

export const SinglePageScanTable: React.FC<SinglePageScanTableProps> = ({
  scans,
}) => {
  return (
    <div className='overflow-hidden rounded-lg border border-border'>
      <Table className='min-w-240 table-fixed'>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead className={headClassName}>Page</TableHead>
            <TableHead className={cn(headClassName, 'w-28')}>Score</TableHead>
            <TableHead className={cn(headClassName, 'w-[15%]')}>
              Findings
            </TableHead>
            <TableHead className={cn(headClassName, 'w-32')}>Source</TableHead>
            <TableHead className={cn(headClassName, 'w-[17%]')}>
              Status
            </TableHead>
            <TableHead className={cn(headClassName, 'w-34')}>Created</TableHead>
            <TableHead className={cn(headClassName, 'w-14')}>
              <span className='sr-only'>Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scans.map((scan) => {
            const { title, subtitle } = describeScanHeading(scan)
            const score = scan.scores.overall
            const findings = summarizeFindings(scan)
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
                  {score === null ? (
                    <span className='text-muted-foreground'>—</span>
                  ) : (
                    <div
                      className={cn(
                        'flex items-center gap-2.5',
                        getScoreTone(score)
                      )}
                    >
                      <span className='min-w-5.5 font-semibold tabular-nums'>
                        {score}
                      </span>
                      <span
                        aria-hidden
                        className='h-1 w-13 overflow-hidden rounded-full bg-muted'
                      >
                        <span
                          className='block h-full rounded-full bg-current'
                          style={{ width: `${Math.max(score, 2)}%` }}
                        />
                      </span>
                    </div>
                  )}
                </TableCell>
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
