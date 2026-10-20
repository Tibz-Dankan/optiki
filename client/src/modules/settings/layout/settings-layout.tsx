import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import { Separator } from '@shared/ui/separator'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'
import { SettingsNav } from '@modules/settings/ui/settings-nav'

type SettingsLayoutProps = {
  children: React.ReactNode
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Settings
          </h1>
          <p className='text-muted-foreground'>
            Manage your account settings and preferences.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SettingsNav />
          </aside>
          <div className='flex w-full overflow-y-hidden p-1'>{children}</div>
        </div>
      </Main>
    </>
  )
}
