import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { API_URL } from '@constants/urls'
import type { TCreatedAPIToken } from '@typings/api-token'
import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'

type APITokenCreatedDialogProps = {
  token: TCreatedAPIToken | null
  onClose: () => void
}

export const APITokenCreatedDialog: React.FC<APITokenCreatedDialogProps> = ({
  token,
  onClose,
}) => {
  const curlSample = `curl -X POST "${API_URL}/scan" \\
  -H "Authorization: Bearer $OPTIKI_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com"}'`

  const copyToken = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token.token)
      toast.success('Token copied')
    } catch {
      toast.error("Couldn't copy the token; select it and copy it by hand")
    }
  }

  return (
    <Dialog open={!!token} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className='sm:max-w-xl'
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Copy your new API token</DialogTitle>
          <DialogDescription>
            You won't see this token again. Store it as a secret, such as{' '}
            <code>OPTIKI_TOKEN</code> in your CI.
          </DialogDescription>
        </DialogHeader>

        {token && (
          <div className='grid gap-4'>
            <div className='grid gap-2'>
              <p className='text-sm font-medium' id='new-token-label'>
                Token for {token.name}
              </p>
              <div className='flex items-start gap-2'>
                <code
                  aria-labelledby='new-token-label'
                  className='flex-1 rounded bg-muted p-3 text-xs break-all'
                >
                  {token.token}
                </code>
                <Button type='button' variant='outline' onClick={copyToken}>
                  <Copy aria-hidden />
                  Copy token
                </Button>
              </div>
            </div>
            <div className='grid gap-2'>
              <p className='text-sm font-medium'>Try it</p>
              <pre className='overflow-x-auto rounded bg-muted p-3 text-xs'>
                <code>{curlSample}</code>
              </pre>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type='button' onClick={onClose}>
            I've saved my token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
