import { SERVER_URL } from '@constants/urls'
import type {
  TActiveSessionResponse,
  TAuthResponse,
  TChangeEmailInput,
  TChangePassword,
  TForgotPassword,
  TGetMeResponse,
  TReconcileAnonymousUserInput,
  TReconcileAnonymousUserResponse,
  TResetPassword,
  TRevokeSessionInput,
  TRevokeSessionResponse,
  TSignInInput,
  TSignUpInput,
  TUpdateUserInput,
  TUserResponse,
  TVerifyEmailInput,
  TVerifyEmailResponse,
  TVerifyOTP,
} from '@typings/auth'
import type { TServerResponseStatus } from '@typings/server-response'
import { throwOnError } from './http-error'

class AuthAPI {
  signIn = async ({
    email,
    password,
  }: TSignInInput): Promise<TAuthResponse> => {
    const response = await fetch(`${SERVER_URL}/auth/signin`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return (await throwOnError(response)).json()
  }

  signUp = async ({
    name,
    email,
    password,
  }: TSignUpInput): Promise<TAuthResponse> => {
    const response = await fetch(`${SERVER_URL}/auth/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    return (await throwOnError(response)).json()
  }

  signOut = async (): Promise<TServerResponseStatus> => {
    const response = await fetch(`${SERVER_URL}/auth/signout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  signOutAllDevices = async (): Promise<TServerResponseStatus> => {
    const response = await fetch(`${SERVER_URL}/auth/signout-all`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  getActiveSessions = async (
    limit: number,
    cursor: string
  ): Promise<TActiveSessionResponse> => {
    const response = await fetch(
      `${SERVER_URL}/auth/user/session?limit=${limit}&cursor=${cursor}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
      }
    )
    return (await throwOnError(response)).json()
  }

  revokeSession = async ({
    sessionID,
  }: TRevokeSessionInput): Promise<TRevokeSessionResponse> => {
    const response = await fetch(
      `${SERVER_URL}/auth/user/session/${sessionID}/revoke`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
      }
    )
    return (await throwOnError(response)).json()
  }

  refreshSession = async (): Promise<TAuthResponse> => {
    const response = await fetch(`${SERVER_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  getMe = async (): Promise<TGetMeResponse> => {
    const response = await fetch(`${SERVER_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  forgotPassword = async ({
    email,
  }: TForgotPassword): Promise<TServerResponseStatus> => {
    const response = await fetch(`${SERVER_URL}/auth/forgot-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return (await throwOnError(response)).json()
  }

  verifyOTP = async ({
    email,
    otp,
  }: TVerifyOTP): Promise<TServerResponseStatus> => {
    const response = await fetch(`${SERVER_URL}/auth/verify-otp`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    })
    return (await throwOnError(response)).json()
  }

  resetPassword = async ({
    email,
    otp,
    password,
  }: TResetPassword): Promise<TAuthResponse> => {
    const response = await fetch(
      `${SERVER_URL}/auth/reset-password/${encodeURIComponent(otp)}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }
    )
    return (await throwOnError(response)).json()
  }

  initiateEmailVerification = async (): Promise<TServerResponseStatus> => {
    const response = await fetch(`${SERVER_URL}/auth/verify-email/initiate`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
    })
    return (await throwOnError(response)).json()
  }

  verifyEmail = async ({
    token,
  }: TVerifyEmailInput): Promise<TVerifyEmailResponse> => {
    const response = await fetch(`${SERVER_URL}/auth/verify-email`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    return (await throwOnError(response)).json()
  }

  changeEmail = async ({
    email,
  }: TChangeEmailInput): Promise<TUserResponse> => {
    const response = await fetch(`${SERVER_URL}/auth/user/change-email`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return (await throwOnError(response)).json()
  }

  changePassword = async ({
    userID,
    currentPassword,
    newPassword,
  }: TChangePassword): Promise<TServerResponseStatus> => {
    const response = await fetch(
      `${SERVER_URL}/auth/user/${userID}/change-password`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    )
    return (await throwOnError(response)).json()
  }

  updateUser = async ({
    userID,
    name,
  }: TUpdateUserInput): Promise<TUserResponse> => {
    const response = await fetch(`${SERVER_URL}/auth/user/${userID}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    return (await throwOnError(response)).json()
  }

  reconcileAnonymousUser = async ({
    userID,
    anonymousID,
  }: TReconcileAnonymousUserInput): Promise<TReconcileAnonymousUserResponse> => {
    const response = await fetch(
      `${SERVER_URL}/auth/user/${userID}/anony-reconcile`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ anonymousID }),
      }
    )
    return (await throwOnError(response)).json()
  }
}

export const authAPI = new AuthAPI()

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  sessions: () => [...authKeys.all, 'sessions'] as const,
}
