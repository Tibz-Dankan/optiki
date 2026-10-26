import type { TMultiplePageScanSummary } from '@typings/scan'
import { cn } from '@utils/classname'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'

type MultiplePageScanProgressProps = {
  scan: TMultiplePageScanSummary
}

const describeProgress = (scan: TMultiplePageScanSummary) => {
  const { pagesScanned, pagesDiscovered, pagesSkipped } = scan.progress
  const pages = pagesScanned === 1 ? 'page' : 'pages'
  switch (scan.status) {
    case 'QUEUED':
      return 'Waiting for a free scanner…'
    case 'RUNNING':
      return `Scanning… ${pagesScanned} of up to ${scan.maxPages} pages done, ${pagesDiscovered} found so far.`
    case 'COMPLETED':
      return `Scanned ${pagesScanned} ${pages} of ${pagesDiscovered} found. ${pagesSkipped} not scanned.`
    case 'FAILED':
      return `Stopped after ${pagesScanned} ${pages}.`
  }
}

const Stat: React.FC<{
  label: string
  value: number
  swatch?: string
}> = ({ label, value, swatch }) => (
  <div className='flex flex-col-reverse gap-0.5'>
    <dt className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
      {swatch && (
        <span aria-hidden className={cn('size-2 rounded-xs', swatch)} />
      )}
      {label}
    </dt>
    <dd className='text-[22px] font-semibold'>{value}</dd>
  </div>
)

export const MultiplePageScanProgress: React.FC<
  MultiplePageScanProgressProps
> = ({ scan }) => {
  const { pagesScanned, pagesDiscovered, pagesSkipped, limitReached } =
    scan.progress
  const total = isMultiplePageScanActive(scan)
    ? scan.maxPages
    : Math.max(pagesDiscovered, pagesScanned + pagesSkipped, 1)
  const notReached = Math.max(pagesDiscovered - pagesScanned - pagesSkipped, 0)

  return (
    <section
      aria-labelledby='progress-heading'
      className='flex flex-wrap items-center gap-x-8 gap-y-3.5 rounded-lg border border-border bg-card px-5 py-4'
    >
      <div className='grid min-w-0 flex-[1_1_360px] gap-2.5'>
        <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
          <h2 id='progress-heading' className='text-sm font-semibold'>
            Progress
          </h2>
          <p role='status' className='text-sm text-muted-foreground'>
            {describeProgress(scan)}
          </p>
        </div>
        <div
          aria-hidden='true'
          className='flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted'
        >
          <div
            className='bg-primary transition-[width]'
            style={{ width: `${Math.min(pagesScanned / total, 1) * 100}%` }}
          />
          <div
            className='bg-muted-foreground/50 transition-[width]'
            style={{ width: `${Math.min(pagesSkipped / total, 1) * 100}%` }}
          />
        </div>
        <p className='text-xs text-muted-foreground'>
          A multiple-page scan follows same-site links and stops at{' '}
          {scan.maxPages} pages.
        </p>
      </div>
      <dl className='flex flex-wrap gap-x-7 gap-y-2'>
        <Stat label='Scanned' value={pagesScanned} swatch='bg-primary' />
        <Stat
          label='Not scanned'
          value={pagesSkipped}
          swatch='bg-muted-foreground/50'
        />
        <Stat label='Found' value={pagesDiscovered} />
      </dl>
      {scan.status === 'FAILED' && scan.error && (
        <p
          role='alert'
          className='basis-full rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'
        >
          This scan failed: {scan.error.message}
        </p>
      )}
      {scan.status === 'COMPLETED' && limitReached && notReached > 0 && (
        <p className='basis-full text-sm text-muted-foreground'>
          {notReached} more {notReached === 1 ? 'page was' : 'pages were'} found
          but not scanned: a multiple-page scan stops at {scan.maxPages} pages.
        </p>
      )}
    </section>
  )
}
