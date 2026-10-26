import { Link, NavLink } from 'react-router-dom'
import { useAuthStore } from '@stores/auth'
import { cn } from '@utils/classname'
import { AppLogo } from '@shared/ui/app-logo'
import { Button } from '@shared/ui/button'
import { ThemeSwitch } from '@shared/ui/theme-switch'

const navLinks = [
  { to: '/scan', label: 'Scan' },
  { to: '/rules', label: 'Rules' },
  { to: '/gym', label: 'Gym' },
]

type HomeLayoutProps = {
  children: React.ReactNode
}

export const HomeLayout: React.FC<HomeLayoutProps> = ({ children }) => {
  const isLoggedIn = useAuthStore((state) => !!state.auth.session.userID)

  return (
    <div className='flex min-h-svh flex-col bg-background text-foreground'>
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-6'>
          <Link to='/' className='flex items-center gap-2'>
            <AppLogo alt='' className='size-7' />
            <span className='text-lg font-semibold tracking-tight'>optikí</span>
          </Link>
          <nav aria-label='Main' className='hidden items-center gap-1 sm:flex'>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground',
                    isActive && 'bg-muted text-foreground'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className='ms-auto flex items-center gap-2'>
            <ThemeSwitch />
            {isLoggedIn ? (
              <Button asChild>
                <Link to='/u/home'>Open home</Link>
              </Button>
            ) : (
              <>
                <Button variant='ghost' asChild>
                  <Link to='/auth/signin'>Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to='/auth/signup'>Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id='content' className='flex-1'>
        {children}
      </main>

      <footer className='border-t border-border py-6 text-center text-sm text-muted-foreground'>
        optikí @ 2026
      </footer>
    </div>
  )
}
