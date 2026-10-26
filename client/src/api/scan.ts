import { SERVER_URL } from '@constants/urls'
import type {
  TCreateFixReportResponse,
  TCreateScanInput,
  TDeleteScanResponse,
  TFixReportResponse,
  TMultiplePageScanListResponse,
  TMultiplePageScanResponse,
  TMultiplePageScanSummaryResponse,
  TScanListFilters,
  TScanListResponse,
  TScanReportResponse,
  TScanSummaryResponse,
  TUpdateScanInput,
} from '@typings/scan'
import { throwOnError } from './http-error'

class ScanAPI {
  create = async (input: TCreateScanInput): Promise<TScanReportResponse> => {
    const response = await fetch(`${SERVER_URL}/scan`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(input),
    })
    return (await throwOnError(response)).json()
  }

  createMultiplePage = async (
    input: Omit<TCreateScanInput, 'multiplePageScan' | 'anonymousID'>
  ): Promise<TMultiplePageScanSummaryResponse> => {
    const response = await fetch(`${SERVER_URL}/scan`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ ...input, multiplePageScan: true }),
    })
    return (await throwOnError(response)).json()
  }

  getAll = async (
    limit: number,
    cursor: string,
    filters: TScanListFilters
  ): Promise<TScanListResponse> => {
    const query = new URLSearchParams({ limit: String(limit), cursor })
    for (const [key, value] of Object.entries(filters)) {
      if (value) query.set(key, value)
    }
    const response = await fetch(`${SERVER_URL}/scan?${query}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  getOne = async (id: string): Promise<TScanReportResponse> => {
    const response = await fetch(`${SERVER_URL}/scan/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  update = async ({
    id,
    title,
    visibility,
  }: TUpdateScanInput): Promise<TScanSummaryResponse> => {
    const response = await fetch(`${SERVER_URL}/scan/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ title, visibility }),
    })
    return (await throwOnError(response)).json()
  }

  delete = async ({ id }: { id: string }): Promise<TDeleteScanResponse> => {
    const response = await fetch(`${SERVER_URL}/scan/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  getAllMultiplePage = async (
    limit: number,
    cursor: string
  ): Promise<TMultiplePageScanListResponse> => {
    const query = new URLSearchParams({ limit: String(limit), cursor })
    const response = await fetch(`${SERVER_URL}/scan/multiple?${query}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  getOneMultiplePage = async (
    id: string
  ): Promise<TMultiplePageScanResponse> => {
    const response = await fetch(`${SERVER_URL}/scan/multiple/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  deleteMultiplePage = async ({
    id,
  }: {
    id: string
  }): Promise<TDeleteScanResponse> => {
    const response = await fetch(`${SERVER_URL}/scan/multiple/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  getFixReport = async (id: string): Promise<TFixReportResponse> => {
    const response = await fetch(`${SERVER_URL}/scan/${id}/fix-report`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  createFixReport = async ({
    id,
  }: {
    id: string
  }): Promise<TCreateFixReportResponse> => {
    const response = await fetch(`${SERVER_URL}/scan/${id}/fix-report`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  getMultiplePageFixReport = async (
    id: string
  ): Promise<TFixReportResponse> => {
    const response = await fetch(
      `${SERVER_URL}/scan/multiple/${id}/fix-report`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
      }
    )
    return (await throwOnError(response)).json()
  }

  createMultiplePageFixReport = async ({
    id,
  }: {
    id: string
  }): Promise<TCreateFixReportResponse> => {
    const response = await fetch(
      `${SERVER_URL}/scan/multiple/${id}/fix-report`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
      }
    )
    return (await throwOnError(response)).json()
  }
}

export const scanAPI = new ScanAPI()

export const scanKeys = {
  all: ['scan'] as const,
  list: (filters: TScanListFilters) =>
    [...scanKeys.all, 'list', filters] as const,
  detail: (id: string) => [...scanKeys.all, 'detail', id] as const,
  multipleList: () => [...scanKeys.all, 'multiple', 'list'] as const,
  multipleDetail: (id: string) =>
    [...scanKeys.all, 'multiple', 'detail', id] as const,
  fixReport: (id: string) => [...scanKeys.all, 'fix-report', id] as const,
  multipleFixReport: (id: string) =>
    [...scanKeys.all, 'multiple', 'fix-report', id] as const,
}
