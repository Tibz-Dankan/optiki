import { Link } from 'react-router-dom'
import { useAuthStore } from '@stores/auth'
import { Button } from '@shared/ui/button'
import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'
import { RecentScans } from '@modules/scan/ui/recent-scans'

export const UserHome: React.FC = () => {
  const name = useAuthStore((state) => state.auth.user.name)

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
            <Link to='/u/scan'>Scan a page</Link>
          </Button>
        </div>

        <div className='mt-6'>
          <RecentScans />
        </div>
      </Main>
    </>
  )
}
