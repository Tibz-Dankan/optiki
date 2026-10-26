import { useGuestScanStore } from '@stores/guest-scan'
import { HomeLayout } from '@modules/home/layout/home-layout'
import { GuestHistoryBanner } from '@modules/scan/ui/guest-history-banner'
import { RecentScanList } from '@modules/scan/ui/recent-scan-list'
import { ScanPanel } from '@modules/scan/ui/scan-panel'

export const Scan: React.FC = () => {
  const guestScans = useGuestScanStore((state) => state.scans)

  return (
    <HomeLayout>
      <div className='mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8 px-6 py-12'>
        <ScanPanel isGuest />

        <section aria-labelledby='recent-scans' className='grid gap-3'>
          <h2 id='recent-scans' className='text-lg font-semibold'>
            Recent scans
          </h2>
          <GuestHistoryBanner />
          {guestScans.length > 0 ? (
            <RecentScanList scans={guestScans} reportPath='/scans' />
          ) : (
            <p className='text-sm text-muted-foreground'>
              Your scans will appear here.
            </p>
          )}
        </section>
      </div>
    </HomeLayout>
  )
}
