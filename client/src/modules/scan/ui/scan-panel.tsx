import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ListChecks } from 'lucide-react'
import {
  guestScanLimit,
  multiplePageScanMaxPages,
  scanErrorMessages,
} from '@constants/scan'
import type {
  TMultiplePageScanSummaryResponse,
  TScanReportResponse,
} from '@typings/scan'
import { isHttpError } from '@api/http-error'
import { scanAPI, scanKeys } from '@api/scan'
import { useGuestScanStore } from '@stores/guest-scan'
import { getAnonymousID } from '@utils/get-anonymous-id'
import { toRecentScan } from '@utils/to-recent-scan'
import { Checkbox } from '@shared/ui/checkbox'
import { Label } from '@shared/ui/label'
import { GuestScanLimitNotice } from '@modules/scan/ui/guest-scan-limit-notice'
import { UrlScanForm } from '@modules/scan/ui/url-scan-form'

type ScanPanelProps = {
  isGuest: boolean
}

export const ScanPanel: React.FC<ScanPanelProps> = ({ isGuest }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [discoverPages, setDiscoverPages] = useState(false)
  const guestScanCount = useGuestScanStore((state) => state.scans.length)
  const addGuestScan = useGuestScanStore((state) => state.addScan)
  const isMultiple = !isGuest && discoverPages

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: ({
      url,
      multiple,
    }: {
      url: string
      multiple: boolean
    }): Promise<TScanReportResponse | TMultiplePageScanSummaryResponse> =>
      multiple
        ? scanAPI.createMultiplePage({ url })
        : scanAPI.create(
            isGuest ? { url, anonymousID: getAnonymousID() } : { url }
          ),
    onSuccess: (response) => {
      const scan = response.data
      queryClient.invalidateQueries({ queryKey: scanKeys.all })
      if (scan.multiplePageScan) {
        navigate(`/u/scans/multiple/${scan.id}`)
        return
      }
      if (isGuest) addGuestScan(toRecentScan(scan))
      navigate(isGuest ? `/scans/${scan.id}` : `/u/scans/${scan.id}`)
    },
    onError: () => {},
  })

  const scan = (url: string) => {
    reset()
    mutate({ url, multiple: isMultiple })
  }

  const changeDiscoverPages = (checked: boolean) => {
    reset()
    setDiscoverPages(checked)
  }

  const isLimitError =
    isHttpError(error) && error.error === 'ANONYMOUS_SCAN_LIMIT'
  const isAtLimit =
    isGuest && (guestScanCount >= guestScanLimit || isLimitError)
  const scansLeft = Math.max(guestScanLimit - guestScanCount, 0)
  const errorMessage =
    error &&
    !isLimitError &&
    ((isHttpError(error) && scanErrorMessages[error.error]) || error.message)

  return (
    <div className='grid gap-3'>
      <h1 className='sr-only'>Scan a page</h1>

      {errorMessage && (
        <p
          role='alert'
          className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'
        >
          {errorMessage}
        </p>
      )}

      {isAtLimit ? (
        <GuestScanLimitNotice />
      ) : (
        <>
          <UrlScanForm isPending={isPending} onScan={scan}>
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
                  className='mt-0.5'
                  checked={discoverPages}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    changeDiscoverPages(checked === true)
                  }
                  aria-describedby='discover-pages-hint'
                />
                <div className='grid gap-1'>
                  <Label
                    htmlFor='discover-pages'
                    className='leading-snug font-normal'
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
          <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted-foreground'>
            <p className='flex items-center gap-1'>
              <Link
                to='/rules'
                className='inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline'
              >
                <ListChecks className='size-4' aria-hidden />
                {isGuest ? '9 core rules' : 'All 17 rules'}
              </Link>
              {isGuest && (
                <span>
                  · {scansLeft} of {guestScanLimit} free scans left
                </span>
              )}
            </p>
            <p className='hidden sm:block'>
              Press{' '}
              <kbd className='rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground'>
                Enter
              </kbd>{' '}
              to scan
            </p>
          </div>
        </>
      )}

      {isPending && (
        <p role='status' className='text-sm text-muted-foreground'>
          {isGuest
            ? 'Scanning…'
            : isMultiple
              ? 'Starting the multiple-page scan…'
              : 'Scanning… rendered scans take a few seconds.'}
        </p>
      )}
    </div>
  )
}
