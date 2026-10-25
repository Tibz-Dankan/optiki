import { SERVER_URL } from '@constants/urls'
import type {
  TAPITokenListResponse,
  TAPITokenPermissionsResponse,
  TAPITokenResponse,
  TCreateAPITokenInput,
  TCreateAPITokenResponse,
  TDeleteAPITokenResponse,
  TUpdateAPITokenInput,
} from '@typings/api-token'
import { throwOnError } from './http-error'

class APITokenAPI {
  create = async ({
    name,
    permissions,
    expiresAt,
  }: TCreateAPITokenInput): Promise<TCreateAPITokenResponse> => {
    const response = await fetch(`${SERVER_URL}/apitoken`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ name, permissions, expiresAt }),
    })
    return (await throwOnError(response)).json()
  }

  getAll = async (
    limit: number,
    cursor: string
  ): Promise<TAPITokenListResponse> => {
    const response = await fetch(
      `${SERVER_URL}/apitoken?limit=${limit}&cursor=${cursor}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
      }
    )
    return (await throwOnError(response)).json()
  }

  getPermissions = async (): Promise<TAPITokenPermissionsResponse> => {
    const response = await fetch(`${SERVER_URL}/apitoken/permissions`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  update = async ({
    id,
    name,
    permissions,
  }: TUpdateAPITokenInput): Promise<TAPITokenResponse> => {
    const response = await fetch(`${SERVER_URL}/apitoken/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ name, permissions }),
    })
    return (await throwOnError(response)).json()
  }

  revoke = async ({ id }: { id: string }): Promise<TAPITokenResponse> => {
    const response = await fetch(`${SERVER_URL}/apitoken/${id}/revoke`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  delete = async ({ id }: { id: string }): Promise<TDeleteAPITokenResponse> => {
    const response = await fetch(`${SERVER_URL}/apitoken/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }
}

export const apiTokenAPI = new APITokenAPI()

export const apiTokenKeys = {
  all: ['api-token'] as const,
  list: () => [...apiTokenKeys.all, 'list'] as const,
  permissions: () => [...apiTokenKeys.all, 'permissions'] as const,
}
