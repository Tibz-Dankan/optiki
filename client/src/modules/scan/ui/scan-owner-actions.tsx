import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, Lock, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { TScanSummary } from '@typings/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { Button } from '@shared/ui/button'
import { DeleteScanDialog } from '@modules/scan/ui/delete-scan-dialog'

type ScanOwnerActionsProps = {
  scan: TScanSummary
}

export const ScanOwnerActions: React.FC<ScanOwnerActionsProps> = ({ scan }) => {
  const queryClient = useQueryClient()
  const [scanToDelete, setScanToDelete] = useState<TScanSummary | null>(null)
  const isPublic = scan.visibility === 'PUBLIC'

  const { mutate, isPending } = useMutation({
    mutationFn: scanAPI.update,
    onSuccess: (response) => {
      toast.success(
        response.data.visibility === 'PUBLIC'
          ? 'Anyone with the link can now open this scan'
          : 'Only you can open this scan now'
      )
      queryClient.invalidateQueries({ queryKey: scanKeys.all })
    },
  })

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success(
        isPublic
          ? 'Link copied'
          : 'Link copied — make the scan public to share it'
      )
    } catch {
      toast.error("Couldn't copy the link")
    }
  }

  return (
    <div className='flex flex-wrap gap-2'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={isPending}
        onClick={() =>
          mutate({ id: scan.id, visibility: isPublic ? 'PRIVATE' : 'PUBLIC' })
        }
      >
        {isPublic ? <Lock aria-hidden /> : <Users aria-hidden />}
        {isPublic ? 'Make scan private' : 'Make scan public'}
      </Button>
      <Button type='button' variant='outline' size='sm' onClick={copyLink}>
        <Link2 aria-hidden />
        Copy link
      </Button>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => setScanToDelete(scan)}
      >
        <Trash2 aria-hidden />
        Delete scan
      </Button>
      <DeleteScanDialog
        scan={scanToDelete}
        onOpenChange={(isOpen) => !isOpen && setScanToDelete(null)}
        redirectTo='/u/scans'
      />
    </div>
  )
}
