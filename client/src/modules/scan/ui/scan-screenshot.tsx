import type { TScanScreenshot } from '@typings/scan'

type ScanScreenshotProps = {
  screenshot: TScanScreenshot
  label: string
  path: string
}

export const ScanScreenshot: React.FC<ScanScreenshotProps> = ({
  screenshot,
  label,
  path,
}) => {
  return (
    <section aria-labelledby='screenshot-heading' className='grid gap-3'>
      <h2 id='screenshot-heading' className='text-lg font-semibold break-all'>
        Page <span className='font-normal text-muted-foreground'>{path}</span>
      </h2>
      <div className='max-h-[32rem] overflow-y-auto rounded-lg border border-border'>
        <img
          src={screenshot.url}
          alt={`Screenshot of ${label} as the scanner rendered it`}
          width={screenshot.width ?? undefined}
          height={screenshot.height ?? undefined}
          className='h-auto w-full'
        />
      </div>
    </section>
  )
}
