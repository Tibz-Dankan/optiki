import type { TScanScreenshot } from '@typings/scan'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'

type ScanScreenshotDialogProps = {
  screenshot: TScanScreenshot
  label: string
  path: string
  heading: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ScanScreenshotDialog: React.FC<ScanScreenshotDialogProps> = ({
  screenshot,
  label,
  path,
  heading,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex h-[90vh] w-[80vw] max-w-[80vw] flex-col gap-4 overflow-hidden p-4 sm:max-w-[80vw] sm:p-6'>
        <DialogHeader className='min-w-0 pe-8 text-start'>
          <DialogTitle className='truncate leading-tight'>
            {heading}{' '}
            <span className='font-normal text-muted-foreground'>{path}</span>
          </DialogTitle>
          <DialogDescription className='wrap-anywhere'>
            Full-size screenshot of {label} as the scanner rendered it.
          </DialogDescription>
        </DialogHeader>
        <div
          role='region'
          aria-label={`Screenshot of ${path}`}
          tabIndex={0}
          className='min-h-0 flex-1 overflow-auto rounded-md border border-border bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden'
        >
          <img
            src={screenshot.url}
            alt={`Screenshot of ${label} as the scanner rendered it`}
            width={screenshot.width ?? undefined}
            height={screenshot.height ?? undefined}
            className='h-auto w-full'
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
