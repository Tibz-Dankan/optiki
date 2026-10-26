import { useQuery } from '@tanstack/react-query'
import { scanAPI, scanKeys } from '@api/scan'

// Screenshot links are signed for 30 minutes; refetching sooner keeps an open report's image alive.
const screenshotRefresh = 25 * 60 * 1000

export const useScanReport = (id: string) => {
  return useQuery({
    queryKey: scanKeys.detail(id),
    queryFn: () => scanAPI.getOne(id),
    enabled: !!id,
    staleTime: screenshotRefresh,
    refetchInterval: screenshotRefresh,
  })
}
