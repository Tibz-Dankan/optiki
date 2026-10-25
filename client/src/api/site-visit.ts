import { SERVER_URL } from '@constants/urls'
import type { TServerResponseStatus } from '@typings/server-response'
import type { TPostSiteVisit } from '@typings/site-visit'
import { throwOnError } from './http-error'

class SiteVisitAPI {
  post = async ({
    path,
    capturedAt,
    anonymousID,
    device,
  }: TPostSiteVisit): Promise<TServerResponseStatus> => {
    const response = await fetch(`${SERVER_URL}/sitevisit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ path, capturedAt, anonymousID, device }),
    })
    return (await throwOnError(response)).json()
  }
}

export const siteVisitAPI = new SiteVisitAPI()
