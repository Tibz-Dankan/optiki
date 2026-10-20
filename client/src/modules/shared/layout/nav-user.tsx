import { ChevronsUpDown } from 'lucide-react'
import { useAuthStore } from '@stores/auth'
import { getInitials } from '@utils/get-initials'
import useDialogState from '@hooks/use-dialog-state'
import { Avatar, AvatarFallback } from '@shared/ui/avatar'
import { DropdownMenu, DropdownMenuTrigger } from '@shared/ui/dropdown-menu'
import { ProfileMenuContent } from '@shared/ui/profile-menu-content'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@shared/ui/sidebar'
import { SignOutDialog } from '@shared/ui/sign-out-dialog'

export const NavUser: React.FC = () => {
  const { isMobile } = useSidebar()
  const [open, setOpen] = useDialogState<boolean>()
  const user = useAuthStore((state) => state.auth.user)

  const displayName = user.name || 'Account'
  const initials = getInitials(displayName)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarFallback className='rounded-lg'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>{displayName}</span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>
                <ChevronsUpDown className='ms-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <ProfileMenuContent
              className='w-(--radix-dropdown-menu-trigger-width)'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
              onSignOut={() => setOpen(true)}
            />
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
