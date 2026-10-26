import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TMultiplePageScanSummary } from '@typings/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { describeMultiplePageScan } from '@utils/describe-multiple-page-scan'
import { ConfirmDialog } from '@shared/ui/confirm-dialog'

type DeleteMultiplePageScanDialogProps = {
  scan: TMultiplePageScanSummary | null
  onOpenChange: (open: boolean) => void
  redirectTo?: string
}

export const DeleteMultiplePageScanDialog: React.FC<
  DeleteMultiplePageScanDialogProps
> = ({ scan, onOpenChange, redirectTo }) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: scanAPI.deleteMultiplePage,
    onSuccess: () => {
      toast.success('Multiple-page scan deleted')
      queryClient.invalidateQueries({ queryKey: scanKeys.all })
      if (redirectTo) navigate(redirectTo, { replace: true })
    },
    onSettled: () => onOpenChange(false),
  })

  return (
    <ConfirmDialog
      open={!!scan}
      onOpenChange={onOpenChange}
      title='Delete multiple-page scan'
      desc={
        <p>
          This deletes the scan of{' '}
          <span className='font-medium break-all'>
            {scan ? describeMultiplePageScan(scan) : ''}
          </span>{' '}
          and every page it scanned, with their findings and screenshots. It
          can't be undone.
        </p>
      }
      confirmText='Delete multiple-page scan'
      destructive
      isLoading={isPending}
      handleConfirm={() => scan && mutate({ id: scan.id })}
      className='sm:max-w-md'
    />
  )
}
