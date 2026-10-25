import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { TAnonymousActions, TAnonymousState } from '@typings/anonymous'

export type AnonymousStore = TAnonymousState & TAnonymousActions

const initialAnonymousValues: TAnonymousState = { anonymousID: '' }

export const useAnonymousStore = create<AnonymousStore>()(
  persist(
    (set) => ({
      ...initialAnonymousValues,
      createAnonymousID: () => {
        const anonymousID = crypto.randomUUID()
        set(() => ({ anonymousID }))
        return anonymousID
      },
      clearAnonymousID: () => set(() => initialAnonymousValues),
    }),
    {
      name: 'anonymous-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ anonymousID: state.anonymousID }),
      skipHydration: false,
    }
  )
)
