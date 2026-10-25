import type { TScanScreenshot } from '@typings/scan'

type ScanScreenshotProps = {
  screenshot: TScanScreenshot
  label: string
}

export const ScanScreenshot: React.FC<ScanScreenshotProps> = ({
  screenshot,
  label,
}) => {
  return (
    <section aria-labelledby='screenshot-heading' className='grid gap-3'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h2 id='screenshot-heading' className='text-lg font-semibold'>
          Page screenshot
        </h2>
        <a
          href={screenshot.url}
          target='_blank'
          rel='noreferrer'
          className='text-sm font-medium underline-offset-4 hover:underline'
        >
          Open full-size screenshot
        </a>
      </div>
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
