import { useAuthStore } from '@stores/auth'
import { getInitials } from '@utils/get-initials'
import useDialogState from '@hooks/use-dialog-state'
import { Avatar, AvatarFallback } from '@shared/ui/avatar'
import { Button } from '@shared/ui/button'
import { DropdownMenu, DropdownMenuTrigger } from '@shared/ui/dropdown-menu'
import { ProfileMenuContent } from '@shared/ui/profile-menu-content'
import { SignOutDialog } from '@shared/ui/sign-out-dialog'

export const ProfileDropdown: React.FC = () => {
  const [open, setOpen] = useDialogState<boolean>()
  const user = useAuthStore((state) => state.auth.user)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative size-8 rounded-full'>
            <Avatar className='size-8'>
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <ProfileMenuContent
          className='w-56'
          align='end'
          forceMount
          onSignOut={() => setOpen(true)}
        />
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
