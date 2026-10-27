import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { TAPIToken } from '@typings/api-token'
import { apiTokenAPI, apiTokenKeys } from '@api/api-token'
import { ConfirmDialog } from '@shared/ui/confirm-dialog'

type RevokeAPITokenDialogProps = {
  token: TAPIToken | null
  onOpenChange: (open: boolean) => void
}

export const RevokeAPITokenDialog: React.FC<RevokeAPITokenDialogProps> = ({
  token,
  onOpenChange,
}) => {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: apiTokenAPI.revoke,
    onSuccess: () => toast.success('API token revoked'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: apiTokenKeys.all })
      onOpenChange(false)
    },
  })

  return (
    <ConfirmDialog
      open={!!token}
      onOpenChange={onOpenChange}
      title='Revoke API token'
      desc={
        <p>
          Anything using <span className='font-medium'>{token?.name}</span>{' '}
          stops working immediately. The token stays in the list so you can see
          when it was last used.
        </p>
      }
      confirmText='Revoke token'
      destructive
      isLoading={isPending}
      handleConfirm={() => token && mutate({ id: token.id })}
      className='sm:max-w-md'
    />
  )
}
