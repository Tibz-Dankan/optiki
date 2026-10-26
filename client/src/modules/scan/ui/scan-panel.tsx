import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, Network } from 'lucide-react'
import { guestScanLimit, multiplePageScanMaxPages } from '@constants/scan'
import { useGuestScanStore } from '@stores/guest-scan'
import { useCreateScan } from '@hooks/use-create-scan'
import { Checkbox } from '@shared/ui/checkbox'
import { Label } from '@shared/ui/label'
import { GuestScanLimitNotice } from '@modules/scan/ui/guest-scan-limit-notice'
import { UrlScanForm } from '@modules/scan/ui/url-scan-form'

type ScanPanelProps = {
  isGuest: boolean
}

export const ScanPanel: React.FC<ScanPanelProps> = ({ isGuest }) => {
  const [discoverPages, setDiscoverPages] = useState(false)
  const guestScanCount = useGuestScanStore((state) => state.scans.length)
  const { scan, isPending, isLimitError, errorMessage, reset } =
    useCreateScan(isGuest)
  const isMultiple = !isGuest && discoverPages

  const changeDiscoverPages = (checked: boolean) => {
    reset()
    setDiscoverPages(checked)
  }

  const isAtLimit =
    isGuest && (guestScanCount >= guestScanLimit || isLimitError)
  const scansLeft = Math.max(guestScanLimit - guestScanCount, 0)
  const pendingMessage = isGuest
    ? 'Scanning…'
    : isMultiple
      ? 'Starting the multiple-page scan…'
      : 'Scanning… rendered scans take a few seconds.'

  return (
    <div>
      <h1 className='sr-only'>Scan a page</h1>

      {isAtLimit ? (
        <GuestScanLimitNotice />
      ) : (
        <UrlScanForm
          isPending={isPending}
          pendingMessage={pendingMessage}
          error={errorMessage}
          onScan={(url) => scan(url, isMultiple)}
          hint={
            <>
              {isMultiple && (
                <span className='inline-flex items-center gap-1.5'>
                  <Network className='size-3.5' aria-hidden />
                  Up to {multiplePageScanMaxPages} linked pages
                </span>
              )}
              <span className='flex items-center gap-1'>
                <Link
                  to='/rules'
                  className='inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline'
                >
                  <ListChecks className='size-3.5' aria-hidden />
                  {isGuest ? '9 core rules' : 'All 17 rules'}
                </Link>
                {isGuest && (
                  <span>
                    · {scansLeft} of {guestScanLimit} free scans left
                  </span>
                )}
              </span>
            </>
          }
        >
          {isGuest ? (
            <p className='text-sm text-muted-foreground'>
              <Link
                to='/auth/signin?redirectTo=/u/scan'
                className='font-medium text-foreground underline underline-offset-4'
              >
                Sign in to scan multiple pages
              </Link>{' '}
              of a site at once, up to {multiplePageScanMaxPages}.
            </p>
          ) : (
            <div className='flex items-start gap-3'>
              <Checkbox
                id='discover-pages'
                className='mt-px size-4.5'
                checked={discoverPages}
                disabled={isPending}
                onCheckedChange={(checked) =>
                  changeDiscoverPages(checked === true)
                }
                aria-describedby='discover-pages-hint'
              />
              <div className='grid gap-0.5'>
                <Label
                  htmlFor='discover-pages'
                  className='leading-[1.4] font-normal'
                >
                  Automatically discover other pages of the host and scan them
                  too
                </Label>
                <p
                  id='discover-pages-hint'
                  className='text-xs text-muted-foreground'
                >
                  Follows same-site links from this page, up to{' '}
                  {multiplePageScanMaxPages} pages.
                </p>
              </div>
            </div>
          )}
        </UrlScanForm>
      )}
    </div>
  )
}
