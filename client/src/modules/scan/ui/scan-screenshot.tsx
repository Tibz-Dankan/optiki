import { Maximize2 } from 'lucide-react'
import type { TScanScreenshot } from '@typings/scan'
import { cn } from '@utils/classname'
import { Button } from '@shared/ui/button'

type ScanScreenshotProps = {
  screenshot: TScanScreenshot
  label: string
  path: string
  className?: string
}

export const ScanScreenshot: React.FC<ScanScreenshotProps> = ({
  screenshot,
  label,
  path,
  className,
}) => {
  return (
    <section
      aria-labelledby='screenshot-heading'
      className={cn(
        'flex flex-col gap-3.5 rounded-lg border border-border bg-card p-5',
        className
      )}
    >
      <div className='flex items-center justify-between gap-3'>
        <h2
          id='screenshot-heading'
          className='min-w-0 truncate text-base font-semibold'
        >
          Page <span className='font-normal text-muted-foreground'>{path}</span>
        </h2>
        <Button asChild variant='outline' size='sm' className='shrink-0'>
          <a href={screenshot.url} target='_blank' rel='noopener noreferrer'>
            <Maximize2 aria-hidden />
            Full size
            <span className='sr-only'> (opens in a new tab)</span>
          </a>
        </Button>
      </div>
      <div className='relative min-h-60 flex-1 overflow-hidden rounded-md border border-border bg-background'>
        <img
          src={screenshot.url}
          alt={`Screenshot of ${label} as the scanner rendered it`}
          width={screenshot.width ?? undefined}
          height={screenshot.height ?? undefined}
          className='absolute inset-0 size-full object-cover object-top'
        />
      </div>
    </section>
  )
}
