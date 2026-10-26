import { Navigate } from 'react-router-dom'
import {
  History,
  KeyRound,
  ScanSearch,
  Settings,
  UserCog,
  Wrench,
} from 'lucide-react'
import type { TRoute } from '@typings/routes'
import { NotFoundError } from '@shared/pages/not-found-error'
import { APITokens } from '@modules/api-token/pages/api-tokens'
import { Scans } from '@modules/scan/pages/scans'
import { UserScan } from '@modules/scan/pages/user-scan'
import { UserScanReport } from '@modules/scan/pages/user-scan-report'
import { SettingsAccount } from '@modules/settings/pages/account'
import { SettingsGeneral } from '@modules/settings/pages/general'

export const userRoutes: TRoute = {
  title: 'Scan',
  homePath: '/u/scan',
  groups: [
    {
      title: 'General',
      pages: [
        {
          title: 'Scan',
          path: '/u/scan',
          icon: ScanSearch,
          showInSidebar: true,
          element: <UserScan />,
        },
        {
          title: 'Scans',
          path: '/u/scans',
          icon: History,
          showInSidebar: true,
          element: <Scans />,
        },
        {
          title: 'Scan report',
          path: '/u/scans/:id',
          showInSidebar: false,
          element: <UserScanReport />,
        },
        {
          title: 'Scan',
          path: '/u/home',
          showInSidebar: false,
          element: <Navigate to='/u/scan' replace />,
        },
        {
          title: 'Scan',
          path: '/u/dashboard',
          showInSidebar: false,
          element: <Navigate to='/u/scan' replace />,
        },
      ],
    },
    {
      title: 'Other',
      pages: [
        {
          title: 'Settings',
          icon: Settings,
          path: '/u/settings',
          showInSidebar: true,
          children: [
            {
              title: 'General',
              path: '/u/settings',
              icon: UserCog,
              showInSidebar: true,
              element: <SettingsGeneral />,
            },
            {
              title: 'Account',
              path: '/u/settings/account',
              icon: Wrench,
              showInSidebar: true,
              element: <SettingsAccount />,
            },
            {
              title: 'API tokens',
              path: '/u/settings/api-tokens',
              icon: KeyRound,
              showInSidebar: true,
              element: <APITokens />,
            },
          ],
        },
        {
          title: 'Page Not Found',
          path: '*',
          showInSidebar: false,
          element: <NotFoundError />,
        },
      ],
    },
  ],
}
