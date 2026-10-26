import type { TRecentScan } from '@typings/scan'

export type TGuestScanState = {
  scans: TRecentScan[]
}

export type TGuestScanActions = {
  addScan: (scan: TRecentScan) => void
  clearScans: () => void
}
