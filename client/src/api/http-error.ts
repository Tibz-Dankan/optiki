import type { TServerErrorName } from '@typings/server-response'

export class HttpError extends Error {
  readonly status: number
  readonly error: TServerErrorName

  constructor(status: number, message: string, error: TServerErrorName) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.error = error
  }
}

export const isHttpError = (error: unknown): error is HttpError =>
  error instanceof HttpError

const fallbackErrorName = (status: number): TServerErrorName => {
  if (status >= 500) return 'SERVER_ERROR'
  if (status >= 400) return 'CLIENT_ERROR'
  return 'UNKNOWN_ERROR'
}

export const throwOnError = async (response: Response): Promise<Response> => {
  if (response.ok) return response

  const body = await response.json().catch(() => null)
  const message =
    typeof body?.message === 'string' && body.message
      ? body.message
      : response.statusText || 'Something went wrong!'
  const error: TServerErrorName =
    typeof body?.error === 'string' && body.error
      ? body.error
      : fallbackErrorName(response.status)

  throw new HttpError(response.status, message, error)
}
