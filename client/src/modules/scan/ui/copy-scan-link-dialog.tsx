import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import type { TScanSummary } from '@typings/scan'
import { useCopyToClipboard } from '@hooks/use-copy-to-clipboard'
import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'
import { Input } from '@shared/ui/input'
import { Label } from '@shared/ui/label'

type CopyScanLinkDialogProps = {
  scan: TScanSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CopyScanLinkDialog: React.FC<CopyScanLinkDialogProps> = ({
  scan,
  open,
  onOpenChange,
}) => {
  const { copied, copy } = useCopyToClipboard()
  const isPublic = scan.visibility === 'PUBLIC'
  const link = `${window.location.origin}/scans/${scan.id}`

  const copyLink = async () => {
    try {
      await copy(link)
      toast.success('Link copied')
    } catch {
      toast.error("Couldn't copy the link; select it and copy it by hand")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Copy link to this scan</DialogTitle>
          <DialogDescription>
            {isPublic
              ? 'Anyone with this link can open the report.'
              : 'This scan is private, so only you can open this link. Make the scan public to share it.'}
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-2'>
          <Label htmlFor='scan-link'>Scan link</Label>
          <Input
            id='scan-link'
            readOnly
            value={link}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>

        <DialogFooter>
          <Button type='button' onClick={copyLink}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            Copy link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
