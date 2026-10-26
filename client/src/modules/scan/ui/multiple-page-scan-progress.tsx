import type { TMultiplePageScanSummary } from '@typings/scan'

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

export const MultiplePageScanProgress: React.FC<
  MultiplePageScanProgressProps
> = ({ scan }) => {
  const { pagesScanned, pagesDiscovered, pagesSkipped, limitReached } =
    scan.progress
  const percent =
    scan.status === 'COMPLETED'
      ? 100
      : Math.round((pagesScanned / scan.maxPages) * 100)
  const notReached = Math.max(pagesDiscovered - pagesScanned - pagesSkipped, 0)

  return (
    <section
      aria-labelledby='progress-heading'
      className='grid gap-3 rounded-lg border border-border p-4'
    >
      <h2 id='progress-heading' className='font-semibold'>
        Progress
      </h2>
      <p role='status' className='text-sm'>
        {describeProgress(scan)}
      </p>
      <div
        aria-hidden='true'
        className='h-2 overflow-hidden rounded-full bg-muted'
      >
        <div
          className='h-full rounded-full bg-primary transition-[width]'
          style={{ width: `${percent}%` }}
        />
      </div>
      {scan.status === 'FAILED' && scan.error && (
        <p
          role='alert'
          className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'
        >
          This scan failed: {scan.error.message}
        </p>
      )}
      {scan.status === 'COMPLETED' && limitReached && notReached > 0 && (
        <p className='text-sm text-muted-foreground'>
          {notReached} more {notReached === 1 ? 'page was' : 'pages were'} found
          but not scanned: a multiple-page scan stops at {scan.maxPages} pages.
        </p>
      )}
    </section>
  )
}
