import { SERVER_URL } from '@constants/urls'
import type { TGymResponse } from '@typings/gym'
import { throwOnError } from './http-error'

class GymAPI {
  getAll = async (): Promise<TGymResponse> => {
    const response = await fetch(`${SERVER_URL}/gym`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }
}

export const gymAPI = new GymAPI()

export const gymKeys = {
  all: ['gym'] as const,
  list: () => [...gymKeys.all, 'list'] as const,
}
