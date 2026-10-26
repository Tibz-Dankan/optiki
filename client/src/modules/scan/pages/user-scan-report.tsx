import { useParams } from 'react-router-dom'
import { ProfileDropdown } from '@shared/ui/profile-dropdown'
import { Search } from '@shared/ui/search'
import { ThemeSwitch } from '@shared/ui/theme-switch'
import { Header } from '@shared/layout/header'
import { Main } from '@shared/layout/main'
import { ScanReportContent } from '@modules/scan/ui/scan-report-content'

export const UserScanReport: React.FC = () => {
  const { id = '' } = useParams()

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
        <div className='mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6'>
          <ScanReportContent id={id} scanAnotherPath='/u/scan' />
        </div>
      </Main>
    </>
  )
}
