import { ScanSearch } from 'lucide-react'
import { useAuthStore } from '@stores/auth'
import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'

export const Dashboard: React.FC = () => {
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
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Welcome, {name}
          </h1>
          <p className='text-muted-foreground'>
            Your projects and scan history will appear here.
          </p>
        </div>

        <div className='mt-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center'>
          <ScanSearch className='size-8 text-muted-foreground' aria-hidden />
          <h2 className='font-semibold'>No scans yet</h2>
          <p className='max-w-sm text-sm text-muted-foreground'>
            Scanning arrives in the next pull request. Then you can paste HTML,
            enter a URL, or pick a Gym example here.
          </p>
        </div>
      </Main>
    </>
  )
}
