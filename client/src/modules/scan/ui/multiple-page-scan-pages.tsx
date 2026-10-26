import { Link } from 'react-router-dom'
import { statusLabels } from '@constants/scan'
import type { TMultiplePageScanPage } from '@typings/scan'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/table'

type MultiplePageScanPagesProps = {
  pages: TMultiplePageScanPage[]
  worstFirst: boolean
}

const byScoreAscending = (
  first: TMultiplePageScanPage,
  second: TMultiplePageScanPage
) =>
  (first.scores.overall ?? Number.POSITIVE_INFINITY) -
  (second.scores.overall ?? Number.POSITIVE_INFINITY)

export const MultiplePageScanPages: React.FC<MultiplePageScanPagesProps> = ({
  pages,
  worstFirst,
}) => {
  const ordered = worstFirst ? [...pages].sort(byScoreAscending) : pages

  return (
    <section aria-labelledby='pages-heading' className='grid gap-3'>
      <h2 id='pages-heading' className='text-xl font-semibold'>
        Scanned pages
      </h2>
      {pages.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          Pages appear here as soon as each one is scanned.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Findings</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.map((page) => (
              <TableRow key={page.id}>
                <TableCell className='max-w-xs'>
                  <Link
                    to={`/u/scans/${page.id}`}
                    className='block truncate font-medium underline-offset-4 hover:underline'
                  >
                    <span className='sr-only'>Open report for </span>
                    {page.route}
                  </Link>
                  {page.pageTitle && (
                    <span className='block truncate text-xs text-muted-foreground'>
                      {page.pageTitle}
                    </span>
                  )}
                </TableCell>
                <TableCell>{page.scores.overall ?? '—'}</TableCell>
                <TableCell>{page.counts.findings}</TableCell>
                <TableCell className='text-muted-foreground'>
                  {statusLabels[page.status]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
