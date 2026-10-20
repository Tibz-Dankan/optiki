import { Routes } from 'react-router-dom'
import { AuthenticatedLayout } from '@modules/shared/layout/authenticated-layout'
import { renderRoutes, routeToPages } from './render-routes'
import { userRoutes } from './user-routes'

export const RenderUserRoutes: React.FC = () => {
  return (
    <AuthenticatedLayout routes={userRoutes}>
      <Routes>{renderRoutes(routeToPages(userRoutes))}</Routes>
    </AuthenticatedLayout>
  )
}
