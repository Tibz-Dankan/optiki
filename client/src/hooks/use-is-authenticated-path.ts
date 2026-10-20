export const useIsAuthenticatedPath = () => {
  const { pathname } = window.location
  const isAuthenticatedPath = pathname.startsWith('/u/')

  return { isAuthenticatedPath }
}
