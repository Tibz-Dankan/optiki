import type { TServerResponseStatus } from './server-response'

export type TUserRole = 'USER'

// Kept in lockstep with the server's generatedVia column — see server/internal/models/schema.go.
export type TGeneratedVia = 'SIGN_UP' | 'SIGN_IN' | 'RESET_PASSWORD'

export type TUser = {
  id: string
  name: string
  email: string
  role: TUserRole
  emailVerified: boolean
  emailVerifiedAt: string | null
  profileBgColor: string
  createdAt: string
  updatedAt: string
}

export type TSession = {
  userID: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
}

export type TAuth = {
  user: TUser
  session: TSession
}

export type TAuthState = {
  auth: TAuth
}

export type TAuthActions = {
  updateAuth: (auth: TAuth) => void
  updateSession: (session: TSession) => void
  updateUser: (user: TUser) => void
  clearAuth: () => void
}

export type TPagination = {
  limit: number
  nextCursor: string
  hasNextItems: boolean
  count: number
}

export type TAuthResponse = TServerResponseStatus & {
  session: TSession
  redirectToPath: string
}

export type TGetMeResponse = TServerResponseStatus & {
  user: TUser
  session: TSession
}

export type TSignInInput = {
  email: string
  password: string
}

export type TSignUpInput = {
  name: string
  email: string
  password: string
  confirmPassword?: string
}

export type TForgotPassword = {
  email: string
}

export type TVerifyOTP = {
  email: string
  otp: string
}

export type TResetPassword = {
  email: string
  otp: string
  password: string
  confirmPassword?: string
}

export type TVerifyEmailInput = {
  token: string
}

export type TVerifyEmailResponse = TServerResponseStatus & {
  alreadyVerified: boolean
}

export type TChangeEmailInput = {
  email: string
}

export type TUserResponse = TServerResponseStatus & {
  data: TUser
}

export type TUpdateUserInput = {
  userID: string
  name: string
}

export type TChangePassword = {
  userID: string
  currentPassword: string
  newPassword: string
}

export type TActiveSession = {
  id: string
  generatedVia: TGeneratedVia
  userAgent: string
  ip: string
  createdAt: string
  lastUsedAt: string
  refreshTokenExpiresAt: string
  isCurrentSession: boolean
}

export type TActiveSessionResponse = TServerResponseStatus & {
  data: TActiveSession[]
  pagination: TPagination
}

export type TRevokeSessionInput = {
  sessionID: string
}

export type TRevokeSessionResponse = TServerResponseStatus & {
  data: {
    id: string
    isCurrentSession: boolean
  }
}

export type TReconcileAnonymousUserInput = {
  userID: string
  anonymousID: string
}

export type TReconcileAnonymousUserResponse = TServerResponseStatus & {
  data: {
    anonymousID: string
    userID: string
    linkedVisits: number
  }
}
