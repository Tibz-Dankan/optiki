import { authAPI } from '@api/auth'
import { getAnonymousID } from '@utils/get-anonymous-id'

export function reconcileAnonymousUser(userID: string): void {
  authAPI
    .reconcileAnonymousUser({ userID, anonymousID: getAnonymousID() })
    .catch(() => undefined)
}
