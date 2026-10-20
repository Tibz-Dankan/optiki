import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { generatedViaLabels } from '@constants/session'
import type { TActiveSession, TRevokeSessionResponse } from '@typings/auth'
import { authAPI, authKeys } from '@api/auth'
import { formatDateTime } from '@utils/format-date-time'
import { getBrowserLabel } from '@utils/get-browser-label'
import { useSignOutLocally } from '@hooks/use-sign-out-locally'
import { Badge } from '@shared/ui/badge'
import { ConfirmDialog } from '@shared/ui/confirm-dialog'

type SessionDetailsProps = {
  session: TActiveSession
}

const SessionDetails: React.FC<SessionDetailsProps> = ({ session }) => {
  const details: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Browser',
      value: (
        <span className='flex items-center gap-2'>
          {getBrowserLabel(session.userAgent)}
          {session.isCurrentSession && <Badge>Current</Badge>}
        </span>
      ),
    },
    { label: 'IP address', value: session.ip || 'Unknown' },
    {
      label: 'Signed in via',
      value: generatedViaLabels[session.generatedVia],
    },
    { label: 'Created', value: formatDateTime(session.createdAt) },
    { label: 'Last used', value: formatDateTime(session.lastUsedAt) },
    { label: 'Expires', value: formatDateTime(session.refreshTokenExpiresAt) },
  ]

  return (
    <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border p-4 text-sm'>
      {details.map((detail) => (
        <div key={detail.label} className='contents'>
          <dt className='text-muted-foreground'>{detail.label}</dt>
          <dd className='font-medium break-all'>{detail.value}</dd>
        </div>
      ))}
    </dl>
  )
}

type RevokeSessionDialogProps = {
  session: TActiveSession | null
  onOpenChange: (open: boolean) => void
}

export const RevokeSessionDialog: React.FC<RevokeSessionDialogProps> = ({
  session,
  onOpenChange,
}) => {
  const queryClient = useQueryClient()
  const signOutLocally = useSignOutLocally()

  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.revokeSession,
    onSuccess: (response: TRevokeSessionResponse) => {
      toast.success(response.message)
      if (response.data.isCurrentSession) {
        signOutLocally()
        return
      }
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() })
    },
    onSettled: () => onOpenChange(false),
  })

  return (
    <ConfirmDialog
      open={!!session}
      onOpenChange={onOpenChange}
      title='Revoke session'
      desc={
        <div className='flex flex-col gap-2'>
          <p>
            Revoking ends this session immediately. The device will be signed
            out and will need to sign in again to access your account.
          </p>
          {session?.isCurrentSession && (
            <p className='font-medium text-destructive'>
              This is your current session. You will be signed out of this
              browser right away.
            </p>
          )}
        </div>
      }
      confirmText='Revoke session'
      destructive
      isLoading={isPending}
      handleConfirm={() => session && mutate({ sessionID: session.id })}
      className='sm:max-w-md'
    >
      {session && <SessionDetails session={session} />}
    </ConfirmDialog>
  )
}
