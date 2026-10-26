import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TScanSummary } from '@typings/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { ConfirmDialog } from '@shared/ui/confirm-dialog'

type ScanVisibilityDialogProps = {
  scan: TScanSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ScanVisibilityDialog: React.FC<ScanVisibilityDialogProps> = ({
  scan,
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient()
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
    onSettled: () => onOpenChange(false),
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isPublic ? 'Make this scan private?' : 'Make this scan public?'}
      desc={
        isPublic
          ? 'Only you will be able to open this report. Links you have already shared will stop working.'
          : 'Anyone with the link will be able to open this report, including its findings and screenshot.'
      }
      confirmText={isPublic ? 'Make scan private' : 'Make scan public'}
      isLoading={isPending}
      handleConfirm={() =>
        mutate({ id: scan.id, visibility: isPublic ? 'PRIVATE' : 'PUBLIC' })
      }
      className='sm:max-w-md'
    />
  )
}
