import { Link } from 'react-router-dom'
import { ArrowRight, Eye, GitPullRequest, ScanSearch } from 'lucide-react'
import { useAuthStore } from '@stores/auth'
import { AppLogo } from '@shared/ui/app-logo'
import { Button } from '@shared/ui/button'
import { ThemeSwitch } from '@shared/ui/theme-switch'

const highlights = [
  {
    icon: Eye,
    title: 'See what agents see',
    desc: 'Audit the accessibility tree that AI agents and screen readers actually read.',
  },
  {
    icon: ScanSearch,
    title: 'Rules from real failures',
    desc: 'Every check comes from a failure logged in a real AI test run, with the exact fix.',
  },
  {
    icon: GitPullRequest,
    title: 'Gate every pull request',
    desc: 'Compare each preview with production and block merges that make your app harder to use.',
  },
]

export const Home: React.FC = () => {
  const isLoggedIn = useAuthStore((state) => !!state.auth.session.userID)

  return (
    <div className='flex min-h-svh flex-col bg-background text-foreground'>
      <header className='sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md'>
        <div className='mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-6'>
          <Link to='/' className='flex items-center gap-2'>
            <AppLogo alt='' className='size-7' />
            <span className='text-lg font-semibold tracking-tight'>optikí</span>
          </Link>
          <div className='ms-auto flex items-center gap-2'>
            <ThemeSwitch />
            {isLoggedIn ? (
              <Button asChild>
                <Link to='/u/dashboard'>Open dashboard</Link>
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
        <section className='mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center md:py-28'>
          <h1 className='text-4xl font-bold tracking-tight text-balance md:text-5xl'>
            See your app the way an AI agent does
          </h1>
          <p className='mt-4 max-w-2xl text-lg text-balance text-muted-foreground'>
            optikí scans your pages for the problems that make AI agents and
            screen readers fail, shows the exact fix, and runs on every pull
            request.
          </p>
          <div className='mt-8 flex flex-wrap justify-center gap-3'>
            <Button size='lg' asChild>
              <Link to={isLoggedIn ? '/u/dashboard' : '/auth/signup'}>
                Get started
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>

        <section
          aria-label='Highlights'
          className='mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3'
        >
          {highlights.map((highlight) => (
            <div
              key={highlight.title}
              className='rounded-lg border border-border bg-card p-6'
            >
              <highlight.icon className='size-6 text-primary' aria-hidden />
              <h2 className='mt-4 font-semibold'>{highlight.title}</h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                {highlight.desc}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className='border-t border-border py-6 text-center text-sm text-muted-foreground'>
        optikí @ 2026
      </footer>
    </div>
  )
}
