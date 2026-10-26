import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, FileIcon } from 'lucide-react'
import { statusLabels } from '@constants/scan'
import type { TMultiplePageScanPage, TScanStatus } from '@typings/scan'
import { cn } from '@utils/classname'
import { summarizeFindings } from '@utils/summarize-findings'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/table'
import { ScanFilterGroup } from '@modules/scan/ui/scan-filter-group'
import { ScanStatusBadge } from '@modules/scan/ui/scan-status-badge'
import { ScoreMeter } from '@modules/scan/ui/score-meter'

type TPageFilter = 'ALL' | Exclude<TScanStatus, 'RUNNING'>

const headClassName =
  'h-10 bg-card px-3 text-xs text-muted-foreground first:ps-4'
const cellClassName = 'px-3 py-3 first:ps-4 last:pe-4'

const byScoreAscending = (
  first: TMultiplePageScanPage,
  second: TMultiplePageScanPage
) =>
  (first.scores.overall ?? Number.POSITIVE_INFINITY) -
  (second.scores.overall ?? Number.POSITIVE_INFINITY)

type MultiplePageScanPagesProps = {
  pages: TMultiplePageScanPage[]
  worstFirst: boolean
}

export const MultiplePageScanPages: React.FC<MultiplePageScanPagesProps> = ({
  pages,
  worstFirst,
}) => {
  const [filter, setFilter] = useState<TPageFilter>('ALL')
  const ordered = worstFirst ? [...pages].sort(byScoreAscending) : pages
  const visiblePages = ordered.filter(
    (page) => filter === 'ALL' || page.status === filter
  )

  return (
    <section aria-labelledby='pages-heading' className='grid gap-3.5'>
      <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-3'>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <h2
            id='pages-heading'
            className='flex items-center gap-2 text-base font-semibold'
          >
            <FileIcon className='size-4.5 text-muted-foreground' aria-hidden />
            Scanned pages
            <span className='inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium'>
              {pages.length}
            </span>
          </h2>
          <span className='text-xs text-muted-foreground'>
            {worstFirst ? 'Lowest score first' : 'In scan order'}
          </span>
        </div>
        {pages.length > 0 && (
          <ScanFilterGroup
            id='page-filter-label'
            label='Status'
            value={filter}
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'FAILED', label: 'Failed' },
            ]}
            onChange={(value) => setFilter(value as TPageFilter)}
          />
        )}
      </div>
      {pages.length === 0 ? (
        <p className='rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
          Pages appear here as soon as each one is scanned.
        </p>
      ) : (
        <div className='overflow-hidden rounded-lg border border-border'>
          <Table className='min-w-180 table-fixed'>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead className={cn(headClassName, 'w-[38%]')}>
                  Page
                </TableHead>
                <TableHead className={cn(headClassName, 'w-28')}>
                  Score
                </TableHead>
                <TableHead className={headClassName}>Findings</TableHead>
                <TableHead className={headClassName}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePages.map((page) => {
                const findings = summarizeFindings(page.status, page.counts)
                return (
                  <TableRow key={page.id}>
                    <TableCell className={cellClassName}>
                      <div className='grid min-w-0 gap-0.5'>
                        <Link
                          to={`/u/scans/${page.id}`}
                          className='truncate font-medium underline-offset-4 hover:underline'
                        >
                          <span className='sr-only'>Open report for </span>
                          {page.route}
                        </Link>
                        <span className='truncate text-xs text-muted-foreground'>
                          {page.pageTitle ?? 'No page title'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={cellClassName}>
                      <ScoreMeter score={page.scores.overall} />
                    </TableCell>
                    <TableCell className={cellClassName}>
                      <div className='grid min-w-0 gap-0.5'>
                        <span className='truncate'>{findings.text}</span>
                        {findings.detail && (
                          <span
                            className={cn('truncate text-xs', findings.tone)}
                          >
                            {findings.detail}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={cellClassName}>
                      <div className='flex items-center justify-between gap-3'>
                        <div className='flex min-w-0 flex-col items-start gap-1'>
                          <ScanStatusBadge
                            status={page.status}
                            label={statusLabels[page.status]}
                          />
                          {page.error && (
                            <span
                              title={page.error.message}
                              className='max-w-full truncate text-xs text-muted-foreground'
                            >
                              {page.error.message}
                            </span>
                          )}
                        </div>
                        <ChevronRight
                          className='size-4 shrink-0 text-muted-foreground/60'
                          aria-hidden
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {visiblePages.length === 0 && (
                <TableRow className='hover:bg-transparent'>
                  <TableCell
                    colSpan={4}
                    className='py-8 text-center text-muted-foreground'
                  >
                    No pages match this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
