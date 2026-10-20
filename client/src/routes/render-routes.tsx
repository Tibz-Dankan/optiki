import { Route } from 'react-router-dom'
import type { TNavGroup, TPage, TRoute } from '@typings/routes'

export const renderRoutes = (pages: TPage[]): React.ReactElement[] =>
  pages.flatMap((page, index) => {
    const key = `${page.path}-${index}`

    if (page.children?.length) {
      const childRoutes = renderRoutes(page.children)

      if (!page.element) return childRoutes

      return [
        <Route key={key} path={page.path} element={page.element}>
          {childRoutes}
        </Route>,
      ]
    }

    if (!page.element) return []

    return [<Route key={key} path={page.path} element={page.element} />]
  })

export const flattenGroups = (groups: TNavGroup[]): TPage[] =>
  groups.flatMap((group) => group.pages)

export const routeToPages = (route: TRoute): TPage[] =>
  flattenGroups(route.groups)
