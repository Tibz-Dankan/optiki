import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TAPIToken } from '@typings/api-token'
import { apiTokenAPI, apiTokenKeys } from '@api/api-token'
import { ConfirmDialog } from '@shared/ui/confirm-dialog'

type DeleteAPITokenDialogProps = {
  token: TAPIToken | null
  onOpenChange: (open: boolean) => void
}

export const DeleteAPITokenDialog: React.FC<DeleteAPITokenDialogProps> = ({
  token,
  onOpenChange,
}) => {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: apiTokenAPI.delete,
    onSuccess: () => toast.success('API token deleted'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: apiTokenKeys.all })
      onOpenChange(false)
    },
  })

  return (
    <ConfirmDialog
      open={!!token}
      onOpenChange={onOpenChange}
      title='Delete API token'
      desc={
        <p>
          This deletes <span className='font-medium'>{token?.name}</span> for
          good and stops anything using it. Scans it made stay in your history.
        </p>
      }
      confirmText='Delete token'
      destructive
      isLoading={isPending}
      handleConfirm={() => token && mutate({ id: token.id })}
      className='sm:max-w-md'
    />
  )
}
