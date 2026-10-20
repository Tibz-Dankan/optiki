import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  TAppearance,
  TAppearanceActions,
  TAppearanceState,
} from '@typings/appearance'

export type AppearanceStore = TAppearanceState & TAppearanceActions

const initialAppearanceValues: TAppearance = {
  id: '',
  userID: '',
  theme: 'system',
  createdAt: '',
  updatedAt: '',
}

export const defaultInitState: TAppearanceState = {
  appearance: initialAppearanceValues,
}

export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set) => ({
      appearance: initialAppearanceValues,
      updateAppearance: (appearance) => set(() => ({ appearance })),
      clearAppearance: () =>
        set(() => ({ appearance: initialAppearanceValues })),
    }),
    {
      name: 'appearance-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ appearance: state.appearance }),
      skipHydration: false,
    }
  )
)
