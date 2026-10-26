import type { QueryClient } from '@tanstack/react-query'
import { authAPI } from '@api/auth'
import { scanKeys } from '@api/scan'
import { useGuestScanStore } from '@stores/guest-scan'
import { getAnonymousID } from '@utils/get-anonymous-id'

export function reconcileAnonymousUser(
  userID: string,
  queryClient: QueryClient
): void {
  authAPI
    .reconcileAnonymousUser({ userID, anonymousID: getAnonymousID() })
    .then((response) => {
      useGuestScanStore.getState().clearScans()
      if (response.data.linkedScans > 0) {
        queryClient.invalidateQueries({ queryKey: scanKeys.all })
      }
    })
    .catch(() => undefined)
}
