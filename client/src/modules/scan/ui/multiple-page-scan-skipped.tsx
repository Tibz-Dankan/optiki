import { skipReasonLabels } from '@constants/scan'
import type { TMultiplePageScanSkippedPage } from '@typings/scan'

type MultiplePageScanSkippedProps = {
  skipped: TMultiplePageScanSkippedPage[]
}

export const MultiplePageScanSkipped: React.FC<
  MultiplePageScanSkippedProps
> = ({ skipped }) => {
  if (skipped.length === 0) return null

  return (
    <details className='rounded-lg border border-border p-4'>
      <summary className='cursor-pointer font-semibold'>
        {skipped.length} {skipped.length === 1 ? 'page' : 'pages'} not scanned
      </summary>
      <ul className='mt-3 grid gap-2 text-sm'>
        {skipped.map((page) => (
          <li key={page.url} className='grid gap-0.5'>
            <span className='break-all'>{page.url}</span>
            <span className='text-muted-foreground'>
              {skipReasonLabels[page.reason]}
              {page.httpStatus ? ` (HTTP ${page.httpStatus})` : ''}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}
