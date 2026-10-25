import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ScanSearch } from 'lucide-react'
import { scanAPI, scanKeys } from '@api/scan'
import { useAuthStore } from '@stores/auth'
import { describeScanTarget } from '@utils/describe-scan-target'
import { formatDateTime } from '@utils/format-date-time'
import { Button } from '@shared/ui/button'
import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import { Skeleton } from '@shared/ui/skeleton'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'

const recentScanCount = 5

export const Dashboard: React.FC = () => {
  const name = useAuthStore((state) => state.auth.user.name)

  const { data, isPending, isError, error } = useQuery({
    queryKey: [...scanKeys.list({}), 'recent'],
    queryFn: () => scanAPI.getAll(recentScanCount, '', {}),
  })
  const scans = data?.data ?? []

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div className='space-y-0.5'>
            <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
              Welcome, {name}
            </h1>
            <p className='text-muted-foreground'>
              Your recent scans. Signed in, every scan runs all 17 rules.
            </p>
          </div>
          <Button asChild>
            <Link to='/scan'>Scan a page</Link>
          </Button>
        </div>

        <section aria-labelledby='recent-scans' className='mt-6'>
          <h2 id='recent-scans' className='text-lg font-semibold'>
            Recent scans
          </h2>

          {isPending && <Skeleton className='mt-3 h-40 w-full' />}
          {isError && (
            <p role='alert' className='mt-3 text-sm text-destructive'>
              {error.message}
            </p>
          )}

          {!isPending && !isError && scans.length === 0 && (
            <div className='mt-3 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center'>
              <ScanSearch
                className='size-8 text-muted-foreground'
                aria-hidden
              />
              <p className='font-semibold'>No scans yet</p>
              <p className='max-w-sm text-sm text-muted-foreground'>
                Paste HTML, enter a URL, or pick a Gym example to see your page
                the way an AI agent does.
              </p>
            </div>
          )}

          {scans.length > 0 && (
            <ul className='mt-3 grid gap-2'>
              {scans.map((scan) => (
                <li
                  key={scan.id}
                  className='flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border p-3'
                >
                  <Link
                    to={`/scans/${scan.id}`}
                    className='min-w-0 flex-1 truncate font-medium underline-offset-4 hover:underline'
                  >
                    Open scan of {describeScanTarget(scan)}
                  </Link>
                  <span className='text-sm'>
                    Score {scan.scores.overall ?? '—'}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    {formatDateTime(scan.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {scans.length > 0 && (
            <Link
              to='/u/scans'
              className='mt-3 inline-block text-sm font-medium underline-offset-4 hover:underline'
            >
              See all scans
            </Link>
          )}
        </section>
      </Main>
    </>
  )
}
