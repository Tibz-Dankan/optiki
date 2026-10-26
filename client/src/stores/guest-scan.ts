import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { TGuestScanActions, TGuestScanState } from '@typings/guest-scan'

export type GuestScanStore = TGuestScanState & TGuestScanActions

const initialGuestScanValues: TGuestScanState = { scans: [] }

export const useGuestScanStore = create<GuestScanStore>()(
  persist(
    (set) => ({
      ...initialGuestScanValues,
      addScan: (scan) =>
        set((state) => ({
          scans: [scan, ...state.scans.filter((saved) => saved.id !== scan.id)],
        })),
      clearScans: () => set(() => initialGuestScanValues),
    }),
    {
      name: 'guest-scan-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ scans: state.scans }),
      skipHydration: false,
    }
  )
)
