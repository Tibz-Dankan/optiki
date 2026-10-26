import { ChevronRight } from 'lucide-react'
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
    <details className='group rounded-lg border border-border bg-card px-4 py-3.5'>
      <summary className='flex cursor-pointer list-none items-center gap-2 text-[15px] font-semibold [&::-webkit-details-marker]:hidden'>
        <ChevronRight
          className='size-4 text-muted-foreground transition-transform group-open:rotate-90'
          strokeWidth={2.25}
          aria-hidden
        />
        {skipped.length} {skipped.length === 1 ? 'page' : 'pages'} not scanned
      </summary>
      <ul className='mt-3 grid gap-2.5 ps-6 text-sm'>
        {skipped.map((page) => (
          <li key={page.url} className='grid gap-0.5'>
            <span className='wrap-anywhere'>{page.url}</span>
            <span className='text-[13px] text-muted-foreground'>
              {skipReasonLabels[page.reason]}
              {page.httpStatus ? ` (HTTP ${page.httpStatus})` : ''}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}
