import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { TAuth, TAuthActions, TAuthState } from '@typings/auth'

export type AuthStore = TAuthState & TAuthActions

const initialAuthValues: TAuth = {
  user: {
    id: '',
    name: '',
    email: '',
    role: 'USER',
    emailVerified: false,
    emailVerifiedAt: null,
    profileBgColor: '',
    createdAt: '',
    updatedAt: '',
  },
  session: {
    userID: '',
    accessTokenExpiresAt: '',
    refreshTokenExpiresAt: '',
  },
}

export const defaultInitState: TAuthState = { auth: initialAuthValues }

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      auth: initialAuthValues,
      updateAuth: (auth) => set(() => ({ auth })),
      updateSession: (session) =>
        set((state) => ({ auth: { ...state.auth, session } })),
      updateUser: (user) => set((state) => ({ auth: { ...state.auth, user } })),
      clearAuth: () => set(() => ({ auth: initialAuthValues })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ auth: state.auth }),
      skipHydration: false,
    }
  )
)
