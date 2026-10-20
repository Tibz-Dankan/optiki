import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authAPI } from '@api/auth'
import { useAppearanceStore } from '@stores/appearance'
import { useAuthStore } from '@stores/auth'
import { ConfirmDialog } from '@shared/ui/confirm-dialog'

type SignOutDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SignOutDialog: React.FC<SignOutDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const clearAppearance = useAppearanceStore((state) => state.clearAppearance)

  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.signOut,
    // onSettled, not onSuccess: a failed sign-out must not strand the user in the app.
    onSettled: () => {
      clearAuth()
      clearAppearance()
      navigate(
        `/auth/signin?redirectTo=${encodeURIComponent(location.pathname)}`,
        { replace: true }
      )
    },
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      destructive
      isLoading={isPending}
      handleConfirm={() => mutate()}
      className='sm:max-w-sm'
    />
  )
}
