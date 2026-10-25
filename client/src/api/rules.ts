import { SERVER_URL } from '@constants/urls'
import type { TRuleResponse, TRulesResponse } from '@typings/rules'
import { throwOnError } from './http-error'

class RulesAPI {
  getAll = async (): Promise<TRulesResponse> => {
    const response = await fetch(`${SERVER_URL}/rules?set=FULL`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  getOne = async (id: string): Promise<TRuleResponse> => {
    const response = await fetch(`${SERVER_URL}/rules/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }
}

export const rulesAPI = new RulesAPI()

export const rulesKeys = {
  all: ['rules'] as const,
  list: () => [...rulesKeys.all, 'list'] as const,
  detail: (id: string) => [...rulesKeys.all, 'detail', id] as const,
}
