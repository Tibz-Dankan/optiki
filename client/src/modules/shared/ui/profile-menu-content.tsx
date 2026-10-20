import { Link } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@stores/auth'
import { cn } from '@utils/classname'
import { getInitials } from '@utils/get-initials'
import { Avatar, AvatarFallback } from '@shared/ui/avatar'
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@shared/ui/dropdown-menu'

type ProfileMenuContentProps = React.ComponentProps<
  typeof DropdownMenuContent
> & {
  onSignOut: () => void
}

export const ProfileMenuContent: React.FC<ProfileMenuContentProps> = ({
  className,
  onSignOut,
  ...props
}) => {
  const user = useAuthStore((state) => state.auth.user)

  const displayName = user.name || 'Account'
  const initials = getInitials(displayName)

  return (
    <DropdownMenuContent
      className={cn('min-w-56 rounded-lg', className)}
      {...props}
    >
      <DropdownMenuLabel className='p-0 font-normal'>
        <div className='flex items-center gap-2 px-1 py-1.5 text-start text-sm'>
          <Avatar className='h-8 w-8 rounded-lg'>
            <AvatarFallback className='rounded-lg'>{initials}</AvatarFallback>
          </Avatar>
          <div className='grid flex-1 text-start text-sm leading-tight'>
            <span className='truncate font-semibold'>{displayName}</span>
            <span className='truncate text-xs'>{user.email}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link to='/u/settings'>
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant='destructive' onClick={onSignOut}>
        <LogOut />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
