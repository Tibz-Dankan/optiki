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
        <div className='mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8 py-6'>
          <ScanPanel isGuest={false} />
          <RecentScans />
        </div>
      </Main>
    </>
  )
}
