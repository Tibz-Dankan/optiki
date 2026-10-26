import { AppLogo } from '@shared/ui/app-logo'
import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'
import { RecentScans } from '@modules/scan/ui/recent-scans'
import { ScanPanel } from '@modules/scan/ui/scan-panel'

export const UserScan: React.FC = () => {
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
        <div className='mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-14 pt-6 pb-10 md:gap-20 md:pt-14 md:pb-18'>
          <div>
            <div className='mb-7 flex items-center justify-center gap-3'>
              <AppLogo alt='' className='size-11' />
              <span className='text-[32px] leading-none font-bold tracking-tight'>
                optikí
              </span>
            </div>
            <ScanPanel isGuest={false} />
          </div>
          <RecentScans />
        </div>
      </Main>
    </>
  )
}
