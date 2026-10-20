import { SERVER_URL } from '@constants/urls'
import type {
  TAppearanceResponse,
  TCreateAppearanceInput,
  TUpdateAppearanceInput,
} from '@typings/appearance'
import { throwOnError } from './http-error'

class AppearanceAPI {
  getMine = async (): Promise<TAppearanceResponse> => {
    const response = await fetch(`${SERVER_URL}/appearance/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  create = async ({
    theme,
  }: TCreateAppearanceInput): Promise<TAppearanceResponse> => {
    const response = await fetch(`${SERVER_URL}/appearance`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
    return (await throwOnError(response)).json()
  }

  update = async ({
    id,
    theme,
  }: TUpdateAppearanceInput): Promise<TAppearanceResponse> => {
    const response = await fetch(`${SERVER_URL}/appearance/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
    return (await throwOnError(response)).json()
  }
}

export const appearanceAPI = new AppearanceAPI()

export const appearanceKeys = {
  all: ['appearance'] as const,
  me: () => [...appearanceKeys.all, 'me'] as const,
}
