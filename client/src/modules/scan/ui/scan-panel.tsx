import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { guestScanLimit, scanErrorMessages } from '@constants/scan'
import type { TCreateScanInput, TScanReportResponse } from '@typings/scan'
import { isHttpError } from '@api/http-error'
import { scanAPI, scanKeys } from '@api/scan'
import { useGuestScanStore } from '@stores/guest-scan'
import { getAnonymousID } from '@utils/get-anonymous-id'
import { toRecentScan } from '@utils/to-recent-scan'
import { GuestScanLimitNotice } from '@modules/scan/ui/guest-scan-limit-notice'
import { UrlScanForm } from '@modules/scan/ui/url-scan-form'

type ScanPanelProps = {
  isGuest: boolean
}

export const ScanPanel: React.FC<ScanPanelProps> = ({ isGuest }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const guestScanCount = useGuestScanStore((state) => state.scans.length)
  const addGuestScan = useGuestScanStore((state) => state.addScan)

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: (input: TCreateScanInput) => scanAPI.create(input),
    onSuccess: (response: TScanReportResponse) => {
      const scan = response.data
      if (isGuest) addGuestScan(toRecentScan(scan))
      queryClient.invalidateQueries({ queryKey: scanKeys.all })
      navigate(isGuest ? `/scans/${scan.id}` : `/u/scans/${scan.id}`)
    },
    onError: () => {},
  })

  const scan = (url: string) => {
    reset()
    mutate(isGuest ? { url, anonymousID: getAnonymousID() } : { url })
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
    <div className='grid gap-4'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Scan a page</h1>
        <p className='mt-2 text-muted-foreground'>
          Enter the address of a public page to see it the way an AI agent does.
        </p>
      </div>

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
        <div className='grid gap-2'>
          <UrlScanForm isPending={isPending} onScan={scan} />
          <p className='text-sm text-muted-foreground'>
            {isGuest
              ? `Signed out, the page is fetched and checked against the 9 core rules. ${scansLeft} of ${guestScanLimit} free scans left.`
              : 'The page is loaded in a real browser, so all 17 rules run and a screenshot is saved.'}
          </p>
        </div>
      )}

      {isPending && (
        <p role='status' className='text-sm text-muted-foreground'>
          {isGuest
            ? 'Scanning…'
            : 'Scanning… rendered scans take a few seconds.'}
        </p>
      )}
    </div>
  )
}
