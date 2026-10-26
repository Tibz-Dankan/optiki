import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuthStore } from '@stores/auth'
import { cn } from '@utils/classname'
import { AppLogo } from '@shared/ui/app-logo'
import { Button } from '@shared/ui/button'
import { ThemeSwitch } from '@shared/ui/theme-switch'

// TODO: point Docs at the docs page once it exists.
const docsHref = '#'

const githubHref = 'https://github.com/Tibz-Dankan/optiki'

const currentYear = new Date().getFullYear()

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex h-10 items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
    isActive && 'text-foreground'
  )

const mobileLinkClassName =
  'flex h-12 items-center border-b border-border text-base font-medium'

const footerHeadingClassName =
  'font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase'

type HomeLayoutProps = {
  children: React.ReactNode
}

export const HomeLayout: React.FC<HomeLayoutProps> = ({ children }) => {
  const isLoggedIn = useAuthStore((state) => !!state.auth.session.userID)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className='flex min-h-svh flex-col bg-background text-foreground'>
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='mx-auto flex h-17 w-full max-w-300 items-center gap-6 px-[clamp(16px,4vw,32px)]'>
          <Link to='/' className='inline-flex items-center gap-2.5'>
            <AppLogo alt='' className='size-7.5' />
            <span className='text-xl font-bold tracking-[-0.02em]'>optikí</span>
          </Link>
          <nav aria-label='Main' className='ms-3 hidden md:flex'>
            <ul className='flex gap-1'>
              <li>
                <NavLink to='/scan' className={navLinkClassName}>
                  Scan
                </NavLink>
              </li>
              <li>
                <a
                  href={docsHref}
                  className={navLinkClassName({ isActive: false })}
                >
                  Docs
                </a>
              </li>
            </ul>
          </nav>
          <div className='ms-auto flex items-center gap-2'>
            <div className='hidden sm:block'>
              <ThemeSwitch />
            </div>
            {isLoggedIn ? (
              <Button asChild className='h-10 px-4 font-semibold'>
                <Link to='/u/scan'>Open app</Link>
              </Button>
            ) : (
              <>
                <Link
                  to='/auth/signin'
                  className='hidden h-10 items-center px-3 text-sm font-medium transition-colors hover:text-primary md:inline-flex'
                >
                  Sign in
                </Link>
                <Button asChild className='h-10 px-4 font-semibold'>
                  <Link to='/scan'>Scan your site free</Link>
                </Button>
              </>
            )}
            <Button
              type='button'
              variant='outline'
              size='icon'
              className='size-10 md:hidden'
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls='mobile-menu'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
            </Button>
          </div>
        </div>
        {isMenuOpen && (
          <nav
            id='mobile-menu'
            aria-label='Mobile'
            className='border-t border-border bg-background md:hidden'
          >
            <ul className='flex flex-col px-[clamp(16px,4vw,32px)] pt-2 pb-4'>
              <li>
                <Link
                  to='/scan'
                  onClick={closeMenu}
                  className={mobileLinkClassName}
                >
                  Scan
                </Link>
              </li>
              <li>
                <a
                  href={docsHref}
                  onClick={closeMenu}
                  className={mobileLinkClassName}
                >
                  Docs
                </a>
              </li>
              {!isLoggedIn && (
                <li>
                  <Link
                    to='/auth/signin'
                    onClick={closeMenu}
                    className={mobileLinkClassName}
                  >
                    Sign in
                  </Link>
                </li>
              )}
              <li className='flex h-12 items-center justify-between sm:hidden'>
                <span className='text-base font-medium'>Theme</span>
                <ThemeSwitch />
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main id='content' className='flex-1'>
        {children}
      </main>

      <footer className='border-t border-border'>
        <div className='mx-auto max-w-300 px-[clamp(16px,4vw,32px)] pt-14 pb-8'>
          <div className='flex flex-wrap gap-x-14 gap-y-10'>
            <div className='flex flex-[1_1_260px] flex-col gap-3.5'>
              <Link
                to='/'
                className='inline-flex items-center gap-2.5 self-start'
              >
                <AppLogo alt='' className='size-7' />
                <span className='text-lg font-bold'>optikí</span>
              </Link>
              <p className='max-w-70 text-sm leading-relaxed text-muted-foreground'>
                See your site the way an AI agent does, and fix what's in the
                way.
              </p>
              <a
                href={githubHref}
                className='mt-1 inline-flex h-9 items-center self-start rounded-lg border border-border px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:border-input hover:bg-muted/60 hover:text-foreground'
              >
                GitHub
              </a>
            </div>
            <nav
              aria-label='Footer'
              className='grid flex-[999_1_520px] grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-x-6 gap-y-8'
            >
              <div className='flex flex-col gap-3'>
                <h2 className={footerHeadingClassName}>Product</h2>
                <ul className='flex flex-col gap-2.5 text-sm'>
                  <li>
                    <Link
                      to='/scan'
                      className='transition-colors hover:text-primary'
                    >
                      Scan a page
                    </Link>
                  </li>
                </ul>
              </div>
              <div className='flex flex-col gap-3'>
                <h2 className={footerHeadingClassName}>Resources</h2>
                <ul className='flex flex-col gap-2.5 text-sm'>
                  <li>
                    <a
                      href={docsHref}
                      className='transition-colors hover:text-primary'
                    >
                      Docs
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
          <div className='mt-12 flex flex-wrap justify-between gap-3 border-t border-border pt-6 text-[13px] text-muted-foreground'>
            <span>© {currentYear} optikí. All rights reserved.</span>
            <span className='font-mono text-xs'>
              Built for the agentic web.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
