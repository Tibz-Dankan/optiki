import { useQuery } from '@tanstack/react-query'
import { multiplePageScanPollInterval } from '@constants/scan'
import { scanAPI, scanKeys } from '@api/scan'
import { isMultiplePageScanActive } from '@utils/is-multiple-page-scan-active'

export const useMultiplePageScanReport = (id: string) => {
  return useQuery({
    queryKey: scanKeys.multipleDetail(id),
    queryFn: () => scanAPI.getOneMultiplePage(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const scan = query.state.data?.data
      return scan && isMultiplePageScanActive(scan)
        ? multiplePageScanPollInterval
        : false
    },
  })
}
