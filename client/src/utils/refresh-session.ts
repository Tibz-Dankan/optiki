import type { TAuthResponse } from '@typings/auth'
import { authAPI } from '@api/auth'
import { isHttpError } from '@api/http-error'
import { endSession } from '@utils/end-session'

let pendingRefresh: Promise<TAuthResponse> | null = null

export function refreshSession(): Promise<TAuthResponse> {
  pendingRefresh ??= authAPI
    .refreshSession()
    .catch((error: unknown) => {
      if (isHttpError(error) && error.status === 401) endSession()
      throw error
    })
    .finally(() => {
      pendingRefresh = null
    })
  return pendingRefresh
}
