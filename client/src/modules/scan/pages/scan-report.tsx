import { useParams } from 'react-router-dom'
import { HomeLayout } from '@modules/home/layout/home-layout'
import { GuestHistoryBanner } from '@modules/scan/ui/guest-history-banner'
import { ScanReportContent } from '@modules/scan/ui/scan-report-content'

export const ScanReport: React.FC = () => {
  const { id = '' } = useParams()

  return (
    <HomeLayout>
      <div className='mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-6 px-6 py-12'>
        <GuestHistoryBanner />
        <ScanReportContent id={id} scanAnotherPath='/scan' />
      </div>
    </HomeLayout>
  )
}
