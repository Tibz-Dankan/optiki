import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TScanSummary } from '@typings/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { describeScanTarget } from '@utils/describe-scan-target'
import { ConfirmDialog } from '@shared/ui/confirm-dialog'

type DeleteScanDialogProps = {
  scan: TScanSummary | null
  onOpenChange: (open: boolean) => void
  redirectTo?: string
}

export const DeleteScanDialog: React.FC<DeleteScanDialogProps> = ({
  scan,
  onOpenChange,
  redirectTo,
}) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: scanAPI.delete,
    onSuccess: () => {
      toast.success('Scan deleted')
      queryClient.invalidateQueries({ queryKey: scanKeys.all })
      if (redirectTo) navigate(redirectTo, { replace: true })
    },
    onSettled: () => onOpenChange(false),
  })

  return (
    <ConfirmDialog
      open={!!scan}
      onOpenChange={onOpenChange}
      title='Delete scan'
      desc={
        <p>
          This deletes the scan of{' '}
          <span className='font-medium break-all'>
            {scan ? describeScanTarget(scan) : ''}
          </span>
          , its findings and its screenshot. It can't be undone.
        </p>
      }
      confirmText='Delete scan'
      destructive
      isLoading={isPending}
      handleConfirm={() => scan && mutate({ id: scan.id })}
      className='sm:max-w-md'
    />
  )
}
