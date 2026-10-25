import {
  KeyRound,
  LayoutDashboard,
  ScanSearch,
  Settings,
  UserCog,
  Wrench,
} from 'lucide-react'
import type { TRoute } from '@typings/routes'
import { NotFoundError } from '@shared/pages/not-found-error'
import { APITokens } from '@modules/api-token/pages/api-tokens'
import { Dashboard } from '@modules/dashboard/pages/dashboard'
import { Scans } from '@modules/scan/pages/scans'
import { SettingsAccount } from '@modules/settings/pages/account'
import { SettingsGeneral } from '@modules/settings/pages/general'

export const userRoutes: TRoute = {
  title: 'Dashboard',
  homePath: '/u/dashboard',
  groups: [
    {
      title: 'General',
      pages: [
        {
          title: 'Dashboard',
          path: '/u/dashboard',
          icon: LayoutDashboard,
          showInSidebar: true,
          element: <Dashboard />,
        },
        {
          title: 'Scans',
          path: '/u/scans',
          icon: ScanSearch,
          showInSidebar: true,
          element: <Scans />,
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
