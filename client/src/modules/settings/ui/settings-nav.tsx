import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserCog, Wrench } from 'lucide-react'
import { cn } from '@utils/classname'
import { buttonVariants } from '@shared/ui/button'
import { ScrollArea } from '@shared/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select'

const navItems = [
  { title: 'General', segment: '', icon: UserCog },
  { title: 'Account', segment: '/account', icon: Wrench },
]

const settingsPath = '/u/settings'

export const SettingsNav: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const items = navItems.map((item) => ({
    ...item,
    href: `${settingsPath}${item.segment}`,
  }))

  return (
    <>
      <div className='p-1 md:hidden'>
        <Select value={pathname} onValueChange={(href) => navigate(href)}>
          <SelectTrigger className='h-12 sm:w-48'>
            <SelectValue placeholder='Settings' />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <div className='flex gap-x-4 px-2 py-1'>
                  <span className='scale-125'>
                    <item.icon size={18} />
                  </span>
                  <span className='text-md'>{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea
        type='always'
        className='hidden w-full min-w-40 bg-background px-1 py-2 md:block'
      >
        <nav className='flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0'>
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'justify-start',
                pathname === item.href
                  ? 'bg-muted hover:bg-accent'
                  : 'hover:bg-accent hover:underline'
              )}
            >
              <span className='me-2'>
                <item.icon size={18} />
              </span>
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </>
  )
}
