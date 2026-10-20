import type { TServerResponseStatus } from './server-response'

// Kept in lockstep with the server's theme column — see server/internal/pkg/validateTheme.go.
export type TTheme = 'light' | 'dark' | 'system'

export type TAppearance = {
  id: string
  userID: string
  theme: TTheme
  createdAt: string
  updatedAt: string
}

export type TAppearanceState = {
  appearance: TAppearance
}

export type TAppearanceActions = {
  updateAppearance: (appearance: TAppearance) => void
  clearAppearance: () => void
}

export type TCreateAppearanceInput = {
  theme: TTheme
}

export type TUpdateAppearanceInput = {
  id: string
  theme: TTheme
}

export type TAppearanceResponse = TServerResponseStatus & {
  data: TAppearance
}
