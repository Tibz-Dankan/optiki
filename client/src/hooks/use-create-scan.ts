import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scanErrorMessages } from '@constants/scan'
import type {
  TMultiplePageScanSummaryResponse,
  TScanReportResponse,
} from '@typings/scan'
import { isHttpError } from '@api/http-error'
import { scanAPI, scanKeys } from '@api/scan'
import { useGuestScanStore } from '@stores/guest-scan'
import { getAnonymousID } from '@utils/get-anonymous-id'
import { toRecentScan } from '@utils/to-recent-scan'

export const useCreateScan = (isGuest: boolean) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const addGuestScan = useGuestScanStore((state) => state.addScan)

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

  const scan = (url: string, multiple = false) => {
    reset()
    mutate({ url, multiple })
  }

  const isLimitError =
    isHttpError(error) && error.error === 'ANONYMOUS_SCAN_LIMIT'
  const errorMessage =
    (error &&
      !isLimitError &&
      ((isHttpError(error) && scanErrorMessages[error.error]) ||
        error.message)) ||
    undefined

  return { scan, isPending, isLimitError, errorMessage, reset }
}
